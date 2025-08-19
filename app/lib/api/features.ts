export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

export const getFeatureFlags = async (): Promise<Feature[]> => {
  // Persist basic feature flags in localStorage to keep real state across sessions
  const storageKey = 'featureFlags';

  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;

    if (raw) {
      const parsed = JSON.parse(raw) as Feature[];

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  const defaults: Feature[] = [
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      description: 'Enable dark mode for better night viewing',
      viewed: true,
      releaseDate: '2024-03-15',
    },
    {
      id: 'tab-management',
      name: 'Tab Management',
      description: 'Customize your tab layout',
      viewed: false,
      releaseDate: '2024-03-20',
    },
  ];

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(defaults));
    }
  } catch {
    // ignore storage errors
  }

  return defaults;
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  const storageKey = 'featureFlags';

  try {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    const features: Feature[] = raw ? (JSON.parse(raw) as Feature[]) : [];
    const updated = features.map((f) => (f.id === featureId ? { ...f, viewed: true } : f));
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
};
