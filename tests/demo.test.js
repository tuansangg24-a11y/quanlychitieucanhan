import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedDemo,filterRows,mutateLocal} from '../src/lib/localData.js';
import {budgetProgress,summarizeMonth} from '../src/lib/statistics.js';
test('demo has forty transactions, two months and all three budget levels',()=>{
 const data=seedDemo('2026-11-10'); assert.equal(data.transactions.length,40);
 const stats=summarizeMonth(data.transactions,data.categories,'2026-11');
 assert.deepEqual(data.budgets.map(b=>budgetProgress(stats.categoryTotals.get(b.category_id),b.amount).state),['normal','warning','over']);
 assert.equal(filterRows(data.transactions,{month:'2026-11'}).length,20);
});
test('local CRUD preserves references, duplicate budgets and literal search',()=>{
 const d=seedDemo('2026-11-10'); assert.throws(()=>mutateLocal(d,'categories',null,d.categories[0].id,true));
 const row=mutateLocal(d,'transactions',{category_id:d.categories[0].id,type:'expense',amount:100,date:'2026-11-10',note:'50%_'});
 assert.equal(filterRows(d.transactions,{search:'%_'}).length,1);
 mutateLocal(d,'transactions',{...row,amount:200},row.id); assert.equal(row.amount,200);
 mutateLocal(d,'transactions',null,row.id,true); assert.ok(!d.transactions.includes(row));
});
