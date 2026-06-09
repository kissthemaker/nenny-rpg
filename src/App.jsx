import React, { useState, useEffect, useRef, useCallback } from "react";

const RARITY_COLORS = { Comune:"#aaa", Non_comune:"#4CAF50", Raro:"#2196F3", Epico:"#9C27B0", Leggendario:"#FF9800" };
const statColors = { FOR:"#ef4444", RES:"#22c55e", LCK:"#eab308", SAG:"#3b82f6" };

const LOOT_POOL = [
  { name:"Occhio del Falco",emoji:"👁️",rarity:"Comune",stat:"SAG",val:2 },
  { name:"Guanti di Ferro",emoji:"🥊",rarity:"Comune",stat:"FOR",val:3 },
  { name:"Borsa Vuota",emoji:"👜",rarity:"Comune",stat:null,val:0 },
  { name:"Sandali del Maratoneta",emoji:"👟",rarity:"Non_comune",stat:"RES",val:5 },
  { name:"Pergamena Antica",emoji:"📜",rarity:"Non_comune",stat:"SAG",val:8 },
  { name:"Scudo di Quercia",emoji:"🛡️",rarity:"Non_comune",stat:"RES",val:6 },
  { name:"Mantello dell'Ozioso",emoji:"🧥",rarity:"Raro",stat:"FOR",val:10 },
  { name:"Pozione di Velocità",emoji:"⚡",rarity:"Raro",stat:"RES",val:15 },
  { name:"Gemma del Saggio",emoji:"💎",rarity:"Raro",stat:"SAG",val:12 },
  { name:"Amuleto della Fortuna",emoji:"🍀",rarity:"Epico",stat:"LCK",val:20 },
  { name:"Cristallo Oscuro",emoji:"🔮",rarity:"Epico",stat:"SAG",val:25 },
  { name:"Corona del Watcher",emoji:"👑",rarity:"Leggendario",stat:"ALL",val:50 },
  { name:"Spada di Nenny",emoji:"⚔️",rarity:"Leggendario",stat:"FOR",val:100 },
];

const WEEKLY_LOOT_POOL = [
  { name:"Elmo dell'Eternità",emoji:"⛑️",rarity:"Epico",stat:"RES",val:40 },
  { name:"Anello del Destino",emoji:"💍",rarity:"Epico",stat:"LCK",val:35 },
  { name:"Tomo dei Secoli",emoji:"📚",rarity:"Epico",stat:"SAG",val:45 },
  { name:"Armatura del Campione",emoji:"🛡️",rarity:"Leggendario",stat:"FOR",val:80 },
  { name:"Occhio del Drago",emoji:"🐉",rarity:"Leggendario",stat:"ALL",val:100 },
  { name:"Lama del Giudizio",emoji:"⚡",rarity:"Leggendario",stat:"FOR",val:150 },
];

const DAILY_BOSSES = [
  { name:"Il Procrastinatore",emoji:"😴",hp:100,desc:"Ti vuole sul divano. Per sempre." },
  { name:"Il Divano Oscuro",emoji:"🛋️",hp:120,desc:"Aspira le tue energie vitali." },
  { name:"Lo Scroll Infinito",emoji:"📱",hp:150,desc:"Ti distrae con meme inutili." },
  { name:"Il Re della Noia",emoji:"👿",hp:180,desc:"Rende ogni giornata grigia." },
  { name:"Apatia Suprema",emoji:"🌑",hp:160,desc:"La tua nemesi quotidiana." },
  { name:"Il Tentatore",emoji:"📺",hp:140,desc:"Un altro episodio... solo uno." },
];

const WEEKLY_BOSSES = [
  { name:"Valdrak il Pigro",emoji:"🧌",cost:50,reward:"Epico garantito" },
  { name:"Marchesa dell'Apatia",emoji:"🧛",cost:75,reward:"Epico garantito" },
  { name:"Darknus, Signore del Ritardo",emoji:"💀",cost:100,reward:"Leggendario garantito" },
  { name:"Il Consiglio dell'Inerzia",emoji:"👹",cost:150,reward:"Leggendario garantito" },
];

const TITLES = [
  { threshold:0,    title:"Spettatore Novizio" },
  { threshold:500,  title:"Guardiano dello Schermo" },
  { threshold:1500, title:"Cavaliere dei Gettoni" },
  { threshold:3000, title:"Campione dell'Infinito" },
  { threshold:6000, title:"Maestro Oscuro dei Video" },
  { threshold:10000,title:"Leggenda Vivente" },
];

const getLevel  = xp => Math.floor(Math.pow(xp/100,0.6))+1;
const getTitle  = xp => { let t=TITLES[0]; for(const x of TITLES) if(xp>=x.threshold) t=x; return t.title; };
const xpInfo    = xp => { const l=getLevel(xp),n=Math.pow(l,1/0.6)*100,p=Math.pow(l-1,1/0.6)*100; return {progress:Math.floor(xp-p),total:Math.floor(n-p)}; };

function getLoot(luck, weekly=false) {
  if (weekly) {
    const leg=WEEKLY_LOOT_POOL.filter(l=>l.rarity==="Leggendario");
    const ep=WEEKLY_LOOT_POOL.filter(l=>l.rarity==="Epico");
    return (Math.random()*100+luck/5>70 ? leg : ep)[Math.floor(Math.random()*3)%((Math.random()*100+luck/5>70?leg:ep).length)];
  }
  const r=Math.random()*100, b=luck/10;
  if(r+b>98) return LOOT_POOL.find(l=>l.rarity==="Leggendario");
  if(r+b>90) return LOOT_POOL.find(l=>l.rarity==="Epico");
  if(r+b>75) { const a=LOOT_POOL.filter(l=>l.rarity==="Raro"); return a[Math.floor(Math.random()*a.length)]; }
  if(r+b>50) { const a=LOOT_POOL.filter(l=>l.rarity==="Non_comune"); return a[Math.floor(Math.random()*a.length)]; }
  const a=LOOT_POOL.filter(l=>l.rarity==="Comune"); return a[Math.floor(Math.random()*a.length)];
}

