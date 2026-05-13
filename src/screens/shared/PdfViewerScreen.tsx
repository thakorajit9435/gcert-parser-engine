import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity, Linking, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import { studentColors, typography, spacing, borderRadius } from '../../theme';

const LOADING_TIMEOUT_MS = 15000; // 15 seconds timeout
const MAX_RETRIES = 2;

export function PdfViewerScreen({ route }: { route: any }): React.JSX.Element {
    const { url } = route.params;
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [webViewKey, setWebViewKey] = useState(0); // key to force remount
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearLoadingTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startLoadingTimeout = useCallback(() => {
        clearLoadingTimeout();
        timeoutRef.current = setTimeout(() => {
            // If still loading after timeout, stop spinner and show error
            setLoading(false);
            setHasError(true);
        }, LOADING_TIMEOUT_MS);
    }, [clearLoadingTimeout]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => clearLoadingTimeout();
    }, [clearLoadingTimeout]);

    // Start timeout whenever loading begins
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
            console.error('Failed to open URL:', err);
            Alert.alert('Error', 'Could not open the PDF in your browser.');
        });
    };

    const handleRetry = () => {
        setHasError(false);
        setLoading(true);
        setRetryCount(prev => prev + 1);
        setWebViewKey(prev => prev + 1); // force Pdf component remount
    };

    const source = { uri: url, cache: true };

    return (
        <View style={styles.container}>
            <Pdf
                key={webViewKey}
                source={source}
                trustAllCerts={false}
                enablePaging={true}
                horizontal={true}
                onLoadComplete={() => {
                    setLoading(false);
                    clearLoadingTimeout();
                }}
                onPageChanged={() => {
                    // console.log(`Current page: ${page}`);
                }}
                onError={(error) => {
                    console.log('PDF load error:', error);
                    setLoading(false);
                    clearLoadingTimeout();
                    setHasError(true);
                }}
                onPressLink={(uri) => {
                    Linking.openURL(uri).catch(err => console.error('Error opening link:', err));
                }}
                style={styles.pdf}
            />
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={studentColors.primary} />
                    <Text style={styles.loadingText}>PDF લોડ થઈ રહ્યું છે...</Text>
                </View>
            )}
            {hasError && !loading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>PDF લોડ કરવામાં નિષ્ફળ</Text>
                    <Text style={styles.errorSubText}>
                        કૃપા કરીને તમારું ઈન્ટરનેટ કનેક્શન તપાસો અને ફરી પ્રયાસ કરો.
                    </Text>
                    {retryCount < MAX_RETRIES ? (
                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                            <Text style={styles.retryBtnText}>ફરી પ્રયાસ કરો</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.fallbackBtn} onPress={openInBrowser}>
                            <Text style={styles.fallbackBtnText}>બ્રાઉઝરમાં ખોલો</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: studentColors.background,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.size.md,
        color: studentColors.primary,
        fontWeight: typography.weight.medium as any,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: studentColors.background,
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
    retryBtn: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    retryBtnText: {
        color: studentColors.surface,
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as any,
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: studentColors.background,
    },
    fallbackText: {
        fontSize: typography.size.md,
        color: studentColors.error,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    fallbackBtn: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    fallbackBtnText: {
        color: studentColors.surface,
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold as any,
    },
});
