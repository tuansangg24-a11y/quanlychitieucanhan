import {drainQueue} from './syncEngine.js';
import * as remote from './remoteApi';
import {supabase} from './supabase';
import {clearOffline,readState,updateState,networkError,overlay,enqueue} from './offlineStore.js';
import {dataError} from './dataError';
export const changed=()=>window.dispatchEvent(new Event('finance-sync'));
const locks=new Map();
const disabled=new Set();
export const enableOffline=userId=>disabled.delete(userId);
export function stopOffline(userId) { disabled.add(userId); return exclusive(userId,()=>clearOffline(userId)); }
function exclusive(userId,fn) {
 if(navigator.locks) return navigator.locks.request(`finance-${userId}`,fn);
 const next=(locks.get(userId)||Promise.resolve()).catch(()=>{}).then(fn);
 locks.set(userId,next); return next;
}
export async function syncQueue(userId) {
 return exclusive(userId,async()=>{
  if(!navigator.onLine || disabled.has(userId)) return;
  let state=await readState(userId);
  await drainQueue({
   operations:state.queue,
   isStopped:()=>disabled.has(userId),
   isNetworkError:networkError,
   send:async op=>{
    let query;
    if(op.kind==='insert') query=supabase.from('transactions').upsert({...op.values,id:op.id,user_id:userId},{onConflict:'id',ignoreDuplicates:true});
    else if(op.kind==='update') query=supabase.from('transactions').update(op.values).eq('user_id',userId).eq('id',op.id).select('id').single();
    else query=supabase.from('transactions').delete().eq('user_id',userId).eq('id',op.id);
    const {error}=await query; if(error) throw error;
   },
   acknowledge:op=>updateState(userId,s=>{
    s.transactions=overlay(s.transactions,[op]).map(({pending,...r})=>r);
    s.queue=s.queue.filter(q=>q.key!==op.key);
   }),
   reject:(op,error)=>updateState(userId,s=>{const q=s.queue.find(q=>q.key===op.key);if(q)q.error=dataError(error);})
  });
  changed();
 });
}
export async function queueWrite(userId,values,id,remove=false) {
 const rowId=id||crypto.randomUUID();
 await exclusive(userId,async()=>{
  if(disabled.has(userId)) throw new Error('Phiên đăng nhập đã kết thúc.');
  await updateState(userId,s=>enqueue(s,{key:crypto.randomUUID(),kind:remove?'delete':id?'update':'insert',id:rowId,values,created_at:new Date().toISOString()}));
 });
 changed(); await syncQueue(userId); return {id:rowId};
}
export async function offlineTransactions(userId,signal) {
 return exclusive(userId,async()=>{
 if(disabled.has(userId)) return [];
 try {
  if(!navigator.onLine) throw new Error('offline');
  const rows=await remote.exportTransactions(userId,{min:'',max:''},signal);
  if(!disabled.has(userId)) await updateState(userId,s=>{s.transactions=rows;s.loaded=true;});
 } catch(e) {if(signal?.aborted || !networkError(e)) throw e;}
 if(disabled.has(userId)) return [];
 const s=await readState(userId); return overlay(s.transactions,s.queue);
 });
}
export async function cachedRead(userId,key,fetcher) {
 if(disabled.has(userId)) return [];
 try {
  if(!navigator.onLine) throw new Error('offline');
  const rows=await fetcher(); if(disabled.has(userId)) return []; await updateState(userId,s=>{if(key.startsWith('budget:')) s.budgets[key]=rows;else s[key]=rows;}); return rows;
 }catch(e){if(!networkError(e))throw e;const s=await readState(userId);return key.startsWith('budget:')?s.budgets[key]||[]:s[key]||[];}
}
