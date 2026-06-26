import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import {
  PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, ResponsiveContainer, Legend
} from "recharts";

const G   = "#00472B";
const GD  = "#003020";
const GL  = "#e8f4ee";
const GM  = "#c2ddd0";
const GO  = "#C9A84C";
const GOL = "#fdf6e3";
const GOM = "#f0d99a";

const DEPARTMENTS = ["Engineering","Design", "Physics","Chemistry","Computing",
  "Marketing","Sales","HR","Finance","Operations","Legal"];
const STATUS_OPS  = ["Active","On Leave","Probation","Terminated"];
const EMP_TYPES   = ["Full-time","Part-time","Contract","Intern"];

// ── Leave types with default durations (in days) ──
const LEAVE_CONFIGS = {
  "Maternity Leave":     { days: 90,  label: "3 months",  icon: "🤱" },
  "Paternity Leave":     { days: 14,  label: "2 weeks",   icon: "👨‍👶" },
  "Annual Leave":        { days: 21,  label: "3 weeks",   icon: "🌴" },
  "Sick Leave":          { days: 14,  label: "2 weeks",   icon: "🏥" },
  "Study Leave":         { days: 180, label: "6 months",  icon: "📚" },
  "Compassionate Leave": { days: 7,   label: "1 week",    icon: "💛" },
  "Sabbatical Leave":    { days: 365, label: "1 year",    icon: "✈️" },
  "Unpaid Leave":        { days: 30,  label: "1 month",   icon: "📋" },
  "Other":               { days: 30,  label: "30 days",   icon: "📝" },
};
const LEAVE_TYPES = Object.keys(LEAVE_CONFIGS);

const SECTIONS    = ["Personal Info","Contact","Employment","Emergency Contact"];
const ADMIN_CREDS = { username:"admin", password:"ui2024" };

const EMPTY_FORM = {
  firstName:"",lastName:"",dob:"",gender:"",nationality:"",
  email:"",phone:"",address:"",city:"",state:"",
  jobTitle:"",department:"",employmentType:"",startDate:"",
  status:"Active",employeeId:"",
  leaveType:"",returnDate:"",leaveStartDate:"",
  emergencyName:"",emergencyRelation:"",emergencyPhone:"",
};

function genId() { return "UI-"+Math.random().toString(36).slice(2,7).toUpperCase(); }
function now()   {
  return new Date().toLocaleString("en-GB",{
    day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"
  });
}

// Add days to a date and return YYYY-MM-DD string
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Get auto return date when leave type is selected
function getAutoReturnDate(leaveType, leaveStartDate) {
  if (!leaveType || !leaveStartDate) return "";
  const cfg = LEAVE_CONFIGS[leaveType];
  if (!cfg) return "";
  return addDays(leaveStartDate, cfg.days);
}

// Compute detailed countdown breakdown
function getLeaveCountdown(returnDate) {
  if (!returnDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ret = new Date(returnDate);
  ret.setHours(0, 0, 0, 0);
  const totalMs = ret - today;
  const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));

  if (totalDays < 0) return { expired: true, daysOverdue: Math.abs(totalDays) };
  if (totalDays === 0) return { today: true, totalDays: 0 };

  const months = Math.floor(totalDays / 30);
  const weeks  = Math.floor((totalDays % 30) / 7);
  const days   = totalDays % 7;
  return { expired: false, today: false, totalDays, months, weeks, days };
}

// Progress percentage of leave consumed
function getLeaveProgress(leaveStartDate, returnDate) {
  if (!leaveStartDate || !returnDate) return 0;
  const start = new Date(leaveStartDate);
  const end   = new Date(returnDate);
  const now   = new Date();
  const total = end - start;
  const elapsed = now - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

const UI_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/University_of_Ibadan_Main_Gate.jpg/1280px-University_of_Ibadan_Main_Gate.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/University_of_Ibadan_Library.jpg/1280px-University_of_Ibadan_Library.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/University_of_Ibadan_Amphitheatre.jpg/1280px-University_of_Ibadan_Amphitheatre.jpg",
];

function AnimatedBg({ children }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % UI_IMAGES.length);
        setFade(true);
      }, 700);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: "system-ui,sans-serif" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${UI_IMAGES[idx]})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transition: "opacity 0.7s ease", opacity: fade ? 1 : 0, zIndex: 0,
      }}/>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, ${GD}ee 0%, ${G}cc 50%, rgba(0,71,43,0.75) 100%)`,
        zIndex: 1,
      }}/>
      <div style={{ position: "absolute", inset: 0, zIndex: 2, overflow: "hidden", pointerEvents: "none" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute", left: `${-40 + i * 35}%`, top: "-20%",
            width: "30%", height: "140%", background: "rgba(201,168,76,0.06)",
            transform: "rotate(15deg)",
            animation: `shimmer ${4 + i * 1.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 1.2}s`,
          }}/>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
        {UI_IMAGES.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
            background: i === idx ? GO : "rgba(255,255,255,0.4)",
            transition: "all 0.4s ease", cursor: "pointer",
          }}/>
        ))}
      </div>
      <style>{`
        @keyframes shimmer { from { transform: rotate(15deg) translateX(0); } to { transform: rotate(15deg) translateX(60px); } }
        @keyframes floatUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
      <div style={{ position: "relative", zIndex: 5 }}>{children}</div>
    </div>
  );
}

function Avatar({ name, size=36 }) {
  const i=[name.split(" ")[0]?.[0],name.split(" ")[1]?.[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:G,display:"flex",
      alignItems:"center",justifyContent:"center",color:GO,fontWeight:700,
      fontSize:size*0.36,flexShrink:0,border:`2px solid ${GO}`}}>
      {i||"?"}
    </div>
  );
}

function Badge({ label }) {
  const map={
    Active:     {bg:GL,  color:GD,        border:GM },
    "On Leave": {bg:GOL, color:"#7a5c10", border:GOM},
    Probation:  {bg:"#eff6ff",color:"#1e40af",border:"#bfdbfe"},
    Terminated: {bg:"#fef2f2",color:"#991b1b",border:"#fecaca"},
  };
  const c=map[label]||map.Active;
  return <span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,
    borderRadius:20,fontSize:11,fontWeight:600,padding:"2px 10px",whiteSpace:"nowrap"}}>{label}</span>;
}

function Field({ label, error, children }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:12,fontWeight:500,color:G,letterSpacing:0.3}}>{label}</label>
      {children}
      {error&&<span style={{fontSize:11,color:"#dc2626"}}>{error}</span>}
    </div>
  );
}

function FInput({ value, onChange, placeholder, type="text", hasError }) {
  return (
    <input type={type} value={value} placeholder={placeholder} onChange={onChange}
      onFocus={e=>{e.target.style.borderColor=G;e.target.style.outline="none";}}
      onBlur={e=>{e.target.style.borderColor=hasError?"#dc2626":"";}}
      style={{borderColor:hasError?"#dc2626":undefined,width:"100%",boxSizing:"border-box",
        padding:"8px 10px",borderRadius:6,border:`1px solid ${GM}`,fontSize:13}} />
  );
}

