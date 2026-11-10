import { todayVN, monthBounds } from './finance.js';
import { shiftMonth } from './statistics.js';

export const DEMO_USER = 'demo';
const KEY = 'so-chi-tieu-demo-v1';
export function seedDemo(today = todayVN()) {
  const names = ['Ăn uống', 'Đi lại', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Sức khỏe', 'Học tập', 'Khác', 'Lương', 'Khác'];
  const icons = ['🍜','🛵','🏠','🛍️','🎬','💊','📚','📌','💼','📌'];
  const colors = ['#F97316','#3B82F6','#8B5CF6','#EC4899','#EAB308','#EF4444','#06B6D4','#64748B','#22C55E','#64748B'];
  const categories = names.map((name,i) => ({id:`demo-category-${i}`, name, emoji:icons[i], color:colors[i], type:i<8?'expense':'income'}));
  const transactions = [];
  for (const month of [today.slice(0,7), shiftMonth(today.slice(0,7),-1)]) {
    for (let i=0;i<20;i++) {
      const c = i < 10 ? i : [0,1,0,3,4,5,6,7,0,1][i-10];
      const day = month === today.slice(0,7) ? 1 + i % Number(today.slice(8)) : 1+i;
      transactions.push({id:`demo-${month}-${i}`, type:categories[c].type, category_id:categories[c].id, amount:(month === today.slice(0,7) ? 1 : 0.9)*[65000,45000,4500000,350000,180000,120000,250000,80000,18000000,900000][c], date:`${month}-${String(day).padStart(2,'0')}`, note:['Bữa ăn cùng gia đình','Xăng xe','Tiền thuê nhà','Đồ dùng cá nhân','Xem phim','Thuốc và chăm sóc','Khóa học','Chi phí khác','Lương tháng','Làm thêm'][c], created_at:new Date().toISOString()});
    }
  }
  const budgets = [400000,150000,4000000].map((amount,i)=>({id:`demo-budget-${i}`,category_id:categories[i].id,amount,month:`${today.slice(0,7)}-01`,type:'expense'}));
  return {categories,transactions,budgets,recurring_transactions:[]};
}
export function readDemo() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const data = seedDemo();
  localStorage.setItem(KEY,JSON.stringify(data));
  return data;
}
export function writeDemo(data) { localStorage.setItem(KEY,JSON.stringify(data)); }
export function filterRows(rows, filters = {}) {
  const bounds = filters.month ? monthBounds(filters.month) : null;
  return rows.filter(r => (!bounds || (r.date>=bounds.start && r.date<bounds.end)) && (!filters.type || r.type===filters.type) && (!filters.category || r.category_id===filters.category) && (!filters.search || (r.note||'').toLocaleLowerCase('vi').includes(filters.search.toLocaleLowerCase('vi'))) && (filters.min === undefined || filters.min === '' || r.amount>=filters.min) && (filters.max === undefined || filters.max === '' || r.amount<=filters.max)).sort((a,b)=>b.date.localeCompare(a.date)||(b.created_at||'').localeCompare(a.created_at||'')||b.id.localeCompare(a.id));
}
export function mutateLocal(data, table, values, id, remove=false) {
  const rows = data[table] ||= [];
  const old = rows.find(r=>r.id===id);
  if (id && !old) throw {code:'PGRST116'};
  if (table==='categories') {
    if (rows.some(r=>r.id!==id && r.name===values?.name && r.type===values?.type)) throw {code:'23505'};
    if ((remove || old?.type!==values?.type) && ['transactions','budgets','recurring_transactions'].some(t=>(data[t]||[]).some(r=>r.category_id===id))) throw {code:'23503'};
  } else if (!remove) {
    if (!data.categories.some(c=>c.id===values.category_id && c.type===values.type)) throw {code:'23503'};
    if (table==='budgets' && rows.some(r=>r.id!==id && r.category_id===values.category_id && r.month===values.month)) throw {code:'23505'};
  }
  if (remove) data[table]=rows.filter(r=>r.id!==id);
  else if (old) Object.assign(old,values);
  else rows.push({...values,id:id||crypto.randomUUID(),created_at:new Date().toISOString()});
  return old || rows.at(-1);
}
