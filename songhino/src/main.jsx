
import React,{useState,useEffect,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
const KEY='so-ghi-no-v1';

/* Icons (Lucide-style, inline SVG) */
const I=(d)=>({size=20,className=''})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>);
const Plus=I(<><path d="M5 12h14"/><path d="M12 5v14"/></>);
const Check=I(<path d="M20 6 9 17l-5-5"/>);
const Pencil=I(<><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>);
const Trash=I(<><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/></>);
const Sun=I(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>);
const Moon=I(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>);
const Db=I(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></>);
const X=I(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
const Undo=I(<><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></>);
const Cal=I(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>);

const vnd=n=>(Number(n)||0).toLocaleString('vi-VN')+'đ';
const fmtDate=d=>{const [y,m,day]=(d||'').split('-');return day?`${day}/${m}/${y}`:d};
const today=()=>{const t=new Date();return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function load(){try{const r=localStorage.getItem(KEY);const a=r?JSON.parse(r):[];return Array.isArray(a)?a:[]}catch(e){return []}}

function Modal({title,onClose,children}){
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X/></button>
        </div>
        {children}
      </div>
    </div>);
}

const inp="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500";

function DebtForm({item,onSave,onClose}){
  const [name,setName]=useState(item?.name||'');
  const [amount,setAmount]=useState(item?String(item.amount):'');
  const [date,setDate]=useState(item?.date||today());
  const [err,setErr]=useState('');
  const shown=amount?Number(amount).toLocaleString('vi-VN'):'';
  const submit=()=>{
    if(!name.trim())return setErr('Vui lòng nhập tên người/khoản nợ');
    if(!(Number(amount)>0))return setErr('Số tiền phải lớn hơn 0');
    onSave({name:name.trim(),amount:Number(amount),date:date||today()});
  };
  return(
    <Modal title={item?'Sửa khoản nợ':'Thêm khoản nợ'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="text-sm text-slate-500 dark:text-slate-400">Tên người / khoản nợ</label>
          <input className={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="VD: Anh Minh" autoFocus/></div>
        <div><label className="text-sm text-slate-500 dark:text-slate-400">Số tiền (VND)</label>
          <input className={inp} inputMode="numeric" value={shown} onChange={e=>setAmount(e.target.value.replace(/\D/g,''))} placeholder="500.000"/></div>
        <div><label className="text-sm text-slate-500 dark:text-slate-400">Ngày ghi nợ</label>
          <input type="date" className={inp} value={date} onChange={e=>setDate(e.target.value)}/></div>
        {err&&<p className="text-sm text-rose-500">{err}</p>}
        <button onClick={submit} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[.98] text-white font-semibold py-3 transition">{item?'Lưu thay đổi':'Thêm khoản nợ'}</button>
      </div>
    </Modal>);
}

function Backup({debts,onImport,onClose}){
  const json=JSON.stringify(debts,null,2);
  const [text,setText]=useState('');
  const [msg,setMsg]=useState('');
  const exportFile=async()=>{
    const fname=`so-ghi-no-${today()}.txt`;
    try{
      if(Capacitor.isNativePlatform()){
        const r=await Filesystem.writeFile({path:fname,data:json,directory:Directory.Cache,encoding:Encoding.UTF8});
        await Share.share({title:'Sao lưu Sổ Ghi Nợ',url:r.uri,dialogTitle:'Lưu file sao lưu'});
        setMsg('Đã tạo file sao lưu.');
      }else{
        const a=document.createElement('a');
        a.href=URL.createObjectURL(new Blob([json],{type:'text/plain'}));
        a.download=fname;document.body.appendChild(a);a.click();a.remove();
        setMsg('Đã tạo file sao lưu.');
      }
    }catch(e){setMsg('Không tạo được file, hãy dùng nút "Sao chép".')}
  };
  const copy=async()=>{try{await navigator.clipboard.writeText(json);setMsg('Đã sao chép dữ liệu JSON.')}catch(e){setMsg('Hãy nhấn giữ vào ô dữ liệu để chọn và sao chép thủ công.')}};
  const doImport=(raw)=>{
    try{
      const a=JSON.parse(raw);
      if(!Array.isArray(a))throw 0;
      const ok=a.filter(x=>x&&typeof x.name==='string'&&!isNaN(Number(x.amount))).map(x=>({
        id:String(x.id||uid()),name:x.name,amount:Number(x.amount),date:x.date||today(),status:x.status==='paid'?'paid':'pending'}));
      if(!ok.length&&a.length)throw 0;
      if(confirm(`Khôi phục ${ok.length} khoản nợ? Dữ liệu hiện tại sẽ bị thay thế.`)){onImport(ok);onClose()}
    }catch(e){setMsg('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại JSON.')}
  };
  const onFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>doImport(String(r.result));r.readAsText(f);e.target.value=''};
  return(
    <Modal title="Sao lưu & Khôi phục" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Xuất dữ liệu</p>
        <div className="flex gap-2">
          <button onClick={exportFile} className="flex-1 rounded-xl bg-indigo-600 text-white font-semibold py-2.5">Tải file .txt</button>
          <button onClick={copy} className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold py-2.5">Sao chép</button>
        </div>
        <textarea readOnly value={json} rows={4} className={inp+" font-mono text-xs"}/>
        <hr className="border-slate-200 dark:border-slate-800"/>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nhập dữ liệu</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} placeholder="Dán đoạn JSON vào đây…" className={inp+" font-mono text-xs"}/>
        <div className="flex gap-2">
          <button onClick={()=>doImport(text)} disabled={!text.trim()} className="flex-1 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-semibold py-2.5">Khôi phục từ text</button>
          <label className="flex-1 text-center cursor-pointer rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold py-2.5">Tải file .txt
            <input type="file" accept=".txt,text/plain,application/json" className="hidden" onChange={onFile}/></label>
        </div>
        {msg&&<p className="text-sm text-indigo-600 dark:text-indigo-400">{msg}</p>}
      </div>
    </Modal>);
}

function App(){
  const [debts,setDebts]=useState(load);
  const [tab,setTab]=useState('pending');
  const [dark,setDark]=useState(()=>{try{const t=localStorage.getItem(KEY+'-theme');if(t)return t==='dark'}catch(e){}return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches});
  const [form,setForm]=useState(null);
  const [backup,setBackup]=useState(false);

  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(debts))}catch(e){}},[debts]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem(KEY+'-theme',dark?'dark':'light')}catch(e){}},[dark]);

  const total=useMemo(()=>debts.filter(d=>d.status==='pending').reduce((s,d)=>s+d.amount,0),[debts]);
  const pendingCount=debts.filter(d=>d.status==='pending').length;
  const list=useMemo(()=>debts.filter(d=>d.status===tab).sort((a,b)=>b.date.localeCompare(a.date)),[debts,tab]);

  const save=data=>{
    if(form&&form.id)setDebts(ds=>ds.map(d=>d.id===form.id?{...d,...data}:d));
    else setDebts(ds=>[{id:uid(),status:'pending',...data},...ds]);
    setForm(null);
  };
  const toggle=id=>setDebts(ds=>ds.map(d=>d.id===id?{...d,status:d.status==='paid'?'pending':'paid'}:d));
  const remove=d=>{if(confirm(`Xóa khoản nợ "${d.name}"?`))setDebts(ds=>ds.filter(x=>x.id!==d.id))};

  return(
    <div className="min-h-screen mx-auto max-w-md pb-28 text-slate-900 dark:text-slate-100">
      <header className="px-4 pt-5 pb-6 rounded-b-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-slate-800 dark:to-indigo-950 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-80">Sổ Ghi Nợ</span>
          <div className="flex gap-1">
            <button onClick={()=>setBackup(true)} className="p-2 rounded-full hover:bg-white/15" aria-label="Sao lưu"><Db/></button>
            <button onClick={()=>setDark(!dark)} className="p-2 rounded-full hover:bg-white/15" aria-label="Đổi giao diện">{dark?<Sun/>:<Moon/>}</button>
          </div>
        </div>
        <p className="mt-4 text-xs tracking-[.2em] font-semibold opacity-80">TỔNG NỢ HIỆN CÓ</p>
        <p className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight break-words">{vnd(total)}</p>
        <p className="mt-2 text-sm opacity-80">{pendingCount} khoản chưa thanh toán</p>
      </header>

      <div className="px-4 mt-5">
        <div className="flex p-1 rounded-2xl bg-slate-200 dark:bg-slate-800">
          {[['pending','Đang nợ'],['paid','Đã thanh toán']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} className={"flex-1 py-2.5 rounded-xl text-sm font-semibold transition "+(tab===k?'bg-white dark:bg-slate-950 shadow text-indigo-600 dark:text-indigo-400':'text-slate-500 dark:text-slate-400')}>{l}</button>))}
        </div>
      </div>

      <main className="px-4 mt-4 space-y-3">
        {list.length===0&&(
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-2">{tab==='pending'?'🎉':'📭'}</p>
            <p>{tab==='pending'?'Không có khoản nợ nào. Nhấn + để thêm.':'Chưa có khoản nào được thanh toán.'}</p>
          </div>)}
        {list.map(d=>(
          <article key={d.id} className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={"font-semibold truncate "+(d.status==='paid'?'line-through opacity-60':'')}>{d.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Cal size={13}/>{fmtDate(d.date)}</p>
              </div>
              <p className={"text-lg font-bold whitespace-nowrap "+(d.status==='paid'?'text-emerald-500':'text-rose-500')}>{vnd(d.amount)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>toggle(d.id)} className={"flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold "+(d.status==='paid'?'bg-amber-500/15 text-amber-600 dark:text-amber-400':'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400')}>
                {d.status==='paid'?<><Undo size={16}/>Chưa trả</>:<><Check size={16}/>Đã trả</>}</button>
              <button onClick={()=>setForm(d)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"><Pencil size={16}/>Sửa</button>
              <button onClick={()=>remove(d)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400"><Trash size={16}/>Xóa</button>
            </div>
          </article>))}
      </main>

      <button onClick={()=>setForm({})} aria-label="Thêm khoản nợ"
        style={{bottom:'calc(1.25rem + env(safe-area-inset-bottom, 0px))'}}
        className="fixed right-5 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center transition"><Plus size={28}/></button>

      {form&&<DebtForm item={form.id?form:null} onSave={save} onClose={()=>setForm(null)}/>}
      {backup&&<Backup debts={debts} onImport={setDebts} onClose={()=>setBackup(false)}/>}
    </div>);
}
createRoot(document.getElementById('root')).render(<App/>);
