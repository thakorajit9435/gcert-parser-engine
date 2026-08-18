import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebView } from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useStandardContext } from '../../context/StandardContext';
import { studentColors, shadows } from '../../theme';
import { aiTutorService } from '../../services/aiTutor.service';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: any;
  retrievedChunks?: {
    chunkId: string;
    chapter: string;
    pageNumber: number;
    textQuote: string;
  }[];
}

// Quick suggestion chips shown in empty state
const QUICK_SUGGESTIONS = [
  { icon: '📖', text: 'પ્રકરણ સારાંશ આપો' },
  { icon: '❓', text: 'MCQ પ્રશ્ન બનાવો' },
  { icon: '💡', text: 'સમજૂતી આપો' },
  { icon: '🧪', text: 'ઉદાહરણ સાથે સમજાવો' },
];

const webViewHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Speech</title></head>
<body>
  <script>
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'not-supported' }));
    } else {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = 'gu-IN';
      r.onstart = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' }));
      r.onresult = (e) => {
        let f = '', i = '';
        for (let x = e.resultIndex; x < e.results.length; x++) {
          e.results[x].isFinal ? f += e.results[x][0].transcript : i += e.results[x][0].transcript;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', text: f || i }));
      };
      r.onerror = (e) => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.error }));
      r.onend = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
      const handle = (cmd) => { if (cmd === 'start') { try { r.start(); } catch(e) {} } else if (cmd === 'stop') r.stop(); };
      document.addEventListener('message', (e) => handle(e.data));
      window.addEventListener('message', (e) => handle(e.data));
    }
  </script>
