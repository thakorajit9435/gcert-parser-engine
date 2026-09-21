import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useSubjects } from '../../hooks/useSubjects';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useStandardContext } from '../../context/StandardContext';
import { LeaderboardEntry, UserBookmark } from '../../types';
import { COLLECTIONS } from '../../constants';
import firestore from '@react-native-firebase/firestore';
import { EmptyState, SubjectCardSkeleton, ChapterCardSkeleton, AnimatedPressable } from '../../components/common';
import { StandardSelectionModal } from '../../components/student';
import { logAnalyticsEvent } from '../../services/analytics';

const SUBJECT_ICONS: Record<string, string> = {
    Mathematics: '📐',
    Science: '🔬',
    English: '📖',
    Hindi: '📝',
    Gujarati: '🔤',
    'Social Science': '🌍',
    Computer: '💻',
    default: '📚',
};



const LeaderboardPreview = React.memo(function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }): React.JSX.Element {
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <View style={styles.leaderboardPreview}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
            </View>
            {entries.slice(0, 3).map((entry, index) => (
                <View key={entry.uid} style={styles.leaderRow}>
                    <Text style={styles.leaderMedal}>{medals[index]}</Text>
                    <View style={styles.leaderInfo}>
                        <Text style={styles.leaderName}>{entry.name}</Text>
                        <Text style={styles.leaderStd}>Std {entry.standard}</Text>
                    </View>
                    <Text style={styles.leaderPoints}>{entry.points} pts</Text>
                </View>
            ))}
        </View>
    );
});

const DailyChallengeBanner = React.memo(function DailyChallengeBanner({ navigation, standardId, userId }: { navigation: any; standardId: string; userId: string }): React.JSX.Element {
    const { t } = useTranslation();
    const { challenge, quiz, hasAttempted, loading, error, refresh } = useDailyChallenge(standardId, userId);

    if (loading) {
        return (
            <View style={styles.dailyQuizCard}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.dailyQuizSub}>  Loading daily challenge…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <TouchableOpacity
                style={[styles.dailyQuizCard, styles.dailyQuizCardMuted]}
                activeOpacity={0.8}
                onPress={refresh}
            >
                <View style={styles.dailyQuizLeft}>
                    <Text style={styles.dailyQuizEmoji}>⚠️</Text>
                </View>
                <View style={styles.dailyQuizContent}>
                    <Text style={styles.dailyQuizTitle}>{t('common.dailyChallenge')}</Text>
                    <Text style={styles.dailyQuizSub}>Failed to load. Tap to retry.</Text>
                </View>
            </TouchableOpacity>
        );
    }

    if (!challenge || !quiz || !challenge.isActive) {
        return (
            <View style={[styles.dailyQuizCard, styles.dailyQuizCardMuted]}>
                <View style={styles.dailyQuizLeft}>
                    <Text style={styles.dailyQuizEmoji}>📅</Text>
                </View>
                <View style={styles.dailyQuizContent}>
                    <Text style={styles.dailyQuizTitle}>{t('common.dailyChallenge')}</Text>
                    <Text style={styles.dailyQuizSub}>No active challenge for today</Text>
                </View>
            </View>
        );
    }

    if (hasAttempted) {
        return (
            <View style={[styles.dailyQuizCard, styles.dailyQuizCardMuted]}>
                <View style={styles.dailyQuizLeft}>
                    <Text style={styles.dailyQuizEmoji}>✅</Text>
                </View>
                <View style={styles.dailyQuizContent}>
                    <Text style={styles.dailyQuizTitle}>{t('common.dailyChallenge')}</Text>
                    <Text style={styles.dailyQuizSub}>Already completed today!</Text>
                </View>
            </View>
        );
    }

    return (
        <AnimatedPressable
            style={styles.dailyQuizCard}
            onPress={() => navigation.navigate('Quiz', { quizId: quiz.id })}
            scaleTo={0.97}
        >
            <View style={styles.dailyQuizLeft}>
                <Text style={styles.dailyQuizEmoji}>⚡</Text>
            </View>
            <View style={styles.dailyQuizContent}>
                <Text style={styles.dailyQuizTitle}>{t('common.dailyChallenge')}</Text>
                <Text style={styles.dailyQuizSub} numberOfLines={1}>{quiz.title}</Text>
            </View>
            <Text style={styles.dailyQuizArrow}>→</Text>
        </AnimatedPressable>
    );
});

// ─── Standard Switcher Card ────────────────────────────────────

