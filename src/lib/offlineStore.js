// One record per user; mutations are atomic IndexedDB read/write transactions.
const DB='so-chi-tieu-offline-v1';
export const emptyState=()=>({transactions:[],categories:[],budgets:{},queue:[],loaded:false});
export function updateState(userId, change) {
 return new Promise((resolve,reject)=>{
  const open=indexedDB.open(DB,1);
  open.onupgradeneeded=()=>open.result.createObjectStore('users');
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{
   const db=open.result; const tx=db.transaction('users','readwrite'); const store=tx.objectStore('users');
   let result; const get=store.get(userId);
   get.onsuccess=()=>{try { const state=get.result||emptyState(); result=change(state); if(result===null) store.delete(userId); else store.put(state,userId); } catch(e){reject(e);tx.abort();}};
   tx.oncomplete=()=>{db.close();resolve(result);}; tx.onerror=()=>{db.close();reject(tx.error);};
  };
 });
}
export const readState=userId=>updateState(userId,s=>structuredClone(s));
export const clearOffline=userId=>updateState(userId,()=>null);
export const networkError=e=>!e?.code && /fetch|network|offline|load failed/i.test(`${e?.message||''} ${e?.details||''}`);
export function overlay(rows,queue) {
 const map=new Map(rows.map(r=>[r.id,{...r}]));
 for(const op of queue) {
  if(op.kind==='delete') map.delete(op.id);
  else map.set(op.id,{...map.get(op.id),...op.values,id:op.id,pending:true});
 }
 return [...map.values()];
}
export function enqueue(state,op) {
 // A corrected failed write replaces that write without dropping later operations.
 const failed=state.queue.find(q=>q.id===op.id && q.error && q.kind!=='delete' && op.kind!=='delete');
 if(failed) { failed.values={...failed.values,...op.values}; delete failed.error; }
 else state.queue.push(op);
}
