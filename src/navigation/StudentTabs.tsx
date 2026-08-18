import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { studentColors, typography } from '../theme';
import { useAuthContext } from '../context/AuthContext';
import { subscribeToUserNotifications, subscribeToReadStatus } from '../services/firebase/notifications.service';
import { StudentNotificationsScreen } from '../screens/student/StudentNotificationsScreen';
import { NotificationDetailScreen } from '../screens/student/NotificationDetailScreen';
import { AppNotification } from '../types';
import {
    StudentHomeScreen,
    StudentSubjectsScreen,
    StudentLeaderboardScreen,
} from '../screens/student';
import { QuizScreen } from '../screens/student/QuizScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { PremiumAccessScreen } from '../screens/student/PremiumAccessScreen';
import { SessionScreen } from '../screens/student/SessionScreen';
import { ChapterDetailScreen } from '../screens/student/ChapterDetailScreen';
import { QuizListScreen } from '../screens/student/QuizListScreen';
import { SubjectMCQScreen } from '../screens/student/SubjectMCQScreen';
import { ChapterSelectionScreen } from '../screens/student/ChapterSelectionScreen';
import { PracticeQuizScreen } from '../screens/student/PracticeQuizScreen';
import { LanguageSectionScreen } from '../screens/student/LanguageSectionScreen';
import { LanguageDetailScreen } from '../screens/student/LanguageDetailScreen';
import { BlueprintListScreen } from '../screens/student/BlueprintListScreen';
import { BlueprintDetailScreen } from '../screens/student/BlueprintDetailScreen';
import { OldPapersListScreen } from '../screens/student/OldPapersListScreen';
import { OldPaperDetailScreen } from '../screens/student/OldPaperDetailScreen';
import { BookmarkListScreen } from '../screens/student/BookmarkListScreen';
import { StudentTopicDetailScreen } from '../screens/student/StudentTopicDetailScreen';
import { StudentResourceListScreen } from '../screens/student/StudentResourceListScreen';
import { StudentFlashcardsScreen } from '../screens/student/StudentFlashcardsScreen';
import { AITutorScreen } from '../screens/student/AITutorScreen';
import { PdfViewerScreen } from '../screens/shared';
import { PrivacyPolicyScreen, TermsConditionsScreen, PrivacyInfoScreen } from '../screens/common';

type StudentRootParamList = {
    MainTabs: undefined;
    AITutor: { sessionId?: string; subject?: string } | undefined;
    SessionScreen: { standardId: string };
    ChapterDetail: { chapterId: string };
    QuizList: { chapterId?: string; subjectId?: string; isMixed?: boolean; chapterTitle?: string };
    SubjectAndChapterList: { subjectId?: string; subjectName?: string; standardId?: string; session?: string; sessionType?: string; sessionTitle?: string };
    SubjectMCQScreen: { subjectId: string; subjectName: string; standardId: string; session: string; sessionTitle?: string };
    ChapterSelectionScreen: { subjectId: string; subjectName: string; standardId: string; session: string };
    PracticeQuizScreen: { standardId: string; session: string; subjectId: string; subjectName: string; chapterId?: string; mode: 'mix' | 'chapter'; count: number };
    Quiz: { quizId: string };
    LanguageSection: { standardId: string; session: string };
    LanguageDetail: { item: any };
    BlueprintList: { standardId: string; session: string };
    BlueprintDetail: { blueprint: any };
    OldPapersList: { standardId: string; session: string };
    OldPaperDetail: { paper: any };
    PdfViewer: { url: string; title?: string };
    BookmarkList: undefined;
    PremiumAccess: undefined;
    NotificationsInbox: undefined;
    NotificationDetail: { notification: AppNotification };
    PrivacyPolicy: undefined;
    TermsConditions: undefined;
    PrivacyInfo: undefined;
    StudentTopicDetail: { topicId: string; topicTitle: string };
    StudentResourceList: { resourceType: string; chapterId: string; chapterTitle: string };
    StudentFlashcards: { chapterId: string; chapterTitle: string };
};

