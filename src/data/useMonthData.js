import { useEffect, useState } from "react";
import { useData } from "./DataProvider";
import { listBudgets, listMonthTransactions } from "../lib/api";
import { dataError } from "../lib/dataError";
import { shiftMonth } from "../lib/statistics";

export default function useMonthData(month, compare = false) {
  const { userId } = useData();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({
    loading: true,
    error: "",
    transactions: [],
    previous: [],
    budgets: [],
  });
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    Promise.all([
      listMonthTransactions(userId, month, controller.signal),
      compare
        ? listMonthTransactions(
            userId,
            shiftMonth(month, -1),
            controller.signal,
          )
        : Promise.resolve([]),
      listBudgets(userId, month, controller.signal),
    ])
      .then(([transactions, previous, budgets]) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            error: "",
            transactions,
            previous,
            budgets,
          });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setState((current) => ({
            ...current,
            loading: false,
            error: dataError(failure),
          }));
      });
    return () => controller.abort();
  }, [userId, month, compare, revision]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}
