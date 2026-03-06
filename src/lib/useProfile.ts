'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from './types';

const STORAGE_KEY = 'garmin_user_profile';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const saveProfile = (p: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      setProfile(p);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  };

  const clearProfile = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    setProfile(null);
  };

  return { profile, saveProfile, clearProfile, loaded };
}
