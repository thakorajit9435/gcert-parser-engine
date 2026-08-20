import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { shadows } from '../../theme';
import { MIN_STANDARD, MAX_STANDARD } from '../../constants';

interface StandardSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    selectedStandard: string;
    onSelectStandard: (standard: string) => void;
}

export function StandardSelectionModal({
    visible,
    onClose,
    selectedStandard,
    onSelectStandard,
}: StandardSelectionModalProps): React.JSX.Element {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const standards = React.useMemo(() => {
        return Array.from(
            { length: MAX_STANDARD - MIN_STANDARD + 1 },
            (_, i) => MIN_STANDARD + i,
        );
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    damping: 14,
                    stiffness: 240,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 120,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.85,
                    duration: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    if (!visible) return <></>;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                {/* Backdrop touchable (tap outside to close) */}
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Centered Normal Modal Dialog Card */}
                <Animated.View
                    style={[
                        styles.dialogCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleWrap}>
                            <View style={styles.headerIconBox}>
                                <Text style={styles.headerEmoji}>🎓</Text>
                            </View>
                            <View>
                                <Text style={styles.title}>ધોરણ પસંદ કરો</Text>
                                <Text style={styles.subtitle}>તમારો વર્ગ / ધોરણ પસંદ કરો</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Standard List */}
                    <ScrollView
                        style={styles.scrollList}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <View style={styles.grid}>
                            {standards.map(num => {
                                const isActive = String(num) === String(selectedStandard);
                                return (
                                    <TouchableOpacity
                                        key={num}
                                        style={[styles.itemCard, isActive && styles.itemCardActive]}
                                        onPress={() => {
                                            onSelectStandard(String(num));
                                            onClose();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.stdCircle, isActive && styles.stdCircleActive]}>
                                            <Text style={[styles.stdCircleText, isActive && styles.stdCircleTextActive]}>
                                                {num}
                                            </Text>
                                        </View>
                                        <View style={styles.itemTextWrap}>
                                            <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]}>
                                                ધોરણ {num} (Standard {num})
                                            </Text>
                                        </View>
                                        {isActive ? (
                                            <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                                        ) : (
                                            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    dialogCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        width: '100%',
        maxWidth: 360,
        maxHeight: '80%',
        ...shadows.lg,
        elevation: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 12,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 18,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollList: {
        maxHeight: 340,
    },
    scrollContent: {
        paddingVertical: 4,
    },
    grid: {
        gap: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1.2,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    itemCardActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    stdCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stdCircleActive: {
        backgroundColor: '#2563eb',
    },
    stdCircleText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
    stdCircleTextActive: {
        color: '#FFFFFF',
    },
    itemTextWrap: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    itemTitleActive: {
        color: '#1d4ed8',
        fontWeight: '800',
    },
});
