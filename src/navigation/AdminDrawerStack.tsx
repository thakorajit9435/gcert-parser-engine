import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, TouchableOpacity } from 'react-native';
import { AdminDrawerParamList, AdminQuizStackParamList } from '../types';
import { adminColors, typography } from '../theme';
import { AdminDrawerContent } from '../components/admin/DrawerContent';

import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ManageSessionsScreen } from '../screens/admin/ManageSessionsScreen';
import { ContentManagementScreen } from '../screens/admin/ContentManagementScreen';
import { ManageChaptersScreen } from '../screens/admin/ManageChaptersScreen';
import { AddEditChapterScreen } from '../screens/admin/AddEditChapterScreen';
import { ManageQuizScreen } from '../screens/admin/ManageQuizScreen';
import { QuizDetailScreen } from '../screens/admin/QuizDetailScreen';
import { AddQuizScreen } from '../screens/admin/AddQuizScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { PremiumManagementScreen } from '../screens/admin/PremiumManagementScreen';
import { LeaderboardManagementScreen } from '../screens/admin/LeaderboardManagementScreen';
import { NotificationsScreen } from '../screens/admin/NotificationsScreen';
import { AppConfigScreen } from '../screens/admin/AppConfigScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';
import { PracticeSettingsScreen } from '../screens/admin/PracticeSettingsScreen';
import { ManageMCQsScreen } from '../screens/admin/ManageMCQsScreen';
import { AddEditMCQScreen } from '../screens/admin/AddEditMCQScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { CreateAdminScreen } from '../screens/auth/CreateAdminScreen';
import { AdminLanguageSectionScreen } from '../screens/admin/AdminLanguageSectionScreen';
import { AdminBlueprintScreen } from '../screens/admin/AdminBlueprintScreen';
import { AdminOldPapersScreen } from '../screens/admin/AdminOldPapersScreen';
import { AdminBookManagementScreen } from '../screens/admin/AdminBookManagementScreen';

const adminScreenOptions = ({ navigation }: any) => ({
    headerStyle: { backgroundColor: adminColors.surface, elevation: 0, shadowOpacity: 0 },
    headerTintColor: adminColors.textPrimary,
    headerTitleStyle: { fontWeight: typography.weight.semibold as '600' },
    cardStyle: { backgroundColor: adminColors.background },
    headerRight: () => (
        <TouchableOpacity
            onPress={() => navigation.navigate('DashboardStack')}
            style={{ marginRight: 16, padding: 4 }}
        >
            <Text style={{ fontSize: 20 }}>🏠</Text>
        </TouchableOpacity>
    ),
});

const DashboardStackNav = createStackNavigator();
function DashboardStack(): React.JSX.Element {
    return (
        <DashboardStackNav.Navigator screenOptions={adminScreenOptions}>
            <DashboardStackNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: '📊 Dashboard' }} />
        </DashboardStackNav.Navigator>
    );
}

const ContentStackNav = createStackNavigator();
function ContentStack(): React.JSX.Element {
    return (
        <ContentStackNav.Navigator screenOptions={adminScreenOptions}>
            <ContentStackNav.Screen name="ContentManagement" component={ContentManagementScreen} options={{ title: '📚 Subjects' }} />
            <ContentStackNav.Screen name="ManageSessions" component={ManageSessionsScreen} options={{ title: '📋 Sessions' }} />
            <ContentStackNav.Screen name="ChapterManagement" component={ManageChaptersScreen} options={{ title: '📖 Chapters' }} />
            <ContentStackNav.Screen name="AddEditChapter" component={AddEditChapterScreen} options={({ route }: any) => ({
                title: route.params?.chapter ? '✏️ Edit Chapter' : '➕ Add Chapter',
            })} />
        </ContentStackNav.Navigator>
    );
}

const QuizStackNav = createStackNavigator<AdminQuizStackParamList>();
function QuizStack(): React.JSX.Element {
    return (
        <QuizStackNav.Navigator screenOptions={adminScreenOptions}>
            <QuizStackNav.Screen
                name="ManageQuiz"
                component={ManageQuizScreen}
                options={{ title: '📝 Manage Quizzes' }}
            />
            <QuizStackNav.Screen
                name="QuizDetail"
                component={QuizDetailScreen}
                options={({ route }: any) => ({
                    title: route.params?.quizTitle ?? 'Quiz Detail',
                })}
            />
            <QuizStackNav.Screen
                name="AddQuiz"
                component={AddQuizScreen}
                options={{ title: '➕ New Quiz' }}
            />
        </QuizStackNav.Navigator>
    );
}

const PracticeStackNav = createStackNavigator();
function PracticeStack(): React.JSX.Element {
    return (
        <PracticeStackNav.Navigator screenOptions={adminScreenOptions}>
            <PracticeStackNav.Screen name="PracticeSettings" component={PracticeSettingsScreen} options={{ title: '⚙️ MCQ Settings' }} />
            <PracticeStackNav.Screen name="ManageMCQs" component={ManageMCQsScreen} options={{ title: '📝 Manage MCQs' }} />
            <PracticeStackNav.Screen name="AddEditMCQ" component={AddEditMCQScreen} options={{ title: 'Manage MCQ' }} />
        </PracticeStackNav.Navigator>
    );
}

const LanguageStackNav = createStackNavigator();
function LanguageSectionStack(): React.JSX.Element {
    return (
        <LanguageStackNav.Navigator screenOptions={adminScreenOptions}>
            <LanguageStackNav.Screen name="AdminLanguageSection" component={AdminLanguageSectionScreen} options={{ title: '📖 Language Section' }} />
        </LanguageStackNav.Navigator>
    );
}

