import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChapterDetail } from '../../hooks/useChapterDetail';
import { studentColors, spacing, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { updateChapterLastOpened, markChapterCompleted } from '../../services/firebase/progress.service';
import { useBookmarks } from '../../hooks/useBookmarks';
import { PremiumModal } from '../../components/student/PremiumModal';
import { logAnalyticsEvent } from '../../services/analytics';
import { Skeleton } from '../../components/common';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { aiTutorService, CitationItem } from '../../services/aiTutor.service';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';


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

// Predefined Q&A questions that will be displayed in Chapter Menu
const CHAPTER_QUESTIONS_TEMPLATE = [
    {
        key: 'summary',
        icon: '📖',
        color: '#3b82f6',
        bgColor: '#eff6ff',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણનો સંક્ષિપ્ત સારાંશ ગુજરાતીમાં આપો.`,
        getAnswer: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણ વિશે સારાંશ...\n\nAI ઉત્તર મેળવવા માટે ક્લિક કરો ↑`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણ શું વિશે છે? સારાંશ આપો.`,
    },
    {
        key: 'keynotes',
        icon: '📝',
        color: '#8b5cf6',
        bgColor: '#f5f3ff',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણના પરીક્ષામાં આવી શકે તેવા ૫ મહત્વના મુદ્દા આપો.`,
        getAnswer: () => '',
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ મહત્વના પ્રશ્નો (Key Points) જણાવો.`,
    },
    {
        key: 'exercise',
        icon: '✏️',
        color: '#ec4899',
        bgColor: '#fdf2f8',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" ના સ્વાધ્યાયના મુખ્ય પ્રશ્નો અને ઉત્તરો સમજાવો.`,
        getAnswer: () => '',
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના સ્વાધ્યાય (Exercise) ના પ્રશ્નોત્તર આપો.`,
    },
    {
        key: 'mcq',
        icon: '🎯',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ MCQ (બહુ-વિકલ્પ) પ્રશ્નો ઉત્તર સાથે આપો.`,
        getAnswer: () => '',
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ MCQ (ગુજરાતી) ઉત્તર સહ.`,
    },
    {
        key: 'funfact',
        icon: '🌟',
        color: '#10b981',
        bgColor: '#f0fdf4',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણ સંબંધિત ૩ રસપ્રદ અજ્ઞાત વાતો (Fun Facts) જણાવો.`,
        getAnswer: () => '',
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" વિશે ૩ રોચક Fun Facts શું છે?`,
    },
];

export function ChapterDetailScreen(props: any): React.JSX.Element {
    return (
        <ErrorBoundary fallbackMessage="પ્રકરણ વિગતો લોડ કરવામાં ભૂલ આવી.">
            <ChapterDetailScreenContent {...props} />
        </ErrorBoundary>
    );
}

function ChapterDetailScreenContent({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { chapterId } = route.params || {};
    const { chapter, loading, error } = useChapterDetail(chapterId);
    const { userProfile } = useAuth();
    const isPremiumUser = userProfile?.premium ?? false;

    const { progressMap } = useUserProgress(chapter?.subjectId);
    const chapterProgress = progressMap[chapterId];
    const isCompleted = chapterProgress?.isCompleted ?? false;
    const { isBookmarked, toggle: toggleBookmark } = useBookmarks(userProfile?.uid);
    const isChapterBookmarked = isBookmarked(chapterId);

    const [updating, setUpdating] = useState(false);
    const [premiumModalVisible, setPremiumModalVisible] = useState(false);

    // Segmented Tab control
    const [activeTab, setActiveTab] = useState<'menu' | 'chat' | 'help'>('menu');

    // Chat states
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string; name: string } | null>(null);
    const [recording, setRecording] = useState(false);
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('સાંભળી રહ્યા છીએ...');

    // Chapter Notes
    const [notesModalVisible, setNotesModalVisible] = useState(false);
    const [chapterNotes, setChapterNotes] = useState('');

    const flatListRef = useRef<FlatList>(null);
    const webViewRef = useRef<any>(null);
    const sessionPromiseRef = useRef<Promise<string> | null>(null);

    // State to hold suggested quiz questions from this specific chapter (like NotebookLLM)
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!chapterId) return;

        const fetchSuggestedQuestions = async () => {
            setSuggestionsLoading(true);
            try {
                let fetchedQuestions: string[] = [];

                // ── Strategy 1: Direct query on root `questions` collection by chapterId
                // This is the most reliable path — no composite index needed.
                try {
                    const directSnap = await firestore()
                        .collection(COLLECTIONS.QUESTIONS)
                        .where('chapterId', '==', chapterId)
                        .limit(5)
                        .get();

                    if (!directSnap.empty) {
                        fetchedQuestions = directSnap.docs
                            .map(doc => {
                                const d = doc.data();
                                return d.questionTextGu || d.questionText || d.title || d.question || '';
                            })
                            .filter(Boolean);
                    }
                } catch (innerErr) {
                    console.warn('[SuggestedQ] Strategy 1 (questions by chapterId) failed:', innerErr);
                }

                // ── Strategy 2: Quiz document embedded questions array
                // Fallback: find the quiz for this chapter and read embedded array.
                if (fetchedQuestions.length === 0) {
                    try {
                        const quizSnap = await firestore()
                            .collection(COLLECTIONS.QUIZZES)
                            .where('chapterId', '==', chapterId)
                            .limit(1)
                            .get();

                        if (!quizSnap.empty && quizSnap.docs[0]) {
                            const quizDoc = quizSnap.docs[0];
                            const quizData = quizDoc.data();
                            const embedded = quizData.questions || quizData.mcqs || [];

                            if (Array.isArray(embedded) && embedded.length > 0) {
                                fetchedQuestions = embedded
                                    .map((q: any) => q.questionTextGu || q.questionText || q.title || q.question || '')
                                    .filter(Boolean);
                            }

                            // ── Strategy 3: Questions by quizId in root collection
                            if (fetchedQuestions.length === 0) {
                                const byQuizSnap = await firestore()
                                    .collection(COLLECTIONS.QUESTIONS)
                                    .where('quizId', '==', quizDoc.id)
                                    .limit(5)
                                    .get();

                                if (!byQuizSnap.empty) {
                                    fetchedQuestions = byQuizSnap.docs
                                        .map(doc => {
                                            const d = doc.data();
                                            return d.questionTextGu || d.questionText || d.title || d.question || '';
                                        })
                                        .filter(Boolean);
                                }
                            }
                        }
                    } catch (innerErr) {
                        console.warn('[SuggestedQ] Strategy 2/3 (quiz lookup) failed:', innerErr);
                    }
                }

                // Also try quiz_id field (snake_case) in case of legacy data
                if (fetchedQuestions.length === 0) {
                    try {
                        const legacySnap = await firestore()
                            .collection(COLLECTIONS.QUESTIONS)
                            .where('chapter_id', '==', chapterId)
                            .limit(5)
                            .get();

                        if (!legacySnap.empty) {
                            fetchedQuestions = legacySnap.docs
                                .map(doc => {
                                    const d = doc.data();
                                    return d.questionTextGu || d.questionText || d.title || d.question || '';
                                })
                                .filter(Boolean);
                        }
                    } catch (innerErr) {
                        console.warn('[SuggestedQ] Strategy 4 (chapter_id snake_case) failed:', innerErr);
                    }
                }

                if (fetchedQuestions.length > 0) {
                    const unique = Array.from(new Set(fetchedQuestions)).slice(0, 5);
                    setSuggestedQuestions(unique);
                } else {
                    setSuggestedQuestions([]);
                }
            } catch (err) {
                console.error('[SuggestedQ] Outer error:', err);
                setSuggestedQuestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        };

        fetchSuggestedQuestions();
    }, [chapterId]);

    // Update opened timestamp and analytics
    useEffect(() => {
        if (chapter && userProfile?.uid) {
            updateChapterLastOpened(userProfile.uid, chapter.id, chapter.subjectId, chapter.standardId);
            logAnalyticsEvent('chapter_open', {
                chapter_id: chapter.id,
                subject_id: chapter.subjectId,
                standard_id: chapter.standardId,
                title: chapter.title,
            });
        }
    }, [chapter?.id, userProfile?.uid]);

    // Auto-scroll chat when keyboard appears
    useEffect(() => {
        const keyboardListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                if (activeTab === 'chat') {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            }
        );
        return () => {
            keyboardListener.remove();
        };
    }, [activeTab]);

    const getOrCreateSessionId = async (): Promise<string | null> => {
        if (sessionId) return sessionId;

        if (sessionPromiseRef.current) {
            try {
                const id = await sessionPromiseRef.current;
                if (id) {
                    setSessionId(id);
                    setSessionError(false);
                    return id;
                }
            } catch (e) {
                console.error('Pending session promise failed:', e);
                sessionPromiseRef.current = null;
            }
        }

        if (!chapter) return null;
        const currentUid = userProfile?.uid || `guest_${chapter.id || 'student'}`;

        try {
            const promise = aiTutorService.createChatSession(
                currentUid,
                `પ્રકરણ ચેટ: ${chapter.titleGu || chapter.title}`,
                {
                    standard: String(chapter.standardId || ''),
                    subject: String(chapter.subjectId || ''),
                    chapter: String(chapter.id || '')
                }
            );
            sessionPromiseRef.current = promise;
            const newId = await promise;
            setSessionId(newId);
            setSessionError(false);
            return newId;
        } catch (err) {
            sessionPromiseRef.current = null;
            console.error('Failed to create chapter AI session on demand:', err);
            return null;
        }
    };

    // Retry session creation — resets URL cache so it re-probes backend
    const retrySession = async () => {
        setSessionError(false);
        aiTutorService.resetUrlCache();
        const id = await getOrCreateSessionId();
        if (!id) setSessionError(true);
    };

    // Initialize chat session for this chapter
    useEffect(() => {
        if (!chapter || !userProfile?.uid || sessionId) return;
        getOrCreateSessionId();
    }, [chapter?.id, userProfile?.uid]);

    // Fetch notes for this chapter from AsyncStorage
    useEffect(() => {
        if (!chapterId) return;
        const loadNotes = async () => {
            try {
                const savedNotes = await AsyncStorage.getItem(`notes_${chapterId}`);
                if (savedNotes) setChapterNotes(savedNotes);
            } catch (e) {
                console.error('Failed to load chapter notes:', e);
            }
        };
        loadNotes();
    }, [chapterId]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
                {/* Skeleton Header */}
                <View style={styles.skeletonHeader}>
                    <View style={styles.skeletonBackBtn} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Skeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Skeleton width="45%" height={13} borderRadius={4} />
                    </View>
                    <View style={styles.skeletonBackBtn} />
                </View>

                {/* Skeleton Tab Row */}
                <View style={styles.skeletonTabRow}>
                    <Skeleton width="30%" height={36} borderRadius={20} />
                    <Skeleton width="30%" height={36} borderRadius={20} />
                    <Skeleton width="30%" height={36} borderRadius={20} />
                </View>

                {/* Skeleton Quick Actions */}
                <View style={styles.skeletonQuickRow}>
                    {[1, 2, 3, 4].map((_, i) => (
                        <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                            <Skeleton width={52} height={52} borderRadius={16} />
                            <Skeleton width={46} height={11} borderRadius={4} />
                        </View>
                    ))}
                </View>

                {/* Skeleton Section Header */}
                <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 10 }}>
                    <Skeleton width="55%" height={16} borderRadius={6} />
                </View>

                {/* Skeleton Question Cards */}
                {[1, 2, 3, 4, 5].map((_, i) => (
                    <View key={i} style={styles.skeletonCard}>
                        <Skeleton width={52} height={68} borderRadius={10} />
                        <View style={{ flex: 1, marginLeft: 10, gap: 8 }}>
                            <Skeleton width="85%" height={14} borderRadius={4} />
                            <Skeleton width="60%" height={14} borderRadius={4} />
                            <Skeleton width={60} height={22} borderRadius={12} />
                        </View>
                        <Skeleton width={18} height={18} borderRadius={9} style={{ marginLeft: 8 }} />
                    </View>
                ))}
            </View>
        );
    }

    if (error || !chapter) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>⚠️ Failed to load chapter</Text>
            </View>
        );
    }

    // const isLocked = chapter.isPremium && !isPremiumUser;

    const handleToggleBookmark = async () => {
        if (!userProfile?.uid || updating) return;
        setUpdating(true);
        try {
            await toggleBookmark(chapter.id, {
                standardId: chapter.standardId,
                standardName: `Std ${chapter.standardId}`,
                subjectId: chapter.subjectId,
                chapterTitle: chapter.title
            });
        } catch (err) {
            console.error('Bookmark toggle error:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkCompleted = async () => {
        if (!userProfile?.uid || isCompleted || updating) return;
        setUpdating(true);
        const success = await markChapterCompleted(userProfile.uid, chapter.id, chapter.subjectId, chapter.standardId);
        if (success) {
            Alert.alert('Success', 'Chapter marked as completed! 🎉');
        } else {
            Alert.alert('Error', 'Failed to update progress.');
        }
        setUpdating(false);
    };

    const openPDF = async () => {
        if (!chapter.pdfUrl) {
            Alert.alert('Notice', 'આ પ્રકરણ માટે પીડીએફ ઉપલબ્ધ નથી.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: chapter.pdfUrl,
            title: chapter.titleGu || chapter.title,
            pdfId: chapter.id,
            pdfType: 'chapter',
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            bookStartPage: chapter.bookStartPage
        });
    };

    const openPDFAtPage = (targetPage?: number) => {
        if (!chapter.pdfUrl) {
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
            url: chapter.pdfUrl,
            title: `${chapter.titleGu || chapter.title} (Page ${targetPage || startPageToUse})`,
            pdfId: chapter.id,
            pdfType: 'chapter',
            startPage: startPageToUse,
            endPage: chapter.endPage,
            bookStartPage: chapter.bookStartPage
        });
    };

    const saveChapterNotes = async (text: string) => {
        setChapterNotes(text);
        try {
            await AsyncStorage.setItem(`notes_${chapterId}`, text);
        } catch (e) {
            console.error('Failed to save notes:', e);
        }
    };

    const navigateToQuiz = (isMixed: boolean) => {
        navigation.navigate('QuizList', {
            chapterId: chapter.id,
            subjectId: chapter.subjectId,
            isMixed,
            chapterTitle: chapter.title
        });
    };

    const openSwadhyayAction = () => {
        const swadhyayUrl = chapter.swadhyayPdfUrl || chapter.pdfUrl;
        if (swadhyayUrl) {
            navigation.navigate('PdfViewer', {
                url: swadhyayUrl,
                title: `${chapter.titleGu || chapter.title} - Swadhyay`,
                pdfId: `${chapter.id}_swadhyay`,
                pdfType: 'swadhyay',
                startPage: chapter.startPage,
                endPage: chapter.endPage,
                bookStartPage: chapter.bookStartPage
            });
        } else {
            navigateToQuiz(false);
        }
    };

    // Camera Image Pick
    const handlePickImage = async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.images],
            });
            if (res && res.uri) {
                setSelectedImage({
                    uri: res.uri,
                    type: res.type || 'image/jpeg',
                    name: res.name || 'query.jpg',
                });
                setActiveTab('chat');
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.error('Image pick error:', err);
            }
        }
    };

    // Voice Dictation
    const handleVoicePress = () => {
        if (recording) {
            setRecording(false);
            setVoiceModalVisible(false);
            webViewRef.current?.postMessage('stop');
        } else {
            setRecording(true);
            setVoiceStatus('સાંભળી રહ્યા છીએ...');
            setVoiceModalVisible(true);
            webViewRef.current?.postMessage('start');
        }
    };

    const onWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'result') {
                setInputText(data.text);
                setVoiceStatus(data.text || 'સાંભળી રહ્યા છીએ...');
            } else if (data.type === 'error') {
                setRecording(false);
                setVoiceModalVisible(false);
            } else if (data.type === 'end') {
                setRecording(false);
                setVoiceModalVisible(false);
            }
        } catch (e) {
            console.error('Failed to process webview dictation message:', e);
        }
    };

    // Handle question card press from Chapter Menu → send to Chat
    const handleQuestionPress = async (item: { questionText: string; displayText: string }) => {
        const chapterTitle = chapter.titleGu || chapter.title;
        const displayQuestion = item.displayText;

        // Explicit context to ensure AI answers strictly from this open chapter
        const contextPrefix =
            `[સંદર્ભ: ધોરણ ${chapter.standardId}, વિષય: ${chapter.subjectId}, પ્રકરણ: "${chapterTitle}", પ્રકરણ ક્રમાંક: ${chapter.id}]\nવિનંતી: કૃપા કરીને ફક્ત આ ખુલેલા પ્રકરણ ("${chapterTitle}") ના જ ઉત્તરો તથા પ્રશ્નોત્તરી આપો.\n`;
        const questionText = contextPrefix + item.questionText;

        // Switch to chat tab first
        setActiveTab('chat');

        // Execute handleSend immediately
        setTimeout(() => {
            handleSend(questionText, displayQuestion);
        }, 0);
    };

    // Send Message / Ask AI
    const handleSend = async (customText?: string, displayText?: string) => {
        const queryText = customText || inputText;
        const displayQueryText = displayText || queryText;

        if (!queryText.trim() && !selectedImage) return;

        setInputText('');
        setSelectedImage(null);

        // Append user message locally
        const userMsg: Message = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: selectedImage
                ? `[છબી મોકલી: ${selectedImage.name}]\n${displayQueryText}`
                : displayQueryText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        setChatLoading(true);

        try {
            const activeSessionId = await getOrCreateSessionId();
            if (!activeSessionId) {
                setSessionError(true);
                setChatLoading(false);
                return;
            }
            setSessionError(false);

            let answer = '';
            let activeCitations: CitationItem[] | undefined = undefined;

            if (selectedImage) {
                const fs = ReactNativeBlobUtil.fs;
                const base64Data = await fs.readFile(selectedImage.uri, 'base64');
                answer = await aiTutorService.sendMultimodalDoubt(base64Data, queryText, selectedImage.type);
            } else {
                const res = await aiTutorService.sendChatMessage(activeSessionId, queryText, {
                    standard: chapter.standardId,
                    subject: chapter.subjectId,
                    chapter: chapter.id,
                    language: 'gu'
                });
                answer = res.answer;
                activeCitations = res.citations && res.citations.length > 0 ? res.citations : undefined;
            }

            const pageNum = (activeCitations && activeCitations[0] && activeCitations[0].pageNumber)
                ? activeCitations[0].pageNumber
                : (chapter.bookStartPage || chapter.startPage || 1);

            const assistantMsg: Message = {
                id: `assistant_${Date.now()}`,
                role: 'assistant',
                content: answer,
                citations: activeCitations,
                pageNumber: pageNum,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (err) {
            console.error('Send error:', err);
            const errorMsg: Message = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: '⚠️ માફ કરશો, AI સર્વર સાથે જોડાવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ૧૦-૧૫ સેકન્ડ પછી ફરીથી પ્રશ્ન પૂછો.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } finally {
            setChatLoading(false);
        }
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const chapterTitle = chapter.titleGu || chapter.title;

    const suggestedItems = suggestedQuestions.length > 0
        ? suggestedQuestions.map((qText, idx) => {
            const colors = [
                { color: '#3b82f6', bgColor: '#eff6ff', icon: '🎯' },
                { color: '#8b5cf6', bgColor: '#f5f3ff', icon: '📝' },
                { color: '#ec4899', bgColor: '#fdf2f8', icon: '✏️' },
                { color: '#f59e0b', bgColor: '#fffbeb', icon: '🌟' },
                { color: '#10b981', bgColor: '#f0fdf4', icon: '📖' }
            ];
            const styleConfig = colors[idx % colors.length] || { color: '#3b82f6', bgColor: '#eff6ff', icon: '🎯' };
            return {
                key: `suggested_${idx}`,
                icon: styleConfig.icon,
                color: styleConfig.color,
                bgColor: styleConfig.bgColor,
                questionText: qText,
                displayText: qText
            };
        })
        : CHAPTER_QUESTIONS_TEMPLATE.map((q) => ({
            key: q.key,
            icon: q.icon,
            color: q.color,
            bgColor: q.bgColor,
            questionText: q.getQuestion(chapterTitle),
            displayText: q.displayQ(chapterTitle)
        }));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {chapterTitle}
                    </Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {chapter.title}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkBtn} disabled={updating}>
                    {updating ? (
                        <ActivityIndicator size="small" color={studentColors.secondary} />
                    ) : (
                        <Ionicons
                            name={isChapterBookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={22}
                            color={isChapterBookmarked ? studentColors.secondary : '#6b7280'}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Segmented Tab Row */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
                    onPress={() => setActiveTab('menu')}
                >
                    <Ionicons
                        name="grid-outline"
                        size={15}
                        color={activeTab === 'menu' ? studentColors.secondary : '#6b7280'}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Chapter Menu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                    onPress={() => setActiveTab('chat')}
                >
                    <Ionicons
                        name="chatbubbles-outline"
                        size={15}
                        color={activeTab === 'chat' ? studentColors.secondary : '#6b7280'}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>AI Chat</Text>
                    {messages.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{messages.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'help' && styles.activeTab]}
                    onPress={() => setActiveTab('help')}
                >
                    <Ionicons
                        name="help-circle-outline"
                        size={15}
                        color={activeTab === 'help' ? studentColors.secondary : '#6b7280'}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>Help</Text>
                </TouchableOpacity>
            </View>

            {/* ─── MENU TAB ─── */}
            {activeTab === 'menu' && (
                <ScrollView contentContainerStyle={styles.menuScroll} showsVerticalScrollIndicator={false}>

                    {/* Quick Action Buttons */}
                    <View style={styles.quickActionRow}>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={openPDF}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="book-outline" size={20} color="#3b82f6" />
                            </View>
                            <Text style={styles.quickActionText}>Textbook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => setNotesModalVisible(true)}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fdf4ff' }]}>
                                <Ionicons name="document-text-outline" size={20} color="#a855f7" />
                            </View>
                            <Text style={styles.quickActionText}>My Notes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigateToQuiz(false)}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="trophy-outline" size={20} color="#22c55e" />
                            </View>
                            <Text style={styles.quickActionText}>MCQ Quiz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('StudentFlashcards', { chapterId: chapter.id, chapterTitle })}>
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fff7ed' }]}>
                                <Ionicons name="flash-outline" size={20} color="#f59e0b" />
                            </View>
                            <Text style={styles.quickActionText}>Flashcards</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chapter Questions Section */}
                    <View style={styles.questionsSection}>
                        <View style={styles.questionsSectionHeader}>
                            <View style={styles.qSectionIconWrap}>
                                <Ionicons name="sparkles" size={16} color={studentColors.secondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.questionsSectionTitle}>AI ને પ્રશ્ન પૂછો</Text>
                                <Text style={styles.questionsSectionSub}>
                                    {suggestionsLoading
                                        ? 'પ્રશ્નો લોડ થઈ રહ્યા છે...'
                                        : suggestedQuestions.length > 0
                                            ? `📚 આ પ્રકરણના ${suggestedQuestions.length} MCQ પ્રશ્નો — ક્લિક કરો → AI ઉત્તર`
                                            : 'ક્લિક કરો → AI Chat ટૅબ પર ઉત્તર આવશે'
                                    }
                                </Text>
                            </View>
                        </View>

                        {/* Loading skeleton */}
                        {suggestionsLoading ? (
                            [1, 2, 3, 4, 5].map((_, i) => (
                                <View key={i} style={[styles.questionCard, { borderLeftColor: '#e2e8f0', opacity: 0.6 }]}>
                                    <Skeleton width={52} height={68} borderRadius={10} />
                                    <View style={{ flex: 1, marginLeft: 10, gap: 8 }}>
                                        <Skeleton width="85%" height={14} borderRadius={4} />
                                        <Skeleton width="60%" height={14} borderRadius={4} />
                                        <Skeleton width={60} height={20} borderRadius={10} />
                                    </View>
                                    <Skeleton width={18} height={18} borderRadius={9} style={{ marginLeft: 8 }} />
                                </View>
                            ))
                        ) : (
                            suggestedItems.map((item, idx) => (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.questionCard, { borderLeftColor: item.color }]}
                                    onPress={() => handleQuestionPress(item)}
                                    activeOpacity={0.7}
                                >
                                    {/* Number badge */}
                                    <View style={[styles.qNumBadge, { backgroundColor: item.bgColor }]}>
                                        <Text style={styles.qNumBadgeIcon}>{item.icon}</Text>
                                        <View style={[styles.qNumCircle, { backgroundColor: item.color }]}>
                                            <Text style={styles.qNumText}>{idx + 1}</Text>
                                        </View>
                                    </View>

                                    {/* Question text */}
                                    <View style={styles.questionCardBody}>
                                        <Text style={styles.questionCardText}>
                                            {item.displayText}
                                        </Text>
                                        <View style={[styles.qAiChip, { backgroundColor: item.bgColor }]}>
                                            <Ionicons name="chatbubble-ellipses" size={10} color={item.color} />
                                            <Text style={[styles.qAiChipText, { color: item.color }]}>AI ઉત્તર</Text>
                                        </View>
                                    </View>

                                    {/* Arrow */}
                                    <View style={styles.qArrowWrap}>
                                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Self-Assessment */}
                    <View style={styles.practiceSection}>
                        <Text style={styles.practiceTitle}>📋 સ્વ-મૂલ્યાંકન (Quiz & Practice)</Text>
                        <View style={styles.practiceGrid}>
                            <TouchableOpacity
                                style={[styles.practiceCard, { borderLeftColor: '#3b82f6' }]}
                                onPress={() => navigateToQuiz(false)}
                            >
                                <Text style={styles.practiceIcon}>❓</Text>
                                <View style={styles.practiceInfo}>
                                    <Text style={styles.practiceCardTitle}>MCQ Quiz (ક્વિઝ)</Text>
                                    <Text style={styles.practiceCardSub}>બહુ-વિકલ્પ પ્રશ્નોની પ્રેક્ટિસ</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.practiceCard, { borderLeftColor: '#a855f7' }]}
                                onPress={() => navigateToQuiz(true)}
                            >
                                <Text style={styles.practiceIcon}>🔀</Text>
                                <View style={styles.practiceInfo}>
                                    <Text style={styles.practiceCardTitle}>Mixed Quiz (મિક્સ ક્વિઝ)</Text>
                                    <Text style={styles.practiceCardSub}>મિશ્રિત પ્રશ્નોત્તરી</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.practiceCard, { borderLeftColor: '#ec4899' }]}
                                onPress={openSwadhyayAction}
                            >
                                <Text style={styles.practiceIcon}>📝</Text>
                                <View style={styles.practiceInfo}>
                                    <Text style={styles.practiceCardTitle}>Swadhyay (સ્વાધ્યાય)</Text>
                                    <Text style={styles.practiceCardSub}>પ્રકરણનો સત્તાવાર સ્વાધ્યાય</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.practiceCard, { borderLeftColor: '#f59e0b' }]}
                                onPress={() => navigation.navigate('StudentFlashcards', { chapterId: chapter.id, chapterTitle })}
                            >
                                <Text style={styles.practiceIcon}>⚡</Text>
                                <View style={styles.practiceInfo}>
                                    <Text style={styles.practiceCardTitle}>Flashcards (ફ્લૅશકાર્ડ)</Text>
                                    <Text style={styles.practiceCardSub}>ઝડપી રિવિઝન</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Mark Completed */}
                    {!isCompleted && (
                        <TouchableOpacity
                            style={styles.markCompletedBtn}
                            onPress={handleMarkCompleted}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.markCompletedText}>Mark Chapter as Completed</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}

            {/* ─── CHAT TAB ─── */}
            {activeTab === 'chat' && (
                Platform.OS === 'ios' ? (
                <KeyboardAvoidingView
                    style={styles.chatContainer}
                    behavior="padding"
                    keyboardVerticalOffset={100}
                >
                    {/* ── Connection Error Banner ── */}
                    {sessionError && (
                        <View style={styles.sessionErrorBanner}>
                            <View style={styles.sessionErrorIconWrap}>
                                <Ionicons name="cloud-offline-outline" size={28} color="#ef4444" />
                            </View>
                            <Text style={styles.sessionErrorTitle}>સર્વર સાથે જોડાઈ શકાયું નથી</Text>
                            <Text style={styles.sessionErrorSub}>
                                AI backend unreachable. Local server down or tunnel expired.
                            </Text>
                            <TouchableOpacity
                                style={styles.sessionRetryBtn}
                                onPress={retrySession}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={16} color="#fff" />
                                <Text style={styles.sessionRetryBtnText}>ફરીથી પ્રયત્ન કરો</Text>
                            </TouchableOpacity>
                            <Text style={styles.sessionErrorHint}>
                                💡 Tip: Mac પર{' '}
                                <Text style={{ fontWeight: '700' }}>./start_ai.sh</Text>
                                {' '}ચલાવો
                            </Text>
                        </View>
                    )}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.chatList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item, index }) => {
                            const isUser = item.role === 'user';
                            const isLast = index === messages.length - 1;
                            return (
                                <View style={[
                                    styles.msgRow,
                                    isUser ? styles.msgUser : styles.msgAssistant,
                                    isLast && { marginBottom: 8 }
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

                                            {!isUser && (
                                                <TouchableOpacity
                                                    style={styles.citationBadgeCard}
                                                    onPress={() => openPDFAtPage(item.pageNumber || chapter.bookStartPage || chapter.startPage || 1)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={styles.citationBadgeHeader}>
                                                        <Ionicons name="book-open" size={14} color="#1d4ed8" />
                                                        <Text style={styles.citationChapterName} numberOfLines={1}>
                                                            {item.citations && item.citations[0]?.chapter ? item.citations[0].chapter : (chapter.titleGu || chapter.title)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.citationBadgeFooter}>
                                                        <Text style={styles.citationPageNoText}>
                                                            📄 પાનું (Page): {item.pageNumber || chapter.bookStartPage || chapter.startPage || 1}
                                                        </Text>
                                                        <View style={styles.citationPdfRedirectBtn}>
                                                            <Text style={styles.citationPdfRedirectText}>પાઠ્યપુસ્તકમાં ખોલો ➔</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
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
                                            <Ionicons name="person" size={14} color="#FFFFFF" />
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
                                <Text style={styles.emptyChatTitle}>AI ડાઉટ સોલ્વર</Text>
                                <Text style={styles.emptyChatSub}>
                                    Chapter Menu ટૅબ પર જઈ કોઈ પ્રશ્ન ચૂંટો, અથવા
                                    નીચે ટાઇપ કરીને, કૅમેરાથી કે બોલીને પ્રશ્ન પૂછો.
                                </Text>
                                <View style={styles.quickChipsRow}>
                                    <TouchableOpacity
                                        style={styles.quickChip}
                                        onPress={() => setActiveTab('menu')}
                                    >
                                        <Ionicons name="grid-outline" size={14} color={studentColors.secondary} />
                                        <Text style={styles.quickChipText}>Chapter Menu</Text>
                                    </TouchableOpacity>
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
                            <View style={styles.typingBubble}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.dot, styles.dot1]} />
                                    <View style={[styles.dot, styles.dot2]} />
                                    <View style={[styles.dot, styles.dot3]} />
                                </View>
                                <Text style={styles.typingText}>AI જવાબ તૈયાર કરી રહ્યો છે...</Text>
                            </View>
                        </View>
                    )}

                    {/* Image preview */}
                    {selectedImage && (
                        <View style={styles.imagePreviewRow}>
                            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreviewThumb} />
                            <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                <Text style={styles.imagePreviewName} numberOfLines={1}>{selectedImage.name}</Text>
                                <Text style={styles.imagePreviewSub}>ছবি attach করা</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.imagePreviewRemove}>
                                <Ionicons name="close-circle" size={24} color={studentColors.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Input Bar */}
                    <View style={styles.chatInputBar}>
                        <TouchableOpacity onPress={handleVoicePress} style={[styles.inputActionBtn, recording && styles.inputActionBtnActive]}>
                            <Ionicons
                                name={recording ? 'mic-sharp' : 'mic-outline'}
                                size={22}
                                color={recording ? '#FFFFFF' : studentColors.secondary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePickImage} style={styles.inputActionBtn}>
                            <Ionicons name="camera-outline" size={22} color={studentColors.secondary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.chatTextInput}
                            placeholder="ગુજરાતીમાં પ્રશ્ન ટાઇપ કરો..."
                            placeholderTextColor="#9ca3af"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            scrollEnabled={true}
                            textAlignVertical="center"
                            blurOnSubmit={false}
                            returnKeyType="default"
                        />
                        <TouchableOpacity
                            style={[
                                styles.chatSendBtn,
                                (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled
                            ]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim() && !selectedImage}
                        >
                            <Ionicons name="send" size={17} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                ) : (
                <View style={styles.chatContainer}>
                    {/* ── Connection Error Banner ── */}
                    {sessionError && (
                        <View style={styles.sessionErrorBanner}>
                            <View style={styles.sessionErrorIconWrap}>
                                <Ionicons name="cloud-offline-outline" size={28} color="#ef4444" />
                            </View>
                            <Text style={styles.sessionErrorTitle}>સર્વર સાથે જોડાઈ શકાયું નથી</Text>
                            <Text style={styles.sessionErrorSub}>
                                AI backend unreachable. Local server down or tunnel expired.
                            </Text>
                            <TouchableOpacity
                                style={styles.sessionRetryBtn}
                                onPress={retrySession}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={16} color="#fff" />
                                <Text style={styles.sessionRetryBtnText}>ફરીથી પ્રયત્ન કરો</Text>
                            </TouchableOpacity>
                            <Text style={styles.sessionErrorHint}>
                                💡 Tip: Mac પર{' '}
                                <Text style={{ fontWeight: '700' }}>./start_ai.sh</Text>
                                {' '}ચલાવો
                            </Text>
                        </View>
                    )}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.chatList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item, index }) => {
                            const isUser = item.role === 'user';
                            const isLast = index === messages.length - 1;
                            return (
                                <View style={[
                                    styles.msgRow,
                                    isUser ? styles.msgUser : styles.msgAssistant,
                                    isLast && { marginBottom: 8 }
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

                                            {!isUser && (
                                                <TouchableOpacity
                                                    style={styles.citationBadgeCard}
                                                    onPress={() => openPDFAtPage(item.pageNumber || chapter.bookStartPage || chapter.startPage || 1)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={styles.citationBadgeHeader}>
                                                        <Ionicons name="book-open" size={14} color="#1d4ed8" />
                                                        <Text style={styles.citationChapterName} numberOfLines={1}>
                                                            {item.citations && item.citations[0]?.chapter ? item.citations[0].chapter : (chapter.titleGu || chapter.title)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.citationBadgeFooter}>
                                                        <Text style={styles.citationPageNoText}>
                                                            📄 પાનું (Page): {item.pageNumber || chapter.bookStartPage || chapter.startPage || 1}
                                                        </Text>
                                                        <View style={styles.citationPdfRedirectBtn}>
                                                            <Text style={styles.citationPdfRedirectText}>પાઠ્યપુસ્તકમાં ખોલો ➔</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
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
                                            <Ionicons name="person" size={14} color="#FFFFFF" />
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
                                <Text style={styles.emptyChatTitle}>AI ડાઉટ સોલ્વર</Text>
                                <Text style={styles.emptyChatSub}>
                                    Chapter Menu ટૅબ પર જઈ કોઈ પ્રશ્ન ચૂંટો, અથવા
                                    નીચે ટાઇપ કરીને, કૅમેરાથી કે બોલીને પ્રશ્ન પૂછો.
                                </Text>
                                <View style={styles.quickChipsRow}>
                                    <TouchableOpacity
                                        style={styles.quickChip}
                                        onPress={() => setActiveTab('menu')}
                                    >
                                        <Ionicons name="grid-outline" size={14} color={studentColors.secondary} />
                                        <Text style={styles.quickChipText}>Chapter Menu</Text>
                                    </TouchableOpacity>
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
                            <View style={styles.typingBubble}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.dot, styles.dot1]} />
                                    <View style={[styles.dot, styles.dot2]} />
                                    <View style={[styles.dot, styles.dot3]} />
                                </View>
                                <Text style={styles.typingText}>AI જવાબ તૈયાર કરી રહ્યો છે...</Text>
                            </View>
                        </View>
                    )}

                    {/* Image preview */}
                    {selectedImage && (
                        <View style={styles.imagePreviewRow}>
                            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreviewThumb} />
                            <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                <Text style={styles.imagePreviewName} numberOfLines={1}>{selectedImage.name}</Text>
                                <Text style={styles.imagePreviewSub}>ছবি attach করা</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.imagePreviewRemove}>
                                <Ionicons name="close-circle" size={24} color={studentColors.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Input Bar */}
                    <View style={styles.chatInputBar}>
                        <TouchableOpacity onPress={handleVoicePress} style={[styles.inputActionBtn, recording && styles.inputActionBtnActive]}>
                            <Ionicons
                                name={recording ? 'mic-sharp' : 'mic-outline'}
                                size={22}
                                color={recording ? '#FFFFFF' : studentColors.secondary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePickImage} style={styles.inputActionBtn}>
                            <Ionicons name="camera-outline" size={22} color={studentColors.secondary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.chatTextInput}
                            placeholder="ગુજરાતીમાં પ્રશ્ન ટાઇપ કરો..."
                            placeholderTextColor="#9ca3af"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            scrollEnabled={true}
                            textAlignVertical="center"
                            blurOnSubmit={false}
                            returnKeyType="default"
                        />
                        <TouchableOpacity
                            style={[
                                styles.chatSendBtn,
                                (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled
                            ]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim() && !selectedImage}
                        >
                            <Ionicons name="send" size={17} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
                )
            )}

            {/* ─── HELP TAB ─── */}
            {activeTab === 'help' && (
                <ScrollView contentContainerStyle={styles.helpScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.helpHero}>
                        <Text style={styles.helpHeroEmoji}>💡</Text>
                        <Text style={styles.helpTitle}>Chapter AI — ઉપયોગ માર્ગદર્શિકા</Text>
                    </View>

                    <View style={styles.helpCard}>
                        <View style={styles.helpCardHeader}>
                            <View style={[styles.helpCardIcon, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="grid-outline" size={18} color="#3b82f6" />
                            </View>
                            <Text style={styles.helpHeading}>૧. Chapter Menu</Text>
                        </View>
                        <Text style={styles.helpBody}>
                            Chapter Menu માં ૫ તૈયાર AI પ્રશ્નો છે. ગમે ત્યારે ક્લિક કરો — AI Chat ટૅબ પર ઉત્તર આવશે.
                        </Text>
                    </View>

                    <View style={styles.helpCard}>
                        <View style={styles.helpCardHeader}>
                            <View style={[styles.helpCardIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="mic-outline" size={18} color="#22c55e" />
                            </View>
                            <Text style={styles.helpHeading}>૨. Voice Input (ઓડિઓ)</Text>
                        </View>
                        <Text style={styles.helpBody}>
                            Chat ટૅબ માં 🎤 icon tap કરો → ગુજરાતીમાં બોલો → app automatic ટ્રાન્સ્ક્રાઇબ કરશે.
                        </Text>
                    </View>

                    <View style={styles.helpCard}>
                        <View style={styles.helpCardHeader}>
                            <View style={[styles.helpCardIcon, { backgroundColor: '#fdf2f8' }]}>
                                <Ionicons name="camera-outline" size={18} color="#ec4899" />
                            </View>
                            <Text style={styles.helpHeading}>૩. Camera / Photo (ફોટો OCR)</Text>
                        </View>
                        <Text style={styles.helpBody}>
                            Chat ટૅબ 📷 icon tap → textbook page / printed question photo → AI scan કરી ઉત્તર આપશે.
                        </Text>
                    </View>

                    <View style={styles.helpCard}>
                        <View style={styles.helpCardHeader}>
                            <View style={[styles.helpCardIcon, { backgroundColor: '#fffbeb' }]}>
                                <Ionicons name="chatbubbles-outline" size={18} color="#f59e0b" />
                            </View>
                            <Text style={styles.helpHeading}>૪. Follow-up Questions</Text>
                        </View>
                        <Text style={styles.helpBody}>
                            AI ઉત્તર પછી "ફરી સમજાવ" કે "example આપો" લખીને follow-up પ્રશ્ન પૂછી શકો છો.
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* Chapter Notes Modal */}
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
                            <Text style={styles.modalTitle}>📝 મારા ચેપ્ટર નોટ્સ</Text>
                            <TouchableOpacity onPress={() => setNotesModalVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={22} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            placeholder="આ ચેપ્ટર વાંચતી વખતે તમારા અગત્યના પોઈન્ટ્સ અહીં નોંધો..."
                            placeholderTextColor="#9ca3af"
                            value={chapterNotes}
                            onChangeText={saveChapterNotes}
                        />
                        <TouchableOpacity style={styles.saveNotesBtn} onPress={() => setNotesModalVisible(false)}>
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.saveNotesText}>સાચવો અને બંધ કરો</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Voice Modal */}
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
                        <Text style={styles.voiceModalTitle}>🎤 ગુજરાતીમાં બોલો</Text>
                        <View style={styles.voicePulseOuter}>
                            <View style={styles.voicePulseMiddle}>
                                <View style={styles.voicePulseCircle}>
                                    <Ionicons name="mic" size={40} color="#FFFFFF" />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.voiceModalStatus} numberOfLines={3}>
                            {voiceStatus}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setRecording(false);
                                setVoiceModalVisible(false);
                                webViewRef.current?.postMessage('stop');
                            }}
                            style={styles.voiceStopBtn}
                        >
                            <Ionicons name="stop-circle" size={18} color={studentColors.secondary} style={{ marginRight: 6 }} />
                            <Text style={styles.voiceStopText}>રિકોર્ડ બંધ કરો</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Hidden WebView for Speech Recognition */}
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: webViewHTML }}
                onMessage={onWebViewMessage}
                javaScriptEnabled={true}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            />

            {/* PremiumModal */}
            <PremiumModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                onUpgrade={() => {
                    setPremiumModalVisible(false);
                    navigation.navigate('PremiumAccess');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: spacing.md,
    },
    errorText: {
        fontSize: 16,
        color: studentColors.error,
        fontWeight: 'bold',
    },

    // ── Skeleton Loading ─────────────────────────────────────────────────────
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'ios' ? 44 : 14,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    skeletonBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
    },
    skeletonTabRow: {
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 10,
        justifyContent: 'space-between',
    },
    skeletonQuickRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 14,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: '#e2e8f0',
    },

    // ── Header ──────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'ios' ? 44 : 14,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        ...shadows.sm,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.2,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 1,
    },
    bookmarkBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Tabs ────────────────────────────────────────────────────
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        padding: 4,
        marginHorizontal: 16,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 46,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
    },
    activeTabText: {
        color: studentColors.secondary,
    },
    tabBadge: {
        backgroundColor: studentColors.secondary,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },

    // ── Menu Tab ─────────────────────────────────────────────────
    menuScroll: {
        paddingBottom: 40,
    },
    quickActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    quickActionBtn: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        ...shadows.sm,
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },

    // ── Questions Section ─────────────────────────────────────────
    questionsSection: {
        marginHorizontal: 14,
        marginTop: 10,
        marginBottom: 6,
    },
    questionsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        marginTop: 4,
    },
    qSectionIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    questionsSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 20,
    },
    questionsSectionSub: {
        fontSize: 11,
        color: '#6b7280',
        lineHeight: 16,
        marginTop: 1,
    },
    questionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 4,
        overflow: 'hidden',
        ...shadows.sm,
    },
    qNumBadge: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 4,
    },
    qNumBadgeIcon: {
        fontSize: 22,
    },
    qNumCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qNumText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    questionCardBody: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    questionCardText: {
        fontSize: 13,
        color: '#1f2937',
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 6,
    },
    qAiChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 3,
    },
    qAiChipText: {
        fontSize: 10,
        fontWeight: '700',
    },
    qArrowWrap: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Practice Section ──────────────────────────────────────────
    practiceSection: {
        marginTop: 8,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    practiceTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    practiceGrid: {
        gap: 8,
    },
    practiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 4,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    practiceIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    practiceInfo: {
        flex: 1,
    },
    practiceCardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    practiceCardSub: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    },

    // ── Mark Completed ─────────────────────────────────────────────
    markCompletedBtn: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: studentColors.secondary,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },
    markCompletedText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Chat Tab ─────────────────────────────────────────────────
    chatContainer: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    chatList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    msgRow: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-end',
    },
    msgUser: {
        justifyContent: 'flex-end',
    },
    msgAssistant: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        flexShrink: 0,
    },
    aiAvatarText: {
        fontSize: 16,
    },
    userAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: studentColors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        flexShrink: 0,
    },
    msgBubbleWrapper: {
        maxWidth: '80%',
    },
    msgBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    bubbleUser: {
        backgroundColor: studentColors.secondary,
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
        fontSize: 14,
        lineHeight: 21,
    },
    txtUser: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    txtAssistant: {
        color: '#1f2937',
    },
    msgTime: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 3,
    },
    msgTimeUser: {
        textAlign: 'right',
    },
    msgTimeAssistant: {
        textAlign: 'left',
        marginLeft: 4,
    },

    // ── Typing indicator ──────────────────────────────────────────
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    typingBubble: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDots: {
        flexDirection: 'row',
        marginRight: 8,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#9ca3af',
        marginHorizontal: 2,
    },
    dot1: {},
    dot2: {},
    dot3: {},
    typingText: {
        fontSize: 12,
        color: '#6b7280',
    },

    // ── Empty chat ─────────────────────────────────────────────────
    emptyChat: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 70,
        paddingHorizontal: 28,
    },
    emptyChatIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyChatEmoji: {
        fontSize: 36,
    },
    emptyChatTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptyChatSub: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 18,
    },
    quickChipsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    quickChipText: {
        fontSize: 13,
        color: studentColors.secondary,
        fontWeight: '600',
        marginLeft: 5,
    },

    // ── Image Preview ─────────────────────────────────────────────
    imagePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    imagePreviewThumb: {
        width: 42,
        height: 42,
        borderRadius: 8,
    },
    imagePreviewName: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    imagePreviewSub: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 1,
    },
    imagePreviewRemove: {
        padding: 4,
    },

    // ── Chat Input ────────────────────────────────────────────────
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
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionBtnActive: {
        backgroundColor: studentColors.error,
    },
    chatTextInput: {
        flex: 1,
        backgroundColor: '#f0f4f8',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 9,
        fontSize: 14,
        color: '#1f2937',
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chatSendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: studentColors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    sendBtnDisabled: {
        backgroundColor: '#d1d5db',
    },

    // ── Help Tab ─────────────────────────────────────────────────
    helpScroll: {
        padding: 16,
        paddingBottom: 40,
    },
    helpHero: {
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 8,
    },
    helpHeroEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    helpTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    helpCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...shadows.sm,
    },
    helpCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    helpCardIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    helpHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    helpBody: {
        fontSize: 13,
        color: '#4b5563',
        lineHeight: 19,
    },

    // ── Notes Modal ────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 14,
        height: 180,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#1f2937',
        marginBottom: 14,
        backgroundColor: '#f8fafc',
    },
    saveNotesBtn: {
        flexDirection: 'row',
        backgroundColor: studentColors.secondary,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveNotesText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },

    // ── Voice Modal ────────────────────────────────────────────────
    voiceModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceModalContent: {
        width: '82%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
    voiceModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
    },
    voicePulseOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    voicePulseMiddle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(25, 118, 210, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voicePulseCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: studentColors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    voiceModalStatus: {
        fontSize: 14,
        color: '#4b5563',
        textAlign: 'center',
        marginVertical: 16,
        lineHeight: 20,
    },
    voiceStopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 11,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    voiceStopText: {
        fontSize: 14,
        color: studentColors.secondary,
        fontWeight: '600',
    },

    // ── Citation Badge Card ──────────────────────────────────────
    citationBadgeCard: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    citationBadgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    citationChapterName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e3a8a',
        marginLeft: 6,
        flex: 1,
    },
    citationBadgeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    citationPageNoText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563eb',
    },
    citationPdfRedirectBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    citationPdfRedirectText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Skeleton ─────────────────────────────────────────────────
    skeletonActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    skeletonCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
    },

    // ── Session Error Banner ──────────────────────────────────────
    sessionErrorBanner: {
        margin: 16,
        marginBottom: 0,
        backgroundColor: '#fff5f5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
        padding: 20,
        alignItems: 'center',
    },
    sessionErrorIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    sessionErrorTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#b91c1c',
        marginBottom: 4,
        textAlign: 'center',
    },
    sessionErrorSub: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 14,
        lineHeight: 18,
    },
    sessionRetryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 6,
        marginBottom: 12,
    },
    sessionRetryBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    sessionErrorHint: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
    },
});