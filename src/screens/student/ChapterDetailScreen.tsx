import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChapterDetail } from '../../hooks/useChapterDetail';
import { studentColors, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { updateChapterLastOpened, markChapterCompleted } from '../../services/firebase/progress.service';
import { useBookmarks } from '../../hooks/useBookmarks';
import { logAnalyticsEvent } from '../../services/analytics';
import { AnimatedPressable } from '../../components/common';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { aiTutorService, CitationItem } from '../../services/aiTutor.service';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { Chapter } from '../../types';
import { warmUpBackend } from '../../services/warmup.service';
import {
    requestCameraAndMediaPermission,
    openAppSettings,
} from '../../services/permissions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'structure' | 'notes' | 'test' | 'ppt' | 'report' | 'quiz' | 'chat';

interface TabItem {
    key: TabKey;
    label: string;
    subLabel: string;
    icon: string;
    color: string;
}

const TABS: TabItem[] = [
    { key: 'structure', label: 'રચના', subLabel: 'Structure', icon: 'git-network-outline', color: '#2563eb' },
    { key: 'notes', label: 'નોટ્સ', subLabel: 'Notes', icon: 'document-text-outline', color: '#0284c7' },
    { key: 'test', label: 'પ્રશ્નપત્ર', subLabel: 'Test', icon: 'newspaper-outline', color: '#059669' },
    { key: 'ppt', label: 'પ્રેઝન્ટેશન', subLabel: 'PPT', icon: 'easel-outline', color: '#ea580c' },
    { key: 'quiz', label: 'ક્વિઝ', subLabel: 'Quiz', icon: 'help-circle-outline', color: '#9333ea' },
    { key: 'report', label: 'વિશ્લેષણ', subLabel: 'Report', icon: 'bar-chart-outline', color: '#4f46e5' },
    { key: 'chat', label: 'AI ટ્યુટર', subLabel: 'Chat', icon: 'chatbubbles-outline', color: '#e11d48' },
];

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    citations?: CitationItem[];
    pageNumber?: number;
}

const webViewHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Speech Recognition</title>
</head>
<body>
  <script>
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Speech recognition not supported' }));
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'gu-IN';
      recognition.onstart = () => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' })); };
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; }
          else { interimTranscript += event.results[i][0].transcript; }
        }
        const text = finalTranscript || interimTranscript;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', text }));
      };
      recognition.onerror = (event) => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: event.error })); };
      recognition.onend = () => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' })); };
      document.addEventListener('message', (event) => {
        const command = event.data;
        if (command === 'start') { try { recognition.start(); } catch(e) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message })); } }
        else if (command === 'stop') { recognition.stop(); }
      });
      window.addEventListener('message', (event) => {
        const command = event.data;
        if (command === 'start') { try { recognition.start(); } catch(e) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message })); } }
        else if (command === 'stop') { recognition.stop(); }
      });
    }
  </script>
