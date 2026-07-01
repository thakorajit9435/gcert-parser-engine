declare module 'react-native-splash-screen' {
    interface SplashScreen {
        show(): void;
        hide(): void;
    }
    const SplashScreen: SplashScreen;
    export default SplashScreen;
}
