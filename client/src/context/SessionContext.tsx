import { createContext, useContext, useState, ReactNode } from 'react';
import { SessionData, Experience } from '../types';

interface SessionContextValue {
  session: SessionData | null;
  setSession: (data: SessionData) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_SESSION: SessionData = {
  jdText: '',
  experience: '0-2' as Experience,
  cvText: '',
  cvFileName: '',
};

interface SessionProviderProps {
  children: ReactNode;
  initialSession?: SessionData | null;
}

export function SessionProvider({ children, initialSession = null }: SessionProviderProps) {
  const [session, setSessionState] = useState<SessionData | null>(initialSession);

  const setSession = (data: SessionData) => setSessionState(data);
  const clearSession = () => setSessionState(null);

  return (
    <SessionContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export { DEFAULT_SESSION };
