import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
}: StandardSelectionModalProps): React.JSX.Element {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const standards = React.useMemo(() => {
        return Array.from(
            { length: MAX_STANDARD - MIN_STANDARD + 1 },
            (_, i) => MIN_STANDARD + i,
        );
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                damping: 15,
                stiffness: 250,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0.9);
        }
    }, [visible, scaleAnim]);

    if (!visible) return <></>;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                {/* Fullscreen Backdrop Touchable (tap outside dialog to close) */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Centered Modal Card (onStartShouldSetResponder isolates touch events inside card) */}
                <Animated.View
                    style={[
                        styles.dialogContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.iconBox}>
                                <Text style={styles.iconEmoji}>🎓</Text>
                            </View>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.title}>ધોરણ પસંદ કરો</Text>
                                <Text style={styles.subtitle}>GCERT પાઠ્યક્રમ (ધોરણ ૧ થી ૮)</Text>
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
                            ધોરણ બદલવાથી તમામ વિષયો આપોઆપ અપડેટ થશે.
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
    },
    dialogContainer: {
        width: Math.min(SCREEN_WIDTH - 36, 360),
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
        alignSelf: 'center',
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
        gap: 10,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
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
        gap: 10,
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
        gap: 8,
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
        marginTop: 14,
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
