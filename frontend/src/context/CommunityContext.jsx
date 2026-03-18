import { createContext, useContext, useState } from 'react';

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

  const setActiveCommunity = (community) => {
    if (community) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(community));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setActiveCommunityState(community);
  };

  const clearActiveCommunity = () => setActiveCommunity(null);

  return (
    <CommunityContext.Provider value={{ activeCommunity, setActiveCommunity, clearActiveCommunity }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}
