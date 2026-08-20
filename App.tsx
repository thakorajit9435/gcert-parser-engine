import React, { useEffect } from 'react';
import './src/locales/i18n';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { NetworkProvider } from './src/components/common/NetworkProvider';
import { adminColors } from './src/theme';
import { seedDemoQuizIfNeeded } from './src/services/firebase/quiz.service';
import { warmUpBackend } from './src/services/warmup.service';
import crashlytics from '@react-native-firebase/crashlytics';

// Set up global JS error handler to report to Crashlytics
const defaultErrorHandler = (global as any).ErrorUtils?.getGlobalHandler();
if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: any) => {
        crashlytics().recordError(error);
        if (defaultErrorHandler) {
            defaultErrorHandler(error, isFatal);
        }
    });
}

// ── FCM Background/Quit Handler (must be registered BEFORE app mounts) ──────
// This runs when the app is in the background or fully closed.
// It receives the message but does NOT show UI (the OS shows the system notification).
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // The OS handles showing the notification automatically.
    // You can do silent data processing here if needed.
    console.log('[FCM Background]', remoteMessage.notification?.title);
});

// ── App Component ─────────────────────────────────────────────────────────────

function App(): React.JSX.Element {
    console.log("App component rendered");
    useEffect(() => {
        crashlytics().log('App mounted');
        seedDemoQuizIfNeeded();
        warmUpBackend();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ErrorBoundary>
                    <AuthProvider>
                        <StatusBar
                            barStyle="light-content"
                            backgroundColor={adminColors.background}
                            translucent={false}
                        />
                        <NavigationContainer
                            theme={{
                                dark: true,
                                colors: {
                                    primary: adminColors.primary,
                                    background: adminColors.background,
                                    card: adminColors.surface,
                                    text: adminColors.textPrimary,
                                    border: adminColors.border,
                                    notification: adminColors.accentRed,
                                },
                                fonts: {
                                    regular: { fontFamily: 'System', fontWeight: '400' },
                                    medium: { fontFamily: 'System', fontWeight: '500' },
                                    bold: { fontFamily: 'System', fontWeight: '700' },
                                    heavy: { fontFamily: 'System', fontWeight: '900' },
                                },
                            }}
                        >
                            <NetworkProvider>
                                {/* FCMInitializer lives inside NavigationContainer so
                                    useFCMSetup can access the navigation context */}
                                <FCMInitializer />
                                <RootNavigator />
                            </NetworkProvider>
                        </NavigationContainer>
                    </AuthProvider>
                </ErrorBoundary>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

// ── FCMInitializer ─────────────────────────────────────────────────────────────
// Separate component so useFCMSetup has access to both AuthContext + NavigationContext.
import { useFCMSetup } from './src/hooks/useFCMSetup';

function FCMInitializer(): null {
    useFCMSetup();
    return null;
}

export default App;