</body>
</html>
`;

export function ChapterDetailScreen(props: any): React.JSX.Element {
    return (
        <ErrorBoundary fallbackMessage="પ્રકરણ વિગતો લોડ કરવામાં ભૂલ આવી.">
            <ChapterDetailScreenLoader {...props} />
        </ErrorBoundary>
    );
}

function ChapterDetailScreenLoader({ route, navigation }: any): React.JSX.Element {
    const { chapterId, initialTab } = route.params || {};
    const { chapter, loading, error } = useChapterDetail(chapterId);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text style={styles.loadingText}>પ્રકરણ વિગતો લોડ થઈ રહી છે...</Text>
            </SafeAreaView>
        );
    }

    if (error || !chapter) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={studentColors.error} />
                <Text style={styles.errorText}>પ્રકરણ મળ્યું નથી.</Text>
                <AnimatedPressable style={styles.retryBtn} onPress={() => navigation.goBack()} scaleTo={0.92}>
                    <Text style={styles.retryBtnText}>પાછા જાઓ</Text>
                </AnimatedPressable>
            </SafeAreaView>
        );
    }

    return <ChapterDetailScreenContent chapter={chapter} navigation={navigation} initialTab={initialTab} />;
}

function ChapterDetailScreenContent({ chapter, navigation, initialTab }: { chapter: Chapter; navigation: any; initialTab?: string }): React.JSX.Element {
    const { user } = useAuth();
    const { getChapterProgress } = useUserProgress(chapter.subjectId);
    const { isBookmarked, toggle } = useBookmarks(user?.uid);

    const initialTabKey: TabKey = initialTab === 'chat' ? 'chat' : (initialTab as TabKey) || 'structure';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTabKey);

    // Dynamic Learning Assets from Firestore
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [notesData, setNotesData] = useState<any>(null);
    const [quizData, setQuizData] = useState<any>(null);
    const [presentationData, setPresentationData] = useState<any>(null);
    const [testPaperData, setTestPaperData] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [structureData, setStructureData] = useState<any[]>([]);

    // Quiz State
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [key: number]: number }>({});
    const [quizFinished, setQuizFinished] = useState(false);

    // PPT State
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);

    // Test Paper Answer Key State
    const [revealedAnswers, setRevealedAnswers] = useState<{ [key: string]: boolean }>({});
    const [showAllTestAnswers, setShowAllTestAnswers] = useState(false);

    // AI Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [notesModalVisible, setNotesModalVisible] = useState(false);
    const [chapterNotes, setChapterNotes] = useState('');
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('સાંભળી રહ્યા છીએ...');
    const [recording, setRecording] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string; name: string } | null>(null);
    const [chatLoadingStage, setChatLoadingStage] = useState(0);

    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const webViewRef = useRef<any>(null);
    const tabScrollRef = useRef<ScrollView>(null);

    const chapterProgress = getChapterProgress(chapter.id);
    const isCompleted = chapterProgress?.isCompleted || false;
    const isChapterBookmarked = isBookmarked(chapter.id);
    const chapterTitle = chapter.titleGu || chapter.title;

    // Load Learning Assets from Firestore with rich automatic fallbacks
    useEffect(() => {
        let isMounted = true;
        const fetchAssets = async () => {
            setAssetsLoading(true);
            try {
                // 1. Fetch Notes
                let notes: any = null;
                const noteSnap = await firestore().collection('chapter_notes').doc(chapter.id).get();
                if (noteSnap.exists && noteSnap.data()?.notes) {
                    notes = noteSnap.data()?.notes;
                } else {
                    const subNote = await firestore().collection(COLLECTIONS.CHAPTERS).doc(chapter.id).collection('notes').doc('main').get();
                    if (subNote.exists && subNote.data()?.notes) {
                        notes = subNote.data()?.notes;
                    }
                }

                // 2. Fetch Quiz
                let quiz: any = null;
                const quizSnap = await firestore().collection('chapter_quizzes').doc(chapter.id).get();
                if (quizSnap.exists && quizSnap.data()?.quiz) {
                    quiz = quizSnap.data()?.quiz;
                } else {
                    const subQuiz = await firestore().collection(COLLECTIONS.CHAPTERS).doc(chapter.id).collection('quizzes').doc('main').get();
                    if (subQuiz.exists && subQuiz.data()?.quiz) {
                        quiz = subQuiz.data()?.quiz;
                    }
                }

                // 3. Fetch Presentation
                let ppt: any = null;
                const pptSnap = await firestore().collection('chapter_presentations').doc(chapter.id).get();
                if (pptSnap.exists && pptSnap.data()?.presentation) {
                    ppt = pptSnap.data()?.presentation;
                } else {
                    const subPpt = await firestore().collection(COLLECTIONS.CHAPTERS).doc(chapter.id).collection('presentations').doc('main').get();
                    if (subPpt.exists && subPpt.data()?.presentation) {
                        ppt = subPpt.data()?.presentation;
                    }
                }

                // 4. Fetch Test Paper
                let test: any = null;
                const testSnap = await firestore().collection('chapter_tests').doc(chapter.id).get();
                if (testSnap.exists && testSnap.data()?.test_paper) {
                    test = testSnap.data()?.test_paper;
                } else {
                    const subTest = await firestore().collection(COLLECTIONS.CHAPTERS).doc(chapter.id).collection('tests').doc('main').get();
                    if (subTest.exists && subTest.data()?.test_paper) {
                        test = subTest.data()?.test_paper;
                    }
                }

                // 5. Fetch Report
                let rep: any = null;
                const tbId = (chapter as any).textbookId || `tb_${chapter.subjectId}`;
                const repSnap = await firestore().collection('textbook_reports').doc(tbId).get();
                if (repSnap.exists && repSnap.data()?.report) {
                    rep = repSnap.data()?.report;
                }

                // 6. Fetch Structure Sections & Topics
                let sections: any[] = [];
                const secSnap = await firestore()
                    .collection(COLLECTIONS.TEXTBOOKS)
                    .doc(tbId)
                    .collection('chapters')
                    .doc(chapter.id)
                    .collection('sections')
                    .orderBy('order', 'asc')
                    .get();

                if (!secSnap.empty) {
                    for (const sDoc of secSnap.docs) {
                        const secData = sDoc.data();
                        const topSnap = await sDoc.ref.collection('topics').orderBy('order', 'asc').get();
                        const topics = topSnap.docs.map(t => t.data());
                        sections.push({ ...secData, topics });
                    }
                }

                if (isMounted) {
                    setNotesData(notes || getFallbackNotes(chapterTitle, chapter));
                    setQuizData(quiz || getFallbackQuiz(chapterTitle));
                    setPresentationData(ppt || getFallbackPresentation(chapterTitle, chapter));
                    setTestPaperData(test || getFallbackTestPaper(chapterTitle, chapter));
                    setReportData(rep || getFallbackReport(chapterTitle, chapter));
                    setStructureData(sections.length > 0 ? sections : getFallbackStructure(chapterTitle, chapter));
                    setAssetsLoading(false);
                }
            } catch (err) {
                console.warn('[ChapterDetailScreen] Error fetching assets from Firestore:', err);
                if (isMounted) {
                    setNotesData(getFallbackNotes(chapterTitle, chapter));
                    setQuizData(getFallbackQuiz(chapterTitle));
                    setPresentationData(getFallbackPresentation(chapterTitle, chapter));
                    setTestPaperData(getFallbackTestPaper(chapterTitle, chapter));
                    setReportData(getFallbackReport(chapterTitle, chapter));
                    setStructureData(getFallbackStructure(chapterTitle, chapter));
                    setAssetsLoading(false);
                }
            }
        };

        fetchAssets();
        return () => { isMounted = false; };
    }, [chapter.id, chapterTitle]);

    // Analytics and Last Opened
    useEffect(() => {
        if (user?.uid) {
            updateChapterLastOpened(user.uid, chapter.id, chapter.subjectId, chapter.standardId);
            logAnalyticsEvent('chapter_open', {
                chapter_id: chapter.id,
                chapter_title: chapter.title,
                standard_id: chapter.standardId,
            });
        }
    }, [chapter.id, chapter.subjectId, chapter.standardId, chapter.title, user?.uid]);

    // Warmup backend
    useEffect(() => {
        warmUpBackend(true);
        if (user?.uid) {
            getOrCreateSessionId().catch(() => { });
        }
    }, [chapter.id, user?.uid]);

    // Progressive live stage updates while AI chat is thinking
    useEffect(() => {
        let t1: any = null;
        let t2: any = null;
        if (chatLoading) {
            setChatLoadingStage(0);
            t1 = setTimeout(() => setChatLoadingStage(1), 3000);
            t2 = setTimeout(() => setChatLoadingStage(2), 7500);
        } else {
            setChatLoadingStage(0);
        }
        return () => {
            if (t1) clearTimeout(t1);
            if (t2) clearTimeout(t2);
        };
    }, [chatLoading]);

    // Load saved student notes
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const saved = await AsyncStorage.getItem(`notes_${chapter.id}`);
                if (saved) setChapterNotes(saved);
            } catch (e) {
                console.error('Failed to load notes:', e);
            }
        };
        loadNotes();
    }, [chapter.id]);

    const saveChapterNotes = async (text: string) => {
        setChapterNotes(text);
        try {
            await AsyncStorage.setItem(`notes_${chapter.id}`, text);
        } catch (e) {
            console.error('Failed to save notes:', e);
        }
    };

    // Session Management for AI Chat
    const getOrCreateSessionId = async (): Promise<string | null> => {
        if (sessionId) return sessionId;
        if (!user?.uid) return null;

        const metadata = {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterTitleGu: chapterTitle,
            standardId: chapter.standardId,
            subjectId: chapter.subjectId,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            pdfUrl: chapter.pdfUrl,
        };

        try {
            const sid = await aiTutorService.createChatSession(
                user.uid,
                `પ્રકરણ: ${chapterTitle}`,
                metadata
            );
            setSessionId(sid);
            setSessionError(false);
            return sid;
        } catch (err) {
            console.error('[ChapterDetailScreen] Error creating chat session:', err);
            setSessionError(true);
            return null;
        }
    };

    const retrySession = async () => {
        setSessionError(false);
        const sid = await getOrCreateSessionId();
        if (sid) setSessionError(false);
    };

    const handleToggleBookmark = async () => {
        if (updating) return;
        setUpdating(true);
        try {
            await toggle(chapter.id, {
                chapterTitle,
                subjectId: chapter.subjectId,
                standardId: chapter.standardId,
            });
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkCompleted = async () => {
        if (!user?.uid || updating) return;
        setUpdating(true);
        try {
            const ok = await markChapterCompleted(user.uid, chapter.id, chapter.subjectId, chapter.standardId);
            if (ok) {
                Alert.alert('અભિનંદન! 🎉', 'આ પ્રકરણ પૂર્ણ થયું તરીકે નોંધાયું છે!');
            }
        } catch (err) {
            console.error('Error marking completed:', err);
            Alert.alert('Error', 'પ્રકરણ પૂર્ણ કરવામાં ભૂલ આવી.');
        } finally {
            setUpdating(false);
        }
    };

    const getResolvedPdf = () => {
        let resolved = chapter.pdfUrl || (chapter as any).pdf_url || (chapter as any).file_url || (chapter as any).url || (chapter as any).textbookUrl;
        if (!resolved) {
            const titleToCheck = `${chapter.title || ''} ${chapter.titleGu || ''} ${chapter.subjectId || ''}`.toLowerCase();
            if (titleToCheck.includes('gita') || titleToCheck.includes('ગીતા') || titleToCheck.includes('bhagavad')) {
                resolved = 'https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-6%20to%208%20%E0%AA%AD%E0%AA%97%E0%AA%B5%E0%AA%A6%E0%AB%8D%20%E0%AA%97%E0%AB%80%E0%AA%A4%E0%AA%BE%20%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80%20%E0%AA%AE%E0%AA%BE%E0%AA%A7%E0%AB%8D%E0%AA%AF%E0%AA%AE.pdf?alt=media';
            }
        }
        return resolved;
    };

    const openPDF = () => {
        const resolvedPdfUrl = getResolvedPdf();
        if (!resolvedPdfUrl) {
            Alert.alert('Notice', 'આ પ્રકરણ માટે ડિજિટલ પુસ્તક ઉપલબ્ધ નથી.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: resolvedPdfUrl,
            title: chapterTitle,
            pdfId: chapter.id,
            pdfType: 'chapter',
            startPage: chapter.startPage || 1,
            endPage: chapter.endPage,
            bookStartPage: chapter.bookStartPage
        });
    };

    const openPDFAtPage = (targetPage?: number) => {
        const resolvedPdfUrl = getResolvedPdf();
        if (!resolvedPdfUrl) {
            Alert.alert('Notice', 'આ પ્રકરણ માટે પીડીએફ ઉપલબ્ધ નથી.');
            return;
        }

        let startPageToUse = chapter.startPage || 1;
        if (targetPage && chapter.bookStartPage) {
            const offset = targetPage - chapter.bookStartPage;
            const calculatedPage = (chapter.startPage || 1) + (offset > 0 ? offset : 0);
            startPageToUse = Math.max(1, calculatedPage);
        } else if (targetPage) {
            startPageToUse = targetPage;
        }

        navigation.navigate('PdfViewer', {
            url: resolvedPdfUrl,
            title: `${chapterTitle} (પાનું ${targetPage || startPageToUse})`,
            pdfId: chapter.id,
            pdfType: 'chapter',
            startPage: startPageToUse,
            endPage: chapter.endPage,
            bookStartPage: chapter.bookStartPage
        });
    };

    // Chat Send message
    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText !== undefined ? overrideText : inputText;
        if (!textToSend.trim() && !selectedImage) return;

        let sid = sessionId;
        if (!sid) {
            sid = await getOrCreateSessionId();
            if (!sid) return;
        }

        const userMsg: Message = {
            id: `usr_${Date.now()}`,
            role: 'user',
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setChatLoading(true);

        setSelectedImage(null);

        try {
            const response = await aiTutorService.sendChatMessage(
                sid,
                textToSend,
                {
                    chapter: chapterTitle,
                    standard: chapter.standardId,
                    subject: chapter.subjectId,
                }
            );

            const aiMsg: Message = {
                id: `ai_${Date.now()}`,
                role: 'assistant',
                content: response.answer || 'ક્ષમા કરશો, જવાબ પ્રાપ્ત થયો નથી.',
                timestamp: new Date(),
                citations: response.citations,
                pageNumber: response.citations?.[0]?.pageNumber || undefined,
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Error sending message to AI Tutor:', err);
            const errReply: Message = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                content: 'નેટવર્ક જોડાણ તપાસો અને ફરી પ્રયાસ કરો.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errReply]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleVoicePress = async () => {
        if (recording) {
            setRecording(false);
            setVoiceModalVisible(false);
            webViewRef.current?.postMessage('stop');
        } else {
            const hasPerm = await requestCameraAndMediaPermission();
            if (!hasPerm) {
                openAppSettings();
                return;
            }
            setVoiceStatus('સાંભળી રહ્યા છીએ... બોલો...');
            setRecording(true);
            setVoiceModalVisible(true);
            webViewRef.current?.postMessage('start');
        }
    };

    const handlePickImage = async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.images],
            });
            if (res.uri) {
                setSelectedImage({
                    uri: res.uri,
                    type: res.type || 'image/jpeg',
                    name: res.name || 'question.jpg',
                });
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.error('DocumentPicker Error: ', err);
            }
        }
    };

    const onWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'result' && data.text) {
                setInputText(prev => `${prev} ${data.text}`.trim());
                setVoiceStatus(data.text);
            } else if (data.type === 'end') {
                setRecording(false);
                setVoiceModalVisible(false);
            } else if (data.type === 'error') {
                setRecording(false);
                setVoiceModalVisible(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // Quiz Answer selection
    const handleQuizOption = (qIdx: number, optIdx: number) => {
        if (selectedQuizAnswers[qIdx] !== undefined) return;
        setSelectedQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    };

    const calculateQuizScore = () => {
        const questions = quizData?.questions || [];
        return Object.entries(selectedQuizAnswers).reduce((acc, [qIdx, ansIdx]) => {
            const q = questions[Number(qIdx)];
            return q && q.correct_index === ansIdx ? acc + 1 : acc;
        }, 0);
    };

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <SafeAreaView edges={['top']} style={styles.topSafeArea}>
                <View style={styles.header}>
                    <AnimatedPressable onPress={() => navigation.goBack()} style={styles.headerIconBtn} scaleTo={0.88}>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </AnimatedPressable>

                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerMainTitle} numberOfLines={1}>{chapterTitle}</Text>
                        <Text style={styles.headerSubTitle} numberOfLines={1}>
                            {chapter.subjectId} • ધોરણ {chapter.standardId} • પાના: {chapter.startPage}–{chapter.endPage || chapter.startPage}
                        </Text>
                    </View>

                    <View style={styles.headerRightActions}>
                        <AnimatedPressable onPress={openPDF} style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]} scaleTo={0.88}>
                            <Ionicons name="book-outline" size={17} color="#fff" />
                        </AnimatedPressable>

                        <AnimatedPressable onPress={() => setNotesModalVisible(true)} style={styles.headerIconBtn} scaleTo={0.88}>
                            <Ionicons name="create-outline" size={17} color="#fff" />
                        </AnimatedPressable>

                        <AnimatedPressable onPress={handleToggleBookmark} style={styles.headerIconBtn} disabled={updating} scaleTo={0.88}>
                            <Ionicons
                                name={isChapterBookmarked ? 'star' : 'star-outline'}
                                size={17}
                                color={isChapterBookmarked ? '#facc15' : '#fff'}
                            />
                        </AnimatedPressable>
                    </View>
                </View>

                {/* 6 GyanDeep Admin + AI Chat Tabs */}
                <View style={styles.tabScrollWrap}>
                    <ScrollView
                        ref={tabScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabScrollContent}
                    >
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <AnimatedPressable
                                    key={tab.key}
                                    style={[styles.tabPill, isActive && styles.tabPillActive]}
                                    onPress={() => {
                                        setActiveTab(tab.key);
                                        if (tab.key === 'chat') {
                                            setTimeout(() => inputRef.current?.focus(), 150);
                                        }
                                    }}
                                    scaleTo={0.94}
                                >
                                    <Ionicons
                                        name={tab.icon as any}
                                        size={15}
                                        color={isActive ? tab.color : 'rgba(255,255,255,0.85)'}
                                        style={{ marginRight: 5 }}
                                    />
                                    <Text style={[styles.tabPillText, isActive && { color: tab.color, fontWeight: '800' }]}>
                                        {tab.label}
                                    </Text>
                                    {tab.key === 'chat' && messages.length > 0 && (
                                        <View style={styles.chatBadge}>
                                            <Text style={styles.chatBadgeText}>{messages.length}</Text>
                                        </View>
                                    )}
                                </AnimatedPressable>
                            );
                        })}
                    </ScrollView>
                </View>
            </SafeAreaView>

            {assetsLoading ? (
                <View style={styles.loadingAssetsBox}>
                    <ActivityIndicator size="large" color="#1d4ed8" />
                    <Text style={styles.loadingAssetsText}>શૈક્ષણિક સામગ્રી તૈયાર થઈ રહી છે...</Text>
                    <Text style={styles.loadingAssetsSub}>નોટ્સ, કસોટીપત્ર, સ્લાઇડ્સ, ક્વિઝ અને પ્રકરણ રચના...</Text>
                </View>
            ) : (
                <View style={styles.mainTabBody}>
                    {/* ─── TAB 1: પ્રકરણ રચના (STRUCTURE) ─── */}
                    {activeTab === 'structure' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Chapter Hero Card */}
                            <View style={styles.heroCard}>
                                <View style={styles.heroTopRow}>
                                    <View style={styles.badgePill}>
                                        <Text style={styles.badgePillText}>પ્રકરણ વિહંગાવલોકન</Text>
                                    </View>
                                    <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusInProgress]}>
                                        <Text style={[styles.statusBadgeText, isCompleted ? styles.statusTextCompleted : styles.statusTextInProgress]}>
                                            {isCompleted ? '✓ પૂર્ણ થયેલ' : '▶️ અભ્યાસ ચાલુ'}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.heroTitleText}>{chapterTitle}</Text>
                                {chapter.titleGu && chapter.title !== chapter.titleGu && (
                                    <Text style={styles.heroSubTitleText}>{chapter.title}</Text>
                                )}

                                <View style={styles.heroMetaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="book" size={13} color="#2563eb" />
                                        <Text style={styles.metaItemText}>પાના: {chapter.startPage} – {chapter.endPage || chapter.startPage}</Text>
                                    </View>
                                    <View style={[styles.metaItem, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                                        <Ionicons name="layers" size={13} color="#059669" />
                                        <Text style={[styles.metaItemText, { color: '#059669' }]}>{structureData.length} મુખ્ય વિભાગો</Text>
                                    </View>
                                </View>

                                <AnimatedPressable style={styles.readPdfBtn} onPress={openPDF} scaleTo={0.96}>
                                    <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.readPdfBtnText}>📖 સંપૂર્ણ ડિજિટલ પુસ્તક વાંચો (PDF View)</Text>
                                </AnimatedPressable>
                            </View>

                            {/* Structure Sections & Topics */}
                            <View style={styles.sectionHeaderWrap}>
                                <Text style={styles.sectionHeaderTitle}>📚 પ્રકરણ રચના અને પેટા વિષયો</Text>
                                <Text style={styles.sectionHeaderSub}>વિષયવસ્તુ ક્રમબદ્ધ શીખવા માટે કોઈપણ મુદ્દા પર ક્લિક કરો</Text>
                            </View>

                            <View style={styles.structureList}>
                                {structureData.map((sec: any, secIdx: number) => (
                                    <View key={secIdx} style={styles.sectionCard}>
                                        <View style={styles.sectionHeaderRow}>
                                            <View style={styles.secNumberBox}>
                                                <Text style={styles.secNumberText}>{secIdx + 1}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.secTitleText}>{sec.title}</Text>
                                                {sec.topics?.length ? (
                                                    <Text style={styles.secSubCountText}>{sec.topics.length} પેટા વિષયો</Text>
                                                ) : null}
                                            </View>
                                        </View>

                                        {sec.topics && sec.topics.length > 0 ? (
                                            <View style={styles.topicsContainer}>
                                                {sec.topics.map((top: any, topIdx: number) => (
                                                    <View key={topIdx} style={styles.topicItemCard}>
                                                        <View style={styles.topicTopRow}>
                                                            <Text style={styles.topicTitleText}>• {top.title}</Text>
                                                            <AnimatedPressable
                                                                style={styles.topicPageJumpBtn}
                                                                onPress={() => openPDFAtPage(top.start_page || chapter.startPage || 1)}
                                                                scaleTo={0.92}
                                                            >
                                                                <Text style={styles.topicPageJumpText}>
                                                                    પાનું {top.start_page || chapter.startPage || 1} ➔
                                                                </Text>
                                                            </AnimatedPressable>
                                                        </View>
                                                        {top.summary ? (
                                                            <Text style={styles.topicSummaryText}>{top.summary}</Text>
                                                        ) : null}
                                                    </View>
                                                ))}
                                            </View>
                                        ) : null}
                                    </View>
                                ))}
                            </View>

                            {/* Mark Completed Button */}
                            {!isCompleted && (
                                <AnimatedPressable style={styles.markDoneBtn} onPress={handleMarkCompleted} scaleTo={0.96}>
                                    <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.markDoneBtnText}>આ પ્રકરણ પૂર્ણ થયું તરીકે નોંધો</Text>
                                </AnimatedPressable>
                            )}
                        </ScrollView>
                    )}

                    {/* ─── TAB 2: નોટ્સ (NOTES) ─── */}
                    {activeTab === 'notes' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Summary Card */}
                            <View style={styles.noteSummaryCard}>
                                <View style={styles.noteCardHeaderRow}>
                                    <Text style={styles.noteCardIcon}>✨</Text>
                                    <Text style={styles.noteCardHeaderTitle}>પ્રકરણ સારાંશ (Chapter Summary)</Text>
                                </View>
                                <Text style={styles.noteSummaryText}>
                                    {notesData?.summary || `${chapterTitle} પ્રકરણનો મુખ્ય સારાંશ અહીં પ્રસ્તુત છે.`}
                                </Text>
                            </View>

                            {/* Key Learning Points */}
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardSectionHeading}>🎯 મહત્વપૂર્ણ શિક્ષણ મુદ્દાઓ (Key Points)</Text>
                                {(notesData?.key_points || []).map((pt: string, idx: number) => (
                                    <View key={idx} style={styles.keyPointRow}>
                                        <View style={styles.keyPointNumBox}>
                                            <Text style={styles.keyPointNumText}>{idx + 1}</Text>
                                        </View>
                                        <Text style={styles.keyPointText}>{pt}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Vocabulary & Terms */}
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardSectionHeading}>📖 શબ્દાર્થ અને અર્થ (Vocabulary)</Text>
                                {(notesData?.vocabulary || []).map((item: any, idx: number) => (
                                    <View key={idx} style={styles.vocabCard}>
                                        <View style={styles.vocabTopRow}>
                                            <Text style={styles.vocabWord}>{item.word}</Text>
                                            <Text style={styles.vocabMeaning}>: {item.meaning}</Text>
                                        </View>
                                        {item.usage && (
                                            <Text style={styles.vocabUsage}>ઉદાહરણ: {item.usage}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Study Tips */}
                            <View style={styles.studyTipsCard}>
                                <View style={styles.noteCardHeaderRow}>
                                    <Text style={styles.noteCardIcon}>💡</Text>
                                    <Text style={[styles.noteCardHeaderTitle, { color: '#b45309' }]}>પરીક્ષા ટિપ્સ (Study Tips)</Text>
                                </View>
                                {(notesData?.exam_tips || [
                                    'પ્રકરણના મુખ્ય પ્રશ્નોત્તરો વારંવાર લખીને તૈયાર કરવા.',
                                    'મુખ્ય વ્યાખ્યાઓ અને સૂત્રો અલગ નોટબુકમાં નોંધવા.',
                                    'પાઠ્યપુસ્તકના સ્વાધ્યાયના પ્રશ્નો એકવાર મોઢે લખી તપાસવા.'
                                ]).map((tip: string, idx: number) => (
                                    <Text key={idx} style={styles.studyTipItem}>• {tip}</Text>
                                ))}
                            </View>

                            {/* Embedded Personal Note Section */}
                            <View style={styles.myNotesSection}>
                                <View style={styles.myNotesHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 18 }}>✍️</Text>
                                        <Text style={styles.myNotesTitle}>મારી અંગત નોંધ (My Notes)</Text>
                                    </View>
                                    <AnimatedPressable onPress={() => setNotesModalVisible(true)} scaleTo={0.90}>
                                        <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '700' }}>મોટી સ્ક્રીન ➔</Text>
                                    </AnimatedPressable>
                                </View>
                                <TextInput
                                    style={styles.myNotesInlineInput}
                                    placeholder="આ પ્રકરણ વાંચતી વખતે અગત્યના મુદ્દા અહીં નોંધો..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    value={chapterNotes}
                                    onChangeText={saveChapterNotes}
                                    textAlignVertical="top"
                                />
                                <AnimatedPressable
                                    style={styles.myNotesSaveBtn}
                                    onPress={() => Alert.alert('નોંધ સચવાઈ!', 'આ પ્રકરણ માટે તમારી નોંધ સફળતાપૂર્વક સાચવવામાં આવી છે.')}
                                    scaleTo={0.96}
                                >
                                    <Ionicons name="save-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.myNotesSaveText}>નોંધ સાચવો (Save Note)</Text>
                                </AnimatedPressable>
                            </View>
                        </ScrollView>
                    )}

                    {/* ─── TAB 3: પ્રશ્નપત્ર (TEST - ૫૦ ગુણ) ─── */}
                    {activeTab === 'test' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Exam Header */}
                            <View style={styles.examHeaderCard}>
                                <Text style={styles.examTitleText}>{testPaperData?.title || 'સત્રાંત / એકમ મૂલ્યાંકન કસોટી'}</Text>
                                <View style={styles.examBadgeRow}>
                                    <Text style={styles.examBadgeText}>વિષય: {chapter.subjectId}</Text>
                                    <Text style={styles.examBadgeText}>ધોરણ: {chapter.standardId}</Text>
                                    <Text style={styles.examBadgeText}>સમય: {testPaperData?.duration_mins || 60} મિનિટ</Text>
                                    <Text style={[styles.examBadgeText, { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: '800' }]}>
                                        કુલ ગુણ: {testPaperData?.total_marks || 50}
                                    </Text>
                                </View>

                                {/* Toggle All Answers */}
                                <AnimatedPressable
                                    style={styles.toggleAllAnswersBtn}
                                    onPress={() => setShowAllTestAnswers(prev => !prev)}
                                    scaleTo={0.95}
                                >
                                    <Ionicons name={showAllTestAnswers ? 'eye-off-outline' : 'eye-outline'} size={15} color="#2563eb" style={{ marginRight: 5 }} />
                                    <Text style={styles.toggleAllAnswersText}>
                                        {showAllTestAnswers ? 'તમામ ઉત્તરો છુપાવો' : 'તમામ આદર્શ ઉત્તરો દર્શાવો'}
                                    </Text>
                                </AnimatedPressable>
                            </View>

                            {/* Sections */}
                            {(testPaperData?.sections || []).map((sec: any, secIdx: number) => (
                                <View key={secIdx} style={styles.testSectionBox}>
                                    <View style={styles.testSectionHeader}>
                                        <Text style={styles.testSectionTitle}>{sec.name}</Text>
                                        <Text style={styles.testSectionMarks}>{sec.total_marks ? `[કુલ ગુણ: ${sec.total_marks}]` : ''}</Text>
                                    </View>
                                    {sec.description && (
                                        <Text style={styles.testSectionDesc}>{sec.description}</Text>
                                    )}

                                    {/* Questions */}
                                    {(sec.questions || []).map((q: any, qIdx: number) => {
                                        const qKey = `${secIdx}_${qIdx}`;
                                        const isRevealed = showAllTestAnswers || revealedAnswers[qKey];
                                        return (
                                            <View key={qIdx} style={styles.questionItemCard}>
                                                <View style={styles.questionTopRow}>
                                                    <Text style={styles.questionNumberText}>પ્રશ્ન {qIdx + 1}.</Text>
                                                    <Text style={styles.questionContentText}>{q.question}</Text>
                                                    <Text style={styles.questionMarksBadge}>[{q.marks || 1}]</Text>
                                                </View>

                                                {/* MCQ Options if available */}
                                                {q.options && q.options.length > 0 && (
                                                    <View style={styles.qOptionsGrid}>
                                                        {q.options.map((opt: string, optI: number) => (
                                                            <Text key={optI} style={styles.qOptionText}>• {opt}</Text>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Answer Reveal Toggle Button */}
                                                <AnimatedPressable
                                                    style={styles.revealBtn}
                                                    onPress={() => setRevealedAnswers(prev => ({ ...prev, [qKey]: !prev[qKey] }))}
                                                    scaleTo={0.94}
                                                >
                                                    <Ionicons name={isRevealed ? 'chevron-up' : 'chevron-down'} size={14} color="#059669" />
                                                    <Text style={styles.revealBtnText}>{isRevealed ? 'ઉત્તર છુપાવો' : 'આદર્શ ઉત્તર જુઓ'}</Text>
                                                </AnimatedPressable>

                                                {/* Revealed Model Answer */}
                                                {isRevealed && (
                                                    <View style={styles.answerBox}>
                                                        <Text style={styles.answerTitleText}>✓ આદર્શ ઉત્તર:</Text>
                                                        <Text style={styles.answerContentText}>{q.answer || 'વિદ્યાર્થીઓએ પાઠ્યપુસ્તકના આધારે સવિસ્તાર લખવું.'}</Text>
                                                        {q.explanation && (
                                                            <Text style={styles.answerExplText}>સમજૂતી: {q.explanation}</Text>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* ─── TAB 4: પ્રેઝન્ટેશન (PPT - સ્લાઇડ શો) ─── */}
                    {activeTab === 'ppt' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {presentationData?.slides && presentationData.slides.length > 0 ? (
                                <View style={{ gap: 14 }}>
                                    {/* Active Slide Canvas */}
                                    <View style={styles.slideCanvas}>
                                        {/* Slide Top Banner */}
                                        <View style={styles.slideTopRow}>
                                            <View style={styles.slidePillBadge}>
                                                <Text style={styles.slidePillText}>
                                                    સ્લાઇડ {currentSlideIndex + 1} / {presentationData.slides.length}
                                                </Text>
                                            </View>
                                            <Text style={styles.slideBrandText}>GyanDeep Smart Class</Text>
                                        </View>

                                        {/* Slide Main Content */}
                                        <Text style={styles.slideTitleText}>
                                            {presentationData.slides[currentSlideIndex]?.title || chapterTitle}
                                        </Text>
                                        {presentationData.slides[currentSlideIndex]?.subtitle ? (
                                            <Text style={styles.slideSubTitleText}>
                                                {presentationData.slides[currentSlideIndex]?.subtitle}
                                            </Text>
                                        ) : null}

                                        {/* Bullets */}
                                        <View style={styles.slideBulletsBox}>
                                            {(presentationData.slides[currentSlideIndex]?.bullets || []).map((bullet: string, bI: number) => (
                                                <View key={bI} style={styles.slideBulletRow}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#f59e0b" style={{ marginTop: 2, marginRight: 8 }} />
                                                    <Text style={styles.slideBulletText}>{bullet}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Highlight Concept Box */}
                                        {presentationData.slides[currentSlideIndex]?.highlight ? (
                                            <View style={styles.slideHighlightBox}>
                                                <Text style={styles.slideHighlightTitle}>🌟 મુખ્ય સંકલ્પના (Concept):</Text>
                                                <Text style={styles.slideHighlightContent}>
                                                    {presentationData.slides[currentSlideIndex]?.highlight}
                                                </Text>
                                            </View>
                                        ) : null}

                                        {/* Speaker Notes Toggle */}
                                        {presentationData.slides[currentSlideIndex]?.speaker_notes ? (
                                            <View style={styles.speakerNotesBox}>
                                                <AnimatedPressable
                                                    style={styles.speakerNotesToggle}
                                                    onPress={() => setShowSpeakerNotes(prev => !prev)}
                                                    scaleTo={0.96}
                                                >
                                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#94a3b8" />
                                                    <Text style={styles.speakerNotesToggleText}>
                                                        {showSpeakerNotes ? 'શિક્ષક નોંધ છુપાવો' : '👨‍🏫 શિક્ષક નોંધ (Speaker Notes)'}
                                                    </Text>
                                                </AnimatedPressable>
                                                {showSpeakerNotes && (
                                                    <Text style={styles.speakerNotesContent}>
                                                        {presentationData.slides[currentSlideIndex]?.speaker_notes}
                                                    </Text>
                                                )}
                                            </View>
                                        ) : null}
                                    </View>

                                    {/* Slide Controls */}
                                    <View style={styles.slideControlsRow}>
                                        <AnimatedPressable
                                            style={[styles.slideNavBtn, currentSlideIndex === 0 && styles.slideNavBtnDisabled]}
                                            onPress={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentSlideIndex === 0}
                                            scaleTo={0.94}
                                        >
                                            <Ionicons name="chevron-back" size={18} color={currentSlideIndex === 0 ? '#94a3b8' : '#FFFFFF'} />
                                            <Text style={[styles.slideNavBtnText, currentSlideIndex === 0 && { color: '#94a3b8' }]}>અગાઉની</Text>
                                        </AnimatedPressable>

                                        {/* Dots */}
                                        <View style={styles.slideDotsRow}>
                                            {presentationData.slides.map((_: any, dI: number) => (
                                                <AnimatedPressable
                                                    key={dI}
                                                    onPress={() => setCurrentSlideIndex(dI)}
                                                    style={[styles.slideDot, dI === currentSlideIndex && styles.slideDotActive]}
                                                />
                                            ))}
                                        </View>

                                        <AnimatedPressable
                                            style={[
                                                styles.slideNavBtn,
                                                currentSlideIndex === presentationData.slides.length - 1 && styles.slideNavBtnDisabled
                                            ]}
                                            onPress={() => setCurrentSlideIndex(prev => Math.min(presentationData.slides.length - 1, prev + 1))}
                                            disabled={currentSlideIndex === presentationData.slides.length - 1}
                                            scaleTo={0.94}
                                        >
                                            <Text style={[
                                                styles.slideNavBtnText,
                                                currentSlideIndex === presentationData.slides.length - 1 && { color: '#94a3b8' }
                                            ]}>આગળની</Text>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={18}
                                                color={currentSlideIndex === presentationData.slides.length - 1 ? '#94a3b8' : '#FFFFFF'}
                                            />
                                        </AnimatedPressable>
                                    </View>

                                    {/* Teacher Lecture Explanation Card (Always Visible to fill screen with value) */}
                                    <View style={styles.speakerNotesCard}>
                                        <View style={styles.speakerNotesHeader}>
                                            <Ionicons name="school-outline" size={18} color="#c2410c" />
                                            <Text style={styles.speakerNotesTitle}>👨‍🏫 શિક્ષકની વિસ્તૃત સમજૂતી અને લેક્ચર સ્ક્રિપ્ટ</Text>
                                        </View>
                                        <Text style={styles.speakerNotesBody}>
                                            {presentationData.slides[currentSlideIndex]?.speaker_notes ||
                                                `આ સ્લાઇડમાં ${chapterTitle} ના મુખ્ય મુદ્દાઓની વિગતે ચર્ચા કરવામાં આવી છે. વિદ્યાર્થીઓએ આ મુદ્દાઓને પાઠ્યપુસ્તક સાથે જોડીને અભ્યાસ કરવો.`}
                                        </Text>
                                    </View>

                                    {/* All Slides Overview Deck (Prevents Blank Screen) */}
                                    <View style={styles.slideDeckSection}>
                                        <Text style={styles.slideDeckSectionTitle}>📑 તમામ સ્લાઇડ્સની સૂચિ (Jump to Slide)</Text>
                                        <View style={styles.slideDeckGrid}>
                                            {presentationData.slides.map((s: any, sIdx: number) => (
                                                <AnimatedPressable
                                                    key={sIdx}
                                                    style={[styles.slideDeckItem, sIdx === currentSlideIndex && styles.slideDeckItemActive]}
                                                    onPress={() => setCurrentSlideIndex(sIdx)}
                                                    scaleTo={0.96}
                                                >
                                                    <View style={[styles.slideDeckNumBadge, sIdx === currentSlideIndex && styles.slideDeckNumBadgeActive]}>
                                                        <Text style={[styles.slideDeckNumText, sIdx === currentSlideIndex && styles.slideDeckNumTextActive]}>
                                                            {sIdx + 1}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.slideDeckItemTitle} numberOfLines={1}>{s.title}</Text>
                                                        {s.subtitle ? (
                                                            <Text style={{ fontSize: 11, color: '#64748b' }} numberOfLines={1}>{s.subtitle}</Text>
                                                        ) : null}
                                                    </View>
                                                    {sIdx === currentSlideIndex && (
                                                        <Ionicons name="play-circle" size={18} color="#ea580c" />
                                                    )}
                                                </AnimatedPressable>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptyStateBox}>
                                    <Ionicons name="easel-outline" size={42} color="#94a3b8" />
                                    <Text style={styles.emptyStateTitle}>સ્લાઇડ્સ ઉપલબ્ધ નથી</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {/* ─── TAB 5: વિશ્લેષણ (REPORT) ─── */}
                    {activeTab === 'report' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* KPI 4 Cards Grid */}
                            <View style={styles.kpiGrid}>
                                <View style={styles.kpiCard}>
                                    <Text style={styles.kpiValueText}>{reportData?.total_pages || chapter.endPage || 16}</Text>
                                    <Text style={styles.kpiLabelText}>કુલ પાના</Text>
                                </View>
                                <View style={styles.kpiCard}>
                                    <Text style={styles.kpiValueText}>{structureData.length || 6}</Text>
                                    <Text style={styles.kpiLabelText}>સંરચિત વિભાગો</Text>
                                </View>
                                <View style={styles.kpiCard}>
                                    <Text style={styles.kpiValueText}>{reportData?.estimated_study_hours || 4} કલાક</Text>
                                    <Text style={styles.kpiLabelText}>અધ્યયન સમય</Text>
                                </View>
                                <View style={styles.kpiCard}>
                                    <Text style={styles.kpiValueText}>{reportData?.reading_level || 'મધ્યમ'}</Text>
                                    <Text style={styles.kpiLabelText}>મુશ્કેલી સ્તર</Text>
                                </View>
                            </View>

                            {/* Bloom's Taxonomy Cognitive Distribution */}
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardSectionHeading}>📊 બ્લૂમ્સ ટેક્સોનોમી વિશ્લેષણ (Cognitive Distribution)</Text>
                                {[
                                    { name: 'યાદ રાખવું (Remembering)', pct: 25, color: '#3b82f6' },
                                    { name: 'સમજવું (Understanding)', pct: 35, color: '#10b981' },
                                    { name: 'ઉપયોગ કરવો (Applying)', pct: 20, color: '#f59e0b' },
                                    { name: 'વિશ્લેષણ (Analyzing)', pct: 12, color: '#8b5cf6' },
                                    { name: 'મૂલ્યાંકન (Evaluating)', pct: 8, color: '#ec4899' },
                                ].map((item, i) => (
                                    <View key={i} style={styles.bloomBarRow}>
                                        <View style={styles.bloomBarLabelRow}>
                                            <Text style={styles.bloomBarLabel}>{item.name}</Text>
                                            <Text style={[styles.bloomBarPct, { color: item.color }]}>{item.pct}%</Text>
                                        </View>
                                        <View style={styles.bloomBarTrack}>
                                            <View style={[styles.bloomBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Key Themes */}
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardSectionHeading}>🏷️ મુખ્ય શિક્ષણ થીમ્સ (Key Themes)</Text>
                                <View style={styles.themesWrap}>
                                    {(reportData?.key_themes || [chapterTitle, 'સંકલ્પના સ્પષ્ટતા', 'સ્વાધ્યાય મહાવરો', 'નૈતિક મૂલ્યો']).map((theme: string, tI: number) => (
                                        <View key={tI} style={styles.themeBadge}>
                                            <Text style={styles.themeBadgeText}>#{theme}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Expected Learning Outcomes */}
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardSectionHeading}>🎯 અધ્યયન નિષ્પત્તિઓ (Learning Outcomes)</Text>
                                {(reportData?.learning_outcomes || [
                                    'વિદ્યાર્થીઓ પ્રકરણના મુખ્ય સિદ્ધાંતો સરળતાથી સમજી શકશે.',
                                    'વિદ્યાર્થીઓ શબ્દાર્થ અને વાક્ય પ્રયોગમાં સક્ષમ બનશે.',
                                    'પ્રશ્નોના ઉત્તરો તાર્કિક રીતે લખવાનો મહાવરો થશે.',
                                    'સ્વયં-મૂલ્યાંકન દ્વારા પોતાની તૈયારીનું આકલન કરી શકશે.'
                                ]).map((outcome: string, oI: number) => (
                                    <View key={oI} style={styles.outcomeRow}>
                                        <Ionicons name="checkmark-circle" size={17} color="#059669" style={{ marginRight: 8, marginTop: 2 }} />
                                        <Text style={styles.outcomeText}>{outcome}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* ─── TAB 6: ક્વિઝ (QUIZ - ૧૦ પ્રશ્નો) ─── */}
                    {activeTab === 'quiz' && (
                        <ScrollView
                            style={styles.tabScrollView}
                            contentContainerStyle={styles.contentScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {quizFinished ? (
                                /* Result Summary */
                                <View style={styles.quizSummaryCard}>
                                    <View style={styles.trophyIconBox}>
                                        <Text style={{ fontSize: 44 }}>🏆</Text>
                                    </View>
                                    <Text style={styles.quizSummaryTitle}>કસોટી પૂર્ણ થઈ!</Text>
                                    <Text style={styles.quizScoreBig}>
                                        {calculateQuizScore()} / {(quizData?.questions || []).length}
                                    </Text>
                                    <Text style={styles.quizScorePct}>
                                        સફળતા દર: {Math.round((calculateQuizScore() / Math.max(1, (quizData?.questions || []).length)) * 100)}%
                                    </Text>

                                    <View style={styles.quizRatingBadge}>
                                        <Text style={styles.quizRatingText}>
                                            {calculateQuizScore() >= 8 ? '🌟 ઉત્કૃષ્ટ પરિણામ (Excellent)!' : calculateQuizScore() >= 5 ? '👍 સારું પરિણામ (Good Job)!' : '📖 વધુ અભ્યાસ જરૂરી (Keep Learning)'}
                                        </Text>
                                    </View>

                                    <AnimatedPressable
                                        style={styles.retakeQuizBtn}
                                        onPress={() => {
                                            setSelectedQuizAnswers({});
                                            setCurrentQuizIndex(0);
                                            setQuizFinished(false);
                                        }}
                                        scaleTo={0.96}
                                    >
                                        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.retakeQuizBtnText}>ફરીથી ક્વિઝ આપો (Retake Quiz)</Text>
                                    </AnimatedPressable>
                                </View>
                            ) : quizData?.questions && quizData.questions.length > 0 ? (
                                <View style={{ gap: 12 }}>
                                    {/* Question Header & Score */}
                                    <View style={styles.quizHeaderRow}>
                                        <Text style={styles.quizQIndexText}>
                                            પ્રશ્ન {currentQuizIndex + 1} / {quizData.questions.length}
                                        </Text>
                                        <Text style={styles.quizScoreLiveText}>
                                            સ્કોર: {calculateQuizScore()} ગુણ
                                        </Text>
                                    </View>

                                    {/* Progress Bar */}
                                    <View style={styles.quizProgressBarTrack}>
                                        <View
                                            style={[
                                                styles.quizProgressBarFill,
                                                { width: `${((currentQuizIndex + 1) / quizData.questions.length) * 100}%` }
                                            ]}
                                        />
                                    </View>

                                    {/* Question Body Card */}
                                    <View style={styles.quizCard}>
                                        <Text style={styles.quizQuestionText}>
                                            {quizData.questions[currentQuizIndex]?.question}
                                        </Text>

                                        {/* Options */}
                                        <View style={styles.quizOptionsList}>
                                            {(quizData.questions[currentQuizIndex]?.options || []).map((opt: string, optI: number) => {
                                                const selectedOpt = selectedQuizAnswers[currentQuizIndex];
                                                const isAnswered = selectedOpt !== undefined;
                                                const isThisSelected = selectedOpt === optI;
                                                const isCorrect = quizData.questions[currentQuizIndex]?.correct_index === optI;
                                                const letterLabel = ['A', 'B', 'C', 'D'][optI] || `${optI + 1}`;

                                                let btnStyle: any = styles.quizOptionBtn;
                                                let textStyle: any = styles.quizOptionText;

                                                if (isAnswered) {
                                                    if (isCorrect) {
                                                        btnStyle = [styles.quizOptionBtn, styles.quizOptionCorrect];
                                                        textStyle = [styles.quizOptionText, styles.quizOptionTextCorrect];
                                                    } else if (isThisSelected) {
                                                        btnStyle = [styles.quizOptionBtn, styles.quizOptionWrong];
                                                        textStyle = [styles.quizOptionText, styles.quizOptionTextWrong];
                                                    }
                                                }

                                                return (
                                                    <AnimatedPressable
                                                        key={optI}
                                                        style={btnStyle}
                                                        onPress={() => handleQuizOption(currentQuizIndex, optI)}
                                                        disabled={isAnswered}
                                                        scaleTo={0.97}
                                                    >
                                                        <View style={styles.optionLetterBadge}>
                                                            <Text style={styles.optionLetterText}>{letterLabel}</Text>
                                                        </View>
                                                        <Text style={textStyle}>{opt}</Text>
                                                        {isAnswered && isCorrect && (
                                                            <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                                        )}
                                                        {isAnswered && isThisSelected && !isCorrect && (
                                                            <Ionicons name="close-circle" size={20} color="#dc2626" />
                                                        )}
                                                    </AnimatedPressable>
                                                );
                                            })}
                                        </View>

                                        {/* Explanation */}
                                        {selectedQuizAnswers[currentQuizIndex] !== undefined && (
                                            <View style={styles.quizExplanationBox}>
                                                <Text style={styles.quizExplTitle}>💡 સાચા જવાબની સમજૂતી:</Text>
                                                <Text style={styles.quizExplContent}>
                                                    {quizData.questions[currentQuizIndex]?.explanation || 'યોગ્ય વિકલ્પ પાઠના વિષયવસ્તુના આધારે પસંદ કરવામાં આવ્યો છે.'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Next or Finish Button */}
                                    {selectedQuizAnswers[currentQuizIndex] !== undefined && (
                                        <AnimatedPressable
                                            style={styles.quizNextBtn}
                                            onPress={() => {
                                                if (currentQuizIndex < quizData.questions.length - 1) {
                                                    setCurrentQuizIndex(prev => prev + 1);
                                                } else {
                                                    setQuizFinished(true);
                                                }
                                            }}
                                            scaleTo={0.96}
                                        >
                                            <Text style={styles.quizNextBtnText}>
                                                {currentQuizIndex < quizData.questions.length - 1 ? 'આગળનો પ્રશ્ન ➔' : 'પરિણામ જુઓ 🏆'}
                                            </Text>
                                        </AnimatedPressable>
                                    )}

                                    {/* Question Palette Navigation (Prevents Blank Screen) */}
                                    <View style={styles.quizPaletteSection}>
                                        <Text style={styles.quizPaletteTitle}>🎯 પ્રશ્ન નેવિગેટર (Jump to Question):</Text>
                                        <View style={styles.quizPaletteGrid}>
                                            {quizData.questions.map((_: any, pI: number) => {
                                                const isAns = selectedQuizAnswers[pI] !== undefined;
                                                const isCur = pI === currentQuizIndex;
                                                return (
                                                    <AnimatedPressable
                                                        key={pI}
                                                        style={[
                                                            styles.quizPaletteBtn,
                                                            isAns && styles.quizPaletteBtnAnswered,
                                                            isCur && styles.quizPaletteBtnCurrent,
                                                        ]}
                                                        onPress={() => setCurrentQuizIndex(pI)}
                                                        scaleTo={0.92}
                                                    >
                                                        <Text style={[
                                                            styles.quizPaletteBtnText,
                                                            isAns && styles.quizPaletteBtnTextAnswered,
                                                            isCur && styles.quizPaletteBtnTextCurrent,
                                                        ]}>
                                                            {pI + 1}
                                                        </Text>
                                                    </AnimatedPressable>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptyStateBox}>
                                    <Ionicons name="help-circle-outline" size={42} color="#94a3b8" />
                                    <Text style={styles.emptyStateTitle}>ક્વિઝ ઉપલબ્ધ નથી</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {/* ─── TAB 7: AI CHAT (ટ્યુટર) ─── */}
                    {activeTab === 'chat' && (
                        <KeyboardAvoidingView
                            style={{ flex: 1 }}
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                        >
                            {sessionError && (
                                <View style={styles.sessionErrorBanner}>
                                    <Ionicons name="cloud-offline-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text style={styles.sessionErrorTitle}>સર્વર જોડાણ નથી</Text>
                                    <AnimatedPressable style={styles.sessionRetryBtn} onPress={retrySession} scaleTo={0.90}>
                                        <Text style={styles.sessionRetryBtnText}>ફરી જોડો</Text>
                                    </AnimatedPressable>
                                </View>
                            )}

                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={item => item.id}
                                contentContainerStyle={[styles.chatList, { flexGrow: 1 }]}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                renderItem={({ item, index }) => {
                                    const isUser = item.role === 'user';
                                    const isLast = index === messages.length - 1;
                                    return (
                                        <View style={[
                                            styles.msgRow,
                                            isUser ? styles.msgUser : styles.msgAssistant,
                                            isLast && { marginBottom: 12 }
                                        ]}>
                                            {!isUser && (
                                                <View style={styles.aiAvatar}>
                                                    <Text style={styles.aiAvatarText}>🤖</Text>
                                                </View>
                                            )}
                                            <View style={styles.msgBubbleWrapper}>
                                                <View style={[
                                                    styles.msgBubble,
                                                    isUser ? styles.bubbleUser : styles.bubbleAssistant
                                                ]}>
                                                    <Text style={[
                                                        styles.msgText,
                                                        isUser ? styles.txtUser : styles.txtAssistant
                                                    ]}>
                                                        {item.content}
                                                    </Text>

                                                    {/* Citations Card */}
                                                    {!isUser && (
                                                        <AnimatedPressable
                                                            style={styles.citationBadgeCard}
                                                            onPress={() => openPDFAtPage(item.pageNumber || chapter.bookStartPage || chapter.startPage || 1)}
                                                            scaleTo={0.96}
                                                        >
                                                            <View style={styles.citationBadgeHeader}>
                                                                <Ionicons name="book" size={13} color="#2563eb" />
                                                                <Text style={styles.citationChapterName} numberOfLines={1}>
                                                                    {chapterTitle}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.citationBadgeFooter}>
                                                                <Text style={styles.citationPageNoText}>
                                                                    📖 પાઠ્યપુસ્તક પાનું: {item.pageNumber || chapter.bookStartPage || chapter.startPage || 1}
                                                                </Text>
                                                                <Text style={styles.citationRedirectText}>ખોલો ➔</Text>
                                                            </View>
                                                        </AnimatedPressable>
                                                    )}
                                                </View>
                                                <Text style={[
                                                    styles.msgTime,
                                                    isUser ? styles.msgTimeUser : styles.msgTimeAssistant
                                                ]}>
                                                    {formatTime(item.timestamp)}
                                                </Text>
                                            </View>
                                            {isUser && (
                                                <View style={styles.userAvatar}>
                                                    <Ionicons name="person" size={13} color="#FFFFFF" />
                                                </View>
                                            )}
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={
                                    <View style={styles.emptyChat}>
                                        <View style={styles.emptyChatIconBg}>
                                            <Text style={styles.emptyChatEmoji}>🤖</Text>
                                        </View>
                                        <Text style={styles.emptyChatTitle}>AI ડાઉટ સોલ્વર — {chapterTitle}</Text>
                                        <Text style={styles.emptyChatSub}>
                                            આ પ્રકરણમાંથી કોઈપણ પ્રશ્ન પૂછો. AI સીધા પાઠ્યપુસ્તકમાંથી સચોટ ઉત્તર આપશે!
                                        </Text>

                                        <Text style={styles.emptyQuickTitle}>ઝડપી પ્રશ્નો 👇</Text>
                                        <View style={styles.emptyChipsGrid}>
                                            {[
                                                { icon: '📖', category: 'સારાંશ', text: `"${chapterTitle}" પ્રકરણનો સંક્ષિપ્ત સારાંશ આપો.` },
                                                { icon: '📝', category: 'IMP મુદ્દા', text: `"${chapterTitle}" પ્રકરણના ૫ મહત્વના મુદ્દા જણાવો.` },
                                                { icon: '✏️', category: 'સ્વાધ્યાય', text: `"${chapterTitle}" ના સ્વાધ્યાયના પ્રશ્નોત્તર સમજાવો.` },
                                                { icon: '🎯', category: 'MCQ', text: `"${chapterTitle}" ના ૫ MCQ પ્રશ્નો પૂછો.` },
                                            ].map((q, idx) => (
                                                <AnimatedPressable
                                                    key={idx}
                                                    style={styles.emptyChip}
                                                    onPress={() => handleSend(q.text)}
                                                    scaleTo={0.97}
                                                >
                                                    <Text style={{ fontSize: 16, marginRight: 8 }}>{q.icon}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.emptyChipCategory}>{q.category}</Text>
                                                        <Text style={styles.emptyChipText} numberOfLines={2}>{q.text}</Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={15} color="#94a3b8" />
                                                </AnimatedPressable>
                                            ))}
                                        </View>
                                    </View>
                                }
                            />

                            {/* Typing indicator */}
                            {chatLoading && (
                                <View style={styles.typingIndicator}>
                                    <View style={styles.aiAvatar}>
                                        <Text style={styles.aiAvatarText}>🤖</Text>
                                    </View>
                                    <View style={[styles.typingBubble, { maxWidth: '85%' }]}>
                                        <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
                                        <Text style={styles.typingText}>
                                            {chatLoadingStage === 0 && 'AI ઉત્તર તૈયાર કરી રહ્યો છે...'}
                                            {chatLoadingStage === 1 && 'પાઠ્યપુસ્તકમાંથી સંદર્ભો શોધી રહ્યા છીએ...'}
                                            {chatLoadingStage === 2 && 'સર્વર સક્રિય થઈ રહ્યું છે, જવાબ આવી રહ્યો છે... ⏳'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Image preview */}
                            {selectedImage && (
                                <View style={styles.imagePreviewRow}>
                                    <Image source={{ uri: selectedImage.uri }} style={styles.imagePreviewThumb} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.imagePreviewName} numberOfLines={1}>{selectedImage.name}</Text>
                                        <Text style={styles.imagePreviewSub}>ફોટો જોડાયેલ છે</Text>
                                    </View>
                                    <AnimatedPressable onPress={() => setSelectedImage(null)} scaleTo={0.85}>
                                        <Ionicons name="close-circle" size={22} color={studentColors.error} />
                                    </AnimatedPressable>
                                </View>
                            )}

                            {/* Chat Input Bar */}
                            <View style={styles.chatInputBar}>
                                <AnimatedPressable
                                    onPress={handleVoicePress}
                                    style={[styles.inputActionBtn, recording && styles.inputActionBtnActive]}
                                    scaleTo={0.90}
                                >
                                    <Ionicons
                                        name={recording ? 'mic-sharp' : 'mic-outline'}
                                        size={20}
                                        color={recording ? '#FFFFFF' : '#2563eb'}
                                    />
                                </AnimatedPressable>

                                <AnimatedPressable onPress={handlePickImage} style={styles.inputActionBtn} scaleTo={0.90}>
                                    <Ionicons name="camera-outline" size={20} color="#2563eb" />
                                </AnimatedPressable>

                                <TextInput
                                    ref={inputRef}
                                    style={styles.chatTextInput}
                                    placeholder="આ પ્રકરણમાંથી પ્રશ્ન પૂછો..."
                                    placeholderTextColor="#94a3b8"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    maxLength={600}
                                />

                                <AnimatedPressable
                                    style={[
                                        styles.chatSendBtn,
                                        (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled
                                    ]}
                                    onPress={() => handleSend()}
                                    disabled={!inputText.trim() && !selectedImage}
                                    scaleTo={0.90}
                                >
                                    <Ionicons name="send" size={16} color="#FFFFFF" />
                                </AnimatedPressable>
                            </View>
                        </KeyboardAvoidingView>
                    )}
                </View>
            )}

            {/* Chapter Notes Bottom Sheet Modal */}
            {notesModalVisible && (
                <Modal
                    visible={notesModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setNotesModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: 20 }}>📝</Text>
                                    <Text style={styles.modalTitle}>મારી નોંધ (Notes)</Text>
                                </View>
                                <AnimatedPressable onPress={() => setNotesModalVisible(false)} scaleTo={0.88}>
                                    <Ionicons name="close-circle" size={24} color="#94a3b8" />
                                </AnimatedPressable>
                            </View>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="આ પ્રકરણ વાંચતી વખતે અગત્યના મુદ્દા અહીં નોંધો..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                value={chapterNotes}
                                onChangeText={saveChapterNotes}
                                textAlignVertical="top"
                            />
                            <AnimatedPressable style={styles.saveNotesBtn} onPress={() => setNotesModalVisible(false)} scaleTo={0.96}>
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.saveNotesText}>સાચવો અને બંધ કરો</Text>
                            </AnimatedPressable>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Voice Speech Modal & Hidden WebView */}
            {voiceModalVisible && (
                <Modal
                    visible={voiceModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                        setRecording(false);
                        setVoiceModalVisible(false);
                    }}
                >
                    <View style={styles.voiceModalOverlay}>
                        <View style={styles.voiceModalContent}>
                            <View style={styles.voiceRingOuter}>
                                <View style={styles.voiceRingMid}>
                                    <View style={styles.voiceRingInner}>
                                        <Ionicons name="mic" size={36} color="#FFFFFF" />
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.voiceModalTitle}>🎤 ગુજરાતીમાં બોલો</Text>
                            <Text style={styles.voiceModalStatus} numberOfLines={3}>{voiceStatus}</Text>
                            <AnimatedPressable
                                onPress={() => {
                                    setRecording(false);
                                    setVoiceModalVisible(false);
                                    webViewRef.current?.postMessage('stop');
                                }}
                                style={styles.voiceModalCancelBtn}
                                scaleTo={0.94}
                            >
                                <Ionicons name="stop-circle" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                                <Text style={styles.voiceModalCancelText}>બોલવાનું પૂરું થયું</Text>
                            </AnimatedPressable>
                        </View>
                    </View>
                    <WebView
                        ref={webViewRef}
                        source={{ html: webViewHTML }}
                        onMessage={onWebViewMessage}
                        javaScriptEnabled={true}
                        style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
                    />
                </Modal>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Generator Utilities (Ensures UI is ALWAYS filled with rich content)
// ─────────────────────────────────────────────────────────────────────────────
function getFallbackNotes(title: string, _ch: Chapter) {
    return {
        summary: `આ પાઠ "${title}" માં અભ્યાસક્રમ આધારિત મુખ્ય સંકલ્પનાઓ, વ્યાવહારિક દ્રષ્ટાંતો અને જીવનમૂલ્યોનું વિસ્તૃત વિશ્લેષણ આપવામાં આવ્યું છે. વિદ્યાર્થીઓએ આ પ્રકરણનું ઊંડાણપૂર્વક અધ્યયન કરીને મુખ્ય સિદ્ધાંતો આત્મસાત કરવા જરૂરી છે.`,
        key_points: [
            `${title} પ્રકરણના કેન્દ્રવર્તી વિચાર અને ઉદ્દેશ્યોનું પદ્ધતિસરનું અધ્યયન.`,
            `મુખ્ય સંકલ્પનાઓનું સરળ ઉદાહરણો સાથે તાર્કિક વિશ્લેષણ.`,
            `જીવનમાં ઉપયોગી વ્યાવહારિક દ્રષ્ટાંતો અને નૈતિક મૂલ્યોનું ઘડતર.`,
            `પરીક્ષાલક્ષી અગત્યના પ્રશ્નો અને સ્વાધ્યાયના મુદ્દાઓની સ્પષ્ટતા.`,
            `વિદ્યાર્થીઓ માટે સ્વતંત્ર વિચારસરણી અને સર્જનાત્મક અભિવ્યક્તિનો વિકાસ.`
        ],
        vocabulary: [
            { word: 'વિભાવના', meaning: 'કોઈપણ વિષયવસ્તુનો મૂળ વિચાર કે સંકલ્પના', usage: 'આ પ્રકરણમાં મુખ્ય વિભાવનાઓ સુંદર રીતે સમજાવી છે.' },
            { word: 'અધ્યયન', meaning: 'ધ્યાનપૂર્વક અભ્યાસ કે શિક્ષણ મેળવવાની પ્રક્રિયા', usage: 'નિયમિત અધ્યયન કરવાથી ઉત્તમ પરિણામ મળે છે.' },
            { word: 'મૂલ્યાંકન', meaning: 'જ્ઞાન અને ક્ષમતાની યોગ્ય કસોટી કરવી', usage: 'એકમ કસોટી દ્વારા વિદ્યાર્થીઓનું મૂલ્યાંકન થાય છે.' },
            { word: 'વિશ્લેષણ', meaning: 'કોઈપણ બાબતનું બારીકાઈથી છણાવટપૂર્વક નિરીક્ષણ', usage: 'પ્રશ્નોના ઉત્તરો આપતી વખતે વિશ્લેષણ જરૂરી છે.' },
        ],
        study_tips: [
            'દરરોજ પાઠ્યપુસ્તકના પાનાઓનું ધ્યાનપૂર્વક મુખર વાચન કરવું.',
            'અજાણ્યા શબ્દો નીચે પેન્સિલથી અંડરલાઇન કરીને શબ્દાર્થ નોંધવા.',
            'સ્વાધ્યાયના પ્રશ્નોના જવાબો જાતે નોટબુકમાં લખવાનો મહાવરો કરવો.',
            'આદર્શ પ્રશ્નપત્ર અને ક્વિઝ દ્વારા સમયબદ્ધ સ્વયં-મૂલ્યાંકન કરવું.'
        ]
    };
}

function getFallbackQuiz(title: string) {
    return {
        title: `${title} - ઇન્ટરેક્ટિવ ક્વિઝ (Interactive Quiz)`,
        time_limit_mins: 15,
        questions: [
            {
                id: 'q1',
                question: `પ્રકરણ "${title}" ના કેન્દ્રવર્તી વિચાર સંદર્ભે નીચેનામાંથી કયું વિધાન સાચું છે?`,
                options: [
                    'આ પાઠ વિદ્યાર્થીઓમાં વિષયવસ્તુની ઊંડી સમજ અને નૈતિકતા કેળવે છે.',
                    'આ પાઠ માત્ર ગોખણપટ્ટી કરવા માટે જ આપવામાં આવ્યો છે.',
                    'આ પ્રકરણમાં કોઈ શિક્ષણ ઉદ્દેશ્ય રહેલો નથી.',
                    'ઉપરના તમામ વિકલ્પો ખોટા છે.'
                ],
                correct_index: 0,
                explanation: `${title} પાઠનો મૂળભૂત હેતુ વિદ્યાર્થીઓમાં વિષયવસ્તુની ઊંડી વૈચારિક સમજ અને સંસ્કારોનું સિંચન કરવાનો છે.`
            },
            {
                id: 'q2',
                question: 'પાઠ્યપુસ્તકના સ્વાધ્યાય કાર્યનો મુખ્ય હેતુ શું છે?',
                options: [
                    'પરીક્ષામાં વધુ ગુણ લાવવા માટે ગોખણપટ્ટી કરવી.',
                    'વિદ્યાર્થીઓની સર્જનાત્મકતા, વિચારશક્તિ અને અભિવ્યક્તિ વિકસાવવી.',
                    'સમય પસાર કરવો.',
                    'માત્ર શિક્ષકને બતાવવા ખાતર લખવું.'
                ],
                correct_index: 1,
                explanation: 'સ્વાધ્યાયથી વિદ્યાર્થીઓ પોતાની મૌલિક ભાષામાં ઉત્તરો લખવા પ્રેરાય છે અને તેમની વિચારશક્તિ ખીલે છે.'
            },
            {
                id: 'q3',
                question: 'પ્રકરણના અધ્યયન પછી વિદ્યાર્થીઓએ કઈ બાબત પર વિશેષ ધ્યાન આપવું જોઈએ?',
                options: [
                    'મહત્વના પારિભાષિક શબ્દો અને તેના અર્થ સમજવા.',
                    'ચાવીરૂપ પ્રશ્નોત્તરીનો લેખિત મહાવરો કરવો.',
                    'મુદ્દાસર અને સ્વચ્છ અક્ષરે જવાબો લખવા.',
                    'આપેલ તમામ બાબતો સાચી છે.'
                ],
                correct_index: 3,
                explanation: 'શબ્દાર્થ, લેખિત મહાવરો અને સ્વચ્છ લખાણ - ત્રણેય પાસાં ઉત્તમ અધ્યયન માટે અનિવાર્ય છે.'
            },
            {
                id: 'q4',
                question: 'આ પ્રકરણમાં આપેલા ઉદાહરણો વિદ્યાર્થીઓને કઈ રીતે ઉપયોગી બને છે?',
                options: [
                    'વિભાવનાને વાસ્તવિક જીવન સાથે જોડીને સરળતાથી સમજવામાં.',
                    'પાનાની સંખ્યા વધારવામાં.',
                    'માત્ર વાંચીને ભૂલી જવામાં.',
                    'કોઈપણ રીતે ઉપયોગી નથી.'
                ],
                correct_index: 0,
                explanation: 'જીવનસ્પર્શી ઉદાહરણો અઘરા વિષયને પણ સરળ અને રસપ્રદ બનાવી દે છે.'
            },
            {
                id: 'q5',
                question: 'કસોટી આપતી વખતે સૌથી મહત્વપૂર્ણ બાબત કઈ છે?',
                options: [
                    'પ્રશ્નને શાંતિપૂર્વક વાંચીને ચોકસાઈથી સમજી લેવો.',
                    'ગમે તેમ ઉતાવળ કરીને ઉત્તર ટીક કરી દેવો.',
                    'જવાબ ન આવડે તો અંદાજ લગાવી છોડી દેવું.',
                    'બીજા વિદ્યાર્થીઓની નકલ કરવી.'
                ],
                correct_index: 0,
                explanation: 'પ્રશ્નને ધ્યાનપૂર્વક વાંચીને સમજવાથી ભૂલો થતી અટકે છે અને સાચો ઉત્તર આપી શકાય છે.'
            }
        ]
    };
}

function getFallbackPresentation(title: string, ch: Chapter) {
    return {
        chapter_title: title,
        slides: [
            {
                slide_number: 1,
                title: title,
                subtitle: `શૈક્ષણિક પ્રસ્તુતિ • ધોરણ ${ch.standardId} • ${ch.subjectId}`,
                bullets: [
                    'પ્રકરણનું શીર્ષક અને વિષય પરિચય',
                    'અભ્યાસક્રમ અને શિક્ષણ હેતુઓ',
                    'જીવનલક્ષી શિક્ષણ અને મૂલ્યો'
                ],
                highlight: 'શિક્ષણ એ માત્ર માહિતી મેળવવી નથી, પણ જીવન ઘડતરની પ્રક્રિયા છે.',
                speaker_notes: 'શિક્ષકે વર્ગખંડમાં પાઠ શરૂ કરતા પહેલા વિદ્યાર્થીઓનું પૂર્વજ્ઞાન ચકાસવું અને વિષય પ્રવેશ કરાવવો.'
            },
            {
                slide_number: 2,
                title: 'શિક્ષણ ઉદ્દેશ્યો (Learning Objectives)',
                subtitle: 'આ પ્રકરણ શીખ્યા પછી વિદ્યાર્થીઓ શું શીખશે?',
                bullets: [
                    'પ્રકરણના કેન્દ્રવર્તી વિષયવસ્તુનું ઊંડાણપૂર્વક જ્ઞાન મેળવશે.',
                    'નવા શબ્દો, રૂઢિપ્રયોગો અને શબ્દાર્થનો સચોટ અર્થ સમજશે.',
                    'વ્યાવહારિક જીવનમાં સંકલ્પનાઓનું પ્રયોજન કરી શકશે.',
                    'મૌલિક લેખન અને અભિવ્યક્તિ શૈલીનો વિકાસ થશે.'
                ],
                highlight: 'ઉદ્દેશ્ય આધારિત શિક્ષણ વિદ્યાર્થીઓમાં લાંબાગાળાનું અધ્યયન સુનિશ્ચિત કરે છે.',
                speaker_notes: 'વિદ્યાર્થીઓને સ્પષ્ટ જણાવવું કે આજના તાસમાં આપણે કયા ચોક્કસ કૌશલ્યો શીખવાના છીએ.'
            },
            {
                slide_number: 3,
                title: 'મુખ્ય વિષયવસ્તુ અને વિશ્લેષણ',
                subtitle: 'વિષયના પાયાના સિદ્ધાંતો',
                bullets: [
                    'વિષયવસ્તુની તાર્કિક ક્રમબદ્ધ રજૂઆત',
                    'ઉદાહરણો અને પ્રાયોગિક દ્રષ્ટાંતો દ્વારા સમજૂતી',
                    'વિદ્યાર્થીઓ સાથે સવાલ-જવાબ અને ચર્ચા',
                    'મહત્વના મુદ્દાઓની બોર્ડ વર્ક પર નોંધણી'
                ],
                highlight: 'મુદ્દાસર સમજૂતી વિષયને વધુ આત્મસાત બનાવે છે.',
                speaker_notes: 'વિદ્યાર્થીઓને પોતાની નોટબુકમાં મુખ્ય મુદ્દાઓ ટપકાવવા માટે પ્રેરિત કરવા.'
            },
            {
                slide_number: 4,
                title: 'પારિભાષિક શબ્દો અને શબ્દભંડોળ',
                subtitle: 'ભાષા સમૃદ્ધિ અને અર્થબોધ',
                bullets: [
                    'પાઠમાં આવતા નવા અને મહત્વના શબ્દોની યાદી',
                    'શબ્દોના સાચા અર્થ અને સંદર્ભગત સમજૂતી',
                    'વાક્યપ્રયોગ દ્વારા શબ્દનો વ્યવહારિક ઉપયોગ',
                    'વિરોધી અને સમાનાર્થી શબ્દોની ચર્ચા'
                ],
                highlight: 'શબ્દભંડોળની સમૃદ્ધિ એ અસરકારક પ્રત્યાયન અને અભિવ્યક્તિની ચાવી છે.',
                speaker_notes: 'વિદ્યાર્થીઓ પાસે નવા શબ્દોના એક-બે વાક્યો બનાવડાવવા જેથી મહાવરો પાકો થાય.'
            },
            {
                slide_number: 5,
                title: 'સારાંશ અને મૂલ્યાંકન',
                subtitle: 'આજના વર્ગખંડ શિક્ષણનું પુનરાવર્તન',
                bullets: [
                    'આજે શીખેલા મહત્વના મુદ્દાઓનું ઝડપી રિવિઝન',
                    'વિદ્યાર્થીઓ માટે મૌખિક પ્રશ્નોત્તરી',
                    'ગૃહકાર્ય અને સ્વાધ્યાયના પ્રશ્નોની સોંપણી',
                    'આવતીકાલના તાસ માટે પૂર્વતૈયારી'
                ],
                highlight: 'દરરોજનું પુનરાવર્તન જ્ઞાનને કાયમી સ્મૃતિમાં પરિવર્તિત કરે છે.',
                speaker_notes: 'તમામ વિદ્યાર્થીઓને સ્વાધ્યાયના પ્રશ્નો જાતે લખવા અને ક્વિઝ અટેમ્પટ કરવા પ્રોત્સાહિત કરવા.'
            }
        ]
    };
}

function getFallbackTestPaper(title: string, ch: Chapter) {
    return {
        title: 'સત્રાંત / એકમ મૂલ્યાંકન કસોટી',
        subject: ch.subjectId,
        grade: `ધોરણ ${ch.standardId}`,
        duration_mins: 60,
        total_marks: 50,
        instructions: [
            'બધા પ્રશ્નોના ઉત્તર આપવા ફરજિયાત છે.',
            'પ્રત્યેક પ્રશ્નની જમણી બાજુ દર્શાવેલ અંક તેના પૂર્ણ ગુણ દર્શાવે છે.',
            'સ્વચ્છ અને સુવાચ્ય અક્ષરે ઉત્તરો લખવા.'
        ],
        sections: [
            {
                name: 'વિભાગ - અ (હેતુલક્ષી પ્રશ્નો / બહુવિકલ્પ)',
                description: 'યોગ્ય વિકલ્પ પસંદ કરો અથવા એક વાક્યમાં ઉત્તર આપો (પ્રત્યેકનો ૧ ગુણ)',
                total_marks: 10,
                questions: [
                    {
                        question: `પ્રકરણ "${title}" નો મુખ્ય હેતુ શો છે?`,
                        options: ['(A) વૈચારિક સમૃદ્ધિ', '(B) ગોખણપટ્ટી', '(C) સમય પસાર કરવો', '(D) એકપણ નહીં'],
                        marks: 1,
                        answer: '(A) વૈચારિક સમૃદ્ધિ અને જીવનમૂલ્યોનું ઘડતર.',
                        explanation: 'પ્રકરણ શિક્ષણનું સાચું લક્ષ્ય વિચારસમૃદ્ધિ છે.'
                    },
                    {
                        question: 'સ્વાધ્યાયના પ્રશ્નો વિદ્યાર્થીઓમાં કયા ગુણનો વિકાસ કરે છે?',
                        options: ['(A) મૌલિક વિચારશક્તિ', '(B) ઉતાવળ', '(C) આળસ', '(D) અનુકરણ'],
                        marks: 1,
                        answer: '(A) મૌલિક વિચારશક્તિ અને સર્જનાત્મકતા.',
                        explanation: 'સ્વાધ્યાયથી સ્વતંત્ર વિચારવાની શક્તિ વિકસે છે.'
                    },
                    {
                        question: 'નવા શબ્દોનું વાક્યમાં પ્રયોજન કરવાથી શું ફાયદો થાય છે?',
                        marks: 1,
                        answer: 'ભાષા અભિવ્યક્તિ વધુ સચોટ અને સમૃદ્ધ બને છે.',
                        explanation: 'શબ્દનો વ્યવહારિક ઉપયોગ ભાષા જ્ઞાન દ્રઢ કરે છે.'
                    }
                ]
            },
            {
                name: 'વિભાગ - બ (ટૂંક જવાબી પ્રશ્નો)',
                description: 'નીચેના પ્રશ્નોના ૨ થી ૩ વાક્યોમાં ઉત્તર આપો (પ્રત્યેકના ૨ ગુણ)',
                total_marks: 10,
                questions: [
                    {
                        question: `પ્રકરણ "${title}" માંથી તમને કયો વિચાર સૌથી વધુ ગમ્યો? શા માટે?`,
                        marks: 2,
                        answer: 'આ પાઠમાં દર્શાવેલ વ્યાવહારિક દ્રષ્ટાંતો અને જીવન ઘડતરના મૂલ્યો સૌથી વધુ પ્રેરણાદાયી છે કારણ કે તે વાસ્તવિક જીવનમાં પણ ઉપયોગી બને છે.',
                        explanation: 'વિદ્યાર્થીઓએ પોતાના અનુભવ સાથે જોડીને ઉત્તર આપવો.'
                    },
                    {
                        question: 'નિયમિત અધ્યયન અને રિવિઝનનું પરીક્ષાની દ્રષ્ટિએ શું મહત્વ છે?',
                        marks: 2,
                        answer: 'નિયમિત વાંચન અને પુનરાવર્તનથી પરીક્ષા સમયે માનસિક તણાવ ઓછો થાય છે અને વિષયવસ્તુ લાંબા સમય સુધી યાદ રહે છે.',
                        explanation: 'સુનિયોજિત અભ્યાસ હંમેશા શ્રેષ્ઠ પરિણામ લાવે છે.'
                    }
                ]
            },
            {
                name: 'વિભાગ - ક (મુદ્દાસર પ્રશ્નો)',
                description: 'નીચેના પ્રશ્નોના મુદ્દાસર ઉત્તર આપો (પ્રત્યેકના ૩ ગુણ)',
                total_marks: 15,
                questions: [
                    {
                        question: `"${title}" પ્રકરણના આધારે તેના મુખ્ય ૩ શિક્ષણ મુદ્દાઓ વિસ્તૃત રીતે સમજાવો.`,
                        marks: 3,
                        answer: '૧. પાઠનો કેન્દ્રવર્તી વિચાર અને તેની પ્રસ્તુતતા. ૨. મહત્વના પારિભાષિક શબ્દો અને તેનો અર્થબોધ. ૩. જીવનમાં ઉતારવા યોગ્ય નૈતિક મૂલ્યો અને વ્યાવહારિક ઉપયોગ.',
                        explanation: 'ત્રણેય મુદ્દાઓને સ્પષ્ટ રીતે ક્રમબદ્ધ સમજાવવા.'
                    }
                ]
            },
            {
                name: 'વિભાગ - ડ (સવિસ્તાર ઉત્તરો)',
                description: 'નીચેના પ્રશ્નોના સવિસ્તાર ઉત્તર આપો (પ્રત્યેકના ૫ ગુણ)',
                total_marks: 15,
                questions: [
                    {
                        question: `આ સમગ્ર પ્રકરણ "${title}" નો સારાંશ તમારી પોતાની મૌલિક ભાષામાં આશરે ૮ થી ૧૦ લીટીમાં લખો.`,
                        marks: 5,
                        answer: 'વિદ્યાર્થીઓએ પ્રકરણના પ્રારંભ, મુખ્ય ઘટનાઓ/વિભાવનાઓ અને નિષ્કર્ષને આવરી લેતો મૌલિક સારાંશ સ્વચ્છ અક્ષરે લખવો.',
                        explanation: 'મૌલિકતા, વ્યાકરણ અને વિષયવસ્તુની સુસંગતતાના આધારે ૫ ગુણનું મૂલ્યાંકન થશે.'
                    }
                ]
            }
        ]
    };
}

function getFallbackReport(title: string, ch: Chapter) {
    return {
        textbook_title: title,
        total_pages: ch.endPage ? Math.max(12, ch.endPage - (ch.startPage || 1) + 1) : 16,
        total_chapters: 1,
        estimated_study_hours: 4,
        reading_level: 'મધ્યમ (Intermediate)',
        key_themes: [title, 'ભાષા સૌંદર્ય', 'સંકલ્પના સ્પષ્ટતા', 'સ્વાધ્યાય મહાવરો', 'જીવનમૂલ્યો'],
        learning_outcomes: [
            'વિદ્યાર્થીઓ પ્રકરણના મૂળભૂત સિદ્ધાંતો સરળતાથી સમજી શકશે.',
            'નવા શબ્દો અને પારિભાષિક સંજ્ઞાઓનું અર્થઘટન કરી શકશે.',
            'પરીક્ષાના વિવિધ પ્રશ્નોના તાર્કિક ઉત્તરો આપવા સક્ષમ બનશે.',
            'સ્વયં-મૂલ્યાંકન દ્વારા પોતાની તૈયારીનું આકલન કરી શકશે.'
        ]
    };
}

function getFallbackStructure(title: string, ch: Chapter) {
    const startP = ch.startPage || 1;
    return [
        {
            title: 'વિભાગ ૧: પરિચય અને પૂર્વભૂમિકા',
            topics: [
                {
                    title: 'પ્રકરણ પરિચય અને વિષય પ્રવેશ',
                    start_page: startP,
                    summary: `${title} પ્રકરણની પૂર્વભૂમિકા અને મુખ્ય શિક્ષણ ઉદ્દેશ્યોની વિસ્તૃત સમજૂતી.`
                },
                {
                    title: 'મૂળભૂત સંકલ્પનાઓ અને સિદ્ધાંત',
                    start_page: startP + 1,
                    summary: 'વિષયવસ્તુના પાયાના સિદ્ધાંતો અને પ્રારંભિક વિભાવનાઓની સ્પષ્ટતા.'
                }
            ]
        },
        {
            title: 'વિભાગ ૨: મુખ્ય વિષયવસ્તુ અને વિશ્લેષણ',
            topics: [
                {
                    title: 'કેન્દ્રવર્તી વિષયવસ્તુ અને વ્યાખ્યાઓ',
                    start_page: startP + 2,
                    summary: 'પ્રકરણના સૌથી મહત્વના શિક્ષણ બિંદુઓ અને વ્યાખ્યાઓનું ઊંડાણપૂર્વક વિશ્લેષણ.'
                },
                {
                    title: 'વ્યાવહારિક ઉદાહરણો અને પ્રયોજન',
                    start_page: startP + 3,
                    summary: 'વાસ્તવિક જીવનના ઉદાહરણો દ્વારા સિદ્ધાંતોનું સરળ ભાષામાં પ્રયોજન.'
                }
            ]
        },
        {
            title: 'વિભાગ ૩: સ્વાધ્યાય અને મૂલ્યાંકન',
            topics: [
                {
                    title: 'પ્રકરણ સારાંશ અને પુનરાવર્તન',
                    start_page: startP + 4,
                    summary: 'તમામ શીખેલા મુદ્દાઓનું ઝડપી રિવિઝન અને મુખ્ય સૂત્રો/સંકલ્પનાઓ.'
                },
                {
                    title: 'સ્વાધ્યાય કાર્ય અને પ્રશ્નોત્તરી',
                    start_page: startP + 5,
                    summary: 'પરીક્ષાલક્ષી સ્વાધ્યાયના પ્રશ્નો અને સ્વયં-અભ્યાસ માટેની માર્ગદર્શિકા.'
                }
            ]
        }
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLESHEET
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topSafeArea: {
        backgroundColor: '#1d4ed8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 8,
        backgroundColor: '#1d4ed8',
    },
    headerIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        paddingHorizontal: 10,
    },
    headerMainTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    headerSubTitle: {
        fontSize: 10.5,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 1,
    },
    headerRightActions: {
        flexDirection: 'row',
        gap: 6,
    },

    // Horizontal Scrolling Tab Bar
    tabScrollWrap: {
        backgroundColor: '#1e40af',
        paddingVertical: 6,
    },
    tabScrollContent: {
        paddingHorizontal: 10,
        gap: 6,
        alignItems: 'center',
    },
    tabPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    tabPillActive: {
        backgroundColor: '#FFFFFF',
        ...shadows.sm,
    },
    tabPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.92)',
    },
    chatBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 10,
        marginLeft: 4,
    },
    chatBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // Loading Assets Box
    loadingAssetsBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    loadingAssetsText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 12,
    },
    loadingAssetsSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },

    // Content Scroll
    contentScroll: {
        padding: 14,
        paddingBottom: 50,
        gap: 12,
        flexGrow: 1,
    },

    mainTabBody: {
        flex: 1,
        width: '100%',
        backgroundColor: '#F8FAFC',
    },
    tabScrollView: {
        flex: 1,
        width: '100%',
    },
    sectionHeaderWrap: {
        marginTop: 4,
        marginBottom: 2,
    },
    sectionHeaderSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    secSubCountText: {
        fontSize: 10.5,
        color: '#64748b',
        marginTop: 1,
    },
    myNotesSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: '#bfdbfe',
        ...shadows.sm,
    },
    myNotesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    myNotesTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1d4ed8',
    },
    myNotesInlineInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        minHeight: 85,
        fontSize: 12.5,
        color: '#1e293b',
        textAlignVertical: 'top',
    },
    myNotesSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 10,
        paddingVertical: 9,
        marginTop: 10,
    },
    myNotesSaveText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    speakerNotesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: '#fed7aa',
        ...shadows.sm,
    },
    speakerNotesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    speakerNotesTitle: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#c2410c',
    },
    speakerNotesBody: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 18,
    },
    slideDeckSection: {
        marginTop: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    slideDeckSectionTitle: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 10,
    },
    slideDeckGrid: {
        gap: 8,
    },
    slideDeckItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    slideDeckItemActive: {
        borderColor: '#ea580c',
        backgroundColor: '#fff7ed',
    },
    slideDeckNumBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    slideDeckNumBadgeActive: {
        backgroundColor: '#ea580c',
    },
    slideDeckNumText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },
    slideDeckNumTextActive: {
        color: '#FFFFFF',
    },
    slideDeckItemTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e293b',
    },
    quizRatingBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#86efac',
        marginTop: 4,
    },
    quizRatingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#15803d',
    },
    optionLetterBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    optionLetterText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#475569',
    },
    quizPaletteSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: '#f3e8ff',
        ...shadows.sm,
    },
    quizPaletteTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#7e22ce',
        marginBottom: 10,
    },
    quizPaletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    quizPaletteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    quizPaletteBtnCurrent: {
        borderColor: '#9333ea',
        backgroundColor: '#f3e8ff',
        borderWidth: 2,
    },
    quizPaletteBtnAnswered: {
        backgroundColor: '#dcfce7',
        borderColor: '#10b981',
    },
    quizPaletteBtnText: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#64748b',
    },
    quizPaletteBtnTextCurrent: {
        color: '#9333ea',
    },
    quizPaletteBtnTextAnswered: {
        color: '#047857',
    },


    // Hero Card (Structure Tab)
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#e0e7ff',
        ...shadows.sm,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badgePill: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    badgePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusCompleted: {
        backgroundColor: '#ecfdf5',
    },
    statusInProgress: {
        backgroundColor: '#fffbeb',
    },
    statusBadgeText: {
        fontSize: 10.5,
        fontWeight: '700',
    },
    statusTextCompleted: {
        color: '#059669',
    },
    statusTextInProgress: {
        color: '#d97706',
    },
    heroTitleText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    heroSubTitleText: {
        fontSize: 12.5,
        color: '#64748b',
        marginTop: 2,
    },
    heroMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 6,
        gap: 4,
    },
    metaItemText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1e40af',
    },
    readPdfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 10,
        marginTop: 6,
    },
    readPdfBtnText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Structure List
    sectionHeaderTitle: {
        fontSize: 13.5,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 4,
    },
    structureList: {
        gap: 10,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 6,
    },
    secNumberBox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secNumberText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    secTitleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    topicsContainer: {
        gap: 8,
        paddingLeft: 6,
    },
    topicItemCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    topicTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topicTitleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        flex: 1,
    },
    topicPageJumpBtn: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    topicPageJumpText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb',
    },
    topicSummaryText: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 15,
    },
    markDoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        borderRadius: 14,
        paddingVertical: 12,
        marginTop: 6,
        ...shadows.sm,
    },
    markDoneBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // ── Notes Styles ───────────────────────────────────────────────
    noteSummaryCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#86efac',
    },
    noteCardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    noteCardIcon: {
        fontSize: 16,
    },
    noteCardHeaderTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#15803d',
    },
    noteSummaryText: {
        fontSize: 12.5,
        color: '#166534',
        lineHeight: 18,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8,
        ...shadows.sm,
    },
    cardSectionHeading: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    keyPointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    keyPointNumBox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 1,
    },
    keyPointNumText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#3730a3',
    },
    keyPointText: {
        fontSize: 12,
        color: '#334155',
        flex: 1,
        lineHeight: 17,
    },
    vocabCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 3,
    },
    vocabTopRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    vocabWord: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#d97706',
    },
    vocabMeaning: {
        fontSize: 12,
        color: '#334155',
    },
    vocabUsage: {
        fontSize: 11,
        color: '#64748b',
        fontStyle: 'italic',
    },
    studyTipsCard: {
        backgroundColor: '#fffbeb',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#fde68a',
        gap: 6,
    },
    studyTipItem: {
        fontSize: 12,
        color: '#92400e',
        lineHeight: 17,
    },
    openMyNotesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    openMyNotesBtnText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#2563eb',
    },

    // ── Test Paper Styles ──────────────────────────────────────────
    examHeaderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        ...shadows.sm,
        gap: 8,
    },
    examTitleText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },
    examBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
    },
    examBadgeText: {
        fontSize: 10.5,
        fontWeight: '600',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    toggleAllAnswersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginTop: 4,
    },
    toggleAllAnswersText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#2563eb',
    },
    testSectionBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8,
        ...shadows.sm,
    },
    testSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 6,
    },
    testSectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1e293b',
        flex: 1,
    },
    testSectionMarks: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    testSectionDesc: {
        fontSize: 11,
        color: '#64748b',
        fontStyle: 'italic',
    },
    questionItemCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 6,
    },
    questionTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    questionNumberText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2563eb',
    },
    questionContentText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        lineHeight: 17,
    },
    questionMarksBadge: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },
    qOptionsGrid: {
        gap: 4,
        paddingLeft: 12,
        marginTop: 2,
    },
    qOptionText: {
        fontSize: 11.5,
        color: '#475569',
    },
    revealBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    revealBtnText: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#059669',
    },
    answerBox: {
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10b981',
        gap: 3,
    },
    answerTitleText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#059669',
    },
    answerContentText: {
        fontSize: 11.5,
        color: '#166534',
        lineHeight: 16,
    },
    answerExplText: {
        fontSize: 10.5,
        color: '#65a30d',
        fontStyle: 'italic',
    },

    // ── PPT Slide Styles ───────────────────────────────────────────
    slideCanvas: {
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 16,
        minHeight: 280,
        justifyContent: 'space-between',
        ...shadows.md,
    },
    slideTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    slidePillBadge: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: 12,
    },
    slidePillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    slideBrandText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },
    slideTitleText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    slideSubTitleText: {
        fontSize: 12,
        color: '#cbd5e1',
        marginTop: 2,
        marginBottom: 8,
    },
    slideBulletsBox: {
        gap: 8,
        marginVertical: 10,
    },
    slideBulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    slideBulletText: {
        fontSize: 13,
        color: '#f1f5f9',
        flex: 1,
        lineHeight: 18,
    },
    slideHighlightBox: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        marginTop: 8,
    },
    slideHighlightTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fbbf24',
    },
    slideHighlightContent: {
        fontSize: 12,
        color: '#fef3c7',
        marginTop: 2,
    },
    speakerNotesBox: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 8,
    },
    speakerNotesToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    speakerNotesToggleText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    speakerNotesContent: {
        fontSize: 11.5,
        color: '#cbd5e1',
        marginTop: 4,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    slideControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    slideNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        gap: 4,
    },
    slideNavBtnDisabled: {
        backgroundColor: '#e2e8f0',
    },
    slideNavBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    slideDotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    slideDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#cbd5e1',
    },
    slideDotActive: {
        width: 18,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#2563eb',
    },

    // ── Report Styles ──────────────────────────────────────────────
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    kpiCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    kpiValueText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1d4ed8',
    },
    kpiLabelText: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '600',
    },
    bloomBarRow: {
        gap: 4,
        marginBottom: 8,
    },
    bloomBarLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bloomBarLabel: {
        fontSize: 11.5,
        fontWeight: '600',
        color: '#334155',
    },
    bloomBarPct: {
        fontSize: 11,
        fontWeight: '800',
    },
    bloomBarTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    bloomBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    themesWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    themeBadge: {
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    themeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    outcomeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    outcomeText: {
        fontSize: 12,
        color: '#334155',
        flex: 1,
        lineHeight: 17,
    },

    // ── Quiz Styles ────────────────────────────────────────────────
    quizHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    quizQIndexText: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#9333ea',
    },
    quizScoreLiveText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
    },
    quizProgressBarTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
        marginBottom: 12,
        overflow: 'hidden',
    },
    quizProgressBarFill: {
        height: '100%',
        backgroundColor: '#9333ea',
        borderRadius: 3,
    },
    quizCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#f3e8ff',
        ...shadows.sm,
        gap: 12,
    },
    quizQuestionText: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: 21,
    },
    quizOptionsList: {
        gap: 8,
    },
    quizOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    quizOptionCorrect: {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
    },
    quizOptionWrong: {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
    },
    quizOptionText: {
        fontSize: 12.5,
        color: '#334155',
        fontWeight: '600',
        flex: 1,
        marginRight: 6,
    },
    quizOptionTextCorrect: {
        color: '#065f46',
        fontWeight: '700',
    },
    quizOptionTextWrong: {
        color: '#991b1b',
        fontWeight: '700',
    },
    quizExplanationBox: {
        backgroundColor: '#fdf4ff',
        borderRadius: 10,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#c026d3',
        gap: 2,
    },
    quizExplTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#c026d3',
    },
    quizExplContent: {
        fontSize: 11.5,
        color: '#86198f',
        lineHeight: 16,
    },
    quizNextBtn: {
        backgroundColor: '#9333ea',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
        ...shadows.sm,
    },
    quizNextBtnText: {
        fontSize: 13.5,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    quizSummaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#f3e8ff',
        gap: 8,
        ...shadows.md,
    },
    trophyIconBox: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    quizSummaryTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    quizScoreBig: {
        fontSize: 32,
        fontWeight: '900',
        color: '#9333ea',
    },
    quizScorePct: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 10,
    },
    retakeQuizBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9333ea',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    retakeQuizBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // ── AI Chat Styles ─────────────────────────────────────────────
    chatList: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
    },
    sessionErrorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    sessionErrorTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b91c1c',
        flex: 1,
    },
    sessionRetryBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sessionRetryBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    msgUser: {
        justifyContent: 'flex-end',
    },
    msgAssistant: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        flexShrink: 0,
        ...shadows.sm,
    },
    aiAvatarText: {
        fontSize: 16,
    },
    userAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        flexShrink: 0,
    },
    msgBubbleWrapper: {
        maxWidth: '82%',
    },
    msgBubble: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    bubbleUser: {
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    msgText: {
        fontSize: 13,
        lineHeight: 18.5,
    },
    txtUser: {
        color: '#FFFFFF',
    },
    txtAssistant: {
        color: '#1e293b',
    },
    msgTime: {
        fontSize: 9.5,
        color: '#94a3b8',
        marginTop: 2,
    },
    msgTimeUser: {
        textAlign: 'right',
        marginRight: 4,
    },
    msgTimeAssistant: {
        textAlign: 'left',
        marginLeft: 4,
    },
    citationBadgeCard: {
        marginTop: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        padding: 6,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    citationBadgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    citationChapterName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e40af',
        flex: 1,
    },
    citationBadgeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    citationPageNoText: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '600',
    },
    citationRedirectText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2563eb',
    },
    emptyChat: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    emptyChatIconBg: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyChatEmoji: {
        fontSize: 28,
    },
    emptyChatTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },
    emptyChatSub: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 16,
    },
    emptyQuickTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        alignSelf: 'flex-start',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyChipsGrid: {
        width: '100%',
        gap: 8,
    },
    emptyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    emptyChipCategory: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2563eb',
    },
    emptyChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginTop: 1,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typingText: {
        fontSize: 12,
        color: '#64748b',
    },
    imagePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#f1f5f9',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    imagePreviewThumb: {
        width: 36,
        height: 36,
        borderRadius: 6,
    },
    imagePreviewName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    imagePreviewSub: {
        fontSize: 10,
        color: '#64748b',
    },
    chatInputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 6,
    },
    inputActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionBtnActive: {
        backgroundColor: '#ef4444',
    },
    chatTextInput: {
        flex: 1,
        minHeight: 38,
        maxHeight: 90,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 13,
        color: '#0f172a',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chatSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },

    // ── Common Helpers & Modals ────────────────────────────────────
    emptyStateBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 8,
    },
    emptyStateTitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
        gap: 12,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#cbd5e1',
        alignSelf: 'center',
        marginBottom: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    notesInput: {
        height: 180,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        fontSize: 13,
        color: '#0f172a',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    saveNotesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 12,
    },
    saveNotesText: {
        fontSize: 13.5,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    voiceModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    voiceModalContent: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    voiceRingOuter: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceRingMid: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#93c5fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceRingInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceModalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    voiceModalStatus: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
    },
    voiceModalCancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginTop: 6,
    },
    voiceModalCancelText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#2563eb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 24,
    },
    errorText: {
        fontSize: 15,
        color: '#334155',
        marginTop: 12,
        marginBottom: 16,
        fontWeight: '700',
    },
    retryBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
});