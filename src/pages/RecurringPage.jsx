import {useEffect,useState} from 'react';
import {useData} from '../data/DataProvider';
import {saveRow,deleteRow} from '../lib/api';
import {listRecurring,generateRecurring} from '../lib/recurringApi';
import {validateRecurring} from '../lib/recurring';
import {dataError} from '../lib/dataError';
import {formatMoney,todayVN} from '../lib/finance';
import Modal from '../components/Modal';
import Feedback from '../components/Feedback';
import ConfirmDelete from '../components/ConfirmDelete';
const labels={weekly:'Hằng tuần',monthly:'Hằng tháng',yearly:'Hằng năm'};
function RecurringForm({rule,categories,onClose,onSaved,userId}) {
 const [v,setV]=useState(()=>rule?{...rule,amount:String(rule.amount),end_date:rule.end_date||''}:{type:'expense',amount:'',category_id:categories.find(c=>c.type==='expense')?.id||'',note:'',frequency:'monthly',start_date:todayVN(),end_date:'',enabled:true});
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const change=(key,value)=>setV(s=>({...s,[key]:value,...(key==='type'?{category_id:categories.find(c=>c.type===value)?.id||''}:{})}));
 async function submit(e){e.preventDefault();if(busy)return;setBusy(true);setError('');try{const payload=validateRecurring(v,categories);await saveRow('recurring_transactions',userId,payload,rule?.id);onSaved();}catch(e){setError(e instanceof Error?e.message:dataError(e));}finally{setBusy(false);}}
 return <Modal title={rule?'Sửa giao dịch định kỳ':'Thêm giao dịch định kỳ'} busy={busy} onClose={onClose}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
 <label className="field">Loại<select value={v.type} onChange={e=>change('type',e.target.value)}><option value="expense">Chi tiêu</option><option value="income">Thu nhập</option></select></label>
 <label className="field">Số tiền (VND)<input required inputMode="numeric" pattern="[0-9]{1,15}" maxLength={15} value={v.amount} onChange={e=>change('amount',e.target.value)}/></label>
 <label className="field">Danh mục<select required value={v.category_id} onChange={e=>change('category_id',e.target.value)}>{categories.filter(c=>c.type===v.type).map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></label>
 <label className="field">Tần suất<select value={v.frequency} onChange={e=>change('frequency',e.target.value)}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label className="field">Ngày bắt đầu<input type="date" required min="1900-01-01" max="2099-12-31" value={v.start_date} onChange={e=>change('start_date',e.target.value)}/></label>
 <label className="field">Ngày kết thúc (tùy chọn)<input type="date" min={v.start_date} value={v.end_date} onChange={e=>change('end_date',e.target.value)}/></label>
 <label className="field">Ghi chú<textarea maxLength={2000} value={v.note} onChange={e=>change('note',e.target.value)}/></label>
 <label className="field">Trạng thái<select value={String(v.enabled)} onChange={e=>change('enabled',e.target.value==='true')}><option value="true">Đang bật</option><option value="false">Tạm dừng</option></select></label>
 <p className="text-xs leading-6 text-stone-500">Các kỳ đến hạn được tạo khi mở app hoặc bấm Tạo bù. Ngày 31 sẽ dùng ngày cuối tháng ngắn. Bật lại sẽ tạo bù các kỳ trong thời gian tạm dừng. Sửa lịch không thay đổi giao dịch đã tạo; các kỳ trước lần tạo gần nhất được giữ nguyên.</p>
 {error&&<Feedback error>{error}</Feedback>}<div className="flex justify-end gap-3"><button type="button" className="secondary" onClick={onClose}>Hủy</button><button className="primary">{busy?'Đang lưu…':'Lưu định kỳ'}</button></div>
 </fieldset></form></Modal>;
}
export default function RecurringPage(){
 const {userId,categories}=useData();const [rows,setRows]=useState([]);const [revision,setRevision]=useState(0);const [editor,setEditor]=useState(null);const [deleting,setDeleting]=useState(null);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');listRecurring(userId,c.signal).then(r=>{if(!c.signal.aborted)setRows(r);}).catch(e=>{if(!c.signal.aborted)setError(dataError(e));}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[userId,revision]);
 const reload=()=>setRevision(n=>n+1);
 async function generate(){if(busy)return;setBusy(true);setError('');try{const count=await generateRecurring(userId);setNotice(`Đã tạo ${count} giao dịch còn thiếu.`);reload();window.dispatchEvent(new Event('finance-sync'));}catch(e){setError(dataError(e));}finally{setBusy(false);}}
 async function toggle(r){if(busy)return;setBusy(true);setError('');try{const {id,user_id,created_at,last_generated_on,...values}=r;await saveRow('recurring_transactions',userId,{...values,enabled:!r.enabled},id);reload();}catch(e){setError(dataError(e));}finally{setBusy(false);}}
 return <><div className="page-heading"><div><p className="eyebrow">Nhẹ việc ghi chép</p><h1>Giao dịch định kỳ</h1></div><button className="primary" onClick={()=>setEditor({})}>+ Thêm định kỳ</button></div><div className="mb-5 flex gap-3"><button className="secondary" disabled={busy} onClick={generate}>{busy?'Đang xử lý…':'Tạo bù đến hôm nay'}</button><button className="text-button" onClick={reload}>Làm mới</button></div>{error&&<Feedback error>{error}</Feedback>}{notice&&<Feedback>{notice}</Feedback>}<p className="my-5 text-sm text-stone-500">Ứng dụng tạo các kỳ còn thiếu khi bạn mở app có mạng. Cần kết nối mạng để quản lý lịch của tài khoản.</p>{loading?<p role="status">Đang tải lịch…</p>:<ul className="grid gap-4 sm:grid-cols-2">{rows.map(r=><li className="panel p-5" key={r.id}><h2 className="font-semibold">{categories.find(c=>c.id===r.category_id)?.name} · {formatMoney(r.amount)}</h2><p className="mt-2 text-sm">{labels[r.frequency]} · {r.enabled?'Đang bật':'Tạm dừng'}</p><p className="mt-2 text-xs text-stone-500">Từ {r.start_date}{r.end_date?` đến ${r.end_date}`:''} · Lần tạo gần nhất: {r.last_generated_on||'Chưa tạo'}</p><p className="mt-2 break-words text-sm">{r.note}</p><div className="mt-3 flex flex-wrap justify-end gap-2"><button className="text-button" disabled={busy} onClick={()=>toggle(r)}>{r.enabled?'Tạm dừng':'Bật lại'}</button><button className="text-button" onClick={()=>setEditor({rule:r})}>Sửa</button><button className="text-button text-red-700" onClick={()=>setDeleting(r)}>Xóa</button></div></li>)}</ul>}{!loading&&!error&&!rows.length&&<p className="panel p-8 text-center">Chưa có giao dịch định kỳ. Thêm tiền nhà, internet hoặc lương tháng.</p>}{editor&&<RecurringForm {...{userId,categories}} rule={editor.rule} onClose={()=>setEditor(null)} onSaved={()=>{setEditor(null);setNotice('Đã lưu lịch. Bấm Tạo bù để tạo các kỳ đến hạn.');reload();}}/>}{deleting&&<ConfirmDelete title="Xóa lịch định kỳ?" description="Các giao dịch đã tạo được giữ nguyên. Lịch này sẽ không tạo thêm giao dịch." onClose={()=>setDeleting(null)} action={()=>deleteRow('recurring_transactions',userId,deleting.id)} onDeleted={()=>{setDeleting(null);reload();}}/>}</>;
}