function getGiftLoot() {
  const all=[...LOOT_POOL,...WEEKLY_LOOT_POOL];
  return all[Math.floor(Math.random()*all.length)];
}

const initialState = {
  username: "",
  stats:{FOR:10,RES:10,LCK:10,SAG:10},
  totalXp:0, gettoni:0, gettoniExtra:0,
  streak:0, lastDay:null,
  inventory:[], log:[],
  bossDay:0, weekSeed:0,
  todayDefeated:false, todayLooted:false,
  weeklyBossDefeated:false, weeklyBossLooted:false,
  friends:[],
  inbox:[],
};

function loadLocal() {
  try { const s=localStorage.getItem("nenny_rpg_v3"); return s?{...initialState,...JSON.parse(s)}:initialState; }
  catch { return initialState; }
}
function saveLocal(s) { try { localStorage.setItem("nenny_rpg_v3",JSON.stringify(s)); } catch{} }
async function pushProfile(state) {
  if (!state.username) return;
  const profile = {
    username: state.username,
    level: getLevel(state.totalXp),
    totalXp: state.totalXp,
    gettoni: state.gettoni,
    streak: state.streak,
    stats: state.stats,
    title: getTitle(state.totalXp),
    inventory: state.inventory.slice(-6),
    bossDay: state.bossDay,
    updatedAt: Date.now(),
  };
  await window.storage.set(`player:${state.username}`, JSON.stringify(profile), true);
}

