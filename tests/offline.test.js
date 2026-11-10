import {test} from 'node:test';
import assert from 'node:assert/strict';
import {overlay,enqueue,emptyState,networkError} from '../src/lib/offlineStore.js';
test('offline overlay applies insert update delete in order without mutating snapshot',()=>{
 const rows=[{id:'a',amount:1}];const queue=[{kind:'insert',id:'b',values:{amount:2}},{kind:'update',id:'b',values:{amount:3}},{kind:'delete',id:'a'}];
 assert.deepEqual(overlay(rows,queue),[{id:'b',amount:3,pending:true}]);assert.equal(rows.length,1);
});
test('failed writes retain sequence and accept corrections',()=>{
 const s=emptyState();enqueue(s,{id:'a',kind:'insert',values:{amount:1},error:'category'});enqueue(s,{id:'b',kind:'insert',values:{amount:2}});enqueue(s,{id:'a',kind:'update',values:{amount:3}});
 assert.equal(s.queue.length,2);assert.equal(s.queue[0].values.amount,3);assert.equal(s.queue[0].error,undefined);
 assert.equal(networkError({message:'Failed to fetch'}),true);assert.equal(networkError({code:'23503',message:'network'}),false);
});
