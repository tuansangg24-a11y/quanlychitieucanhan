import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { listCategories } from "../lib/api";
import { dataError } from "../lib/dataError";

const DataContext = createContext(null);
export function DataProvider({ children }) {
  const { session } = useAuth();
  const userId = session.user.id;
  const [syncRevision, setSyncRevision] = useState(0);
  useEffect(() => { const changed = () => setSyncRevision(n => n + 1); window.addEventListener("finance-sync", changed); return () => window.removeEventListener("finance-sync", changed); }, []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listCategories(userId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCategories(data);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(dataError(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId, revision]);
  return (
    <DataContext.Provider
      value={{ syncRevision, userId, categories, loading, error, reload }}
    >
      {children}
    </DataContext.Provider>
  );
}
export const useData = () => useContext(DataContext);
