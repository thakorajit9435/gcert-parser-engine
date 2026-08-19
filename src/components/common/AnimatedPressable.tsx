import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
    /** Target scale on press (default: 0.96) */
    scaleTo?: number;
    /** Active opacity on press (default: 0.88) */
    activeOpacity?: number;
    /** Custom style */
    style?: StyleProp<ViewStyle>;
    /** Spring damping (default: 14) */
    damping?: number;
    /** Spring stiffness (default: 300) */
    stiffness?: number;
    children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

/**
 * AnimatedPressable provides a smooth, tactile spring bounce & scale feedback
 * when tapped, giving all buttons and cards a native, responsive feel.
 */
export function AnimatedPressable({
    scaleTo = 0.96,
    activeOpacity = 0.88,
    damping = 14,
    stiffness = 300,
    style,
    children,
    disabled,
    onPressIn,
    onPressOut,
    ...props
}: AnimatedPressableProps): React.JSX.Element {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = (e: any) => {
        if (!disabled) {
            scale.value = withSpring(scaleTo, {
                damping,
                stiffness,
                mass: 0.5,
            });
            if (activeOpacity < 1) {
                opacity.value = withTiming(activeOpacity, { duration: 90 });
            }
        }
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        if (!disabled) {
            scale.value = withSpring(1, {
                damping: damping - 2,
                stiffness: stiffness - 50,
                mass: 0.6,
            });
            opacity.value = withTiming(1, { duration: 140 });
        }
        onPressOut?.(e);
    };

    return (
        <AnimatedPress
            {...props}
            disabled={disabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, animatedStyle]}
        >
            {children}
        </AnimatedPress>
    );
}
