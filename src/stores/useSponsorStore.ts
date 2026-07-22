import { create } from 'zustand';
import type { SponsorModuleState } from '../types/sponsor';

const EMPTY_STATE: SponsorModuleState = {
  sponsorModule: null,
};

interface SponsorStoreState {
  state: SponsorModuleState;
  loading: boolean;
  initialized: boolean;
  fetchState: (force?: boolean) => Promise<SponsorModuleState>;
}

export const useSponsorStore = create<SponsorStoreState>((set) => ({
  state: EMPTY_STATE,
  loading: false,
  initialized: true,
  fetchState: async () => {
    set({ state: EMPTY_STATE, loading: false, initialized: true });
    return EMPTY_STATE;
  },
}));
