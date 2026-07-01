import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Switch,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DocumentPicker from 'react-native-document-picker';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { COLLECTIONS } from '../../constants';
import { Chapter } from '../../types';
import { uploadPdf } from '../../services/firebase/storage.service';

export function AddEditChapterScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const subjectId: string = route?.params?.subjectId ?? '';
    const subjectName: string = route?.params?.subjectName ?? 'Subject';
    const existingChapter: Chapter | undefined = route?.params?.chapter;
    const isEditing = !!existingChapter;

    const [formTitle, setFormTitle] = useState(existingChapter?.title ?? '');
    const [formTitleGu, setFormTitleGu] = useState(existingChapter?.titleGu ?? '');
    const [formDesc, setFormDesc] = useState(existingChapter?.description ?? '');
    const [formOrder, setFormOrder] = useState(String(existingChapter?.order ?? '1'));
    const [formIsPremium, setFormIsPremium] = useState(existingChapter?.isPremium ?? false);
    const [formVideoUrl, setFormVideoUrl] = useState(existingChapter?.videoUrl ?? '');
    const [formPdfUrl, setFormPdfUrl] = useState(existingChapter?.pdfUrl ?? '');
    const [formSwadhyayPdfUrl, setFormSwadhyayPdfUrl] = useState(existingChapter?.swadhyayPdfUrl ?? '');
    const [formHasSwadhyay, setFormHasSwadhyay] = useState(existingChapter?.hasSwadhyay !== false);
    const [formHasMcq, setFormHasMcq] = useState(existingChapter?.hasMcq !== false);
    const [formHasMixedQuiz, setFormHasMixedQuiz] = useState(existingChapter?.hasMixedQuiz !== false);

    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingSwadhyayPdf, setUploadingSwadhyayPdf] = useState(false);
    const [saving, setSaving] = useState(false);

    const standardId = existingChapter?.standardId ?? '1';

    const handlePickChapterPdf = useCallback(async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf],
                copyTo: 'cachesDirectory',
            });

            if (res && res.uri) {
                setUploadingPdf(true);
                const fileUri = res.fileCopyUri || res.uri;
                const storagePath = `chapters/${standardId}/${subjectId}`;

                const result = await uploadPdf(fileUri, storagePath);
                if (result.success && result.data) {
                    setFormPdfUrl(result.data);
                    Alert.alert('Success', 'Chapter PDF uploaded successfully!');
                } else {
                    Alert.alert('Upload Failed', result.error || 'Failed to upload PDF');
                }
                setUploadingPdf(false);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled
            } else {
                Alert.alert('Error', 'Failed to pick document: ' + (err as Error).message);
            }
            setUploadingPdf(false);
        }
    }, [standardId, subjectId]);

    const handlePickSwadhyayPdf = useCallback(async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf],
                copyTo: 'cachesDirectory',
            });

            if (res && res.uri) {
                setUploadingSwadhyayPdf(true);
                const fileUri = res.fileCopyUri || res.uri;
                const storagePath = 'swadhyay';

                const result = await uploadPdf(fileUri, storagePath);
                if (result.success && result.data) {
                    setFormSwadhyayPdfUrl(result.data);
                    Alert.alert('Success', 'Swadhyay PDF uploaded successfully!');
                } else {
                    Alert.alert('Upload Failed', result.error || 'Failed to upload Swadhyay PDF');
                }
                setUploadingSwadhyayPdf(false);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled
            } else {
                Alert.alert('Error', 'Failed to pick document: ' + (err as Error).message);
            }
            setUploadingSwadhyayPdf(false);
        }
    }, [standardId, subjectId]);

    const handleSave = useCallback(async () => {
        if (!formTitle.trim() || !formTitleGu.trim()) {
            Alert.alert('Validation', 'Title and Gujarati title are required.');
            return;
        }

        setSaving(true);
        try {
            const chapterData: Record<string, any> = {
                title: formTitle.trim(),
                titleGu: formTitleGu.trim(),
                description: formDesc.trim(),
                order: parseInt(formOrder, 10) || 1,
                isPremium: formIsPremium,
                videoUrl: formVideoUrl.trim() || null,
                pdfUrl: formPdfUrl.trim() || null,
                swadhyayPdfUrl: formSwadhyayPdfUrl.trim() || null,
                hasSwadhyay: formHasSwadhyay,
                hasMcq: formHasMcq,
                hasMixedQuiz: formHasMixedQuiz,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (isEditing && existingChapter) {
                await firestore()
                    .collection(COLLECTIONS.CHAPTERS)
                    .doc(existingChapter.id)
                    .update(chapterData);
                Alert.alert('Success', 'Chapter updated!', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                chapterData.subjectId = subjectId;
                chapterData.standardId = standardId;
                chapterData.isDeleted = false;
                chapterData.createdAt = firestore.FieldValue.serverTimestamp();
                await firestore()
                    .collection(COLLECTIONS.CHAPTERS)
                    .add(chapterData);
                Alert.alert('Success', 'Chapter created!', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setSaving(false);
        }
    }, [isEditing, existingChapter, formTitle, formTitleGu, formDesc, formOrder, formIsPremium, formVideoUrl, formPdfUrl, formSwadhyayPdfUrl, formHasSwadhyay, formHasMcq, formHasMixedQuiz, subjectId, standardId, navigation]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.headerCard}>
                <Text style={styles.screenTitle}>{isEditing ? '✏️ Edit Chapter' : '➕ Add Chapter'}</Text>
                <Text style={styles.screenSubtitle}>{subjectName}</Text>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Title (English) <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="Chapter title"
                    placeholderTextColor={adminColors.textMuted}
                />
            </View>

            {/* Title Gujarati */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Title (Gujarati) <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formTitleGu}
                    onChangeText={setFormTitleGu}
                    placeholder="પ્રકરણ શીર્ષક"
                    placeholderTextColor={adminColors.textMuted}
                />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={formDesc}
                    onChangeText={setFormDesc}
                    placeholder="Optional description"
                    placeholderTextColor={adminColors.textMuted}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Order + Premium Row */}
            <View style={styles.formRow}>
                <View style={styles.formHalf}>
                    <Text style={styles.label}>Order</Text>
                    <TextInput
                        style={styles.input}
                        value={formOrder}
                        onChangeText={setFormOrder}
                        keyboardType="number-pad"
                        placeholderTextColor={adminColors.textMuted}
                    />
                </View>
                <View style={styles.formHalf}>
                    <Text style={styles.label}>Premium</Text>
                    <View style={styles.switchRow}>
                        <Switch
                            value={formIsPremium}
                            onValueChange={setFormIsPremium}
                            trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
                            thumbColor={formIsPremium ? adminColors.primary : adminColors.textMuted}
                        />
                        <Text style={styles.switchLabel}>{formIsPremium ? 'Yes' : 'No'}</Text>
                    </View>
                </View>
            </View>

            {/* Feature Toggles */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Feature Toggles</Text>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Swadhyay</Text>
                    <Switch
                        value={formHasSwadhyay}
                        onValueChange={setFormHasSwadhyay}
                        trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
                        thumbColor={formHasSwadhyay ? adminColors.primary : adminColors.textMuted}
                    />
                </View>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>MCQ</Text>
                    <Switch
                        value={formHasMcq}
                        onValueChange={setFormHasMcq}
                        trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
                        thumbColor={formHasMcq ? adminColors.primary : adminColors.textMuted}
                    />
                </View>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Mixed Quiz</Text>
                    <Switch
                        value={formHasMixedQuiz}
                        onValueChange={setFormHasMixedQuiz}
                        trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
                        thumbColor={formHasMixedQuiz ? adminColors.primary : adminColors.textMuted}
                    />
                </View>
            </View>

            {/* Video URL */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Video URL (optional)</Text>
                <TextInput
                    style={styles.input}
                    value={formVideoUrl}
                    onChangeText={setFormVideoUrl}
                    placeholder="https://..."
                    placeholderTextColor={adminColors.textMuted}
                />
            </View>

            {/* Chapter PDF Upload */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📄 Chapter PDF</Text>
                {formPdfUrl ? (
                    <View style={styles.pdfUploadedRow}>
                        <View style={styles.pdfUploadedInfo}>
                            <Text style={styles.pdfUploadedIcon}>✅</Text>
                            <Text style={styles.pdfUploadedText} numberOfLines={1}>
                                PDF Uploaded
                            </Text>
                        </View>
                        <View style={styles.pdfActions}>
                            <TouchableOpacity style={styles.changePdfBtn} onPress={handlePickChapterPdf} disabled={uploadingPdf}>
                                <Text style={styles.changePdfBtnText}>Change</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setFormPdfUrl('')}>
                                <Text style={styles.removePdfText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={handlePickChapterPdf}
                        disabled={uploadingPdf}
                    >
                        {uploadingPdf ? (
                            <View style={styles.uploadingRow}>
                                <ActivityIndicator size="small" color={adminColors.primary} />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        ) : (
                            <Text style={styles.uploadBtnText}>⬆️ Upload Chapter PDF</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Swadhyay PDF Upload */}
            {formHasSwadhyay && (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>📝 Swadhyay PDF</Text>
                    {formSwadhyayPdfUrl ? (
                        <View style={styles.pdfUploadedRow}>
                            <View style={styles.pdfUploadedInfo}>
                                <Text style={styles.pdfUploadedIcon}>✅</Text>
                                <Text style={styles.pdfUploadedText} numberOfLines={1}>
                                    Swadhyay PDF Uploaded
                                </Text>
                            </View>
                            <View style={styles.pdfActions}>
                                <TouchableOpacity style={styles.changePdfBtn} onPress={handlePickSwadhyayPdf} disabled={uploadingSwadhyayPdf}>
                                    <Text style={styles.changePdfBtnText}>Change</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFormSwadhyayPdfUrl('')}>
                                    <Text style={styles.removePdfText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={handlePickSwadhyayPdf}
                            disabled={uploadingSwadhyayPdf}
                        >
                            {uploadingSwadhyayPdf ? (
                                <View style={styles.uploadingRow}>
                                    <ActivityIndicator size="small" color={adminColors.primary} />
                                    <Text style={styles.uploadingText}>Uploading...</Text>
                                </View>
                            ) : (
                                <Text style={styles.uploadBtnText}>⬆️ Upload Swadhyay PDF</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || uploadingPdf || uploadingSwadhyayPdf}
            >
                {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveButtonText}>
                        {isEditing ? '💾 Update Chapter' : '✨ Create Chapter'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    scrollContent: {
        padding: spacing.xl,
    },
    headerCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    screenTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    screenSubtitle: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    formRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    formHalf: {
        flex: 1,
    },
    label: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
    },
    required: {
        color: adminColors.error,
    },
    input: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    switchLabel: {
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
    },
    sectionCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    sectionTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    toggleLabel: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
    },
    pdfUploadedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E8F5E9',
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    pdfUploadedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pdfUploadedIcon: {
        fontSize: 18,
        marginRight: spacing.sm,
    },
    pdfUploadedText: {
        flex: 1,
        fontSize: typography.size.sm,
        color: '#2E7D32',
        fontWeight: typography.weight.semibold,
    },
    pdfActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    changePdfBtn: {
        backgroundColor: adminColors.primary + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.sm,
    },
    changePdfBtnText: {
        fontSize: typography.size.xs,
        color: adminColors.primary,
        fontWeight: typography.weight.bold,
    },
    removePdfText: {
        fontSize: typography.size.sm,
        color: adminColors.error,
        fontWeight: typography.weight.semibold,
    },
    uploadBtn: {
        backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderStyle: 'dashed',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    uploadBtnText: {
        fontSize: typography.size.sm,
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
    uploadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    uploadingText: {
        fontSize: typography.size.sm,
        color: adminColors.primary,
        fontWeight: typography.weight.medium,
    },
    saveButton: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    bottomSpacer: {
        height: 40,
    },
});
