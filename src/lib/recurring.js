import {addDays,addMonths,addYears,format,parseISO} from 'date-fns';
import {todayVN,validateTransaction} from './finance.js';
export function missingOccurrences(rule,today=todayVN()) {
 if(!rule.enabled) return [];
 const start=parseISO(rule.start_date);const dates=[];
 for(let n=0;;n++) {
  const date=format(rule.frequency==='weekly'?addDays(start,n*7):rule.frequency==='monthly'?addMonths(start,n):addYears(start,n),'yyyy-MM-dd');
  if(date>today || (rule.end_date && date>rule.end_date)) break;
  if(!rule.last_generated_on || date>rule.last_generated_on) dates.push(date);
 }
 return dates;
}
export function validateRecurring(values,categories) {
 const payload=validateTransaction({...values,date:values.start_date},categories);
 if(!['weekly','monthly','yearly'].includes(values.frequency)) throw new Error('Tần suất chưa hợp lệ.');
 if(values.start_date<'1900-01-01' || values.start_date>'2099-12-31') throw new Error('Ngày bắt đầu phải trong khoảng 1900–2099.');
 if(values.end_date) {
  validateTransaction({...values,date:values.end_date},categories);
  if(values.end_date<values.start_date) throw new Error('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
 }
 const {date,...rest}=payload;
 return {...rest,frequency:values.frequency,start_date:values.start_date,end_date:values.end_date||null,enabled:values.enabled};
}
