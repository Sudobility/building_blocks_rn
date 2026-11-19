/**
 * @fileoverview Empty state component for React Native — the counterpart of
 * `EmptyState` in `@sudobility/building_blocks`.
 *
 * A centered, muted message above a primary action button. Use it when a list
 * or screen has no content to display. Unlike the web's, the button is
 * optional: omit `buttonLabel`/`onPress` for a message-only placeholder.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createThemedStyles } from '../../utils/styles';

export interface EmptyStateProps {
  /** Descriptive message shown above the action button */
  message: string;
  /** Label for the primary action button. Omit to render no button. */
  buttonLabel?: string;
  /** Callback fired when the action button is pressed. Omit to render no button. */
  onPress?: () => void;
}

export function EmptyState({ message, buttonLabel, onPress }: EmptyStateProps) {
  const styles = useStyles();
  const showButton = buttonLabel != null && onPress != null;

  return (
    <View style={styles.container}>
      <Text style={[styles.message, showButton && styles.messageWithButton]}>
        {message}
      </Text>
      {showButton && (
        <Pressable
          style={styles.button}
          onPress={onPress}
          accessibilityRole='button'
          accessibilityLabel={buttonLabel}
        >
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: colors.textSecondary,
  },
  // The web's `mb-5` between the message and the button.
  messageWithButton: {
    marginBottom: 20,
  },
  // The web's primary button: the theme's primary, not a fixed blue.
  button: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '500',
  },
}));
