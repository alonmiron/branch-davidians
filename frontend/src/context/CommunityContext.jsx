import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentCommunity } from '../services/api';

const CommunityContext = createContext(null);

const STORAGE_KEY = 'activeCommunity';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CommunityProvider({ children }) {
  const [activeCommunity, setActiveCommunityState] = useState(loadFromStorage);
  // communitySettings: { section_people, section_places, section_community, section_payments } | null
  const [communitySettings, setCommunitySettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const setActiveCommunity = (community) => {
    if (community) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(community));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setActiveCommunityState(community);
  };

  const clearActiveCommunity = () => {
    setActiveCommunity(null);
    setCommunitySettings(null);
  };

  const fetchCommunitySettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();
    if (!user) return;

    // Only fetch when there is a community context:
    // - super_admin must have an activeCommunity selected
    // - all other roles use their own community_id
    const isSuperAdmin = user.role === 'super_admin';
    const stored = loadFromStorage();
    if (isSuperAdmin && !stored) {
      setCommunitySettings(null);
      return;
    }
    if (!isSuperAdmin && !user.community_id) {
      setCommunitySettings(null);
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await getCurrentCommunity();
      setCommunitySettings(res.data);
    } catch {
      setCommunitySettings(null);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Fetch on mount (handles page reload)
  useEffect(() => {
    fetchCommunitySettings();
  }, [fetchCommunitySettings]);

  // Re-fetch when activeCommunity changes (super admin switches communities)
  useEffect(() => {
    fetchCommunitySettings();
  }, [activeCommunity, fetchCommunitySettings]);

  return (
    <CommunityContext.Provider value={{
      activeCommunity,
      setActiveCommunity,
      clearActiveCommunity,
      communitySettings,
      settingsLoading,
      refetchSettings: fetchCommunitySettings,
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}
