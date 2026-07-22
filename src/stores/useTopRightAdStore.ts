import { create } from 'zustand';
import type { TopRightAdState } from '../types/topRightAd';

const EMPTY_STATE: TopRightAdState = {
  ad: null,
  ads: [],
};

const TOP_RIGHT_AD_STATE_CACHE_KEY = 'agtools.top_right_ad_state.cache.v1';

interface TopRightAdStoreState {
  state: TopRightAdState;
  loading: boolean;
  initialized: boolean;
  fetchState: () => Promise<TopRightAdState>;
  forceRefreshState: () => Promise<TopRightAdState>;
}

function clearLegacyAdCache(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(TOP_RIGHT_AD_STATE_CACHE_KEY);
  } catch {
    // A storage failure must not make an advertisement visible.
  }
}

async function returnCleanState(
  set: (state: Partial<TopRightAdStoreState>) => void,
): Promise<TopRightAdState> {
  clearLegacyAdCache();
  set({ state: EMPTY_STATE, loading: false, initialized: true });
  return EMPTY_STATE;
}

clearLegacyAdCache();

export const useTopRightAdStore = create<TopRightAdStoreState>((set) => ({
  state: EMPTY_STATE,
  loading: false,
  initialized: true,
  fetchState: async () => returnCleanState(set),
  forceRefreshState: async () => returnCleanState(set),
}));
