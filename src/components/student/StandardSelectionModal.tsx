import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { shadows } from '../../theme';
import { MIN_STANDARD, MAX_STANDARD } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StandardSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    selectedStandard: string;
    onSelectStandard: (standard: string) => void;
}

const GUJARATI_NUMERALS: { [key: number]: string } = {
    1: '૧',
    2: '૨',
    3: '૩',
    4: '૪',
    5: '૫',
    6: '૬',
    7: '૭',
    8: '૮',
};

export function StandardSelectionModal({
    visible,
    onClose,
    selectedStandard,
    onSelectStandard,
}: StandardSelectionModalProps): React.JSX.Element | null {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
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
                    duration: 160,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible, fadeAnim, scaleAnim]);

    if (!visible) return null;

    return (
        <View style={styles.overlay} pointerEvents="auto">
            {/* Backdrop Layer */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <Animated.View style={[styles.backdropBg, { opacity: fadeAnim }]} />
            </TouchableOpacity>

            {/* Centered Modal Dialog Card */}
            <Animated.View
                style={[
                    styles.dialogContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <View style={styles.iconBox}>
                            <Text style={styles.iconEmoji}>🎓</Text>
                        </View>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.title}>ધોરણ પસંદ કરો</Text>
                            <Text style={styles.subtitle}>GCERT અભ્યાસક્રમ (ધોરણ ૧ થી ૮)</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Standard Grid (2 Columns, 4 Rows) */}
                <View style={styles.gridContainer}>
                    {standards.map(num => {
                        const isActive = String(num) === String(selectedStandard);
                        const gujNum = GUJARATI_NUMERALS[num] || String(num);

                        return (
                            <TouchableOpacity
                                key={num}
                                style={[styles.gridCard, isActive && styles.gridCardActive]}
                                onPress={() => {
                                    onSelectStandard(String(num));
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.numBadge, isActive && styles.numBadgeActive]}>
                                    <Text style={[styles.numText, isActive && styles.numTextActive]}>
                                        {num}
                                    </Text>
                                </View>
                                <View style={styles.gridCardTextWrap}>
                                    <Text style={[styles.gridCardTitle, isActive && styles.gridCardTitleActive]}>
                                        ધોરણ {gujNum}
                                    </Text>
                                    <Text style={[styles.gridCardSub, isActive && styles.gridCardSubActive]}>
                                        Class {num}
                                    </Text>
                                </View>
                                {isActive ? (
                                    <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <Ionicons name="information-circle-outline" size={15} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.footerText}>
                        ધોરણ બદલવાથી તમામ વિષયો આપોઆપ બદલાઈ જશે.
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 99999,
        elevation: 99999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropBg: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    dialogContainer: {
        width: Math.min(SCREEN_WIDTH - 40, 360),
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 18,
        alignSelf: 'center',
        ...shadows.lg,
        elevation: 20,
        zIndex: 100000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    iconEmoji: {
        fontSize: 18,
    },
    headerTextWrap: {
        justifyContent: 'center',
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    gridCardActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
    },
    numBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    numBadgeActive: {
        backgroundColor: '#2563eb',
    },
    numText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
    },
    numTextActive: {
        color: '#FFFFFF',
    },
    gridCardTextWrap: {
        flex: 1,
    },
    gridCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    gridCardTitleActive: {
        color: '#1d4ed8',
        fontWeight: '800',
    },
    gridCardSub: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 1,
    },
    gridCardSubActive: {
        color: '#3b82f6',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
});
