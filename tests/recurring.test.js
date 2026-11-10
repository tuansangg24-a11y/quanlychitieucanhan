import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missingOccurrences,validateRecurring} from '../src/lib/recurring.js';
const rule={enabled:true,start_date:'2028-01-31',frequency:'monthly'};
test('monthly schedule remains anchored to day 31 across leap February',()=>{
 assert.deepEqual(missingOccurrences(rule,'2028-04-30'),['2028-01-31','2028-02-29','2028-03-31','2028-04-30']);
 assert.deepEqual(missingOccurrences({...rule,last_generated_on:'2028-02-29'},'2028-03-31'),['2028-03-31']);
});
test('weekly/yearly catch-up respects end dates, pause and today',()=>{
 assert.deepEqual(missingOccurrences({...rule,frequency:'weekly',end_date:'2028-02-14'},'2028-03-01'),['2028-01-31','2028-02-07','2028-02-14']);
 assert.deepEqual(missingOccurrences({...rule,start_date:'2028-02-29',frequency:'yearly'},'2032-02-29'),['2028-02-29','2029-02-28','2030-02-28','2031-02-28','2032-02-29']);
 assert.deepEqual(missingOccurrences({...rule,enabled:false}),[]);
 assert.deepEqual(missingOccurrences(rule,'2027-01-01'),[]);
});
test('recurring validation rejects category mismatch and backwards or invalid dates',()=>{
 const v={...rule,type:'expense',amount:'1000',category_id:'food',note:''};const c=[{id:'food',type:'expense'}];
 assert.equal(validateRecurring(v,c).amount,1000);
 assert.throws(()=>validateRecurring({...v,end_date:'2028-01-01'},c));assert.throws(()=>validateRecurring({...v,start_date:'2028-02-30'},c));assert.throws(()=>validateRecurring({...v,type:'income'},c));
});
