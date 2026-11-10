import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drainQueue} from '../src/lib/syncEngine.js';
import {networkError} from '../src/lib/offlineStore.js';
test('synchronization preserves FIFO and stops at rejected operation',async()=>{
 const queue=[{key:1},{key:2},{key:3}];const sent=[];const errors=[];
 await drainQueue({operations:[...queue],send:async op=>{sent.push(op.key);if(op.key===2)throw {code:'23503'};},acknowledge:async op=>queue.splice(queue.findIndex(q=>q.key===op.key),1),reject:async(op,e)=>errors.push([op.key,e.code]),isNetworkError:networkError});
 assert.deepEqual(sent,[1,2]);assert.deepEqual(queue.map(q=>q.key),[2,3]);assert.deepEqual(errors,[[2,'23503']]);
});
test('ambiguous network failure is retained and retry uses original UUID',async()=>{
 const op={key:1,id:'fixed-client-uuid'};const sent=[];let ack=0;let fail=true;
 const run=()=>drainQueue({operations:[op],send:async row=>{sent.push(row.id);if(fail)throw new Error('Failed to fetch');},acknowledge:async()=>{ack++;},reject:async()=>assert.fail('network error must remain retryable'),isNetworkError:networkError});
 await run();assert.equal(ack,0);fail=false;await run();assert.equal(ack,1);assert.deepEqual(sent,['fixed-client-uuid','fixed-client-uuid']);
});
test('logout during a request prevents local data being restored',async()=>{
 let stopped=false;let ack=false;
 await drainQueue({operations:[{key:1},{key:2}],send:async()=>{stopped=true;},acknowledge:async()=>{ack=true;},reject:async()=>assert.fail(),isNetworkError:networkError,isStopped:()=>stopped});
 assert.equal(ack,false);
});
