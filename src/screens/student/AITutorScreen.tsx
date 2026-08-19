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
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { WebView } from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useStandardContext } from '../../context/StandardContext';
import { useSubjects } from '../../hooks/useSubjects';
import { studentColors, shadows } from '../../theme';
import { aiTutorService } from '../../services/aiTutor.service';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';

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
        title: `${stdLabel} નો ૫ પ્રશ્નોનો મોક ટેસ્ટ`,
        prompt: `મને ${stdLabel} ના તમામ વિષયોમાંથી ૫ મહત્વના MCQ પ્રશ્નો તેમના ૪ વિકલ્પો, સાચો જવાબ અને ગુજરાતીમાં સમજૂતી સાથે પૂછો.`,
      },
      {
        id: 'quiz_all_2',
        icon: '⚡',
        category: 'ઝડપી રિવિઝન',
        color: '#d97706',
        bg: '#fffbeb',
        title: `${stdLabel} ના IMP પ્રશ્નોની યાદી`,
        prompt: `${stdLabel} ની પરીક્ષા માટે વારંવાર પૂછાતા સૌથી મહત્વના ૧૦ પ્રશ્નો અને તેના મુખ્ય મુદ્દાઓ જણાવો.`,
      },
      {
        id: 'quiz_all_3',
        icon: '💡',
        category: 'શંકા સમાધાન',
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: 'અઘરા ટોપિક્સ સરળ રીતે સમજાવો',
        prompt: `${stdLabel} ના સૌથી અઘરા લાગતા ૩ કન્સેપ્ટ મને એકદમ સરળ ગુજરાતી ભાષા અને વાસ્તવિક ઉદાહરણો સાથે સમજાવો.`,
      },
      {
        id: 'quiz_all_4',
        icon: '📝',
        category: 'પ્રેક્ટિસ',
        color: '#059669',
        bg: '#ecfdf5',
        title: 'સાચા-ખોટા વિધાનોની ક્વિઝ',
        prompt: `${stdLabel} માંથી ૫ વિધાનો આપો અને મને પૂછો કે તે સાચા છે કે ખોટા, પછી સાચો ઉત્તર આપો.`,
      },
    ];
  }

  const cleanSub = subjectName.toLowerCase();

  if (cleanSub.includes('math') || cleanSub.includes('ગણિત')) {
    return [
      {
        id: 'math_1',
        icon: '📐',
        category: 'MCQ ક્વિઝ',
        color: '#2563eb',
        bg: '#eff6ff',
        title: `${sub} - ૫ MCQ દાખલા ક્વિઝ`,
        prompt: `મને ${stdLabel} ${sub} માંથી ૫ MCQ પ્રશ્નો તેમના વિકલ્પો, રીત (Step-by-step solution) અને સાચા જવાબ સાથે પૂછો.`,
      },
      {
        id: 'math_2',
        icon: '🔢',
        category: 'સૂત્રો અને નિયમો',
        color: '#0284c7',
        bg: '#f0f9ff',
        title: 'ગણિતના મહત્વના સૂત્રોની યાદી',
        prompt: `${stdLabel} ${sub} ના તમામ પ્રકરણોના મહત્વના સૂત્રો (Formulas) અને તે ક્યાં વપરાય તેની યાદી આપો.`,
      },
      {
        id: 'math_3',
        icon: '💡',
        category: 'દાખલાનો ઉકેલ',
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: 'અઘરો દાખલો સરળ રીતે ઉકેલો',
        prompt: `${stdLabel} ${sub} નો એક મુશ્કેલ દાખલો લો અને તેને સ્ટેપ-બાય-સ્ટેપ એકદમ સરળ ભાષામાં સમજાવીને ગણો.`,
      },
      {
        id: 'math_4',
        icon: '⚡',
        category: 'શોર્ટ ટ્રીક',
        color: '#d97706',
        bg: '#fffbeb',
        title: 'ઝડપી ગણતરીની શોર્ટ ટ્રીક',
        prompt: `${stdLabel} ગણિતના દાખલા ઝડપથી ગણવા માટેની વૈદિક ગણિત / શોર્ટકટ ટ્રીક શીખવો.`,
      },
    ];
  }

  if (cleanSub.includes('scien') || cleanSub.includes('વિજ્ઞાન')) {
    return [
      {
        id: 'sci_1',
        icon: '🔬',
        category: 'MCQ ક્વિઝ',
        color: '#059669',
        bg: '#ecfdf5',
        title: `${sub} - વૈજ્ઞાનિક MCQ ટેસ્ટ`,
        prompt: `મને ${stdLabel} ${sub} માંથી ૫ મહત્વના MCQ પ્રશ્નો ૪ વિકલ્પો અને વૈજ્ઞાનિક કારણ સહિત સાચા જવાબ સાથે પૂછો.`,
      },
      {
        id: 'sci_2',
        icon: '🧪',
        category: 'પ્રયોગ & આકૃતિ',
        color: '#0891b2',
        bg: '#ecfeff',
        title: 'મહત્વના પ્રયોગો અને કારણો',
        prompt: `${stdLabel} ${sub} માં આવતા મુખ્ય પ્રયોગો, અવલોકન અને વૈજ્ઞાનિક કારણો સરળતાથી સમજાવો.`,
      },
      {
        id: 'sci_3',
        icon: '🌱',
        category: 'કન્સેપ્ટ ક્લિયર',
        color: '#65a30d',
        bg: '#f7fee7',
        title: 'મુખ્ય વ્યાખ્યાઓ અને તફાવત',
        prompt: `${stdLabel} ${sub} માં વારંવાર પૂછાતા તફાવતો (જેમ કે: એસિડ vs બેઇઝ, વનસ્પતિ vs પ્રાણી કોષ) સરળ ભાષામાં આપો.`,
      },
      {
        id: 'sci_4',
        icon: '⚡',
        category: 'રિવિઝન',
        color: '#d97706',
        bg: '#fffbeb',
        title: 'પરીક્ષા લક્ષી IMP પ્રશ્નો',
        prompt: `${stdLabel} ${sub} ની પરીક્ષામાં પુછાવાની સૌથી વધુ શક્યતા હોય તેવા ૫ મોટા પ્રશ્નો અને તેના મુદ્દાસર ઉત્તર આપો.`,
      },
    ];
  }

  if (cleanSub.includes('social') || cleanSub.includes('સામાજિક')) {
    return [
      {
        id: 'ss_1',
        icon: '🌍',
        category: 'MCQ ક્વિઝ',
        color: '#ea580c',
        bg: '#fff7ed',
        title: `${sub} - ઇતિહાસ અને ભૂગોળ ક્વિઝ`,
        prompt: `મને ${stdLabel} ${sub} (ઇતિહાસ, ભૂગોળ, નાગરિકશાસ્ત્ર) માંથી ૫ MCQ પ્રશ્નો સાચા જવાબો સાથે પૂછો.`,
      },
      {
        id: 'ss_2',
        icon: '📜',
        category: 'ઇતિહાસ વાર્તા',
        color: '#d97706',
        bg: '#fffbeb',
        title: 'ઐતિહાસિક ઘટનાઓ વાર્તા સ્વરૂપે',
        prompt: `${stdLabel} સામાજિક વિજ્ઞાનના ઇતિહાસનો એક મહત્વનો પાઠ મને રોચક વાર્તા સ્વરૂપે સમજાવો.`,
      },
      {
        id: 'ss_3',
        icon: '🗺️',
        category: 'ભૂગોળ અને નકશો',
        color: '#0284c7',
        bg: '#f0f9ff',
        title: 'ભૂગોળ અને પર્યાવરણના પ્રશ્નો',
        prompt: `${stdLabel} સામાજિક વિજ્ઞાનના ભૂગોળના મહત્વના મુદ્દાઓ (આબોહવા, જમીન, સંસાધનો) સમજાવો.`,
      },
      {
        id: 'ss_4',
        icon: '🏛️',
        category: 'બંધારણ',
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: 'ભારતીય બંધારણ અને હક્કો',
        prompt: `${stdLabel} નાગરિકશાસ્ત્ર મુજબ આપણા મૂળભૂત હક્કો અને ફરજો સરળ ગુજરાતીમાં સમજાવો.`,
      },
    ];
  }

  if (cleanSub.includes('english') || cleanSub.includes('અંગ્રેજી')) {
    return [
      {
        id: 'eng_1',
        icon: '📖',
        category: 'Grammar Quiz',
        color: '#4f46e5',
        bg: '#eef2ff',
        title: 'English Grammar 5 MCQs',
        prompt: `Ask me 5 English Grammar MCQ questions for ${stdLabel} (Tenses, Prepositions, Articles, Active/Passive) with explanation and answers.`,
      },
      {
        id: 'eng_2',
        icon: '✍️',
        category: 'Vocabulary',
        color: '#059669',
        bg: '#ecfdf5',
        title: 'Daily Vocabulary & Word Meaning',
        prompt: `Give me 10 important English words with their Gujarati meanings, pronunciation, and example sentences for ${stdLabel}.`,
      },
      {
        id: 'eng_3',
        icon: '🗣️',
        category: 'Translation',
        color: '#c026d3',
        bg: '#fdf4ff',
        title: 'Gujarati to English Translation Practice',
        prompt: `Give me 5 Gujarati sentences for ${stdLabel} to translate into English, along with the correct translated answers.`,
      },
      {
        id: 'eng_4',
        icon: '📝',
        category: 'Comprehension',
        color: '#ea580c',
        bg: '#fff7ed',
        title: 'Short Paragraph & Questions',
        prompt: `Provide a short English story/paragraph suitable for ${stdLabel} and ask 3 comprehension questions with answers.`,
      },
    ];
  }

  if (cleanSub.includes('gujarat') || cleanSub.includes('ગુજરાતી') || cleanSub.includes('hindi') || cleanSub.includes('હિન્દી')) {
    return [
      {
        id: 'lang_1',
        icon: '🔤',
        category: 'વ્યાકરણ ક્વિઝ',
        color: '#db2777',
        bg: '#fdf2f8',
        title: `${sub} - વ્યાકરણના ૫ MCQ`,
        prompt: `મને ${stdLabel} ${sub} માંથી સમાસ, સંધિ, જોડણી, રૂઢિપ્રયોગ અને કહેવતોના ૫ MCQ સાચા ઉત્તર સાથે પૂછો.`,
      },
      {
        id: 'lang_2',
        icon: '📚',
        category: 'કાવ્ય સારાંશ',
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: 'કાવ્ય પંક્તિઓનો ભાવાર્થ',
        prompt: `${stdLabel} ${sub} ની કોઈ મહત્વની કાવ્ય પંક્તિનો અર્થ અને કવિનો સંદેશ સરળ શબ્દોમાં સમજાવો.`,
      },
      {
        id: 'lang_3',
        icon: '✍️',
        category: 'લેખન કૌશલ્ય',
        color: '#0284c7',
        bg: '#f0f9ff',
        title: 'નિબંધ / પત્ર લેખનના મુખ્ય મુદ્દા',
        prompt: `${stdLabel} ${sub} માટે પરીક્ષામાં પુછાતા નિબંધ અથવા વિચાર વિસ્તાર લખવાની શ્રેષ્ઠ રીત આપો.`,
      },
      {
        id: 'lang_4',
        icon: '💡',
        category: 'શબ્દ ભંડોળ',
        color: '#059669',
        bg: '#ecfdf5',
        title: 'સમાનાર્થી અને વિરોધી શબ્દો',
        prompt: `${stdLabel} ${sub} ના પાઠ્યપુસ્તકના મહત્વના ૧૫ સમાનાર્થી અને વિરોધી શબ્દો આપો.`,
      },
    ];
  }

  // Generic subject fallback
  return [
    {
      id: 'gen_1',
      icon: '🎯',
      category: 'MCQ ક્વિઝ',
      color: '#2563eb',
      bg: '#eff6ff',
      title: `${sub} - ૫ મહત્વના MCQ`,
      prompt: `મને ${stdLabel} ${sub} માંથી ૫ MCQ પ્રશ્નો તેમના વિકલ્પો અને સાચા જવાબો સાથે પૂછો.`,
    },
    {
      id: 'gen_2',
      icon: '💡',
      category: 'સમજૂતી',
      color: '#7c3aed',
      bg: '#f5f3ff',
      title: `${sub} ના મુખ્ય પ્રકરણોની સમજૂતી`,
      prompt: `${stdLabel} ${sub} ના સૌથી મહત્વના ટોપિક્સ અને કન્સેપ્ટ સરળ રીતે સમજાવો.`,
    },
    {
      id: 'gen_3',
      icon: '⚡',
      category: 'રિવિઝન',
      color: '#d97706',
      bg: '#fffbeb',
      title: 'પરીક્ષા માટે રિવિઝન પોઇન્ટ્સ',
      prompt: `${stdLabel} ${sub} ના મહત્વના રિવિઝન મુદ્દાઓ અને શોર્ટ નોટ્સ આપો.`,
    },
    {
      id: 'gen_4',
      icon: '❓',
      category: 'પ્રશ્નોત્તરી',
      color: '#059669',
      bg: '#ecfdf5',
      title: 'વારંવાર પૂછાતા પ્રશ્નો',
      prompt: `${stdLabel} ${sub} ના વારંવાર પૂછાતા ૫ ટૂંકા પ્રશ્નો અને તેના ઉત્તર આપો.`,
    },
  ];
};