</body>
</html>
`;

export function AITutorScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { userProfile } = useAuth();
  const { selectedStandard } = useStandardContext();
  const initialSessionId = route.params?.sessionId;
  const initialSubject = route.params?.subject || 'General';

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

  // Init / load session
  useEffect(() => {
    if (!sessionId) {
      const initSession = async () => {
        try {
          if (!userProfile?.uid) return;
          const newId = await aiTutorService.createChatSession(
            userProfile.uid,
            'નવું સત્ર',
            { standard: selectedStandard, subject: initialSubject }
          );
          setSessionId(newId);
        } catch (err) {
          Alert.alert('Error', 'ચેટ સત્ર શરૂ કરવામાં નિષ્ફળ.');
        }
      };
      initSession();
      return;
    }

    // Load messages
    const fetchMessages = async () => {
      try {
        const snap = await firestore()
          .collection('chat_sessions')
          .doc(sessionId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .get();
        const list: Message[] = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
        setMessages(list);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      } catch {}
    };
    fetchMessages();

    const unsub = firestore()
      .collection('chat_sessions')
      .doc(sessionId)
      .onSnapshot(doc => {
        if (doc?.exists) setIsBookmarked(doc.data()?.isBookmarked || false);
      });
    return () => unsub();
  }, [sessionId]);

  // Pick image
  const handlePickImage = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.images] });
      if (res?.uri) setSelectedImage({ uri: res.uri, type: res.type || 'image/jpeg', name: res.name || 'query.jpg' });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) console.error('Image pick error:', err);
    }
  };

  // Send message
  const handleSend = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() && !selectedImage) return;
    if (!sessionId) return;

    const img = selectedImage;
    setInputText('');
    setSelectedImage(null);

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: img ? `[📷 ছবি: ${img.name}]\n${text}` : text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    setLoading(true);

    try {
      let answer = '';
      let citations: any[] = [];
      if (img) {
        const base64 = await ReactNativeBlobUtil.fs.readFile(img.uri, 'base64');
        answer = await aiTutorService.sendMultimodalDoubt(base64, text, img.type);
      } else {
        const res = await aiTutorService.sendChatMessage(sessionId, text, {
          standard: selectedStandard,
          subject: initialSubject,
          language: 'gu',
        });
        answer = res.answer;
        citations = res.citations || [];
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        retrievedChunks: citations.map(c => ({
          chunkId: c.citationId,
          chapter: c.chapter,
          pageNumber: c.pageNumber,
          textQuote: c.textQuote,
        })),
      };
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'સંદેશ મોકલવામાં નિષ્ફળ. ફરીથી પ્રયત્ન કરો.');
    } finally {
      setLoading(false);
    }
  };

  // Bookmark
  const handleBookmark = async () => {
    if (!sessionId) return;
    const ok = await aiTutorService.bookmarkChatSession(sessionId, !isBookmarked);
    if (ok) setIsBookmarked(v => !v);
  };

  // Delete
  const handleDelete = () => {
    Alert.alert('ચેટ ડીલીટ કરો', 'શું તમે ખરેખર આ ચેટ ડીલીટ કરવા માંગો છો?', [
      { text: 'ના', style: 'cancel' },
      {
        text: 'હા, ડીલીટ',
        style: 'destructive',
        onPress: async () => {
          if (!sessionId) return;
          const ok = await aiTutorService.deleteChatSession(sessionId);
          if (ok) navigation.goBack();
        },
      },
    ]);
  };

  // Voice
  const handleVoicePress = () => {
    if (recording) {
      webViewRef.current?.postMessage('stop');
      setRecording(false);
      setVoiceModalVisible(false);
    } else {
      setVoiceStatus('સાંભળી રહ્યા છીએ...');
      setRecording(true);
      setVoiceModalVisible(true);
      webViewRef.current?.postMessage('start');
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'result') {
        setInputText(data.text);
        setVoiceStatus(data.text || 'સાંભળી રહ્યા છીએ...');
      } else if (data.type === 'error') {
        if (data.message === 'not-allowed') {
          Alert.alert('માઇક્રોફોન', 'સેટિંગ્સમાં માઇક્રોફોન મંજૂરી આપો.');
        }
        setRecording(false);
        setVoiceModalVisible(false);
      } else if (data.type === 'end') {
        setRecording(false);
        setVoiceModalVisible(false);
      }
    } catch {}
  };

  const formatTime = (ts: any) => {
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
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI, isLast && { marginBottom: 12 }]}>
        {/* AI avatar */}
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarEmoji}>🤖</Text>
          </View>
        )}

        <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAI]}>
          {/* Bubble */}
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
            <View style={{ paddingVertical: 2 }}>
              {renderStyledText(item.content, isUser)}
            </View>

            {/* Citations */}
            {!isUser && item.retrievedChunks && item.retrievedChunks.length > 0 && (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                  📚 સંદર્ભ પાઠ્યપુસ્તકો:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citationScroll}>
                  {item.retrievedChunks.map((cit, cIdx) => (
                    <TouchableOpacity
                      key={cIdx}
                      style={styles.citationCard}
                      onPress={async () => {
                        try {
                          // Search for the chapter PDF URL in Firestore
                          const chaptersSnap = await firestore()
                            .collection('chapters')
                            .where('title', '==', cit.chapter)
                            .limit(1)
                            .get();
                          
                          let pdfUrl = '';
                          let startPage = 1;
                          let bookStartPage = 1;
                          
                          const firstDoc = chaptersSnap.docs[0];
                          if (firstDoc) {
                            const doc = firstDoc.data();
                            pdfUrl = doc.pdfUrl || '';
                            startPage = doc.startPage || 1;
                            bookStartPage = doc.bookStartPage || 1;
                          } else {
                            const chaptersSnapGu = await firestore()
                              .collection('chapters')
                              .where('titleGu', '==', cit.chapter)
                              .limit(1)
                              .get();
                            const firstDocGu = chaptersSnapGu.docs[0];
                            if (firstDocGu) {
                              const doc = firstDocGu.data();
                              pdfUrl = doc.pdfUrl || '';
                              startPage = doc.startPage || 1;
                              bookStartPage = doc.bookStartPage || 1;
                            }
                          }

                          if (pdfUrl) {
                            const pageToNavigate = Math.max(1, startPage + (cit.pageNumber - bookStartPage));
                            navigation.navigate('PdfViewer', {
                              url: pdfUrl,
                              title: cit.chapter,
                              startPage: pageToNavigate,
                            });
                          } else {
                            Alert.alert('પીડીએફ', 'આ પ્રકરણ માટે ડિજિટલ પુસ્તક ઉપલબ્ધ નથી.');
                          }
                        } catch (err) {
                          Alert.alert('ભૂલ', 'પીડીએફ લોડ કરવામાં ભૂલ આવી.');
                        }
                      }}
                    >
                      <View style={styles.citationCardHeader}>
                        <Ionicons name="book" size={12} color="#1565C0" />
                        <Text style={styles.citationCardTitle} numberOfLines={1}>
                          {cit.chapter || 'GCERT Textbook'}
                        </Text>
                      </View>
                      <Text style={styles.citationCardPage}>પાનું નંબર: {cit.pageNumber}</Text>
                      {cit.textQuote ? (
                        <Text style={styles.citationCardQuote} numberOfLines={2}>
                          "{cit.textQuote}"
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAI]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>

        {/* User avatar */}
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#1565C0' }}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* AI identity pill */}
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <Text style={styles.headerAvatarEmoji}>🤖</Text>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerName}>AI ટ્યુટર</Text>
              <Text style={styles.headerSub}>Std {selectedStandard} · {initialSubject}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleBookmark} style={styles.headerIconBtn}>
              <Ionicons
                name={isBookmarked ? 'star' : 'star-outline'}
                size={20}
                color={isBookmarked ? '#fbbf24' : 'rgba(255,255,255,0.8)'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerIconBtn}>
              <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >

      {/* ── MESSAGES ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {/* Hero */}
            <View style={styles.emptyHero}>
              <View style={styles.emptyAvatarRing}>
                <View style={styles.emptyAvatarInner}>
                  <Text style={styles.emptyAvatarEmoji}>🤖</Text>
                </View>
              </View>
              <Text style={styles.emptyTitle}>AI ટ્યુટર — GyanDeep</Text>
              <Text style={styles.emptySub}>
                ધોરણ {selectedStandard} ના {initialSubject} પ્રશ્નો પૂછો.{'\n'}
                ગુજરાતીમાં ટ્યૂટ, MCQ, ઉદાહરણ — બધું જ!
              </Text>
            </View>

            {/* Suggestion chips */}
            <Text style={styles.suggestLabel}>ઝડપી પ્રશ્નો 👇</Text>
            <View style={styles.chipsGrid}>
              {QUICK_SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => handleSend(s.text)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipIcon}>{s.icon}</Text>
                  <Text style={styles.chipText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Features row */}
            <View style={styles.featuresRow}>
              {[
                { icon: '🎤', label: 'Voice' },
                { icon: '📷', label: 'Camera' },
                { icon: '📚', label: 'RAG Search' },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Text style={styles.featureEmoji}>{f.icon}</Text>
                  </View>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        }
      />

      {/* ── TYPING INDICATOR ── */}
      {loading && <TypingIndicator />}

      {/* ── IMAGE PREVIEW ── */}
      {selectedImage && (
        <View style={styles.imgPreviewBar}>
          <Image source={{ uri: selectedImage.uri }} style={styles.imgThumb} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.imgName} numberOfLines={1}>{selectedImage.name}</Text>
            <Text style={styles.imgSub}>Photo attached</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.imgRemove}>
            <Ionicons name="close-circle" size={22} color={studentColors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── INPUT BAR ── */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          onPress={handleVoicePress}
          style={[styles.inputActionBtn, recording && styles.inputActionBtnActive]}
        >
          <Ionicons
            name={recording ? 'mic-sharp' : 'mic-outline'}
            size={21}
            color={recording ? '#fff' : studentColors.secondary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickImage} style={styles.inputActionBtn}>
          <Ionicons name="camera-outline" size={21} color={studentColors.secondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="ગુજરાતીમાં પ્રશ્ન ટાઇપ કરો..."
          placeholderTextColor="#9ca3af"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={600}
        />

        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!inputText.trim() && !selectedImage}
          style={[styles.sendBtn, (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
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
            {/* Decorative gradient ring */}
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
            <Text style={styles.voiceHint}>
              ઉદાહરણ: "પ્રકાશ સંશ્લેષણ શું છે?"
            </Text>

            <TouchableOpacity
              style={styles.voiceStopBtn}
              onPress={() => {
                webViewRef.current?.postMessage('stop');
                setRecording(false);
                setVoiceModalVisible(false);
              }}
            >
              <Ionicons name="stop-circle" size={18} color={studentColors.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.voiceStopText}>રિકોર્ડ બંધ કરો</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden WebView for Speech */}
      <WebView
        ref={webViewRef}
        source={{ html: webViewHTML }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
      />
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    backgroundColor: '#1565C0',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatarEmoji: {
    fontSize: 30,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },

  // ── Message List ───────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
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
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  aiAvatarEmoji: {
    fontSize: 18,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  bubbleWrapper: {
    maxWidth: width * 0.75,
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubbleWrapperAI: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#1565C0',
    borderBottomRightRadius: 4,
    ...shadows.sm,
  },
  bubbleAI: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bubbleTextAI: {
    color: '#1f2937',
  },
  timeText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 3,
  },
  timeTextUser: {
    textAlign: 'right',
  },
  timeTextAI: {
    marginLeft: 4,
  },

  // ── Citations ──────────────────────────────────────────────────
  citationBox: {
    marginTop: 10,
  },
  citationDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  citationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 5,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  citationText: {
    fontSize: 11,
    color: '#4b5563',
    flex: 1,
  },

  // ── Typing ────────────────────────────────────────────────────
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    ...shadows.sm,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94a3b8',
  },
  dot1: {},
  dot2: {},
  dot3: {},
  typingLabel: {
    fontSize: 12,
    color: '#6b7280',
  },

  // ── Empty State ───────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emptyAvatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(21,101,192,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyAvatarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(21,101,192,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatarEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    ...shadows.sm,
  },
  chipIcon: {
    fontSize: 15,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 14,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },

  // ── Image Preview ─────────────────────────────────────────────
  imgPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
  },
  imgThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  imgName: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  imgSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  imgRemove: {
    padding: 4,
  },

  // ── Input Bar ─────────────────────────────────────────────────
  inputBar: {
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
    backgroundColor: '#ef4444',
  },
  textInput: {
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
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },

  // ── Voice Modal ───────────────────────────────────────────────
  voiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSheet: {
    width: width * 0.84,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    ...shadows.lg,
  },
  voiceRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(21,101,192,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceRingMid: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(21,101,192,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRingInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  voiceTranscript: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
    minHeight: 44,
  },
  voiceHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 22,
    fontStyle: 'italic',
  },
  voiceStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  voiceStopText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  citationScroll: {
    gap: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  citationCard: {
    width: 220,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  citationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  citationCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  citationCardPage: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  citationCardQuote: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
});

// ── CUSTOM RICH RENDERERS (Phase 4 Additions) ───────────────────────────────────

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [{
      translateY: dot.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -4],
      })
    }]
  });

  return (
    <View style={styles.typingRow}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarEmoji}>🤖</Text>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, getStyle(dot1)]} />
          <Animated.View style={[styles.dot, getStyle(dot2)]} />
          <Animated.View style={[styles.dot, getStyle(dot3)]} />
        </View>
        <Text style={styles.typingLabel}>AI જવાબ બનાવી રહ્યો છે...</Text>
      </View>
    </View>
  );
};

const renderStyledText = (text: string, isUser: boolean) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    let cleanLine = line;
    if (isBullet) {
      cleanLine = '  •  ' + line.trim().substring(2);
    }

    const parts = cleanLine.split('**');
    const lineElements = parts.map((part, partIdx) => {
      const isBold = partIdx % 2 !== 0;
      
      const codeParts = part.split('`');
      return codeParts.map((subPart, subIdx) => {
        const isCode = subIdx % 2 !== 0;
        return (
          <Text
            key={`${partIdx}_${subIdx}`}
            style={[
              { fontWeight: isBold ? '700' : 'normal' },
              isCode && {
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                backgroundColor: isUser ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)',
                borderRadius: 4,
                paddingHorizontal: 4,
                fontSize: 13,
              }
            ]}
          >
            {subPart}
          </Text>
        );
      });
    });

    return (
      <Text
        key={lineIdx}
        style={{
          fontSize: 14,
          lineHeight: 20,
          color: isUser ? '#FFFFFF' : '#1e293b',
          marginBottom: lineIdx === lines.length - 1 ? 0 : 4,
        }}
      >
        {lineElements}
      </Text>
    );
  });
};
