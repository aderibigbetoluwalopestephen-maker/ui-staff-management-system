// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ...rest of your file unchanged

const SUPABASE_URL = "https://ogjbsywfcfombvlpshnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9namJzeXdmY2ZvbWJ2bHBzaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTA5MzEsImV4cCI6MjA5ODI2NjkzMX0.FA3-GYKx-9CmHDX4E0xqWlnMA_zX9m6hU5DVGdyBj5w";

// FIX: Simplified client — extra global headers block RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// ── Palette ──
const NAVY  = "#0a1f5c";
const NAVY2 = "#071544";
const NAVYL = "#1a2f6e";
const GOLD  = "#C9A84C";
const GOLDL = "#fdf6e3";
const GOLDM = "#f0d99a";
const GREEN  = "#00472B";
const GREENL = "#e8f4ee";
const GREENM = "#c2ddd0";
const WHITE  = "#ffffff";
const LGRAY  = "#f0f4f8";

const DEPARTMENTS = ["Engineering","Design","Physics","Chemistry","Computing","Marketing","Sales","HR","Finance","Operations","Legal"];
const STATUS_OPS  = ["Active","On Leave","Probation","Terminated"];
const EMP_TYPES   = ["Full-time","Part-time","Contract","Intern"];

const LEAVE_CONFIGS = {
  "Maternity Leave":     { days:90,  label:"3 months", icon:"" },
  "Paternity Leave":     { days:14,  label:"2 weeks",  icon:"" },
  "Annual Leave":        { days:21,  label:"3 weeks",  icon:"" },
  "Sick Leave":          { days:14,  label:"2 weeks",  icon:"" },
  "Study Leave":         { days:180, label:"6 months", icon:"" },
  "Compassionate Leave": { days:7,   label:"1 week",   icon:"" },
  "Sabbatical Leave":    { days:365, label:"1 year",   icon:"" },
  "Unpaid Leave":        { days:30,  label:"1 month",  icon:"" },
  "Other":               { days:30,  label:"30 days",  icon:"" },
};
const LEAVE_TYPES = Object.keys(LEAVE_CONFIGS);
const ADMIN_CREDS = { username:"admin", password:"ui2024" };

const DEFAULT_FIELDS = [
  { id:"firstName",  label:"First Name",       section:0, type:"text",   required:true,  enabled:true,  system:true },
  { id:"lastName",   label:"Last Name",         section:0, type:"text",   required:true,  enabled:true,  system:true },
  { id:"dob",        label:"Date of Birth",     section:0, type:"date",   required:false, enabled:true,  system:false },
  { id:"gender",     label:"Gender",            section:0, type:"select", required:false, enabled:true,  system:false, options:["Male","Female","Non-binary","Prefer not to say"] },
  { id:"nationality",label:"Nationality",       section:0, type:"text",   required:false, enabled:true,  system:false },
  { id:"email",      label:"Email Address",     section:1, type:"email",  required:true,  enabled:true,  system:true },
  { id:"phone",      label:"Phone Number",      section:1, type:"tel",    required:true,  enabled:true,  system:true },
  { id:"address",    label:"Street Address",    section:1, type:"text",   required:false, enabled:true,  system:false },
  { id:"city",       label:"City",              section:1, type:"text",   required:false, enabled:true,  system:false },
  { id:"state",      label:"State / Region",    section:1, type:"text",   required:false, enabled:true,  system:false },
  { id:"jobTitle",   label:"Job Title",         section:2, type:"text",   required:true,  enabled:true,  system:true },
  { id:"department", label:"Department",        section:2, type:"select", required:true,  enabled:true,  system:true, options:DEPARTMENTS },
  { id:"employmentType",label:"Employment Type",section:2, type:"select", required:false, enabled:true,  system:false, options:EMP_TYPES },
  { id:"startDate",  label:"Start Date",        section:2, type:"date",   required:true,  enabled:true,  system:true },
  { id:"status",     label:"Status",            section:2, type:"select", required:false, enabled:true,  system:true, options:STATUS_OPS },
  { id:"emergencyName",     label:"Emergency Contact Name",     section:3, type:"text", required:false, enabled:true, system:false },
  { id:"emergencyRelation", label:"Emergency Contact Relation", section:3, type:"text", required:false, enabled:true, system:false },
  { id:"emergencyPhone",    label:"Emergency Contact Phone",    section:3, type:"tel",  required:false, enabled:true, system:false },
];

const SECTIONS = ["Personal Info","Contact","Employment","Emergency Contact"];

