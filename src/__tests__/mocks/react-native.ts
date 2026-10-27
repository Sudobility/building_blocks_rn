/**
 * Mock implementation of react-native for Vitest.
 * Used as an alias to avoid parsing Flow types in the actual RN package.
 */
import React from 'react';
import { vi } from 'vitest';

const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 1,
  flatten: (style: unknown) => style,
};

const createMockComponent = (name: string) => {
  // Strip `style`: these render as DOM elements under jsdom, and React 19.3's
  // react-dom proxies the style object and rejects RN's array styles
  // ("'set' on proxy: trap returned falsish"). Tests assert content, not style.
  const Component = ({ style: _style, ...props }: Record<string, any>) =>
    React.createElement(name, props, props.children);
  Component.displayName = name;
  return Component;
};

class AnimatedValue {
  _value: number;
  constructor(value: number) {
    this._value = value;
  }
  setValue(value: number) {
    this._value = value;
  }
}

const Animated = {
  Value: AnimatedValue,
  View: createMockComponent('Animated.View'),
  Text: createMockComponent('Animated.Text'),
  timing: () => ({
    start: (callback?: () => void) => callback?.(),
  }),
  parallel: (animations: Array<{ start: (cb?: () => void) => void }>) => ({
    start: (callback?: () => void) => {
      animations.forEach(a => a.start());
      callback?.();
    },
  }),
  sequence: (animations: Array<{ start: (cb?: () => void) => void }>) => ({
    start: (callback?: () => void) => {
      animations.forEach(a => a.start());
      callback?.();
    },
  }),
};

// Mutable state for tests
let colorScheme: string | null = 'light';
let windowDimensions = { width: 400, height: 800 };

export const View = createMockComponent('View');
export const Text = createMockComponent('Text');
export const TextInput = createMockComponent('TextInput');
export const Pressable = createMockComponent('Pressable');
export const TouchableOpacity = createMockComponent('TouchableOpacity');
export const Image = createMockComponent('Image');
export const ScrollView = createMockComponent('ScrollView');
export const FlatList = createMockComponent('FlatList');
export const SafeAreaView = createMockComponent('SafeAreaView');
export const ActivityIndicator = createMockComponent('ActivityIndicator');
export const KeyboardAvoidingView = createMockComponent('KeyboardAvoidingView');

export const Modal = ({ style: _style, ...props }: Record<string, any>) => {
  if (!props.visible) return null;
  return React.createElement('Modal', props, props.children);
};

export const Linking = {
  openURL: () => Promise.resolve(),
};

export const Platform = {
  OS: 'ios' as string,
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
};

export const useColorScheme = vi.fn(() => colorScheme);
export const useWindowDimensions = vi.fn(() => windowDimensions);

/** Test helper to set the color scheme */
export function __setColorScheme(scheme: string | null) {
  colorScheme = scheme;
  useColorScheme.mockImplementation(() => scheme);
}

/** Test helper to set window dimensions */
export function __setWindowDimensions(dims: { width: number; height: number }) {
  windowDimensions = dims;
  useWindowDimensions.mockImplementation(() => dims);
}

export { StyleSheet, Animated };
