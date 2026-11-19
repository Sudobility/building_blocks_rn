/**
 * Firebase Auth dependent components
 *
 * These components require Firebase auth to be set up.
 * Import from '@sudobility/building_blocks_rn/firebase' to use these.
 */

// App wrappers with Firebase auth
export { SudobilityAppRNWithFirebaseAuth } from './src/app/SudobilityAppRNWithFirebaseAuth';
export type { SudobilityAppRNWithFirebaseAuthProps } from './src/app/SudobilityAppRNWithFirebaseAuth';

// Query cache reset on a change of signed-in user (mounted by the wrapper
// above when it is given a `queryClient`; usable on its own in an app that
// composes its own providers)
export { AuthQueryCacheReset } from './src/app/AuthQueryCacheReset';
export type {
  AuthQueryCacheResetProps,
  QueryCacheLike,
} from './src/app/AuthQueryCacheReset';

// API context
export {
  ApiProvider,
  ApiContext,
  useApi,
  useApiSafe,
} from './src/api/ApiContext';
export type {
  ApiContextValue,
  ApiProviderProps,
  NetworkClient,
} from './src/api/ApiContext';
