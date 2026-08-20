import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { useStandardContext } from '../../context/StandardContext';
import { useSubjects } from '../../hooks/useSubjects';
import { shadows } from '../../theme';
import { aiTutorService, CitationItem } from '../../services/aiTutor.service';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: any;
  citations?: CitationItem[];
  pageNumber?: number;
}

interface SuggestionCardItem {
  id: string;
  icon: string;
  category: string;
  color: string;
  bg: string;
  title: string;
  prompt: string;
}

const SUBJECT_EMOJIS: Record<string, string> = {
  mathematics: '📐',
  maths: '📐',
  math: '📐',
  ગણિત: '📐',
  science: '🔬',
  વિજ્ઞાન: '🔬',
  english: '📖',
  અંગ્રેજી: '📖',
  hindi: '📝',
  હિન્દી: '📝',
  gujarati: '🔤',
  ગુજરાતી: '🔤',
  'social science': '🌍',
  'સામાજિક વિજ્ઞાન': '🌍',
  socialscience: '🌍',
  computer: '💻',
  કમ્પ્યુટર: '💻',
  sanskrit: '📜',
  સંસ્કૃત: '📜',
  default: '📚',
};

const getSubjectEmoji = (name?: string) => {
  if (!name) return '📚';
  const clean = name.toLowerCase().trim();
  for (const key of Object.keys(SUBJECT_EMOJIS)) {
    if (clean.includes(key)) return SUBJECT_EMOJIS[key];
  }
  return SUBJECT_EMOJIS.default;
};

// Generates intelligent subject and standard-based quiz & practice suggestions
const getSubjectQuizSuggestions = (
  standard: string,
  subjectName?: string,
  subjectNameGu?: string
): SuggestionCardItem[] => {
  const stdLabel = `ધોરણ ${standard}`;
  const sub = subjectNameGu || subjectName || 'બધા વિષયો';

  if (!subjectName || subjectName === 'all' || subjectName === 'General') {
    return [
      {
        id: 'quiz_all_1',
        icon: '🎯',
        category: 'MCQ ક્વિઝ',
        color: '#2563eb',
        bg: '#eff6ff',
        title: `${stdLabel} નો ૫ MCQ મોક ટેસ્ટ`,
        prompt: `મને ${stdLabel} ના તમામ વિષયોમાંથી ૫ મહત્વના MCQ પ્રશ્નો તેમના ૪ વિકલ્પો, સાચો જવાબ અને ગુજરાતીમાં સમજૂતી સાથે પૂછો.`,
      },
      {
        id: 'quiz_all_2',
        icon: '⚡',
        category: 'IMP પ્રશ્નો',
        color: '#d97706',
        bg: '#fffbeb',
        title: `${stdLabel} ના ૧૦ મોસ્ટ IMP પ્રશ્નો`,
        prompt: `${stdLabel} ની પરીક્ષા માટે વારંવાર પૂછાતા સૌથી મહત્વના ૧૦ પ્રશ્નો અને તેના મુખ્ય મુદ્દાઓ જણાવો.`,
      },
      {
        id: 'quiz_all_3',
        icon: '💡',
        category: 'સરળ સમજૂતી',
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: `કોઈપણ ટોપિક સરળ ભાષામાં શીખો`,
        prompt: `મને ${stdLabel} ના અભ્યાસક્રમમાંથી સૌથી મહત્વનો ટોપિક ખૂબ જ સરળ અને રસપ્રદ રીતે ગુજરાતીમાં સમજાવો.`,
      },
      {
        id: 'quiz_all_4',
        icon: '🌟',
        category: 'રોચક તથ્ય',
        color: '#059669',
        bg: '#ecfdf5',
        title: `${stdLabel} ના ૩ રસપ્રદ વૈજ્ઞાનિક તથ્યો`,
        prompt: `${stdLabel} ના પુસ્તક સંબંધિત ૩ અદ્ભુત અને રસપ્રદ તથ્યો (Fun Facts) જણાવો.`,
      },
    ];
  }

  return [
    {
      id: `quiz_${subjectName}_1`,
      icon: '🎯',
      category: 'MCQ ક્વિઝ',
      color: '#2563eb',
      bg: '#eff6ff',
      title: `${sub} ના ૫ MCQ પૂછો`,
      prompt: `મને ${stdLabel} ના ${sub} વિષયમાંથી ૫ મહત્વના MCQ પ્રશ્નો ૪ વિકલ્પો (A, B, C, D) સાથે પૂછો અને અંતે સાચા ઉત્તરો આપો.`,
    },
    {
      id: `quiz_${subjectName}_2`,
      icon: '📝',
      category: 'પરીક્ષા તૈયારી',
      color: '#d97706',
      bg: '#fffbeb',
      title: `${sub} ના મોસ્ટ IMP પ્રશ્નો`,
      prompt: `${stdLabel} ના ${sub} વિષયના વાર્ષિક/સત્રાંત પરીક્ષા માટેના સૌથી મહત્વના પ્રશ્નો અને તેના ઉત્તરો સમજાવો.`,
    },
    {
      id: `quiz_${subjectName}_3`,
      icon: '💡',
      category: 'શંકા સમાધાન',
      color: '#7c3aed',
      bg: '#f5f3ff',
      title: `${sub} ના મુખ્ય સૂત્રો / નિયમો`,
      prompt: `${stdLabel} ના ${sub} વિષયના તમામ મહત્વના સૂત્રો, વ્યાખ્યાઓ અને નિયમો એક સરળ યાદીમાં આપો.`,
    },
    {
      id: `quiz_${subjectName}_4`,
      icon: '🧪',
      category: 'ઉદાહરણ સાથે',
      color: '#059669',
      bg: '#ecfdf5',
      title: `વાસ્તવિક ઉદાહરણ સાથે સમજાવો`,
      prompt: `${stdLabel} ના ${sub} ના કોઈપણ એક અઘરા પ્રકરણનો કોન્સેપ્ટ વાસ્તવિક જીવનના ઉદાહરણ સાથે સરળ ભાષામાં સમજાવો.`,
    },
  ];
};

