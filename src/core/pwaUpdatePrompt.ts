import { registerSW } from 'virtual:pwa-register';

interface PwaUpdaterState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: (reloadPage?: boolean) => Promise<void>;
}

export function initPwaUpdater(): PwaUpdaterState {
  const state: PwaUpdaterState = {
    needRefresh: false,
    offlineReady: false,
    updateSW: () => Promise.resolve(),
  };

  const updateSW = registerSW({
    onNeedRefresh() {
      state.needRefresh = true;
    },
    onOfflineReady() {
      state.offlineReady = true;
    },
  });

  state.updateSW = updateSW;

  return state;
}
