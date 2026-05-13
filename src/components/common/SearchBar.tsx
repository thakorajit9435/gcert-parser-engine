import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
}

/**
 * Search bar with clear button for admin lists.
 */
export function SearchBar({
    value,
    onChangeText,
    placeholder = 'Search…',
    onClear,
}: SearchBarProps): React.JSX.Element {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>🔍</Text>
            <RNTextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={adminColors.textMuted}
                selectionColor={adminColors.primary}
                returnKeyType="search"
            />
            {value.length > 0 && onClear ? (
                <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                    <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: adminColors.border,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        minHeight: 44,
    },
    icon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        paddingVertical: spacing.md,
    },
    clearButton: {
        padding: spacing.sm,
    },
    clearText: {
        fontSize: 14,
        color: adminColors.textMuted,
    },
});
