import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

interface TextInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address' | 'url';
    secureTextEntry?: boolean;
    editable?: boolean;
    style?: ViewStyle;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
}

/**
 * Styled text input with label and error display.
 */
export function TextInput({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    secureTextEntry = false,
    editable = true,
    style,
    autoCapitalize,
    autoCorrect,
}: TextInputProps): React.JSX.Element {
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <RNTextInput
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    error ? styles.inputError : null,
                    !editable && styles.inputDisabled,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={adminColors.textMuted}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                editable={editable}
                selectionColor={adminColors.primary}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        minHeight: 44,
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: adminColors.error,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: adminColors.surface,
    },
    error: {
        fontSize: typography.size.xs,
        color: adminColors.error,
        marginTop: spacing.xs,
    },
});
