import {supabase} from './supabase';
import {DEMO_USER,readDemo,writeDemo} from './localData.js';
import {missingOccurrences} from './recurring.js';
export async function listRecurring(userId,signal) {
 if(userId===DEMO_USER)return readDemo().recurring_transactions||[];
 const rows=[];
 for(let offset=0;;) {
  const {data,error}=await supabase.from('recurring_transactions').select('*').eq('user_id',userId).order('id').range(offset,offset+999).abortSignal(signal);
  if(error)throw error;if(!data.length)return rows;rows.push(...data);offset+=data.length;
 }
}
export async function generateRecurring(userId) {
 if(userId===DEMO_USER) {
  const data=readDemo();let count=0;
  for(const r of data.recurring_transactions||[]) {
   for(const date of missingOccurrences(r)) {
    const id=`recurring-${r.id}-${date}`;
    if(!data.transactions.some(t=>t.id===id))data.transactions.push({id,type:r.type,amount:r.amount,category_id:r.category_id,note:r.note,date,recurring_id:r.id,occurrence_date:date,created_at:new Date().toISOString()});
    r.last_generated_on=date;count++;
   }
  }
  writeDemo(data);return count;
 }
 if(!navigator.onLine)return 0;
 const {data,error}=await supabase.rpc('generate_recurring_transactions');if(error)throw error;return data;
}
