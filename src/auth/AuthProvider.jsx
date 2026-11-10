import {stopOffline,enableOffline} from '../lib/offlineApi';
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { authError } from "../lib/authError";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [demo, setDemo] = useState(() => sessionStorage.getItem("demo-mode") === "true" || window.location.pathname === "/demo");
  const startDemo = () => { sessionStorage.setItem("demo-mode", "true"); setDemo(true); };
  const exitDemo = () => { sessionStorage.removeItem("demo-mode"); setDemo(false); };
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
      if (_event === "SIGNED_OUT") { const previous = sessionStorage.getItem("finance-user"); if (previous) stopOffline(previous).catch(console.error); sessionStorage.removeItem("finance-user"); }
      if (nextSession) { enableOffline(nextSession.user.id); sessionStorage.setItem("finance-user", nextSession.user.id); }
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
      value={{ session: session || (demo ? { user: { id: "demo", email: "Dùng thử" } } : null), demo: demo && !session, startDemo, exitDemo, loading: demo ? false : loading, error: demo ? "" : error, retry: () => setAttempt((n) => n + 1) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
