import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

const { width } = Dimensions.get('window');

export function StudentFlashcardsScreen({ route }: { route: any }): React.JSX.Element {
  const { chapterId } = route.params;

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!chapterId) return;

    const fetchFlashcards = async () => {
      try {
        let snapshot = await firestore()
          .collection('flashcards')
          .where('chapter_id', '==', chapterId)
          .where('isDeleted', '==', false)
          .get();

        if (snapshot.empty) {
          snapshot = await firestore()
            .collection('flashcards')
            .where('chapterId', '==', chapterId)
            .where('isDeleted', '==', false)
            .get();
        }

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCards(data);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        Alert.alert('Error', 'Failed to load flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [chapterId]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={studentColors.primary} />
        <Text style={styles.loadingText}>ફ્લેશકાર્ડ્સ લોડ થઈ રહ્યા છે...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>કોઈ ફ્લેશકાર્ડ ઉપલબ્ધ નથી.</Text>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>
        કાર્ડ {currentIndex + 1} / {cards.length}
      </Text>

      {/* Interactive Flippable Card */}
      <TouchableOpacity
        style={[
          styles.flashcard,
          isFlipped ? styles.flashcardBack : styles.flashcardFront
        ]}
        onPress={handleFlip}
        activeOpacity={0.9}
      >
        <Text style={styles.hintText}>
          {isFlipped ? 'પલટો (Flip to Front) 🔄' : 'પલટો (Flip to Back) 🔄'}
        </Text>
        <View style={styles.cardContent}>
          <Text style={[
            styles.cardText,
            isFlipped ? styles.cardTextBack : styles.cardTextFront
          ]}>
            {isFlipped ? currentCard.back_text_gu : currentCard.front_text_gu}
          </Text>
        </View>
        {currentCard.card_type && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{currentCard.card_type}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledBtn]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>◀ Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === cards.length - 1 && styles.disabledBtn]}
          onPress={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          <Text style={styles.navButtonText}>Next ▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: studentColors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: studentColors.textSecondary,
    fontSize: typography.size.sm,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: studentColors.textMuted,
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: studentColors.textSecondary,
    marginBottom: spacing.xl,
  },
  flashcard: {
    width: width - spacing.xl * 2,
    height: 320,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: studentColors.border,
  },
  flashcardFront: {
    backgroundColor: studentColors.surface,
  },
  flashcardBack: {
    backgroundColor: studentColors.secondaryLight || '#E0F2FE',
    borderColor: studentColors.secondary || '#38BDF8',
  },
  hintText: {
    fontSize: typography.size.xs,
    color: studentColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.md,
    textAlign: 'center',
    fontWeight: typography.weight.semibold,
  },
  cardTextFront: {
    color: studentColors.textPrimary,
  },
  cardTextBack: {
    color: studentColors.textPrimary,
  },
  tagBadge: {
    backgroundColor: studentColors.surfaceHover,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: studentColors.border,
  },
  tagText: {
    fontSize: typography.size.xs,
    color: studentColors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: typography.weight.bold,
  },
  navRow: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    gap: spacing.xl,
  },
  navButton: {
    backgroundColor: studentColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: studentColors.textInverse,
  },
});
