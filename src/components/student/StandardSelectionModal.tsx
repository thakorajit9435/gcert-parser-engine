import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    ScrollView,
    Platform,
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

const STANDARD_GUJARATI_MAP: { [key: number]: string } = {
    1: 'ધોરણ ૧ (પ્રાથમિક)',
    2: 'ધોરણ ૨ (પ્રાથમિક)',
    3: 'ધોરણ ૩ (પ્રાથમિક)',
    4: 'ધોરણ ૪ (પ્રાથમિક)',
    5: 'ધોરણ ૫ (પ્રાથમિક)',
    6: 'ધોરણ ૬ (ઉચ્ચ પ્રાથમિક)',
    7: 'ધોરણ ૭ (ઉચ્ચ પ્રાથમિક)',
    8: 'ધોરણ ૮ (ઉચ્ચ પ્રાથમિક)',
};

export function StandardSelectionModal({
    visible,
    onClose,
    selectedStandard,
    onSelectStandard,
}: StandardSelectionModalProps): React.JSX.Element {
    const slideAnim = useRef(new Animated.Value(300)).current;
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
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 15,
                    stiffness: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim]);

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
                {/* Backdrop touchable */}
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Bottom Sheet Modal */}
                <Animated.View
                    style={[
                        styles.sheetCard,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Pull Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleWrap}>
                            <View style={styles.headerIconBox}>
                                <Text style={styles.headerEmoji}>🎓</Text>
                            </View>
                            <View>
                                <Text style={styles.title}>ધોરણ પસંદ કરો</Text>
                                <Text style={styles.subtitle}>Select Your Standard (Class 1-8)</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                                const labelGu = STANDARD_GUJARATI_MAP[num] || `ધોરણ ${num}`;
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
                                                {labelGu}
                                            </Text>
                                            <Text style={[styles.itemSub, isActive && styles.itemSubActive]}>
                                                Standard {num} GCERT
                                            </Text>
                                        </View>
                                        {isActive ? (
                                            <View style={styles.activeCheckBadge}>
                                                <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                                            </View>
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
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    sheetCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '80%',
        width: '100%',
        ...shadows.lg,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#cbd5e1',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 12,
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
        maxHeight: 380,
    },
    scrollContent: {
        paddingBottom: 12,
    },
    grid: {
        gap: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    itemCardActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
    },
    stdCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stdCircleActive: {
        backgroundColor: '#2563eb',
    },
    stdCircleText: {
        fontSize: 15,
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
        fontWeight: '700',
        color: '#1e293b',
    },
    itemTitleActive: {
        color: '#1d4ed8',
        fontWeight: '800',
    },
    itemSub: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    itemSubActive: {
        color: '#3b82f6',
    },
    activeCheckBadge: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