interface StandardSwitcherProps {
    onPress: () => void;
    selectedStandard: string;
    standardLabel: string;
}

const StandardSwitcher = React.memo(function StandardSwitcher({
    onPress,
    selectedStandard,
    standardLabel,
}: StandardSwitcherProps): React.JSX.Element {
    return (
        <TouchableOpacity
            style={styles.standardSwitcher}
            onPress={onPress}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <View style={styles.standardSwitcherLeft}>
                <View style={styles.standardSwitcherIconWrap}>
                    <Text style={styles.standardSwitcherIcon}>🎓</Text>
                </View>
                <View style={styles.standardSwitcherTextCol}>
                    <View style={styles.standardSwitcherTagRow}>
                        <Text style={styles.standardSwitcherLabel}>વર્તમાન ધોરણ</Text>
                        <View style={styles.standardSwitcherGcertTag}>
                            <Text style={styles.standardSwitcherGcertText}>GCERT</Text>
                        </View>
                    </View>
                    <Text style={styles.standardSwitcherText}>
                        ધોરણ {selectedStandard} <Text style={styles.standardSwitcherSubText}>({standardLabel})</Text>
                    </Text>
                </View>
            </View>
            <View style={styles.standardSwitcherBtn}>
                <Text style={styles.standardSwitcherChangeText}>બદલો</Text>
                <Ionicons name="swap-horizontal" size={15} color="#1d4ed8" style={{ marginLeft: 4 }} />
            </View>
        </TouchableOpacity>
    );
});

// ─── Bookmark Section ──────────────────────────────────────────

const BookmarkSection = React.memo(function BookmarkSection({ bookmarks, navigation }: { bookmarks: UserBookmark[]; navigation: any }): React.JSX.Element {
    const { setSelectedStandard } = useStandardContext();

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <View style={styles.bookmarkSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📌 મારી બુકમાર્ક્સ</Text>
                </View>
                <View style={styles.bookmarkEmpty}>
                    <Text style={styles.bookmarkEmptyIcon}>⭐</Text>
                    <Text style={styles.bookmarkEmptyText}>હજુ સુધી કોઈ પ્રકરણ બુકમાર્ક કરેલ નથી</Text>
                    <Text style={styles.bookmarkEmptySub}>તમે બુકમાર્ક કરેલા પ્રકરણો અહીં ઝડપી ઍક્સેસ માટે દેખાશે</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.bookmarkSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📌 મારી બુકમાર્ક્સ</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('BookmarkList')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.seeAllText}>બધા જુઓ ({bookmarks.length}) →</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.bookmarkScrollContent}
            >
                {bookmarks.map((bm, index) => {
                    const isLast = index === bookmarks.length - 1;
                    return (
                        <AnimatedPressable
                            key={bm.id || `bm_${index}`}
                            style={[styles.bookmarkCardHorizontal, isLast && { marginRight: spacing.xl }]}
                            onPress={() => {
                                if (bm.standardId) {
                                    setSelectedStandard(bm.standardId);
                                }
                                navigation.navigate('ChapterDetail', { chapterId: bm.chapterId });
                            }}
                            scaleTo={0.96}
                        >
                            <View style={styles.bookmarkIconRow}>
                                <View style={styles.bookmarkIconHorizontal}>
                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                </View>
                                <Text style={styles.bookmarkSubjectText} numberOfLines={1}>
                                    {bm.subjectName || 'વિષય'}
                                </Text>
                            </View>
                            <Text style={styles.bookmarkTitleHorizontal} numberOfLines={2}>
                                {bm.chapterTitle || 'પ્રકરણ'}
                            </Text>
                            <View style={styles.bookmarkFooter}>
                                <View style={styles.bookmarkStdPill}>
                                    <Text style={styles.bookmarkMetaHorizontal}>
                                        {bm.standardName || `ધોરણ ${bm.standardId || '—'}`}
                                    </Text>
                                </View>
                                <View style={styles.bookmarkOpenBadge}>
                                    <Text style={styles.bookmarkOpenBadgeText}>ખોલો ➔</Text>
                                </View>
                            </View>
                        </AnimatedPressable>
                    );
                })}
            </ScrollView>
        </View>
    );
});

// ─── Quick Access Cards ────────────────────────────────────────