const BlueprintStackNav = createStackNavigator();
function BlueprintStack(): React.JSX.Element {
    return (
        <BlueprintStackNav.Navigator screenOptions={adminScreenOptions}>
            <BlueprintStackNav.Screen name="AdminBlueprint" component={AdminBlueprintScreen} options={{ title: '📋 Blueprints' }} />
        </BlueprintStackNav.Navigator>
    );
}

const OldPapersStackNav = createStackNavigator();
function OldPapersStack(): React.JSX.Element {
    return (
        <OldPapersStackNav.Navigator screenOptions={adminScreenOptions}>
            <OldPapersStackNav.Screen name="AdminOldPapers" component={AdminOldPapersScreen} options={{ title: '📄 Old Papers' }} />
        </OldPapersStackNav.Navigator>
    );
}

const BookManagementStackNav = createStackNavigator();
function BookManagementStack(): React.JSX.Element {
    return (
        <BookManagementStackNav.Navigator screenOptions={adminScreenOptions}>
            <BookManagementStackNav.Screen name="AdminBookManagement" component={AdminBookManagementScreen} options={{ title: '📚 Book Management' }} />
        </BookManagementStackNav.Navigator>
    );
}

const UsersStackNav = createStackNavigator();
function UsersStack(): React.JSX.Element {
    return (
        <UsersStackNav.Navigator screenOptions={adminScreenOptions}>
            <UsersStackNav.Screen name="UserManagement" component={UserManagementScreen} options={{ title: '👥 Users' }} />
        </UsersStackNav.Navigator>
    );
}

const PremiumStackNav = createStackNavigator();
function PremiumStack(): React.JSX.Element {
    return (
        <PremiumStackNav.Navigator screenOptions={adminScreenOptions}>
            <PremiumStackNav.Screen name="PremiumManagement" component={PremiumManagementScreen} options={{ title: '💎 Premium' }} />
        </PremiumStackNav.Navigator>
    );
}

const LeaderboardStackNav = createStackNavigator();
function LeaderboardStack(): React.JSX.Element {
    return (
        <LeaderboardStackNav.Navigator screenOptions={adminScreenOptions}>
            <LeaderboardStackNav.Screen name="LeaderboardManagement" component={LeaderboardManagementScreen} options={{ title: '🏆 Leaderboard' }} />
        </LeaderboardStackNav.Navigator>
    );
}

const NotificationsStackNav = createStackNavigator();
function NotificationsStack(): React.JSX.Element {
    return (
        <NotificationsStackNav.Navigator screenOptions={adminScreenOptions}>
            <NotificationsStackNav.Screen name="Notifications" component={NotificationsScreen} options={{ title: '🔔 Notifications' }} />
        </NotificationsStackNav.Navigator>
    );
}

const ConfigStackNav = createStackNavigator();
function ConfigStack(): React.JSX.Element {
    return (
        <ConfigStackNav.Navigator screenOptions={adminScreenOptions}>
            <ConfigStackNav.Screen name="AppConfig" component={AppConfigScreen} options={{ title: '⚙️ Config' }} />
        </ConfigStackNav.Navigator>
    );
}

const AuditStackNav = createStackNavigator();
function AuditStack(): React.JSX.Element {
    return (
        <AuditStackNav.Navigator screenOptions={adminScreenOptions}>
            <AuditStackNav.Screen name="AuditLogs" component={AuditLogsScreen} options={{ title: '📋 Audit Logs' }} />
        </AuditStackNav.Navigator>
    );
}

/** Profile stack — shared across content_admin and super_admin */
const ProfileStackNav = createStackNavigator();
function ProfileStack(): React.JSX.Element {
    return (
        <ProfileStackNav.Navigator screenOptions={adminScreenOptions}>
            <ProfileStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: '👤 Profile' }} />
            {/* CreateAdmin accessible from super_admin profile screen */}
            <ProfileStackNav.Screen name="CreateAdmin" component={CreateAdminScreen} options={{ title: '➕ Create Admin', headerShown: true }} />
        </ProfileStackNav.Navigator>
    );
}

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

export function AdminDrawerStack(): React.JSX.Element {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <AdminDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: adminColors.surface,
                    width: 280,
                },
                drawerType: 'front',
                overlayColor: adminColors.overlay,
            }}
        >
            <Drawer.Screen name="DashboardStack" component={DashboardStack} />
            <Drawer.Screen name="ContentStack" component={ContentStack} />
            <Drawer.Screen name="QuizStack" component={QuizStack} />
            <Drawer.Screen name="PracticeStack" component={PracticeStack} />
            <Drawer.Screen name="LanguageSectionStack" component={LanguageSectionStack} />
            <Drawer.Screen name="BlueprintStack" component={BlueprintStack} />
            <Drawer.Screen name="OldPapersStack" component={OldPapersStack} />
            <Drawer.Screen name="BookManagementStack" component={BookManagementStack} />
            <Drawer.Screen name="UsersStack" component={UsersStack} />
            <Drawer.Screen name="PremiumStack" component={PremiumStack} />
            <Drawer.Screen name="LeaderboardStack" component={LeaderboardStack} />
            <Drawer.Screen name="NotificationsStack" component={NotificationsStack} />
            <Drawer.Screen name="ConfigStack" component={ConfigStack} />
            <Drawer.Screen name="AuditStack" component={AuditStack} />
            <Drawer.Screen name="ProfileStack" component={ProfileStack} />
        </Drawer.Navigator>
    );
}
