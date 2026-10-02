import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import "./workplace.css";

const NAV=[["dashboard","⌂","Dashboard"],["staff","👥","Staff"],["chat","💬","Chat"],["teams","🏢","Teams"],["announcements","📢","Announcements"],["tasks","✓","Tasks"],["calendar","📅","Calendar"],["attendance","🕐","Attendance"],["approvals","✓","Approvals"],["documents","📁","Documents"]];

function Btn({children,primary=false,onClick,disabled=false}){return <button className={primary?"btn primary":"btn"} onClick={onClick} disabled={disabled}>{children}</button>}
function Card({children,className=""}){return <section className={"card "+className}>{children}</section>}
function Avatar({name="User",size=40}){const initials=(name||"U").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();return <div className="avatar" style={{width:size,height:size}}>{initials}</div>}
function Empty({text}){return <div className="empty">{text}</div>}

function Login({onLogin}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setError("");const r=await supabase.auth.signInWithPassword({email,password});if(r.error)setError(r.error.message);else onLogin(r.data.user);setBusy(false)}
 return <div className="login-shell"><div className="login-card"><div className="brand-mark">SD</div><h1>Staff Data Workplace</h1><p>People, communication and daily work in one place.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="error">{error}</div>}<Btn primary disabled={busy}>{busy?"Signing in…":"Sign in"}</Btn></form><small>Create the first account in Supabase Authentication, then promote it with the SQL comment at the bottom of workplace_schema.sql.</small></div></div>
}

function Dashboard({profile,staff,tasks,events,announcements,notifications}){
 const open=tasks.filter(t=>t.status!=="done").length;
 return <div><div className="hero"><div><span className="eyebrow">WORKPLACE HUB</span><h2>Good day, {(profile?.full_name||"there").split(" ")[0]}.</h2><p>Your people, communication and work in one place.</p></div><Avatar name={profile?.full_name}/></div><div className="stats"><Card><b>{staff.length}</b><span>Staff</span></Card><Card><b>{open}</b><span>Open tasks</span></Card><Card><b>{events.length}</b><span>Upcoming events</span></Card><Card><b>{notifications.filter(n=>!n.is_read).length}</b><span>Unread alerts</span></Card></div><div className="grid-2"><Card><h3>Announcements</h3>{announcements.slice(0,5).map(a=><div className="feed" key={a.id}><strong>{a.title}</strong><span>{a.content.slice(0,120)}</span></div>)}{!announcements.length&&<Empty text="No announcements yet."/>}</Card><Card><h3>My work</h3>{tasks.slice(0,5).map(t=><div className="feed" key={t.id}><strong>{t.title}</strong><span>{t.status} · {t.due_date||"No deadline"}</span></div>)}{!tasks.length&&<Empty text="No tasks assigned."/>}</Card></div></div>
}

function Staff({staff}){
 const [q,setQ]=useState("");const rows=staff.filter(s=>(String(s.firstName||"")+" "+String(s.lastName||"")+" "+String(s.department||"")+" "+String(s.jobTitle||"")).toLowerCase().includes(q.toLowerCase()));
 return <div><div className="page-head"><div><span className="eyebrow">PEOPLE</span><h2>Staff Directory</h2></div><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search staff…"/></div><Card><div className="table-wrap"><table><thead><tr><th>Staff</th><th>Department</th><th>Job title</th><th>Status</th><th>Employee ID</th></tr></thead><tbody>{rows.map(s=>{const name=String(s.firstName||"")+" "+String(s.lastName||"");return <tr key={s.id}><td><div className="person"><Avatar name={name} size={34}/>{name}</div></td><td>{s.department||"—"}</td><td>{s.jobTitle||"—"}</td><td><span className="pill">{s.status||"Active"}</span></td><td>{s.employeeId||"—"}</td></tr>})}</tbody></table></div>{!rows.length&&<Empty text="No matching staff records."/>}</Card></div>
}

