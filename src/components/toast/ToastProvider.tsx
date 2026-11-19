/**
 * @fileoverview Animated toast notification provider for React Native.
 *
 * Provides a context-based toast system with slide-down + fade-in animations.
 * Toasts are positioned at the top of the screen, respecting safe area insets.
 * Supports four toast types (success, error, warning, info) with configurable
 * auto-dismiss duration and tap-to-dismiss.
 *
 * @platform ios - Safe area insets from notch/dynamic island are respected.
 * @platform android - Safe area insets from status bar are respected.
 *
 * @example
 * ```tsx
 * // Wrap your app
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // Show a toast from any child
 * const { addToast } = useToast();
 * addToast('Saved!', 'success');
 * ```
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as designColors } from '@sudobility/design';
import { useThemeColors } from '../../theme/ThemeContext';
import { createThemedStyles } from '../../utils/styles';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const styles = useToastStyles();
  const counterRef = useRef(0);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = `toast-${++counterRef.current}`;
      setToasts(prev => [...prev, { id, message, type, duration }]);
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }
    },
    [removeToast]
  );

  // Clean up all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <View
        style={[styles.toastContainer, { top: insets.top + 8 }]}
        pointerEvents='box-none'
        accessibilityRole='alert'
        accessibilityLiveRegion='polite'
      >
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const colors = useThemeColors();
  const styles = useToastStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const bgColor = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  }[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
      ]}
      accessibilityRole='alert'
      accessibilityLabel={`${toast.type}: ${toast.message}`}
    >
      <Pressable
        style={styles.toastContent}
        onPress={onDismiss}
        accessibilityRole='button'
        accessibilityLabel={`Dismiss notification: ${toast.message}`}
      >
        <Text style={styles.toastText}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Hook to access toast functionality.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const useToastStyles = createThemedStyles(_colors => ({
  toastContainer: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  toastContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  toastText: {
    color: designColors.raw.neutral[0],
    fontSize: 15,
    fontWeight: '500' as const,
  },
}));
