import { supabase } from "./supabase";
import { escapeLike, monthBounds } from "./finance";

export const PAGE_SIZE = 20;
const fields = "id,type,amount,category_id,date,note,created_at,recurring_id,occurrence_date";

export async function listCategories(userId, signal) {
  const result = [];
  let offset = 0;
  // Continue until an empty page; also works if the API's max rows is below 1000.
  while (true) {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,color,emoji,type")
      .eq("user_id", userId)
      .order("name")
      .order("id")
      .range(offset, offset + 999)
      .abortSignal(signal);
    if (error) throw error;
    if (!data.length) return result;
    result.push(...data);
    offset += data.length;
  }
}

function transactionQuery(userId, filters, count) {
  let query = supabase
    .from("transactions")
    .select(fields, count ? { count: "exact" } : undefined)
    .eq("user_id", userId);
  if (filters.month) {
    const { start, end } = monthBounds(filters.month);
    query = query.gte("date", start).lt("date", end);
  }
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.search)
    query = query.ilike("note", `%${escapeLike(filters.search)}%`);
  if (filters.min !== "") query = query.gte("amount", filters.min);
  if (filters.max !== "") query = query.lte("amount", filters.max);
  return query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}

export async function listTransactions(userId, filters, page, signal) {
  const { data, count, error } = await transactionQuery(userId, filters, true)
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    .abortSignal(signal);
  if (error) throw error;
  return { rows: data, count: count ?? 0 };
}

export async function exportTransactions(userId, filters, signal) {
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await transactionQuery(userId, filters, false)
      .range(offset, offset + 999)
      .abortSignal(signal);
    if (error) throw error;
    if (!data.length) return rows;
    rows.push(...data);
    offset += data.length;
  }
}

export async function saveRow(table, userId, values, id) {
  const query = id
    ? supabase.from(table).update(values).eq("id", id).eq("user_id", userId)
    : supabase.from(table).insert({ ...values, user_id: userId });
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, userId, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error) throw error;
}

export async function listMonthTransactions(userId, month, signal) {
  const { start, end } = monthBounds(month);
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,type,amount,category_id,date")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", end)
      .order("date")
      .order("id")
      .range(offset, offset + 999)
      .abortSignal(signal);
    if (error) throw error;
    if (!data.length) return rows;
    rows.push(...data);
    offset += data.length;
  }
}

export async function listBudgets(userId, month, signal) {
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("budgets")
      .select("id,category_id,amount,month")
      .eq("user_id", userId)
      .eq("month", `${month}-01`)
      .order("id")
      .range(offset, offset + 999)
      .abortSignal(signal);
    if (error) throw error;
    if (!data.length) return rows;
    rows.push(...data);
    offset += data.length;
  }
}
