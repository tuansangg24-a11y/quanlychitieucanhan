import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
test('README includes demo and links to an existing migration',()=>{
 const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
 assert.ok(existsSync(new URL('../supabase/migrations/20261110_recurring_transactions.sql',import.meta.url)));
 assert.match(readme,/\/demo/);assert.match(readme,/20261110_recurring_transactions.sql/);
});
test('recurring migration includes owner policies and durable deduplication',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110_recurring_transactions.sql',import.meta.url),'utf8');
 assert.match(sql,/recurring_transactions enable row level security/);assert.match(sql,/recurring_occurrences enable row level security/);
 assert.match(sql,/security invoker/);assert.match(sql,/for update loop/);assert.match(sql,/primary key\(recurring_id,occurrence_date\)/);assert.match(sql,/foreign key\(category_id,user_id,type\)/);
});
