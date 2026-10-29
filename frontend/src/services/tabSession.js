// Generates and preserves a unique Tab ID in window.name per browser tab.
// window.name persists across reloads within the same tab, but is unique per tab.
export const getTabId = () => {
  if (typeof window === 'undefined') return 'server';
  if (!window.name || !window.name.startsWith('cems_tab_')) {
    window.name = 'cems_tab_' + Math.random().toString(36).substring(2, 9);
  }
  return window.name;
};

export const tabId = getTabId();

export const tabStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(`${key}_${tabId}`);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(`${key}_${tabId}`, value);
    } catch {}
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(`${key}_${tabId}`);
    } catch {}
  },
};
