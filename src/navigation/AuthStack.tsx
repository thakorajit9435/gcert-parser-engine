import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { CreateAdminScreen } from '../screens/auth/CreateAdminScreen';
import { SelectStandardScreen } from '../screens/auth/SelectStandardScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Auth navigation stack (unauthenticated users).
 *
 * Screens:
 * - Login           — default entry
 * - Signup          — student self-registration
 * - CreateAdmin     — super_admin invoked from ProfileScreen
 * - SelectStandard  — Google-login students with null standard
 * - VerifyEmail     — email/password users awaiting verification
 */
export function AuthStack(): React.JSX.Element {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                ...TransitionPresets.SlideFromRightIOS,
                gestureEnabled: true,
                cardOverlayEnabled: true,
                cardShadowEnabled: true,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="CreateAdmin" component={CreateAdminScreen} />
            <Stack.Screen name="SelectStandard" component={SelectStandardScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </Stack.Navigator>
    );
}