const QuickAccessCards = React.memo(function QuickAccessCards({ navigation, standardId }: { navigation: any; standardId: string }): React.JSX.Element {
    const { t } = useTranslation();
    const items = [
        { emoji: '🗣️', label: t('common.language'), route: 'LanguageSection', params: { standardId, session: '1' } },
        { emoji: '📋', label: 'Blueprint', route: 'BlueprintList', params: { standardId, session: '1' } },
        { emoji: '📄', label: 'Old\nPapers', route: 'OldPapersList', params: { standardId, session: '1' } },
        { emoji: '🧩', label: 'Practice\nMCQ', route: 'SessionScreen', params: { standardId } },
    ];
    return (
        <View style={styles.quickAccessRow}>
            {items.map(item => (
                <AnimatedPressable
                    key={item.label}
                    style={styles.quickAccessCard}
                    onPress={() => navigation.navigate(item.route, item.params)}
                    scaleTo={0.93}
                >
                    <Text style={styles.quickAccessEmoji}>{item.emoji}</Text>
                    <Text style={styles.quickAccessLabel}>{item.label}</Text>
                </AnimatedPressable>
            ))}
        </View>
    );
});

// ─── Home Screen ───────────────────────────────────────────────

export function StudentHomeScreen({ navigation }: { navigation: any }): React.JSX.Element {
    const { t } = useTranslation();
    const { userProfile, user } = useAuth();
    const { selectedStandard, setSelectedStandard, standardLabel } = useStandardContext();
    const standardId = selectedStandard;
    const { entries: leaderboardEntries } = useLeaderboard(3);
    const { progressMap } = useUserProgress();
    const { bookmarks } = useBookmarks(user?.uid || userProfile?.uid);
    const [refreshing, setRefreshing] = useState(false);
    const [standardModalVisible, setStandardModalVisible] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const recentChapter = useMemo(() => {
        return Object.values(progressMap)
            .filter(c => c.lastOpenedAt)
            .sort((a, b) => (b.lastOpenedAt?.toMillis() || 0) - (a.lastOpenedAt?.toMillis() || 0))[0];
    }, [progressMap]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[studentColors.primary]}
                        tintColor={studentColors.primary}
                    />
                }
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.greetingText}>
                            નમસ્તે, {userProfile?.name?.split(' ')[0] || 'Student'} 👋
                        </Text>
                        <TouchableOpacity
                            style={styles.stdBadge}
                            activeOpacity={0.7}
                            onPress={() => setStandardModalVisible(true)}
                        >
                            <Text style={styles.stdBadgeText}>Std {selectedStandard}</Text>
                            <Ionicons name="chevron-down" size={12} color={studentColors.primary} style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.greetingSubtext}>
                        {userProfile?.points ?? 0} XP • 🔥 {userProfile?.streak ?? 0} Day Streak
                    </Text>
                </View>

                {/* Standard Switcher */}
                <StandardSwitcher
                    onPress={() => setStandardModalVisible(true)}
                    selectedStandard={selectedStandard}
                    standardLabel={standardLabel}
                />

                {/* Continue Learning */}
                <TouchableOpacity
                    style={styles.continueCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('SessionScreen', { standardId })}
                >
                    <View style={styles.continueLeft}>
                        <Text style={styles.continueEmoji}>🚀</Text>
                        <View>
                            <Text style={styles.continueTitle}>{t('common.continueLearning')}</Text>
                            <Text style={styles.continueSub}>
                                {recentChapter ? t('common.recentChapter') : t('common.startJourney')}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.continueArrow}>→</Text>
                </TouchableOpacity>

                {/* Daily Challenge */}
                <DailyChallengeBanner navigation={navigation} standardId={standardId} userId={userProfile?.uid || ''} />

                {/* Quick Access */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>⚡ {t('common.quickAccess')}</Text>
                </View>
                <QuickAccessCards navigation={navigation} standardId={standardId} />

                {/* Bookmarks */}
                <BookmarkSection bookmarks={bookmarks} navigation={navigation} />

                {/* NMMS Banner */}
                <TouchableOpacity style={styles.nmmsBanner} activeOpacity={0.8}>
                    <View style={styles.nmmsContent}>
                        <Text style={styles.nmmsTitle}>🎯 NMMS Preparation</Text>
                        <Text style={styles.nmmsSub}>Practice MAT & SAT questions</Text>
                    </View>
                    <View style={styles.nmmsBadge}>
                        <Text style={styles.nmmsBadgeText}>NEW</Text>
                    </View>
                </TouchableOpacity>

                {/* Leaderboard Preview */}
                {leaderboardEntries.length > 0 && (
                    <LeaderboardPreview entries={leaderboardEntries} />
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Floating Action Button (AI Tutor) */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AITutor')}
            >
                <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Standard Selection Modal */}
            <StandardSelectionModal
                visible={standardModalVisible}
                onClose={() => setStandardModalVisible(false)}
                selectedStandard={selectedStandard}
                onSelectStandard={(std) => setSelectedStandard(std)}
            />
        </View>
    );
}

