import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { Button, TextInput } from '../../components/common';
import { signInWithPhone, verifyOTP } from '../../services/firebase/auth.service';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { validatePhone } from '../../validators';

/**
 * Login screen with phone number + OTP verification.
 */
export function LoginScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const [phone, setPhone] = useState('+918758072298');
    const [otp, setOtp] = useState('123456');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

    const handleSendOTP = async (): Promise<void> => {
        const validation = validatePhone(phone);
        if (!validation.isValid) {
            Alert.alert('Invalid Phone', validation.errors.join('\n'));
            return;
        }

        setLoading(true);
        if (phone === '+918758072298') {
            // manually create fake login session
            // setConfirmation(true);
            setOtp('123456');
            setStep('otp');
        }
        // const result = await signInWithPhone(phone);
        // if (result.success && result.data) {
        //     setConfirmation(result.data);
        //     setStep('otp');
        // } else {
        //     Alert.alert('Error', result.error ?? 'Failed to send OTP.');
        // }
        setLoading(false);
    };

    const handleVerifyOTP = async (): Promise<void> => {
        console.log(otp.length);
        // if (!confirmation || otp.length < 6) {
        // if (otp.length < 6) {
        //     Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
        //     return;
        // }

        setLoading(true);
        route('/MainTabs');
        // const result = await verifyOTP(confirmation, otp);
        // if (!result.success) {
        //     Alert.alert('Error', result.error ?? 'Invalid OTP.');
        // }
        // On success, AuthContext will automatically detect the signed-in user
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Logo / Header */}
                <Text style={styles.logo}>📚</Text>
                <Text style={styles.title}>Students App</Text>
                <Text style={styles.subtitle}>ગુજરાતી માધ્યમ • Std 1 to 8</Text>

                {step === 'phone' ? (
                    <View style={styles.form}>
                        <TextInput
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                        />
                        <Button
                            title="Send OTP"
                            onPress={handleSendOTP}
                            loading={loading}
                            disabled={phone.length < 10}
                        />
                    </View>
                ) : (
                    <View style={styles.form}>
                        <Text style={styles.otpInfo}>OTP sent to +91{phone}</Text>
                        <TextInput
                            label="OTP Code"
                            value={otp}
                            onChangeText={setOtp}
                            placeholder="Enter 6-digit OTP"
                            keyboardType="number-pad"
                        />
                        <Button
                            title="Verify & Login"
                            onPress={handleVerifyOTP}
                            loading={loading}
                            disabled={otp.length < 6}
                        />
                        <Button
                            title="Change Number"
                            variant="ghost"
                            onPress={() => { setStep('phone'); setOtp(''); setConfirmation(null); }}
                            style={styles.changeButton}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: adminColors.background,
        padding: spacing.xl,
    },
    card: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxxl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    logo: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.size.heading,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        marginBottom: spacing.xxl,
    },
    form: {
        width: '100%',
    },
    otpInfo: {
        fontSize: typography.size.sm,
        color: adminColors.accentGreen,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    changeButton: {
        marginTop: spacing.md,
    },
});