function Chat({user}){
 const [convos,setConvos]=useState([]),[active,setActive]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(""),[people,setPeople]=useState([]);
 async function load(){const {data:m}=await supabase.from("conversation_members").select("conversation_id").eq("user_id",user.id);const ids=(m||[]).map(x=>x.conversation_id);if(ids.length){const {data:c}=await supabase.from("conversations").select("*").in("id",ids).order("created_at",{ascending:false});setConvos(c||[])}const {data:p}=await supabase.from("profiles").select("id,full_name").neq("id",user.id).limit(50);setPeople(p||[])}
 async function open(id){setActive(id);const {data}=await supabase.from("messages").select("*").eq("conversation_id",id).order("created_at");setMessages(data||[])}
 useEffect(()=>{load()},[user.id]);
 useEffect(()=>{if(!active)return;const ch=supabase.channel("chat-"+active).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"conversation_id=eq."+active},p=>setMessages(x=>x.concat(p.new))).subscribe();return()=>{supabase.removeChannel(ch)}},[active]);
 async function newChat(p){const {data:c,error}=await supabase.from("conversations").insert({type:"direct",created_by:user.id}).select().single();if(error)return alert(error.message);await supabase.from("conversation_members").insert([{conversation_id:c.id,user_id:user.id},{conversation_id:c.id,user_id:p.id}]);await load();open(c.id)}
 async function send(e){e.preventDefault();if(!text.trim()||!active)return;const body=text.trim();setText("");const {error}=await supabase.from("messages").insert({conversation_id:active,sender_id:user.id,content:body});if(error)alert(error.message)}
 return <div className="chat-shell"><aside className="chat-list"><div className="chat-head"><h3>Chat</h3></div>{convos.map(c=><button className={"chat-item "+(active===c.id?"selected":"")} key={c.id} onClick={()=>open(c.id)}>{c.name||"Direct conversation"}<small>Conversation</small></button>)}<div className="chat-new"><strong>Start a chat</strong>{people.map(p=><button key={p.id} onClick={()=>newChat(p)}><Avatar name={p.full_name} size={28}/>{p.full_name||"Staff"}</button>)}</div></aside><main className="chat-window"><div className="chat-title"><b>{active?"Conversation":"Select a conversation"}</b></div>{active?<><div className="messages">{messages.map(m=><div className={"message "+(m.sender_id===user.id?"mine":"")} key={m.id}>{m.content}<small>{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></div>)}</div><form className="composer" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a message…"/><Btn primary>Send</Btn></form></>:<Empty text="Choose a conversation or start a new chat."/>}</main></div>
}

function Teams(){
 const [deps,setDeps]=useState([]),[teams,setTeams]=useState([]);
 useEffect(()=>{(async()=>{const a=await supabase.from("departments").select("*").order("name");const b=await supabase.from("teams").select("*,departments(name)").order("name");setDeps(a.data||[]);setTeams(b.data||[])})()},[]);
 return <div><div className="page-head"><div><span className="eyebrow">ORGANIZATION</span><h2>Teams & Departments</h2></div></div><div className="grid-2"><Card><h3>Departments</h3>{deps.map(d=><div className="list-row" key={d.id}>🏢 {d.name}</div>)}</Card><Card><h3>Teams</h3>{teams.map(t=><div className="list-row" key={t.id}>👥 {t.name}<small>{t.departments?.name||""}</small></div>)}{!teams.length&&<Empty text="No teams yet."/>}</Card></div></div>
}

function Announcements({user,profile}){
 const [items,setItems]=useState([]),[title,setTitle]=useState(""),[body,setBody]=useState(""),[priority,setPriority]=useState("normal");
 const can=["owner","admin","hr","manager"].includes(profile?.role);
 async function load(){const {data}=await supabase.from("announcements").select("*").order("published_at",{ascending:false});setItems(data||[])}useEffect(()=>{load()},[]);
 async function add(e){e.preventDefault();if(!title.trim()||!body.trim())return;const r=await supabase.from("announcements").insert({title,content:body,priority,author_id:user.id});if(r.error)alert(r.error.message);else{setTitle("");setBody("");load()}}
 return <div><div className="page-head"><div><span className="eyebrow">COMPANY FEED</span><h2>Announcements</h2></div></div>{can&&<Card><h3>Publish announcement</h3><form className="form-grid" onSubmit={add}><input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/><select value={priority} onChange={e=>setPriority(e.target.value)}><option>normal</option><option>high</option><option>urgent</option></select><textarea className="full" placeholder="Write an announcement…" value={body} onChange={e=>setBody(e.target.value)}/><Btn primary>Publish</Btn></form></Card>}<div className="feed-list">{items.map(a=><Card key={a.id}><span className={"priority "+a.priority}>{a.priority}</span><small>{new Date(a.published_at).toLocaleString()}</small><h3>{a.title}</h3><p>{a.content}</p></Card>)}{!items.length&&<Empty text="No announcements."/>}</div></div>
}

function Tasks({user}){
 const [items,setItems]=useState([]),[title,setTitle]=useState(""),[due,setDue]=useState("");
 async function load(){const {data}=await supabase.from("tasks").select("*").or("assigned_to.eq."+user.id+",assigned_by.eq."+user.id).order("created_at",{ascending:false});setItems(data||[])}useEffect(()=>{load()},[user.id]);
 async function add(e){e.preventDefault();if(!title.trim())return;const r=await supabase.from("tasks").insert({title,assigned_by:user.id,due_date:due||null});if(r.error)alert(r.error.message);setTitle("");setDue("");load()}
 async function done(id){await supabase.from("tasks").update({status:"done",completed_at:new Date().toISOString()}).eq("id",id);load()}
 return <div><div className="page-head"><div><span className="eyebrow">WORK</span><h2>Tasks</h2></div></div><Card><form className="inline-form" onSubmit={add}><input placeholder="Add a task…" value={title} onChange={e=>setTitle(e.target.value)}/><input type="date" value={due} onChange={e=>setDue(e.target.value)}/><Btn primary>Add</Btn></form></Card><div className="task-list">{items.map(t=><Card key={t.id}><div className="task-row"><div><span className={"priority "+t.priority}>{t.priority}</span><h3 className={t.status==="done"?"done":""}>{t.title}</h3><small>{t.due_date?"Due "+new Date(t.due_date).toLocaleDateString():"No deadline"}</small></div>{t.status!=="done"&&<Btn onClick={()=>done(t.id)}>Complete</Btn>}</div></Card>)}{!items.length&&<Empty text="No tasks yet."/>}</div></div>
}

function Calendar({user}){
 const [events,setEvents]=useState([]),[title,setTitle]=useState(""),[date,setDate]=useState("");
 async function load(){const {data}=await supabase.from("events").select("*").order("start_time").limit(50);setEvents(data||[])}useEffect(()=>{load()},[]);
 async function add(e){e.preventDefault();if(!title||!date)return;const r=await supabase.from("events").insert({title,start_time:new Date(date).toISOString(),organizer_id:user.id});if(r.error)alert(r.error.message);setTitle("");setDate("");load()}
 return <div><div className="page-head"><div><span className="eyebrow">SCHEDULE</span><h2>Calendar & Meetings</h2></div></div><Card><form className="inline-form" onSubmit={add}><input placeholder="Meeting title" value={title} onChange={e=>setTitle(e.target.value)}/><input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/><Btn primary>Add event</Btn></form></Card><div className="calendar-list">{events.map(e=><Card key={e.id}><div className="event-row"><div className="date-box">{new Date(e.start_time).toLocaleDateString([], {day:"2-digit",month:"short"})}</div><div><h3>{e.title}</h3><p>{new Date(e.start_time).toLocaleString()}</p></div></div></Card>)}</div></div>
}

function Attendance({user}){
 const [today,setToday]=useState(null),[rows,setRows]=useState([]);
 async function load(){const d=new Date().toISOString().slice(0,10);const a=await supabase.from("attendance").select("*").eq("user_id",user.id).eq("work_date",d).maybeSingle();const b=await supabase.from("attendance").select("*").eq("user_id",user.id).order("work_date",{ascending:false}).limit(10);setToday(a.data);setRows(b.data||[])}useEffect(()=>{load()},[user.id]);
 async function inNow(){await supabase.from("attendance").upsert({user_id:user.id,work_date:new Date().toISOString().slice(0,10),check_in:new Date().toISOString()},{onConflict:"user_id,work_date"});load()}async function outNow(){if(today)await supabase.from("attendance").update({check_out:new Date().toISOString()}).eq("id",today.id);load()}
 return <div><div className="page-head"><div><span className="eyebrow">TIME</span><h2>Attendance</h2></div></div><Card className="attendance-card"><div><span className="eyebrow">TODAY</span><h3>{today?.check_in?"Checked in":"Not checked in"}</h3><p>{today?.check_in?"Started "+new Date(today.check_in).toLocaleTimeString():"Start your workday when you arrive."}</p></div>{!today?.check_in?<Btn primary onClick={inNow}>Check in</Btn>:!today?.check_out?<Btn primary onClick={outNow}>Check out</Btn>:<span className="pill">Day completed</span>}</Card><Card><h3>Recent attendance</h3>{rows.map(r=><div className="list-row" key={r.id}><span>{new Date(r.work_date).toLocaleDateString()}</span><small>{r.check_in?new Date(r.check_in).toLocaleTimeString():"—"} → {r.check_out?new Date(r.check_out).toLocaleTimeString():"—"}</small></div>)}</Card></div>
}

function Approvals({user,profile}){
 const [items,setItems]=useState([]);const can=["owner","admin","hr","manager"].includes(profile?.role);
 async function load(){let q=supabase.from("approval_requests").select("*").order("created_at",{ascending:false});if(!can)q=q.eq("requester_id",user.id);const {data}=await q;setItems(data||[])}useEffect(()=>{load()},[can,user.id]);
 async function request(){await supabase.from("approval_requests").insert({type:"General request",requester_id:user.id,payload:{message:"New approval request"}});load()}async function decide(id,status){await supabase.from("approval_requests").update({status,approver_id:user.id,decided_at:new Date().toISOString()}).eq("id",id);load()}
 return <div><div className="page-head"><div><span className="eyebrow">WORKFLOW</span><h2>Approvals</h2></div>{!can&&<Btn primary onClick={request}>Request approval</Btn>}</div><Card>{items.map(i=><div className="approval-row" key={i.id}><div><strong>{i.type}</strong><small>{new Date(i.created_at).toLocaleString()}</small></div><span className={"status "+i.status}>{i.status}</span>{can&&i.status==="pending"&&<div><Btn onClick={()=>decide(i.id,"approved")}>Approve</Btn> <Btn onClick={()=>decide(i.id,"rejected")}>Reject</Btn></div>}</div>)}{!items.length&&<Empty text="No approval requests."/>}</Card></div>
}

function Documents({user}){
 const [docs,setDocs]=useState([]),[file,setFile]=useState(null);
 async function load(){const {data}=await supabase.from("documents").select("*").order("created_at",{ascending:false});setDocs(data||[])}useEffect(()=>{load()},[]);
 async function upload(){if(!file)return;const path=user.id+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const u=await supabase.storage.from("workplace-documents").upload(path,file);if(u.error)return alert(u.error.message);const d=await supabase.from("documents").insert({name:file.name,storage_path:path,uploaded_by:user.id,size_bytes:file.size,mime_type:file.type});if(d.error)alert(d.error.message);setFile(null);load()}
 async function open(path){const r=await supabase.storage.from("workplace-documents").createSignedUrl(path,300);if(!r.error&&r.data?.signedUrl)window.open(r.data.signedUrl,"_blank")}
 return <div><div className="page-head"><div><span className="eyebrow">FILES</span><h2>Documents</h2></div></div><Card><div className="inline-form"><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/><Btn primary onClick={upload}>Upload</Btn></div></Card><Card>{docs.map(d=><div className="list-row" key={d.id}>📄 {d.name}<Btn onClick={()=>open(d.storage_path)}>Open</Btn></div>)}{!docs.length&&<Empty text="No documents uploaded."/>}</Card></div>
}

export default function WorkplaceApp(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[page,setPage]=useState("dashboard");
 const [staff,setStaff]=useState([]),[tasks,setTasks]=useState([]),[events,setEvents]=useState([]),[announcements,setAnnouncements]=useState([]),[notifications,setNotifications]=useState([]);
 async function loadUser(u){setUser(u);const p=await supabase.from("profiles").select("*").eq("id",u.id).maybeSingle();setProfile(p.data);const [s,t,e,a,n]=await Promise.all([supabase.from("staff").select("*").order("created_at",{ascending:false}),supabase.from("tasks").select("*").or("assigned_to.eq."+u.id+",assigned_by.eq."+u.id).order("created_at",{ascending:false}),supabase.from("events").select("*").order("start_time").limit(20),supabase.from("announcements").select("*").order("published_at",{ascending:false}).limit(20),supabase.from("notifications").select("*").eq("recipient_id",u.id).order("created_at",{ascending:false}).limit(20)]);setStaff(s.data||[]);setTasks(t.data||[]);setEvents(e.data||[]);setAnnouncements(a.data||[]);setNotifications(n.data||[])}
 useEffect(()=>{supabase.auth.getSession().then(r=>{if(r.data.session)loadUser(r.data.session.user)});const x=supabase.auth.onAuthStateChange((_e,s)=>{if(s?.user)loadUser(s.user);else{setUser(null);setProfile(null)}});return()=>x.data.subscription.unsubscribe()},[]);
 if(!user)return <Login onLogin={loadUser}/>;
 const content={dashboard:<Dashboard profile={profile} staff={staff} tasks={tasks} events={events} announcements={announcements} notifications={notifications}/>,staff:<Staff staff={staff}/>,chat:<Chat user={user}/>,teams:<Teams/>,announcements:<Announcements user={user} profile={profile}/>,tasks:<Tasks user={user}/>,calendar:<Calendar user={user}/>,attendance:<Attendance user={user}/>,approvals:<Approvals user={user} profile={profile}/>,documents:<Documents user={user}/>}[page];
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark small">SD</div><div><b>Staff Data</b><span>Workplace</span></div></div><nav>{NAV.map(x=><button className={page===x[0]?"active":""} key={x[0]} onClick={()=>setPage(x[0])}><span>{x[1]}</span>{x[2]}</button>)}</nav><div className="sidebar-bottom"><div className="person"><Avatar name={profile?.full_name||user.email} size={34}/><span>{profile?.full_name||user.email}</span></div><button onClick={()=>supabase.auth.signOut()}>↪ Sign out</button></div></aside><main className="main"><header className="topbar"><div><span className="eyebrow">STAFF DATA</span><h1>{NAV.find(x=>x[0]===page)?.[2]}</h1></div><div className="top-actions"><span className="online">● Online</span><button className="icon-btn" onClick={async()=>{await supabase.from("notifications").update({is_read:true}).eq("recipient_id",user.id);loadUser(user)}}>🔔 {notifications.filter(n=>!n.is_read).length||""}</button></div></header><div className="content">{content}</div></main></div>
}