function genId(firstName, lastName, startDate) {
  const f = (firstName?.[0]||"X").toUpperCase();
  const l = (lastName?.[0]||"X").toUpperCase();
  const y = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
  return `UI-${f}${l}-${y}`;
}
function nowStr() {
  return new Date().toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function addDays(dateStr, days) {
  const d = new Date(dateStr); d.setDate(d.getDate()+days);
  return d.toISOString().split("T")[0];
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function getAutoReturnDate(leaveType, leaveStartDate) {
  if(!leaveType||!leaveStartDate) return "";
  const cfg=LEAVE_CONFIGS[leaveType]; if(!cfg) return "";
  return addDays(leaveStartDate, cfg.days);
}
function getLeaveCountdown(returnDate) {
  if(!returnDate) return null;
  const today=new Date(); today.setHours(0,0,0,0);
  const ret=new Date(returnDate); ret.setHours(0,0,0,0);
  const totalMs=ret-today;
  const totalDays=Math.ceil(totalMs/(1000*60*60*24));
  if(totalDays<0) return {expired:true,daysOverdue:Math.abs(totalDays)};
  if(totalDays===0) return {today:true,totalDays:0};
  const months=Math.floor(totalDays/30), weeks=Math.floor((totalDays%30)/7), days=totalDays%7;
  return {expired:false,today:false,totalDays,months,weeks,days};
}
function getLeaveProgress(leaveStartDate, returnDate) {
  if(!leaveStartDate||!returnDate) return 0;
  const start=new Date(leaveStartDate),end=new Date(returnDate),n=new Date();
  const total=end-start, elapsed=n-start;
  if(total<=0) return 100;
  return Math.min(100,Math.max(0,Math.round((elapsed/total)*100)));
}

// FIX: Compress image before storing to avoid row size limits
function compressImage(dataUrl, maxW=200, quality=0.7) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Supabase mapping ──
function toDb(form) {
  return {
    first_name: form.firstName||"",
    last_name: form.lastName||"",
    dob: form.dob||null,
    gender: form.gender||null,
    nationality: form.nationality||null,
    email: form.email||"",
    phone: form.phone||"",
    staff_email: form.staffEmail||null,
    alternate_email: form.alternateEmail||null,
    address: form.address||null,
    city: form.city||null,
    state: form.state||null,
    job_title: form.jobTitle||"",
    department: form.department||"",
    employment_type: form.employmentType||null,
    start_date: form.startDate||null,
    assumption_date: form.assumptionDate||null,
    pf_number: form.pfNumber||null,
    status: form.status||"Active",
    employee_id: form.employeeId||"",
    passport_photo: form.passportPhoto||null,
    leave_type: form.leaveType||null,
    return_date: form.returnDate||null,
    leave_start_date: form.leaveStartDate||null,
    emergency_name: form.emergencyName||null,
    emergency_relation: form.emergencyRelation||null,
    emergency_phone: form.emergencyPhone||null,
    custom_data: form._customFields
      ? JSON.stringify(form._customFields.reduce((acc,f)=>({...acc,[f.id]:form[f.id]||""}),{}))
      : null,
  };
}

function fromDb(row) {
  let customData = {};
  try { if(row.custom_data) customData = JSON.parse(row.custom_data); } catch(e){}
  return {
    id: row.id,
    firstName: row.first_name||"", lastName: row.last_name||"",
    dob: row.dob||"", gender: row.gender||"", nationality: row.nationality||"",
    email: row.email||"", phone: row.phone||"",
    staffEmail: row.staff_email||"", alternateEmail: row.alternate_email||"",
    address: row.address||"", city: row.city||"", state: row.state||"",
    jobTitle: row.job_title||"", department: row.department||"",
    employmentType: row.employment_type||"", startDate: row.start_date||"",
    assumptionDate: row.assumption_date||"", pfNumber: row.pf_number||"",
    status: row.status||"Active", employeeId: row.employee_id||"",
    passportPhoto: row.passport_photo||"",
    leaveType: row.leave_type||"", returnDate: row.return_date||"",
    leaveStartDate: row.leave_start_date||"",
    emergencyName: row.emergency_name||"",
    emergencyRelation: row.emergency_relation||"",
    emergencyPhone: row.emergency_phone||"",
    ...customData,
  };
}

function leaveReqFromDb(row) {
  return {
    id: row.id,
    employeeId: row.employee_id||"",
    staffName: row.staff_name||"",
    department: row.department||"",
    leaveType: row.leave_type||"",
    startDate: row.start_date||"",
    endDate: row.end_date||"",
    reason: row.reason||"",
    status: row.status||"Pending",
    adminNote: row.admin_note||"",
    createdAt: row.created_at||"",
    staffId: row.staff_id||null,
  };
}


// SHARED COMPONENTS

function Avatar({name,photo,size=36}){
  if(photo) return(
    <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",border:`2px solid ${GOLD}`,flexShrink:0}}>
      <img src={photo} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
    </div>
  );
  const i=[name?.split(" ")[0]?.[0],name?.split(" ")[1]?.[0]].filter(Boolean).join("").toUpperCase();
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:NAVY,display:"flex",
      alignItems:"center",justifyContent:"center",color:GOLD,fontWeight:700,
      fontSize:size*0.36,flexShrink:0,border:`2px solid ${GOLD}`}}>{i||"?"}</div>
  );
}
function Badge({label}){
  const map={
    Active:{bg:GREENL,color:"#003020",border:GREENM},
    "On Leave":{bg:GOLDL,color:"#7a5c10",border:GOLDM},
    Probation:{bg:"#eff6ff",color:"#1e40af",border:"#bfdbfe"},
    Terminated:{bg:"#fef2f2",color:"#991b1b",border:"#fecaca"},
    Pending:{bg:"#fffbeb",color:"#92400e",border:"#fde68a"},
    Approved:{bg:GREENL,color:GREEN,border:GREENM},
    Rejected:{bg:"#fef2f2",color:"#991b1b",border:"#fecaca"},
  };
  const c=map[label]||map.Active;
  return <span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,borderRadius:20,fontSize:11,fontWeight:600,padding:"2px 10px",whiteSpace:"nowrap"}}>{label}</span>;
}
function Field({label,error,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:12,fontWeight:600,color:NAVY,letterSpacing:0.3}}>{label}</label>
      {children}
      {error&&<span style={{fontSize:11,color:"#dc2626"}}>{error}</span>}
    </div>
  );
}
function FInput({value,onChange,placeholder,type="text",hasError,disabled}){
  return(
    <input type={type} value={value} placeholder={placeholder} onChange={onChange} disabled={disabled}
      style={{borderColor:hasError?"#dc2626":GREENM,width:"100%",boxSizing:"border-box",
        padding:"8px 10px",borderRadius:6,border:`1.5px solid ${GREENM}`,fontSize:13,
        background:disabled?"#f5f5f5":"#fff"}}/>
  );
}
function FSelect({value,onChange,options,hasError}){
  return(
    <select value={value} onChange={onChange}
      style={{borderColor:hasError?"#dc2626":GREENM,width:"100%",boxSizing:"border-box",
        padding:"8px 10px",borderRadius:6,border:`1.5px solid ${GREENM}`,fontSize:13,background:"#fff"}}>
      <option value="">Select…</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function FTextarea({value,onChange,placeholder,rows=3}){
  return(
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:6,
        border:`1.5px solid ${GREENM}`,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
  );
}
function PassportUpload({value,onChange}){
  const ref=useRef();
  async function handleFile(e){
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const compressed=await compressImage(ev.target.result);
      onChange(compressed);
    };
    reader.readAsDataURL(file);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div onClick={()=>ref.current.click()} style={{
        width:100,height:120,border:`2px dashed ${value?NAVY:GREENM}`,borderRadius:8,
        overflow:"hidden",cursor:"pointer",background:value?"#000":LGRAY,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {value
          ?<img src={value} alt="Passport" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<><div style={{fontSize:26,marginBottom:4}}>📷</div><div style={{fontSize:10,color:"#888",textAlign:"center",padding:"0 6px"}}>Click to upload</div></>}
        {value&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.55)",color:"#fff",fontSize:10,textAlign:"center",padding:3}}>Change</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
      <div style={{fontSize:10,color:"#999",textAlign:"center"}}>Passport photo<br/>(white bg preferred)</div>
    </div>
  );
}


// UIHeader — FIX: logo beside text

function UIHeader({rightContent}){
  return(
    <div style={{background:NAVY2,borderBottom:`3px solid ${GOLD}`}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",justifyContent:"space-between",alignItems:"center",height:68}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* University of Ibadan logo */}
          <img
            src="https://www.bing.com/th/id/OIP.B6Ay7P-bfic37pK32qd1yQAAAA?w=178&h=211&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2"
            alt="UI logo"
            style={{height:30,width:30,objectFit:"contain",flexShrink:0}}
            onError={e=>{
              // Fallback crest if image fails
              e.currentTarget.style.display="none";
              e.currentTarget.nextSibling.style.display="flex";
            }}
          />
          {/* Fallback circle crest */}
          <div style={{display:"none",width:50,height:50,borderRadius:"50%",background:GOLD,alignItems:"center",justifyContent:"center",fontWeight:900,color:NAVY2,fontSize:18,flexShrink:0}}>UI</div>
          {/* Text beside logo */}
          <div style={{lineHeight:1.2}}>
            <div style={{color:GOLD,fontSize:10,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>STAFF</div>
            <div style={{color:WHITE,fontSize:22,fontWeight:800,letterSpacing:1}}>DATA</div>
            <div style={{color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:1.5,textTransform:"uppercase"}}></div>
          </div>
        </div>
        <div>{rightContent}</div>
      </div>
    </div>
  );
}


// LEAVE COMPONENTS

function LeaveCountdownPill({returnDate}){
  const cd=getLeaveCountdown(returnDate);
  if(!cd) return <span style={{color:"#bbb",fontSize:11}}>—</span>;
  if(cd.expired) return <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{cd.daysOverdue}d overdue</span>;
  if(cd.today) return <span style={{background:GREENL,color:GREEN,border:`1px solid ${GREENM}`,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>Returns today!</span>;
  const parts=[]; if(cd.months>0)parts.push(`${cd.months}mo`); if(cd.weeks>0)parts.push(`${cd.weeks}w`); if(cd.days>0)parts.push(`${cd.days}d`);
  return <span style={{background:GOLDL,color:"#7a5c10",border:`1px solid ${GOLDM}`,borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",whiteSpace:"nowrap"}}>⏳ {parts.join(" ")} left</span>;
}
function LeaveInfoBanner({leaveType,leaveStartDate,returnDate}){
  if(!leaveType) return null;
  const cfg=LEAVE_CONFIGS[leaveType]; if(!cfg) return null;
  const cd=returnDate?getLeaveCountdown(returnDate):null;
  return(
    <div style={{background:GOLDL,border:`1px solid ${GOLDM}`,borderRadius:10,padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:20}}>{cfg.icon}</span>
        <div>
          <p style={{margin:0,fontWeight:700,color:"#7a5c10",fontSize:13}}>{leaveType}</p>
          <p style={{margin:0,fontSize:11,color:"#a07a20"}}>Standard duration: {cfg.label}</p>
        </div>
      </div>
      {returnDate&&cd&&<p style={{fontSize:12,color:"#7a5c10",margin:0,fontWeight:500,marginTop:4}}>
        {cd.expired?`⚠️ Return date was ${cd.daysOverdue} day${cd.daysOverdue===1?"":"s"} ago`:cd.today?"🔔 Expected to return today":`⏳ ${cd.totalDays} day${cd.totalDays===1?"":"s"} remaining`}
      </p>}
    </div>
  );
}
function LeaveCountdownPanel({staff}){
  const onLeave=staff.filter(s=>s.status==="On Leave");
  if(onLeave.length===0) return null;
  return(
    <div style={{background:WHITE,borderRadius:10,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${GREENM}`,background:GOLDL,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>🏖️</span>
        <p style={{fontWeight:600,color:"#7a5c10",fontSize:14,margin:0}}>Staff on leave ({onLeave.length})</p>
      </div>
      {onLeave.map((m,i)=>{
        const cd=getLeaveCountdown(m.returnDate);
        const progress=getLeaveProgress(m.leaveStartDate,m.returnDate);
        const cfg=LEAVE_CONFIGS[m.leaveType];
        const isOverdue=cd?.expired,isToday=cd?.today;
        return(
          <div key={m.id||i} style={{padding:"16px 18px",borderBottom:i<onLeave.length-1?`1px solid ${GREENL}`:"none",background:isOverdue?"#fff9f9":i%2===0?WHITE:GOLDL}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <Avatar name={`${m.firstName} ${m.lastName}`} photo={m.passportPhoto} size={38}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,color:NAVY2,fontWeight:700}}>{m.firstName} {m.lastName}</p>
                <p style={{margin:0,fontSize:11,color:"#888"}}>{cfg?.icon} {m.leaveType||"Leave"} · {m.department||"—"}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {isOverdue?<span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:20,fontSize:11,fontWeight:700,padding:"3px 10px"}}>⚠️ {cd.daysOverdue}d overdue</span>
                :isToday?<span style={{background:GREENL,color:GREEN,border:`1px solid ${GREENM}`,borderRadius:20,fontSize:11,fontWeight:700,padding:"3px 10px"}}>🔔 Returns today!</span>
                :cd?<div style={{textAlign:"right"}}><p style={{margin:0,fontSize:18,fontWeight:800,color:NAVY2,lineHeight:1}}>{cd.totalDays}</p><p style={{margin:0,fontSize:10,color:"#888"}}>days left</p></div>:null}
              </div>
            </div>
            {m.leaveStartDate&&m.returnDate&&!isOverdue&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#aaa"}}>Started {new Date(m.leaveStartDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                  <span style={{fontSize:10,color:"#aaa"}}>Returns {new Date(m.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
                </div>
                <div style={{height:6,background:"#e8e8e8",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${progress}%`,background:progress>80?`linear-gradient(90deg,${GOLD},#dc2626)`:`linear-gradient(90deg,${NAVY},${GOLD})`,borderRadius:4}}/>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ROLE SELECT

function RoleSelect({onSelectRole}){
  return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={
        <button onClick={()=>onSelectRole("admin")} style={{background:"transparent",border:`1.5px solid ${GOLD}`,borderRadius:4,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:700,color:GOLD,letterSpacing:0.5}}
          onMouseEnter={e=>{e.currentTarget.style.background=GOLD;e.currentTarget.style.color=NAVY2;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=GOLD;}}>
          🛡 Admin Portal
        </button>
      }/>
      <div style={{background:`linear-gradient(135deg,${NAVY2} 0%,${NAVY} 60%,#1a3080 100%)`,padding:"60px 24px 50px",textAlign:"center",borderBottom:`4px solid ${GOLD}`}}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:18,marginBottom:16}}>
          <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png" alt="UI" style={{height:80,width:80,objectFit:"contain"}} onError={e=>{e.currentTarget.style.display="none";}}/>
          <div style={{textAlign:"left"}}>
            <div style={{color:GOLD,fontSize:11,letterSpacing:4,fontWeight:600}}>UNIVERSITY OF IBADAN</div>
            <div style={{color:WHITE,fontSize:38,fontWeight:900,letterSpacing:2,lineHeight:1}}>Staff Data</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,letterSpacing:2}}>STAFF MANAGEMENT SYSTEM</div>
          </div>
        </div>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,margin:"0 0 40px"}}>Register staff, submit leave requests, and manage university personnel</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>onSelectRole("staff")} style={{background:GOLD,color:NAVY2,border:"none",borderRadius:6,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer",letterSpacing:0.5,boxShadow:"0 4px 20px rgba(201,168,76,0.4)"}}>
             Staff Registration
          </button>
          <button onClick={()=>onSelectRole("leave-request")} style={{background:"transparent",color:GOLD,border:`2px solid ${GOLD}`,borderRadius:6,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer",letterSpacing:0.5}}>
             Submit Leave Request
          </button>
        </div>
      </div>
      <div style={{maxWidth:900,margin:"48px auto",padding:"0 24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20}}>
        {[{icon:"📝",title:"Register",desc:"Submit your personal and employment details securely to the university system."},
          {icon:"📋",title:"Leave Requests",desc:"Apply for leave online. Admins review and approve requests in real time."},
          {icon:"⚡",title:"Instant",desc:"Records are immediately available to administrators upon submission."}].map(c=>(
          <div key={c.title} style={{background:WHITE,borderRadius:10,padding:"24px 20px",border:`1px solid ${GREENM}`,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:32,marginBottom:12}}>{c.icon}</div>
            <h3 style={{color:NAVY,fontSize:15,fontWeight:700,margin:"0 0 8px"}}>{c.title}</h3>
            <p style={{color:"#666",fontSize:13,margin:0,lineHeight:1.5}}>{c.desc}</p>
          </div>
        ))}
      </div>
      <p style={{color:"#aaa",fontSize:11,textAlign:"center",paddingBottom:32}}>© {new Date().getFullYear()} University of Ibadan · Staff Management System</p>
    </div>
  );
}


// LEAVE REQUEST FORM (Staff-facing)

function LeaveRequestForm({onBack, onSubmit, departments}){
  const [form, setForm] = useState({
    employeeId:"", staffName:"", department:"", leaveType:"",
    startDate:"", endDate:"", reason:""
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function setF(k,v){ setForm(f=>({...f,[k]:v})); if(errors[k]) setErrors(e=>({...e,[k]:undefined})); }

  function validate(){
    const e={};
    if(!form.employeeId.trim()) e.employeeId="Employee ID is required";
    if(!form.staffName.trim()) e.staffName="Your full name is required";
    if(!form.department) e.department="Department is required";
    if(!form.leaveType) e.leaveType="Leave type is required";
    if(!form.startDate) e.startDate="Start date is required";
    if(!form.endDate) e.endDate="End date is required";
    else if(form.startDate && form.endDate && form.endDate < form.startDate) e.endDate="End date must be after start date";
    if(!form.reason.trim()) e.reason="Please provide a reason";
    return e;
  }

  async function handleSubmit(){
    const errs=validate();
    if(Object.keys(errs).length){ setErrors(errs); return; }
    setSaving(true);
    setSubmitError("");
    const result = await onSubmit(form);
    setSaving(false);
    // FIX: only show success screen if the save actually succeeded
    if(result && result.success===false){
      setSubmitError(result.error || "Something went wrong while submitting. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if(submitted) return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={<button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer"}}>← Home</button>}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 16px"}}>
        <div style={{background:WHITE,borderRadius:16,padding:"48px 36px",maxWidth:460,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${GREENM}`}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:GOLDL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36,border:`2px solid ${GOLDM}`}}>📋</div>
          <h2 style={{color:NAVY2,fontSize:20,fontWeight:700,margin:"0 0 10px"}}>Leave Request Submitted!</h2>
          <p style={{color:"#666",fontSize:14,margin:"0 0 6px"}}>Your request has been submitted for admin review.</p>
          <div style={{background:LGRAY,borderRadius:8,padding:"12px 16px",margin:"16px 0",border:`1px solid ${GREENM}`,textAlign:"left"}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:"#888"}}>Request Details</p>
            <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:NAVY}}>{form.staffName} · {form.employeeId}</p>
            <p style={{margin:"0 0 2px",fontSize:12,color:"#666"}}>{LEAVE_CONFIGS[form.leaveType]?.icon} {form.leaveType}</p>
            <p style={{margin:0,fontSize:12,color:"#666"}}>{form.startDate} → {form.endDate}</p>
          </div>
          <p style={{fontSize:12,color:"#888",margin:"0 0 16px"}}>The admin will review and notify you. Status: <strong style={{color:"#92400e"}}>Pending</strong></p>
          <button onClick={onBack} style={{background:NAVY,color:WHITE,border:"none",borderRadius:8,padding:"11px 28px",fontWeight:600,fontSize:14,cursor:"pointer"}}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={<button onClick={onBack} style={{background:"transparent",border:`1px solid rgba(255,255,255,0.3)`,borderRadius:4,color:"rgba(255,255,255,0.8)",fontSize:12,cursor:"pointer",padding:"6px 14px"}}>← Back</button>}/>
      <div style={{background:`linear-gradient(135deg,${NAVY2},${NAVY})`,padding:"28px 24px",borderBottom:`3px solid ${GOLD}`}}>
        <div className="ui-form-shell" style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{fontSize:10,color:GOLD,letterSpacing:3,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>University of Ibadan</div>
          <h2 style={{color:WHITE,fontSize:22,fontWeight:800,margin:0}}>Leave Request Form</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,margin:"4px 0 0"}}>Submit your leave application for admin approval</p>
        </div>
      </div>
      <div className="ui-form-shell" style={{maxWidth:600,margin:"28px auto",padding:"0 16px"}}>
        {submitError&&<div style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",fontSize:13,marginBottom:14,fontWeight:500}}>⚠️ {submitError}</div>}
        <div style={{background:WHITE,borderRadius:12,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:18}}>

            {/* Staff identification */}
            <div style={{background:LGRAY,borderRadius:10,padding:16,border:`1px solid ${GREENM}`}}>
              <p style={{fontWeight:700,color:NAVY2,fontSize:13,margin:"0 0 14px"}}>👤 Staff Identification</p>
              <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Field label="Employee ID *" error={errors.employeeId}>
                  <FInput value={form.employeeId} onChange={e=>setF("employeeId",e.target.value)} placeholder="UI-AB-2024" hasError={!!errors.employeeId}/>
                </Field>
                <Field label="Full Name *" error={errors.staffName}>
                  <FInput value={form.staffName} onChange={e=>setF("staffName",e.target.value)} placeholder="e.g. Adaobi Nwosu" hasError={!!errors.staffName}/>
                </Field>
              </div>
              <div style={{marginTop:14}}>
                <Field label="Department *" error={errors.department}>
                  <FSelect value={form.department} onChange={e=>setF("department",e.target.value)} options={departments} hasError={!!errors.department}/>
                </Field>
              </div>
            </div>

            {/* Leave details */}
            <div style={{background:GOLDL,borderRadius:10,padding:16,border:`1px solid ${GOLDM}`}}>
              <p style={{fontWeight:700,color:"#7a5c10",fontSize:13,margin:"0 0 14px"}}> Leave Details</p>
              <Field label="Type of Leave *" error={errors.leaveType}>
                <FSelect value={form.leaveType} onChange={e=>setF("leaveType",e.target.value)} options={LEAVE_TYPES} hasError={!!errors.leaveType}/>
              </Field>
              {form.leaveType&&(
                <div style={{margin:"12px 0",background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{LEAVE_CONFIGS[form.leaveType]?.icon}</span>
                  <div>
                    <p style={{margin:0,fontSize:12,fontWeight:600,color:"#7a5c10"}}>{form.leaveType}</p>
                    <p style={{margin:0,fontSize:11,color:"#a07a20"}}>Standard entitlement: {LEAVE_CONFIGS[form.leaveType]?.label}</p>
                  </div>
                </div>
              )}
              <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                <Field label="Start Date *" error={errors.startDate}>
                  <FInput value={form.startDate} onChange={e=>setF("startDate",e.target.value)} type="date" hasError={!!errors.startDate}/>
                </Field>
                <Field label="End Date *" error={errors.endDate}>
                  <FInput value={form.endDate} onChange={e=>setF("endDate",e.target.value)} type="date" hasError={!!errors.endDate}/>
                </Field>
              </div>
              {form.startDate&&form.endDate&&form.endDate>=form.startDate&&(
                <div style={{marginTop:10,background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#7a5c10",fontWeight:600}}>
                  Duration: {Math.ceil((new Date(form.endDate)-new Date(form.startDate))/(1000*60*60*24))+1} day(s)
                </div>
              )}
            </div>

            {/* Reason */}
            <Field label="Reason for Leave *" error={errors.reason}>
              <FTextarea value={form.reason} onChange={e=>setF("reason",e.target.value)} placeholder="Please provide a brief reason for your leave request…" rows={4}/>
            </Field>

            <div style={{background:GREENL,border:`1px solid ${GREENM}`,borderRadius:8,padding:"10px 14px",fontSize:12,color:NAVY}}>
               Your request will be reviewed by the admin. You will be notified of approval or rejection.
            </div>
          </div>
          <div className="ui-form-actions" style={{display:"flex",justifyContent:"space-between",padding:"14px 24px",borderTop:`1px solid ${GREENM}`,background:LGRAY}}>
            <button onClick={onBack} style={{padding:"8px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:NAVY,fontSize:13}}>← Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{background:saving?"#aaa":GOLD,color:saving?WHITE:NAVY2,border:"none",borderRadius:6,padding:"8px 24px",fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:13}}>
              {saving?"Submitting…":"Submit Request ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ADMIN LOGIN

function AdminLogin({onLogin,onBack,admins=[]}){
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  function attempt(){
    if(u===ADMIN_CREDS.username&&p===ADMIN_CREDS.password){ onLogin({username:"admin",role:"super",photo:""}); return; }
    const found=admins.find(a=>a.username===u&&a.password===p);
    if(found){ onLogin(found); return; }
    setErr("Invalid username or password.");
  }
  return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={<button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer"}}>← Back</button>}/>
      <div style={{background:`linear-gradient(135deg,${NAVY2},${NAVY})`,padding:"40px 24px 60px",textAlign:"center",borderBottom:`3px solid ${GOLD}`}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:4,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Restricted Access</div>
        <h2 style={{color:WHITE,fontSize:26,fontWeight:800,margin:0}}>Admin Portal</h2>
      </div>
      <div style={{maxWidth:420,margin:"-40px auto 40px",padding:"0 16px"}}>
        <div style={{background:WHITE,borderRadius:14,padding:"36px 32px",boxShadow:"0 16px 48px rgba(10,31,92,0.18)",border:`1px solid rgba(201,168,76,0.25)`}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png" alt="UI" style={{height:56,marginBottom:12}} onError={e=>{e.currentTarget.style.display="none";}}/>
            <h3 style={{fontSize:16,fontWeight:700,color:NAVY2,margin:0}}>Sign in to Admin Portal</h3>
          </div>
          {err&&<div style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:12,marginBottom:16}}>{err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:NAVY,display:"block",marginBottom:5}}>Username</label>
              <input value={u} onChange={e=>{setU(e.target.value);setErr("");}} placeholder="admin" onKeyDown={e=>e.key==="Enter"&&attempt()} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:`1.5px solid ${GREENM}`,borderRadius:8,fontSize:13,outline:"none"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:NAVY,display:"block",marginBottom:5}}>Password</label>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={p} onChange={e=>{setP(e.target.value);setErr("");}} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&attempt()} style={{width:"100%",boxSizing:"border-box",padding:"10px 40px 10px 12px",border:`1.5px solid ${GREENM}`,borderRadius:8,fontSize:13,outline:"none"}}/>
                <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:11}}>{show?"Hide":"Show"}</button>
              </div>
            </div>
            <button onClick={attempt} style={{background:NAVY,color:WHITE,border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Sign in</button>
            <button onClick={onBack} style={{background:"none",border:"none",color:"#888",fontSize:12,cursor:"pointer",padding:0,textAlign:"center"}}>← Back to Staff Portal</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// STAFF REGISTRATION

function StaffRegistration({onSubmit,onBack,fieldConfig,departments}){
  const enabledFields = fieldConfig.filter(f=>f.enabled);
  const [form,setForm]=useState({passportPhoto:""});
  const [section,setSection]=useState(0);
  const [errors,setErrors]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [saving,setSaving]=useState(false);
  const [submitError,setSubmitError]=useState("");

  useEffect(()=>{
    if(form.firstName||form.lastName||form.startDate){
      setForm(f=>({...f,employeeId:genId(f.firstName,f.lastName,f.startDate)}));
    }
  },[form.firstName,form.lastName,form.startDate]);

  function setF(k,v){
    setForm(f=>{
      let u={...f,[k]:v};
      if(k==="status"&&v!=="On Leave"){u.leaveType="";u.returnDate="";u.leaveStartDate="";}
      if(k==="leaveType"&&v){const s=u.leaveStartDate||todayStr();u.leaveStartDate=s;u.returnDate=getAutoReturnDate(v,s);}
      if(k==="leaveStartDate"&&u.leaveType){u.returnDate=getAutoReturnDate(u.leaveType,v);}
      return u;
    });
    if(errors[k])setErrors(e=>({...e,[k]:undefined}));
  }

  function validate(){
    const e={};
    enabledFields.filter(f=>f.required).forEach(f=>{
      if(!form[f.id]?.toString().trim())e[f.id]=`${f.label} is required`;
    });
    if(form.email&&!/\S+@\S+\.\S+/.test(form.email))e.email="Invalid email";
    if(form.staffEmail&&!/\S+@\S+\.\S+/.test(form.staffEmail))e.staffEmail="Invalid email";
    if(form.alternateEmail&&!/\S+@\S+\.\S+/.test(form.alternateEmail))e.alternateEmail="Invalid email";
    const statusField = enabledFields.find(f=>f.id==="status");
    if(statusField&&form.status==="On Leave"){
      if(!form.leaveType)e.leaveType="Please specify leave type";
      if(!form.leaveStartDate)e.leaveStartDate="Please specify leave start date";
      if(!form.returnDate)e.returnDate="Return date required";
    }
    return e;
  }

  async function handleSubmit(){
    const errs=validate();
    if(Object.keys(errs).length){
      setErrors(errs);
      const sf=[[],[],[],[]];
      enabledFields.forEach(f=>{if(errs[f.id])sf[f.section]?.push(f.id);});
      for(let i=0;i<4;i++){if(sf[i]?.length){setSection(i);break;}}
      return;
    }
    setSaving(true);
    setSubmitError("");
    const customFields=fieldConfig.filter(f=>f.custom&&f.enabled);
    const result = await onSubmit({...form,employeeId:form.employeeId||genId(form.firstName,form.lastName,form.startDate),_customFields:customFields});
    setSaving(false);
    // FIX: previously this always showed the success screen even when the
    // Supabase insert failed. Now we check the actual result first.
    if(result && result.success===false){
      setSubmitError(result.error || "Something went wrong while saving your registration. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  const sectionFields=(sec)=>enabledFields.filter(f=>f.section===sec&&f.id!=="status");
  const customSectionFields=(sec)=>fieldConfig.filter(f=>f.custom&&f.enabled&&f.section===sec);

  function renderField(f){
    if(f.id==="department"){
      return <Field key={f.id} label={`${f.label}${f.required?" *":""}`} error={errors[f.id]}><FSelect value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} options={departments} hasError={!!errors[f.id]}/></Field>;
    }
    if(f.id==="gender"||f.id==="employmentType"){
      return <Field key={f.id} label={`${f.label}${f.required?" *":""}`} error={errors[f.id]}><FSelect value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} options={f.options||[]} hasError={!!errors[f.id]}/></Field>;
    }
    return <Field key={f.id} label={`${f.label}${f.required?" *":""}`} error={errors[f.id]}>
      <FInput value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} type={f.type==="select"?"text":f.type} hasError={!!errors[f.id]}/>
    </Field>;
  }

  if(submitted) return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={<button onClick={onBack} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer"}}>← Home</button>}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 16px"}}>
        <div style={{background:WHITE,borderRadius:16,padding:"48px 36px",maxWidth:460,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${GREENM}`}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:GREENL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36,border:`2px solid ${GREENM}`}}>✓</div>
          <h2 style={{color:NAVY2,fontSize:20,fontWeight:700,margin:"0 0 10px"}}>Registration Submitted!</h2>
          <p style={{color:"#666",fontSize:14,margin:"0 0 6px"}}>Thank you, <strong>{form.firstName} {form.lastName}</strong>.</p>
          <div style={{background:LGRAY,borderRadius:8,padding:"12px 16px",margin:"16px 0",border:`1px solid ${GREENM}`}}>
            <p style={{margin:0,fontSize:12,color:"#888"}}>Your Employee ID</p>
            <p style={{margin:0,fontSize:20,fontWeight:800,color:NAVY,letterSpacing:1}}>{form.employeeId}</p>
          </div>
          {form.passportPhoto&&<div style={{margin:"16px auto",width:80,height:96,borderRadius:6,overflow:"hidden",border:`2px solid ${GOLD}`}}><img src={form.passportPhoto} alt="passport" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
          <button onClick={onBack} style={{background:NAVY,color:WHITE,border:"none",borderRadius:8,padding:"11px 28px",fontWeight:600,fontSize:14,cursor:"pointer",marginTop:8}}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  const statusField=enabledFields.find(f=>f.id==="status");
  return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={<button onClick={onBack} style={{background:"transparent",border:`1px solid rgba(255,255,255,0.3)`,borderRadius:4,color:"rgba(255,255,255,0.8)",fontSize:12,cursor:"pointer",padding:"6px 14px"}}>← Back</button>}/>
      <div style={{background:`linear-gradient(135deg,${NAVY2},${NAVY})`,padding:"28px 24px",borderBottom:`3px solid ${GOLD}`}}>
        <div className="ui-form-shell" style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{fontSize:10,color:GOLD,letterSpacing:3,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>University of Ibadan</div>
          <h2 style={{color:WHITE,fontSize:22,fontWeight:800,margin:0}}>Staff Registration Form</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,margin:"4px 0 0"}}>Complete all sections to register your employment details</p>
        </div>
      </div>
      <div className="ui-form-shell" style={{maxWidth:700,margin:"28px auto",padding:"0 16px"}}>
        {submitError&&<div style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",fontSize:13,marginBottom:14,fontWeight:500}}>⚠️ {submitError}</div>}
        <div className="ui-tabs" style={{display:"flex",background:WHITE,borderRadius:10,border:`1px solid ${GREENM}`,overflow:"hidden",marginBottom:20}}>
          {SECTIONS.map((s,i)=>(
            <button key={s} onClick={()=>setSection(i)} style={{flex:1,padding:"12px 8px",fontSize:11,fontWeight:600,border:"none",borderBottom:section===i?`3px solid ${NAVY}`:"3px solid transparent",background:section===i?`${NAVY}10`:"transparent",cursor:"pointer",color:section===i?NAVY:"#777"}}>
              <span style={{display:"block",fontSize:16,marginBottom:3}}>{["👤","📞","💼","🚨"][i]}</span>{s}
            </button>
          ))}
        </div>
        <div style={{background:WHITE,borderRadius:12,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
          <div style={{padding:24}}>
            {section===0&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="ui-photo-row" style={{display:"flex",gap:16,alignItems:"flex-start",padding:"16px",background:LGRAY,borderRadius:10,border:`1px solid ${GREENM}`}}>
                  <PassportUpload value={form.passportPhoto} onChange={v=>setF("passportPhoto",v)}/>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:700,color:NAVY2,fontSize:16,margin:"0 0 4px"}}>{form.firstName||form.lastName?`${form.firstName||""} ${form.lastName||""}`.trim():"Your name will appear here"}</p>
                    <div style={{display:"inline-block",background:NAVY,color:GOLD,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,letterSpacing:1,marginBottom:8}}>{form.employeeId||"ID auto-generated"}</div>
                  </div>
                </div>
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {sectionFields(0).filter(f=>["firstName","lastName"].includes(f.id)).map(renderField)}
                </div>
                <div className="ui-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {sectionFields(0).filter(f=>!["firstName","lastName"].includes(f.id)).map(renderField)}
                </div>
                {customSectionFields(0).length>0&&<div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{customSectionFields(0).map(f=><Field key={f.id} label={f.label}><FInput value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} placeholder={f.placeholder||""}/></Field>)}</div>}
              </div>
            )}
            {section===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {sectionFields(1).filter(f=>["email","phone"].includes(f.id)).map(renderField)}
                </div>
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <Field label="Staff Dedicated Mail" error={errors.staffEmail}>
                    <FInput value={form.staffEmail||""} onChange={e=>setF("staffEmail",e.target.value)} type="email" placeholder="e.g. j.doe@ui.edu.ng" hasError={!!errors.staffEmail}/>
                  </Field>
                  <Field label="Alternate Mail" error={errors.alternateEmail}>
                    <FInput value={form.alternateEmail||""} onChange={e=>setF("alternateEmail",e.target.value)} type="email" placeholder="Optional alternate address" hasError={!!errors.alternateEmail}/>
                  </Field>
                </div>
                {sectionFields(1).filter(f=>f.id==="address").map(renderField)}
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {sectionFields(1).filter(f=>["city","state"].includes(f.id)).map(renderField)}
                </div>
                {customSectionFields(1).length>0&&<div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{customSectionFields(1).map(f=><Field key={f.id} label={f.label}><FInput value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} placeholder={f.placeholder||""}/></Field>)}</div>}
              </div>
            )}
            {section===2&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {sectionFields(2).filter(f=>["jobTitle","department"].includes(f.id)).map(renderField)}
                </div>
                <div className="ui-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {sectionFields(2).filter(f=>["employmentType","startDate"].includes(f.id)).map(renderField)}
                  {statusField&&<Field label="Status"><FSelect value={form.status||"Active"} onChange={e=>setF("status",e.target.value)} options={STATUS_OPS}/></Field>}
                </div>
                <div className="ui-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  <Field label="Assumption of Duty Date">
                    <FInput value={form.assumptionDate||""} onChange={e=>setF("assumptionDate",e.target.value)} type="date"/>
                  </Field>
                  <Field label="PF Number">
                    <FInput value={form.pfNumber||""} onChange={e=>setF("pfNumber",e.target.value)} placeholder="e.g. PF/UI/00123"/>
                  </Field>
                </div>
                {statusField&&form.status==="On Leave"&&(
                  <div style={{background:GOLDL,border:`1px solid ${GOLDM}`,borderRadius:10,padding:16,display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>🏖️</span>
                      <div><p style={{fontWeight:700,color:"#7a5c10",fontSize:13,margin:0}}>Leave Details</p><p style={{fontSize:11,color:"#a07a20",margin:0}}>Return date is set automatically</p></div>
                    </div>
                    <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <Field label="Type of leave *" error={errors.leaveType}><FSelect value={form.leaveType||""} onChange={e=>setF("leaveType",e.target.value)} options={LEAVE_TYPES} hasError={!!errors.leaveType}/></Field>
                      <Field label="Leave start date *" error={errors.leaveStartDate}><FInput value={form.leaveStartDate||""} onChange={e=>setF("leaveStartDate",e.target.value)} type="date" hasError={!!errors.leaveStartDate}/></Field>
                    </div>
                    {form.leaveType&&<div style={{background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{LEAVE_CONFIGS[form.leaveType]?.icon}</span>
                      <div><p style={{margin:0,fontSize:12,fontWeight:600,color:"#7a5c10"}}>Auto-calculated return date</p><p style={{margin:0,fontSize:13,fontWeight:700,color:NAVY2}}>{form.returnDate?new Date(form.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"Select a start date"}</p></div>
                    </div>}
                    <Field label="Override return date (optional)"><FInput value={form.returnDate||""} onChange={e=>setF("returnDate",e.target.value)} type="date"/></Field>
                    <LeaveInfoBanner leaveType={form.leaveType} leaveStartDate={form.leaveStartDate} returnDate={form.returnDate}/>
                  </div>
                )}
                {customSectionFields(2).length>0&&<div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{customSectionFields(2).map(f=><Field key={f.id} label={f.label}><FInput value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} placeholder={f.placeholder||""}/></Field>)}</div>}
              </div>
            )}
            {section===3&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:GOLDL,border:`1px solid ${GOLDM}`,borderRadius:8,padding:"12px 14px"}}>
                  <p style={{fontSize:13,color:"#7a5c10",margin:0,fontWeight:500}}>🚨 Emergency contact information is kept confidential.</p>
                </div>
                <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {sectionFields(3).filter(f=>["emergencyName","emergencyRelation"].includes(f.id)).map(renderField)}
                </div>
                {sectionFields(3).filter(f=>f.id==="emergencyPhone").map(renderField)}
                {customSectionFields(3).length>0&&<div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{customSectionFields(3).map(f=><Field key={f.id} label={f.label}><FInput value={form[f.id]||""} onChange={e=>setF(f.id,e.target.value)} placeholder={f.placeholder||""}/></Field>)}</div>}
              </div>
            )}
          </div>
          <div className="ui-form-actions" style={{display:"flex",justifyContent:"space-between",padding:"14px 24px",borderTop:`1px solid ${GREENM}`,background:LGRAY}}>
            {section>0?<button onClick={()=>setSection(s=>s-1)} style={{padding:"8px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:NAVY,fontSize:13}}>← Previous</button>:<div/>}
            {section<3?<button onClick={()=>setSection(s=>s+1)} style={{background:NAVY,color:WHITE,border:"none",borderRadius:6,padding:"8px 20px",fontWeight:600,cursor:"pointer",fontSize:13}}>Next →</button>
              :<button onClick={handleSubmit} disabled={saving} style={{background:saving?"#aaa":GOLD,color:saving?WHITE:NAVY2,border:"none",borderRadius:6,padding:"8px 24px",fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:13}}>{saving?"Saving…":"Submit Registration ✓"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// LEAVE REQUESTS ADMIN PAGE
// ══════════════════════════════════
function LeaveRequestsAdmin({requests, onApprove, onReject, onRefresh}){
  const [filter, setFilter] = useState("Pending");
  const [noteModal, setNoteModal] = useState(null); // {req, action}
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const filtered = requests.filter(r => filter==="All" || r.status===filter);

  const counts = {
    All: requests.length,
    Pending: requests.filter(r=>r.status==="Pending").length,
    Approved: requests.filter(r=>r.status==="Approved").length,
    Rejected: requests.filter(r=>r.status==="Rejected").length,
  };

  async function handleAction(){
    setProcessing(true);
    if(noteModal.action==="approve") await onApprove(noteModal.req.id, adminNote);
    else await onReject(noteModal.req.id, adminNote);
    setNoteModal(null); setAdminNote(""); setProcessing(false);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Leave Requests</h2>
          <p style={{fontSize:13,color:"#666",margin:0}}>Review and action staff leave applications.</p>
        </div>
        <button onClick={onRefresh} style={{padding:"8px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:NAVY,fontSize:13}}>↻ Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {["Pending","Approved","Rejected","All"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"7px 16px",border:`1px solid ${filter===f?NAVY:GREENM}`,borderRadius:20,
            background:filter===f?NAVY:WHITE,color:filter===f?WHITE:NAVY,
            cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6
          }}>
            {f==="Pending"?"⏳":f==="Approved"?"✓":f==="Rejected"?"✕":"📋"} {f}
            <span style={{background:filter===f?"rgba(255,255,255,0.2)":LGRAY,color:filter===f?WHITE:"#555",borderRadius:20,padding:"1px 7px",fontSize:11}}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length===0?(
        <div style={{textAlign:"center",padding:"56px 0",background:GREENL,borderRadius:12,border:`1px solid ${GREENM}`}}>
          <p style={{fontSize:36,margin:"0 0 12px"}}>📋</p>
          <p style={{fontWeight:600,color:NAVY2,fontSize:16,margin:"0 0 6px"}}>{filter==="Pending"?"No pending requests":"No requests found"}</p>
          <p style={{fontSize:13,color:"#666",margin:0}}>
            {filter==="Pending"?"All leave requests have been actioned.":"Try a different filter."}
          </p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map((req,i)=>{
            const cfg = LEAVE_CONFIGS[req.leaveType]||{icon:"📋"};
            const days = req.startDate&&req.endDate
              ? Math.ceil((new Date(req.endDate)-new Date(req.startDate))/(1000*60*60*24))+1
              : null;
            return(
              <div key={req.id||i} className="ui-leave-card" style={{background:WHITE,borderRadius:12,border:`1px solid ${req.status==="Pending"?GOLDM:req.status==="Approved"?GREENM:"#fecaca"}`,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:LGRAY,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${GREENM}`}}>{cfg.icon}</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
                      <p style={{margin:0,fontWeight:700,fontSize:14,color:NAVY2}}>{req.staffName}</p>
                      <span style={{fontSize:11,background:NAVY,color:GOLD,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{req.employeeId}</span>
                      <Badge label={req.status}/>
                    </div>
                    <p style={{margin:"0 0 6px",fontSize:12,color:"#888"}}>{req.department}</p>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:NAVY,fontWeight:600}}>{req.leaveType}</span>
                      <span style={{fontSize:12,color:"#555"}}>📅 {req.startDate} → {req.endDate}{days?` (${days} day${days===1?"":"s"})`:""}</span>
                    </div>
                    {req.reason&&<p style={{margin:"8px 0 0",fontSize:12,color:"#666",background:LGRAY,borderRadius:6,padding:"8px 12px",fontStyle:"italic"}}>"{req.reason}"</p>}
                    {req.adminNote&&<p style={{margin:"8px 0 0",fontSize:12,color:req.status==="Approved"?GREEN:"#991b1b",background:req.status==="Approved"?GREENL:"#fef2f2",borderRadius:6,padding:"8px 12px",border:`1px solid ${req.status==="Approved"?GREENM:"#fecaca"}`}}>
                      <strong>Admin note:</strong> {req.adminNote}
                    </p>}
                    <p style={{margin:"6px 0 0",fontSize:10,color:"#bbb"}}>Submitted: {req.createdAt?new Date(req.createdAt).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""}</p>
                  </div>
                  {req.status==="Pending"&&(
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <button onClick={()=>{setNoteModal({req,action:"approve"});setAdminNote("");}}
                        style={{padding:"8px 16px",background:GREENL,color:GREEN,border:`1px solid ${GREENM}`,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>✓ Approve</button>
                      <button onClick={()=>{setNoteModal({req,action:"reject"});setAdminNote("");}}
                        style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Reject</button>
                    </div>
                  )}
                </div>
            );
          })}
        </div>
      )}

      {/* Approve/Reject note modal */}
      {noteModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
          <div style={{background:WHITE,borderRadius:14,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(10,31,92,0.3)"}}>
            <div style={{background:noteModal.action==="approve"?GREEN:"#dc2626",padding:"16px 20px",borderRadius:"14px 14px 0 0"}}>
              <p style={{color:WHITE,fontWeight:700,fontSize:15,margin:0}}>
                {noteModal.action==="approve"?"✓ Approve Leave Request":"✕ Reject Leave Request"}
              </p>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:12,margin:"4px 0 0"}}>{noteModal.req.staffName} · {noteModal.req.leaveType}</p>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:LGRAY,borderRadius:8,padding:"12px 14px"}}>
                <p style={{margin:"0 0 2px",fontSize:12,fontWeight:600,color:NAVY}}>{noteModal.req.leaveType}</p>
                <p style={{margin:0,fontSize:12,color:"#666"}}>{noteModal.req.startDate} → {noteModal.req.endDate}</p>
                {noteModal.req.reason&&<p style={{margin:"6px 0 0",fontSize:12,color:"#888",fontStyle:"italic"}}>"{noteModal.req.reason}"</p>}
              </div>
              <Field label="Admin note (optional)">
                <FTextarea value={adminNote} onChange={e=>setAdminNote(e.target.value)} placeholder={noteModal.action==="approve"?"e.g. Approved. Enjoy your leave.":"e.g. Please reschedule — peak period."} rows={3}/>
              </Field>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button onClick={()=>setNoteModal(null)} style={{padding:"9px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:"#555",fontSize:13}}>Cancel</button>
                <button onClick={handleAction} disabled={processing} style={{padding:"9px 20px",background:processing?"#aaa":noteModal.action==="approve"?GREEN:"#dc2626",color:WHITE,border:"none",borderRadius:6,fontWeight:700,cursor:processing?"not-allowed":"pointer",fontSize:13}}>
                  {processing?"Processing…":noteModal.action==="approve"?"Confirm Approval":"Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// DASHBOARD HOME
// ══════════════════════════════════
const PIE_COLORS=["#0a1f5c","#C9A84C","#0891b2","#7c3aed","#dc2626","#059669","#d97706","#db2777"];
function DashboardHome({staff,activity,currentAdmin,pendingLeaveCount,departments}){
  const total=staff.length, active=staff.filter(s=>s.status==="Active").length;
  const onLeave=staff.filter(s=>s.status==="On Leave").length;
  const fullTime=staff.filter(s=>s.employmentType==="Full-time").length;
  const statusData=STATUS_OPS.map(s=>({name:s,value:staff.filter(m=>m.status===s).length})).filter(d=>d.value>0);
  const deptPieData=departments.map(d=>({name:d,value:staff.filter(s=>s.department===d).length})).filter(d=>d.value>0);
  const stats=[
    {label:"Total Staff",value:total,sub:"All records",color:NAVY},
    {label:"Active",value:active,sub:`${total?Math.round(active/total*100):0}% of total`,color:GREEN},
    {label:"On Leave",value:onLeave,sub:"Currently away",color:"#7a5c10"},
    {label:"Full-time",value:fullTime,sub:"Permanent staff",color:"#0891b2"},
    {label:"Leave Requests",value:pendingLeaveCount,sub:"Awaiting approval",color:"#dc2626"},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="ui-welcome-banner" style={{background:`linear-gradient(135deg,${NAVY2},${NAVYL})`,borderRadius:14,padding:"24px 28px",display:"flex",alignItems:"center",gap:20,border:`1px solid ${GOLD}33`,flexWrap:"wrap"}}>
        <AdminAvatar admin={currentAdmin} size={64}/>
        <div>
          <p style={{color:GOLD,fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",margin:"0 0 4px"}}>Welcome back</p>
          <h2 style={{color:WHITE,fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{currentAdmin?.name||currentAdmin?.username||"Administrator"}</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:0}}>{currentAdmin?.role==="super"?"Super Admin":"Admin"} · Staff Data</p>
        </div>
        {pendingLeaveCount>0&&<div style={{marginLeft:"auto",background:"#dc2626",color:WHITE,borderRadius:10,padding:"12px 18px",textAlign:"center",flexShrink:0}}>
          <p style={{margin:0,fontSize:22,fontWeight:800,lineHeight:1}}>{pendingLeaveCount}</p>
          <p style={{margin:0,fontSize:11,fontWeight:600}}>Pending leave{pendingLeaveCount===1?"":"s"}</p>
        </div>}
      </div>
      <div className="ui-stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:WHITE,borderRadius:10,padding:"16px 18px",border:`1px solid ${GREENM}`,borderTop:`3px solid ${s.color}`}}>
            <p style={{fontSize:11,color:s.color,fontWeight:600,margin:0,letterSpacing:0.5}}>{s.label.toUpperCase()}</p>
            <p style={{fontSize:28,fontWeight:700,color:NAVY2,margin:"6px 0 2px"}}>{s.value}</p>
            <p style={{fontSize:11,color:"#888",margin:0}}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {[{title:"Status breakdown",data:statusData},{title:"Staff by department",data:deptPieData}].map(({title,data})=>(
          <div key={title} style={{background:WHITE,borderRadius:10,padding:20,border:`1px solid ${GREENM}`}}>
            <p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:"0 0 16px"}}>{title}</p>
            {data.length===0?<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No data yet</p>
              :<ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name.slice(0,8)} ${Math.round(percent*100)}%`} labelLine={false} fontSize={10}>{data.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip/><Legend iconSize={10} wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer>}
          </div>
        ))}
      </div>
      <LeaveCountdownPanel staff={staff}/>
      <div style={{background:WHITE,borderRadius:10,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${GREENM}`,background:GREENL}}>
          <p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:0}}>Recent activity</p>
        </div>
        {activity.length===0?<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No activity yet</p>
          :activity.slice(0,6).map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:i<5?`1px solid ${GREENL}`:"none",background:i%2===0?WHITE:GREENL}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",background:a.type==="register"?GREENL:a.type==="edit"?GOLDL:a.type==="auto-return"?GREENL:a.type==="leave-approved"?GREENL:a.type==="leave-rejected"?"#fef2f2":"#fef2f2"}}>
                {a.type==="register"?"✚":a.type==="edit"?"✎":a.type==="auto-return"?"🔄":a.type==="leave-approved"?"✓":a.type==="leave-rejected"?"✕":"✕"}
              </div>
              <div style={{flex:1}}><p style={{margin:0,fontSize:13,color:NAVY2,fontWeight:500}}>{a.message}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{a.time}</p></div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// STAFF DIRECTORY
// ══════════════════════════════════
function StaffDirectory({staff,onEdit,onDelete,onView,departments}){
  const [search,setSearch]=useState(""); const [sort,setSort]=useState("lastName");
  const [filterDept,setFilterDept]=useState(""); const [filterStatus,setFilterStatus]=useState("");
  const filtered=staff.filter(m=>{
    const q=search.toLowerCase();
    return(!q||[m.firstName,m.lastName,m.email,m.department,m.jobTitle,m.employeeId].some(v=>v?.toLowerCase().includes(q)))
      &&(!filterDept||m.department===filterDept)&&(!filterStatus||m.status===filterStatus);
  }).sort((a,b)=>(a[sort]||"").localeCompare(b[sort]||""));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Staff Directory</h2><p style={{fontSize:13,color:"#666",margin:0}}>{staff.length} registered members</p></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, ID…" style={{flex:1,minWidth:180,padding:"8px 12px",border:`1px solid ${GREENM}`,borderRadius:6,fontSize:13,outline:"none"}}/>
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} style={{padding:"8px 10px",border:`1px solid ${GREENM}`,borderRadius:6,fontSize:13,background:WHITE}}>
          <option value="">All departments</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:"8px 10px",border:`1px solid ${GREENM}`,borderRadius:6,fontSize:13,background:WHITE}}>
          <option value="">All statuses</option>{STATUS_OPS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"8px 10px",border:`1px solid ${GREENM}`,borderRadius:6,fontSize:13,background:WHITE}}>
          <option value="lastName">Sort: Last name</option><option value="department">Sort: Department</option><option value="startDate">Sort: Start date</option><option value="status">Sort: Status</option>
        </select>
      </div>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:"56px 0",background:GREENL,borderRadius:12,border:`1px solid ${GREENM}`}}><p style={{fontSize:36,margin:"0 0 12px"}}>👥</p><p style={{fontWeight:600,color:NAVY2,fontSize:16,margin:"0 0 6px"}}>{staff.length===0?"No registrations yet":"No results"}</p><p style={{fontSize:13,color:"#666",margin:0}}>{staff.length===0?"Staff submissions will appear here.":"Try adjusting your filters."}</p></div>
        :<div style={{border:`1px solid ${GREENM}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
              <thead><tr style={{background:NAVY}}>{["Staff Member","Department","Job Title","Type","Status","Leave","Countdown","Actions"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 14px",fontWeight:600,color:GOLD,fontSize:11,letterSpacing:0.5,whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>)}</tr></thead>
              <tbody>{filtered.map((m,i)=>(
                <tr key={m.id} style={{background:i%2===0?WHITE:GREENL,fontSize:13}}>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>onView(m)}>
                      <Avatar name={`${m.firstName} ${m.lastName}`} photo={m.passportPhoto} size={36}/>
                      <div><p style={{fontWeight:600,margin:0,color:NAVY}}>{m.firstName} {m.lastName}</p><p style={{fontSize:11,color:NAVY,margin:0,fontWeight:700,letterSpacing:0.5}}>{m.employeeId}</p></div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{m.department||"—"}</td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`,color:NAVY2}}>{m.jobTitle||"—"}</td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{m.employmentType||"—"}</td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`}}><Badge label={m.status||"Active"}/></td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`,color:"#888",fontSize:12}}>{m.status==="On Leave"&&m.leaveType?<span>{LEAVE_CONFIGS[m.leaveType]?.icon} {m.leaveType}</span>:"—"}</td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`}}>{m.status==="On Leave"?<LeaveCountdownPill returnDate={m.returnDate}/>:<span style={{color:"#ccc",fontSize:12}}>—</span>}</td>
                  <td style={{padding:"12px 14px",borderBottom:`1px solid ${GREENM}`}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>onView(m)} style={{padding:"4px 10px",border:`1px solid ${GREENM}`,borderRadius:5,background:WHITE,color:NAVY,cursor:"pointer",fontSize:12}}>View</button>
                      <button onClick={()=>onEdit(m)} style={{padding:"4px 10px",border:`1px solid ${GREENM}`,borderRadius:5,background:WHITE,color:NAVY,cursor:"pointer",fontSize:12}}>Edit</button>
                      <button onClick={()=>onDelete(m.id)} style={{padding:"4px 10px",border:"1px solid #fecaca",borderRadius:5,background:WHITE,color:"#dc2626",cursor:"pointer",fontSize:12}}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{padding:"10px 14px",fontSize:12,color:NAVY,background:GREENL,borderTop:`1px solid ${GREENM}`,fontWeight:500}}>Showing {filtered.length} of {staff.length} staff members</div>
        </div>
      }
    </div>
  );
}

// ══════════════════════════════════
// REPORTS
// ══════════════════════════════════
function ReportsPage({staff,departments}){
  function exportCSV(rows,filename){
    const headers=["Employee ID","First Name","Last Name","Email","Staff Mail","Alternate Mail","Phone","Department","Job Title","Status","PF Number","Assumption Date","Leave Type","Leave Start","Return Date","Start Date","Employment Type","Gender"];
    const csv=[headers,...rows.map(s=>[s.employeeId,s.firstName,s.lastName,s.email,s.staffEmail||"",s.alternateEmail||"",s.phone,s.department,s.jobTitle,s.status,s.pfNumber||"",s.assumptionDate||"",s.leaveType||"",s.leaveStartDate||"",s.returnDate||"",s.startDate,s.employmentType,s.gender])].map(r=>r.map(c=>`"${c||""}"`).join(",")).join("\n");
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download=filename; a.click();
  }
  const reports=[{title:"All Staff",data:staff,desc:"Complete directory",file:"all_staff.csv"},{title:"Active Staff",data:staff.filter(s=>s.status==="Active"),desc:"Currently active",file:"active_staff.csv"},{title:"Full-time Staff",data:staff.filter(s=>s.employmentType==="Full-time"),desc:"Permanent employees",file:"fulltime.csv"},{title:"On Leave",data:staff.filter(s=>s.status==="On Leave"),desc:"Currently on leave",file:"on_leave.csv"}];
  const deptSummary=departments.map(d=>({dept:d,total:staff.filter(s=>s.department===d).length,active:staff.filter(s=>s.department===d&&s.status==="Active").length,onLeave:staff.filter(s=>s.department===d&&s.status==="On Leave").length,fullTime:staff.filter(s=>s.department===d&&s.employmentType==="Full-time").length})).filter(d=>d.total>0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Reports & Exports</h2><p style={{fontSize:13,color:"#666",margin:0}}>Download staff data as CSV files.</p></div>
      <div className="ui-reports-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {reports.map(r=>(
          <div key={r.title} style={{background:WHITE,borderRadius:10,padding:20,border:`1px solid ${GREENM}`,display:"flex",flexDirection:"column",gap:10}}>
            <div><p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:"0 0 4px"}}>{r.title}</p><p style={{fontSize:12,color:"#666",margin:0}}>{r.desc}</p></div>
            <p style={{fontSize:22,fontWeight:700,color:NAVY,margin:0}}>{r.data.length}<span style={{fontSize:12,fontWeight:400,color:"#888"}}> records</span></p>
            <button onClick={()=>exportCSV(r.data,r.file)} disabled={r.data.length===0} style={{background:r.data.length===0?"#f3f4f6":NAVY,color:r.data.length===0?"#aaa":WHITE,border:"none",borderRadius:6,padding:8,fontWeight:600,fontSize:12,cursor:r.data.length===0?"not-allowed":"pointer"}}>↓ Export CSV</button>
          </div>
        ))}
      </div>
      <div style={{background:WHITE,borderRadius:10,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${GREENM}`,background:GREENL}}><p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:0}}>Department summary</p></div>
        {deptSummary.length===0?<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No data yet</p>
          :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
            <thead><tr style={{background:GREENL}}>{["Department","Total","Active","On Leave","Full-time"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:11,fontWeight:600,color:NAVY,letterSpacing:0.4,borderBottom:`1px solid ${GREENM}`}}>{h.toUpperCase()}</th>)}</tr></thead>
            <tbody>{deptSummary.map((d,i)=>(
              <tr key={d.dept} style={{background:i%2===0?WHITE:GREENL}}>
                <td style={{padding:"11px 16px",borderBottom:`1px solid ${GREENM}`,fontWeight:500,color:NAVY2}}>{d.dept}</td>
                <td style={{padding:"11px 16px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{d.total}</td>
                <td style={{padding:"11px 16px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{d.active}</td>
                <td style={{padding:"11px 16px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{d.onLeave}</td>
                <td style={{padding:"11px 16px",borderBottom:`1px solid ${GREENM}`,color:"#555"}}>{d.fullTime}</td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════
function AuditLog({activity}){
  const icons={register:"✚",edit:"✎",delete:"✕","auto-return":"🔄","admin-add":"🛡","leave-approved":"✓","leave-rejected":"✕","leave-request":"📋"};
  const colors={register:GREENL,edit:GOLDL,delete:"#fef2f2","auto-return":GREENL,"admin-add":"#eff6ff","leave-approved":GREENL,"leave-rejected":"#fef2f2","leave-request":GOLDL};
  const tColors={register:NAVY2,edit:"#7a5c10",delete:"#991b1b","auto-return":GREEN,"admin-add":"#1e40af","leave-approved":GREEN,"leave-rejected":"#991b1b","leave-request":"#7a5c10"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Audit Log</h2><p style={{fontSize:13,color:"#666",margin:0}}>All actions are recorded here.</p></div>
      <div style={{background:WHITE,borderRadius:10,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
        {activity.length===0?<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"48px 0"}}>No activity yet.</p>
          :activity.map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<activity.length-1?`1px solid ${GREENL}`:"none",background:i%2===0?WHITE:GREENL,flexWrap:"wrap"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:colors[a.type]||GREENL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,color:tColors[a.type]||NAVY2,fontWeight:700}}>{icons[a.type]||"•"}</div>
              <div style={{flex:1,minWidth:150}}><p style={{margin:0,fontSize:13,color:NAVY2,fontWeight:500}}>{a.message}</p><p style={{margin:0,fontSize:11,color:"#888",marginTop:2}}>{a.time}</p></div>
              <span style={{fontSize:11,background:colors[a.type]||GREENL,color:tColors[a.type]||NAVY2,padding:"2px 10px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap",textTransform:"capitalize"}}>{a.type}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ADMIN AVATAR (initials-based, no photo upload)
// ══════════════════════════════════
const AVATAR_COLORS=["#0a1f5c","#00472B","#7c3aed","#0891b2","#b45309","#9d174d","#166534","#1e40af"];
function avatarColorFor(str){
  let h=0; for(let i=0;i<(str||"").length;i++)h=str.charCodeAt(i)+((h<<5)-h);
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function AdminAvatar({admin,size=42}){
  const label=admin?.name||admin?.username||"Admin";
  const initials=label.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase()||"A";
  const isSuper=admin?.role==="super";
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:isSuper?GOLD:avatarColorFor(admin?.username||label),display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:isSuper?NAVY2:WHITE,flexShrink:0,border:`2px solid ${isSuper?NAVY2:GOLD}`}}>
      {initials}
    </div>
  );
}

// ══════════════════════════════════
// PERMISSIONS
// ══════════════════════════════════
const PERMISSIONS=[
  {key:"manageStaff",label:"Manage Staff",desc:"Edit and delete staff records"},
  {key:"approveLeave",label:"Approve Leave",desc:"Approve or reject leave requests"},
  {key:"viewReports",label:"View Reports",desc:"View and export reports"},
  {key:"formBuilder",label:"Form Builder",desc:"Edit registration form fields"},
  {key:"manageSettings",label:"Manage Settings",desc:"Manage admins & departments"},
];
const ADMIN_LIMIT=5;
function defaultPermissions(){
  return PERMISSIONS.reduce((acc,p)=>({...acc,[p.key]:false}),{});
}

// ══════════════════════════════════
// ADMIN MANAGEMENT
// ══════════════════════════════════
function AdminManagement({admins, onAdd, onRemove}){
  const [form,setForm]=useState({name:"",username:"",password:"",permissions:defaultPermissions()});
  const [errors,setErrors]=useState({});
  const [saving,setSaving]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const atLimit = admins.length>=ADMIN_LIMIT;

  function togglePerm(key){setForm(f=>({...f,permissions:{...f.permissions,[key]:!f.permissions[key]}}));}
  function validate(){
    const e={};
    if(!form.name.trim())e.name="Full name required";
    if(!form.username.trim())e.username="Username required";
    else if(admins.some(a=>a.username===form.username))e.username="Username already taken";
    if(!form.password.trim())e.password="Password required";
    else if(form.password.length<6)e.password="Min 6 characters";
    return e;
  }
  async function handleAdd(){
    if(atLimit) return;
    const errs=validate(); if(Object.keys(errs).length){setErrors(errs);return;}
    setSaving(true);
    await onAdd({...form,role:"admin",id:Date.now().toString()});
    setForm({name:"",username:"",password:"",permissions:defaultPermissions()}); setShowForm(false); setSaving(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Admin Accounts</h2>
          <p style={{fontSize:13,color:"#666",margin:0}}>Manage administrator accounts and permissions. ({admins.length}/{ADMIN_LIMIT} used)</p>
        </div>
        <button onClick={()=>setShowForm(s=>!s)} disabled={atLimit&&!showForm} style={{background:atLimit&&!showForm?"#aaa":NAVY,color:WHITE,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:600,fontSize:13,cursor:atLimit&&!showForm?"not-allowed":"pointer"}}>{showForm?"✕ Cancel":"+ Add Admin"}</button>
      </div>
      {atLimit&&<div style={{background:GOLDL,border:`1px solid ${GOLDM}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:"#7a5c10"}}>⚠️ Admin limit reached ({ADMIN_LIMIT} max). Remove an admin to add a new one.</div>}
      {showForm&&!atLimit&&(
        <div style={{background:WHITE,borderRadius:12,border:`1px solid ${GREENM}`,padding:24,display:"flex",flexDirection:"column",gap:16}}>
          <h3 style={{fontSize:15,fontWeight:700,color:NAVY2,margin:0}}>New Administrator</h3>
          <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
              <AdminAvatar admin={{name:form.name,username:form.username}} size={64}/>
              <span style={{fontSize:10,color:"#999",textAlign:"center"}}>Admin Avatar<br/>(auto-generated)</span>
            </div>
            <div className="ui-grid-3" style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <Field label="Full Name *" error={errors.name}><FInput value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setErrors(x=>({...x,name:undefined}));}} placeholder="Dr. Adaobi Nwosu" hasError={!!errors.name}/></Field>
              <Field label="Username *" error={errors.username}><FInput value={form.username} onChange={e=>{setForm(f=>({...f,username:e.target.value}));setErrors(x=>({...x,username:undefined}));}} placeholder="adaobi.nwosu" hasError={!!errors.username}/></Field>
              <Field label="Password *" error={errors.password}><FInput value={form.password} onChange={e=>{setForm(f=>({...f,password:e.target.value}));setErrors(x=>({...x,password:undefined}));}} type="password" placeholder="Min 6 characters" hasError={!!errors.password}/></Field>
            </div>
          </div>
          <div>
            <p style={{fontSize:12,fontWeight:600,color:NAVY,margin:"0 0 10px"}}>Permissions — choose what this admin can do</p>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {PERMISSIONS.map(p=>(
                <label key={p.key} style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",background:form.permissions[p.key]?GREENL:LGRAY,border:`1px solid ${form.permissions[p.key]?GREENM:GREENM}`,borderRadius:8,padding:"10px 12px"}}>
                  <input type="checkbox" checked={!!form.permissions[p.key]} onChange={()=>togglePerm(p.key)} style={{marginTop:2,width:16,height:16}}/>
                  <div><p style={{margin:0,fontSize:12,fontWeight:600,color:NAVY2}}>{p.label}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{p.desc}</p></div>
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={handleAdd} disabled={saving} style={{background:saving?"#aaa":GOLD,color:saving?WHITE:NAVY2,border:"none",borderRadius:6,padding:"10px 24px",fontWeight:700,fontSize:13,cursor:saving?"not-allowed":"pointer"}}>{saving?"Saving…":"Create Admin Account ✓"}</button>
          </div>
        </div>
      )}
      <div style={{background:WHITE,borderRadius:12,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",background:GREENL,borderBottom:`1px solid ${GREENM}`}}>
          <p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:0}}>Current Administrators ({admins.length+1})</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderBottom:`1px solid ${GREENL}`,flexWrap:"wrap"}}>
          <AdminAvatar admin={{username:"admin",role:"super"}} size={42}/>
          <div style={{flex:1,minWidth:150}}><p style={{margin:0,fontSize:14,fontWeight:700,color:NAVY2}}>Administrator (Built-in)</p><p style={{margin:0,fontSize:12,color:"#888"}}>@admin · Super Admin</p></div>
          <span style={{background:GOLDL,color:"#7a5c10",border:`1px solid ${GOLDM}`,borderRadius:20,fontSize:11,fontWeight:600,padding:"2px 10px"}}>🛡 Super Admin · All permissions</span>
        </div>
        {admins.map((a,i)=>(
          <div key={a.id||i} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderBottom:i<admins.length-1?`1px solid ${GREENL}`:"none",background:i%2===0?WHITE:GREENL,flexWrap:"wrap"}}>
            <AdminAvatar admin={a} size={42}/>
            <div style={{flex:1,minWidth:150}}>
              <p style={{margin:0,fontSize:14,fontWeight:700,color:NAVY2}}>{a.name}</p>
              <p style={{margin:0,fontSize:12,color:"#888"}}>@{a.username}</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>
                {PERMISSIONS.filter(p=>a.permissions?.[p.key]).map(p=>(
                  <span key={p.key} style={{fontSize:10,background:GREENL,color:GREEN,border:`1px solid ${GREENM}`,borderRadius:12,padding:"1px 7px",fontWeight:600}}>{p.label}</span>
                ))}
                {!PERMISSIONS.some(p=>a.permissions?.[p.key])&&<span style={{fontSize:10,color:"#bbb"}}>No permissions assigned</span>}
              </div>
            </div>
            <button onClick={()=>onRemove(a.id)} style={{padding:"4px 10px",border:"1px solid #fecaca",borderRadius:6,background:WHITE,color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:500}}>Remove</button>
          </div>
        ))}
        {admins.length===0&&<p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"24px 0"}}>No additional admins yet.</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// DEPARTMENT MANAGEMENT
// ══════════════════════════════════
function DepartmentManagement({departments,onUpdate}){
  const [newDept,setNewDept]=useState("");
  function addDept(){
    const v=newDept.trim();
    if(!v||departments.includes(v)) return;
    onUpdate([...departments,v]);
    setNewDept("");
  }
  function removeDept(d){ onUpdate(departments.filter(x=>x!==d)); }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Departments</h2><p style={{fontSize:13,color:"#666",margin:0}}>Manage the list of departments used across the app.</p></div>
      <div style={{display:"flex",gap:10}}>
        <input value={newDept} onChange={e=>setNewDept(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDept()} placeholder="Add new department…" style={{flex:1,padding:"9px 12px",border:`1.5px solid ${GREENM}`,borderRadius:6,fontSize:13}}/>
        <button onClick={addDept} style={{background:GOLD,color:NAVY2,border:"none",borderRadius:6,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Add</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {departments.map(d=>(
          <span key={d} style={{display:"flex",alignItems:"center",gap:8,background:GREENL,border:`1px solid ${GREENM}`,borderRadius:20,padding:"6px 8px 6px 14px",fontSize:12,fontWeight:600,color:NAVY2}}>
            {d}
            <button onClick={()=>removeDept(d)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:13,padding:0,width:18,height:18,borderRadius:"50%"}}>✕</button>
          </span>
        ))}
        {departments.length===0&&<p style={{color:"#bbb",fontSize:13}}>No departments yet.</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════
// SETTINGS PAGE (Admins + Departments)
// ══════════════════════════════════
function SettingsPage({admins,onAdd,onRemove,departments,onUpdateDepartments}){
  const [tab,setTab]=useState("admins");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Settings</h2><p style={{fontSize:13,color:"#666",margin:0}}>Manage administrators, permissions, and departments.</p></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setTab("admins")} style={{padding:"7px 16px",border:`1px solid ${tab==="admins"?NAVY:GREENM}`,borderRadius:20,background:tab==="admins"?NAVY:WHITE,color:tab==="admins"?WHITE:NAVY,cursor:"pointer",fontSize:12,fontWeight:600}}>🛡 Admins</button>
        <button onClick={()=>setTab("departments")} style={{padding:"7px 16px",border:`1px solid ${tab==="departments"?NAVY:GREENM}`,borderRadius:20,background:tab==="departments"?NAVY:WHITE,color:tab==="departments"?WHITE:NAVY,cursor:"pointer",fontSize:12,fontWeight:600}}>🏢 Departments</button>
      </div>
      {tab==="admins"?<AdminManagement admins={admins} onAdd={onAdd} onRemove={onRemove}/>:<DepartmentManagement departments={departments} onUpdate={onUpdateDepartments}/>}
    </div>
  );
}

// ══════════════════════════════════
// FORM BUILDER
// ══════════════════════════════════
function FormBuilder({fieldConfig, onUpdate}){
  const [fields,setFields]=useState(fieldConfig);
  const [newField,setNewField]=useState({label:"",type:"text",section:0,placeholder:"",required:false});
  const [showAdd,setShowAdd]=useState(false);
  function toggle(id){const u=fields.map(f=>f.id===id?{...f,enabled:!f.enabled}:f);setFields(u);onUpdate(u);}
  function toggleRequired(id){const u=fields.map(f=>f.id===id&&!f.system?{...f,required:!f.required}:f);setFields(u);onUpdate(u);}
  function removeCustom(id){const u=fields.filter(f=>f.id!==id);setFields(u);onUpdate(u);}
  function addField(){
    if(!newField.label.trim()) return;
    const id="custom_"+Date.now();
    const u=[...fields,{...newField,id,enabled:true,system:false,custom:true,options:newField.type==="select"?(newField.optionsStr||"").split(",").map(s=>s.trim()).filter(Boolean):[]}];
    setFields(u);onUpdate(u);setNewField({label:"",type:"text",section:0,placeholder:"",required:false});setShowAdd(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div><h2 style={{fontSize:20,fontWeight:700,color:NAVY2,margin:"0 0 4px"}}>Form Builder</h2><p style={{fontSize:13,color:"#666",margin:0}}>Control which fields appear on the registration form.</p></div>
        <button onClick={()=>setShowAdd(s=>!s)} style={{background:NAVY,color:WHITE,border:"none",borderRadius:8,padding:"10px 18px",fontWeight:600,fontSize:13,cursor:"pointer"}}>{showAdd?"✕ Cancel":"+ Add Field"}</button>
      </div>
      {showAdd&&(
        <div style={{background:WHITE,borderRadius:12,border:`1px solid ${GOLD}55`,padding:20,display:"flex",flexDirection:"column",gap:14}}>
          <h3 style={{fontSize:14,fontWeight:700,color:NAVY2,margin:0}}>New Custom Field</h3>
          <div className="ui-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
            <Field label="Field Label *"><FInput value={newField.label} onChange={e=>setNewField(f=>({...f,label:e.target.value}))} placeholder="e.g. Staff Number"/></Field>
            <Field label="Field Type"><select value={newField.type} onChange={e=>setNewField(f=>({...f,type:e.target.value}))} style={{padding:"8px 10px",border:`1.5px solid ${GREENM}`,borderRadius:6,fontSize:13,background:WHITE}}>
              <option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="date">Date</option><option value="select">Dropdown</option><option value="number">Number</option>
            </select></Field>
            <Field label="Section"><select value={newField.section} onChange={e=>setNewField(f=>({...f,section:parseInt(e.target.value)}))} style={{padding:"8px 10px",border:`1.5px solid ${GREENM}`,borderRadius:6,fontSize:13,background:WHITE}}>
              {SECTIONS.map((s,i)=><option key={i} value={i}>{s}</option>)}
            </select></Field>
          </div>
          <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Placeholder text"><FInput value={newField.placeholder||""} onChange={e=>setNewField(f=>({...f,placeholder:e.target.value}))} placeholder="e.g. Enter your staff number"/></Field>
            {newField.type==="select"&&<Field label="Options (comma-separated)"><FInput value={newField.optionsStr||""} onChange={e=>setNewField(f=>({...f,optionsStr:e.target.value}))} placeholder="Option A, Option B"/></Field>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"space-between",flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:NAVY}}>
              <input type="checkbox" checked={newField.required} onChange={e=>setNewField(f=>({...f,required:e.target.checked}))} style={{width:16,height:16}}/> Required field
            </label>
            <button onClick={addField} style={{background:GOLD,color:NAVY2,border:"none",borderRadius:6,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Add Field ✓</button>
          </div>
        </div>
      )}
      {SECTIONS.map((secName,secIdx)=>{
        const secFields=fields.filter(f=>f.section===secIdx);
        return(
          <div key={secName} style={{background:WHITE,borderRadius:12,border:`1px solid ${GREENM}`,overflow:"hidden"}}>
            <div style={{padding:"12px 18px",background:GREENL,borderBottom:`1px solid ${GREENM}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{["👤","📞","💼","🚨"][secIdx]}</span>
              <p style={{fontWeight:600,color:NAVY2,fontSize:14,margin:0}}>{secName}</p>
            </div>
            {secFields.map((f,i)=>(
              <div key={f.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<secFields.length-1?`1px solid ${GREENL}`:"none",background:f.enabled?WHITE:"#f9fafb",opacity:f.enabled?1:0.7,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:600,color:f.enabled?NAVY2:"#aaa"}}>{f.label}</p>
                    {f.system&&<span style={{background:GOLDL,color:"#7a5c10",border:`1px solid ${GOLDM}`,borderRadius:20,fontSize:10,fontWeight:600,padding:"1px 8px"}}>System</span>}
                    {f.custom&&<span style={{background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:20,fontSize:10,fontWeight:600,padding:"1px 8px"}}>Custom</span>}
                    {f.required&&f.enabled&&<span style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:20,fontSize:10,fontWeight:600,padding:"1px 8px"}}>Required</span>}
                  </div>
                  <p style={{margin:"2px 0 0",fontSize:11,color:"#aaa"}}>Type: {f.type} · ID: {f.id}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {!f.system&&f.enabled&&<button onClick={()=>toggleRequired(f.id)} style={{padding:"4px 10px",border:`1px solid ${f.required?"#fecaca":GREENM}`,borderRadius:6,background:WHITE,color:f.required?"#dc2626":GREEN,cursor:"pointer",fontSize:11,fontWeight:500}}>{f.required?"Optional":"Require"}</button>}
                  {f.custom&&<button onClick={()=>removeCustom(f.id)} style={{padding:"4px 8px",border:"1px solid #fecaca",borderRadius:6,background:WHITE,color:"#dc2626",cursor:"pointer",fontSize:11}}>✕</button>}
                  {!f.system?(
                    <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:NAVY,userSelect:"none"}}>
                      <div onClick={()=>toggle(f.id)} style={{width:42,height:22,borderRadius:11,background:f.enabled?GREEN:"#ccc",position:"relative",cursor:"pointer"}}>
                        <div style={{position:"absolute",top:2,left:f.enabled?20:2,width:18,height:18,borderRadius:"50%",background:WHITE}}/>
                      </div>
                      {f.enabled?"On":"Off"}
                    </label>
                  ):<span style={{fontSize:11,color:"#bbb",fontStyle:"italic",minWidth:60,textAlign:"right"}}>Always on</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}


// STAFF DETAIL MODAL (read-only full details)

function DetailRow({label,value}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:2,padding:"8px 0",borderBottom:`1px solid ${GREENL}`}}>
      <span style={{fontSize:11,color:"#888",fontWeight:600,letterSpacing:0.3}}>{label}</span>
      <span style={{fontSize:13,color:NAVY2,fontWeight:500}}>{value||"—"}</span>
    </div>
  );
}
function StaffDetailModal({member,onClose,onEdit}){
  const cfg=LEAVE_CONFIGS[member.leaveType];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:WHITE,borderRadius:14,width:"100%",maxWidth:640,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(10,31,92,0.3)"}}>
        <div style={{background:NAVY,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Avatar name={`${member.firstName} ${member.lastName}`} photo={member.passportPhoto} size={48}/>
            <div>
              <p style={{fontWeight:700,color:WHITE,fontSize:16,margin:0}}>{member.firstName} {member.lastName}</p>
              <p style={{color:GOLD,fontSize:12,margin:"2px 0 0",fontWeight:600}}>{member.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",fontSize:18,color:WHITE,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"14px 22px",display:"flex",gap:8,alignItems:"center",borderBottom:`1px solid ${GREENM}`,background:GREENL}}>
          <Badge label={member.status||"Active"}/>
          {member.status==="On Leave"&&member.returnDate&&<LeaveCountdownPill returnDate={member.returnDate}/>}
        </div>
        <div style={{padding:22,display:"flex",flexDirection:"column",gap:22}}>
          <div>
            <p style={{fontWeight:700,color:NAVY,fontSize:13,margin:"0 0 6px",letterSpacing:0.4,textTransform:"uppercase"}}>👤 Personal Info</p>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
              <DetailRow label="First Name" value={member.firstName}/>
              <DetailRow label="Last Name" value={member.lastName}/>
              <DetailRow label="Date of Birth" value={member.dob}/>
              <DetailRow label="Gender" value={member.gender}/>
              <DetailRow label="Nationality" value={member.nationality}/>
            </div>
          </div>
          <div>
            <p style={{fontWeight:700,color:NAVY,fontSize:13,margin:"0 0 6px",letterSpacing:0.4,textTransform:"uppercase"}}>📞 Contact</p>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
              <DetailRow label="Email Address" value={member.email}/>
              <DetailRow label="Phone Number" value={member.phone}/>
              <DetailRow label="Staff Dedicated Mail" value={member.staffEmail}/>
              <DetailRow label="Alternate Mail" value={member.alternateEmail}/>
              <DetailRow label="Address" value={member.address}/>
              <DetailRow label="City" value={member.city}/>
              <DetailRow label="State / Region" value={member.state}/>
            </div>
          </div>
          <div>
            <p style={{fontWeight:700,color:NAVY,fontSize:13,margin:"0 0 6px",letterSpacing:0.4,textTransform:"uppercase"}}>💼 Employment</p>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
              <DetailRow label="Job Title" value={member.jobTitle}/>
              <DetailRow label="Department" value={member.department}/>
              <DetailRow label="Employment Type" value={member.employmentType}/>
              <DetailRow label="Start Date" value={member.startDate}/>
              <DetailRow label="Assumption of Duty Date" value={member.assumptionDate}/>
              <DetailRow label="PF Number" value={member.pfNumber}/>
              <DetailRow label="Status" value={member.status}/>
              {member.status==="On Leave"&&<DetailRow label="Leave Type" value={cfg?`${cfg.icon} ${member.leaveType}`:member.leaveType}/>}
              {member.status==="On Leave"&&<DetailRow label="Leave Start Date" value={member.leaveStartDate}/>}
              {member.status==="On Leave"&&<DetailRow label="Return Date" value={member.returnDate}/>}
            </div>
          </div>
          <div>
            <p style={{fontWeight:700,color:NAVY,fontSize:13,margin:"0 0 6px",letterSpacing:0.4,textTransform:"uppercase"}}>🚨 Emergency Contact</p>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
              <DetailRow label="Contact Name" value={member.emergencyName}/>
              <DetailRow label="Relationship" value={member.emergencyRelation}/>
              <DetailRow label="Contact Phone" value={member.emergencyPhone}/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,padding:"14px 22px",borderTop:`1px solid ${GREENM}`,background:LGRAY}}>
          <button onClick={onClose} style={{padding:"8px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:"#555",fontSize:13}}>Close</button>
          <button onClick={()=>{onClose();onEdit(member);}} style={{background:GOLD,color:NAVY2,border:"none",borderRadius:6,padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:13}}>✎ Edit Record</button>
        </div>
      </div>
    </div>
  );
}


// EDIT MODAL

function EditModal({member,onSave,onClose,departments}){
  const [form,setForm]=useState(member); const [section,setSection]=useState(0);
  const [errors,setErrors]=useState({}); const [saving,setSaving]=useState(false);
  function setF(k,v){
    setForm(f=>{let u={...f,[k]:v};if(k==="status"&&v!=="On Leave"){u.leaveType="";u.returnDate="";u.leaveStartDate="";}if(k==="leaveType"&&v){const s=u.leaveStartDate||todayStr();u.leaveStartDate=s;u.returnDate=getAutoReturnDate(v,s);}if(k==="leaveStartDate"&&u.leaveType){u.returnDate=getAutoReturnDate(u.leaveType,v);}return u;});
    if(errors[k])setErrors(e=>({...e,[k]:undefined}));
  }
  function validate(){
    const e={};
    if(!form.firstName.trim())e.firstName="Required"; if(!form.lastName.trim())e.lastName="Required";
    if(!form.email.trim())e.email="Required"; else if(!/\S+@\S+\.\S+/.test(form.email))e.email="Invalid email";
    if(form.staffEmail&&!/\S+@\S+\.\S+/.test(form.staffEmail))e.staffEmail="Invalid email";
    if(form.alternateEmail&&!/\S+@\S+\.\S+/.test(form.alternateEmail))e.alternateEmail="Invalid email";
    if(!form.phone.trim())e.phone="Required"; if(!form.jobTitle.trim())e.jobTitle="Required"; if(!form.department)e.department="Required";
    if(form.status==="On Leave"){if(!form.leaveType)e.leaveType="Required";if(!form.returnDate)e.returnDate="Required";}
    return e;
  }
  async function handleSave(){const errs=validate();if(Object.keys(errs).length){setErrors(errs);return;}setSaving(true);await onSave(form);setSaving(false);}
  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
  const g3={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:WHITE,borderRadius:14,width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(10,31,92,0.3)"}}>
        <div style={{background:NAVY,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar name={`${form.firstName} ${form.lastName}`} photo={form.passportPhoto} size={36}/>
            <div><p style={{fontWeight:700,color:WHITE,fontSize:14,margin:0}}>{form.firstName} {form.lastName}</p><p style={{color:GOLD,fontSize:11,margin:0,fontWeight:600}}>{form.employeeId}</p></div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",fontSize:18,color:WHITE,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${GREENM}`,display:"flex",alignItems:"center",gap:16}}>
          <PassportUpload value={form.passportPhoto} onChange={v=>setF("passportPhoto",v)}/>
          <div style={{fontSize:12,color:"#666"}}><p style={{margin:0,fontWeight:600,color:NAVY}}>Update passport photo</p><p style={{margin:"4px 0 0",color:"#999"}}>Click to upload a new photo</p></div>
        </div>
        <div className="ui-tabs" style={{display:"flex",borderBottom:`1px solid ${GREENM}`,background:GREENL}}>
          {SECTIONS.map((s,i)=><button key={s} onClick={()=>setSection(i)} style={{flex:1,padding:"10px 6px",fontSize:11,fontWeight:500,border:"none",borderBottom:section===i?`2px solid ${NAVY}`:"2px solid transparent",background:"transparent",cursor:"pointer",color:section===i?NAVY:"#666"}}>{s}</button>)}
        </div>
        <div style={{padding:20}}>
          {section===0&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="ui-grid-2" style={g2}><Field label="First name *" error={errors.firstName}><FInput value={form.firstName} onChange={e=>setF("firstName",e.target.value)} hasError={!!errors.firstName}/></Field><Field label="Last name *" error={errors.lastName}><FInput value={form.lastName} onChange={e=>setF("lastName",e.target.value)} hasError={!!errors.lastName}/></Field></div>
            <div className="ui-grid-3" style={g3}><Field label="Date of birth"><FInput value={form.dob} onChange={e=>setF("dob",e.target.value)} type="date"/></Field><Field label="Gender"><FSelect value={form.gender} onChange={e=>setF("gender",e.target.value)} options={["Male","Female","Non-binary","Prefer not to say"]}/></Field><Field label="Nationality"><FInput value={form.nationality} onChange={e=>setF("nationality",e.target.value)}/></Field></div>
          </div>}
          {section===1&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="ui-grid-2" style={g2}><Field label="Email *" error={errors.email}><FInput value={form.email} onChange={e=>setF("email",e.target.value)} type="email" hasError={!!errors.email}/></Field><Field label="Phone *" error={errors.phone}><FInput value={form.phone} onChange={e=>setF("phone",e.target.value)} hasError={!!errors.phone}/></Field></div>
            <div className="ui-grid-2" style={g2}><Field label="Staff Dedicated Mail" error={errors.staffEmail}><FInput value={form.staffEmail||""} onChange={e=>setF("staffEmail",e.target.value)} type="email" hasError={!!errors.staffEmail}/></Field><Field label="Alternate Mail" error={errors.alternateEmail}><FInput value={form.alternateEmail||""} onChange={e=>setF("alternateEmail",e.target.value)} type="email" hasError={!!errors.alternateEmail}/></Field></div>
            <Field label="Address"><FInput value={form.address} onChange={e=>setF("address",e.target.value)}/></Field>
            <div className="ui-grid-2" style={g2}><Field label="City"><FInput value={form.city} onChange={e=>setF("city",e.target.value)}/></Field><Field label="State"><FInput value={form.state} onChange={e=>setF("state",e.target.value)}/></Field></div>
          </div>}
          {section===2&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="ui-grid-2" style={g2}><Field label="Job title *" error={errors.jobTitle}><FInput value={form.jobTitle} onChange={e=>setF("jobTitle",e.target.value)} hasError={!!errors.jobTitle}/></Field><Field label="Department *" error={errors.department}><FSelect value={form.department} onChange={e=>setF("department",e.target.value)} options={departments} hasError={!!errors.department}/></Field></div>
            <div className="ui-grid-3" style={g3}><Field label="Employment type"><FSelect value={form.employmentType} onChange={e=>setF("employmentType",e.target.value)} options={EMP_TYPES}/></Field><Field label="Start date"><FInput value={form.startDate} onChange={e=>setF("startDate",e.target.value)} type="date"/></Field><Field label="Status"><FSelect value={form.status} onChange={e=>setF("status",e.target.value)} options={STATUS_OPS}/></Field></div>
            <div className="ui-grid-2" style={g2}><Field label="Assumption of Duty Date"><FInput value={form.assumptionDate||""} onChange={e=>setF("assumptionDate",e.target.value)} type="date"/></Field><Field label="PF Number"><FInput value={form.pfNumber||""} onChange={e=>setF("pfNumber",e.target.value)}/></Field></div>
            {form.status==="On Leave"&&<div style={{background:GOLDL,border:`1px solid ${GOLDM}`,borderRadius:10,padding:16,display:"flex",flexDirection:"column",gap:14}}>
              <div className="ui-grid-2" style={g2}><Field label="Type of leave *" error={errors.leaveType}><FSelect value={form.leaveType||""} onChange={e=>setF("leaveType",e.target.value)} options={LEAVE_TYPES} hasError={!!errors.leaveType}/></Field><Field label="Leave start date"><FInput value={form.leaveStartDate||""} onChange={e=>setF("leaveStartDate",e.target.value)} type="date"/></Field></div>
              <Field label="Override return date" error={errors.returnDate}><FInput value={form.returnDate||""} onChange={e=>setF("returnDate",e.target.value)} type="date" hasError={!!errors.returnDate}/></Field>
              <LeaveInfoBanner leaveType={form.leaveType} leaveStartDate={form.leaveStartDate} returnDate={form.returnDate}/>
            </div>}
          </div>}
          {section===3&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="ui-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Contact name"><FInput value={form.emergencyName} onChange={e=>setF("emergencyName",e.target.value)}/></Field><Field label="Relationship"><FInput value={form.emergencyRelation} onChange={e=>setF("emergencyRelation",e.target.value)}/></Field></div>
            <Field label="Phone"><FInput value={form.emergencyPhone} onChange={e=>setF("emergencyPhone",e.target.value)}/></Field>
          </div>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 20px",borderTop:`1px solid ${GREENM}`,background:LGRAY,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 16px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:"#555",fontSize:13}}>Cancel</button>
            {section>0&&<button onClick={()=>setSection(s=>s-1)} style={{padding:"8px 14px",border:`1px solid ${GREENM}`,borderRadius:6,background:WHITE,cursor:"pointer",color:NAVY,fontSize:13}}>← Prev</button>}
          </div>
          {section<3?<button onClick={()=>setSection(s=>s+1)} style={{background:NAVY,color:WHITE,border:"none",borderRadius:6,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontSize:13}}>Next →</button>
            :<button onClick={handleSave} disabled={saving} style={{background:saving?"#aaa":GOLD,color:saving?WHITE:NAVY2,border:"none",borderRadius:6,padding:"8px 18px",fontWeight:700,cursor:saving?"not-allowed":"pointer",fontSize:13}}>{saving?"Saving…":"Save Changes"}</button>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// SETUP GUIDE — includes leave_requests table
// ══════════════════════════════════
function SetupGuide({error}){
  const sql=`-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  first_name text NOT NULL, last_name text NOT NULL,
  dob date, gender text, nationality text,
  email text NOT NULL, phone text NOT NULL,
  staff_email text, alternate_email text,
  address text, city text, state text,
  job_title text NOT NULL, department text,
  employment_type text, start_date date,
  assumption_date date, pf_number text,
  status text DEFAULT 'Active',
  passport_photo text,
  leave_type text, return_date date, leave_start_date date,
  emergency_name text, emergency_relation text, emergency_phone text,
  custom_data text,
  created_at timestamptz DEFAULT now()
);

-- If upgrading an existing table, run these too:
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_email text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS alternate_email text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assumption_date date;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pf_number text;

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  staff_name text NOT NULL,
  department text,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text DEFAULT 'Pending',
  admin_note text,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, message text NOT NULL, time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all staff" ON staff;
DROP POLICY IF EXISTS "Allow all leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow all activity" ON activity_log;

CREATE POLICY "Allow all staff" ON staff FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all leave_requests" ON leave_requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all activity" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);`;
  return(
    <div style={{minHeight:"100vh",background:LGRAY,fontFamily:"system-ui,sans-serif"}}>
      <UIHeader rightContent={null}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 24px"}}>
        <div style={{background:WHITE,borderRadius:16,padding:32,maxWidth:720,width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${GREENM}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:GOLDL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🗄️</div>
            <div><h2 style={{margin:0,fontSize:18,fontWeight:700,color:NAVY2}}>Database setup required</h2><p style={{margin:0,fontSize:13,color:"#666"}}>Run this SQL in your Supabase SQL editor, then reload.</p></div>
          </div>
          {error&&<div style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:12,marginBottom:16}}>Error: {error}</div>}
          <div style={{background:"#1e1e2e",borderRadius:10,padding:20,position:"relative"}}>
            <pre style={{color:"#cdd6f4",fontSize:11,margin:0,overflowX:"auto",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sql}</pre>
            <button onClick={()=>navigator.clipboard.writeText(sql)} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.1)",color:"#cdd6f4",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Copy</button>
          </div>
          <div style={{marginTop:16,padding:"12px 16px",background:GREENL,borderRadius:8,border:`1px solid ${GREENM}`,fontSize:13,color:NAVY}}>
            <strong>Steps:</strong> Supabase dashboard → SQL Editor → paste → Run → reload this page.
          </div>
        </div>
      </div>
    </div>
  );
}


// GLOBAL RESPONSIVE STYLES
function GlobalResponsiveStyles(){
  return (
    <style>{`
      * { box-sizing: border-box; }
      @media (max-width: 700px) {
        .ui-grid-2, .ui-grid-3 { grid-template-columns: 1fr !important; }
        .ui-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        .ui-reports-grid { grid-template-columns: 1fr !important; }
        .ui-tabs { flex-wrap: wrap !important; }
        .ui-tabs button { flex: 1 1 45% !important; }
        .ui-photo-row { flex-direction: column !important; align-items: center !important; text-align: center; }
        .ui-form-shell { padding-left: 4px; padding-right: 4px; }
        .ui-form-actions { flex-direction: column-reverse !important; gap: 8px !important; }
        .ui-form-actions button { width: 100%; }
        .ui-welcome-banner { padding: 18px !important; }
        .ui-welcome-banner > div:last-child { margin-left: 0 !important; width: 100%; }
        .ui-leave-card { flex-direction: column !important; }
        .ui-leave-card > div:last-child { width: 100%; }
        .ui-leave-card button { flex: 1; }
      }
      @media (max-width: 480px) {
        .ui-stats-grid { grid-template-columns: 1fr 1fr !important; }
      }
    `}</style>
  );
}

// ══════════════════════════════════
// MAIN APP
// ══════════════════════════════════
export default function AdminApp(){
  const [screen,setScreen]=useState("role");
  const [page,setPage]=useState("dashboard");
  const [staff,setStaff]=useState([]);
  const [activity,setActivity]=useState([]);
  const [admins,setAdmins]=useState([]);
  const [leaveRequests,setLeaveRequests]=useState([]);
  const [editTarget,setEditTarget]=useState(null);
  const [viewTarget,setViewTarget]=useState(null);
  const [toast,setToast]=useState(null);
  const [loading,setLoading]=useState(false);
  const [dbError,setDbError]=useState(null);
  const [currentAdmin,setCurrentAdmin]=useState(null);
  const [fieldConfig,setFieldConfig]=useState(DEFAULT_FIELDS);
  const [departments,setDepartments]=useState(DEPARTMENTS);
  const [mobileNavOpen,setMobileNavOpen]=useState(false);

  function showToast(msg,type="success"){setToast({msg,type});setTimeout(()=>setToast(null),3500);}

  async function fetchAll(){
    setLoading(true);
    try{
      const[{data:sData,error:sErr},{data:aData,error:aErr},{data:lData,error:lErr}]=await Promise.all([
        supabase.from("staff").select("*").order("created_at",{ascending:false}),
        supabase.from("activity_log").select("*").order("created_at",{ascending:false}),
        supabase.from("leave_requests").select("*").order("created_at",{ascending:false}),
      ]);
      if(sErr||aErr){
        const msg=(sErr||aErr).message||"";
        if(msg.includes("does not exist")||msg.includes("relation")||msg.includes("permission"))setDbError(msg);
        else showToast("Error: "+(sErr||aErr).message,"danger");
      } else {
        setStaff((sData||[]).map(fromDb));
        setActivity((aData||[]).map(a=>({id:a.id,type:a.type,message:a.message,time:a.time})));
        setLeaveRequests((lData||[]).map(leaveReqFromDb));
        setDbError(null);
      }
      // Handle leave_requests table not existing yet (graceful)
      if(lErr && lErr.message?.includes("does not exist")){
        setLeaveRequests([]);
      }
    }catch(e){showToast("Network error: "+e.message,"danger");}
    setLoading(false);
  }

  useEffect(()=>{if(screen==="admin")fetchAll();},[screen]);

  async function logActivity(type,message){
    const t=nowStr();
    await supabase.from("activity_log").insert({type,message,time:t});
    setActivity(a=>[{type,message,time:t},...a]);
  }

  // FIX: Proper insert with error logging + returns a result object
  // so the calling form knows whether the save actually worked.
  async function handleRegister(form){
    const payload = toDb(form);
    const{data,error}=await supabase.from("staff").insert(payload).select().single();
    if(error){
      console.error("Insert error:", error);
      showToast("Save failed: "+error.message,"danger");
      return {success:false, error:error.message};
    }
    setStaff(s=>[fromDb(data),...s]);
    await logActivity("register",`New registration: ${form.firstName} ${form.lastName} (${form.employeeId||genId(form.firstName,form.lastName,form.startDate)})`);
    return {success:true};
  }

  async function handleEdit(form){
    const{error}=await supabase.from("staff").update(toDb(form)).eq("id",form.id);
    if(error){showToast("Update failed: "+error.message,"danger");return;}
    setStaff(s=>s.map(m=>m.id===form.id?form:m));
    await logActivity("edit",`Admin edited: ${form.firstName} ${form.lastName} (${form.employeeId})`);
    showToast("Record updated."); setEditTarget(null);
  }

  async function handleDelete(id){
    const m=staff.find(s=>s.id===id);
    const{error}=await supabase.from("staff").delete().eq("id",id);
    if(error){showToast("Delete failed: "+error.message,"danger");return;}
    setStaff(s=>s.filter(x=>x.id!==id));
    await logActivity("delete",`Admin deleted: ${m?.firstName} ${m?.lastName} (${m?.employeeId})`);
    showToast("Record deleted.","danger");
  }

  // FIX: also returns a result object, mirroring handleRegister
  async function handleLeaveRequest(form){
    const{data,error}=await supabase.from("leave_requests").insert({
      employee_id:form.employeeId,
      staff_name:form.staffName,
      department:form.department,
      leave_type:form.leaveType,
      start_date:form.startDate,
      end_date:form.endDate,
      reason:form.reason,
      status:"Pending",
    }).select().single();
    if(error){
      console.error("Leave request error:",error);
      return {success:false, error:error.message};
    }
    setLeaveRequests(r=>[leaveReqFromDb(data),...r]);
    return {success:true};
  }

  async function handleApproveLeave(id, adminNote){
    const req = leaveRequests.find(r=>r.id===id);
    const{error}=await supabase.from("leave_requests").update({status:"Approved",admin_note:adminNote||null}).eq("id",id);
    if(error){showToast("Failed: "+error.message,"danger");return;}
    setLeaveRequests(r=>r.map(x=>x.id===id?{...x,status:"Approved",adminNote}:x));
    await fetchAll();
    await logActivity("leave-approved",`Leave approved: ${req?.staffName} (${req?.leaveType})`);
    showToast(`Leave approved for ${req?.staffName}.`);
  }

  async function handleRejectLeave(id, adminNote){
    const req = leaveRequests.find(r=>r.id===id);
    const{error}=await supabase.from("leave_requests").update({status:"Rejected",admin_note:adminNote||null}).eq("id",id);
    if(error){showToast("Failed: "+error.message,"danger");return;}
    setLeaveRequests(r=>r.map(x=>x.id===id?{...x,status:"Rejected",adminNote}:x));
    await logActivity("leave-rejected",`Leave rejected: ${req?.staffName} (${req?.leaveType})`);
    showToast(`Leave request for ${req?.staffName} rejected.`,"danger");
  }

  function handleAddAdmin(admin){
    if(admins.length>=ADMIN_LIMIT){ showToast(`Admin limit of ${ADMIN_LIMIT} reached.`,"danger"); return; }
    setAdmins(a=>[...a,admin]);
    logActivity("admin-add",`New admin registered: ${admin.name} (@${admin.username})`);
    showToast(`Admin account created for ${admin.name}.`);
  }
  function handleRemoveAdmin(id){
    const a=admins.find(x=>x.id===id);
    setAdmins(prev=>prev.filter(x=>x.id!==id));
    showToast(`Admin account for ${a?.name||"user"} removed.`,"danger");
  }

  const checkLeaveExpiry=useCallback(()=>{
    setStaff(prev=>{
      const expired=prev.filter(m=>m.status==="On Leave"&&m.returnDate&&getLeaveCountdown(m.returnDate)?.expired);
      if(expired.length===0)return prev;
      expired.forEach(async m=>{
        await supabase.from("staff").update({status:"Active",leave_type:null,return_date:null,leave_start_date:null}).eq("id",m.id);
        await logActivity("auto-return",`Auto-return: ${m.firstName} ${m.lastName} returned from ${m.leaveType||"leave"}`);
        showToast(`${m.firstName} ${m.lastName} automatically set to Active.`);
      });
      return prev.map(m=>{
        if(m.status==="On Leave"&&m.returnDate&&getLeaveCountdown(m.returnDate)?.expired)
          return{...m,status:"Active",leaveType:"",returnDate:"",leaveStartDate:""};
        return m;
      });
    });
  },[]);

  useEffect(()=>{
    if(screen==="admin"){
      checkLeaveExpiry();
      const iv=setInterval(checkLeaveExpiry,60000);
      return()=>clearInterval(iv);
    }
  },[screen,checkLeaveExpiry]);

  const pendingLeaveCount = leaveRequests.filter(r=>r.status==="Pending").length;

  const navItems=[
    {key:"dashboard",label:"Dashboard",icon:"⊞"},
    {key:"staff",label:"Staff Directory",icon:"👥"},
    {key:"leave-requests",label:"Leave Requests",icon:"📋",badge:pendingLeaveCount},
    {key:"reports",label:"Reports",icon:"📊"},
    {key:"activity",label:"Audit Log",icon:"📋"},
    {key:"settings",label:"Settings",icon:"⚙️"},
    {key:"formbuilder",label:"Form Builder",icon:"🛠"},
  ];

  if(screen==="role") return <><GlobalResponsiveStyles/><RoleSelect onSelectRole={r=>{
    if(r==="staff") setScreen("staff-form");
    else if(r==="leave-request") setScreen("leave-request");
    else setScreen("admin-login");
  }}/></>;
  if(screen==="staff-form") return <><GlobalResponsiveStyles/><StaffRegistration onSubmit={handleRegister} onBack={()=>setScreen("role")} fieldConfig={fieldConfig} departments={departments}/></>;
  if(screen==="leave-request") return <><GlobalResponsiveStyles/><LeaveRequestForm onBack={()=>setScreen("role")} onSubmit={handleLeaveRequest} departments={departments}/></>;
  if(screen==="admin-login") return <><GlobalResponsiveStyles/><AdminLogin onLogin={a=>{setCurrentAdmin(a);setScreen("admin");}} onBack={()=>setScreen("role")} admins={admins}/></>;
  if(dbError) return <><GlobalResponsiveStyles/><SetupGuide error={dbError}/></>;

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,sans-serif",background:LGRAY}}>
      <GlobalResponsiveStyles/>
      <style>{`
        .ui-sidebar { width:225px; }
        .ui-sidebar-overlay { display:none; }
        .ui-hamburger { display:none; }
        @media (max-width: 900px) {
          .ui-sidebar {
            position: fixed; top:0; left:0; bottom:0; z-index: 250;
            width: 240px;
            transform: translateX(${mobileNavOpen?"0":"-100%"});
            transition: transform 0.22s ease;
            box-shadow: ${mobileNavOpen?"4px 0 24px rgba(0,0,0,0.3)":"none"};
          }
          .ui-sidebar-overlay {
            display: ${mobileNavOpen?"block":"none"};
            position: fixed; inset:0; background: rgba(0,0,0,0.4); z-index:240;
          }
          .ui-hamburger { display: flex !important; }
          .ui-main-content { padding: 16px !important; }
          .ui-topbar-title { font-size: 13px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="ui-sidebar" style={{background:NAVY2,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:10}}>
          <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png" alt="UI" style={{height:40,width:40,objectFit:"contain",flexShrink:0}} onError={e=>{e.currentTarget.style.display="none";}}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:WHITE,fontWeight:700,fontSize:12,margin:0,lineHeight:1.2}}>Staff Data</p>
            <p style={{color:GOLD,fontSize:10,margin:"2px 0 0",fontWeight:600}}>Admin Portal</p>
          </div>
          <button className="ui-hamburger" onClick={()=>setMobileNavOpen(false)} style={{display:"none",background:"rgba(255,255,255,0.1)",border:"none",color:WHITE,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:16,alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>
        <nav style={{padding:"12px 10px",flex:1,overflowY:"auto"}}>
          {navItems.map(n=>(
            <button key={n.key} onClick={()=>{setPage(n.key);setMobileNavOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,textAlign:"left",marginBottom:2,background:page===n.key?"rgba(201,168,76,0.18)":"transparent",color:page===n.key?GOLD:"rgba(255,255,255,0.7)",borderLeft:page===n.key?`3px solid ${GOLD}`:"3px solid transparent",position:"relative"}}>
              <span style={{fontSize:16}}>{n.icon}</span>
              {n.label}
              {n.badge>0&&<span style={{marginLeft:"auto",background:"#dc2626",color:WHITE,borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 7px",minWidth:18,textAlign:"center"}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:10}}>
          <AdminAvatar admin={currentAdmin} size={36}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:12,fontWeight:600,color:WHITE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentAdmin?.name||currentAdmin?.username||"Admin"}</p>
            <button onClick={()=>setScreen("role")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:11,cursor:"pointer",padding:0}}>⏻ Sign out</button>
          </div>
        </div>
      </div>
      <div className="ui-sidebar-overlay" onClick={()=>setMobileNavOpen(false)}/>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{background:NAVY,borderBottom:`2px solid ${GOLD}`,padding:"0 16px",display:"flex",justifyContent:"space-between",alignItems:"center",height:56,gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            <button className="ui-hamburger" onClick={()=>setMobileNavOpen(true)} style={{display:"none",background:"rgba(255,255,255,0.1)",border:"none",color:WHITE,width:32,height:32,borderRadius:6,cursor:"pointer",fontSize:16,alignItems:"center",justifyContent:"center",flexShrink:0}}>☰</button>
            <p className="ui-topbar-title" style={{fontWeight:700,color:WHITE,fontSize:15,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{navItems.find(n=>n.key===page)?.label}</p>
            {loading&&<span style={{fontSize:11,color:GOLD,background:"rgba(201,168,76,0.15)",padding:"2px 10px",borderRadius:20,flexShrink:0}}>Syncing…</span>}
            <button onClick={fetchAll} style={{fontSize:11,color:"rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"3px 10px",cursor:"pointer",flexShrink:0}}>↻ Refresh</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <AdminAvatar admin={currentAdmin} size={34}/>
          </div>
        </div>

        <div className="ui-main-content" style={{flex:1,padding:28,overflowY:"auto"}}>
          {page==="dashboard"&&<DashboardHome staff={staff} activity={activity} currentAdmin={currentAdmin} pendingLeaveCount={pendingLeaveCount} departments={departments}/>}
          {page==="staff"&&<StaffDirectory staff={staff} onEdit={m=>setEditTarget(m)} onDelete={handleDelete} onView={m=>setViewTarget(m)} departments={departments}/>}
          {page==="leave-requests"&&<LeaveRequestsAdmin requests={leaveRequests} onApprove={handleApproveLeave} onReject={handleRejectLeave} onRefresh={fetchAll}/>}
          {page==="reports"&&<ReportsPage staff={staff} departments={departments}/>}
          {page==="activity"&&<AuditLog activity={activity}/>}
          {page==="settings"&&<SettingsPage admins={admins} onAdd={handleAddAdmin} onRemove={handleRemoveAdmin} departments={departments} onUpdateDepartments={setDepartments}/>}
          {page==="formbuilder"&&<FormBuilder fieldConfig={fieldConfig} onUpdate={setFieldConfig}/>}
        </div>
      </div>

      {editTarget&&<EditModal member={editTarget} onSave={handleEdit} onClose={()=>setEditTarget(null)} departments={departments}/>}
      {viewTarget&&<StaffDetailModal member={viewTarget} onClose={()=>setViewTarget(null)} onEdit={m=>setEditTarget(m)}/>}

      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,left:24,zIndex:300,background:toast.type==="danger"?"#fef2f2":GREENL,color:toast.type==="danger"?"#991b1b":NAVY2,border:`1px solid ${toast.type==="danger"?"#fecaca":GREENM}`,padding:"12px 18px",borderRadius:8,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",maxWidth:420,marginLeft:"auto"}}>
          {toast.type==="danger"?"🗑":"✓"} {toast.msg}
        </div>
      )}
    </div>
  );
}