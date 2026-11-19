/**
 * @fileoverview Language selector for React Native — the counterpart of
 * `LanguageSelector` in `@sudobility/building_blocks`.
 *
 * Same props and rules as the web: the languages are listed alphabetically by
 * name, the current one falls back to the first when its code is unknown,
 * choosing the language already in use changes nothing, and there are two
 * variants — `compact` (flag, name and chevron, for a header) and `full` (a
 * labelled field with a line of help, for a settings screen). The list opens
 * in a modal where the web drops a menu down.
 *
 * `LanguagePicker` is this package's earlier name for the full variant; it is
 * kept, and shows a label or help only when given one.
 *
 * @platform ios - Uses `presentationStyle="pageSheet"` for the modal, which
 *   presents as a card that can be swiped to dismiss (iOS 13+).
 * @platform android - Uses the default modal presentation (full-screen overlay).
 *   The `presentationStyle` prop is ignored on Android.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useRTLTextStyle } from '../../hooks/useRTL';
import type { LanguageConfig } from '../../constants/languages';
import { DEFAULT_LANGUAGES } from '../../constants/languages';
import { createThemedStyles } from '../../utils/styles';

export interface LanguageSelectorProps {
  /** Available languages (defaults to the built-in languages) */
  languages?: LanguageConfig[];
  /** Current language code */
  currentLanguage?: string;
  /** Language change handler */
  onLanguageChange?: (languageCode: string) => void;
  /** Variant: 'compact' for a header, 'full' for settings (default: 'compact') */
  variant?: 'compact' | 'full';
  /** Label text for full variant (default: 'Language') */
  label?: string;
  /** Helper text for full variant (default: 'Select your preferred language') */
  helperText?: string;
  /** Title of the list of languages (default: the label, or 'Select language') */
  modalTitle?: string;
  /** Label of the button that closes the list (default: 'Done') */
  doneLabel?: string;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props for `LanguagePicker` — `LanguageSelector`'s, without the variant.
 */
export type LanguagePickerProps = Omit<LanguageSelectorProps, 'variant'>;

function LanguageSelectorView({
  languages = DEFAULT_LANGUAGES,
  currentLanguage = 'en',
  onLanguageChange,
  variant,
  label,
  helperText,
  modalTitle,
  doneLabel = 'Done',
  style,
}: LanguageSelectorProps & { variant: 'compact' | 'full' }) {
  const styles = useStyles();
  const rtlText = useRTLTextStyle();
  const [modalVisible, setModalVisible] = useState(false);

  // Sort languages alphabetically by name
  const sortedLanguages = useMemo(
    () => [...languages].sort((a, b) => a.name.localeCompare(b.name)),
    [languages]
  );

  const currentLang = useMemo(
    () => languages.find(lang => lang.code === currentLanguage) || languages[0],
    [languages, currentLanguage]
  );

  const handleSelect = (code: string) => {
    if (code !== currentLanguage) {
      onLanguageChange?.(code);
    }
    setModalVisible(false);
  };

  const compact = variant === 'compact';
  const title = modalTitle ?? label ?? 'Select language';

  return (
    <View style={style}>
      {!compact && label ? (
        <Text style={[styles.label, rtlText]}>{label}</Text>
      ) : null}

      <Pressable
        style={compact ? styles.compactTrigger : styles.trigger}
        onPress={() => setModalVisible(true)}
        accessibilityRole='button'
        accessibilityLabel={`${label ?? 'Select language'}: ${currentLang?.name ?? currentLanguage}`}
      >
        <Text style={[styles.triggerText, rtlText]}>
          {currentLang
            ? `${currentLang.flag} ${currentLang.name}`
            : currentLanguage}
        </Text>
        <Text style={styles.chevron}>{'\u25BC'}</Text>
      </Pressable>

      {!compact && helperText ? (
        <Text style={[styles.helperText, rtlText]}>{helperText}</Text>
      ) : null}

      <Modal
        visible={modalVisible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, rtlText]}
              accessibilityRole='header'
            >
              {title}
            </Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              accessibilityRole='button'
              accessibilityLabel={doneLabel}
            >
              <Text style={styles.closeButton}>{doneLabel}</Text>
            </Pressable>
          </View>

          <FlatList
            data={sortedLanguages}
            keyExtractor={item => item.code}
            accessibilityLabel='Languages'
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.languageRow,
                  item.code === currentLanguage && styles.languageRowActive,
                ]}
                onPress={() => handleSelect(item.code)}
                accessibilityRole='radio'
                accessibilityState={{
                  selected: item.code === currentLanguage,
                }}
                accessibilityLabel={item.name}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[styles.languageName, rtlText]}>{item.name}</Text>
                {item.code === currentLanguage && (
                  <Text style={styles.checkmark}>{'\u2713'}</Text>
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/**
 * LanguageSelector - switch languages from a list.
 *
 * @example
 * ```tsx
 * // Compact variant for a header
 * <LanguageSelector
 *   currentLanguage="en"
 *   onLanguageChange={code => i18n.changeLanguage(code)}
 * />
 *
 * // Full variant for settings screens
 * <LanguageSelector
 *   currentLanguage="en"
 *   onLanguageChange={code => i18n.changeLanguage(code)}
 *   variant="full"
 *   label="Language"
 *   helperText="Select your preferred language"
 * />
 * ```
 */
export function LanguageSelector({
  variant = 'compact',
  label = 'Language',
  helperText = 'Select your preferred language',
  ...props
}: LanguageSelectorProps) {
  return (
    <LanguageSelectorView
      {...props}
      variant={variant}
      label={label}
      helperText={helperText}
    />
  );
}

/**
 * The full variant under this package's earlier name. Unlike
 * `LanguageSelector` it has no default label or help: it shows them only when
 * given, as it always has.
 */
export function LanguagePicker(props: LanguagePickerProps) {
  return <LanguageSelectorView {...props} variant='full' />;
}

const useStyles = createThemedStyles(colors => ({
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  compactTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  triggerText: {
    fontSize: 16,
    color: colors.text,
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  languageRowActive: {
    backgroundColor: colors.surfaceSecondary,
  },
  flag: {
    fontSize: 20,
    marginEnd: 12,
  },
  languageName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginStart: 48,
  },
}));
