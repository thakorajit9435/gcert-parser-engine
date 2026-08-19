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
import ReactNativeBlobUtil from 'react-native-blob-util';
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

const { width } = Dimensions.get('window');

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

const CHAPTER_QUESTIONS_TEMPLATE = [
    {
        key: 'summary',
        icon: '📖',
        color: '#2563eb',
        bgColor: '#eff6ff',
        category: 'સારાંશ',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણનો સંક્ષિપ્ત સારાંશ ગુજરાતીમાં આપો.`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણ શું વિશે છે? મુખ્ય સારાંશ આપો.`,
    },
    {
        key: 'keynotes',
        icon: '📝',
        color: '#7c3aed',
        bgColor: '#f5f3ff',
        category: 'IMP મુદ્દા',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણના પરીક્ષામાં આવી શકે તેવા ૫ મહત્વના મુદ્દા આપો.`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ મહત્વના પ્રશ્નો (Key Points) જણાવો.`,
    },
    {
        key: 'exercise',
        icon: '✏️',
        color: '#db2777',
        bgColor: '#fdf2f8',
        category: 'સ્વાધ્યાય',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" ના સ્વાધ્યાયના મુખ્ય પ્રશ્નો અને ઉત્તરો સમજાવો.`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના સ્વાધ્યાય (Exercise) ના પ્રશ્નોત્તર આપો.`,
    },
    {
        key: 'mcq',
        icon: '🎯',
        color: '#d97706',
        bgColor: '#fffbeb',
        category: 'MCQ ટેસ્ટ',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ MCQ (બહુ-વિકલ્પ) પ્રશ્નો સાચા ઉત્તર સાથે આપો.`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" ના ૫ MCQ (ગુજરાતી) ઉત્તર સહ પૂછો.`,
    },
    {
        key: 'funfact',
        icon: '🌟',
        color: '#059669',
        bgColor: '#ecfdf5',
        category: 'રોચક તથ્ય',
        getQuestion: (chapterTitle: string) =>
            `"${chapterTitle}" પ્રકરણ સંબંધિત ૩ રસપ્રદ અજ્ઞાત વાતો (Fun Facts) જણાવો.`,
        displayQ: (chapterTitle: string) =>
            `"${chapterTitle}" વિશે ૩ રોચક Fun Facts શું છે?`,
    },
];

const FOLLOW_UP_CHIPS = [
    { icon: '❓', text: 'અન્ય ૫ MCQ પૂછો' },
    { icon: '💡', text: 'વધુ વિગતવાર સમજાવો' },
    { icon: '📝', text: 'સરળ ભાષામાં ફરી લખો' },
    { icon: '🧪', text: 'વાસ્તવિક ઉદાહરણ આપો' },
];

export function ChapterDetailScreen(props: any): React.JSX.Element {
    return (
        <ErrorBoundary fallbackMessage="પ્રકરણ વિગતો લોડ કરવામાં ભૂલ આવી.">
            <ChapterDetailScreenLoader {...props} />
        </ErrorBoundary>
    );
}

function ChapterDetailScreenLoader({ route, navigation }: any): React.JSX.Element {
    const { chapterId } = route.params;
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

    return <ChapterDetailScreenContent chapter={chapter} navigation={navigation} />;
}