const FOLLOW_UP_PROMPTS = [
  { icon: '❓', text: 'અન્ય ૫ MCQ પૂછો' },
  { icon: '💡', text: 'વધુ વિગતવાર સમજાવો' },
  { icon: '📝', text: 'સરળ ભાષામાં ફરી લખો' },
  { icon: '🧪', text: 'વાસ્તવિક ઉદાહરણ આપો' },
  { icon: '🎯', text: 'આમાંથી એક ક્વિઝ બનાવો' },
];

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

export function AITutorScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { userProfile } = useAuth();
  const { selectedStandard } = useStandardContext();
  const initialSessionId = route.params?.sessionId;
  const initialSubject = route.params?.subject;

  // Subjects query from Firestore for current selected standard
  const { subjects, loading: subjectsLoading } = useSubjects(selectedStandard);

  const [activeSubject, setActiveSubject] = useState<{ id: string; name: string; nameGu?: string } | null>(
    initialSubject ? { id: initialSubject, name: initialSubject } : null
  );

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('સાંભળી રહ્યા છીએ...');
  const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string; name: string } | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const webViewRef = useRef<any>(null);

  // Sync active subject when route param or standard changes
  useEffect(() => {
    if (initialSubject) {
      const match = subjects.find(s => s.name.toLowerCase() === initialSubject.toLowerCase() || s.nameGu === initialSubject);
      if (match) {
        setActiveSubject({ id: match.id, name: match.name, nameGu: match.nameGu });
      } else {
        setActiveSubject({ id: initialSubject, name: initialSubject });
      }
    }
  }, [initialSubject, subjects]);

  // Load existing session messages & bookmark status
  useEffect(() => {
    if (!sessionId) return;

    const loadSessionData = async () => {
      try {
        const [savedMsgs, savedBookmark] = await Promise.all([
          AsyncStorage.getItem(`chat_messages_${sessionId}`),
          AsyncStorage.getItem(`chat_bookmarked_${sessionId}`),
        ]);

        if (savedMsgs) {
          const parsed = JSON.parse(savedMsgs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
        if (savedBookmark === 'true') {
          setIsBookmarked(true);
        } else {
          setIsBookmarked(false);
        }
      } catch (err) {
        console.log('Session cache load notice:', err);
      }
    };

    loadSessionData();
  }, [sessionId]);

  // Dynamic suggestions for standard & active subject
  const currentSuggestions = useMemo(() => {
    return getSubjectQuizSuggestions(
      selectedStandard,
      activeSubject?.name,
      activeSubject?.nameGu
    );
  }, [selectedStandard, activeSubject]);

  const handleToggleSubject = (sub: { id: string; name: string; nameGu?: string } | null) => {
    setActiveSubject(sub);
  };

  const handleSelectSuggestion = (suggestion: SuggestionCardItem) => {
    handleSend(suggestion.prompt);
  };

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || inputText;
    if ((!textToSend.trim() && !selectedImage) || loading) return;

    const userText = textToSend.trim();
    setInputText('');
    setLoading(true);

    let activeSessionId = sessionId;

    try {
      // 1. Create session if not existing
      if (!activeSessionId && userProfile?.uid) {
        const title = activeSubject
          ? `${activeSubject.nameGu || activeSubject.name}: ${userText.slice(0, 30)}`
          : userText.slice(0, 35) || 'નવી ચેટ';

        activeSessionId = await aiTutorService.createChatSession(userProfile.uid, title, {
          standard: selectedStandard,
          subject: activeSubject?.name || 'General',
        });
        setSessionId(activeSessionId);
      }

      // Optimistic user message append
      const optimisticMsg: Message = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: selectedImage ? `[📷 ફોટો: ${selectedImage.name}]\n${userText}` : userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // 2. Multimodal OCR or Standard Text Query
      let aiContent = '';
      let aiCitations: CitationItem[] | undefined = undefined;

      if (selectedImage) {
        const fs = ReactNativeBlobUtil.fs;
        const base64Data = await fs.readFile(selectedImage.uri, 'base64');
        const imgType = selectedImage.type || 'image/jpeg';
        setSelectedImage(null);

        aiContent = await aiTutorService.sendMultimodalDoubt(
          base64Data,
          userText || 'કૃપા કરીને આ છબીમાં રહેલા પ્રશ્નનો સચોટ ગુજરાતીમાં ઉત્તર આપો.',
          imgType
        );
      } else {
        // Text message through GCERT Parser Engine
        if (activeSessionId) {
          const response = await aiTutorService.sendChatMessage(
            activeSessionId,
            userText,
            {
              standard: selectedStandard,
              subject: activeSubject?.name || 'General',
              language: 'gu',
            }
          );
          aiContent = response.answer;
          aiCitations = response.citations;
        }
      }

      if (aiContent) {
        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: aiContent,
          citations: aiCitations,
          timestamp: new Date(),
        };

        setMessages(prev => {
          const updated = [...prev, aiMsg];
          if (activeSessionId) {
            AsyncStorage.setItem(`chat_messages_${activeSessionId}`, JSON.stringify(updated)).catch(() => { });
          }
          return updated;
        });
      }

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err: any) {
      console.error('Failed to send AI tutor query', err);
      Alert.alert(
        'AI કનેક્શન ક્ષતિ',
        'AI સર્વર સાથે જોડાણ થઈ શક્યું નથી. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const nextState = !isBookmarked;
      setIsBookmarked(nextState);
      if (sessionId) {
        await AsyncStorage.setItem(`chat_bookmarked_${sessionId}`, String(nextState));
        aiTutorService.bookmarkChatSession(sessionId, nextState).catch(() => { });
      }
      Alert.alert('બુકમાર્ક', nextState ? 'ચેટ સત્ર સાચવવામાં આવ્યું છે ⭐' : 'બુકમાર્ક દૂર કર્યું');
    } catch (e) {
      console.error('Bookmark update failed', e);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setSelectedImage(null);
    setInputText('');
    setIsBookmarked(false);
  };

  const handleDelete = async () => {
    Alert.alert('ચેટ સાફ કરો', 'શું તમે આ ચેટ સત્રને સંપૂર્ણપણે ડિલીટ કરવા માંગો છો?', [
      { text: 'રદ કરો', style: 'cancel' },
      {
        text: 'ડિલીટ કરો',
        style: 'destructive',
        onPress: async () => {
          try {
            if (sessionId) {
              await AsyncStorage.removeItem(`chat_bookmarked_${sessionId}`);
              await AsyncStorage.removeItem(`chat_messages_${sessionId}`);
              aiTutorService.deleteChatSession(sessionId).catch(() => { });
            }
            handleNewChat();
          } catch (e) {
            console.error('Failed to delete chat session', e);
          }
        },
      },
    ]);
  };

  const handleCopyMessage = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('કૉપિ થયું', 'જવાબ ક્લિપબોર્ડમાં કૉપિ થઈ ગયો છે ✅');
  };

  // Image upload
  const handlePickImage = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      if (res && res.uri) {
        setSelectedImage({
          uri: res.uri,
          type: res.type || 'image/jpeg',
          name: res.name || 'question.jpg',
        });
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Image picker error:', err);
      }
    }
  };

  // Voice speech-to-text
  const handleVoicePress = () => {
    if (recording) {
      setRecording(false);
      setVoiceModalVisible(false);
      webViewRef.current?.postMessage('stop');
    } else {
      setRecording(true);
      setVoiceStatus('સાંભળી રહ્યા છીએ... ગુજરાતીમાં બોલો');
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
      } else if (data.type === 'error' || data.type === 'end') {
        setRecording(false);
        setVoiceModalVisible(false);
      }
    } catch (e) {
      console.error('Voice dictation error:', e);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Render a single chat bubble
  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isLast = index === messages.length - 1;

    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI, isLast && { marginBottom: 16 }]}>
        {/* AI avatar */}
        {!isUser && (
          <View style={styles.bubbleAIAvatar}>
            <Text style={styles.bubbleAIEmoji}>🤖</Text>
          </View>
        )}

        <View style={styles.msgWrapper}>
          <View style={[styles.msgCard, isUser ? styles.msgCardUser : styles.msgCardAI]}>
            <Text style={[styles.msgContentText, isUser ? styles.msgContentUser : styles.msgContentAI]}>
              {item.content}
            </Text>

            {/* Citations / Textbook Reference Card */}
            {!isUser && item.citations && item.citations.length > 0 && item.citations[0] && (
              <View style={styles.citationCard}>
                <View style={styles.citationHeader}>
                  <Ionicons name="book" size={13} color="#2563eb" />
                  <Text style={styles.citationTitle}>
                    {item.citations[0]?.chapter || 'પાઠ્યપુસ્તક સંદર્ભ'}
                  </Text>
                </View>
                <View style={styles.citationFooter}>
                  <Text style={styles.citationPage}>
                    📄 પાનું નં: {item.citations[0]?.pageNumber || 1}
                  </Text>
                  <Text style={styles.citationBadge}>GCERT માન્ય</Text>
                </View>
              </View>
            )}

            {/* Quick Action Footer for AI Bubble */}
            {!isUser && (
              <View style={styles.aiBubbleActions}>
                <AnimatedPressable
                  style={styles.aiActionIconBtn}
                  onPress={() => handleCopyMessage(item.content)}
                  scaleTo={0.88}
                >
                  <Ionicons name="copy-outline" size={14} color="#64748b" />
                  <Text style={styles.aiActionIconText}>કૉપિ</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>

          <Text style={[styles.msgTimestamp, isUser ? styles.msgTimestampUser : styles.msgTimestampAI]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>

        {/* User Avatar */}
        {isUser && (
          <View style={styles.bubbleUserAvatar}>
            <Ionicons name="person" size={13} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#1d4ed8' }}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.headerIconBtn} scaleTo={0.88}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </AnimatedPressable>

          {/* AI identity & status info */}
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <Text style={styles.headerAvatarEmoji}>🤖</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerMainTitleRow}>
                <Text style={styles.headerName}>GyanDeep AI</Text>
                <View style={styles.headerStdBadge}>
                  <Text style={styles.headerStdBadgeText}>Dhoran {selectedStandard}</Text>
                </View>
              </View>
              <Text style={styles.headerSub} numberOfLines={1}>
                {activeSubject ? `${getSubjectEmoji(activeSubject.name)} ${activeSubject.nameGu || activeSubject.name}` : '🌟 GCERT અભ્યાસ સાથી • ઓનલાઇન'}
              </Text>
            </View>
          </View>

          {/* Header Action Buttons */}
          <View style={styles.headerRight}>
            <AnimatedPressable onPress={handleNewChat} style={styles.headerIconBtn} scaleTo={0.88}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
            </AnimatedPressable>
            <AnimatedPressable onPress={handleBookmark} style={styles.headerIconBtn} scaleTo={0.88}>
              <Ionicons
                name={isBookmarked ? 'star' : 'star-outline'}
                size={19}
                color={isBookmarked ? '#facc15' : '#fff'}
              />
            </AnimatedPressable>
            <AnimatedPressable onPress={handleDelete} style={styles.headerIconBtn} scaleTo={0.88}>
              <Ionicons name="trash-outline" size={19} color="rgba(255,255,255,0.85)" />
            </AnimatedPressable>
          </View>
        </View>

        {/* ── HORIZONTAL SUBJECT FILTER BAR ── */}
        <View style={styles.subjectFilterBar}>
          <ScrollView
            horizontal={true}
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            contentContainerStyle={styles.subjectFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.subjectChip,
                !activeSubject && styles.subjectChipActive,
                { marginRight: 8 },
              ]}
              onPress={() => handleToggleSubject(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.subjectChipEmoji}>🌟</Text>
              <Text style={[styles.subjectChipText, !activeSubject && styles.subjectChipTextActive]}>
                બધા વિષયો
              </Text>
            </TouchableOpacity>

            {subjectsLoading ? (
              <ActivityIndicator size="small" color="#93c5fd" style={{ marginLeft: 8 }} />
            ) : (
              subjects.map((sub, idx) => {
                const isActive = activeSubject?.id === sub.id || activeSubject?.name === sub.name;
                const isLast = idx === subjects.length - 1;
                return (
                  <TouchableOpacity
                    key={sub.id || `sub_${idx}`}
                    style={[
                      styles.subjectChip,
                      isActive && styles.subjectChipActive,
                      !isLast && { marginRight: 8 },
                      isLast && { marginRight: 16 },
                    ]}
                    onPress={() =>
                      handleToggleSubject({
                        id: sub.id,
                        name: sub.name,
                        nameGu: sub.nameGu,
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={styles.subjectChipEmoji}>{getSubjectEmoji(sub.name)}</Text>
                    <Text style={[styles.subjectChipText, isActive && styles.subjectChipTextActive]}>
                      {sub.nameGu || sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {/* ── MESSAGES LIST ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {/* Hero Banner */}
              <View style={styles.emptyHero}>
                <View style={styles.emptyAvatarRing}>
                  <View style={styles.emptyAvatarInner}>
                    <Text style={styles.emptyAvatarEmoji}>🤖</Text>
                  </View>
                </View>
                <Text style={styles.emptyTitle}>
                  નમસ્તે {userProfile?.name?.split(' ')[0] || ''} 👋
                </Text>
                <Text style={styles.emptySub}>
                  હું તમારો સ્માર્ટ AI શિક્ષક છું. ધોરણ {selectedStandard} {activeSubject ? `• ${activeSubject.nameGu || activeSubject.name}` : ''} ના કોઈપણ પ્રશ્ન પૂછો.
                </Text>

                {/* Subject Active Pill Badge */}
                <View style={styles.activeSubjectBadge}>
                  <Text style={styles.activeSubjectBadgeText}>
                    📌 વર્તમાન વિષય: {activeSubject ? `${getSubjectEmoji(activeSubject.name)} ${activeSubject.nameGu || activeSubject.name}` : 'બધા વિષયો (All Subjects)'}
                  </Text>
                </View>
              </View>

              {/* Dynamic Subject & Standard Quiz Suggestions */}
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsSectionHeader}>
                  <Text style={styles.suggestSectionTitle}>⚡ ઝડપી પ્રશ્નો & પ્રેક્ટિસ ક્વિઝ</Text>
                  <Text style={styles.suggestSectionSub}>નીચેના કાર્ડ પર ક્લિક કરતાં જ AI ઉત્તર આપશે:</Text>
                </View>

                <View style={styles.suggestionsGrid}>
                  {currentSuggestions.map(item => (
                    <AnimatedPressable
                      key={item.id}
                      style={[styles.suggestionCard, { borderLeftColor: item.color }]}
                      onPress={() => handleSelectSuggestion(item)}
                      scaleTo={0.96}
                    >
                      <View style={[styles.suggestionIconBox, { backgroundColor: item.bg }]}>
                        <Text style={styles.suggestionEmoji}>{item.icon}</Text>
                      </View>
                      <View style={styles.suggestionContent}>
                        <View style={[styles.suggestionCategoryBadge, { backgroundColor: item.bg }]}>
                          <Text style={[styles.suggestionCategoryText, { color: item.color }]}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={styles.suggestionTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward-circle" size={22} color={item.color} style={styles.suggestionArrow} />
                    </AnimatedPressable>
                  ))}
                </View>
              </View>

              {/* Features Overview Strip */}
              {/* <View style={styles.featuresRow}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Text style={styles.featureEmoji}>🎙️</Text>
                  </View>
                  <Text style={styles.featureText}>ગુજરાતીમાં બોલો</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Text style={styles.featureEmoji}>📷</Text>
                  </View>
                  <Text style={styles.featureText}>પુસ્તકનો ફોટો પાડો</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Text style={styles.featureEmoji}>📚</Text>
                  </View>
                  <Text style={styles.featureText}>GCERT પુસ્તકમાંથી</Text>
                </View>
              </View> */}
            </View>
          }
        />

        {/* ── TYPING INDICATOR ── */}
        {loading && (
          <View style={styles.typingWrap}>
            <View style={styles.typingAvatar}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <View style={styles.typingCard}>
              <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={styles.typingText}>AI ઉત્તર તૈયાર કરી રહ્યો છે...</Text>
            </View>
          </View>
        )}

        {/* ── FOLLOW-UP PROMPT CHIPS ── */}
        {messages.length > 0 && !loading && (
          <View style={styles.followUpBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.followUpScroll}
            >
              {FOLLOW_UP_PROMPTS.map((chip, idx) => (
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

        {/* ── IMAGE PREVIEW BAR ── */}
        {selectedImage && (
          <View style={styles.imgPreviewBar}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imgThumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.imgName} numberOfLines={1}>{selectedImage.name}</Text>
              <Text style={styles.imgSub}>ફોટો જોડાયેલ છે — પ્રશ્ન પૂછો</Text>
            </View>
            <AnimatedPressable onPress={() => setSelectedImage(null)} style={styles.imgRemove} scaleTo={0.85}>
              <Ionicons name="close-circle" size={22} color="#ef4444" />
            </AnimatedPressable>
          </View>
        )}

        {/* ── BOTTOM INPUT BAR ── */}
        <View style={styles.inputBar}>
          <AnimatedPressable
            onPress={handleVoicePress}
            style={[styles.inputActionBtn, recording && styles.inputActionBtnActive]}
            scaleTo={0.90}
          >
            <Ionicons
              name={recording ? 'mic-sharp' : 'mic-outline'}
              size={22}
              color={recording ? '#fff' : '#2563eb'}
            />
          </AnimatedPressable>

          <AnimatedPressable onPress={handlePickImage} style={styles.inputActionBtn} scaleTo={0.90}>
            <Ionicons name="camera-outline" size={22} color="#2563eb" />
          </AnimatedPressable>

          <TextInput
            style={styles.textInput}
            placeholder={
              activeSubject
                ? `${activeSubject.nameGu || activeSubject.name} નો પ્રશ્ન ટાઇપ કરો...`
                : 'ગુજરાતીમાં કોઈપણ પ્રશ્ન ટાઇપ કરો...'
            }
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
          />

          <AnimatedPressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() && !selectedImage}
            style={[
              styles.sendBtn,
              (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled,
            ]}
            scaleTo={0.90}
          >
            <Ionicons name="send" size={17} color="#fff" />
          </AnimatedPressable>
        </View>

        {/* ── VOICE MODAL ── */}
        <Modal
          visible={voiceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => { setRecording(false); setVoiceModalVisible(false); }}
        >
          <View style={styles.voiceOverlay}>
            <View style={styles.voiceSheet}>
              <View style={styles.voiceRingOuter}>
                <View style={styles.voiceRingMid}>
                  <View style={styles.voiceRingInner}>
                    <Ionicons name="mic" size={38} color="#fff" />
                  </View>
                </View>
              </View>

              <Text style={styles.voiceTitle}>🎤 ગુજરાતીમાં બોલો</Text>
              <Text style={styles.voiceTranscript} numberOfLines={3}>
                {voiceStatus}
              </Text>

              <AnimatedPressable
                onPress={() => {
                  setRecording(false);
                  setVoiceModalVisible(false);
                  webViewRef.current?.postMessage('stop');
                }}
                style={styles.voiceDoneBtn}
                scaleTo={0.95}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.voiceDoneText}>બોલવાનું પૂરું થયું</Text>
              </AnimatedPressable>
            </View>
          </View>
        </Modal>

        {/* Hidden WebView for Web Speech recognition */}
        <WebView
          ref={webViewRef}
          source={{ html: webViewHTML }}
          onMessage={onWebViewMessage}
          javaScriptEnabled={true}
          style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 8,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatarEmoji: {
    fontSize: 24,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#1d4ed8',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerMainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerStdBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  headerStdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 5,
  },

  // ── Subject Filter Bar ──────────────────────────────────────────
  subjectFilterBar: {
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  subjectFilterScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  subjectChipActive: {
    backgroundColor: '#FFFFFF',
  },
  subjectChipEmoji: {
    fontSize: 14,
  },
  subjectChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  subjectChipTextActive: {
    color: '#1e40af',
    fontWeight: '800',
  },

  // ── Message List ───────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
  },
  bubbleAIAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  bubbleAIEmoji: {
    fontSize: 18,
  },
  bubbleUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  msgWrapper: {
    maxWidth: width * 0.78,
  },
  msgCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgCardUser: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 3,
    ...shadows.sm,
  },
  msgCardAI: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  msgContentText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  msgContentUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgContentAI: {
    color: '#0f172a',
  },
  msgTimestamp: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
  },
  msgTimestampUser: {
    textAlign: 'right',
    marginRight: 2,
  },
  msgTimestampAI: {
    marginLeft: 4,
  },

  // ── Citation Card ──────────────────────────────────────────────
  citationCard: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  citationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  citationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  citationPage: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  citationBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiBubbleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  aiActionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  aiActionIconText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },

  // ── Typing Indicator ───────────────────────────────────────────
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  typingText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
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

  // ── Empty State ────────────────────────────────────────────────
  emptyWrap: {
    paddingVertical: 12,
  },
  emptyHero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  emptyAvatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyAvatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatarEmoji: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  activeSubjectBadge: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  activeSubjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },

  // ── Suggestions Section ─────────────────────────────────────────
  suggestionsSection: {
    marginBottom: 16,
  },
  suggestionsSectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  suggestSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  suggestSectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  suggestionsGrid: {
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
    gap: 10,
  },
  suggestionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionEmoji: {
    fontSize: 18,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginBottom: 3,
  },
  suggestionCategoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  suggestionArrow: {
    marginLeft: 4,
  },

  // ── Features Row ───────────────────────────────────────────────
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  featureItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },

  // ── Image Preview ──────────────────────────────────────────────
  imgPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imgThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  imgName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  imgSub: {
    fontSize: 10,
    color: '#64748b',
  },
  imgRemove: {
    padding: 4,
  },

  // ── Bottom Input Bar ───────────────────────────────────────────
  inputBar: {
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
  textInput: {
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
  sendBtn: {
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

  // ── Voice Modal ────────────────────────────────────────────────
  voiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  voiceSheet: {
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
  voiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  voiceTranscript: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 19,
    minHeight: 40,
    marginBottom: 16,
  },
  voiceDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  voiceDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