const FOLLOW_UP_CHIPS = [
  { icon: '❓', text: 'અન્ય ૫ MCQ પૂછો' },
  { icon: '💡', text: 'વધુ વિગતવાર સમજાવો' },
  { icon: '📝', text: 'સરળ ભાષામાં ફરી લખો' },
  { icon: '🧪', text: 'વાસ્તવિક ઉદાહરણ આપો' },
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

  // Init / load session
  useEffect(() => {
    if (!sessionId) {
      const initSession = async () => {
        try {
          if (!userProfile?.uid) return;
          const currentSubjectName = activeSubject?.name || 'General';
          const newId = await aiTutorService.createChatSession(
            userProfile.uid,
            `ચેટ - ધોરણ ${selectedStandard}`,
            { standard: selectedStandard, subject: currentSubjectName }
          );
          setSessionId(newId);
        } catch (err) {
          Alert.alert('Error', 'ચેટ સત્ર શરૂ કરવામાં નિષ્ફળ.');
        }
      };
      initSession();
      return;
    }

    // Load messages from Firestore
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
  }, [sessionId, userProfile?.uid]);

  // Current suggestions based on active standard and selected subject
  const currentSuggestions = useMemo(() => {
    return getSubjectQuizSuggestions(
      selectedStandard,
      activeSubject?.name,
      activeSubject?.nameGu
    );
  }, [selectedStandard, activeSubject]);

  // Pick image
  const handlePickImage = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.images] });
      if (res?.uri) setSelectedImage({ uri: res.uri, type: res.type || 'image/jpeg', name: res.name || 'query.jpg' });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) console.error('Image pick error:', err);
    }
  };

  // Start a fresh new chat session
  const handleNewChat = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const currentSubjectName = activeSubject?.name || 'General';
      const newId = await aiTutorService.createChatSession(
        userProfile.uid,
        `ચેટ - ધોરણ ${selectedStandard}`,
        { standard: selectedStandard, subject: currentSubjectName }
      );
      setMessages([]);
      setSessionId(newId);
      setIsBookmarked(false);
    } catch {
      Alert.alert('ભૂલ', 'નવું સત્ર શરૂ કરવામાં ભૂલ આવી.');
    } finally {
      setLoading(false);
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
      content: img ? `[📷 ફોટો: ${img.name}]\n${text}` : text,
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
          subject: activeSubject?.name || 'General',
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

  // Delete / Clear
  const handleDelete = () => {
    Alert.alert('ચેટ ડીલીટ કરો', 'શું તમે ખરેખર આ ચેટ હિસ્ટ્રી ડીલીટ કરવા માંગો છો?', [
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
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI, isLast && { marginBottom: 16 }]}>
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
              <View style={styles.citationContainer}>
                <View style={styles.citationHeaderRow}>
                  <Ionicons name="library" size={13} color="#2563eb" />
                  <Text style={styles.citationHeaderText}>સંદર્ભ પાઠ્યપુસ્તક આધારિત:</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citationScroll}>
                  {item.retrievedChunks.map((cit, cIdx) => (
                    <AnimatedPressable
                      key={cIdx}
                      style={styles.citationCard}
                      scaleTo={0.96}
                      onPress={async () => {
                        try {
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
                        <Ionicons name="book" size={13} color="#2563eb" />
                        <Text style={styles.citationCardTitle} numberOfLines={1}>
                          {cit.chapter || 'GCERT Textbook'}
                        </Text>
                      </View>
                      <Text style={styles.citationCardPage}>📖 પાનું: {cit.pageNumber}</Text>
                      {cit.textQuote ? (
                        <Text style={styles.citationCardQuote} numberOfLines={2}>
                          "{cit.textQuote}"
                        </Text>
                      ) : null}
                    </AnimatedPressable>
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
                <Text style={styles.headerName}>AI ટ્યુટર</Text>
                <View style={styles.headerStdBadge}>
                  <Text style={styles.headerStdBadgeText}>Dhoran {selectedStandard}</Text>
                </View>
              </View>
              <Text style={styles.headerSub} numberOfLines={1}>
                {activeSubject ? `${getSubjectEmoji(activeSubject.name)} ${activeSubject.nameGu || activeSubject.name}` : '🌟 GCERT અભ્યાસ સાથી'}
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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectFilterScroll}
          >
            <AnimatedPressable
              style={[
                styles.subjectChip,
                !activeSubject && styles.subjectChipActive,
              ]}
              onPress={() => setActiveSubject(null)}
              scaleTo={0.93}
            >
              <Text style={styles.subjectChipEmoji}>🌟</Text>
              <Text style={[styles.subjectChipText, !activeSubject && styles.subjectChipTextActive]}>
                બધા વિષયો
              </Text>
            </AnimatedPressable>

            {subjectsLoading ? (
              <ActivityIndicator size="small" color="#93c5fd" style={{ marginLeft: 8 }} />
            ) : (
              subjects.map(sub => {
                const isActive = activeSubject?.id === sub.id || activeSubject?.name === sub.name;
                return (
                  <AnimatedPressable
                    key={sub.id}
                    style={[
                      styles.subjectChip,
                      isActive && styles.subjectChipActive,
                    ]}
                    onPress={() => setActiveSubject({ id: sub.id, name: sub.name, nameGu: sub.nameGu })}
                    scaleTo={0.93}
                  >
                    <Text style={styles.subjectChipEmoji}>
                      {sub.icon || getSubjectEmoji(sub.name)}
                    </Text>
                    <Text style={[styles.subjectChipText, isActive && styles.subjectChipTextActive]}>
                      {sub.nameGu || sub.name}
                    </Text>
                  </AnimatedPressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── MESSAGES LIST ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {/* Hero Banner */}
              <View style={styles.emptyHero}>
                <View style={styles.emptyAvatarRing}>
                  <View style={styles.emptyAvatarInner}>
                    <Text style={styles.emptyAvatarEmoji}>🤖</Text>
                  </View>
                </View>
                <Text style={styles.emptyTitle}>GyanDeep AI અભ્યાસ સાથી</Text>
                <Text style={styles.emptySub}>
                  ધોરણ {selectedStandard} {activeSubject ? `• ${activeSubject.nameGu || activeSubject.name}` : ''} ના કોઈપણ પ્રશ્નો, દાખલા કે MCQ ટેસ્ટ પૂછો.
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
                  <Text style={styles.suggestSectionTitle}>🎯 ક્વિઝ અને પ્રશ્નોના સજેશન</Text>
                  <Text style={styles.suggestSectionSub}>ક્લિક કરતાં જ AI તુરંત ઉત્તર આપશે</Text>
                </View>

                <View style={styles.suggestionsGrid}>
                  {currentSuggestions.map(s => (
                    <AnimatedPressable
                      key={s.id}
                      style={[styles.suggestionCard, { borderLeftColor: s.color }]}
                      onPress={() => handleSend(s.prompt)}
                      scaleTo={0.96}
                    >
                      <View style={[styles.suggestionIconBox, { backgroundColor: s.bg }]}>
                        <Text style={styles.suggestionEmoji}>{s.icon}</Text>
                      </View>
                      <View style={styles.suggestionContent}>
                        <View style={[styles.suggestionCategoryBadge, { backgroundColor: s.bg }]}>
                          <Text style={[styles.suggestionCategoryText, { color: s.color }]}>{s.category}</Text>
                        </View>
                        <Text style={styles.suggestionTitle}>{s.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={styles.suggestionArrow} />
                    </AnimatedPressable>
                  ))}
                </View>
              </View>

              {/* AI Features Row */}
              <View style={styles.featuresRow}>
                {[
                  { icon: '🎤', label: 'ગુજરાતી Voice', desc: 'બોલીને પ્રશ્ન પૂછો' },
                  { icon: '📷', label: 'Photo OCR', desc: 'પુસ્તકનો ફોટો પાડો' },
                  { icon: '📚', label: 'GCERT RAG', desc: 'પાઠ્યપુસ્તક સંદર્ભ' },
                ].map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={styles.featureIconBox}>
                      <Text style={styles.featureEmoji}>{f.icon}</Text>
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
        />

        {/* ── TYPING INDICATOR ── */}
        {loading && <TypingIndicator />}

        {/* ── FOLLOW-UP QUICK CHIPS (Visible during active conversation) ── */}
        {messages.length > 0 && !loading && (
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

        {/* ── IMAGE PREVIEW BAR ── */}
        {selectedImage && (
          <View style={styles.imgPreviewBar}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imgThumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.imgName} numberOfLines={1}>{selectedImage.name}</Text>
              <Text style={styles.imgSub}>ફોટો જોડાયેલ છે — પ્રશ્ન પૂછો</Text>
            </View>
            <AnimatedPressable onPress={() => setSelectedImage(null)} style={styles.imgRemove} scaleTo={0.85}>
              <Ionicons name="close-circle" size={22} color={studentColors.error} />
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
                ઉદાહરણ: "{activeSubject?.nameGu || 'વિજ્ઞાન'} નો ૫ MCQ ટેસ્ટ પૂછો"
              </Text>

              <AnimatedPressable
                style={styles.voiceStopBtn}
                onPress={() => {
                  webViewRef.current?.postMessage('stop');
                  setRecording(false);
                  setVoiceModalVisible(false);
                }}
                scaleTo={0.94}
              >
                <Ionicons name="stop-circle" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={styles.voiceStopText}>બોલવાનું પૂરું થયું</Text>
              </AnimatedPressable>
            </View>
          </View>
        </Modal>

        {/* Hidden WebView for Speech Recognition */}
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
    backgroundColor: '#F1F5F9',
  },

  // ── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
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
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  subjectFilterScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  subjectChipActive: {
    backgroundColor: '#FFFFFF',
  },
  subjectChipEmoji: {
    fontSize: 13,
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  subjectChipTextActive: {
    color: '#1e40af',
    fontWeight: '700',
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
  aiAvatarEmoji: {
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
  bubbleWrapper: {
    maxWidth: width * 0.78,
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubbleWrapperAI: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 3,
    ...shadows.sm,
  },
  bubbleAI: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
  },
  timeTextUser: {
    textAlign: 'right',
    marginRight: 2,
  },
  timeTextAI: {
    marginLeft: 4,
  },

  // ── Citations ──────────────────────────────────────────────────
  citationContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  citationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  citationHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  citationScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  citationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: 175,
  },
  citationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  citationCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  citationCardPage: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  citationCardQuote: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
  },

  // ── Empty State & Quiz Suggestions ─────────────────────────────
  emptyWrap: {
    paddingVertical: 10,
  },
  emptyHero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  emptyAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyAvatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatarEmoji: {
    fontSize: 26,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  activeSubjectBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 1,
  },

  // ── Follow-Up Quick Chips Bar ──────────────────────────────────
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
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  typingLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
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
    marginBottom: 8,
  },
  voiceHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  voiceStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  voiceStopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
});

// ── CUSTOM RICH RENDERERS ─────────────────────────────────────────────────────

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
          color: isUser ? '#FFFFFF' : '#0f172a',
          marginBottom: lineIdx === lines.length - 1 ? 0 : 4,
        }}
      >
        {lineElements}
      </Text>
    );
  });
};
