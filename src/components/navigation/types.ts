import type { ComponentType } from 'react';

/** A nav-bar icon on React Native: the same `{ size, color }` contract as `MenuItemConfig.icon`. */
export type NavIconComponent = ComponentType<{ size?: number; color?: string }>;

/** name → icon component, used to resolve a `NavAction`/back `iconName` from the model. */
export type NavIconMap = Record<string, NavIconComponent>;
