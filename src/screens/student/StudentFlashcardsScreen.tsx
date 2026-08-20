import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { shadows } from '../../theme';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  cardType?: string;
  chapterTitle?: string;
}

export function StudentFlashcardsScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { chapterId, chapterTitle } = route.params || {};

  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewList, setReviewList] = useState<FlashcardData[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Card movement animation
  const position = useRef(new Animated.ValueXY()).current;
  // Card flip 3D rotation animation (0 -> 180)
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchFlashcards();
  }, [chapterId]);

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      let data: FlashcardData[] = [];
      if (chapterId) {
        let snapshot = await firestore()
          .collection('flashcards')
          .where('chapter_id', '==', chapterId)
          .where('isDeleted', '==', false)
          .limit(20)
          .get();

        if (snapshot.empty) {
          snapshot = await firestore()
            .collection('flashcards')
            .where('chapterId', '==', chapterId)
            .where('isDeleted', '==', false)
            .limit(20)
            .get();
        }

        if (!snapshot.empty) {
          data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              front: d.front_text_gu || d.front || d.question || d.term || '',
              back: d.back_text_gu || d.back || d.answer || d.definition || '',
              cardType: d.card_type || d.category || 'મુખ્ય મુદ્દો',
              chapterTitle: d.chapter_title || chapterTitle,
            };
          }).filter(c => c.front && c.back);
        }
      }

      // If no pre-seeded flashcards exist for this chapter, create intelligent interactive study cards
      if (data.length === 0) {
        const title = chapterTitle || 'આ પ્રકરણ';
        data = [
          {
            id: 'fallback_1',
            front: `"${title}" પ્રકરણનો મુખ્ય હેતુ શું છે?`,
            back: `આ પ્રકરણમાં ${title} વિશેની મૂળભૂત વિભાવનાઓ, સિદ્ધાંતો અને વ્યવહારિક ઉદાહરણો સમજાવવામાં આવ્યા છે.`,
            cardType: 'મુખ્ય વિભાવના',
          },
          {
            id: 'fallback_2',
            front: `પરીક્ષા માટે સૌથી મહત્વના મુદ્દા કેવી રીતે યાદ રાખવા?`,
            back: `નિયમિત ફ્લેશકાર્ડ રિવિઝન, MCQ ટેસ્ટ અને મુખ્ય સૂત્રો/વ્યાખ્યાઓની ટૂંકી નોંધ બનાવીને.`,
            cardType: 'અભ્યાસ ટિપ્સ',
          },
          {
            id: 'fallback_3',
            front: `આ પ્રકરણમાં આવતી મહત્વની વ્યાખ્યાઓ કઈ છે?`,
            back: `પાઠ્યપુસ્તકના દરેક વિભાગના અંતે આપેલી મુખ્ય પરિભાષાઓ અને બોલ્ડ અક્ષરોમાં લખેલા નિયમો.`,
            cardType: 'IMP વ્યાખ્યા',
          },
          {
            id: 'fallback_4',
            front: `સ્વાધ્યાયના પ્રશ્નોનું પુનરાવર્તન શા માટે જરૂરી છે?`,
            back: `કારણ કે વાર્ષિક પરીક્ષામાં મોટાભાગના પ્રશ્નો પાઠ્યપુસ્તકના સ્વાધ્યાયમાંથી પૂછવામાં આવે છે.`,
            cardType: 'પરીક્ષા લક્ષી',
          },
        ];
      }

      setCards(data);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredCount(0);
      setReviewList([]);
      setIsCompleted(false);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      Alert.alert('Error', 'ફ્લેશકાર્ડ્સ લોડ કરવામાં સમસ્યા આવી.');
    } finally {
      setLoading(false);
    }
  };

  // Flip Card Animation (3D Y-rotation)
  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(false));
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(true));
    }
  };

  const resetFlip = () => {
    flipAnimation.setValue(0);
    setIsFlipped(false);
  };

  // Swipe Action
  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? width * 1.5 : -width * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const currentCard = cards[currentIndex];
    if (direction === 'right') {
      setMasteredCount(prev => prev + 1);
    } else if (currentCard) {
      setReviewList(prev => [...prev, currentCard]);
    }

    position.setValue({ x: 0, y: 0 });
    resetFlip();

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder for smooth Swipe Left / Right gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy * 0.4 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          // If simply tapped with minimal movement, flip card!
          if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
            flipCard();
          } else {
            resetPosition();
          }
        }
      },
    })
  ).current;

  // Restart full deck
  const handleRestart = () => {
    fetchFlashcards();
  };

  // Review only difficult cards
  const handleReviewDifficult = () => {
    if (reviewList.length > 0) {
      setCards(reviewList);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredCount(0);
      setReviewList([]);
      setIsCompleted(false);
      resetFlip();
      position.setValue({ x: 0, y: 0 });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>ફ્લેશકાર્ડ્સ લોડ થઈ રહ્યા છે...</Text>
      </SafeAreaView>
    );
  }

  // Completion Summary Screen
  if (isCompleted || cards.length === 0) {
    const total = cards.length;
    const reviewCount = reviewList.length;
    const isPerfect = reviewCount === 0 && total > 0;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn} scaleTo={0.88}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </AnimatedPressable>
          <Text style={styles.topHeaderTitle} numberOfLines={1}>
            {chapterTitle || 'ફ્લેશકાર્ડ્સ'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.trophyRing}>
            <Text style={styles.trophyEmoji}>{isPerfect ? '🏆' : '🎉'}</Text>
          </View>

          <Text style={styles.summaryTitle}>
            {isPerfect ? 'અદ્ભુત! સંપૂર્ણ સ્કોર!' : 'અભ્યાસ પૂર્ણ થયો!'}
          </Text>
          <Text style={styles.summarySub}>
            તમે આ પ્રકરણના તમામ {total} ફ્લેશકાર્ડ્સ પૂર્ણ કર્યા છે.
          </Text>

          {/* Stats Badges */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <Text style={[styles.statCount, { color: '#059669' }]}>{masteredCount}</Text>
              <Text style={styles.statLabel}>આવડી ગયું</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Ionicons name="repeat" size={24} color="#dc2626" />
              <Text style={[styles.statCount, { color: '#dc2626' }]}>{reviewCount}</Text>
              <Text style={styles.statLabel}>ફરી યાદ કરો</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.summaryActions}>
            {reviewCount > 0 && (
              <AnimatedPressable
                style={[styles.summaryBtn, { backgroundColor: '#d97706' }]}
                onPress={handleReviewDifficult}
                scaleTo={0.95}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.summaryBtnText}>અઘરા કાર્ડ્સ ફરી શીખો ({reviewCount})</Text>
              </AnimatedPressable>
            )}

            <AnimatedPressable
              style={[styles.summaryBtn, { backgroundColor: '#2563eb' }]}
              onPress={handleRestart}
              scaleTo={0.95}
            >
              <Ionicons name="play-forward" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.summaryBtnText}>આખો ડેક ફરી પ્રેક્ટિસ કરો</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.summaryBtn, styles.summaryBtnSecondary]}
              onPress={() => navigation.goBack()}
              scaleTo={0.95}
            >
              <Text style={styles.summaryBtnSecondaryText}>પ્રકરણ પર પાછા જાઓ</Text>
            </AnimatedPressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) {
    return <View style={styles.container} />;
  }
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  // Swipe Animation Interpolations
  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  // Like (Right Swipe) & Nope (Left Swipe) badge opacities
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width * 0.25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // 3D Flip Interpolation (Front side: 0 -> 180, Back side: 180 -> 360)
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn} scaleTo={0.88}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </AnimatedPressable>

        <View style={styles.topHeaderCenter}>
          <Text style={styles.topHeaderTitle} numberOfLines={1}>
            ⚡ {chapterTitle || 'ફ્લેશકાર્ડ્સ'}
          </Text>
          <Text style={styles.topHeaderSub}>
            કાર્ડ {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <AnimatedPressable onPress={handleRestart} style={styles.backBtn} scaleTo={0.88}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </AnimatedPressable>
      </View>

      {/* Progress Bar Strip */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: `${((currentIndex + 1) / cards.length) * 100}%` },
          ]}
        />
      </View>

      {/* ── CARD DECK CONTAINER ── */}
      <View style={styles.deckContainer}>
        {/* Next Card (Stacked Underneath) */}
        {nextCard && (
          <View style={[styles.cardWrapper, styles.nextCardWrapper]}>
            <View style={[styles.flashcard, styles.nextCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardTypeBadge, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[styles.cardTypeText, { color: '#64748b' }]}>
                    {nextCard.cardType || 'મુખ્ય મુદ્દો'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardMainText, { color: '#94a3b8' }]} numberOfLines={3}>
                  {nextCard.front}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Active Swiping Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.cardWrapper, animatedCardStyle]}
        >
          {/* Green "MASTERED" Stamp Badge on Right Drag */}
          <Animated.View style={[styles.choiceBadge, styles.likeBadge, { opacity: likeOpacity }]}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.likeBadgeText}>આવડી ગયું</Text>
          </Animated.View>

          {/* Red "REVIEW" Stamp Badge on Left Drag */}
          <Animated.View style={[styles.choiceBadge, styles.nopeBadge, { opacity: nopeOpacity }]}>
            <Ionicons name="repeat" size={20} color="#dc2626" style={{ marginRight: 4 }} />
            <Text style={styles.nopeBadgeText}>ફરી શીખો</Text>
          </Animated.View>

          {/* 3D Flippable Card Front */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardFront,
              {
                opacity: frontOpacity,
                transform: [{ rotateY: frontInterpolate }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardTypeBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Ionicons name="bulb-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={[styles.cardTypeText, { color: '#2563eb' }]}>
                  {currentCard.cardType || 'પ્રશ્ન / વિભાવના'}
                </Text>
              </View>
              <View style={styles.flipPill}>
                <Ionicons name="swap-horizontal" size={13} color="#64748b" />
                <Text style={styles.flipPillText}>સાઇડ ૧</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardMainText}>
                {currentCard.front}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Ionicons name="hand-left-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.flipHintText}>
                ઉત્તર જોવા માટે કાર્ડ પર ટચ કરો 🔄
              </Text>
            </View>
          </Animated.View>

          {/* 3D Flippable Card Back */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardBack,
              {
                opacity: backOpacity,
                transform: [{ rotateY: backInterpolate }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardTypeBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={[styles.cardTypeText, { color: '#059669' }]}>
                  સાચો ઉત્તર / સમજૂતી
                </Text>
              </View>
              <View style={[styles.flipPill, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="swap-horizontal" size={13} color="#059669" />
                <Text style={[styles.flipPillText, { color: '#059669' }]}>સાઇડ ૨</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardBackText}>
                {currentCard.back}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={[styles.flipHintText, { color: '#059669' }]}>
                👈 ડાબે: ફરી શીખો | જમણે: આવડી ગયું 👉
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── BOTTOM ACTION CONTROLS ── */}
      <View style={styles.actionRow}>
        {/* Left Button: Red "Review" */}
        <AnimatedPressable
          style={[styles.actionBtn, styles.btnReview]}
          onPress={() => forceSwipe('left')}
          scaleTo={0.90}
        >
          <Ionicons name="close" size={26} color="#dc2626" />
        </AnimatedPressable>

        {/* Center Button: Flip */}
        <AnimatedPressable
          style={[styles.actionBtn, styles.btnFlip]}
          onPress={flipCard}
          scaleTo={0.90}
        >
          <Ionicons name="swap-horizontal" size={26} color="#2563eb" />
        </AnimatedPressable>

        {/* Right Button: Green "Mastered" */}
        <AnimatedPressable
          style={[styles.actionBtn, styles.btnMastered]}
          onPress={() => forceSwipe('right')}
          scaleTo={0.90}
        >
          <Ionicons name="checkmark" size={26} color="#059669" />
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // ── Header ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  topHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topHeaderSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },

  // ── Progress Bar ──
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },

  // ── Deck Area ──
  deckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  cardWrapper: {
    width: width - 36,
    height: Math.min(height * 0.54, 430),
    position: 'absolute',
  },
  nextCardWrapper: {
    transform: [{ scale: 0.94 }, { translateY: 14 }],
    opacity: 0.5,
  },
  nextCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  flashcard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
    ...shadows.lg,
  },
  flashcardFront: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e2e8f0',
  },
  flashcardBack: {
    backgroundColor: '#f8fafc',
    borderColor: '#86efac',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTypeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  flipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  flipPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  cardMainText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  cardBackText: {
    fontSize: 16.5,
    lineHeight: 26,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  flipHintText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Choice Stamp Badges ──
  choiceBadge: {
    position: 'absolute',
    top: 24,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  likeBadge: {
    left: 20,
    borderColor: '#059669',
    backgroundColor: 'rgba(236,253,245,0.95)',
    transform: [{ rotate: '-12deg' }],
  },
  likeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  nopeBadge: {
    right: 20,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(254,242,242,0.95)',
    transform: [{ rotate: '12deg' }],
  },
  nopeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },

  // ── Bottom Action Row ──
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 10,
    gap: 24,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    ...shadows.md,
  },
  btnReview: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  btnFlip: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  btnMastered: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },

  // ── Summary Screen ──
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trophyRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyEmoji: {
    fontSize: 44,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  summarySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  summaryActions: {
    width: '100%',
    gap: 10,
  },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  summaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  summaryBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