function FSelect({ value, onChange, options, hasError }) {
  return (
    <select value={value} onChange={onChange}
      onFocus={e=>{e.target.style.borderColor=G;}}
      onBlur={e=>{e.target.style.borderColor=hasError?"#dc2626":"";}}
      style={{borderColor:hasError?"#dc2626":undefined,width:"100%",boxSizing:"border-box",
        padding:"8px 10px",borderRadius:6,border:`1px solid ${GM}`,fontSize:13,background:"#fff"}}>
      <option value="">Select…</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const PIE_COLORS=["#00472B","#C9A84C","#0891b2","#7c3aed","#dc2626","#059669","#d97706","#db2777"];
const GENDER_COLORS=["#00472B","#C9A84C","#0891b2","#7c3aed","#64748b"];

// ══════════════════════════════════════════════
//  LEAVE COUNTDOWN PILL (compact, for table)
// ══════════════════════════════════════════════
function LeaveCountdownPill({ returnDate }) {
  const cd = getLeaveCountdown(returnDate);
  if (!cd) return <span style={{color:"#bbb",fontSize:11}}>—</span>;
  if (cd.expired) return (
    <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",
      borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>
      {cd.daysOverdue}d overdue
    </span>
  );
  if (cd.today) return (
    <span style={{background:GL,color:G,border:`1px solid ${GM}`,
      borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",
      animation:"pulse 1.5s ease infinite"}}>
      Returns today!
    </span>
  );
  const parts = [];
  if (cd.months > 0) parts.push(`${cd.months}mo`);
  if (cd.weeks  > 0) parts.push(`${cd.weeks}w`);
  if (cd.days   > 0) parts.push(`${cd.days}d`);
  return (
    <span style={{background:GOL,color:"#7a5c10",border:`1px solid ${GOM}`,
      borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px",whiteSpace:"nowrap"}}>
      ⏳ {parts.join(" ")} left
    </span>
  );
}

// ══════════════════════════════════════════════
//  LEAVE COUNTDOWN CARD (rich, for dashboard)
// ══════════════════════════════════════════════
function LeaveCountdownPanel({ staff }) {
  const onLeave = staff.filter(s => s.status === "On Leave");
  if (onLeave.length === 0) return null;

  return (
    <div style={{background:"#fff",borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${GM}`,background:GOL,
        display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>🏖️</span>
        <p style={{fontWeight:600,color:"#7a5c10",fontSize:14,margin:0}}>
          Staff on leave ({onLeave.length})
        </p>
      </div>
      <div>
        {onLeave.map((m, i) => {
          const cd = getLeaveCountdown(m.returnDate);
          const progress = getLeaveProgress(m.leaveStartDate, m.returnDate);
          const cfg = LEAVE_CONFIGS[m.leaveType];
          const isOverdue = cd?.expired;
          const isToday   = cd?.today;

          return (
            <div key={m.id||i} style={{
              padding:"16px 18px",
              borderBottom: i < onLeave.length - 1 ? `1px solid ${GL}` : "none",
              background: isOverdue ? "#fff9f9" : i % 2 === 0 ? "#fff" : GOL,
            }}>
              {/* Top row: avatar + name + badge */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar name={`${m.firstName} ${m.lastName}`} size={38}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:13,color:GD,fontWeight:700}}>
                    {m.firstName} {m.lastName}
                  </p>
                  <p style={{margin:0,fontSize:11,color:"#888"}}>
                    {cfg?.icon} {m.leaveType||"Leave"} · {m.department||"—"}
                  </p>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {isOverdue ? (
                    <span style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",
                      borderRadius:20,fontSize:11,fontWeight:700,padding:"3px 10px"}}>
                      ⚠️ {cd.daysOverdue}d overdue
                    </span>
                  ) : isToday ? (
                    <span style={{background:GL,color:G,border:`1px solid ${GM}`,
                      borderRadius:20,fontSize:11,fontWeight:700,padding:"3px 10px",
                      animation:"pulse 1.5s ease infinite"}}>
                      🔔 Returns today!
                    </span>
                  ) : cd ? (
                    <div style={{textAlign:"right"}}>
                      <p style={{margin:0,fontSize:18,fontWeight:800,color:GD,lineHeight:1}}>
                        {cd.totalDays}
                      </p>
                      <p style={{margin:0,fontSize:10,color:"#888"}}>days left</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Progress bar */}
              {m.leaveStartDate && m.returnDate && !isOverdue && (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:"#aaa"}}>
                      Started {new Date(m.leaveStartDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                    </span>
                    <span style={{fontSize:10,color:"#aaa"}}>
                      Returns {new Date(m.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                    </span>
                  </div>
                  <div style={{height:6,background:"#e8e8e8",borderRadius:4,overflow:"hidden"}}>
                    <div style={{
                      height:"100%",
                      width:`${progress}%`,
                      background: progress > 80
                        ? `linear-gradient(90deg, ${GO}, #dc2626)`
                        : `linear-gradient(90deg, ${G}, ${GO})`,
                      borderRadius:4,
                      transition:"width 0.5s ease",
                    }}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:"#aaa"}}>{progress}% elapsed</span>
                    {cd && !cd.expired && !cd.today && (
                      <span style={{fontSize:10,color:GO,fontWeight:600}}>
                        {cd.months>0?`${cd.months}mo `:""}
                        {cd.weeks>0?`${cd.weeks}w `:""}
                        {cd.days>0?`${cd.days}d`:""} remaining
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Overdue warning */}
              {isOverdue && (
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,
                  padding:"8px 12px",fontSize:12,color:"#dc2626",fontWeight:500}}>
                  ⚠️ Return date passed {cd.daysOverdue} day{cd.daysOverdue===1?"":"s"} ago. Status will update to Active automatically.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  ROLE SELECTION SCREEN
// ══════════════════════════════════════════════
function RoleSelect({ onSelectRole }) {
  return (
    <AnimatedBg>
      <div style={{ padding: 16 }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,animation:"floatUp 0.8s ease forwards"}}>
            <img
              src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png"
              alt="University of Ibadan logo" style={{height:50}}
              onError={e=>{e.currentTarget.style.display="none";}}
            />
            <div style={{lineHeight:1,marginLeft:4}}>
              <p style={{color:"#fff",fontWeight:700,margin:0,fontSize:14}}>University of Ibadan</p>
              <p style={{color:GOM,margin:0,fontSize:11}}>Staff Management System</p>
            </div>
          </div>
          <button onClick={()=>onSelectRole("admin")} style={{
            background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",
            border:`1px solid ${GO}`,borderRadius:20,
            padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:"#fff",
            display:"flex",alignItems:"center",gap:6,
          }}>
            <FontAwesomeIcon icon={faUserShield}/> Admin
          </button>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",marginTop:120}}>
          <div style={{animation:"floatUp 0.9s ease 0.2s both",textAlign:"center"}}>
            <p style={{color:"rgba(255,255,255,0.85)",fontSize:13,marginBottom:24,letterSpacing:0.5}}>
              Welcome to the UI Staff Portal
            </p>
            <button onClick={()=>onSelectRole("staff")} style={{
              background:"rgba(255,255,255,0.12)",backdropFilter:"blur(12px)",
              borderRadius:16,padding:"36px 32px",cursor:"pointer",textAlign:"center",
              border:`1px solid rgba(201,168,76,0.6)`,minWidth:240,transition:"all 0.25s ease",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.2)";e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.transform="translateY(0)";}}
            >
              <div style={{fontSize:44,marginBottom:14,color:GO}}>
                <FontAwesomeIcon icon={faUsers}/>
              </div>
              <p style={{fontWeight:700,color:"#fff",fontSize:16,margin:0}}>Staff Registration</p>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginTop:8,margin:"8px 0 0"}}>
                Register your personal and employment details
              </p>
            </button>
          </div>
        </div>
        <p style={{color:"rgba(255,255,255,0.35)",fontSize:11,textAlign:"center",marginTop:80}}>
          © {new Date().getFullYear()} University of Ibadan · All rights reserved
        </p>
      </div>
    </AnimatedBg>
  );
}

// ══════════════════════════════════════════════
//  ADMIN LOGIN
// ══════════════════════════════════════════════
function AdminLogin({ onLogin, onBack }) {
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [err,setErr]=useState(""); const [show,setShow]=useState(false);

  function attempt() {
    if(u===ADMIN_CREDS.username&&p===ADMIN_CREDS.password) onLogin();
    else setErr("Invalid username or password.");
  }

  return (
    <AnimatedBg>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{
          background:"rgba(255,255,255,0.97)",backdropFilter:"blur(20px)",
          borderRadius:20,padding:"44px 40px",width:"100%",maxWidth:380,
          boxShadow:"0 24px 64px rgba(0,0,0,0.35)",border:`1px solid rgba(201,168,76,0.3)`,
          animation:"floatUp 0.7s ease forwards",
        }}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png"
              alt="UI logo" style={{height:64,marginBottom:14}}
              onError={e=>{e.currentTarget.style.display="none";}}/>
            <h1 style={{fontSize:18,fontWeight:700,color:GD,margin:0}}>Admin Login</h1>
            <p style={{fontSize:12,color:"#888",margin:"6px 0 0"}}>University of Ibadan Staff System</p>
          </div>
          {err&&<div style={{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",
            borderRadius:8,padding:"10px 14px",fontSize:12,marginBottom:16}}>{err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:G,display:"block",marginBottom:5}}>Username</label>
              <input value={u} onChange={e=>{setU(e.target.value);setErr("");}}
                placeholder="admin" onKeyDown={e=>e.key==="Enter"&&attempt()}
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",
                  border:`1.5px solid ${GM}`,borderRadius:8,fontSize:13,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=GM}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:G,display:"block",marginBottom:5}}>Password</label>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={p}
                  onChange={e=>{setP(e.target.value);setErr("");}}
                  placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&attempt()}
                  style={{width:"100%",boxSizing:"border-box",padding:"10px 40px 10px 12px",
                    border:`1.5px solid ${GM}`,borderRadius:8,fontSize:13,outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=GM}/>
                <button onClick={()=>setShow(s=>!s)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:11,fontWeight:600}}>
                  {show?"Hide":"Show"}
                </button>
              </div>
            </div>
            <button onClick={attempt}
              style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:12,
                fontWeight:700,fontSize:14,cursor:"pointer",marginTop:4}}
              onMouseEnter={e=>{e.currentTarget.style.background=GD;}}
              onMouseLeave={e=>{e.currentTarget.style.background=G;}}>
              Sign in
            </button>
            <button onClick={onBack}
              style={{background:"none",border:"none",color:"#888",fontSize:12,cursor:"pointer",padding:0}}>
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </AnimatedBg>
  );
}

