import {useEffect,useState} from 'react';
import {readState} from '../lib/offlineStore';
import {syncQueue} from '../lib/offlineApi';
export default function SyncStatus({userId}) {
 const [state,setState]=useState({queue:[]}); const [online,setOnline]=useState(navigator.onLine); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  const refresh=()=>readState(userId).then(s=>{if(active)setState(s);}).catch(e=>{if(active)setError(`Không đọc được bộ nhớ ngoại tuyến: ${e.message}`);});
  const sync=()=>{setOnline(navigator.onLine);syncQueue(userId).catch(e=>{if(active)setError(`Không đồng bộ được: ${e.message}`);});};
  const offline=()=>setOnline(false);
  refresh();sync();window.addEventListener('finance-sync',refresh);window.addEventListener('online',sync);window.addEventListener('offline',offline);
  return()=>{active=false;window.removeEventListener('finance-sync',refresh);window.removeEventListener('online',sync);window.removeEventListener('offline',offline);};
 },[userId]);
 const failed=state.queue.find(q=>q.error);
 return <aside className="mx-auto max-w-6xl px-5 py-3 text-sm" aria-live="polite"><span>{online?'Có kết nối mạng':'Ngoại tuyến'} · {state.queue.length} thao tác chờ đồng bộ</span>{state.queue.length>0 && <><p className="mt-1 text-xs text-stone-500">Đăng xuất sẽ xóa các thao tác chưa đồng bộ trên thiết bị này.</p><button className="text-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await syncQueue(userId);}catch(e){setError(e.message);}finally{setBusy(false);}}}>Thử đồng bộ</button></>}{failed && <p role="alert" className="text-red-700">Giao dịch {failed.values?.note || failed.id}: {failed.error} Hàng đợi được giữ lại. Sửa giao dịch rồi thử đồng bộ.</p>}{error && <p role="alert" className="text-red-700">{error}</p>}</aside>;
}