function ChapterDetailScreenContent({ chapter, navigation }: { chapter: Chapter; navigation: any }): React.JSX.Element {
    const { user } = useAuth();
    const { getChapterProgress } = useUserProgress(chapter.subjectId);
    const { isBookmarked, toggle } = useBookmarks(user?.uid);

    const [activeTab, setActiveTab] = useState<'menu' | 'chat'>('menu');
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
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const webViewRef = useRef<any>(null);

    const chapterProgress = getChapterProgress(chapter.id);
    const isCompleted = chapterProgress?.isCompleted || false;
    const isChapterBookmarked = isBookmarked(chapter.id);
    const chapterTitle = chapter.titleGu || chapter.title;

    // Track analytics & last opened
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

    // Load saved notes
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

    // Fetch dynamic questions from Firestore MCQs
    useEffect(() => {
        const fetchSuggestedQuestions = async () => {
            try {
                const snap = await firestore()
                    .collection(COLLECTIONS.MCQS)
                    .where('chapterId', '==', chapter.id)
                    .limit(6)
                    .get();

                if (!snap.empty) {
                    const qList = snap.docs
                        .map(doc => doc.data()?.questionGu || doc.data()?.question || '')
                        .filter(Boolean);
                    if (qList.length > 0) {
                        setSuggestedQuestions(qList);
                    }
                }
            } catch (err) {
                console.warn('[ChapterDetailScreen] MCQs fetch error:', err);
            }
        };
        fetchSuggestedQuestions();
    }, [chapter.id]);

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
        if (sid) {
            setSessionError(false);
        }
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

    const openPDF = () => {
        if (!chapter.pdfUrl) {
            Alert.alert('Notice', 'આ પ્રકરણ માટે ડિજિટલ પુસ્તક ઉપલબ્ધ નથી.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: chapter.pdfUrl,
            title: chapterTitle,
            pdfId: chapter.id,
            pdfType: 'chapter',
            startPage: chapter.startPage || 1,
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
            title: `${chapterTitle} (પાનું ${targetPage || startPageToUse})`,
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
            await AsyncStorage.setItem(`notes_${chapter.id}`, text);
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
        const displayQuestion = item.displayText;

        const contextPrefix =
            `[સંદર્ભ: ધોરણ ${chapter.standardId}, વિષય: ${chapter.subjectId}, પ્રકરણ: "${chapterTitle}", પ્રકરણ ક્રમાંક: ${chapter.id}]\nવિનંતી: કૃપા કરીને ફક્ત આ ખુલેલા પ્રકરણ ("${chapterTitle}") ના જ ઉત્તરો તથા પ્રશ્નોત્તરી આપો.\n`;
        const questionText = contextPrefix + item.questionText;

        setActiveTab('chat');

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

        const userMsg: Message = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: selectedImage
                ? `[📷 ફોટો: ${selectedImage.name}]\n${displayQueryText}`
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
                content: '⚠️ માફ કરશો, AI સર્વર સાથે જોડાવામાં સમય લાગી રહ્યો છે. કૃપા કરીને ૧૦-૧૫ સેકન્ડ પછી ફરીથી પ્રયત્ન કરો.',
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

    const suggestedItems = suggestedQuestions.length > 0
        ? suggestedQuestions.map((qText, idx) => {
            const colors = [
                { color: '#2563eb', bgColor: '#eff6ff', icon: '🎯', category: 'MCQ પ્રશ્ન' },
                { color: '#7c3aed', bgColor: '#f5f3ff', icon: '📝', category: 'IMP મુદ્દો' },
                { color: '#db2777', bgColor: '#fdf2f8', icon: '✏️', category: 'સ્વાધ્યાય' },
                { color: '#d97706', bgColor: '#fffbeb', icon: '🌟', category: 'વિચારવા જેવું' },
                { color: '#059669', bgColor: '#ecfdf5', icon: '📖', category: 'વાંચન' }
            ];
            const styleConfig = colors[idx % colors.length] || {
                color: '#2563eb',
                bgColor: '#eff6ff',
                icon: '🎯',
                category: 'MCQ પ્રશ્ન'
            };
            return {
                key: `suggested_${idx}`,
                icon: styleConfig.icon,
                color: styleConfig.color,
                bgColor: styleConfig.bgColor,
                category: styleConfig.category,
                questionText: qText,
                displayText: qText
            };
        })
        : CHAPTER_QUESTIONS_TEMPLATE.map((q) => ({
            key: q.key,
            icon: q.icon,
            color: q.color,
            bgColor: q.bgColor,
            category: q.category,
            questionText: q.getQuestion(chapterTitle),
            displayText: q.displayQ(chapterTitle)
        }));

    return (
        <View style={styles.container}>
            {/* Header with Safe Area */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#1d4ed8' }}>
                <View style={styles.header}>
                    <AnimatedPressable onPress={() => navigation.goBack()} style={styles.headerIconBtn} scaleTo={0.88}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </AnimatedPressable>

                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerMainTitle} numberOfLines={1}>
                            {chapterTitle}
                        </Text>
                        <Text style={styles.headerSubTitle} numberOfLines={1}>
                            {chapter.title}
                        </Text>
                    </View>

                    <View style={styles.headerRightActions}>
                        <AnimatedPressable
                            onPress={() => setNotesModalVisible(true)}
                            style={styles.headerIconBtn}
                            scaleTo={0.88}
                        >
                            <Ionicons name="document-text-outline" size={19} color="#fff" />
                        </AnimatedPressable>

                        <AnimatedPressable
                            onPress={handleToggleBookmark}
                            style={styles.headerIconBtn}
                            disabled={updating}
                            scaleTo={0.88}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons
                                    name={isChapterBookmarked ? 'star' : 'star-outline'}
                                    size={19}
                                    color={isChapterBookmarked ? '#facc15' : '#fff'}
                                />
                            )}
                        </AnimatedPressable>
                    </View>
                </View>

                {/* Modern Segmented Pill Tabs */}
                <View style={styles.tabContainer}>
                    <AnimatedPressable
                        style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
                        onPress={() => setActiveTab('menu')}
                        scaleTo={0.95}
                    >
                        <Ionicons
                            name="grid"
                            size={16}
                            color={activeTab === 'menu' ? '#1d4ed8' : 'rgba(255,255,255,0.8)'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
                            પ્રકરણ ઓવરવ્યૂ
                        </Text>
                    </AnimatedPressable>

                    <AnimatedPressable
                        style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
                        onPress={() => setActiveTab('chat')}
                        scaleTo={0.95}
                    >
                        <Ionicons
                            name="chatbubbles"
                            size={16}
                            color={activeTab === 'chat' ? '#1d4ed8' : 'rgba(255,255,255,0.8)'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
                            AI Chat (ટ્યુટર)
                        </Text>
                        {messages.length > 0 && (
                            <View style={[styles.tabBadge, activeTab === 'chat' && styles.tabBadgeActive]}>
                                <Text style={[styles.tabBadgeText, activeTab === 'chat' && styles.tabBadgeTextActive]}>
                                    {messages.length}
                                </Text>
                            </View>
                        )}
                    </AnimatedPressable>
                </View>
            </SafeAreaView>

            {/* ─── TAB 1: MENU / OVERVIEW ─── */}
            {activeTab === 'menu' && (
                <ScrollView contentContainerStyle={styles.menuScroll} showsVerticalScrollIndicator={false}>

                    {/* Chapter Hero Info Card */}
                    <View style={styles.chapterHeroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.orderBadge}>
                                <Text style={styles.orderBadgeText}>પ્રકરણ વિગતો</Text>
                            </View>
                            <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusInProgress]}>
                                <Text style={[styles.statusBadgeText, isCompleted ? styles.statusTextCompleted : styles.statusTextInProgress]}>
                                    {isCompleted ? '✓ પૂર્ણ થયેલ' : '▶️ અભ્યાસ ચાલુ'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>{chapterTitle}</Text>
                        {chapter.titleGu && chapter.title !== chapter.titleGu ? (
                            <Text style={styles.heroSubTitle}>{chapter.title}</Text>
                        ) : null}

                        {/* Page Range Pill */}
                        <View style={styles.heroMetaRow}>
                            {chapter.startPage ? (
                                <View style={styles.heroPageBadge}>
                                    <Ionicons name="book" size={13} color="#2563eb" />
                                    <Text style={styles.heroPageBadgeText}>
                                        પાઠ્યપુસ્તક પાના: {chapter.endPage ? `${chapter.startPage} - ${chapter.endPage}` : chapter.startPage}
                                    </Text>
                                </View>
                            ) : null}
                            {chapterNotes ? (
                                <View style={[styles.heroPageBadge, { backgroundColor: '#fdf4ff', borderColor: '#f0abfc' }]}>
                                    <Ionicons name="create" size={13} color="#c026d3" />
                                    <Text style={[styles.heroPageBadgeText, { color: '#c026d3' }]}>
                                        નોંધ સાચવેલ છે
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {chapter.description ? (
                            <Text style={styles.heroDesc} numberOfLines={2}>
                                {chapter.description}
                            </Text>
                        ) : null}
                    </View>

                    {/* Modern 2x2 Interactive Tools Grid */}
                    <View style={styles.toolsSection}>
                        <Text style={styles.sectionHeading}>⚡ મુખ્ય સાધનો & અભ્યાસ સામગ્રી</Text>
                        <View style={styles.toolsGrid}>
                            <AnimatedPressable
                                style={[styles.toolCard, { borderTopColor: '#2563eb' }]}
                                onPress={openPDF}
                                scaleTo={0.94}
                            >
                                <View style={[styles.toolIconBox, { backgroundColor: '#eff6ff' }]}>
                                    <Ionicons name="book-outline" size={22} color="#2563eb" />
                                </View>
                                <Text style={styles.toolTitle}>પાઠ્યપુસ્તક</Text>
                                <Text style={styles.toolSub}>ડિજિટલ PDF</Text>
                            </AnimatedPressable>

                            <AnimatedPressable
                                style={[styles.toolCard, { borderTopColor: '#7c3aed' }]}
                                onPress={() => setNotesModalVisible(true)}
                                scaleTo={0.94}
                            >
                                <View style={[styles.toolIconBox, { backgroundColor: '#f5f3ff' }]}>
                                    <Ionicons name="document-text-outline" size={22} color="#7c3aed" />
                                </View>
                                <Text style={styles.toolTitle}>મારી નોંધ</Text>
                                <Text style={styles.toolSub}>ચેપ્ટર નોટ્સ</Text>
                            </AnimatedPressable>

                            <AnimatedPressable
                                style={[styles.toolCard, { borderTopColor: '#059669' }]}
                                onPress={() => navigateToQuiz(false)}
                                scaleTo={0.94}
                            >
                                <View style={[styles.toolIconBox, { backgroundColor: '#ecfdf5' }]}>
                                    <Ionicons name="trophy-outline" size={22} color="#059669" />
                                </View>
                                <Text style={styles.toolTitle}>MCQ ક્વિઝ</Text>
                                <Text style={styles.toolSub}>ટેસ્ટ પ્રેક્ટિસ</Text>
                            </AnimatedPressable>

                            <AnimatedPressable
                                style={[styles.toolCard, { borderTopColor: '#d97706' }]}
                                onPress={() => navigation.navigate('StudentFlashcards', { chapterId: chapter.id, chapterTitle })}
                                scaleTo={0.94}
                            >
                                <View style={[styles.toolIconBox, { backgroundColor: '#fffbeb' }]}>
                                    <Ionicons name="flash-outline" size={22} color="#d97706" />
                                </View>
                                <Text style={styles.toolTitle}>ફ્લેશકાર્ડ્સ</Text>
                                <Text style={styles.toolSub}>ઝડપી રિવિઝન</Text>
                            </AnimatedPressable>
                        </View>
                    </View>

                    {/* Mark Completed Button */}
                    {!isCompleted && (
                        <AnimatedPressable
                            style={styles.markCompletedBtn}
                            onPress={handleMarkCompleted}
                            disabled={updating}
                            scaleTo={0.96}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.markCompletedText}>આ પ્રકરણ પૂર્ણ થયું તરીકે ચિહ્નિત કરો</Text>
                                </>
                            )}
                        </AnimatedPressable>
                    )}
                </ScrollView>
            )}

            {/* ─── TAB 2: AI CHAT ─── */}
            {activeTab === 'chat' && (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    {/* Connection Error Banner */}
                    {sessionError && (
                        <View style={styles.sessionErrorBanner}>
                            <Ionicons name="cloud-offline-outline" size={22} color="#ef4444" style={{ marginRight: 8 }} />
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
                                                            {item.citations && item.citations[0]?.chapter ? item.citations[0].chapter : chapterTitle}
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
                                    આ પ્રકરણમાંથી કોઈપણ પ્રશ્ન પૂછો. AI સીધા પાઠ્યપુસ્તકમાંથી ઉત્તર આપશે!
                                </Text>

                                <Text style={styles.emptyQuickTitle}>ઝડપી પ્રશ્નો 👇</Text>
                                <View style={styles.emptyChipsGrid}>
                                    {suggestedItems.map((q: any) => (
                                        <AnimatedPressable
                                            key={q.key}
                                            style={styles.emptyChip}
                                            onPress={() => handleQuestionPress(q)}
                                            scaleTo={0.96}
                                        >
                                            <Text style={styles.emptyChipIcon}>{q.icon}</Text>
                                            <Text style={styles.emptyChipText} numberOfLines={1}>{q.displayText}</Text>
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
                            <View style={styles.typingBubble}>
                                <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
                                <Text style={styles.typingText}>AI ઉત્તર તૈયાર કરી રહ્યો છે...</Text>
                            </View>
                        </View>
                    )}

                    {/* Follow-up Quick Chips */}
                    {messages.length > 0 && !chatLoading && (
                        <View style={styles.followUpBar}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.followUpScroll}>
                                {FOLLOW_UP_CHIPS.map((chip, idx) => (
                                    <AnimatedPressable
                                        key={idx}
                                        style={styles.followUpChip}
                                        onPress={() => handleSend(chip.text)}
                                        scaleTo={0.93}
                                    >
                                        <Text style={styles.followUpIcon}>{chip.icon}</Text>
                                        <Text style={styles.followUpText}>{chip.text}</Text>
                                    </AnimatedPressable>
                                ))}
                            </ScrollView>
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
                                <Ionicons name="close-circle" size={24} color={studentColors.error} />
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
                                size={22}
                                color={recording ? '#FFFFFF' : '#2563eb'}
                            />
                        </AnimatedPressable>

                        <AnimatedPressable onPress={handlePickImage} style={styles.inputActionBtn} scaleTo={0.90}>
                            <Ionicons name="camera-outline" size={22} color="#2563eb" />
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
                            <Ionicons name="send" size={17} color="#FFFFFF" />
                        </AnimatedPressable>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Chapter Notes Bottom Sheet Modal */}
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
                            multiline
                            placeholder="આ પ્રકરણ વાંચતી વખતે અગત્યના મુદ્દા અહીં નોંધો..."
                            placeholderTextColor="#94a3b8"
                            value={chapterNotes}
                            onChangeText={saveChapterNotes}
                        />
                        <AnimatedPressable style={styles.saveNotesBtn} onPress={() => setNotesModalVisible(false)} scaleTo={0.96}>
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.saveNotesText}>સાચવો અને બંધ કરો</Text>
                        </AnimatedPressable>
                    </View>
                </View>
            </Modal>

            {/* Voice Speech Modal */}
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
                                    <Ionicons name="mic" size={38} color="#FFFFFF" />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.voiceModalTitle}>🎤 ગુજરાતીમાં બોલો</Text>
                        <Text style={styles.voiceModalStatus} numberOfLines={3}>
                            {voiceStatus}
                        </Text>
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
            </Modal>

            {/* Hidden WebView for Speech recognition */}
            <WebView
                ref={webViewRef}
                source={{ html: webViewHTML }}
                onMessage={onWebViewMessage}
                javaScriptEnabled={true}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F1F5F9',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#334155',
        marginTop: 12,
        marginBottom: 16,
        fontWeight: '700',
    },
    retryBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
    },

    // ── Header ─────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#1d4ed8',
        gap: 8,
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        paddingHorizontal: 4,
    },
    headerMainTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    headerSubTitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 1,
    },
    headerRightActions: {
        flexDirection: 'row',
        gap: 6,
    },

    // ── Segmented Pill Tab Bar ─────────────────────────────────────
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e40af',
        padding: 6,
        gap: 6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        ...shadows.sm,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
    },
    tabTextActive: {
        color: '#1d4ed8',
        fontWeight: '800',
    },
    tabBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        marginLeft: 6,
    },
    tabBadgeActive: {
        backgroundColor: '#dbeafe',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    tabBadgeTextActive: {
        color: '#1d4ed8',
    },

    // ── Menu / Overview Scroll ─────────────────────────────────────
    menuScroll: {
        padding: 14,
        paddingBottom: 24,
    },

    // ── Chapter Hero Card ──────────────────────────────────────────
    chapterHeroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    orderBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb',
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusCompleted: {
        backgroundColor: '#ecfdf5',
    },
    statusInProgress: {
        backgroundColor: '#fffbeb',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusTextCompleted: {
        color: '#059669',
    },
    statusTextInProgress: {
        color: '#d97706',
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    heroSubTitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    heroMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
        marginBottom: 6,
    },
    heroPageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    heroPageBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1e40af',
    },
    heroDesc: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 18,
        marginTop: 6,
    },

    // ── Tools Grid ─────────────────────────────────────────────────
    toolsSection: {
        marginBottom: 16,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 10,
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    toolCard: {
        width: (width - 38) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderTopWidth: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    toolIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    toolTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    toolSub: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 2,
    },

    // ── Question Cards Section ─────────────────────────────────────
    questionsSection: {
        marginBottom: 16,
    },
    questionsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    qSectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionsSectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    questionsSectionSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 1,
    },
    questionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
        gap: 10,
    },
    qIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qEmoji: {
        fontSize: 16,
    },
    questionCardBody: {
        flex: 1,
    },
    qCategoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 6,
        marginBottom: 3,
    },
    qCategoryText: {
        fontSize: 9.5,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    questionCardText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: 18,
    },
    qArrowWrap: {
        marginLeft: 2,
    },

    // ── Mark Completed Button ──────────────────────────────────────
    markCompletedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginTop: 4,
        ...shadows.sm,
    },
    markCompletedText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // ── Chat Tab Styles ────────────────────────────────────────────
    chatList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
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
    },
    aiAvatarText: {
        fontSize: 18,
    },
    userAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        flexShrink: 0,
    },
    msgBubbleWrapper: {
        maxWidth: width * 0.78,
    },
    msgBubble: {
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bubbleUser: {
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 3,
        ...shadows.sm,
    },
    bubbleAssistant: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    msgText: {
        fontSize: 13.5,
        lineHeight: 20,
    },
    txtUser: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    txtAssistant: {
        color: '#0f172a',
    },
    msgTime: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 3,
    },
    msgTimeUser: {
        textAlign: 'right',
        marginRight: 2,
    },
    msgTimeAssistant: {
        marginLeft: 4,
    },

    // ── Citation Card ──────────────────────────────────────────────
    citationBadgeCard: {
        marginTop: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    citationBadgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    citationChapterName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    citationBadgeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 3,
    },
    citationPageNoText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },
    citationRedirectText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb',
    },

    // ── Empty Chat ─────────────────────────────────────────────────
    emptyChat: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyChatIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyChatEmoji: {
        fontSize: 26,
    },
    emptyChatTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
        textAlign: 'center',
    },
    emptyChatSub: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    emptyQuickTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    emptyChipsGrid: {
        width: '100%',
        gap: 6,
    },
    emptyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8,
        ...shadows.sm,
    },
    emptyChipIcon: {
        fontSize: 14,
    },
    emptyChipText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
    },

    // ── Follow-Up Bar ──────────────────────────────────────────────
    followUpBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingVertical: 6,
    },
    followUpScroll: {
        paddingHorizontal: 12,
        gap: 6,
    },
    followUpChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 10,
        gap: 4,
    },
    followUpIcon: {
        fontSize: 12,
    },
    followUpText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1d4ed8',
    },

    // ── Typing Indicator ───────────────────────────────────────────
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 8,
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
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },

    // ── Image Preview ──────────────────────────────────────────────
    imagePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderTopWidth: 1,
        borderTopColor: '#bfdbfe',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    imagePreviewThumb: {
        width: 36,
        height: 36,
        borderRadius: 6,
    },
    imagePreviewName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e40af',
    },
    imagePreviewSub: {
        fontSize: 10,
        color: '#64748b',
    },

    // ── Chat Input Bar ─────────────────────────────────────────────
    chatInputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    inputActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionBtnActive: {
        backgroundColor: '#ef4444',
    },
    chatTextInput: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 8 : 6,
        fontSize: 13,
        color: '#0f172a',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        maxHeight: 90,
    },
    chatSendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },

    // ── Notes Modal Bottom Sheet ───────────────────────────────────
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
        minHeight: 380,
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
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    notesInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        fontSize: 13,
        color: '#0f172a',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 200,
        textAlignVertical: 'top',
        lineHeight: 20,
    },
    saveNotesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 13,
        marginTop: 14,
    },
    saveNotesText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Voice Modal ────────────────────────────────────────────────
    voiceModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    voiceModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        ...shadows.lg,
    },
    voiceRingOuter: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    voiceRingMid: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#93c5fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceRingInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceModalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    voiceModalStatus: {
        fontSize: 13,
        color: '#334155',
        textAlign: 'center',
        lineHeight: 19,
        minHeight: 40,
        marginBottom: 16,
    },
    voiceModalCancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    voiceModalCancelText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1d4ed8',
    },
});