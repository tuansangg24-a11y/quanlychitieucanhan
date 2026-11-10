import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { authError } from "../lib/authError";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    let eventReceived = false;
    setLoading(true);
    setError("");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      eventReceived = true;
      setSession(nextSession);
      setError("");
      setLoading(false);
    });
    supabase.auth
      .getSession()
      .then(({ data, error: failure }) => {
        if (!active || eventReceived) return;
        if (failure) setError(authError(failure));
        else setSession(data.session);
        setLoading(false);
      })
      .catch((failure) => {
        if (active && !eventReceived) {
          setError(authError(failure));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [attempt]);
  return (
    <AuthContext.Provider
      value={{ session, loading, error, retry: () => setAttempt((n) => n + 1) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
