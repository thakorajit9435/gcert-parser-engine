import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    FlatList,
    Platform,
    useWindowDimensions
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { StatCard } from '../../components/admin/StatCard';
import { getCollectionCount } from '../../services/firebase/content.service';

interface ProcessingJob {
    id: string;
    filename: string;
    status: 'queued' | 'segmenting' | 'ocr' | 'hierarchy' | 'features' | 'importing' | 'success' | 'failed' | 'processing';
    progress: number;
    pages: number;
    failedPages: number[];
    timestamp: string;
    standard_number?: number;
    subject_id?: string;
    session?: string;
}

interface SubjectOption {
    id: string;
    name: string;
    nameGu: string;
    standardId: string;
}

interface SessionOption {
    id: string;
    session: string;
    title: string;
    standardId: string;
}

const sanitizeApiUrl = (rawUrl: string): string => {
    let clean = (rawUrl || '').trim();
    if (!clean) return '';
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `http://${clean}`;
    }
    return clean.replace(/\/+$/, '');
};

export function AdminPdfProcessingDashboard(): React.JSX.Element {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [activeTab, setActiveTab] = useState<'queue' | 'preview' | 'logs'>('queue');
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadType, setUploadType] = useState<'pdf' | 'zip'>('pdf');

    // Subject selection state (Firestore-backed)
    const [standardNum, setStandardNum] = useState('1');
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null);
    const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
    const [standardPickerVisible, setStandardPickerVisible] = useState(false);

    // Session selection state (Firestore-backed)
    const [sessions, setSessions] = useState<SessionOption[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);
    const [sessionPickerVisible, setSessionPickerVisible] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    // API Server Config Configurable
    const [apiBaseUrl, setApiBaseUrl] = useState(
        Platform.OS === 'android' ? 'http://10.41.87.148:8000' : 'http://localhost:8000'
    );
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [connectionErrorMsg, setConnectionErrorMsg] = useState<string | null>(null);

    // KPI Stats State (Dynamic)
    const [stats, setStats] = useState({
        totalPDFs: 0,
        totalPages: 0,
        topicsExtracted: 0,
        questionsExtracted: 0,
        mcqsExtracted: 0,
        firestoreDocs: 0,
        storageUsed: '0 MB',
        errors: 0
    });

    // Queue Job List State
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);

    // Logs State
    const [logs, setLogs] = useState<string[]>([
        '[System] Dashboard initialized. API Base URL set to: ' + apiBaseUrl
    ]);

    // Live Payload Preview State
    const [selectedPreviewPayload, setSelectedPreviewPayload] = useState<any>(null);

    // Fetch dynamic overview stats from Firestore & Backend API
    const fetchOverviewStats = async (targetUrl?: string) => {
        const formattedUrl = sanitizeApiUrl(targetUrl || apiBaseUrl);
        if (!formattedUrl) return;

        setConnectionStatus('checking');

        let fsStats = {
            topicsCount: 0,
            mcqsCount: 0,
            questionsCount: 0,
            chaptersCount: 0,
        };

        try {
            const [topics, mcqs, questions, chapters] = await Promise.all([
                getCollectionCount('topics'),
                getCollectionCount('mcqs'),
                getCollectionCount('questions'),
                getCollectionCount('chapters'),
            ]);
            fsStats = {
                topicsCount: topics,
                mcqsCount: mcqs,
                questionsCount: questions,
                chaptersCount: chapters,
            };
        } catch (fsErr) {
            console.log('Firestore overview count error:', fsErr);
        }

        try {
            const response = await fetch(`${formattedUrl}/api/v1/parser/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats({
                    totalPDFs: Math.max(fsStats.chaptersCount, data.total_pdfs || 0),
                    totalPages: data.total_pages || 0,
                    topicsExtracted: Math.max(fsStats.topicsCount, data.topics_extracted || 0),
                    questionsExtracted: Math.max(fsStats.questionsCount, data.questions_extracted || 0),
                    mcqsExtracted: Math.max(fsStats.mcqsCount, data.mcqs_extracted || 0),
                    firestoreDocs: data.firestore_docs || 0,
                    storageUsed: '412 MB',
                    errors: data.errors || 0
                });
                setConnectionStatus('connected');
                setConnectionErrorMsg(null);
            } else {
                setConnectionStatus('error');
                setConnectionErrorMsg(`Server returned HTTP ${response.status}`);
            }
        } catch (e: any) {
            const errStr = e?.message || 'Network request failed';
            console.log('Backend stats fetch error:', errStr);
            setConnectionStatus('error');
            setConnectionErrorMsg(errStr);

            setStats(prev => ({
                ...prev,
                totalPDFs: fsStats.chaptersCount || prev.totalPDFs,
                topicsExtracted: fsStats.topicsCount || prev.topicsExtracted,
                mcqsExtracted: fsStats.mcqsCount || prev.mcqsExtracted,
                questionsExtracted: fsStats.questionsCount || prev.questionsExtracted,
            }));
        }
    };

    // Fetch existing jobs from backend
    const fetchJobs = async (targetUrl?: string) => {
        const formattedUrl = sanitizeApiUrl(targetUrl || apiBaseUrl);
        if (!formattedUrl) return;
        try {
            const response = await fetch(`${formattedUrl}/api/v1/parser/jobs`);
            if (!response.ok) return;
            const data = await response.json();

            // Deduplicate by job ID to prevent duplicate listings
            const uniqueJobs = data.filter((job: any, index: number, self: any[]) =>
                self.findIndex((j: any) => j.id === job.id) === index
            );
            setJobs(uniqueJobs);
        } catch (e) {
            console.log('Failed to fetch jobs list from backend:', e);
        }
    };

    // Load jobs & stats on mount or when apiBaseUrl changes
    useEffect(() => {
        fetchOverviewStats();
        fetchJobs();
    }, [apiBaseUrl]);

    // Fetch Job Status Polling
    useEffect(() => {
        const interval = setInterval(() => {
            const activeJobs = jobs.filter(j => j.status !== 'success' && j.status !== 'failed');
            if (activeJobs.length === 0) return;

            const formattedUrl = sanitizeApiUrl(apiBaseUrl);
            activeJobs.forEach(async (job) => {
                try {
                    const response = await fetch(`${formattedUrl}/api/v1/parser/status/${job.id}`);
                    if (!response.ok) return;
                    const data = await response.json();

                    setJobs(prevJobs => prevJobs.map(j => {
                        if (j.id === job.id) {
                            const newStatus = data.status === 'success' || data.status == 'completed' ? 'success' : data.status;
                            return {
                                ...j,
                                status: newStatus,
                                progress: data.progress_percentage
                            };
                        }
                        return j;
                    }));

                    if (data.status === 'success' || data.status === 'completed') {
                        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SUCCESS] Job #${job.id} completed. Pulling metadata...`]);
                        fetchOverviewStats();
                        fetchJobs();
                    }
                } catch (e: any) {
                    console.log('Failed to poll status for job', job.id, e);
                }
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [jobs, apiBaseUrl]);

    // Load Subjects from Firestore when standardNum changes
    useEffect(() => {
        if (!standardNum) return;
        setSubjectsLoading(true);
        setSelectedSubject(null);
        const unsubscribe = firestore()
            .collection('subjects')
            .where('standardId', '==', standardNum)
            .where('isDeleted', '==', false)
            .onSnapshot(
                snapshot => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || '',
                        nameGu: doc.data().nameGu || '',
                        standardId: doc.data().standardId || standardNum,
                    })) as SubjectOption[];
                    data.sort((a, b) => a.name.localeCompare(b.name));
                    setSubjects(data);
                    setSubjectsLoading(false);
                },
                err => {
                    console.error('Subjects load error:', err);
                    setSubjectsLoading(false);
                }
            );
        return unsubscribe;
    }, [standardNum]);

    // Load Sessions from Firestore when standardNum changes
    useEffect(() => {
        if (!standardNum) return;
        setSessionsLoading(true);
        setSelectedSession(null);
        const unsubscribe = firestore()
            .collection('sessions')
            .where('standardId', '==', standardNum)
            .where('isDeleted', '==', false)
            .onSnapshot(
                snapshot => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        session: doc.data().session || '1',
                        title: doc.data().title || `Semester ${doc.data().session || '1'}`,
                        standardId: doc.data().standardId || standardNum,
                    })) as SessionOption[];
                    data.sort((a, b) => a.title.localeCompare(b.title));
                    setSessions(data);
                    setSessionsLoading(false);
                },
                err => {
                    console.error('Sessions load error:', err);
                    setSessionsLoading(false);
                }
            );
        return unsubscribe;
    }, [standardNum]);


    // Handle PDF File Pick and Upload
    const handlePickAndUpload = async () => {
        if (!selectedSubject || !standardNum || !selectedSession) {
            Alert.alert('Error', 'Please select a Standard, a Subject, and a Session before uploading.');
            return;
        }

        try {
            const res = await DocumentPicker.pickSingle({
                type: uploadType === 'pdf' ? [DocumentPicker.types.pdf] : [DocumentPicker.types.zip],
            });

            setIsUploading(true);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Starting file upload for: ${res.name}`]);

            const safeFileName = uploadType === 'pdf' ? 'document.pdf' : 'package.zip';

            const formData = new FormData();
            formData.append('file', {
                uri: res.uri,
                name: safeFileName,
                type: res.type || (uploadType === 'pdf' ? 'application/pdf' : 'application/zip'),
            } as any);
            formData.append('subject_id', selectedSubject.id);
            formData.append('standard_id', selectedSubject.standardId);
            formData.append('standard_number', parseInt(standardNum) as any);
            formData.append('session', selectedSession.session);

            const formattedUrl = sanitizeApiUrl(apiBaseUrl);
            const response = await fetch(`${formattedUrl}/api/v1/parser/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Upload failed with status ' + response.status }));
                throw new Error(errData.detail || errData.message || 'Upload failed');
            }

            const data = await response.json();
            setIsUploading(false);
            setUploadModalVisible(false);

            const newJob: ProcessingJob = {
                id: data.job_id,
                filename: res.name || 'document.pdf',
                status: 'queued',
                progress: 0,
                pages: 20,
                failedPages: [],
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };

            setJobs(prevJobs => [newJob, ...prevJobs.filter(j => j.id !== newJob.id)]);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Job #${data.job_id} queued successfully.`]);
            fetchOverviewStats();
            Alert.alert('Success', 'PDF processing job queued successfully.');

        } catch (e: any) {
            setIsUploading(false);
            const errorMsg = e?.message || (typeof e === 'string' ? e : 'An error occurred during file upload.');
            if (e && DocumentPicker.isCancel(e)) {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] User cancelled file selection.`]);
            } else {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Upload failed: ${errorMsg}`]);
                Alert.alert('Upload Error', errorMsg);
            }
        }
    };

    // Load JSON Preview
    const handleLoadPreview = async (jobId: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Fetching Firestore schema preview for Job #${jobId}`]);
        try {
            const formattedUrl = sanitizeApiUrl(apiBaseUrl);
            const response = await fetch(`${formattedUrl}/api/v1/parser/jobs/${jobId}/preview`);
            if (!response.ok) {
                throw new Error('Preview not ready yet. Please wait for completion.');
            }
            const data = await response.json();
            setSelectedPreviewPayload(data);
            setActiveTab('preview');
        } catch (e: any) {
            const errorMsg = e?.message || (typeof e === 'string' ? e : 'Preview not ready yet.');
            Alert.alert('Preview Not Ready', errorMsg);
        }
    };

    // Handle Rollback Action
    const handleRollback = (jobId: string) => {
        Alert.alert(
            'Confirm Rollback',
            'Are you sure you want to rollback this import? This will delete all created Firestore documents associated with this parsing run.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Rollback',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [WARN] Initiating rollback for Job #${jobId}`]);
                            const formattedUrl = sanitizeApiUrl(apiBaseUrl);
                            const response = await fetch(`${formattedUrl}/api/v1/parser/jobs/${jobId}/rollback`, {
                                method: 'POST'
                            });
                            const data = await response.json().catch(() => ({ deleted_count: 0 }));
                            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [WARN] Rollback completed. Deleted ${data.deleted_count || 0} documents.`]);
                            Alert.alert('Rollback Successful', `Successfully deleted ${data.deleted_count || 0} documents from Firestore.`);
                            setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
                            fetchOverviewStats();
                        } catch (e: any) {
                            const errorMsg = e?.message || (typeof e === 'string' ? e : 'Rollback failed.');
                            Alert.alert('Rollback Failed', errorMsg);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* API Settings Section */}
            <View style={styles.apiSettings}>
                <View style={styles.apiHeaderRow}>
                    <Text style={styles.apiLabel}>Backend API Endpoint:</Text>
                    <View style={styles.statusBadgeContainer}>
                        {connectionStatus === 'checking' && (
                            <View style={styles.badgeWrap}>
                                <ActivityIndicator size="small" color={adminColors.primary} style={{ marginRight: 4 }} />
                                <Text style={[styles.connectionBadge, styles.badgeChecking]}>Checking...</Text>
                            </View>
                        )}
                        {connectionStatus === 'connected' && (
                            <Text style={[styles.connectionBadge, styles.badgeConnected]}>🟢 Connected</Text>
                        )}
                        {connectionStatus === 'error' && (
                            <Text style={[styles.connectionBadge, styles.badgeError]}>🔴 Network Error</Text>
                        )}
                    </View>
                </View>

                <View style={styles.apiInputRow}>
                    <TextInput
                        style={styles.apiInput}
                        value={apiBaseUrl}
                        onChangeText={setApiBaseUrl}
                        placeholder="e.g. http://192.168.1.10:8000 or http://localhost:8000"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.testButton} onPress={() => { fetchOverviewStats(); fetchJobs(); }}>
                        <Text style={styles.testButtonText}>⚡ Test & Refresh</Text>
                    </TouchableOpacity>
                </View>

                {connectionErrorMsg && (
                    <Text style={styles.apiErrorSubtext}>
                        ⚠️ Network Error: {connectionErrorMsg}. Ensure Python backend is running (`uvicorn src.main:app --host 0.0.0.0 --port 8000`) and device is on the same network.
                    </Text>
                )}
            </View>

            {/* KPI Section */}
            <Text style={styles.sectionTitle}>📈 PDF Processing Overview</Text>
            <View style={[styles.statsGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                <View style={[styles.statItem, { width: isTablet ? '25%' : '50%' }]}>
                    <StatCard title="Total PDFs" value={stats.totalPDFs.toString()} icon="📄" color={adminColors.primary} />
                </View>
                <View style={[styles.statItem, { width: isTablet ? '25%' : '50%' }]}>
                    <StatCard title="Total Pages" value={stats.totalPages.toString()} icon="📖" color={adminColors.accentPink} />
                </View>
                <View style={[styles.statItem, { width: isTablet ? '25%' : '50%' }]}>
                    <StatCard title="Topics Extracted" value={stats.topicsExtracted.toString()} icon="🧩" color={adminColors.accentGreen} />
                </View>
                <View style={[styles.statItem, { width: isTablet ? '25%' : '50%' }]}>
                    <StatCard title="MCQs Extracted" value={stats.mcqsExtracted.toString()} icon="❓" color={adminColors.accentOrange} />
                </View>
            </View>

            {/* Quick Actions Panel */}
            <View style={styles.actionPanel}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => { setUploadType('pdf'); setUploadModalVisible(true); }}>
                    <Text style={styles.buttonText}>➕ Upload PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: adminColors.accentOrange }]} onPress={() => { setUploadType('zip'); setUploadModalVisible(true); }}>
                    <Text style={styles.buttonText}>📦 Import ZIP Bundle</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'queue' && styles.activeTabButton]} onPress={() => setActiveTab('queue')}>
                    <Text style={[styles.tabButtonText, activeTab === 'queue' && styles.activeTabButtonText]}>📋 Queue & Jobs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'preview' && styles.activeTabButton]} onPress={() => setActiveTab('preview')}>
                    <Text style={[styles.tabButtonText, activeTab === 'preview' && styles.activeTabButtonText]}>🔍 Schema Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'logs' && styles.activeTabButton]} onPress={() => setActiveTab('logs')}>
                    <Text style={[styles.tabButtonText, activeTab === 'logs' && styles.activeTabButtonText]}>📝 Live Logs</Text>
                </TouchableOpacity>
            </View>

            {/* Queue Tab Content */}
            {activeTab === 'queue' && (
                <View style={styles.tabContent}>
                    {jobs.map((job) => (
                        <View key={job.id} style={styles.jobCard}>
                            <View style={styles.jobHeader}>
                                <Text style={styles.jobName} numberOfLines={1}>{job.filename}</Text>
                                <Text style={[styles.statusBadge, styles[`status_${job.status}` as keyof typeof styles]]}>
                                    {job.status.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.jobMeta}>Job ID: {job.id} | Queued: {job.timestamp}</Text>
                            {(job.standard_number || job.subject_id || job.session) && (
                                <Text style={[styles.jobMeta, { marginTop: 4, color: adminColors.primary, fontWeight: '600' }]}>
                                    ધોરણ: {job.standard_number} | વિષય ID: {job.subject_id} | સત્ર: {job.session}
                                </Text>
                            )}

                            {/* Progress bar */}
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { width: `${job.progress}%` }]} />
                                <Text style={styles.progressText}>{job.progress}%</Text>
                            </View>

                            {/* Job actions */}
                            <View style={styles.jobActions}>
                                {job.status === 'success' && (
                                    <>
                                        <TouchableOpacity style={[styles.retryButton, { backgroundColor: adminColors.primary, marginRight: spacing.sm }]} onPress={() => handleLoadPreview(job.id)}>
                                            <Text style={styles.retryButtonText}>🔍 Preview payload</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.rollbackButton} onPress={() => handleRollback(job.id)}>
                                            <Text style={styles.rollbackButtonText}>🚨 Rollback</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Preview Tab Content */}
            {activeTab === 'preview' && (
                <View style={styles.tabContent}>
                    <Text style={styles.previewSubTitle}>Universal Firestore Scheme Preview</Text>
                    {selectedPreviewPayload ? (
                        <ScrollView style={styles.codeContainer} horizontal={true}>
                            <Text style={styles.codeText}>
                                {JSON.stringify(selectedPreviewPayload, null, 2)}
                            </Text>
                        </ScrollView>
                    ) : (
                        <Text style={styles.noPreviewText}>No job selected for schema preview. Go to Queue tab and select "Preview payload".</Text>
                    )}
                </View>
            )}

            {/* Logs Tab Content */}
            {activeTab === 'logs' && (
                <View style={styles.tabContent}>
                    <ScrollView style={styles.logViewport}>
                        {logs.map((log, idx) => (
                            <Text key={idx} style={styles.logLine}>{log}</Text>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Upload Modal */}
            <Modal visible={uploadModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>{uploadType === 'pdf' ? '📤 Upload GCERT PDF' : '📦 Upload ZIP Package'}</Text>

                        {/* Standard Number Picker */}
                        <Text style={styles.inputLabel}>ધોરણ (Standard) *</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setStandardPickerVisible(true)}
                        >
                            <Text style={styles.pickerButtonText}>ધોરણ {standardNum} ▾</Text>
                        </TouchableOpacity>

                        {/* Subject Dropdown */}
                        <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>વિષય (Subject) *</Text>
                        {subjectsLoading ? (
                            <View style={styles.subjectLoading}>
                                <ActivityIndicator size="small" color={adminColors.primary} />
                                <Text style={styles.subjectLoadingText}>Loading subjects...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.pickerButton, !subjects.length && styles.pickerButtonDisabled]}
                                onPress={() => subjects.length ? setSubjectPickerVisible(true) : null}
                            >
                                {selectedSubject ? (
                                    <View>
                                        <Text style={styles.pickerButtonText}>{selectedSubject.nameGu || selectedSubject.name}</Text>
                                        <Text style={styles.pickerSubText}>ID: {selectedSubject.id} ▾</Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.pickerButtonText, { color: adminColors.textSecondary }]}>
                                        {subjects.length ? 'Select Subject ▾' : 'No subjects found for this standard'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Session Dropdown */}
                        <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>સેમેસ્ટર / સત્ર (Session) *</Text>
                        {sessionsLoading ? (
                            <View style={styles.subjectLoading}>
                                <ActivityIndicator size="small" color={adminColors.primary} />
                                <Text style={styles.subjectLoadingText}>Loading sessions...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.pickerButton, !sessions.length && styles.pickerButtonDisabled]}
                                onPress={() => sessions.length ? setSessionPickerVisible(true) : null}
                            >
                                {selectedSession ? (
                                    <View>
                                        <Text style={styles.pickerButtonText}>{selectedSession.title}</Text>
                                        <Text style={styles.pickerSubText}>Value: {selectedSession.session} ▾</Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.pickerButtonText, { color: adminColors.textSecondary }]}>
                                        {sessions.length ? 'Select Session ▾' : 'No sessions found for this standard'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Selected info card */}
                        {selectedSubject && (
                            <View style={styles.selectionCard}>
                                <Text style={styles.selectionCardTitle}>📋 Upload Target</Text>
                                <Text style={styles.selectionCardRow}>📚 Subject: {selectedSubject.nameGu}</Text>
                                <Text style={styles.selectionCardRow}>🏫 Standard: {standardNum}</Text>
                                {selectedSession && <Text style={styles.selectionCardRow}>📅 Session: {selectedSession.title}</Text>}
                                <Text style={styles.selectionCardRow}>🔑 Subject ID: {selectedSubject.id}</Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setUploadModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={handlePickAndUpload}>
                                {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Select & Upload</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Standard Number Picker Modal */}
            <Modal visible={standardPickerVisible} transparent animationType="fade">
                <View style={styles.dropdownOverlay}>
                    <View style={styles.dropdownCard}>
                        <Text style={styles.dropdownTitle}>ધોરણ પસંદ કરો</Text>
                        <FlatList
                            data={Array.from({ length: 12 }, (_, i) => String(i + 1))}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.dropdownItem, item === standardNum && styles.dropdownItemActive]}
                                    onPress={() => {
                                        setStandardNum(item);
                                        setStandardPickerVisible(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, item === standardNum && styles.dropdownItemTextActive]}>
                                        ધોરણ {item}
                                    </Text>
                                    {item === standardNum && <Text style={{ color: adminColors.primary }}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Subject Picker Modal */}
            <Modal visible={subjectPickerVisible} transparent animationType="fade">
                <View style={styles.dropdownOverlay}>
                    <View style={styles.dropdownCard}>
                        <Text style={styles.dropdownTitle}>વિષય પસંદ કરો</Text>
                        <FlatList
                            data={subjects}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.dropdownItem, selectedSubject?.id === item.id && styles.dropdownItemActive]}
                                    onPress={() => {
                                        setSelectedSubject(item);
                                        setSubjectPickerVisible(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[styles.dropdownItemText, selectedSubject?.id === item.id && styles.dropdownItemTextActive]}>
                                            {item.nameGu || item.name}
                                        </Text>
                                        <Text style={styles.dropdownSubText}>{item.name}</Text>
                                    </View>
                                    {selectedSubject?.id === item.id && <Text style={{ color: adminColors.primary }}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            {/* Session Picker Modal */}
            <Modal visible={sessionPickerVisible} transparent animationType="fade">
                <View style={styles.dropdownOverlay}>
                    <View style={styles.dropdownCard}>
                        <Text style={styles.dropdownTitle}>સત્ર / સેમેસ્ટર પસંદ કરો</Text>
                        <FlatList
                            data={sessions}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.dropdownItem, selectedSession?.id === item.id && styles.dropdownItemActive]}
                                    onPress={() => {
                                        setSelectedSession(item);
                                        setSessionPickerVisible(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[styles.dropdownItemText, selectedSession?.id === item.id && styles.dropdownItemTextActive]}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.dropdownSubText}>સત્ર કોડ: {item.session}</Text>
                                    </View>
                                    {selectedSession?.id === item.id && <Text style={{ color: adminColors.primary }}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
        padding: spacing.md
    },
    apiSettings: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border
    },
    apiHeaderRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.xs
    },
    apiLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary,
    },
    statusBadgeContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    badgeWrap: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    connectionBadge: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold as '600',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        overflow: 'hidden' as const,
    },
    badgeChecking: {
        color: adminColors.textSecondary,
    },
    badgeConnected: {
        color: adminColors.accentGreen,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    badgeError: {
        color: adminColors.accentRed,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    apiInputRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: spacing.sm,
        marginTop: 4,
    },
    apiInput: {
        flex: 1,
        backgroundColor: adminColors.background,
        color: adminColors.textPrimary,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: adminColors.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: 8,
        fontSize: typography.size.sm,
    },
    testButton: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: borderRadius.sm,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    testButtonText: {
        color: '#fff',
        fontWeight: typography.weight.bold as '700',
        fontSize: typography.size.xs,
    },
    apiErrorSubtext: {
        color: adminColors.accentRed,
        fontSize: typography.size.xs,
        marginTop: spacing.xs,
        lineHeight: 16,
    },
    sectionTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary,
        marginBottom: spacing.md
    },
    statsGrid: {
        marginHorizontal: -spacing.sm,
        marginBottom: spacing.md
    },
    statItem: {
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.sm
    },
    actionPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md
    },
    primaryButton: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flex: 0.48,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#fff',
        fontWeight: typography.weight.bold as '700',
        fontSize: typography.size.md
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border,
        marginBottom: spacing.md
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center'
    },
    activeTabButton: {
        borderBottomWidth: 3,
        borderBottomColor: adminColors.primary
    },
    tabButtonText: {
        color: adminColors.textSecondary,
        fontSize: typography.size.md
    },
    activeTabButtonText: {
        color: adminColors.primary,
        fontWeight: typography.weight.semibold as '600'
    },
    tabContent: {
        marginBottom: spacing.lg
    },
    jobCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
    },
    jobName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary,
        flex: 0.7
    },
    statusBadge: {
        fontSize: typography.size.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        color: '#fff',
        fontWeight: typography.weight.semibold as '600'
    },
    status_success: { backgroundColor: adminColors.accentGreen },
    status_ocr: { backgroundColor: adminColors.primary },
    status_queued: { backgroundColor: adminColors.info },
    status_failed: { backgroundColor: adminColors.accentRed },
    status_processing: { backgroundColor: adminColors.primaryLight },
    status_segmenting: { backgroundColor: adminColors.primaryLight },
    status_hierarchy: { backgroundColor: adminColors.accentOrange },
    status_features: { backgroundColor: adminColors.accentPink },
    status_importing: { backgroundColor: '#6200ee' },
    jobMeta: {
        color: adminColors.textSecondary,
        fontSize: typography.size.sm,
        marginBottom: spacing.md
    },
    progressContainer: {
        height: 20,
        backgroundColor: adminColors.border,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        marginBottom: spacing.md
    },
    progressBar: {
        height: '100%',
        backgroundColor: adminColors.primary
    },
    progressText: {
        position: 'absolute',
        alignSelf: 'center',
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary
    },
    jobActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    retryButton: {
        backgroundColor: adminColors.accentOrange,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm
    },
    retryButtonText: {
        color: '#fff',
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold as '600'
    },
    rollbackButton: {
        backgroundColor: adminColors.accentRed,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm
    },
    rollbackButtonText: {
        color: '#fff',
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold as '600'
    },
    previewSubTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary,
        marginBottom: spacing.sm
    },
    codeContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: borderRadius.md,
        padding: spacing.md
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#A9B7C6',
        fontSize: 12
    },
    noPreviewText: {
        color: adminColors.textSecondary,
        fontSize: typography.size.md,
        textAlign: 'center',
        marginTop: spacing.lg
    },
    logViewport: {
        backgroundColor: '#0F0F0F',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        height: 300
    },
    logLine: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#00FF00',
        fontSize: 12,
        marginBottom: 4
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg
    },
    modalContent: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border
    },
    modalTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold as '700',
        color: adminColors.textPrimary,
        marginBottom: spacing.md
    },
    inputLabel: {
        color: adminColors.textSecondary,
        fontSize: typography.size.sm,
        marginBottom: 4
    },
    textInput: {
        backgroundColor: adminColors.background,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    cancelButton: {
        flex: 0.48,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.sm
    },
    cancelButtonText: {
        color: adminColors.textSecondary,
        fontWeight: typography.weight.semibold as '600'
    },
    confirmButton: {
        flex: 0.48,
        backgroundColor: adminColors.primary,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
        justifyContent: 'center'
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: typography.weight.bold as '700'
    },
    // ─── Subject Picker Styles ───────────────────────────────────
    pickerButton: {
        backgroundColor: adminColors.background,
        borderWidth: 1,
        borderColor: adminColors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
        minHeight: 46,
        justifyContent: 'center' as const
    },
    pickerButtonDisabled: {
        borderColor: adminColors.border,
        opacity: 0.5
    },
    pickerButtonText: {
        color: adminColors.textPrimary,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold as '600'
    },
    pickerSubText: {
        color: adminColors.textSecondary,
        fontSize: typography.size.sm,
        marginTop: 2
    },
    subjectLoading: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: spacing.sm,
        marginBottom: spacing.md
    },
    subjectLoadingText: {
        color: adminColors.textSecondary,
        marginLeft: spacing.sm,
        fontSize: typography.size.sm
    },
    selectionCard: {
        backgroundColor: adminColors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: adminColors.accentGreen
    },
    selectionCardTitle: {
        color: adminColors.textSecondary,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold as '600',
        marginBottom: 4
    },
    selectionCardRow: {
        color: adminColors.textPrimary,
        fontSize: typography.size.sm,
        marginBottom: 2
    },
    // ─── Dropdown Picker Modals ──────────────────────────────────
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center' as const,
        padding: spacing.lg
    },
    dropdownCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        maxHeight: 400,
        borderWidth: 1,
        borderColor: adminColors.border
    },
    dropdownTitle: {
        color: adminColors.textPrimary,
        fontWeight: typography.weight.bold as '700',
        fontSize: typography.size.md,
        marginBottom: spacing.sm,
        textAlign: 'center' as const
    },
    dropdownItem: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border
    },
    dropdownItemActive: {
        backgroundColor: `${adminColors.primary}20`
    },
    dropdownItemText: {
        color: adminColors.textPrimary,
        fontSize: typography.size.md
    },
    dropdownItemTextActive: {
        color: adminColors.primary,
        fontWeight: typography.weight.bold as '700'
    },
    dropdownSubText: {
        color: adminColors.textSecondary,
        fontSize: typography.size.sm,
        marginTop: 2
    }
});