// ══════════════════════════════════════════════
//  LEAVE INFO BANNER (shown in forms when on leave)
// ══════════════════════════════════════════════
function LeaveInfoBanner({ leaveType, leaveStartDate, returnDate }) {
  if (!leaveType) return null;
  const cfg = LEAVE_CONFIGS[leaveType];
  if (!cfg) return null;
  const cd = returnDate ? getLeaveCountdown(returnDate) : null;

  return (
    <div style={{background:GOL,border:`1px solid ${GOM}`,borderRadius:10,padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:20}}>{cfg.icon}</span>
        <div>
          <p style={{margin:0,fontWeight:700,color:"#7a5c10",fontSize:13}}>{leaveType}</p>
          <p style={{margin:0,fontSize:11,color:"#a07a20"}}>Standard duration: {cfg.label}</p>
        </div>
      </div>
      {returnDate && cd && (
        <p style={{fontSize:12,color:"#7a5c10",margin:0,fontWeight:500,marginTop:4}}>
          {cd.expired
            ? `⚠️ Return date was ${cd.daysOverdue} day${cd.daysOverdue===1?"":"s"} ago`
            : cd.today
            ? "🔔 Expected to return today"
            : `⏳ ${cd.totalDays} day${cd.totalDays===1?"":"s"} remaining (${
                [cd.months>0?`${cd.months} month${cd.months===1?"":"s"}`:"",
                 cd.weeks>0?`${cd.weeks} week${cd.weeks===1?"":"s"}`:"",
                 cd.days>0?`${cd.days} day${cd.days===1?"":"s"}`:""]
                .filter(Boolean).join(", ")
              })`}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  STAFF REGISTRATION FORM
// ══════════════════════════════════════════════
function StaffRegistration({ onSubmit, onBack }) {
  const [form,setForm]=useState({...EMPTY_FORM,employeeId:genId()});
  const [section,setSection]=useState(0);
  const [errors,setErrors]=useState({});
  const [submitted,setSubmitted]=useState(false);

  function setF(k, v) {
    setForm(f => {
      let updated = {...f, [k]: v};

      // When status changes away from On Leave, clear leave fields
      if (k === "status" && v !== "On Leave") {
        updated.leaveType = "";
        updated.returnDate = "";
        updated.leaveStartDate = "";
      }

      // When leave type changes, auto-set return date from today
      if (k === "leaveType" && v) {
        const startDate = updated.leaveStartDate || todayStr();
        updated.leaveStartDate = startDate;
        updated.returnDate = getAutoReturnDate(v, startDate);
      }

      // When leave start date changes, recalculate return date
      if (k === "leaveStartDate" && updated.leaveType) {
        updated.returnDate = getAutoReturnDate(updated.leaveType, v);
      }

      return updated;
    });
    if (errors[k]) setErrors(e => ({...e, [k]: undefined}));
  }

  function validate() {
    const e={};
    if(!form.firstName.trim())e.firstName="Required";
    if(!form.lastName.trim())e.lastName="Required";
    if(!form.email.trim())e.email="Required";
    else if(!/\S+@\S+\.\S+/.test(form.email))e.email="Invalid email";
    if(!form.phone.trim())e.phone="Required";
    if(!form.jobTitle.trim())e.jobTitle="Required";
    if(!form.department)e.department="Required";
    if(!form.startDate)e.startDate="Required";
    if(form.status==="On Leave"){
      if(!form.leaveType)e.leaveType="Please specify the type of leave";
      if(!form.leaveStartDate)e.leaveStartDate="Please specify when the leave started";
      if(!form.returnDate)e.returnDate="Return date required";
    }
    return e;
  }

  function handleSubmit() {
    const errs=validate();
    if(Object.keys(errs).length){
      setErrors(errs);
      const sf=[
        ["firstName","lastName","dob","gender","nationality"],
        ["email","phone","address","city","state"],
        ["jobTitle","department","employmentType","startDate","status","leaveType","returnDate","leaveStartDate"],
        ["emergencyName","emergencyRelation","emergencyPhone"]
      ];
      for(let i=0;i<sf.length;i++){if(sf[i].some(f=>errs[f])){setSection(i);break;}}
      return;
    }
    onSubmit(form);
    setSubmitted(true);
  }

  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
  const g3={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14};

  if(submitted) return (
    <div style={{minHeight:"100vh",background:"#f4f6f5",display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,padding:"48px 36px",maxWidth:440,width:"100%",
        textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:`1px solid ${GM}`}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:GL,display:"flex",
          alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36}}>✓</div>
        <h2 style={{color:GD,fontSize:20,fontWeight:700,margin:"0 0 10px"}}>Registration submitted!</h2>
        <p style={{color:"#666",fontSize:14,margin:"0 0 6px"}}>
          Thank you, <strong>{form.firstName} {form.lastName}</strong>.
        </p>
        <p style={{color:"#888",fontSize:13,margin:"0 0 28px"}}>
          Your employee ID is <strong style={{color:G}}>{form.employeeId}</strong>. Your details have been submitted for review.
        </p>
        {form.status==="On Leave"&&form.leaveType&&(
          <div style={{background:GOL,border:`1px solid ${GOM}`,borderRadius:8,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
            <p style={{margin:0,fontSize:12,color:"#7a5c10",fontWeight:600}}>
              {LEAVE_CONFIGS[form.leaveType]?.icon} Leave recorded: {form.leaveType}
            </p>
            <p style={{margin:0,fontSize:11,color:"#a07a20",marginTop:4}}>
              Expected return: {form.returnDate ? new Date(form.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "—"}
            </p>
          </div>
        )}
        <button onClick={onBack}
          style={{background:G,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",
            fontWeight:600,fontSize:14,cursor:"pointer"}}>
          Back to home
        </button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f4f6f5",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:G,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png"
            alt="UI logo" style={{height:40}} onError={e=>{e.currentTarget.style.display="none";}}/>
          <div>
            <p style={{color:"#fff",fontWeight:700,fontSize:14,margin:0}}>Staff Registration</p>
            <p style={{color:GOM,fontSize:11,margin:0}}>University of Ibadan</p>
          </div>
        </div>
        <button onClick={onBack}
          style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",
            borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>
          ← Back
        </button>
      </div>

      <div style={{maxWidth:620,margin:"32px auto",padding:"0 16px"}}>
        <div style={{display:"flex",gap:0,marginBottom:20,background:"#fff",
          borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
          {SECTIONS.map((s,i)=>(
            <button key={s} onClick={()=>setSection(i)}
              style={{flex:1,padding:"12px 8px",fontSize:12,fontWeight:500,border:"none",
                borderBottom:section===i?`3px solid ${G}`:"3px solid transparent",
                background:section===i?GL:"transparent",cursor:"pointer",
                color:section===i?G:"#666"}}>
              <span style={{display:"block",fontSize:18,marginBottom:2}}>{["👤","📞","💼","🚨"][i]}</span>
              {s}
            </button>
          ))}
        </div>

        <div style={{background:"#fff",borderRadius:12,border:`1px solid ${GM}`,overflow:"hidden"}}>
          <div style={{padding:24}}>
            {section===0&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",
                background:GL,borderRadius:8,border:`1px solid ${GM}`}}>
                <Avatar name={`${form.firstName||"?"} ${form.lastName||""}`} size={48}/>
                <div>
                  <p style={{fontWeight:600,margin:0,color:GD}}>
                    {form.firstName||form.lastName?`${form.firstName} ${form.lastName}`:"Your name will appear here"}
                  </p>
                  <p style={{fontSize:12,color:G,margin:0,fontWeight:600}}>{form.employeeId}</p>
                </div>
              </div>
              <div style={g2}>
                <Field label="First name *" error={errors.firstName}>
                  <FInput value={form.firstName} onChange={e=>setF("firstName",e.target.value)} placeholder="Ada" hasError={!!errors.firstName}/>
                </Field>
                <Field label="Last name *" error={errors.lastName}>
                  <FInput value={form.lastName} onChange={e=>setF("lastName",e.target.value)} placeholder="Okafor" hasError={!!errors.lastName}/>
                </Field>
              </div>
              <div style={g3}>
                <Field label="Date of birth">
                  <FInput value={form.dob} onChange={e=>setF("dob",e.target.value)} type="date"/>
                </Field>
                <Field label="Gender">
                  <FSelect value={form.gender} onChange={e=>setF("gender",e.target.value)} options={["Male","Female","Non-binary","Prefer not to say"]}/>
                </Field>
                <Field label="Nationality">
                  <FInput value={form.nationality} onChange={e=>setF("nationality",e.target.value)} placeholder="Nigerian"/>
                </Field>
              </div>
            </div>}

            {section===1&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={g2}>
                <Field label="Email address *" error={errors.email}>
                  <FInput value={form.email} onChange={e=>setF("email",e.target.value)} type="email" placeholder="ada@ui.edu.ng" hasError={!!errors.email}/>
                </Field>
                <Field label="Phone number *" error={errors.phone}>
                  <FInput value={form.phone} onChange={e=>setF("phone",e.target.value)} placeholder="+234 800 000 0000" hasError={!!errors.phone}/>
                </Field>
              </div>
              <Field label="Street address">
                <FInput value={form.address} onChange={e=>setF("address",e.target.value)} placeholder="University of Ibadan, Ibadan"/>
              </Field>
              <div style={g2}>
                <Field label="City">
                  <FInput value={form.city} onChange={e=>setF("city",e.target.value)} placeholder="Ibadan"/>
                </Field>
                <Field label="State / Region">
                  <FInput value={form.state} onChange={e=>setF("state",e.target.value)} placeholder="Oyo State"/>
                </Field>
              </div>
            </div>}

            {section===2&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={g2}>
                <Field label="Job title *" error={errors.jobTitle}>
                  <FInput value={form.jobTitle} onChange={e=>setF("jobTitle",e.target.value)} placeholder="Senior Lecturer" hasError={!!errors.jobTitle}/>
                </Field>
                <Field label="Department *" error={errors.department}>
                  <FSelect value={form.department} onChange={e=>setF("department",e.target.value)} options={DEPARTMENTS} hasError={!!errors.department}/>
                </Field>
              </div>
              <div style={g3}>
                <Field label="Employment type">
                  <FSelect value={form.employmentType} onChange={e=>setF("employmentType",e.target.value)} options={EMP_TYPES}/>
                </Field>
                <Field label="Start date *" error={errors.startDate}>
                  <FInput value={form.startDate} onChange={e=>setF("startDate",e.target.value)} type="date" hasError={!!errors.startDate}/>
                </Field>
                <Field label="Status">
                  <FSelect value={form.status} onChange={e=>setF("status",e.target.value)} options={STATUS_OPS}/>
                </Field>
              </div>

              {form.status==="On Leave"&&(
                <div style={{background:GOL,border:`1px solid ${GOM}`,borderRadius:10,padding:16,
                  display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:18}}>🏖️</span>
                    <div>
                      <p style={{fontWeight:700,color:"#7a5c10",fontSize:13,margin:0}}>Leave Details</p>
                      <p style={{fontSize:11,color:"#a07a20",margin:0}}>Select type — return date is set automatically</p>
                    </div>
                  </div>
                  <div style={g2}>
                    <Field label="Type of leave *" error={errors.leaveType}>
                      <FSelect value={form.leaveType} onChange={e=>setF("leaveType",e.target.value)} options={LEAVE_TYPES} hasError={!!errors.leaveType}/>
                    </Field>
                    <Field label="Leave start date *" error={errors.leaveStartDate}>
                      <FInput value={form.leaveStartDate} onChange={e=>setF("leaveStartDate",e.target.value)} type="date" hasError={!!errors.leaveStartDate}/>
                    </Field>
                  </div>

                  {form.leaveType&&(
                    <div style={{background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"10px 14px",
                      display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{LEAVE_CONFIGS[form.leaveType]?.icon}</span>
                      <div>
                        <p style={{margin:0,fontSize:12,fontWeight:600,color:"#7a5c10"}}>
                          Auto-calculated return date
                        </p>
                        <p style={{margin:0,fontSize:13,fontWeight:700,color:GD}}>
                          {form.returnDate
                            ? new Date(form.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})
                            : "Select a leave start date above"}
                        </p>
                        <p style={{margin:0,fontSize:11,color:"#a07a20"}}>
                          Based on {LEAVE_CONFIGS[form.leaveType]?.label} standard duration
                        </p>
                      </div>
                    </div>
                  )}

                  <Field label="Override return date (optional)">
                    <FInput value={form.returnDate} onChange={e=>setF("returnDate",e.target.value)} type="date"/>
                  </Field>

                  <LeaveInfoBanner leaveType={form.leaveType} leaveStartDate={form.leaveStartDate} returnDate={form.returnDate}/>
                </div>
              )}
            </div>}

            {section===3&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:GOL,border:`1px solid ${GOM}`,borderRadius:8,padding:"12px 14px"}}>
                <p style={{fontSize:13,color:"#7a5c10",margin:0,fontWeight:500}}>
                  🚨 Please provide an emergency contact. This information is kept confidential.
                </p>
              </div>
              <div style={g2}>
                <Field label="Contact name">
                  <FInput value={form.emergencyName} onChange={e=>setF("emergencyName",e.target.value)} placeholder="Emeka Okafor"/>
                </Field>
                <Field label="Relationship">
                  <FInput value={form.emergencyRelation} onChange={e=>setF("emergencyRelation",e.target.value)} placeholder="Spouse"/>
                </Field>
              </div>
              <Field label="Phone number">
                <FInput value={form.emergencyPhone} onChange={e=>setF("emergencyPhone",e.target.value)} placeholder="+234 800 000 0001"/>
              </Field>
            </div>}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",padding:"14px 24px",
            borderTop:`1px solid ${GM}`,background:GL}}>
            <div style={{display:"flex",gap:8}}>
              {section>0&&<button onClick={()=>setSection(s=>s-1)}
                style={{padding:"8px 16px",border:`1px solid ${GM}`,borderRadius:6,
                  background:"#fff",cursor:"pointer",color:G,fontSize:13,fontWeight:500}}>
                ← Previous
              </button>}
            </div>
            {section<3
              ? <button onClick={()=>setSection(s=>s+1)}
                  style={{background:G,color:"#fff",border:"none",borderRadius:6,
                    padding:"8px 20px",fontWeight:600,cursor:"pointer",fontSize:13}}>
                  Next →
                </button>
              : <button onClick={handleSubmit}
                  style={{background:GO,color:GD,border:"none",borderRadius:6,
                    padding:"8px 24px",fontWeight:700,cursor:"pointer",fontSize:13}}>
                  Submit registration ✓
                </button>
            }
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:16}}>
          Your data is securely handled by the University of Ibadan admin team.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD HOME
// ══════════════════════════════════════════════
function DashboardHome({ staff, activity }) {
  const total    = staff.length;
  const active   = staff.filter(s=>s.status==="Active").length;
  const onLeave  = staff.filter(s=>s.status==="On Leave").length;
  const fullTime = staff.filter(s=>s.employmentType==="Full-time").length;

  const statusData = STATUS_OPS.map(s=>({name:s,value:staff.filter(m=>m.status===s).length}))
    .filter(d=>d.value>0);
  const genderOptions = ["Male","Female","Non-binary","Prefer not to say"];
  const genderData = genderOptions.map(g=>({name:g,value:staff.filter(s=>s.gender===g).length}))
    .filter(d=>d.value>0);
  const deptPieData = DEPARTMENTS.map(d=>({name:d,value:staff.filter(s=>s.department===d).length}))
    .filter(d=>d.value>0);

  const stats=[
    {label:"Total staff",  value:total,   sub:"All records"},
    {label:"Active",       value:active,  sub:`${total?Math.round(active/total*100):0}% of total`},
    {label:"On leave",     value:onLeave, sub:"Currently away"},
    {label:"Full-time",    value:fullTime,sub:"Permanent staff"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:GD,margin:"0 0 4px"}}>Dashboard</h2>
        <p style={{fontSize:13,color:"#666",margin:0}}>Overview of all staff data and activity.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:"#fff",borderRadius:10,padding:"16px 18px",border:`1px solid ${GM}`}}>
            <p style={{fontSize:11,color:G,fontWeight:600,margin:0,letterSpacing:0.5}}>{s.label.toUpperCase()}</p>
            <p style={{fontSize:28,fontWeight:700,color:GD,margin:"6px 0 2px"}}>{s.value}</p>
            <p style={{fontSize:11,color:"#888",margin:0}}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#fff",borderRadius:10,padding:20,border:`1px solid ${GM}`}}>
          <p style={{fontWeight:600,color:GD,fontSize:14,margin:"0 0 16px"}}>Status breakdown</p>
          {statusData.length===0
            ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({name,percent})=>`${name} ${Math.round(percent*100)}%`}
                    labelLine={false} fontSize={10}>
                    {statusData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/><Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
        <div style={{background:"#fff",borderRadius:10,padding:20,border:`1px solid ${GM}`}}>
          <p style={{fontWeight:600,color:GD,fontSize:14,margin:"0 0 16px"}}>Gender breakdown</p>
          {genderData.length===0
            ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No gender data yet</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({name,percent})=>`${name} ${Math.round(percent*100)}%`}
                    labelLine={false} fontSize={10}>
                    {genderData.map((_,i)=><Cell key={i} fill={GENDER_COLORS[i%GENDER_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/><Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      <div style={{background:"#fff",borderRadius:10,padding:20,border:`1px solid ${GM}`}}>
        <p style={{fontWeight:600,color:GD,fontSize:14,margin:"0 0 16px"}}>Staff by department</p>
        {deptPieData.length===0
          ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No data yet</p>
          : <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={deptPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} label={({name,percent})=>`${name.slice(0,6)} ${Math.round(percent*100)}%`}
                  labelLine={false} fontSize={10}>
                  {deptPieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip/><Legend iconSize={10} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
        }
      </div>

      <LeaveCountdownPanel staff={staff}/>

      <div style={{background:"#fff",borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${GM}`,background:GL}}>
          <p style={{fontWeight:600,color:GD,fontSize:14,margin:0}}>Recent activity</p>
        </div>
        {activity.length===0
          ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No activity yet</p>
          : activity.slice(0,6).map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",
                borderBottom:i<5?`1px solid ${GL}`:"none",background:i%2===0?"#fff":GL}}>
                <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,fontSize:14,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:a.type==="register"?GL:a.type==="edit"?GOL:a.type==="auto-return"?GL:"#fef2f2"}}>
                  {a.type==="register"?"✚":a.type==="edit"?"✎":a.type==="auto-return"?"🔄":"✕"}
                </div>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,color:GD,fontWeight:500}}>{a.message}</p>
                  <p style={{margin:0,fontSize:11,color:"#888"}}>{a.time}</p>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  STAFF DIRECTORY
// ══════════════════════════════════════════════
function StaffDirectory({ staff, onEdit, onDelete }) {
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("lastName");
  const [filterDept,setFilterDept]=useState("");
  const [filterStatus,setFilterStatus]=useState("");

  const filtered = staff
    .filter(m=>{
      const q=search.toLowerCase();
      const matchQ=!q||[m.firstName,m.lastName,m.email,m.department,m.jobTitle,m.employeeId]
        .some(v=>v?.toLowerCase().includes(q));
      return matchQ&&(!filterDept||m.department===filterDept)&&(!filterStatus||m.status===filterStatus);
    })
    .sort((a,b)=>(a[sort]||"").localeCompare(b[sort]||""));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:GD,margin:"0 0 4px"}}>Staff directory</h2>
        <p style={{fontSize:13,color:"#666",margin:0}}>{staff.length} registered members</p>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, email, ID…"
          style={{flex:1,minWidth:180,padding:"8px 12px",border:`1px solid ${GM}`,
            borderRadius:6,fontSize:13,outline:"none"}}
          onFocus={e=>{e.target.style.borderColor=G;}} onBlur={e=>{e.target.style.borderColor=GM;}}/>
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
          style={{padding:"8px 10px",border:`1px solid ${GM}`,borderRadius:6,fontSize:13,background:"#fff"}}>
          <option value="">All departments</option>
          {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{padding:"8px 10px",border:`1px solid ${GM}`,borderRadius:6,fontSize:13,background:"#fff"}}>
          <option value="">All statuses</option>
          {STATUS_OPS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{padding:"8px 10px",border:`1px solid ${GM}`,borderRadius:6,fontSize:13,background:"#fff"}}>
          <option value="lastName">Sort: Last name</option>
          <option value="department">Sort: Department</option>
          <option value="startDate">Sort: Start date</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>

      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"56px 0",background:GL,borderRadius:12,border:`1px solid ${GM}`}}>
            <p style={{fontSize:36,margin:"0 0 12px"}}>👥</p>
            <p style={{fontWeight:600,color:GD,fontSize:16,margin:"0 0 6px"}}>
              {staff.length===0?"No registrations yet":"No results"}
            </p>
            <p style={{fontSize:13,color:"#666",margin:0}}>
              {staff.length===0?"Staff submissions will appear here once they register.":"Try adjusting your filters."}
            </p>
          </div>
        : <div style={{border:`1px solid ${GM}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
                <thead>
                  <tr style={{background:G}}>
                    {["Staff member","Department","Job title","Type","Status","Leave type","Countdown","Actions"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 14px",fontWeight:600,
                        color:GO,fontSize:11,letterSpacing:0.5,whiteSpace:"nowrap"}}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m,i)=>(
                    <tr key={m.id} style={{background:i%2===0?"#fff":GL,fontSize:13}}>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Avatar name={`${m.firstName} ${m.lastName}`} size={32}/>
                          <div>
                            <p style={{fontWeight:600,margin:0,color:GD}}>{m.firstName} {m.lastName}</p>
                            <p style={{fontSize:11,color:G,margin:0,fontWeight:600}}>{m.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{m.department||"—"}</td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`,color:GD}}>{m.jobTitle||"—"}</td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{m.employmentType||"—"}</td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`}}><Badge label={m.status||"Active"}/></td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`,color:"#888",fontSize:12}}>
                        {m.status==="On Leave"&&m.leaveType?(
                          <span>{LEAVE_CONFIGS[m.leaveType]?.icon} {m.leaveType}</span>
                        ):"—"}
                      </td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`}}>
                        {m.status==="On Leave"
                          ? <LeaveCountdownPill returnDate={m.returnDate}/>
                          : <span style={{color:"#ccc",fontSize:12}}>—</span>
                        }
                      </td>
                      <td style={{padding:"12px 14px",borderBottom:`1px solid ${GM}`}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>onEdit(m)}
                            style={{padding:"4px 10px",border:`1px solid ${GM}`,borderRadius:5,
                              background:"#fff",color:G,cursor:"pointer",fontSize:12,fontWeight:500}}>Edit</button>
                          <button onClick={()=>onDelete(m.id)}
                            style={{padding:"4px 10px",border:"1px solid #fecaca",borderRadius:5,
                              background:"#fff",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:500}}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{padding:"10px 14px",fontSize:12,color:G,background:GL,
              borderTop:`1px solid ${GM}`,fontWeight:500}}>
              Showing {filtered.length} of {staff.length} staff members
            </div>
          </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════
//  REPORTS PAGE
// ══════════════════════════════════════════════
function ReportsPage({ staff }) {
  function exportCSV(rows, filename) {
    const headers=["Employee ID","First Name","Last Name","Email","Phone","Department",
      "Job Title","Status","Leave Type","Leave Start","Return Date","Start Date","Employment Type","Gender"];
    const csv=[headers,...rows.map(s=>[s.employeeId,s.firstName,s.lastName,s.email,
      s.phone,s.department,s.jobTitle,s.status,s.leaveType||"",s.leaveStartDate||"",
      s.returnDate||"",s.startDate,s.employmentType,s.gender])]
      .map(r=>r.map(c=>`"${c||""}"`).join(",")).join("\n");
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=filename; a.click();
  }

  const reports=[
    {title:"All staff",       desc:"Complete staff directory",            data:staff,                                           file:"all_staff.csv"},
    {title:"Active staff",    desc:"Currently active members only",       data:staff.filter(s=>s.status==="Active"),            file:"active_staff.csv"},
    {title:"Full-time staff", desc:"Permanent full-time employees",       data:staff.filter(s=>s.employmentType==="Full-time"), file:"fulltime_staff.csv"},
    {title:"On leave",        desc:"Staff currently on leave",            data:staff.filter(s=>s.status==="On Leave"),          file:"on_leave.csv"},
  ];

  const deptSummary=DEPARTMENTS.map(d=>({
    dept:d,
    total:staff.filter(s=>s.department===d).length,
    active:staff.filter(s=>s.department===d&&s.status==="Active").length,
    onLeave:staff.filter(s=>s.department===d&&s.status==="On Leave").length,
    fullTime:staff.filter(s=>s.department===d&&s.employmentType==="Full-time").length,
  })).filter(d=>d.total>0);

  const leaveSummary=LEAVE_TYPES.map(l=>({
    type:l,
    icon:LEAVE_CONFIGS[l]?.icon,
    count:staff.filter(s=>s.status==="On Leave"&&s.leaveType===l).length,
    duration:LEAVE_CONFIGS[l]?.label,
  })).filter(d=>d.count>0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:GD,margin:"0 0 4px"}}>Reports & exports</h2>
        <p style={{fontSize:13,color:"#666",margin:0}}>Download staff data as CSV files.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {reports.map(r=>(
          <div key={r.title} style={{background:"#fff",borderRadius:10,padding:20,
            border:`1px solid ${GM}`,display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <p style={{fontWeight:600,color:GD,fontSize:14,margin:"0 0 4px"}}>{r.title}</p>
              <p style={{fontSize:12,color:"#666",margin:0}}>{r.desc}</p>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:G,margin:0}}>
              {r.data.length} <span style={{fontSize:12,fontWeight:400,color:"#888"}}>records</span>
            </p>
            <button onClick={()=>exportCSV(r.data,r.file)} disabled={r.data.length===0}
              style={{background:r.data.length===0?"#f3f4f6":G,color:r.data.length===0?"#aaa":"#fff",
                border:"none",borderRadius:6,padding:8,fontWeight:600,fontSize:12,
                cursor:r.data.length===0?"not-allowed":"pointer"}}>
              ↓ Export CSV
            </button>
          </div>
        ))}
      </div>

      <div style={{background:"#fff",borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${GM}`,background:GL}}>
          <p style={{fontWeight:600,color:GD,fontSize:14,margin:0}}>Department summary</p>
        </div>
        {deptSummary.length===0
          ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"32px 0"}}>No data yet</p>
          : <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:GL}}>
                  {["Department","Total","Active","On Leave","Full-time"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:11,
                      fontWeight:600,color:G,letterSpacing:0.4,borderBottom:`1px solid ${GM}`}}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptSummary.map((d,i)=>(
                  <tr key={d.dept} style={{background:i%2===0?"#fff":GL}}>
                    <td style={{padding:"11px 16px",borderBottom:`1px solid ${GM}`,fontWeight:500,color:GD}}>{d.dept}</td>
                    <td style={{padding:"11px 16px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{d.total}</td>
                    <td style={{padding:"11px 16px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{d.active}</td>
                    <td style={{padding:"11px 16px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{d.onLeave}</td>
                    <td style={{padding:"11px 16px",borderBottom:`1px solid ${GM}`,color:"#555"}}>{d.fullTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {leaveSummary.length>0&&(
        <div style={{background:"#fff",borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${GM}`,background:GOL}}>
            <p style={{fontWeight:600,color:"#7a5c10",fontSize:14,margin:0}}>🏖️ Leave type breakdown</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:0}}>
            {leaveSummary.map((l,i)=>(
              <div key={l.type} style={{padding:"14px 18px",borderRight:i<leaveSummary.length-1?`1px solid ${GL}`:"none",
                borderBottom:`1px solid ${GL}`}}>
                <p style={{fontSize:11,color:"#888",margin:"0 0 4px"}}>{l.icon} {l.type}</p>
                <p style={{fontSize:22,fontWeight:700,color:GO,margin:0}}>{l.count}</p>
                <p style={{fontSize:10,color:"#bbb",margin:"2px 0 0"}}>std. {l.duration}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  AUDIT LOG
// ══════════════════════════════════════════════
function AuditLog({ activity }) {
  const icons={register:"✚",edit:"✎",delete:"✕","auto-return":"🔄"};
  const colors={register:GL,edit:GOL,delete:"#fef2f2","auto-return":GL};
  const tColors={register:GD,edit:"#7a5c10",delete:"#991b1b","auto-return":G};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:GD,margin:"0 0 4px"}}>Audit log</h2>
        <p style={{fontSize:13,color:"#666",margin:0}}>All actions recorded here.</p>
      </div>
      <div style={{background:"#fff",borderRadius:10,border:`1px solid ${GM}`,overflow:"hidden"}}>
        {activity.length===0
          ? <p style={{color:"#bbb",fontSize:13,textAlign:"center",padding:"48px 0"}}>No activity yet.</p>
          : activity.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
                borderBottom:i<activity.length-1?`1px solid ${GL}`:"none",
                background:i%2===0?"#fff":GL}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:colors[a.type]||GL,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,fontSize:16,color:tColors[a.type]||GD,fontWeight:700}}>
                  {icons[a.type]||"•"}
                </div>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,color:GD,fontWeight:500}}>{a.message}</p>
                  <p style={{margin:0,fontSize:11,color:"#888",marginTop:2}}>{a.time}</p>
                </div>
                <span style={{fontSize:11,background:colors[a.type]||GL,color:tColors[a.type]||GD,
                  padding:"2px 10px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap",textTransform:"capitalize"}}>
                  {a.type}
                </span>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  EDIT MODAL
// ══════════════════════════════════════════════
function EditModal({ member, onSave, onClose }) {
  const [form,setForm]=useState(member);
  const [section,setSection]=useState(0);
  const [errors,setErrors]=useState({});

  function setF(k, v) {
    setForm(f => {
      let updated = {...f, [k]: v};
      if (k === "status" && v !== "On Leave") {
        updated.leaveType = "";
        updated.returnDate = "";
        updated.leaveStartDate = "";
      }
      if (k === "leaveType" && v) {
        const startDate = updated.leaveStartDate || todayStr();
        updated.leaveStartDate = startDate;
        updated.returnDate = getAutoReturnDate(v, startDate);
      }
      if (k === "leaveStartDate" && updated.leaveType) {
        updated.returnDate = getAutoReturnDate(updated.leaveType, v);
      }
      return updated;
    });
    if (errors[k]) setErrors(e => ({...e, [k]: undefined}));
  }

  function validate() {
    const e={};
    if(!form.firstName.trim())e.firstName="Required";
    if(!form.lastName.trim())e.lastName="Required";
    if(!form.email.trim())e.email="Required";
    else if(!/\S+@\S+\.\S+/.test(form.email))e.email="Invalid email";
    if(!form.phone.trim())e.phone="Required";
    if(!form.jobTitle.trim())e.jobTitle="Required";
    if(!form.department)e.department="Required";
    if(form.status==="On Leave"){
      if(!form.leaveType)e.leaveType="Please specify the type of leave";
      if(!form.returnDate)e.returnDate="Return date required";
    }
    return e;
  }

  function handleSave() {
    const errs=validate();
    if(Object.keys(errs).length){setErrors(errs);return;}
    onSave(form);
  }

  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
  const g3={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:560,
        maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px 20px",borderBottom:`1px solid ${GM}`,background:GL}}>
          <p style={{fontWeight:700,color:GD,fontSize:15,margin:0}}>Edit staff record</p>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#666"}}>×</button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${GM}`,background:GL}}>
          {SECTIONS.map((s,i)=>(
            <button key={s} onClick={()=>setSection(i)}
              style={{flex:1,padding:"10px 6px",fontSize:11,fontWeight:500,border:"none",
                borderBottom:section===i?`2px solid ${G}`:"2px solid transparent",
                background:"transparent",cursor:"pointer",color:section===i?G:"#666"}}>
              {s}
            </button>
          ))}
        </div>
        <div style={{padding:20}}>
          {section===0&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={g2}>
              <Field label="First name *" error={errors.firstName}>
                <FInput value={form.firstName} onChange={e=>setF("firstName",e.target.value)} hasError={!!errors.firstName}/>
              </Field>
              <Field label="Last name *" error={errors.lastName}>
                <FInput value={form.lastName} onChange={e=>setF("lastName",e.target.value)} hasError={!!errors.lastName}/>
              </Field>
            </div>
            <div style={g3}>
              <Field label="Date of birth"><FInput value={form.dob} onChange={e=>setF("dob",e.target.value)} type="date"/></Field>
              <Field label="Gender"><FSelect value={form.gender} onChange={e=>setF("gender",e.target.value)} options={["Male","Female","Non-binary","Prefer not to say"]}/></Field>
              <Field label="Nationality"><FInput value={form.nationality} onChange={e=>setF("nationality",e.target.value)}/></Field>
            </div>
          </div>}
          {section===1&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={g2}>
              <Field label="Email *" error={errors.email}>
                <FInput value={form.email} onChange={e=>setF("email",e.target.value)} type="email" hasError={!!errors.email}/>
              </Field>
              <Field label="Phone *" error={errors.phone}>
                <FInput value={form.phone} onChange={e=>setF("phone",e.target.value)} hasError={!!errors.phone}/>
              </Field>
            </div>
            <Field label="Address"><FInput value={form.address} onChange={e=>setF("address",e.target.value)}/></Field>
            <div style={g2}>
              <Field label="City"><FInput value={form.city} onChange={e=>setF("city",e.target.value)}/></Field>
              <Field label="State"><FInput value={form.state} onChange={e=>setF("state",e.target.value)}/></Field>
            </div>
          </div>}
          {section===2&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={g2}>
              <Field label="Job title *" error={errors.jobTitle}>
                <FInput value={form.jobTitle} onChange={e=>setF("jobTitle",e.target.value)} hasError={!!errors.jobTitle}/>
              </Field>
              <Field label="Department *" error={errors.department}>
                <FSelect value={form.department} onChange={e=>setF("department",e.target.value)} options={DEPARTMENTS} hasError={!!errors.department}/>
              </Field>
            </div>
            <div style={g3}>
              <Field label="Employment type"><FSelect value={form.employmentType} onChange={e=>setF("employmentType",e.target.value)} options={EMP_TYPES}/></Field>
              <Field label="Start date"><FInput value={form.startDate} onChange={e=>setF("startDate",e.target.value)} type="date"/></Field>
              <Field label="Status"><FSelect value={form.status} onChange={e=>setF("status",e.target.value)} options={STATUS_OPS}/></Field>
            </div>
            {form.status==="On Leave"&&(
              <div style={{background:GOL,border:`1px solid ${GOM}`,borderRadius:10,padding:16,
                display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>🏖️</span>
                  <div>
                    <p style={{fontWeight:700,color:"#7a5c10",fontSize:13,margin:0}}>Leave Details</p>
                    <p style={{fontSize:11,color:"#a07a20",margin:0}}>Return date auto-calculated from leave type</p>
                  </div>
                </div>
                <div style={g2}>
                  <Field label="Type of leave *" error={errors.leaveType}>
                    <FSelect value={form.leaveType||""} onChange={e=>setF("leaveType",e.target.value)}
                      options={LEAVE_TYPES} hasError={!!errors.leaveType}/>
                  </Field>
                  <Field label="Leave start date">
                    <FInput value={form.leaveStartDate||""} onChange={e=>setF("leaveStartDate",e.target.value)} type="date"/>
                  </Field>
                </div>
                {form.leaveType&&(
                  <div style={{background:"rgba(255,255,255,0.6)",borderRadius:8,padding:"10px 14px",
                    display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>{LEAVE_CONFIGS[form.leaveType]?.icon}</span>
                    <div>
                      <p style={{margin:0,fontSize:11,color:"#a07a20"}}>Auto-calculated return date</p>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:GD}}>
                        {form.returnDate
                          ? new Date(form.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})
                          : "—"}
                      </p>
                    </div>
                  </div>
                )}
                <Field label="Override return date" error={errors.returnDate}>
                  <FInput value={form.returnDate||""} onChange={e=>setF("returnDate",e.target.value)}
                    type="date" hasError={!!errors.returnDate}/>
                </Field>
                <LeaveInfoBanner leaveType={form.leaveType} leaveStartDate={form.leaveStartDate} returnDate={form.returnDate}/>
              </div>
            )}
          </div>}
          {section===3&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={g2}>
              <Field label="Contact name"><FInput value={form.emergencyName} onChange={e=>setF("emergencyName",e.target.value)}/></Field>
              <Field label="Relationship"><FInput value={form.emergencyRelation} onChange={e=>setF("emergencyRelation",e.target.value)}/></Field>
            </div>
            <Field label="Phone"><FInput value={form.emergencyPhone} onChange={e=>setF("emergencyPhone",e.target.value)}/></Field>
          </div>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 20px",
          borderTop:`1px solid ${GM}`,background:GL}}>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 16px",border:`1px solid ${GM}`,borderRadius:6,background:"#fff",cursor:"pointer",color:"#555",fontSize:13}}>Cancel</button>
            {section>0&&<button onClick={()=>setSection(s=>s-1)} style={{padding:"8px 14px",border:`1px solid ${GM}`,borderRadius:6,background:"#fff",cursor:"pointer",color:G,fontSize:13}}>← Prev</button>}
          </div>
          {section<3
            ? <button onClick={()=>setSection(s=>s+1)} style={{background:G,color:"#fff",border:"none",borderRadius:6,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontSize:13}}>Next →</button>
            : <button onClick={handleSave} style={{background:GO,color:GD,border:"none",borderRadius:6,padding:"8px 18px",fontWeight:700,cursor:"pointer",fontSize:13}}>Save changes</button>
          }
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
export default function AdminApp() {
  const [screen,setScreen]=useState("role");
  const [page,setPage]=useState("dashboard");
  const [staff,setStaff]=useState([]);
  const [activity,setActivity]=useState([]);
  const [editTarget,setEditTarget]=useState(null);
  const [toast,setToast]=useState(null);

  function log(type, message) { setActivity(a=>[{type,message,time:now()},...a]); }
  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3500); }

  // ── AUTO-RETURN: check daily if any "On Leave" staff have passed their return date ──
  const checkLeaveExpiry = useCallback(() => {
    setStaff(prev => {
      let changed = false;
      const updated = prev.map(m => {
        if (m.status !== "On Leave" || !m.returnDate) return m;
        const cd = getLeaveCountdown(m.returnDate);
        if (cd && cd.expired) {
          changed = true;
          // Log the auto-return (we do it outside setState via a timeout to avoid batching issues)
          setTimeout(() => {
            setActivity(a => [{
              type: "auto-return",
              message: `Auto-return: ${m.firstName} ${m.lastName} (${m.employeeId}) moved to Active after ${m.leaveType||"leave"} ended`,
              time: now(),
            }, ...a]);
            setToast({
              msg: `${m.firstName} ${m.lastName} automatically set to Active — leave period ended.`,
              type: "success",
            });
            setTimeout(() => setToast(null), 4500);
          }, 50);
          return {...m, status: "Active", leaveType: "", returnDate: "", leaveStartDate: ""};
        }
        return m;
      });
      return changed ? updated : prev;
    });
  }, []);

  // Run on mount and then every minute
  useEffect(() => {
    checkLeaveExpiry();
    const interval = setInterval(checkLeaveExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkLeaveExpiry]);

  function handleRegister(form) {
    setStaff(s=>[...s,{...form,id:Date.now()}]);
    const leaveNote = form.status==="On Leave"&&form.leaveType
      ? ` · ${form.leaveType} (returns ${form.returnDate ? new Date(form.returnDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "TBD"})`
      : "";
    log("register", `New registration: ${form.firstName} ${form.lastName} (${form.employeeId})${leaveNote}`);
  }

  function handleEdit(form) {
    setStaff(s=>s.map(m=>m.id===form.id?form:m));
    log("edit", `Admin edited: ${form.firstName} ${form.lastName} (${form.employeeId})`);
    showToast("Record updated.");
    setEditTarget(null);
  }

  function handleDelete(id) {
    const m=staff.find(s=>s.id===id);
    setStaff(s=>s.filter(x=>x.id!==id));
    log("delete", `Admin deleted: ${m?.firstName} ${m?.lastName} (${m?.employeeId})`);
    showToast("Record deleted.", "danger");
  }

  const navItems=[
    {key:"dashboard", label:"Dashboard",       icon:"⊞"},
    {key:"staff",     label:"Staff directory",  icon:"👥"},
    {key:"reports",   label:"Reports",          icon:"📊"},
    {key:"activity",  label:"Audit log",        icon:"📋"},
  ];

  if(screen==="role")        return <RoleSelect onSelectRole={r=>setScreen(r==="staff"?"staff-form":"admin-login")}/>;
  if(screen==="staff-form")  return <StaffRegistration onSubmit={handleRegister} onBack={()=>setScreen("role")}/>;
  if(screen==="admin-login") return <AdminLogin onLogin={()=>setScreen("admin")} onBack={()=>setScreen("role")}/>;

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,sans-serif",background:"#f4f6f5"}}>
      <div style={{width:220,background:GD,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <img src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png"
            alt="UI" style={{height:46,display:"block",marginBottom:10}}
            onError={e=>{e.currentTarget.style.display="none";}}/>
          <p style={{color:"#fff",fontWeight:700,fontSize:13,margin:0,lineHeight:1.3}}>University of Ibadan</p>
          <p style={{color:GOM,fontSize:11,margin:"2px 0 0"}}>Admin Portal</p>
        </div>
        <nav style={{padding:"12px 10px",flex:1}}>
          {navItems.map(n=>(
            <button key={n.key} onClick={()=>setPage(n.key)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",
                border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,
                textAlign:"left",marginBottom:2,
                background:page===n.key?"rgba(201,168,76,0.18)":"transparent",
                color:page===n.key?GO:"rgba(255,255,255,0.7)"}}>
              <span style={{fontSize:16}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={()=>setScreen("role")}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",
              border:"none",borderRadius:8,cursor:"pointer",fontSize:13,
              background:"transparent",color:"rgba(255,255,255,0.45)"}}>
            ⏻ Sign out
          </button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{background:"#fff",borderBottom:`1px solid ${GM}`,padding:"14px 28px",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontWeight:700,color:GD,fontSize:15,margin:0}}>
            {navItems.find(n=>n.key===page)?.label}
          </p>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:G,display:"flex",
              alignItems:"center",justifyContent:"center",color:GO,fontWeight:700,fontSize:13}}>A</div>
            <div>
              <p style={{margin:0,fontSize:13,fontWeight:600,color:GD}}>Admin</p>
              <p style={{margin:0,fontSize:11,color:"#888"}}>Administrator</p>
            </div>
          </div>
        </div>

        <div style={{flex:1,padding:28,overflowY:"auto"}}>
          {page==="dashboard"&&<DashboardHome staff={staff} activity={activity}/>}
          {page==="staff"    &&<StaffDirectory staff={staff} onEdit={m=>setEditTarget(m)} onDelete={handleDelete}/>}
          {page==="reports"  &&<ReportsPage staff={staff}/>}
          {page==="activity" &&<AuditLog activity={activity}/>}
        </div>
      </div>

      {editTarget&&<EditModal member={editTarget} onSave={handleEdit} onClose={()=>setEditTarget(null)}/>}

      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:300,
          background:toast.type==="danger"?"#fef2f2":GL,
          color:toast.type==="danger"?"#991b1b":GD,
          border:`1px solid ${toast.type==="danger"?"#fecaca":GM}`,
          padding:"12px 18px",borderRadius:8,fontSize:13,fontWeight:500,
          display:"flex",alignItems:"center",gap:8,
          boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
          animation:"floatUp 0.3s ease forwards",
        }}>
          {toast.type==="danger"?"🗑":"✓"} {toast.msg}
        </div>
      )}

      <style>{`@keyframes floatUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}