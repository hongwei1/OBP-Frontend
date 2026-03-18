import { writable } from "svelte/store";

interface ApiActivityState {
  isActive: boolean;
  activeCallsCount: number;
}

function createApiActivityStore() {
  const { subscribe, set, update } = writable<ApiActivityState>({
    isActive: false,
    activeCallsCount: 0,
  });

  let hideTimer: number | null = null;

  return {
    subscribe,
    startCall: () => {
      update((state) => {
        const newCount = state.activeCallsCount + 1;
        return {
          isActive: true,
          activeCallsCount: newCount,
        };
      });

      // Clear any pending hide timer
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    },
    endCall: () => {
      update((state) => {
        const newCount = Math.max(0, state.activeCallsCount - 1);
        return {
          isActive: newCount > 0,
          activeCallsCount: newCount,
        };
      });

      // If no active calls, set a timer to hide the indicator
      // This creates a brief flash effect
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        update((state) => {
          if (state.activeCallsCount === 0) {
            return { isActive: false, activeCallsCount: 0 };
          }
          return state;
        });
      }, 3000);
    },
  };
}

export const apiActivity = createApiActivityStore();
