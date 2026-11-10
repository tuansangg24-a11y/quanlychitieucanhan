// The runner stops at the first failure, leaving that operation and its successors intact.
export async function drainQueue({operations,send,acknowledge,reject,isNetworkError,isStopped=()=>false}) {
 for(const op of operations) {
  if(isStopped()) break;
  try {
   await send(op);
   if(isStopped()) break;
   await acknowledge(op);
  }catch(error){
   if(!isStopped() && !isNetworkError(error)) await reject(op,error);
   break;
  }
 }
}