async function fetchProfile(username) {
  try {
    const r = await window.storage.get(`player:${username}`, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function fetchLeaderboard() {
  try {
    const r = await window.storage.list("player:", true);
    if (!r?.keys?.length) return [];
    const profiles = await Promise.all(r.keys.map(async k => {
      try { const v=await window.storage.get(k,true); return v?JSON.parse(v.value):null; } catch{return null;}
    }));
    return profiles.filter(Boolean).sort((a,b)=>b.totalXp-a.totalXp).slice(0,20);
  } catch { return []; }
}

async function sendGift(fromUsername, toUsername, item) {
  try {
    const key = `gift:${toUsername}:${Date.now()}`;
    const gift = { from: fromUsername, item, sentAt: Date.now() };
    await window.storage.set(key, JSON.stringify(gift), true);
    return true;
  } catch { return false; }
}

async function fetchInbox(username) {
  try {
    const r = await window.storage.list(`gift:${username}:`, true);
    if (!r?.keys?.length) return [];
    const gifts = await Promise.all(r.keys.map(async k => {
      try {
        const v=await window.storage.get(k,true);
        return v?{...JSON.parse(v.value),key:k}:null;
      } catch{return null;}
    }));
    return gifts.filter(Boolean).sort((a,b)=>b.sentAt-a.sentAt);
  } catch { return []; }
}

async function deleteGift(key) {
  try { await window.storage.delete(key, true); } catch {}
}

function StatBar({label,value,color}) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginBottom:2}}>
        <span style={{fontFamily:"monospace",fontWeight:700,color}}>{label}</span>
        <span style={{color:"#fff",fontWeight:700}}>{value}</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:4,height:6,overflow:"hidden"}}>
        <div style={{width:`${Math.min(100,(value/300)*100)}%`,background:color,height:"100%",borderRadius:4,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function RarityBadge({rarity}) {
  return <span style={{display:"inline-block",padding:"1px 8px",borderRadius:20,fontSize:9,background:`${RARITY_COLORS[rarity]}20`,border:`1px solid ${RARITY_COLORS[rarity]}`,color:RARITY_COLORS[rarity]}}>{rarity.replace("_"," ")}</span>;
}

function ItemCard({item,weekly=false}) {
  return (
    <div style={{background:weekly?`${RARITY_COLORS[item.rarity]}12`:"rgba(255,255,255,0.02)",border:`1px solid ${RARITY_COLORS[item.rarity]}${weekly?"70":"30"}`,borderRadius:8,padding:8}}>
      <div style={{fontSize:18}}>{item.emoji}{weekly&&<span style={{fontSize:8,color:"#f59e0b"}}>⭐</span>}</div>
      <div style={{fontSize:10,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
      <div style={{fontSize:8,color:"#555"}}>{item.date}</div>
    </div>
  );
}
export default function NennyRPG() {
  const [state, setState] = useState(loadLocal);
  const [screen, setScreen]   = useState(state.username?"main":"register");
  const [tab, setTab]         = useState("daily");
  const [socialTab, setSocialTab] = useState("leaderboard");
  const [videoInput, setVideoInput] = useState("");
  const [battleLog, setBattleLog]   = useState([]);
  const [lootResult, setLootResult] = useState(null);
  const [isWeeklyLoot, setIsWeeklyLoot] = useState(false);
  const [isGiftLoot, setIsGiftLoot]   = useState(false);
  const [leveledUp, setLeveledUp]     = useState(false);
  const [aiText, setAiText]     = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB]     = useState(false);
  const [friendInput, setFriendInput] = useState("");
  const [friendProfiles, setFriendProfiles] = useState({});
  const [inbox, setInbox]     = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [giftTarget, setGiftTarget]   = useState(null);
  const [giftSending, setGiftSending] = useState(false);
  const [giftMsg, setGiftMsg]   = useState("");
  const [registerName, setRegisterName] = useState("Nenny");
  const [regError, setRegError] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);

  useEffect(() => {
    saveLocal(state);
    if (state.username) pushProfile(state).catch(()=>{});
  }, [state]);

  const level = getLevel(state.totalXp);
  const xi    = xpInfo(state.totalXp);
  const title = getTitle(state.totalXp);
  const dailyBoss  = DAILY_BOSSES[state.bossDay % DAILY_BOSSES.length];
  const weeklyBoss = WEEKLY_BOSSES[state.weekSeed % WEEKLY_BOSSES.length];
  const canFightWeekly = state.gettoniExtra >= weeklyBoss.cost;
  const cents = (state.gettoni/10).toFixed(2);

  async function handleRegister() {
    const name = registerName.trim();
    if (!name || name.length < 2) { setRegError("Almeno 2 caratteri!"); return; }
    if (name.length > 20)         { setRegError("Max 20 caratteri!"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setRegError("Solo lettere, numeri e _"); return; }
    const existing = await fetchProfile(name);
    if (existing) { setRegError("Username già preso! Scegline un altro."); return; }
    setState(prev => { const n={...prev,username:name}; saveLocal(n); return n; });
    setScreen("main");
  }

  async function generateAi(videos, bossName, won, weekly=false) {
    setLoadingAi(true);
    try {
      const prompt = weekly
        ? `Sei un narratore epico RPG fantasy in italiano. ${state.username} ha sconfitto il boss settimanale "${bossName}" spendendo gettoni extra accumulati guardando video. Scrivi 2 righe EPICHE. Stile JRPG anni 90.`
        : won
          ? `Sei un narratore epico RPG fantasy in italiano. ${state.username} ha guardato ${videos} video oggi sconfiggendo "${bossName}". ${videos>100?`Ha accumulato ${videos-100} gettoni extra!`:""} Scrivi 2 righe epiche. Stile videogioco anni 90.`
          : `Sei un narratore epico RPG fantasy in italiano. ${state.username} ha guardato solo ${videos} video (servivano 100) e "${bossName}" ha vinto. 2 righe drammatiche ma incoraggianti.`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] }),
      });
      const data = await res.json();
      setAiText(data.content?.map(b=>b.text||"").join("")||"");
    } catch { setAiText(""); }
    setLoadingAi(false);
  }

  function submitDay() {
    const videos = parseInt(videoInput);
    if (isNaN(videos)||videos<0) return;
    const won   = videos>=100;
    const extra = won?Math.max(0,videos-100):0;
    const xpG   = Math.floor(videos*(won?1.5:0.8));
    const prevLv = getLevel(state.totalXp);
    const newXp  = state.totalXp+xpG;
    if (getLevel(newXp)>prevLv) setLeveledUp(true);
    setState(prev=>({
      ...prev, totalXp:newXp,
      gettoni:prev.gettoni+videos,
      gettoniExtra:prev.gettoniExtra+extra,
      streak:won?prev.streak+1:0,
      lastDay:new Date().toDateString(),
      todayVideos:videos, todayDefeated:won, todayLooted:false,
      bossDay:prev.bossDay+1,
      log:[...(prev.log||[]).slice(-20),`[${new Date().toLocaleDateString("it")}] ${videos} video — ${won?`✅ +${extra}🔥`:"❌"} (+${xpG} XP)`],
    }));
    setBattleLog([
      `⚔️ ${state.username} affronta ${dailyBoss.name} ${dailyBoss.emoji}`,
      `📺 Video guardati: ${videos}`,
      won?`💥 Boss sconfitto! +${xpG} XP`:`😤 Sconfitta... il boss regge.`,
      ...(extra>0?[`🔥 +${extra} gettoni extra → riserva settimanale`]:[]),
      ...(won&&state.streak+1>1?[`🔥 Streak ${state.streak+1} giorni!`]:[]),
    ]);
    setIsWeeklyLoot(false); setIsGiftLoot(false);
    setScreen("battle");
    generateAi(videos,dailyBoss.name,won,false);
    setVideoInput("");
  }

  function fightWeekly() {
    if (!canFightWeekly) return;
    const xpB = weeklyBoss.cost*3;
    setState(prev=>({
      ...prev, gettoniExtra:prev.gettoniExtra-weeklyBoss.cost,
      totalXp:prev.totalXp+xpB,
      weeklyBossDefeated:true, weeklyBossLooted:false,
      weekSeed:prev.weekSeed+1,
      log:[...(prev.log||[]).slice(-20),`[${new Date().toLocaleDateString("it")}] 🏆 "${weeklyBoss.name}" sconfitto! (+${xpB} XP)`],
    }));
    setBattleLog([
      `🏆 BOSS SETTIMANALE: ${weeklyBoss.name} ${weeklyBoss.emoji}`,
      `💸 Spesi ${weeklyBoss.cost} gettoni extra`,
      `💥 DEVASTATO! +${xpB} XP bonus!`,
      `🎁 Loot ${weeklyBoss.reward} disponibile!`,
    ]);
    setIsWeeklyLoot(true); setIsGiftLoot(false);
    setScreen("battle");
    generateAi(0,weeklyBoss.name,true,true);
  }

  function claimLoot(weekly=false, gift=false, giftItem=null) {
    const loot = gift ? giftItem : getLoot(state.stats.LCK, weekly);
    setLootResult(loot);
    const newStats={...state.stats};
    if(loot.stat==="ALL") Object.keys(newStats).forEach(k=>newStats[k]+=loot.val);
    else if(loot.stat) newStats[loot.stat]=(newStats[loot.stat]||0)+loot.val;
    setState(prev=>({
      ...prev, stats:newStats,
      todayLooted:gift?prev.todayLooted:(weekly?prev.todayLooted:true),
      weeklyBossLooted:weekly?true:prev.weeklyBossLooted,
      inventory:[...(prev.inventory||[]).slice(-29),{...loot,date:new Date().toLocaleDateString("it"),weekly,gift}],
    }));
    setScreen("loot");
  }

  async function loadLeaderboard() {
    setLoadingLB(true);
    const lb = await fetchLeaderboard();
    setLeaderboard(lb);
    setLoadingLB(false);
  }

  async function loadInbox() {
    if (!state.username) return;
    setLoadingInbox(true);
    const gifts = await fetchInbox(state.username);
    setInbox(gifts);
    setLoadingInbox(false);
  }

  useEffect(() => { if (screen==="social") { loadLeaderboard(); loadInbox(); } }, [screen]);

  async function addFriend() {
    const name = friendInput.trim();
    if (!name||name===state.username) return;
    if ((state.friends||[]).includes(name)) return;
    const profile = await fetchProfile(name);
    if (!profile) { alert("Utente non trovato!"); return; }
    setState(prev=>({...prev,friends:[...(prev.friends||[]),name]}));
    setFriendProfiles(prev=>({...prev,[name]:profile}));
    setFriendInput("");
  }

  async function loadFriendProfile(name) {
    const p = await fetchProfile(name);
    if (p) { setFriendProfiles(prev=>({...prev,[name]:p})); setViewProfile(p); setScreen("viewProfile"); }
  }

  async function doSendGift(toUsername) {
    if (state.gettoni < 100) { setGiftMsg("Hai bisogno di almeno 100 gettoni!"); return; }
    setGiftSending(true);
    const item = getGiftLoot();
    const ok   = await sendGift(state.username, toUsername, item);
    if (ok) {
      setState(prev=>({...prev,gettoni:prev.gettoni-100}));
      setGiftMsg(`🎁 Gift inviato a ${toUsername}! (−100 gettoni)`);
    } else { setGiftMsg("Errore nell'invio. Riprova."); }
    setGiftSending(false);
    setTimeout(()=>setGiftMsg(""),3000);
  }

  async function claimGift(gift) {
    await deleteGift(gift.key);
    setInbox(prev=>prev.filter(g=>g.key!==gift.key));
    setIsGiftLoot(true); setIsWeeklyLoot(false);
    claimLoot(false, true, gift.item);
  }
  const css = `
    @keyframes twinkle{from{opacity:0.1}to{opacity:0.7}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px #f59e0b30}50%{box-shadow:0 0 20px #f59e0b70}}
    @keyframes slideIn{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
    .btn{cursor:pointer;border:none;border-radius:8px;font-family:Georgia,serif;font-weight:700;transition:all 0.2s}
    .btn:hover{transform:translateY(-2px);filter:brightness(1.15)}
    .btn:active{transform:translateY(0)}
    .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;backdrop-filter:blur(4px)}
    .tab{cursor:pointer;padding:7px 12px;border-radius:8px;font-size:12px;font-family:Georgia,serif;font-weight:700;border:none;transition:all 0.2s}
    input{background:#0d0d2b;border:1px solid #333;border-radius:8px;padding:9px 12px;color:#fde68a;font-family:Georgia,serif;outline:none;width:100%;box-sizing:border-box}
    input::placeholder{color:#444}
  `;

  const wrap = {
    minHeight:"100vh",
    background:"linear-gradient(135deg,#0a0a1a 0%,#0d0d2b 50%,#0a0a1a 100%)",
    fontFamily:"Georgia,serif",color:"#e8e0d0",padding:"12px",position:"relative",overflow:"hidden",
  };

  const stars = (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {[...Array(30)].map((_,i)=>(
        <div key={i} style={{position:"absolute",width:2,height:2,background:"#fff",borderRadius:"50%",
          left:`${(i*37+13)%100}%`,top:`${(i*53+7)%100}%`,opacity:0.15+(i%5)*0.08,
          animation:`twinkle ${2+(i%3)}s infinite alternate`}}/>
      ))}
    </div>
  );

  function BottomNav() {
    return (
      <div style={{display:"flex",gap:4,marginTop:12,background:"rgba(0,0,0,0.4)",borderRadius:12,padding:6,border:"1px solid #222"}}>
        {[
          {key:"main",   emoji:"⚔️", label:"Gioca"},
          {key:"social", emoji:"🏆", label:"Social"},
          {key:"profile",emoji:"👤", label:"Profilo"},
        ].map(({key,emoji,label})=>(
          <button key={key} className="btn" onClick={()=>setScreen(key)} style={{
            flex:1,padding:"8px 0",fontSize:11,
            background:screen===key?"rgba(245,158,11,0.2)":"transparent",
            color:screen===key?"#fde68a":"#555",
            border:screen===key?"1px solid #f59e0b40":"1px solid transparent",
          }}>{emoji}<br/>{label}</button>
        ))}
      </div>
    );
  }

  if (screen==="register") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:400,margin:"0 auto",position:"relative",zIndex:1,paddingTop:60}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:60}}>⚔️</div>
          <h1 style={{color:"#fde68a",textShadow:"0 0 20px #f59e0b80",margin:"8px 0 4px"}}>NENNY'S RPG</h1>
          <div style={{color:"#aaa",fontSize:13}}>Scegli il tuo nome da guerriero</div>
        </div>
        <div className="card">
          <div style={{fontSize:12,color:"#aaa",marginBottom:8}}>👤 Username (pubblico, unico)</div>
          <input
            value={registerName}
            onChange={e=>{setRegisterName(e.target.value);setRegError("");}}
            onKeyDown={e=>e.key==="Enter"&&handleRegister()}
            placeholder="es. NennyTheLegend"
            style={{fontSize:16,marginBottom:10}}
          />
          {regError && <div style={{color:"#ef4444",fontSize:11,marginBottom:8}}>⚠️ {regError}</div>}
          <div style={{fontSize:10,color:"#555",marginBottom:12}}>Solo lettere, numeri e _. Visibile nella classifica.</div>
          <button className="btn" onClick={handleRegister} style={{
            width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",
            color:"#000",padding:"13px",fontSize:15,
          }}>⚔️ ENTRA NEL DUNGEON</button>
        </div>
      </div>
    </div>
  );

  if (screen==="main") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2}}>⚔️ NENNY'S RPG</div>
            <div style={{fontSize:18,fontWeight:700,color:"#fde68a"}}>{state.username}</div>
            <div style={{fontSize:10,color:"#a78bfa",fontStyle:"italic"}}>{title}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#aaa"}}>Lv {level} | 🪙{state.gettoni} | 🔥{state.gettoniExtra}</div>
            <div style={{fontSize:10,color:"#6ee7b7"}}>€{cents} guadagnati</div>
            {inbox.length>0&&<div style={{fontSize:10,color:"#f59e0b"}}>🎁 {inbox.length} gift!</div>}
          </div>
        </div>

        <div style={{marginBottom:10}}>
          <div style={{background:"#1a1a2e",borderRadius:6,height:8,overflow:"hidden",border:"1px solid #222"}}>
            <div style={{width:`${Math.min(100,(xi.progress/xi.total)*100)}%`,background:"linear-gradient(90deg,#f59e0b,#ef4444)",height:"100%",borderRadius:6,transition:"width 0.8s",boxShadow:"0 0 6px #f59e0b50"}}/>
          </div>
          <div style={{fontSize:9,color:"#555",marginTop:2,textAlign:"right"}}>{xi.progress}/{xi.total} XP → Lv {level+1}</div>
        </div>

        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {[["daily","⚔️ Giornaliero"],["weekly","🏆 Settimanale"]].map(([k,l])=>(
            <button key={k} className="tab" onClick={()=>setTab(k)} style={{
              flex:1,
              background:tab===k?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.03)",
              color:tab===k?"#fca5a5":"#666",
              border:tab===k?"1px solid #ef444450":"1px solid #222",
            }}>{l}{k==="weekly"&&canFightWeekly&&<span style={{color:"#f59e0b"}}> !</span>}</button>
          ))}
        </div>

        {tab==="daily"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <div className="card" style={{marginBottom:10,border:"1px solid #ef444425",background:"rgba(239,68,68,0.04)"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:9,letterSpacing:2,color:"#ef4444",marginBottom:3}}>⚠ BOSS DEL GIORNO ⚠</div>
                <div style={{fontSize:44,animation:"pulse 2s infinite"}}>{dailyBoss.emoji}</div>
                <div style={{fontSize:16,fontWeight:700,color:"#fca5a5",margin:"3px 0"}}>{dailyBoss.name}</div>
                <div style={{fontSize:10,color:"#aaa",fontStyle:"italic"}}>"{dailyBoss.desc}"</div>
                <div style={{marginTop:5,fontSize:10,color:"#ef4444"}}>Sconfiggi guardando 100+ video oggi</div>
              </div>
            </div>
            <div className="card" style={{marginBottom:10,background:"rgba(245,158,11,0.04)",border:"1px solid #f59e0b15"}}>
              <div style={{fontSize:10,color:"#f59e0b",marginBottom:5}}>🔥 Gettoni extra → Riserva Settimanale</div>
              <div style={{fontSize:10,color:"#666",lineHeight:1.5}}>Ogni video oltre i 100 diventa un gettone extra. Accumulane abbastanza per sfidare i boss settimanali!</div>
            </div>
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:7}}>📺 Quanti video hai guardato oggi?</div>
              <div style={{display:"flex",gap:8}}>
                <input type="number" value={videoInput} onChange={e=>setVideoInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&submitDay()} placeholder="es. 127" style={{fontSize:18}}/>
                <button className="btn" onClick={submitDay} style={{
                  background:"linear-gradient(135deg,#ef4444,#b91c1c)",color:"#fff",padding:"9px 14px",fontSize:13,whiteSpace:"nowrap",
                }}>⚔️ COMBATTI</button>
              </div>
            </div>
            <button className="btn" onClick={()=>setShowInventory(!showInventory)} style={{
              width:"100%",background:"rgba(168,85,247,0.08)",color:"#c084fc",
              border:"1px solid #a855f725",padding:"8px",fontSize:11,marginBottom:8,
            }}>🎒 Inventario ({(state.inventory||[]).length} oggetti) {showInventory?"▲":"▼"}</button>
            {showInventory&&(
              <div className="card" style={{marginBottom:10,animation:"slideIn 0.3s ease"}}>
                {!(state.inventory||[]).length
                  ? <div style={{textAlign:"center",color:"#444",fontSize:12}}>Nessun oggetto. Combatti!</div>
                  : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                      {(state.inventory||[]).slice().reverse().slice(0,12).map((item,i)=><ItemCard key={i} item={item} weekly={item.weekly||item.gift}/>)}
                    </div>}
              </div>
            )}
            {!!(state.log||[]).length&&(
              <div className="card" style={{marginBottom:10}}>
                <div style={{fontSize:9,color:"#444",marginBottom:4}}>📜 Log recente</div>
                {(state.log||[]).slice(-4).reverse().map((l,i)=>(
                  <div key={i} style={{fontSize:9,color:"#3a3a4a",borderBottom:"1px solid #1a1a2e",paddingBottom:2,marginBottom:2}}>{l}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab==="weekly"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <div className="card" style={{marginBottom:10,textAlign:"center",border:`1px solid ${canFightWeekly?"#f59e0b":"#333"}`,background:canFightWeekly?"rgba(245,158,11,0.05)":"rgba(0,0,0,0.1)",animation:canFightWeekly?"glow 2s infinite":"none"}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#f59e0b",marginBottom:4}}>🏆 BOSS SETTIMANALE 🏆</div>
              <div style={{fontSize:44,animation:"pulse 2s infinite"}}>{weeklyBoss.emoji}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#fde68a",margin:"4px 0"}}>{weeklyBoss.name}</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",margin:"10px 0"}}>
                <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid #ef444425",borderRadius:8,padding:"5px 12px"}}>
                  <div style={{fontSize:8,color:"#aaa"}}>Costo</div>
                  <div style={{color:"#fbbf24",fontWeight:700,fontSize:13}}>🔥 {weeklyBoss.cost}</div>
                </div>
                <div style={{background:"rgba(168,85,247,0.1)",border:"1px solid #a855f725",borderRadius:8,padding:"5px 12px"}}>
                  <div style={{fontSize:8,color:"#aaa"}}>Loot</div>
                  <div style={{color:"#c084fc",fontWeight:700,fontSize:11}}>{weeklyBoss.reward}</div>
                </div>
                <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b25",borderRadius:8,padding:"5px 12px"}}>
                  <div style={{fontSize:8,color:"#aaa"}}>Hai</div>
                  <div style={{color:canFightWeekly?"#34d399":"#ef4444",fontWeight:700,fontSize:13}}>🔥 {state.gettoniExtra}</div>
                </div>
              </div>
              {canFightWeekly
                ? <button className="btn" onClick={fightWeekly} style={{width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#000",padding:"12px",fontSize:14}}>⚔️ AFFRONTA IL BOSS!</button>
                : <div>
                    <div style={{background:"#1a1a2e",borderRadius:6,height:8,overflow:"hidden",margin:"0 0 5px"}}>
                      <div style={{width:`${Math.min(100,(state.gettoniExtra/weeklyBoss.cost)*100)}%`,background:"linear-gradient(90deg,#f59e0b,#ef4444)",height:"100%",borderRadius:6}}/>
                    </div>
                    <div style={{color:"#ef4444",fontSize:11}}>🔒 Mancano {weeklyBoss.cost-state.gettoniExtra} gettoni extra</div>
                  </div>}
            </div>
            <div className="card">
              <div style={{fontSize:10,color:"#aaa",marginBottom:8}}>📋 Prossimi boss</div>
              {WEEKLY_BOSSES.map((b,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<3?"1px solid #1a1a2e":"none",opacity:i===state.weekSeed%4?1:0.35}}>
                  <span style={{fontSize:18}}>{b.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"#e8e0d0"}}>{b.name}</div>
                    <div style={{fontSize:9,color:"#555"}}>🔥 {b.cost} extra</div>
                  </div>
                  <div style={{fontSize:9,color:"#9C27B0"}}>{b.reward}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {leveledUp&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div className="card" style={{textAlign:"center",padding:28,maxWidth:260,border:"2px solid #f59e0b",boxShadow:"0 0 40px #f59e0b50"}}>
              <div style={{fontSize:52}}>⭐</div>
              <h2 style={{color:"#fde68a",margin:"6px 0 3px"}}>LEVEL UP!</h2>
              <div style={{fontSize:34,fontWeight:700,color:"#f59e0b"}}>LV {level}</div>
              <div style={{fontSize:11,color:"#a78bfa",margin:"4px 0 14px"}}>{title}</div>
              <button className="btn" onClick={()=>setLeveledUp(false)} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#000",padding:"10px 24px",fontSize:13}}>🎉 Avanti, {state.username}!</button>
            </div>
          </div>
        )}
        <BottomNav/>
      </div>
    </div>
  );

  if (screen==="battle") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1,paddingTop:20}}>
        <div className="card" style={{animation:"slideIn 0.4s ease",border:"1px solid #f59e0b25"}}>
          <div style={{textAlign:"center",marginBottom:10}}>
            <div style={{fontSize:36,animation:"pulse 1s infinite"}}>{state.todayDefeated||state.weeklyBossDefeated?"⚔️":"💀"}</div>
            <h2 style={{margin:"5px 0 3px",color:state.todayDefeated||state.weeklyBossDefeated?"#34d399":"#ef4444",fontSize:20}}>
              {state.todayDefeated||state.weeklyBossDefeated?"VITTORIA!":"SCONFITTA!"}
            </h2>
          </div>
          {battleLog.map((line,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"5px 10px",marginBottom:4,fontSize:11,color:"#d1d5db",animation:`slideIn ${0.1*i+0.1}s ease`}}>{line}</div>
          ))}
          {loadingAi
            ? <div style={{textAlign:"center",color:"#f59e0b",marginTop:8,fontSize:11}}>✨ Il narratore scrive...</div>
            : aiText
              ? <div style={{marginTop:8,padding:10,background:"rgba(245,158,11,0.06)",border:"1px solid #f59e0b25",borderRadius:8,fontSize:11,color:"#fde68a",fontStyle:"italic",lineHeight:1.6}}>📖 {aiText}</div>
              : null}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            {isWeeklyLoot&&!state.weeklyBossLooted&&(
              <button className="btn" onClick={()=>claimLoot(true)} style={{flex:1,background:"linear-gradient(135deg,#f59e0b,#ca8a04)",color:"#000",padding:"11px",fontSize:13}}>🏆 LOOT SETTIMANALE!</button>
            )}
            {!isWeeklyLoot&&state.todayDefeated&&!state.todayLooted&&(
              <button className="btn" onClick={()=>claimLoot(false)} style={{flex:1,background:"linear-gradient(135deg,#eab308,#ca8a04)",color:"#000",padding:"11px",fontSize:13}}>🎲 LOOT!</button>
            )}
            <button className="btn" onClick={()=>setScreen("main")} style={{flex:1,background:"rgba(255,255,255,0.07)",color:"#e8e0d0",padding:"11px",fontSize:12,border:"1px solid #333"}}>🏠 Campo Base</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (screen==="loot"&&lootResult) return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1,paddingTop:20}}>
        <div className="card" style={{animation:"slideIn 0.4s ease",textAlign:"center",border:`2px solid ${RARITY_COLORS[lootResult.rarity]}`,boxShadow:`0 0 30px ${RARITY_COLORS[lootResult.rarity]}40`}}>
          {isGiftLoot&&<div style={{fontSize:10,color:"#f59e0b",letterSpacing:3,marginBottom:4}}>🎁 GIFT DA UN AMICO 🎁</div>}
          {isWeeklyLoot&&<div style={{fontSize:10,color:"#f59e0b",letterSpacing:3,marginBottom:4}}>🏆 LOOT SETTIMANALE 🏆</div>}
          <div style={{fontSize:9,letterSpacing:3,color:RARITY_COLORS[lootResult.rarity]}}>✨ OGGETTO TROVATO ✨</div>
          <div style={{fontSize:64,margin:"10px 0",animation:"pulse 1s 3"}}>{lootResult.emoji}</div>
          <div style={{fontSize:18,fontWeight:700,color:RARITY_COLORS[lootResult.rarity],marginBottom:4}}>{lootResult.name}</div>
          <RarityBadge rarity={lootResult.rarity}/>
          {lootResult.stat&&lootResult.val>0&&(
            <div style={{fontSize:13,color:statColors[lootResult.stat]||"#a78bfa",margin:"10px 0 4px"}}>
              +{lootResult.val} {lootResult.stat==="ALL"?"a tutte le stat":lootResult.stat}
            </div>
          )}
          <button className="btn" onClick={()=>setScreen("main")} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"12px",fontSize:13,marginTop:12}}>🎒 Aggiungi all'Inventario</button>
        </div>
      </div>
    </div>
  );
  if (screen==="social") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:3}}>🏆 SOCIAL</div>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {[["leaderboard","🏆 Classifica"],["friends","👥 Amici"],["inbox","🎁 Inbox"]].map(([k,l])=>(
            <button key={k} className="tab" onClick={()=>setSocialTab(k)} style={{
              flex:1,fontSize:11,
              background:socialTab===k?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",
              color:socialTab===k?"#fde68a":"#555",
              border:socialTab===k?"1px solid #f59e0b40":"1px solid #222",
            }}>{l}{k==="inbox"&&inbox.length>0&&<span style={{color:"#ef4444"}}> {inbox.length}</span>}</button>
          ))}
        </div>
        {socialTab==="leaderboard"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <button className="btn" onClick={loadLeaderboard} style={{width:"100%",background:"rgba(245,158,11,0.1)",color:"#fde68a",border:"1px solid #f59e0b30",padding:"8px",fontSize:12,marginBottom:10}}>
              {loadingLB?"⏳ Caricamento...":"🔄 Aggiorna Classifica"}
            </button>
            {leaderboard.length===0&&!loadingLB&&<div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>Nessun giocatore ancora. Sii il primo!</div>}
            {leaderboard.map((p,i)=>(
              <div key={p.username} className="card" style={{marginBottom:6,border:p.username===state.username?"1px solid #f59e0b60":"1px solid rgba(255,255,255,0.06)",background:p.username===state.username?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.02)",cursor:"pointer"}}
                onClick={()=>{setViewProfile(p);setScreen("viewProfile");}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:18,fontWeight:700,color:i<3?["#f59e0b","#aaa","#CD7F32"][i]:"#444",minWidth:24,textAlign:"center"}}>
                    {i<3?["🥇","🥈","🥉"][i]:i+1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:p.username===state.username?"#fde68a":"#e8e0d0"}}>{p.username}{p.username===state.username&&" (tu)"}</div>
                    <div style={{fontSize:10,color:"#a78bfa",fontStyle:"italic"}}>{p.title}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,color:"#fde68a",fontWeight:700}}>Lv {p.level}</div>
                    <div style={{fontSize:9,color:"#555"}}>🔥{p.streak} streak</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {socialTab==="friends"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:7}}>➕ Aggiungi amico per username</div>
              <div style={{display:"flex",gap:8}}>
                <input value={friendInput} onChange={e=>setFriendInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addFriend()} placeholder="Username esatto..."/>
                <button className="btn" onClick={addFriend} style={{background:"rgba(245,158,11,0.2)",color:"#fde68a",border:"1px solid #f59e0b40",padding:"9px 12px",fontSize:12,whiteSpace:"nowrap"}}>➕ Add</button>
              </div>
            </div>
            {!(state.friends||[]).length
              ? <div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>Nessun amico ancora!</div>
              : (state.friends||[]).map(name=>{
                  const p=friendProfiles[name];
                  return (
                    <div key={name} className="card" style={{marginBottom:6,cursor:"pointer"}} onClick={()=>loadFriendProfile(name)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:24}}>👤</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#fde68a"}}>{name}</div>
                          {p ? <div style={{fontSize:10,color:"#aaa"}}>Lv {p.level} — {p.title}</div>
                             : <div style={{fontSize:10,color:"#555"}}>Tocca per caricare profilo</div>}
                        </div>
                        <button className="btn" onClick={e=>{e.stopPropagation();setGiftTarget(name);}} style={{background:"rgba(168,85,247,0.15)",color:"#c084fc",border:"1px solid #a855f730",padding:"5px 10px",fontSize:11}}>🎁 Gift<br/><span style={{fontSize:9}}>−100🪙</span></button>
                      </div>
                      {giftTarget===name&&(
                        <div style={{marginTop:8,padding:8,background:"rgba(168,85,247,0.08)",borderRadius:8,border:"1px solid #a855f730"}} onClick={e=>e.stopPropagation()}>
                          <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>Invia oggetto casuale a {name} (−100 gettoni)</div>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn" onClick={()=>doSendGift(name)} disabled={giftSending||state.gettoni<100} style={{flex:1,background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"8px",fontSize:12,opacity:state.gettoni<100?0.5:1}}>
                              {giftSending?"⏳ Invio...":"✅ Conferma Gift"}
                            </button>
                            <button className="btn" onClick={()=>setGiftTarget(null)} style={{background:"rgba(255,255,255,0.05)",color:"#aaa",border:"1px solid #333",padding:"8px 12px",fontSize:12}}>✕</button>
                          </div>
                          {giftMsg&&<div style={{fontSize:11,color:"#f59e0b",marginTop:6}}>{giftMsg}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
        {socialTab==="inbox"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <button className="btn" onClick={loadInbox} style={{width:"100%",background:"rgba(168,85,247,0.1)",color:"#c084fc",border:"1px solid #a855f730",padding:"8px",fontSize:12,marginBottom:10}}>
              {loadingInbox?"⏳ Caricamento...":"🔄 Controlla Gift"}
            </button>
            {!inbox.length&&!loadingInbox&&<div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>Nessun gift ricevuto ancora!</div>}
            {inbox.map((gift,i)=>(
              <div key={i} className="card" style={{marginBottom:8,border:"1px solid #a855f740",background:"rgba(168,85,247,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:32}}>{gift.item.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#c084fc"}}>{gift.item.name}</div>
                    <div style={{fontSize:10,color:"#aaa"}}>Da: <strong>{gift.from}</strong></div>
                    <RarityBadge rarity={gift.item.rarity}/>
                  </div>
                  <button className="btn" onClick={()=>claimGift(gift)} style={{background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"8px 12px",fontSize:12}}>🎁 Apri!</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <BottomNav/>
      </div>
    </div>
  );

  if (screen==="profile") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div className="card" style={{marginBottom:10,textAlign:"center",border:"1px solid #f59e0b30",animation:"slideIn 0.4s ease"}}>
          <div style={{fontSize:48}}>⚔️</div>
          <h2 style={{color:"#fde68a",margin:"4px 0 2px",fontSize:22}}>{state.username}</h2>
          <div style={{color:"#a78bfa",fontSize:12,fontStyle:"italic",marginBottom:10}}>{title}</div>
          <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:12}}>
            <div><div style={{fontSize:22,fontWeight:700,color:"#fde68a"}}>Lv {level}</div><div style={{fontSize:9,color:"#aaa"}}>Livello</div></div>
            <div><div style={{fontSize:22,fontWeight:700,color:"#34d399"}}>🪙{state.gettoni}</div><div style={{fontSize:9,color:"#aaa"}}>Gettoni</div></div>
            <div><div style={{fontSize:22,fontWeight:700,color:"#fbbf24"}}>🔥{state.streak}</div><div style={{fontSize:9,color:"#aaa"}}>Streak</div></div>
            <div><div style={{fontSize:22,fontWeight:700,color:"#ef4444"}}>💀{state.bossDay}</div><div style={{fontSize:9,color:"#aaa"}}>Boss kills</div></div>
          </div>
          <StatBar label="FOR" value={state.stats.FOR} color={statColors.FOR}/>
          <StatBar label="RES" value={state.stats.RES} color={statColors.RES}/>
          <StatBar label="LCK" value={state.stats.LCK} color={statColors.LCK}/>
          <StatBar label="SAG" value={state.stats.SAG} color={statColors.SAG}/>
        </div>
        <div className="card" style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🎒 Ultimi oggetti trovati</div>
          {!(state.inventory||[]).length
            ? <div style={{color:"#444",fontSize:12}}>Nessun oggetto ancora.</div>
            : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {(state.inventory||[]).slice().reverse().slice(0,6).map((item,i)=><ItemCard key={i} item={item} weekly={item.weekly||item.gift}/>)}
              </div>}
        </div>
        <div style={{textAlign:"center",marginBottom:8}}>
          <button className="btn" onClick={()=>{if(confirm("Resettare tutto?")) {setState(initialState);saveLocal(initialState);setScreen("register");}}}
            style={{background:"transparent",color:"#333",fontSize:10,border:"1px solid #222",padding:"3px 10px"}}>reset account</button>
        </div>
        <BottomNav/>
      </div>
    </div>
  );

  if (screen==="viewProfile"&&viewProfile) return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <button className="btn" onClick={()=>setScreen("social")} style={{background:"rgba(255,255,255,0.06)",color:"#aaa",border:"1px solid #333",padding:"6px 14px",fontSize:12,marginBottom:10}}>← Indietro</button>
        <div className="card" style={{marginBottom:10,textAlign:"center",border:"1px solid #a855f740",animation:"slideIn 0.4s ease"}}>
          <div style={{fontSize:44}}>⚔️</div>
          <h2 style={{color:"#fde68a",margin:"4px 0 2px",fontSize:20}}>{viewProfile.username}</h2>
          <div style={{color:"#a78bfa",fontSize:11,fontStyle:"italic",marginBottom:10}}>{viewProfile.title}</div>
          <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:12}}>
            <div><div style={{fontSize:20,fontWeight:700,color:"#fde68a"}}>Lv {viewProfile.level}</div><div style={{fontSize:8,color:"#aaa"}}>Livello</div></div>
            <div><div style={{fontSize:20,fontWeight:700,color:"#34d399"}}>🪙{viewProfile.gettoni}</div><div style={{fontSize:8,color:"#aaa"}}>Gettoni</div></div>
            <div><div style={{fontSize:20,fontWeight:700,color:"#fbbf24"}}>🔥{viewProfile.streak}</div><div style={{fontSize:8,color:"#aaa"}}>Streak</div></div>
            <div><div style={{fontSize:20,fontWeight:700,color:"#ef4444"}}>💀{viewProfile.bossDay||0}</div><div style={{fontSize:8,color:"#aaa"}}>Boss kills</div></div>
          </div>
          {viewProfile.stats&&Object.entries(viewProfile.stats).map(([k,v])=>(
            <StatBar key={k} label={k} value={v} color={statColors[k]}/>
          ))}
        </div>
        {viewProfile.inventory?.length>0&&(
          <div className="card" style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🎒 Ultimi oggetti</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              {viewProfile.inventory.slice(-6).reverse().map((item,i)=><ItemCard key={i} item={item}/>)}
            </div>
          </div>
        )}
        {(state.friends||[]).includes(viewProfile.username)&&(
          <div className="card" style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>🎁 Invia Gift a {viewProfile.username} (−100 gettoni)</div>
            {giftMsg&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:8}}>{giftMsg}</div>}
            <button className="btn" onClick={()=>doSendGift(viewProfile.username)} disabled={giftSending||state.gettoni<100} style={{
              width:"100%",background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"10px",fontSize:13,
              opacity:state.gettoni<100?0.5:1,
            }}>{giftSending?"⏳ Invio...":"🎁 Manda oggetto casuale"}</button>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
