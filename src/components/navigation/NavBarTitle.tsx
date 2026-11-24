/**
 * The title block for a native-stack header: a title line and an optional subtitle, themed and
 * centred, bounded so a long title is cut short rather than running under the bar's buttons.
 * Used by `useNavBar` as `headerTitle` when a `subtitle` is present (a plain `title` string is
 * handed straight to the native bar instead).
 */
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme/ThemeContext';

export function NavBarTitle({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.wrap}>
      {title ? (
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', maxWidth: 240 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 12 },
});
