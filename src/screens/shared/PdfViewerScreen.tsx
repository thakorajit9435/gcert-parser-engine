import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    Linking,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { useAuth, usePdfProgress } from '../../hooks';
import { studentColors, typography, spacing, borderRadius } from '../../theme';
import { logAnalyticsEvent } from '../../services/analytics';
import { logCrashError } from '../../services/crashlytics';

import { warmUpBackend } from '../../services/warmup.service';

const LOADING_TIMEOUT_MS = 80000;
const MAX_RETRIES = 5;

export function PdfViewerScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { url, title, pdfId, pdfType, startPage, endPage, bookStartPage } = route.params;
    console.log(startPage, endPage, bookStartPage);
    const { userProfile } = useAuth();
    const userId = userProfile?.uid;


    const [loading, setLoading] = useState(true);
    const [isWakingServer, setIsWakingServer] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [webViewKey, setWebViewKey] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pdfRef = useRef<any>(null);

    const {
        progress,
        saveProgress,
        forceSaveProgress,
        toggleBookmark,
        isPageBookmarked,
    } = usePdfProgress(userId, pdfId, pdfType || 'chapter');

    const clearLoadingTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startLoadingTimeout = useCallback(() => {
        clearLoadingTimeout();
        timeoutRef.current = setTimeout(() => {
            setLoading(false);
            setHasError(true);
            logCrashError(new Error('PDF loading timeout'), 'pdf_error', { url, pdfId });
        }, LOADING_TIMEOUT_MS);
    }, [clearLoadingTimeout, url, pdfId]);

    // Track analytics event on open and trigger backend warmup
    useEffect(() => {
        warmUpBackend();
        logAnalyticsEvent('pdf_open', {
            pdf_id: pdfId || 'unknown',
            pdf_type: pdfType || 'unknown',
            title: title || 'unknown',
        });
    }, [pdfId, pdfType, title]);

    // Show server cold-start notice if loading takes longer than 3.5s
    useEffect(() => {
        let timer: any = null;
        if (loading) {
            timer = setTimeout(() => {
                setIsWakingServer(true);
            }, 3500);
        } else {
            setIsWakingServer(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [loading]);

    // Manage status bar and navigation header visibility based on fullscreen mode
    useEffect(() => {
        StatusBar.setHidden(isFullscreen, 'slide');
        navigation.setOptions({
            headerShown: !isFullscreen,
        });
        return () => {
            StatusBar.setHidden(false);
        };
    }, [isFullscreen, navigation]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => clearLoadingTimeout();
    }, [clearLoadingTimeout]);

    // Start timeout when loading is active
    useEffect(() => {
        if (loading) {
            startLoadingTimeout();
        } else {
            clearLoadingTimeout();
        }
    }, [loading, startLoadingTimeout, clearLoadingTimeout]);

    if (!url) {
        Alert.alert('Error', 'Invalid PDF URL');
        return <View style={styles.container} />;
    }

    const openInBrowser = () => {
        Linking.openURL(url).catch(err => {
            logCrashError(err, 'pdf_error', { url, action: 'open_in_browser' });
            Alert.alert('Error', 'Could not open the PDF in your browser.');
        });
    };

    const handleRetry = () => {
        setHasError(false);
        setLoading(true);
        setRetryCount(prev => prev + 1);
        setWebViewKey(prev => prev + 1);
    };

    const handleToggleBookmark = async () => {
        const success = await toggleBookmark(currentPage);
        if (success) {
            Alert.alert(
                'યાદ રાખ્યું',
                isPageBookmarked(currentPage)
                    ? 'બુકમાર્ક દૂર કરવામાં આવ્યો છે'
                    : 'આ પેજ બુકમાર્ક કરવામાં આવ્યું છે! 🔖'
            );
        }
    };

    const handleNextPage = () => {
        const maxPage = endPage || totalPages;
        if (currentPage < maxPage) {
            const nextPage = currentPage + 1;
            pdfRef.current?.setPage(nextPage);
            setCurrentPage(nextPage);
            saveProgress(nextPage, totalPages);
        }
    };

    const handlePrevPage = () => {
        const minPage = startPage || 1;
        if (currentPage > minPage) {
            const prevPage = currentPage - 1;
            pdfRef.current?.setPage(prevPage);
            setCurrentPage(prevPage);
            saveProgress(prevPage, totalPages);
        }
    };

    const handleGoBack = async () => {
        await forceSaveProgress(currentPage, totalPages);
        navigation.goBack();
    };

    const source = { uri: url, cache: true };
    const totalPagesRange = (startPage && endPage) ? (endPage - startPage + 1) : totalPages;
    const currentPageIndex = (startPage) ? (currentPage - startPage + 1) : currentPage;
    const progressPercent = totalPagesRange > 0 ? (currentPageIndex / totalPagesRange) * 100 : 0;

    return (
        <SafeAreaView style={styles.container} edges={isFullscreen ? ['top', 'bottom'] : ['bottom']}>
            <StatusBar barStyle={isFullscreen ? 'light-content' : 'dark-content'} />

            {/* Header controls (only in fullscreen) */}
            {isFullscreen && (
                <View style={styles.fullscreenHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>← પાછા</Text>
                    </TouchableOpacity>
                    <Text style={styles.fullscreenTitle} numberOfLines={1}>
                        {title || 'PDF રીડર'}
                    </Text>
                    <TouchableOpacity style={styles.fullscreenToggle} onPress={() => setIsFullscreen(false)}>
                        <Text style={styles.fullscreenToggleText}>Exit</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main PDF View */}
            <View style={styles.pdfContainer}>
                <Pdf
                    ref={pdfRef}
                    key={webViewKey}
                    source={source}
                    page={startPage || 1}
                    trustAllCerts={false}
                    enablePaging={true}
                    horizontal={false}
                    enableAntialiasing={true}
                    fitPolicy={0}
                    spacing={0}
                    enableAnnotationRendering={false}
                    onLoadComplete={(numberOfPages) => {
                        setTotalPages(numberOfPages);
                        setLoading(false);
                        clearLoadingTimeout();

                        const initialPage = (progress && startPage && endPage && progress.currentPage >= startPage && progress.currentPage <= endPage)
                            ? progress.currentPage
                            : (startPage || 1);

                        setTimeout(() => {
                            pdfRef.current?.setPage(initialPage);
                            setCurrentPage(initialPage);
                        }, 100);
                    }}
                    onPageChanged={(page, numberOfPages) => {
                        if (startPage && page < startPage) {
                            pdfRef.current?.setPage(startPage);
                            setCurrentPage(startPage);
                        } else if (endPage && page > endPage) {
                            pdfRef.current?.setPage(endPage);
                            setCurrentPage(endPage);
                        } else {
                            setCurrentPage(page);
                            saveProgress(page, numberOfPages);
                        }
                    }}
                    onError={(error) => {
                        logCrashError(error, 'pdf_error', { url, pdfId });
                        setLoading(false);
                        clearLoadingTimeout();
                        setHasError(true);
                    }}
                    onPressLink={(uri) => {
                        Linking.openURL(uri).catch(err => console.error('Error opening link:', err));
                    }}
                    style={styles.pdf}
                />
            </View>

            {/* Bottom Controls */}
            {!loading && !hasError && (
                <View style={[styles.controlsContainer, isFullscreen && styles.fullscreenControls]}>
                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>

                    <View style={styles.controlsRow}>
                        {/* Page Indicator */}
                        <Text style={styles.pageText}>
                            પેજ {startPage && endPage ? `${currentPage - startPage + 1} / ${endPage - startPage + 1}` : `${currentPage} / ${totalPages}`} {startPage && endPage ? `(બુક પેજ ${(bookStartPage || 1) + currentPage - startPage})` : ''}
                        </Text>

                        {/* Navigation Actions */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.iconButton, currentPage <= 1 && styles.disabledButton]}
                                onPress={handlePrevPage}
                                disabled={currentPage <= 1}
                            >
                                <Text style={styles.buttonText}>◀</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.iconButton} onPress={handleToggleBookmark}>
                                <Text style={styles.bookmarkIcon}>
                                    {isPageBookmarked(currentPage) ? '🔖' : '📑'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setIsFullscreen(!isFullscreen)}
                            >
                                <Text style={styles.buttonText}>
                                    {isFullscreen ? '🔍' : '🔎'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.iconButton, currentPage >= totalPages && styles.disabledButton]}
                                onPress={handleNextPage}
                                disabled={currentPage >= totalPages}
                            >
                                <Text style={styles.buttonText}>▶</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Source Attribution Note */}
                    <TouchableOpacity
                        style={{ marginTop: 4, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => {
                            Alert.alert(
                                '🏛️ પાઠ્યપુસ્તક સ્ત્રોત અને અસ્વીકરણ',
                                'આ ડિજિટલ પુસ્તક GSSTB (ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળ) ની સત્તાવાર વેબસાઇટ પરથી વિદ્યાર્થીઓના મફત શૈક્ષણિક ઉપયોગ માટે ઉપલબ્ધ કરાયેલ છે.\n\nઆ એપ સરકાર સાથે સીધી રીતે સંલગ્ન નથી.\n\nસત્તાવાર સ્ત્રોત: https://gsstb.gujarat.gov.in/',
                                [
                                    { text: 'વેબસાઇટ ખોલો', onPress: () => Linking.openURL('https://gsstb.gujarat.gov.in/') },
                                    { text: 'સમજાઈ ગયું', style: 'cancel' }
                                ]
                            );
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                            📖 સ્ત્રોત: GSSTB (https://gsstb.gujarat.gov.in/) ⓘ
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1d4ed8" />
                    <Text style={styles.loadingText}>
                        {isWakingServer
                            ? 'સર્વર સક્રિય થઈ રહ્યું છે, પુસ્તક લોડ થઈ રહ્યું છે...\n(કૃપા કરીને થોડી સેકન્ડ રાહ જુઓ ⏳)'
                            : 'ડિજિટલ પુસ્તક લોડ થઈ રહ્યું છે...'}
                    </Text>
                </View>
            )}

            {/* Error Overlay */}
            {hasError && !loading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>PDF લોડ કરવામાં નિષ્ફળ</Text>
                    <Text style={styles.errorSubText}>
                        કૃપા કરીને તમારું ઈન્ટરનેટ કનેક્શન તપાસો અને ફરી પ્રયાસ કરો.
                    </Text>
                    <View style={styles.errorButtonsRow}>
                        {retryCount < MAX_RETRIES ? (
                            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                <Text style={styles.retryBtnText}>ફરી પ્રયાસ કરો</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.fallbackBtn} onPress={openInBrowser}>
                                <Text style={styles.fallbackBtnText}>બ્રાઉઝરમાં ખોલો</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleGoBack}>
                            <Text style={styles.cancelBtnText}>પાછા જાઓ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    fullscreenHeader: {
        height: 54,
        backgroundColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    backButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as any,
    },
    fullscreenTitle: {
        color: '#FFFFFF',
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold as any,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: spacing.md,
    },
    fullscreenToggle: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
    },
    fullscreenToggleText: {
        color: '#FFFFFF',
        fontSize: typography.size.sm,
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 10,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
        fontWeight: typography.weight.medium as any,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: studentColors.background,
        zIndex: 10,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    errorText: {
        fontSize: typography.size.lg,
        color: studentColors.error,
        fontWeight: typography.weight.bold as any,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    errorSubText: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    errorButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    retryBtn: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
    },
    retryBtnText: {
        color: studentColors.textOnPrimary || '#3E2723',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as any,
    },
    fallbackBtn: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
    },
    fallbackBtnText: {
        color: studentColors.textOnPrimary || '#3E2723',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as any,
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: studentColors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    cancelBtnText: {
        color: studentColors.textSecondary,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold as any,
    },
    controlsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingVertical: 4,
        paddingHorizontal: spacing.md,
    },
    fullscreenControls: {
        backgroundColor: '#1E293B',
        borderTopColor: '#334155',
    },
    progressBarBg: {
        height: 3,
        backgroundColor: '#e2e8f0',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#1d4ed8',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    pageText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#475569',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: borderRadius.sm,
        minWidth: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.3,
    },
    buttonText: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '600',
    },
    bookmarkIcon: {
        fontSize: 15,
    },
});
