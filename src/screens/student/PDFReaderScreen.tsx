import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Book } from '../../types';
import { useBookProgress } from '../../hooks/useBookProgress';
import { borderRadius, spacing, studentColors, typography } from '@/theme';

let Pdf: any = null;
let pdfAvailable = false;

try {
    const PdfModule = require('react-native-pdf');
    if (PdfModule && PdfModule.default) {
        Pdf = PdfModule.default;
        pdfAvailable = true;
    }
} catch (e) {
    console.warn('react-native-pdf native module not linked:', e);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PDFReaderScreen({ route }: { route: any }): React.JSX.Element {
    const { book, initialPage = 1 } = route.params as { book: Book; initialPage?: number };
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [firstPageReady, setFirstPageReady] = useState(false);
    const [totalPages, setTotalPages] = useState(book.totalPages ?? 0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const pdfRef = useRef<any>(null);

    const { saveProgress, forceSaveProgress } = useBookProgress(book.id);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            forceSaveProgress(currentPage, totalPages);
        });
        return unsubscribe;
    }, [navigation, forceSaveProgress, currentPage, totalPages]);

    const source = React.useMemo(
        () => ({ uri: book.pdfUrl, cache: true }),
        [book.pdfUrl],

    );
    console.log("first", book.pdfUrl)
    console.log("🚀 ~ PDFReaderScreen ~ source:", source)

    const handleLoadComplete = useCallback(
        (numberOfPages: number, _filePath: string) => {
            setLoading(false);
            setTotalPages(numberOfPages);
            saveProgress(initialPage, numberOfPages);
        },
        [initialPage, saveProgress],
    );

    const handlePageChanged = useCallback(
        (page: number, numberOfPages: number) => {
            setCurrentPage(page);
            if (!firstPageReady) setFirstPageReady(true);
            saveProgress(page, numberOfPages);
        },
        [firstPageReady, saveProgress],
    );

    const handleError = useCallback((error: any) => {
        setLoading(false);
        setFirstPageReady(true);
        console.error('PDF Load Error:', error);
        Alert.alert('Error', 'Failed to load PDF. Please check your connection and try again.');
    }, []);

    if (!pdfAvailable) {
        return (
            <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>
                    PDF viewer is unavailable.{'\n\n'}
                    {Platform.OS === 'ios'
                        ? 'Run: cd ios && pod install, then rebuild.'
                        : 'Rebuild the app: npx react-native run-android'}
                </Text>
            </View>
        );
    }

    if (!book.pdfUrl) {
        Alert.alert('Error', 'Invalid PDF URL for this book');
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <Pdf
                ref={pdfRef}
                source={source}
                style={styles.pdf}
                trustAllCerts={Platform.OS === 'android'}
                enablePaging={true}
                horizontal={true}
                fitPolicy={0}
                spacing={10}
                page={initialPage}
                onLoadComplete={handleLoadComplete}
                onPageChanged={handlePageChanged}
                onError={handleError}
                onPressLink={(uri: string) => console.log(`Link pressed: ${uri}`)}
            />

            {(!firstPageReady || loading) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={studentColors.primary} />
                    <Text style={styles.loadingText}>Loading your book...</Text>
                </View>
            )}

            {firstPageReady && !loading && (
                <View style={styles.pageIndicatorContainer}>
                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>
                            Page {currentPage} of {totalPages || book.totalPages}
                        </Text>
                    </View>
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
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: studentColors.surface,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        zIndex: 10,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        fontWeight: typography.weight.medium,
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
        lineHeight: 24,
    },
    pageIndicatorContainer: {
        position: 'absolute',
        bottom: spacing.xxxl,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'none',
    },
    pageIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    pageIndicatorText: {
        color: studentColors.textInverse,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
    },
});