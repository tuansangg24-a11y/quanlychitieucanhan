import {queueWrite,offlineTransactions,cachedRead} from './offlineApi';
import * as remote from './remoteApi';
import { DEMO_USER, readDemo, writeDemo, filterRows, mutateLocal } from './localData.js';
export const PAGE_SIZE = 20;
export async function listCategories(userId, signal) { return userId===DEMO_USER ? readDemo().categories : cachedRead(userId,"categories",()=>remote.listCategories(userId,signal)); }
export async function exportTransactions(userId,filters,signal) { return userId===DEMO_USER ? filterRows(readDemo().transactions,filters) : filterRows(await offlineTransactions(userId,signal),filters); }
export async function listTransactions(userId,filters,page,signal) {

  const rows=await exportTransactions(userId,filters,signal);
  return {rows:rows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),count:rows.length};
}
export async function listMonthTransactions(userId,month,signal) { return exportTransactions(userId,{month},signal); }
export async function listBudgets(userId,month,signal) { return userId===DEMO_USER ? readDemo().budgets.filter(r=>r.month===`${month}-01`) : cachedRead(userId,`budget:${month}`,()=>remote.listBudgets(userId,month,signal)); }
export async function saveRow(table,userId,values,id) {
  if(userId!==DEMO_USER) return table === "transactions" ? queueWrite(userId,values,id) : remote.saveRow(table,userId,values,id);
  const data=readDemo(); const row=mutateLocal(data,table,values,id); writeDemo(data); return row;
}
export async function deleteRow(table,userId,id) {
  if(userId!==DEMO_USER) return table === "transactions" ? queueWrite(userId,null,id,true) : remote.deleteRow(table,userId,id);
  const data=readDemo(); mutateLocal(data,table,null,id,true); writeDemo(data);
}