export function StudentSubjectsScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { t } = useTranslation();
    const { userProfile, user } = useAuth();
    const currentUserId = user?.uid || userProfile?.uid;
    const { selectedStandard } = useStandardContext();
    const subjectId = route?.params?.subjectId;
    const subjectName = route?.params?.subjectName || 'Subjects';
    const { session } = route?.params || {};
    const effectiveStandardId = selectedStandard;

    // Fix: We need to pass both subjectId AND effectiveStandardId to useChapters
    const { chapters: chapterList, loading: chaptersLoading } = require('../../hooks/useChapters').useChapters(subjectId, effectiveStandardId);
    const { subjects, loading: subjectsLoading } = useSubjects(effectiveStandardId, session);
    const { isBookmarked, toggle: toggleBookmark } = useBookmarks(currentUserId);
    const [bookmarkLoadingMap, setBookmarkLoadingMap] = useState<{ [chapterId: string]: boolean }>({});
    const [chapterCounts, setChapterCounts] = useState<{ [subjectId: string]: number }>({});

    // Live real chapter counts per subject for current standard
    useEffect(() => {
        if (!effectiveStandardId) return;

        const rawStr = String(effectiveStandardId).trim();
        const numericStr = rawStr.replace(/[^0-9]/g, '');
        const possibleIds = Array.from(
            new Set(
                [
                    rawStr,
                    numericStr,
                    numericStr ? Number(numericStr) : null,
                    numericStr ? `std_${numericStr}` : null,
                ].filter((val): val is string | number => val !== null && val !== '')
            )
        );

        const unsub = firestore()
            .collection(COLLECTIONS.CHAPTERS)
            .where('standardId', 'in', possibleIds.slice(0, 10))
            .onSnapshot(
                snapshot => {
                    if (!snapshot || snapshot.empty) {
                        setChapterCounts({});
                        return;
                    }
                    const counts: { [subjectId: string]: number } = {};
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        if (data.isDeleted === true) return;
                        const subId = data.subjectId;
                        if (subId) {
                            counts[subId] = (counts[subId] || 0) + 1;
                        }
                    });
                    setChapterCounts(counts);
                },
                err => console.log('Chapter count snapshot notice:', err.message)
            );

        return () => unsub();
    }, [effectiveStandardId]);

    const handleToggleBookmark = async (chapterItem: any) => {
        if (!currentUserId || bookmarkLoadingMap[chapterItem.id]) return;
        setBookmarkLoadingMap(prev => ({ ...prev, [chapterItem.id]: true }));
        try {
            await toggleBookmark(chapterItem.id, {
                standardId: String(effectiveStandardId || chapterItem.standardId || ''),
                standardName: `ધોરણ ${effectiveStandardId || chapterItem.standardId || ''}`,
                subjectId: subjectId || chapterItem.subjectId,
                subjectName: subjectName,
                chapterTitle: chapterItem.titleGu || chapterItem.title,
            });
        } catch (err) {
            console.error('Failed to toggle bookmark:', err);
        } finally {
            setBookmarkLoadingMap(prev => ({ ...prev, [chapterItem.id]: false }));
        }
    };

    if (!subjectId) {

        return (
            <View style={styles.container}>
                {subjectsLoading ? (
                    <ScrollView contentContainerStyle={styles.listContent}>
                        <SubjectCardSkeleton />
                        <SubjectCardSkeleton />
                        <SubjectCardSkeleton />
                        <SubjectCardSkeleton />
                        <SubjectCardSkeleton />
                    </ScrollView>
                ) : subjects.length === 0 ? (
                    <EmptyState
                        icon="📚"
                        title={t('common.noData')}
                        message="No subjects found for this session."
                    />
                ) : (
                    <FlatList
                        data={subjects}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        initialNumToRender={10}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        removeClippedSubviews={true}
                        renderItem={({ item }) => {
                            const chCount = chapterCounts[item.id] ?? (item as any).totalChapters ?? (item as any).chaptersCount ?? 0;
                            return (
                                <AnimatedPressable
                                    style={styles.subjectListCard}
                                    onPress={() => {
                                        logAnalyticsEvent('subject_open', {
                                            subject_id: item.id,
                                            subject_name: item.name,
                                            standard_id: effectiveStandardId,
                                        });
                                        if (route.params?.sessionType === 'mcq') {
                                            navigation.push('SubjectMCQScreen', {
                                                subjectId: item.id,
                                                subjectName: item.name,
                                                standardId: effectiveStandardId,
                                                session: session || '1',
                                                sessionTitle: route.params?.sessionTitle
                                            });
                                        } else {
                                            navigation.push('SubjectAndChapterList', {
                                                subjectId: item.id,
                                                subjectName: item.nameGu || item.name,
                                                standardId: effectiveStandardId,
                                                session: session || '1',
                                                sessionType: route.params?.sessionType,
                                                sessionTitle: route.params?.sessionTitle,
                                            });
                                        }
                                    }}
                                    scaleTo={0.97}
                                >
                                    <View style={styles.subjectListIcon}>
                                        <Text style={styles.subjectListEmoji}>
                                            {item.icon || SUBJECT_ICONS[item.name] || SUBJECT_ICONS.default}
                                        </Text>
                                    </View>
                                    <View style={styles.subjectListInfo}>
                                        <Text style={styles.subjectListName}>{item.nameGu || item.name}</Text>
                                        <View style={styles.subjectMetaRow}>
                                            {item.nameGu && item.name !== item.nameGu ? (
                                                <Text style={styles.subjectListNameGu}>{item.name}</Text>
                                            ) : null}
                                            <View style={styles.subjectBadge}>
                                                <Text style={styles.subjectBadgeText}>{chCount} {chCount === 1 ? 'પ્રકરણ' : 'પ્રકરણો'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.chevron}>›</Text>
                                </AnimatedPressable>
                            );
                        }}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.chapterHeader}>
                <Text style={styles.chapterHeaderTitle}>{subjectName}</Text>
                <Text style={styles.chapterHeaderSub}>{chapterList.length} પ્રકરણો</Text>
            </View>

            {chaptersLoading ? (
                <ScrollView contentContainerStyle={styles.listContent}>
                    <ChapterCardSkeleton />
                    <ChapterCardSkeleton />
                    <ChapterCardSkeleton />
                </ScrollView>
            ) : chapterList.length === 0 ? (
                <EmptyState
                    icon="📖"
                    title={t('common.noData')}
                    message="No chapters available."
                />
            ) : (
                <FlatList
                    data={chapterList}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews={true}
                    renderItem={({ item, index }: { item: any; index: number }) => {
                        const locked = false; // All government textbooks & chapters are 100% free to read
                        const bookmarked = isBookmarked(item.id);
                        const mainTitle = item.titleGu || item.title;
                        const resolvedPdfUrl = item.pdfUrl || item.pdf_url || item.file_url || item.url || (item as any).textbookUrl;
                        const isTextbookSession = route.params?.sessionType === 'textbook';

                        const handleOpenChapter = () => {
                            if (isTextbookSession && resolvedPdfUrl) {
                                navigation.navigate('PdfViewer', {
                                    url: resolvedPdfUrl,
                                    title: mainTitle,
                                    pdfId: item.id,
                                    pdfType: 'chapter',
                                    startPage: item.startPage || 1,
                                    endPage: item.endPage,
                                    bookStartPage: item.bookStartPage || 1,
                                });
                            } else {
                                navigation.navigate('ChapterDetail', { chapterId: item.id });
                            }
                        };

                        return (
                            <View
                                style={[styles.chapterCard, item.isCompleted && styles.chapterCardCompleted]}
                            >
                                <AnimatedPressable
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={handleOpenChapter}
                                    scaleTo={0.97}
                                >
                                    <View style={[styles.chapterNumber, item.isCompleted && styles.chapterNumberCompleted]}>
                                        <Text style={[styles.chapterNumberText, item.isCompleted && styles.chapterNumberTextCompleted]}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.chapterInfo}>
                                        <View style={styles.chapterTitleRow}>
                                            <Text style={[styles.chapterTitle, locked && styles.chapterTitleLocked]} numberOfLines={1}>
                                                {mainTitle}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs, flexWrap: 'wrap' }}>
                                            {item.startPage !== undefined && item.startPage !== null ? (
                                                <View style={styles.pageBadge}>
                                                    <Text style={styles.pageBadgeText}>
                                                        📖 પાના નંબર: {item.endPage !== undefined && item.endPage !== null && item.endPage > item.startPage ? `${item.startPage} - ${item.endPage}` : item.startPage}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            {item.description ? (
                                                <Text style={styles.chapterDesc} numberOfLines={1}>{item.description}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </AnimatedPressable>

                                {/* Right Side Actions (Direct Read + Bookmark + Status) */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.xs }}>
                                    {isTextbookSession && resolvedPdfUrl ? (
                                        <TouchableOpacity
                                            style={styles.directReadBtn}
                                            onPress={() => {
                                                navigation.navigate('PdfViewer', {
                                                    url: resolvedPdfUrl,
                                                    title: mainTitle,
                                                    pdfId: item.id,
                                                    pdfType: 'chapter',
                                                    startPage: item.startPage || 1,
                                                    endPage: item.endPage,
                                                    bookStartPage: item.bookStartPage || 1,
                                                });
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="book" size={13} color="#FFFFFF" />
                                            <Text style={styles.directReadText}>વાંચો</Text>
                                        </TouchableOpacity>
                                    ) : null}

                                    {!locked && (
                                        <TouchableOpacity
                                            style={styles.chapterCardBookmarkBtn}
                                            onPress={() => handleToggleBookmark(item)}
                                            disabled={bookmarkLoadingMap[item.id]}
                                            activeOpacity={0.6}
                                        >
                                            {bookmarkLoadingMap[item.id] ? (
                                                <ActivityIndicator size="small" color="#2563eb" style={{ width: 22, height: 22 }} />
                                            ) : (
                                                <Ionicons
                                                    name={bookmarked ? "bookmark" : "bookmark-outline"}
                                                    size={22}
                                                    color={bookmarked ? "#f59e0b" : studentColors.textMuted}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {locked ? (
                                        <View style={styles.lockBadge}>
                                            <Text style={styles.lockIcon}>🔒</Text>
                                        </View>
                                    ) : item.isCompleted ? (
                                        <View style={styles.completedBadgeWrap}>
                                            <Text style={styles.completedIcon}>✅</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.progressCircle}
                                            onPress={() => navigation.navigate('ChapterDetail', { chapterId: item.id })}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.progressText}>▶</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

export function StudentLeaderboardScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const { entries, loading, error, refresh } = useLeaderboard(10);
    const { userProfile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const medals = ['🥇', '🥈', '🥉'];

    if (loading && entries.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.listContent}>
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            )}
            <FlatList
                data={entries}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[studentColors.primary]}
                        tintColor={studentColors.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.leaderboardHeader}>
                        <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
                        <Text style={styles.leaderboardSub}>Top students by points</Text>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const isCurrentUser = item.uid === userProfile?.uid;
                    return (
                        <View style={[styles.rankCard, isCurrentUser && styles.rankCardHighlight]}>
                            <View style={styles.rankLeft}>
                                {index < 3 ? (
                                    <Text style={styles.rankMedal}>{medals[index]}</Text>
                                ) : (
                                    <View style={styles.rankNumber}>
                                        <Text style={styles.rankNumberText}>{item.rank}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.rankInfo}>
                                <Text style={[styles.rankName, isCurrentUser && styles.rankNameHighlight]}>
                                    {item.name} {isCurrentUser ? '(You)' : ''}
                                </Text>
                                <Text style={styles.rankStd}>
                                    Std {item.standard} • 🔥 {item.streak} streak
                                    {item.premium ? ' • 💎' : ''}
                                </Text>
                            </View>
                            <View style={styles.rankPoints}>
                                <Text style={styles.rankPointsValue}>{item.points}</Text>
                                <Text style={styles.rankPointsLabel}>pts</Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <EmptyState
                        icon="🏆"
                        title={t('common.noData')}
                        message="No rankings yet."
                    />
                }
            />
        </View>
    );
}

export function StudentProfileScreen(): React.JSX.Element {
    const { userProfile, signOut } = useAuth();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.profileContent}>
            <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                        {(userProfile?.name || 'S').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.profileName}>{userProfile?.name || 'Student'}</Text>
                <Text style={styles.profilePhone}>{userProfile?.phone || 'No phone'}</Text>
                {userProfile?.premium && (
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>💎 Premium</Text>
                    </View>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userProfile?.points ?? 0}</Text>
                    <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>🔥 {userProfile?.streak ?? 0}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>Std {userProfile?.standard ?? 1}</Text>
                    <Text style={styles.statLabel}>Standard</Text>
                </View>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Name</Text>
                    <Text style={styles.profileValue}>{userProfile?.name || '—'}</Text>
                </View>
                <View style={styles.profileDivider} />
                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Phone</Text>
                    <Text style={styles.profileValue}>{userProfile?.phone || '—'}</Text>
                </View>
                <View style={styles.profileDivider} />
                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Standard</Text>
                    <Text style={styles.profileValue}>Std {userProfile?.standard ?? 1}</Text>
                </View>
                <View style={styles.profileDivider} />
                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Premium</Text>
                    <Text style={styles.profileValue}>{userProfile?.premium ? 'Active 💎' : 'Free'}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.7}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    scrollContent: {
        paddingBottom: spacing.huge,
    },
    greeting: {
        padding: spacing.xl,
        paddingBottom: spacing.md,
    },
    greetingText: {
        fontSize: typography.size.heading,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    greetingSubtext: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        marginTop: spacing.xs,
    },
    stdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: spacing.sm + 4,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    stdBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: '#1d4ed8',
    },
    continueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    continueLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    continueEmoji: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    continueTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    continueSub: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        marginTop: spacing.xxs,
    },
    continueArrow: {
        fontSize: 24,
        color: studentColors.primary,
        fontWeight: typography.weight.bold,
        paddingLeft: spacing.md,
    },
    dailyQuizCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.secondary,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.md,
    },
    dailyQuizLeft: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.xl,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dailyQuizEmoji: {
        fontSize: 24,
    },
    dailyQuizContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    dailyQuizTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    dailyQuizSub: {
        fontSize: typography.size.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: spacing.xxs,
    },
    dailyQuizArrow: {
        fontSize: typography.size.xxl,
        color: '#FFFFFF',
        fontWeight: typography.weight.bold,
    },
    dailyQuizCardMuted: {
        opacity: 0.75,
    },
    nmmsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.primary,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.sm,
    },
    nmmsContent: {
        flex: 1,
    },
    nmmsTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textOnPrimary,
    },
    nmmsSub: {
        fontSize: typography.size.sm,
        color: 'rgba(62,39,35,0.7)',
        marginTop: spacing.xxs,
    },
    nmmsBadge: {
        backgroundColor: studentColors.secondary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    nmmsBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    subjectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
    },
    subjectRow: {
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    subjectCard: {
        width: '47%',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    subjectIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: studentColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    subjectIcon: {
        fontSize: 28,
    },
    subjectName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        textAlign: 'center',
    },
    subjectNameGu: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xxs,
    },
    skeletonCard: {
        width: '47%',
        backgroundColor: studentColors.border,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        margin: spacing.xs,
    },
    skeletonIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: studentColors.borderLight,
        marginBottom: spacing.sm,
    },
    skeletonText: {
        width: '70%',
        height: 14,
        backgroundColor: studentColors.borderLight,
        borderRadius: borderRadius.xs,
        marginBottom: spacing.xs,
    },
    skeletonTextShort: {
        width: '50%',
        height: 12,
        backgroundColor: studentColors.borderLight,
        borderRadius: borderRadius.xs,
    },
    leaderboardPreview: {
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        marginTop: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    leaderMedal: {
        fontSize: 24,
        width: 40,
    },
    leaderInfo: {
        flex: 1,
    },
    leaderName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    leaderStd: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
    },
    leaderPoints: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
    bottomSpacer: {
        height: spacing.xxl,
    },
    listContent: {
        padding: spacing.xl,
    },
    subjectListCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    subjectListIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: studentColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectListEmoji: {
        fontSize: 24,
    },
    subjectListInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    subjectListName: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    subjectListNameGu: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
    },
    subjectMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xxs,
    },
    subjectBadge: {
        backgroundColor: studentColors.primaryLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    subjectBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
    },
    chapterHeader: {
        padding: spacing.xl,
        paddingBottom: spacing.md,
    },
    chapterHeaderTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    chapterHeaderSub: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    chapterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    chapterCardBookmarkBtn: {
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterCardLocked: {
        opacity: 0.6,
    },
    chapterNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: studentColors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterNumberText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    chapterNumberCompleted: {
        backgroundColor: studentColors.success,
    },
    chapterNumberTextCompleted: {
        color: '#FFFFFF',
    },
    chapterCardCompleted: {
        borderColor: studentColors.success,
        backgroundColor: '#DCFCE7',
    },
    chapterInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    chapterTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: spacing.sm,
    },
    recentBadge: {
        backgroundColor: studentColors.warning,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    recentBadgeText: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    completedBadgeWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedIcon: {
        fontSize: 16,
    },
    chapterTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    chapterTitleLocked: {
        color: studentColors.textMuted,
    },
    chapterTitleGu: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    chapterDesc: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    pageBadge: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        borderWidth: 1,
        borderRadius: borderRadius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    pageBadgeText: {
        fontSize: 10,
        color: '#1D4ED8',
        fontWeight: typography.weight.bold,
    },
    lockBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: studentColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: 16,
    },
    progressCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: studentColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        color: studentColors.textOnPrimary,
    },
    loader: {
        marginTop: spacing.huge,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: studentColors.background,
    },
    loaderText: {
        marginTop: spacing.lg,
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
    errorBanner: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: spacing.md,
        marginHorizontal: spacing.xl,
        marginTop: spacing.sm,
        borderRadius: borderRadius.md,
    },
    errorText: {
        color: studentColors.error,
        fontSize: typography.size.sm,
    },
    leaderboardHeader: {
        marginBottom: spacing.xl,
    },
    leaderboardTitle: {
        fontSize: typography.size.heading,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    leaderboardSub: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    rankCardHighlight: {
        borderColor: studentColors.primary,
        backgroundColor: studentColors.primaryLight,
    },
    rankLeft: {
        width: 44,
        alignItems: 'center',
    },
    rankMedal: {
        fontSize: 28,
    },
    rankNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: studentColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankNumberText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.textSecondary,
    },
    rankInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    rankName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    rankNameHighlight: {
        color: studentColors.secondary,
    },
    rankStd: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    rankPoints: {
        alignItems: 'center',
    },
    rankPointsValue: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
    },
    rankPointsLabel: {
        fontSize: typography.size.xs,
        color: studentColors.textMuted,
    },
    profileContent: {
        paddingBottom: spacing.huge,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.xl,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: studentColors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    profileAvatarText: {
        fontSize: 32,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    profileName: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    profilePhone: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginTop: spacing.xs,
    },
    premiumBadge: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginTop: spacing.sm,
    },
    premiumBadgeText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: studentColors.textOnPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    statLabel: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    statDivider: {
        width: 1,
        backgroundColor: studentColors.border,
    },
    profileCard: {
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    profileLabel: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
    },
    profileValue: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    profileDivider: {
        height: 1,
        backgroundColor: studentColors.borderLight,
    },
    signOutButton: {
        backgroundColor: studentColors.error,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    // ─── Standard Switcher ──────────────────────────────────────
    standardSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: '#e0e7ff',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    standardSwitcherLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    standardSwitcherIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    standardSwitcherIcon: {
        fontSize: 22,
    },
    standardSwitcherTextCol: {
        flex: 1,
    },
    standardSwitcherTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    standardSwitcherLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    standardSwitcherGcertTag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    standardSwitcherGcertText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#475569',
    },
    standardSwitcherText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    standardSwitcherSubText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    standardSwitcherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    standardSwitcherChangeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1d4ed8',
    },
    // ─── Bookmark Section ──────────────────────────────────────
    bookmarkSection: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    seeAllText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#2563eb',
    },
    bookmarkEmpty: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        marginHorizontal: spacing.xl,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...shadows.sm,
    },
    bookmarkEmptyIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    bookmarkEmptyText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    bookmarkEmptySub: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    bookmarkScrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 8,
        paddingTop: 2,
    },
    bookmarkCardHorizontal: {
        width: 220,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 12,
        ...shadows.sm,
    },
    bookmarkIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bookmarkIconHorizontal: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    bookmarkSubjectText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '800',
        color: '#1d4ed8',
        textTransform: 'uppercase',
    },
    bookmarkTitleHorizontal: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 10,
        minHeight: 36,
        lineHeight: 18,
    },
    bookmarkFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    bookmarkStdPill: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bookmarkMetaHorizontal: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#64748b',
    },
    bookmarkOpenBadge: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    bookmarkOpenBadgeText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#2563eb',
    },
    bookmarkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    bookmarkIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: studentColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookmarkIconText: {
        fontSize: 20,
    },
    bookmarkInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    bookmarkTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    bookmarkMeta: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    bookmarkOpenBtn: {
        backgroundColor: studentColors.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    bookmarkOpenText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    // ─── Quick Access ──────────────────────────────────────────
    quickAccessRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    quickAccessCard: {
        width: '23%',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        alignItems: 'center',
        marginHorizontal: '1%',
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    quickAccessEmoji: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    quickAccessLabel: {
        fontSize: typography.size.xs,
        color: studentColors.textSecondary,
        fontWeight: typography.weight.semibold,
        textAlign: 'center',
        lineHeight: 14,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xxl,
        right: spacing.xxl,
        backgroundColor: studentColors.secondary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    directReadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: borderRadius.md,
        gap: 4,
    },
    directReadText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
