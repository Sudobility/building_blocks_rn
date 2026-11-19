/**
 * @fileoverview AuthQueryCacheReset - drops the query cache when the signed-in
 * user changes. The counterpart of the web building_blocks component of the
 * same name.
 */
import { useEffect, useRef } from 'react';
import { useApiSafe } from '../api/ApiContext';

/**
 * The part of a TanStack `QueryClient` this needs. Structural, so this package
 * does not have to import `@tanstack/react-query` (an optional peer).
 */
export interface QueryCacheLike {
  clear: () => void;
}

export interface AuthQueryCacheResetProps {
  /** The app's query client (or anything with a `clear()`). */
  queryClient: QueryCacheLike;
  /**
   * The signed-in user's id, or null when signed out. Defaults to the
   * `ApiProvider`'s `userId`; pass it when the app has no `ApiProvider` from
   * this package.
   */
  userId?: string | null;
}

/**
 * Drops every cached query when the signed-in user goes away.
 *
 * Query keys are not scoped by uid, so the cache built up for one user would
 * otherwise be served to the next one that signs in -- with default staleTime
 * the data is still fresh, so nothing refetches and the previous user's
 * workspaces, members and projects stay on screen until the app restarts.
 *
 * The rule is the web's: a sign-out, or a switch straight to another account,
 * clears; arriving at a user from none (the session restored at launch, or a
 * first sign-in) does not. Where the web observes Firebase directly, this
 * reads the user id it is given -- this package takes no Firebase dependency.
 */
export function AuthQueryCacheReset({
  queryClient,
  userId,
}: AuthQueryCacheResetProps) {
  const api = useApiSafe();
  const uid = (userId !== undefined ? userId : api?.userId) ?? null;
  // undefined until the first render's effect, which records the session
  // already in place at launch -- that is not a user change and must not clear.
  const previousUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const priorUid = previousUid.current;
    previousUid.current = uid;

    // Sign-out, or a switch straight to another account.
    if (priorUid != null && priorUid !== uid) {
      queryClient.clear();
    }
  }, [uid, queryClient]);

  return null;
}

export default AuthQueryCacheReset;
