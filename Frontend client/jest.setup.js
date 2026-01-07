/**
 * Configuration Jest Setup
 */

// Extend jest with react-native testing-library matchers
require('@testing-library/jest-native/extend-expect');

// Mock Expo modules
jest.mock('expo-router', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  };
  return {
    useRouter: jest.fn(() => mockRouter),
    usePathname: jest.fn(() => '/'),
    Href: jest.fn(),
    Stack: {
      Screen: () => null,
    },
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock expo-navigation-bar
jest.mock('expo-navigation-bar', () => ({
  setButtonStyleAsync: jest.fn(),
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props) => React.createElement(View, props, props.children),
    useCameraPermissions: jest.fn(() => [{ granted: false }, jest.fn()]),
  };
});

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockWebView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      injectJavaScript: jest.fn(),
    }));
    return React.createElement(View, props, props.children);
  });
  return { WebView: MockWebView };
});

// Mock masked view
jest.mock('@react-native-masked-view/masked-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MaskedView = (props) => React.createElement(View, props, props.children);
  return MaskedView;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native Modal to always render children (avoid portal behavior)
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockModal = ({ children }) => React.createElement(View, null, children);
  MockModal.displayName = 'Modal';
  return MockModal;
}, { virtual: true });

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaProvider: ({ children }) => children,
  };
});

// Mock react-native animation helpers (RN 0.81 safe)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Patch Animated.timing to avoid unsupported useNativeDriver warnings
const ReactNative = require('react-native');
const Animated = ReactNative.Animated;
Animated.timing = (value, config) => {
  return {
    start: (callback) => {
      callback && callback({ finished: true });
    },
    stop: jest.fn(),
    reset: jest.fn(),
  };
};

// Ensure RN Modal renders children in tests
const React = require('react');
ReactNative.Modal = ({ children }) => React.createElement(ReactNative.View, null, children);

// Global test timeout
jest.setTimeout(10000);

// Filter noisy act(...) warning coming from ThemeContext state updates during setup
const originalConsoleError = console.error;
jest.spyOn(console, 'error').mockImplementation((...args) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('not wrapped in act')) {
    return; // ignore this specific warning
  }
  originalConsoleError(...args);
});
