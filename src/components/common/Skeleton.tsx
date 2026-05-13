import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, DimensionValue, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
    baseColor?: string;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
    baseColor = '#E0E5EC'
}: SkeletonProps): React.JSX.Element {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.8,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                    backgroundColor: baseColor,
                },
                style
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});