type StudentTabParamList = {
    Home: undefined;
    Subjects: { subjectId?: string; subjectName?: string } | undefined;
    Leaderboard: undefined;
    Profile: undefined;
};

const Stack = createStackNavigator<StudentRootParamList>();
const Tab = createBottomTabNavigator<StudentTabParamList>();

function TabIcon({ name, focused, color, size }: { name: string, focused: boolean, color: string, size: number }) {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(focused ? 1.2 : 1) }],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
}

// ── Bell Icon with Unread Badge ─────────────────────────────────
function NotificationBell({ navigation }: { navigation: any }): React.JSX.Element {
    const { user, userData } = useAuthContext();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.uid) return;
        const uid = user.uid;
        const standard = userData?.standard ?? null;

        let active = true;
        let unsubReads: (() => void) | null = null;
        let latestNotifs: string[] = [];
        let latestReads: Set<string> = new Set();

        const updateUnreadCount = (notifs: string[], reads: Set<string>) => {
            if (!active) return;
            setUnreadCount(notifs.filter(id => !reads.has(id)).length);
        };

        const unsubNotifs = subscribeToUserNotifications(uid, standard, (notifs) => {
            latestNotifs = notifs.map(n => n.id);
            updateUnreadCount(latestNotifs, latestReads);
        });

        unsubReads = subscribeToReadStatus(uid, (reads) => {
            latestReads = reads;
            updateUnreadCount(latestNotifs, latestReads);
        });

        return () => {
            active = false;
            unsubNotifs();
            if (unsubReads) unsubReads();
        };
    }, [user?.uid, userData?.standard]);

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('NotificationsInbox')}
            style={tabStyles.bellButton}
            accessibilityLabel="Notifications"
        >
            <Ionicons name="notifications-outline" size={24} color={studentColors.textPrimary} />
            {unreadCount > 0 && (
                <View style={tabStyles.bellBadge}>
                    <Text style={tabStyles.bellBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

function StudentTabNavigator(): React.JSX.Element {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: studentColors.surface },
                headerTintColor: studentColors.textPrimary,
                headerTitleStyle: { fontWeight: typography.weight.semibold },
                tabBarStyle: {
                    backgroundColor: studentColors.surface,
                    borderTopColor: studentColors.border,
                    paddingBottom: 4,
                    height: 56,
                },
                tabBarActiveTintColor: studentColors.secondary,
                tabBarInactiveTintColor: studentColors.textMuted,
                tabBarLabelStyle: {
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={StudentHomeScreen}
                options={({ navigation }) => ({
                    tabBarLabel: t('common.home'),
                    tabBarIcon: ({ color, size, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} focused={focused} />,
                    title: `🏠 ${t('common.home')}`,
                    headerRight: () => <NotificationBell navigation={navigation} />,
                })}
            />
            <Tab.Screen
                name="Subjects"
                component={StudentSubjectsScreen}
                options={{
                    tabBarLabel: t('common.subjects'),
                    tabBarIcon: ({ color, size, focused }) => <TabIcon name={focused ? 'book' : 'book-outline'} color={color} size={size} focused={focused} />,
                    title: `📚 ${t('common.subjects')}`
                }}
            />
            <Tab.Screen
                name="Leaderboard"
                component={StudentLeaderboardScreen}
                options={{
                    tabBarLabel: t('common.leaderboard'),
                    tabBarIcon: ({ color, size, focused }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} color={color} size={size} focused={focused} />,
                    title: `🏆 ${t('common.leaderboard')}`
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: t('common.profile'),
                    tabBarIcon: ({ color, size, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} color={color} size={size} focused={focused} />,
                    title: `👤 ${t('common.profile')}`
                }}
            />

        </Tab.Navigator>
    );
}

export function StudentTabs(): React.JSX.Element {
    return (
        <Stack.Navigator screenOptions={({ navigation }: any) => ({
            headerShown: false,
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('MainTabs')}
                    style={{ marginRight: 16, padding: 4 }}
                >
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            ),
        })}>
            <Stack.Screen name="MainTabs" component={StudentTabNavigator} />
            <Stack.Screen
                name="SessionScreen"
                component={SessionScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: '📚 Select Session',
                }}
            />
            <Stack.Screen
                name="ChapterDetail"
                component={ChapterDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="SubjectAndChapterList"
                component={StudentSubjectsScreen}
                options={({ route }: any) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: route.params?.subjectId ? (route.params?.subjectName || '📖 Chapters') : '📚 Subjects',
                })}
            />
            <Stack.Screen
                name="QuizList"
                component={QuizListScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Quizzes',
                }}
            />
            <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: '📝 Quiz',
                }}
            />
            <Stack.Screen
                name="SubjectMCQScreen"
                component={SubjectMCQScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ChapterSelectionScreen"
                component={ChapterSelectionScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="PracticeQuizScreen"
                component={PracticeQuizScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="LanguageSection"
                component={LanguageSectionScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                }}
            />
            <Stack.Screen
                name="LanguageDetail"
                component={LanguageDetailScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Detail',
                }}
            />
            <Stack.Screen
                name="BlueprintList"
                component={BlueprintListScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: '📋 Blueprint',
                }}
            />
            <Stack.Screen
                name="BlueprintDetail"
                component={BlueprintDetailScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Blueprint Detail',
                }}
            />
            <Stack.Screen
                name="OldPapersList"
                component={OldPapersListScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'જુના પેપર્સ',
                }}
            />
            <Stack.Screen
                name="OldPaperDetail"
                component={OldPaperDetailScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Paper Detail',
                }}
            />
            <Stack.Screen
                name="PdfViewer"
                component={PdfViewerScreen}
                options={({ route }: any) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: route.params?.title || 'PDF Viewer',
                })}
            />
            <Stack.Screen
                name="BookmarkList"
                component={BookmarkListScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                }}
            />
            <Stack.Screen
                name="PremiumAccess"
                component={PremiumAccessScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="NotificationsInbox"
                component={StudentNotificationsScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="NotificationDetail"
                component={NotificationDetailScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Notification',
                }}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Privacy Policy',
                }}
            />
            <Stack.Screen
                name="TermsConditions"
                component={TermsConditionsScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Terms & Conditions',
                }}
            />
            <Stack.Screen
                name="PrivacyInfo"
                component={PrivacyInfoScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: 'Privacy & Data',
                }}
            />
            <Stack.Screen
                name="StudentTopicDetail"
                component={StudentTopicDetailScreen}
                options={({ route }: any) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: route.params?.topicTitle || 'વિષય વિગત (Topic Detail)',
                })}
            />
            <Stack.Screen
                name="StudentResourceList"
                component={StudentResourceListScreen}
                options={({ route }: any) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: route.params?.resourceType === 'textbooks' ? 'પાઠ્યપુસ્તકો (Textbooks)' :
                           route.params?.resourceType === 'videos' ? 'વીડિયો લેક્ચર્સ (Videos)' :
                           route.params?.resourceType === 'worksheets' ? 'કાર્યપત્રકો (Worksheets)' :
                           route.params?.resourceType === 'lesson_plans' ? 'અભ્યાસ યોજના (Lesson Plans)' :
                           'શબ્દકોશ (Glossary)',
                })}
            />
            <Stack.Screen
                name="StudentFlashcards"
                component={StudentFlashcardsScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: studentColors.surface },
                    headerTintColor: studentColors.textPrimary,
                    headerTitleStyle: { fontWeight: typography.weight.semibold },
                    title: '⚡ ફ્લેશકાર્ડ્સ (Flashcards)',
                }}
            />
            <Stack.Screen
                name="AITutor"
                component={AITutorScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
}

// ─── Bell Styles ─────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
    bellButton: {
        marginRight: 16,
        padding: 4,
        position: 'relative',
    },
    bellBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    bellBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
});
