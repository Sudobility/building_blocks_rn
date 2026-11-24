/**
 * The right-side action row for a native-stack header: a flex row of icon (or text) buttons built
 * from the model's `NavAction[]`. Icons are resolved by name through the `icons` map (same
 * `{ size, color }` contract as `AppHeader`'s menu items); an action with no resolvable icon shows
 * its label. Used by `useNavBar` as `headerRight`.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NavAction } from '@sudobility/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import type { NavIconMap } from './types';

export function NavBarActions({
  actions,
  icons,
}: {
  actions: NavAction[];
  icons?: NavIconMap;
}) {
  const colors = useThemeColors();
  const visible = actions.filter(a => a.show !== false);
  return (
    <View style={styles.row}>
      {visible.map(a => {
        const Icon = a.iconName ? icons?.[a.iconName] : undefined;
        return (
          <Pressable
            key={a.id}
            onPress={a.onPress}
            disabled={a.disabled}
            accessibilityRole='button'
            accessibilityLabel={a.label}
            style={[styles.btn, a.disabled ? styles.disabled : null]}
          >
            {Icon ? (
              <Icon size={22} color={colors.textSecondary} />
            ) : (
              <Text style={[styles.label, { color: colors.text }]}>
                {a.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginEnd: 8 },
  btn: { padding: 6 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 14 },
});
