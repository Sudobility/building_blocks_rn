/**
 * A custom back control for a native-stack `headerLeft`. Needed only when a screen's back must run
 * a custom handler (`NavBack.onPress`) instead of the native pop — `useNavBar` then hides the
 * built-in back and renders this. Shows the `back` icon from the icon map when provided, else a
 * chevron glyph.
 */
import { Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme/ThemeContext';
import type { NavIconComponent } from './types';

export function HeaderBackButton({
  label,
  icon: Icon,
  onPress,
}: {
  label?: string;
  icon?: NavIconComponent;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label ?? 'Back'}
      style={styles.btn}
    >
      {Icon ? (
        <Icon size={22} color={colors.text} />
      ) : (
        <Text style={[styles.glyph, { color: colors.text }]}>
          {label ? `‹ ${label}` : '‹'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 8, paddingVertical: 4 },
  glyph: { fontSize: 20 },
});
