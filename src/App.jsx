import React, { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const AVATARS = [
  { id:"warrior", emoji:"⚔️", name:"Warrior", color:"#ef4444" },
  { id:"mage",    emoji:"🧙", name:"Mage",    color:"#3b82f6" },
  { id:"ranger",  emoji:"🏹", name:"Ranger",  color:"#22c55e" },
  { id:"paladin", emoji:"🛡️", name:"Paladin", color:"#f59e0b" },
  { id:"rogue",   emoji:"🗡️", name:"Rogue",   color:"#a855f7" },
];

const RARITY_COLORS = { Common:"#aaa", Uncommon:"#4CAF50", Rare:"#2196F3", Epic:"#9C27B0", Legendary:"#FF9800" };
const RARITY_ORDER  = ["Common","Uncommon","Rare","Epic","Legendary"];
const GEAR_SLOTS    = ["Sword","Helmet","Chest","Boots","Leggings","Gloves"];
const GEAR_EMOJI    = { Sword:"⚔️", Helmet:"⛑️", Chest:"🧥", Boots:"👟", Leggings:"🩲", Gloves:"🥊" };
const GEAR_DAMAGE   = { Common:1, Uncommon:2, Rare:3, Epic:4, Legendary:5 };
const GEAR_CRIT     = { Common:0, Uncommon:0, Rare:0, Epic:0, Legendary:5 };

const MAX_ENERGY    = 60;
const ENERGY_REGEN  = 10 * 60 * 1000; // 10 min in ms

// Drop rates: 20% item, 80% energy (energy amounts reduced 25%)
function getBossDrops(playerLevel) {
  const r = Math.random() * 100;
  if (r < 20) {
    return { type:"item", rarity:getItemRarity(playerLevel) };
  }
  // 80% energy, reduced amounts
  const a = Math.random() * 100;
  if (a < 5)  return { type:"attacks", amount:15 }; // was 20
  if (a < 20) return { type:"attacks", amount:11 }; // was 15
  if (a < 40) return { type:"attacks", amount:7  }; // was 10
  return       { type:"attacks", amount:4  };        // was 6
}

function getItemRarity(playerLevel) {
  const r = Math.random() * 100;
  if (playerLevel >= 62) {
    if (r < 2)  return "Legendary";
    if (r < 8)  return "Epic";
    if (r < 25) return "Rare";
    if (r < 50) return "Uncommon";
    return "Common";
  }
  if (playerLevel >= 42) {
    if (r < 3)  return "Epic";
    if (r < 18) return "Rare";
    if (r < 45) return "Uncommon";
    return "Common";
  }
  if (playerLevel >= 22) {
    if (r < 5)  return "Rare";
    if (r < 25) return "Uncommon";
    return "Common";
  }
  if (playerLevel >= 10) {
    if (r < 9)  return "Uncommon";
    return "Common";
  }
  return "Common";
}

function getLevel(xp) { return Math.floor(Math.pow(xp/100,0.6))+1; }
function xpInfo(xp) {
  const l=getLevel(xp), n=Math.pow(l,1/0.6)*100, p=Math.pow(l-1,1/0.6)*100;
  return { progress:Math.floor(xp-p), total:Math.floor(n-p) };
}

const TITLES = [
  { threshold:0,     title:"Novice Watcher" },
  { threshold:500,   title:"Screen Guardian" },
  { threshold:1500,  title:"Token Knight" },
  { threshold:3000,  title:"Infinity Champion" },
  { threshold:6000,  title:"Dark Master" },
  { threshold:10000, title:"Living Legend" },
];
function getTitle(xp) { let t=TITLES[0]; for(const x of TITLES) if(xp>=x.threshold) t=x; return t.title; }

function calcEnergy(state) {
  const now     = Date.now();
  const elapsed = now - (state.lastEnergyTime||now);
  const regen   = Math.floor(elapsed/ENERGY_REGEN);
  return Math.min(MAX_ENERGY, (state.energy||0)+regen);
}

function getNextEnergyMs(state) {
  const elapsed  = Date.now() - (state.lastEnergyTime||Date.now());
  const nextRegen = ENERGY_REGEN - (elapsed % ENERGY_REGEN);
  return nextRegen;
}

function formatTime(ms) {
  const totalSec = Math.ceil(ms/1000);
  const m = Math.floor(totalSec/60);
  const s = totalSec%60;
  return `${m}:${s.toString().padStart(2,"0")}`;
}

function formatFullTime(ms) {
  const totalSec = Math.ceil(ms/1000);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  if (h>0) return `${h}h ${m}m`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

const initialState = {
  username:"", avatar:null,
  totalXp:0, tokens:0,
  streak:0, lastDay:null,
  bossIndex:1,
  gear:{ Sword:null, Helmet:null, Chest:null, Boots:null, Leggings:null, Gloves:null },
  inventory:[],
  energy:MAX_ENERGY,
  lastEnergyTime:Date.now(),
  log:[],
  friends:[], inbox:[],
};

function loadLocal() {
  try { const s=localStorage.getItem("tq_v2"); return s?{...initialState,...JSON.parse(s)}:initialState; }
  catch { return initialState; }
}
function saveLocal(s) { try { localStorage.setItem("tq_v2",JSON.stringify(s)); } catch{} }

function getEquippedDamage(gear) {
  const sword=gear?.Sword;
  return sword ? (GEAR_DAMAGE[sword.rarity]||0) : 0;
}

function getEquippedCrit(gear) {
  if (!gear) return 0;
  return Object.values(gear).reduce((acc,item)=>acc+(item?GEAR_CRIT[item.rarity]||0:0),0);
}
// ─── STORAGE ─────────────────────────────────────────────────────────────────

async function pushProfile(state) {
  if (!state.username) return;
  const profile = {
    username:state.username, avatar:state.avatar,
    level:getLevel(state.totalXp), totalXp:state.totalXp,
    tokens:state.tokens, streak:state.streak,
    title:getTitle(state.totalXp),
    bossIndex:state.bossIndex,
    gear:state.gear,
    inventory:state.inventory.slice(-6),
    updatedAt:Date.now(),
  };
  try { await window.storage.set(`tq:${state.username}`,JSON.stringify(profile),true); } catch{}
}

async function fetchProfile(username) {
  try { const r=await window.storage.get(`tq:${username}`,true); return r?JSON.parse(r.value):null; }
  catch { return null; }
}

async function fetchLeaderboard() {
  try {
    const r=await window.storage.list("tq:",true);
    if (!r?.keys?.length) return [];
    const profiles=await Promise.all(r.keys.map(async k=>{
      try { const v=await window.storage.get(k,true); return v?JSON.parse(v.value):null; } catch{return null;}
    }));
    return profiles.filter(Boolean).sort((a,b)=>b.totalXp-a.totalXp).slice(0,20);
  } catch { return []; }
}

async function sendGift(from,to,item) {
  try {
    await window.storage.set(`gift:${to}:${Date.now()}`,JSON.stringify({from,item,sentAt:Date.now()}),true);
    return true;
  } catch { return false; }
}

async function fetchInbox(username) {
  try {
    const r=await window.storage.list(`gift:${username}:`,true);
    if (!r?.keys?.length) return [];
    const gifts=await Promise.all(r.keys.map(async k=>{
      try { const v=await window.storage.get(k,true); return v?{...JSON.parse(v.value),key:k}:null; } catch{return null;}
    }));
    return gifts.filter(Boolean).sort((a,b)=>b.sentAt-a.sentAt);
  } catch { return []; }
}

async function deleteGift(key) { try { await window.storage.delete(key,true); } catch{} }

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

function StatBar({label,value,max=300,color}) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginBottom:2}}>
        <span style={{fontFamily:"monospace",fontWeight:700,color}}>{label}</span>
        <span style={{color:"#fff",fontWeight:700}}>{value}</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:4,height:6,overflow:"hidden"}}>
        <div style={{width:`${Math.min(100,(value/max)*100)}%`,background:color,height:"100%",borderRadius:4,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function RarityBadge({rarity}) {
  return <span style={{display:"inline-block",padding:"1px 8px",borderRadius:20,fontSize:9,
    background:`${RARITY_COLORS[rarity]}20`,border:`1px solid ${RARITY_COLORS[rarity]}`,
    color:RARITY_COLORS[rarity]}}>{rarity}</span>;
}

function EnergyBar({current,max,nextMs,fullMs}) {
  const pct   = (current/max)*100;
  const color = pct>60?"#22c55e":pct>30?"#f59e0b":"#ef4444";
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <span style={{fontSize:10,color:"#22c55e",fontWeight:700}}>⚡ Energy</span>
        <span style={{fontSize:10,color:"#fff",fontWeight:700}}>{current}/{max}</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:6,height:10,overflow:"hidden",border:"1px solid #222"}}>
        <div style={{width:`${pct}%`,background:color,height:"100%",borderRadius:6,
          transition:"width 0.3s",boxShadow:`0 0 6px ${color}60`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
        {current<max ? (
          <>
            <span style={{fontSize:9,color:"#555"}}>+1 in {formatTime(nextMs)}</span>
            <span style={{fontSize:9,color:"#555"}}>full in {formatFullTime(fullMs)}</span>
          </>
        ) : (
          <span style={{fontSize:9,color:"#22c55e"}}>⚡ Energy full!</span>
        )}
      </div>
    </div>
  );
}

function BossHPBar({current,max,name,emoji}) {
  const pct   = (current/max)*100;
  const color = pct>50?"#ef4444":pct>25?"#f59e0b":"#22c55e";
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:14,fontWeight:700,color:"#fca5a5"}}>{emoji} {name}</span>
        <span style={{fontSize:12,color:"#ef4444",fontWeight:700}}>{current}/{max} HP</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:6,height:12,overflow:"hidden",border:"1px solid #ef444430"}}>
        <div style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},#ef4444)`,
          height:"100%",borderRadius:6,transition:"width 0.3s",boxShadow:"0 0 8px #ef444460"}}/>
      </div>
    </div>
  );
}

function GearSlot({slot,item,onEquip}) {
  return (
    <div onClick={onEquip} style={{
      background:item?`${RARITY_COLORS[item.rarity]}15`:"rgba(255,255,255,0.02)",
      border:`1px solid ${item?RARITY_COLORS[item.rarity]+"50":"#333"}`,
      borderRadius:8,padding:8,cursor:"pointer",textAlign:"center",minHeight:60,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    }}>
      <div style={{fontSize:item?22:18,opacity:item?1:0.3}}>{item?item.emoji:GEAR_EMOJI[slot]}</div>
      <div style={{fontSize:9,color:item?RARITY_COLORS[item.rarity]:"#444",marginTop:2}}>
        {item?item.rarity:slot}
      </div>
      {item&&<div style={{fontSize:8,color:"#555"}}>+{GEAR_DAMAGE[item.rarity]} dmg</div>}
    </div>
  );
}
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TokenQuest() {
  const [state, setState]   = useState(loadLocal);
  const [screen, setScreen] = useState(state.username?"main":"register");
  const [regName, setRegName]     = useState("");
  const [regAvatar, setRegAvatar] = useState(null);
  const [regError, setRegError]   = useState("");

  // Combat
  const [bossHp, setBossHp]               = useState(null);
  const [combatLog, setCombatLog]         = useState([]);
  const [combatResult, setCombatResult]   = useState(null);
  const [dropResult, setDropResult]       = useState(null);
  const [showDrop, setShowDrop]           = useState(false);

  // Social
  const [socialTab, setSocialTab]         = useState("leaderboard");
  const [leaderboard, setLeaderboard]     = useState([]);
  const [loadingLB, setLoadingLB]         = useState(false);
  const [friendInput, setFriendInput]     = useState("");
  const [friendProfiles, setFriendProfiles] = useState({});
  const [inbox, setInbox]                 = useState([]);
  const [loadingInbox, setLoadingInbox]   = useState(false);
  const [giftTarget, setGiftTarget]       = useState(null);
  const [giftSending, setGiftSending]     = useState(false);
  const [giftMsg, setGiftMsg]             = useState("");
  const [viewProfile, setViewProfile]     = useState(null);

  // Inventory
  const [showInventory, setShowInventory] = useState(false);
  const [equipFrom, setEquipFrom]         = useState(null);

  // Ad simulation
  const [watchingAd, setWatchingAd] = useState(false);
  const [adTimer, setAdTimer]       = useState(0);
  const adRef = useRef(null);

  // Energy timer tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(()=>setTick(p=>p+1), 1000);
    return ()=>clearInterval(t);
  }, []);

  // Energy regen
  useEffect(() => {
    const current = calcEnergy(state);
    if (current !== state.energy) {
      setState(prev=>({...prev, energy:current, lastEnergyTime:Date.now()}));
    }
  }, [tick]);

  useEffect(() => {
    saveLocal(state);
    if (state.username) pushProfile(state).catch(()=>{});
  }, [state]);

  useEffect(() => {
    if (screen==="social") { loadLeaderboard(); loadInbox(); }
  }, [screen]);

  useEffect(() => {
    if (screen==="main" && bossHp===null) setBossHp(state.bossIndex);
  }, [screen]);

  const level       = getLevel(state.totalXp);
  const xi          = xpInfo(state.totalXp);
  const title       = getTitle(state.totalXp);
  const avatar      = AVATARS.find(a=>a.id===state.avatar)||AVATARS[0];
  const currentEnergy = calcEnergy(state);
  const nextMs      = getNextEnergyMs(state);
  const fullMs      = (MAX_ENERGY - currentEnergy) * ENERGY_REGEN - (Date.now() - (state.lastEnergyTime||Date.now())) % ENERGY_REGEN;
  const swordDamage = getEquippedDamage(state.gear);
  const critChance  = getEquippedCrit(state.gear);
  const totalDamage = 1 + swordDamage;

  // ── Registration ──────────────────────────────────────────────────────────
  async function handleRegister() {
    const name = regName.trim();
    if (!name||name.length<2)          { setRegError("At least 2 characters!"); return; }
    if (name.length>20)                 { setRegError("Max 20 characters!"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setRegError("Only letters, numbers and _"); return; }
    if (!regAvatar)                     { setRegError("Choose your avatar!"); return; }
    const existing = await fetchProfile(name);
    if (existing) { setRegError("Username taken! Choose another."); return; }
    const newState = {...initialState, username:name, avatar:regAvatar, energy:MAX_ENERGY, lastEnergyTime:Date.now()};
    setState(newState); saveLocal(newState);
    setScreen("main"); setBossHp(1);
  }

  // ── Combat ────────────────────────────────────────────────────────────────
  function attack() {
    if (currentEnergy<1||combatResult) return;
    const isCrit = Math.random()*100 < critChance;
    const dmg    = isCrit ? totalDamage*2 : totalDamage;
    const newHp  = Math.max(0, bossHp-dmg);
    setCombatLog(prev=>[isCrit?`💥 CRITICAL! ${dmg} damage!`:`⚔️ ${dmg} damage dealt!`,...prev.slice(0,4)]);
    setBossHp(newHp);
    setState(prev=>({...prev, energy:Math.max(0,calcEnergy(prev)-1), lastEnergyTime:Date.now()}));

    if (newHp<=0) {
      const xpGain = state.bossIndex*10;
      const drop   = getBossDrops(level);
      let newInventory = [...(state.inventory||[])];
      let extraEnergy  = 0;
      let droppedItem  = null;

      if (drop.type==="attacks") {
        extraEnergy = drop.amount;
      } else {
        const slot    = GEAR_SLOTS[Math.floor(Math.random()*GEAR_SLOTS.length)];
        droppedItem   = {
          id:Date.now(), slot, rarity:drop.rarity,
          emoji:GEAR_EMOJI[slot],
          name:`${drop.rarity} ${slot}`,
          date:new Date().toLocaleDateString("en"),
        };
        newInventory = [...newInventory.slice(-29), droppedItem];
        drop.item = droppedItem;
      }

      setDropResult(drop);
      setShowDrop(true);
      setCombatResult("victory");

      setState(prev=>({
        ...prev,
        totalXp:   prev.totalXp+xpGain,
        tokens:    prev.tokens+1,
        bossIndex: prev.bossIndex+1,
        inventory: newInventory,
        energy:    Math.min(MAX_ENERGY, Math.max(0,calcEnergy(prev)-1)+extraEnergy),
        lastEnergyTime: Date.now(),
        log:[...(prev.log||[]).slice(-20), `Boss #${state.bossIndex} defeated! +${xpGain} XP +1 token`],
      }));
      setBossHp(state.bossIndex+1);
    }
  }

  function nextBoss() {
    setCombatResult(null); setCombatLog([]);
    setShowDrop(false);    setDropResult(null);
    setBossHp(state.bossIndex);
  }

  // ── Watch Ad ──────────────────────────────────────────────────────────────
  function startWatchAd() {
    if (watchingAd||currentEnergy>=MAX_ENERGY) return;
    setWatchingAd(true); setAdTimer(30);
    adRef.current = setInterval(()=>{
      setAdTimer(prev=>{
        if (prev<=1) {
          clearInterval(adRef.current);
          setWatchingAd(false);
          setState(p=>({...p, energy:Math.min(MAX_ENERGY,calcEnergy(p)+1)}));
          return 0;
        }
        return prev-1;
      });
    },1000);
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  async function loadLeaderboard() {
    setLoadingLB(true);
    setLeaderboard(await fetchLeaderboard());
    setLoadingLB(false);
  }

  async function loadInbox() {
    if (!state.username) return;
    setLoadingInbox(true);
    setInbox(await fetchInbox(state.username));
    setLoadingInbox(false);
  }

  async function addFriend() {
    const name=friendInput.trim();
    if (!name||name===state.username) return;
    if ((state.friends||[]).includes(name)) return;
    const p=await fetchProfile(name);
    if (!p) { alert("User not found!"); return; }
    setState(prev=>({...prev,friends:[...(prev.friends||[]),name]}));
    setFriendProfiles(prev=>({...prev,[name]:p}));
    setFriendInput("");
  }

  async function loadFriendProfile(name) {
    const p=await fetchProfile(name);
    if (p) { setFriendProfiles(prev=>({...prev,[name]:p})); setViewProfile(p); setScreen("viewProfile"); }
  }

  async function doSendGift(toUsername) {
    if (state.tokens<100) { setGiftMsg("Need 100 tokens!"); return; }
    setGiftSending(true);
    const inv=(state.inventory||[]).filter(i=>i);
    if (!inv.length) { setGiftMsg("No items to send!"); setGiftSending(false); return; }
    const item=inv[Math.floor(Math.random()*inv.length)];
    const ok=await sendGift(state.username,toUsername,item);
    if (ok) {
      setState(prev=>({...prev,tokens:prev.tokens-100}));
      setGiftMsg(`🎁 Sent to ${toUsername}!`);
    } else { setGiftMsg("Error. Try again."); }
    setGiftSending(false);
    setTimeout(()=>setGiftMsg(""),3000);
  }

  async function claimGift(gift) {
    await deleteGift(gift.key);
    setInbox(prev=>prev.filter(g=>g.key!==gift.key));
    setState(prev=>({...prev,
      inventory:[...(prev.inventory||[]).slice(-29),{...gift.item,date:new Date().toLocaleDateString("en"),gift:true}]
    }));
    alert(`🎁 Received: ${gift.item?.name} from ${gift.from}!`);
  }

  function equipItem(item) {
    setState(prev=>({...prev,gear:{...prev.gear,[item.slot]:item}}));
    setEquipFrom(null);
  }
  // ── STYLES ────────────────────────────────────────────────────────────────
  const css = `
    @keyframes twinkle{from{opacity:0.1}to{opacity:0.7}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
    @keyframes slideIn{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px #f59e0b30}50%{box-shadow:0 0 20px #f59e0b70}}
    .btn{cursor:pointer;border:none;border-radius:8px;font-family:Georgia,serif;font-weight:700;transition:all 0.2s}
    .btn:hover{transform:translateY(-2px);filter:brightness(1.15)}
    .btn:active{transform:translateY(0)}
    .btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;filter:none}
    .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;backdrop-filter:blur(4px)}
    .tab{cursor:pointer;padding:7px 12px;border-radius:8px;font-size:12px;font-family:Georgia,serif;font-weight:700;border:none;transition:all 0.2s}
    input{background:#0d0d2b;border:1px solid #333;border-radius:8px;padding:9px 12px;color:#fde68a;font-family:Georgia,serif;outline:none;width:100%;box-sizing:border-box}
    input::placeholder{color:#444}
  `;

  const wrap = {
    minHeight:"100vh",
    background:"linear-gradient(135deg,#0a0a1a 0%,#0d0d2b 50%,#0a0a1a 100%)",
    fontFamily:"Georgia,serif",color:"#e8e0d0",
    padding:"12px 12px 80px 12px",position:"relative",overflow:"hidden",
  };

  const stars = (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {[...Array(30)].map((_,i)=>(
        <div key={i} style={{position:"absolute",width:2,height:2,background:"#fff",borderRadius:"50%",
          left:`${(i*37+13)%100}%`,top:`${(i*53+7)%100}%`,
          opacity:0.15+(i%5)*0.08,animation:`twinkle ${2+(i%3)}s infinite alternate`}}/>
      ))}
    </div>
  );

  function BottomNav() {
    return (
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,
        display:"flex",background:"rgba(5,5,20,0.97)",
        borderTop:"1px solid #222",padding:"6px 12px 10px"}}>
        {[
          {key:"main",   emoji:"⚔️", label:"Fight"},
          {key:"social", emoji:"🏆", label:"Social"},
          {key:"profile",emoji:"👤", label:"Profile"},
        ].map(({key,emoji,label})=>(
          <button key={key} className="btn" onClick={()=>setScreen(key)} style={{
            flex:1,padding:"6px 0",fontSize:10,
            background:screen===key?"rgba(245,158,11,0.15)":"transparent",
            color:screen===key?"#fde68a":"#444",
            border:screen===key?"1px solid #f59e0b30":"1px solid transparent",
            borderRadius:10,
          }}>{emoji}<br/>{label}</button>
        ))}
      </div>
    );
  }

  // ── REGISTER ──────────────────────────────────────────────────────────────
  if (screen==="register") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:400,margin:"0 auto",position:"relative",zIndex:1,paddingTop:40}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:4}}>⚔️ TOKEN QUEST ⚔️</div>
          <h1 style={{color:"#fde68a",textShadow:"0 0 20px #f59e0b80",margin:"6px 0 4px",fontSize:26}}>CREATE HERO</h1>
          <div style={{color:"#aaa",fontSize:12}}>Choose your name and class</div>
        </div>
        <div className="card" style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>👤 Username</div>
          <input value={regName} onChange={e=>{setRegName(e.target.value);setRegError("");}}
            onKeyDown={e=>e.key==="Enter"&&handleRegister()}
            placeholder="e.g. DragonSlayer99" style={{fontSize:15,marginBottom:8}}/>
          {regError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>⚠️ {regError}</div>}
          <div style={{fontSize:9,color:"#555"}}>Letters, numbers and _ only.</div>
        </div>
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:10}}>🎭 Choose your class</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {AVATARS.map(av=>(
              <div key={av.id} onClick={()=>setRegAvatar(av.id)} style={{
                textAlign:"center",padding:"10px 6px",borderRadius:10,cursor:"pointer",
                background:regAvatar===av.id?`${av.color}20`:"rgba(255,255,255,0.02)",
                border:`2px solid ${regAvatar===av.id?av.color:"#333"}`,transition:"all 0.2s",
              }}>
                <div style={{fontSize:28}}>{av.emoji}</div>
                <div style={{fontSize:10,fontWeight:700,color:regAvatar===av.id?av.color:"#aaa",marginTop:4}}>{av.name}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn" onClick={handleRegister} style={{
          width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",
          color:"#000",padding:"13px",fontSize:15,
        }}>⚔️ ENTER THE DUNGEON</button>
      </div>
    </div>
  );

  // ── MAIN FIGHT SCREEN ─────────────────────────────────────────────────────
  if (screen==="main") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:26,background:`${avatar.color}20`,borderRadius:"50%",
              width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",
              border:`2px solid ${avatar.color}60`}}>{avatar.emoji}</div>
            <div>
              <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2}}>TOKEN QUEST</div>
              <div style={{fontSize:15,fontWeight:700,color:"#fde68a"}}>{state.username}</div>
              <div style={{fontSize:9,color:"#a78bfa",fontStyle:"italic"}}>{title}</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#fde68a",fontWeight:700}}>Lv {level}</div>
            <div style={{fontSize:10,color:"#f59e0b"}}>Boss #{state.bossIndex}</div>
            <div style={{fontSize:10,color:"#aaa"}}>🪙 {state.tokens} tokens</div>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{marginBottom:8}}>
          <div style={{background:"#1a1a2e",borderRadius:6,height:7,overflow:"hidden",border:"1px solid #222"}}>
            <div style={{width:`${Math.min(100,(xi.progress/xi.total)*100)}%`,
              background:"linear-gradient(90deg,#f59e0b,#ef4444)",
              height:"100%",borderRadius:6,transition:"width 0.8s",boxShadow:"0 0 5px #f59e0b50"}}/>
          </div>
          <div style={{fontSize:9,color:"#555",marginTop:1,textAlign:"right"}}>{xi.progress}/{xi.total} XP → Lv {level+1}</div>
        </div>

        {/* Energy */}
        <EnergyBar current={currentEnergy} max={MAX_ENERGY} nextMs={nextMs} fullMs={Math.max(0,fullMs)}/>

        {/* Boss Card */}
        {bossHp!==null&&(
          <div className="card" style={{marginBottom:10,border:"1px solid #ef444425",background:"rgba(239,68,68,0.04)"}}>
            <BossHPBar
              current={combatResult==="victory"?0:bossHp}
              max={state.bossIndex-(combatResult==="victory"?1:0)}
              name={`Boss #${state.bossIndex-(combatResult==="victory"?1:0)}`}
              emoji={["👹","💀","🧌","🧛","👿","🌑","😈","☠️"][(state.bossIndex-(combatResult==="victory"?1:0))%8]}
            />

            {/* Combat Log */}
            <div style={{minHeight:50,marginBottom:10}}>
              {!combatLog.length&&!combatResult&&(
                <div style={{textAlign:"center",color:"#555",fontSize:11,padding:"8px 0"}}>Attack the boss!</div>
              )}
              {combatLog.map((line,i)=>(
                <div key={i} style={{fontSize:11,color:i===0?"#fde68a":"#555",marginBottom:2,
                  animation:i===0?"slideIn 0.2s ease":"none"}}>{line}</div>
              ))}
            </div>

            {/* Drop result */}
            {combatResult==="victory"&&showDrop&&dropResult&&(
              <div style={{marginBottom:10,padding:10,background:"rgba(34,197,94,0.08)",
                border:"1px solid #22c55e30",borderRadius:8,animation:"slideIn 0.3s ease",textAlign:"center"}}>
                <div style={{fontSize:13,color:"#22c55e",fontWeight:700,marginBottom:4}}>
                  ⚔️ VICTORY! +{(state.bossIndex-1)*10} XP +1 🪙
                </div>
                {dropResult.type==="attacks"&&(
                  <div style={{fontSize:12,color:"#f59e0b"}}>⚡ +{dropResult.amount} energy!</div>
                )}
                {dropResult.type==="item"&&dropResult.item&&(
                  <div>
                    <div style={{fontSize:22}}>{dropResult.item.emoji}</div>
                    <div style={{fontSize:11,fontWeight:700,color:RARITY_COLORS[dropResult.item.rarity]}}>{dropResult.item.name}</div>
                    <RarityBadge rarity={dropResult.item.rarity}/>
                    <div style={{fontSize:10,color:"#aaa",marginTop:4}}>Added to inventory!</div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:8}}>
              {!combatResult?(
                <button className="btn" onClick={attack} disabled={currentEnergy<1} style={{
                  flex:1,
                  background:currentEnergy>0?"linear-gradient(135deg,#ef4444,#b91c1c)":"#333",
                  color:"#fff",padding:"14px",fontSize:16,letterSpacing:1,
                }}>⚔️ ATTACK{currentEnergy<1?" (No Energy)":""}</button>
              ):(
                <button className="btn" onClick={nextBoss} style={{
                  flex:1,background:"linear-gradient(135deg,#22c55e,#16a34a)",
                  color:"#fff",padding:"14px",fontSize:14,
                }}>➡️ Next Boss #{state.bossIndex}</button>
              )}
            </div>
          </div>
        )}

        {/* Watch Ad */}
        <div className="card" style={{marginBottom:10,background:"rgba(245,158,11,0.04)",border:"1px solid #f59e0b20"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>📺 Watch Ad</div>
              <div style={{fontSize:10,color:"#666"}}>+1 ⚡ energy reward</div>
            </div>
            {watchingAd?(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,color:"#f59e0b",fontWeight:700}}>{adTimer}s</div>
                <div style={{background:"#1a1a2e",borderRadius:4,height:4,width:70,overflow:"hidden",marginTop:3}}>
                  <div style={{width:`${((30-adTimer)/30)*100}%`,background:"#f59e0b",height:"100%",borderRadius:4,transition:"width 1s"}}/>
                </div>
              </div>
            ):(
              <button className="btn" onClick={startWatchAd} disabled={currentEnergy>=MAX_ENERGY} style={{
                background:"linear-gradient(135deg,#f59e0b,#d97706)",
                color:"#000",padding:"8px 16px",fontSize:12,
              }}>{currentEnergy>=MAX_ENERGY?"Full":"Watch"}</button>
            )}
          </div>
        </div>

        {/* Banner Ad */}
        <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(255,255,255,0.02)",
          border:"1px dashed #333",borderRadius:8,textAlign:"center"}}>
          <div style={{fontSize:9,color:"#333"}}>Advertisement</div>
          <div style={{fontSize:10,color:"#444",marginTop:2}}>[ Banner Ad ]</div>
        </div>

        {/* Inventory toggle */}
        <button className="btn" onClick={()=>setShowInventory(!showInventory)} style={{
          width:"100%",background:"rgba(168,85,247,0.08)",color:"#c084fc",
          border:"1px solid #a855f725",padding:"8px",fontSize:11,marginBottom:8,
        }}>🎒 Inventory ({(state.inventory||[]).length}) {showInventory?"▲":"▼"}</button>

        {showInventory&&(
          <div className="card" style={{marginBottom:10,animation:"slideIn 0.3s ease"}}>
            {!(state.inventory||[]).length
              ? <div style={{textAlign:"center",color:"#444",fontSize:12}}>No items yet!</div>
              : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                  {(state.inventory||[]).slice().reverse().slice(0,12).map((item,i)=>(
                    <div key={i} onClick={()=>setEquipFrom(item)} style={{
                      background:`${RARITY_COLORS[item.rarity]}12`,
                      border:`1px solid ${RARITY_COLORS[item.rarity]}40`,
                      borderRadius:8,padding:8,cursor:"pointer",textAlign:"center",
                    }}>
                      <div style={{fontSize:20}}>{item.emoji}</div>
                      <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                      <div style={{fontSize:8,color:"#555"}}>Tap to equip</div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* Equip Modal */}
        {equipFrom&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",
            display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div className="card" style={{maxWidth:280,width:"90%",textAlign:"center",
              border:`2px solid ${RARITY_COLORS[equipFrom.rarity]}`,
              boxShadow:`0 0 30px ${RARITY_COLORS[equipFrom.rarity]}40`}}>
              <div style={{fontSize:40,marginBottom:8}}>{equipFrom.emoji}</div>
              <div style={{fontSize:16,fontWeight:700,color:RARITY_COLORS[equipFrom.rarity]}}>{equipFrom.name}</div>
              <RarityBadge rarity={equipFrom.rarity}/>
              <div style={{fontSize:12,color:"#aaa",margin:"8px 0"}}>
                Slot: {equipFrom.slot} | +{GEAR_DAMAGE[equipFrom.rarity]} dmg
                {GEAR_CRIT[equipFrom.rarity]>0&&` | +${GEAR_CRIT[equipFrom.rarity]}% crit`}
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button className="btn" onClick={()=>equipItem(equipFrom)} style={{
                  flex:1,background:"linear-gradient(135deg,#22c55e,#16a34a)",
                  color:"#fff",padding:"10px",fontSize:12}}>✅ Equip</button>
                <button className="btn" onClick={()=>setEquipFrom(null)} style={{
                  flex:1,background:"rgba(255,255,255,0.06)",color:"#aaa",
                  border:"1px solid #333",padding:"10px",fontSize:12}}>✕ Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <BottomNav/>
    </div>
  );
  // ── SOCIAL ────────────────────────────────────────────────────────────────
  if (screen==="social") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:3}}>🏆 SOCIAL</div>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {[["leaderboard","🏆 Top"],["friends","👥 Friends"],["inbox","🎁 Inbox"]].map(([k,l])=>(
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
            <button className="btn" onClick={loadLeaderboard} style={{width:"100%",
              background:"rgba(245,158,11,0.1)",color:"#fde68a",
              border:"1px solid #f59e0b30",padding:"8px",fontSize:12,marginBottom:10}}>
              {loadingLB?"⏳ Loading...":"🔄 Refresh Leaderboard"}
            </button>
            {leaderboard.length===0&&!loadingLB&&(
              <div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No players yet. Be the first!</div>
            )}
            {leaderboard.map((p,i)=>(
              <div key={p.username} className="card" style={{marginBottom:6,cursor:"pointer",
                border:p.username===state.username?"1px solid #f59e0b60":"1px solid rgba(255,255,255,0.06)",
                background:p.username===state.username?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.02)"}}
                onClick={()=>{setViewProfile(p);setScreen("viewProfile");}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:18,fontWeight:700,minWidth:24,textAlign:"center",
                    color:i<3?["#f59e0b","#aaa","#CD7F32"][i]:"#444"}}>
                    {i<3?["🥇","🥈","🥉"][i]:i+1}
                  </div>
                  <div style={{fontSize:24}}>
                    {(AVATARS.find(a=>a.id===p.avatar)||AVATARS[0]).emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,
                      color:p.username===state.username?"#fde68a":"#e8e0d0"}}>
                      {p.username}{p.username===state.username&&" (you)"}
                    </div>
                    <div style={{fontSize:10,color:"#a78bfa",fontStyle:"italic"}}>{p.title}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,color:"#fde68a",fontWeight:700}}>Lv {p.level}</div>
                    <div style={{fontSize:9,color:"#ef4444"}}>Boss #{p.bossIndex}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {socialTab==="friends"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:7}}>➕ Add friend by username</div>
              <div style={{display:"flex",gap:8}}>
                <input value={friendInput} onChange={e=>setFriendInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addFriend()} placeholder="Exact username..."/>
                <button className="btn" onClick={addFriend} style={{
                  background:"rgba(245,158,11,0.2)",color:"#fde68a",
                  border:"1px solid #f59e0b40",padding:"9px 12px",fontSize:12,whiteSpace:"nowrap"}}>➕</button>
              </div>
            </div>
            {!(state.friends||[]).length
              ? <div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No friends yet!</div>
              : (state.friends||[]).map(name=>{
                  const p=friendProfiles[name];
                  return (
                    <div key={name} className="card" style={{marginBottom:6,cursor:"pointer"}}
                      onClick={()=>loadFriendProfile(name)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:24}}>
                          {p?(AVATARS.find(a=>a.id===p.avatar)||AVATARS[0]).emoji:"👤"}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#fde68a"}}>{name}</div>
                          {p
                            ? <div style={{fontSize:10,color:"#aaa"}}>Lv {p.level} — Boss #{p.bossIndex}</div>
                            : <div style={{fontSize:10,color:"#555"}}>Tap to load</div>}
                        </div>
                        <button className="btn" onClick={e=>{e.stopPropagation();setGiftTarget(name);}} style={{
                          background:"rgba(168,85,247,0.15)",color:"#c084fc",
                          border:"1px solid #a855f730",padding:"5px 10px",fontSize:11}}>
                          🎁<br/><span style={{fontSize:9}}>−100🪙</span>
                        </button>
                      </div>
                      {giftTarget===name&&(
                        <div style={{marginTop:8,padding:8,background:"rgba(168,85,247,0.08)",
                          borderRadius:8,border:"1px solid #a855f730"}}
                          onClick={e=>e.stopPropagation()}>
                          <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>
                            Send random item to {name} (−100 tokens)
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn" onClick={()=>doSendGift(name)}
                              disabled={giftSending||state.tokens<100} style={{
                              flex:1,background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
                              color:"#fff",padding:"8px",fontSize:12,
                              opacity:state.tokens<100?0.5:1}}>
                              {giftSending?"⏳":"✅ Confirm"}
                            </button>
                            <button className="btn" onClick={()=>setGiftTarget(null)} style={{
                              background:"rgba(255,255,255,0.05)",color:"#aaa",
                              border:"1px solid #333",padding:"8px 12px",fontSize:12}}>✕</button>
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
            <button className="btn" onClick={loadInbox} style={{width:"100%",
              background:"rgba(168,85,247,0.1)",color:"#c084fc",
              border:"1px solid #a855f730",padding:"8px",fontSize:12,marginBottom:10}}>
              {loadingInbox?"⏳ Loading...":"🔄 Check Gifts"}
            </button>
            {!inbox.length&&!loadingInbox&&(
              <div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No gifts yet!</div>
            )}
            {inbox.map((gift,i)=>(
              <div key={i} className="card" style={{marginBottom:8,
                border:"1px solid #a855f740",background:"rgba(168,85,247,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:32}}>{gift.item?.emoji||"🎁"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#c084fc"}}>{gift.item?.name||"Mystery Item"}</div>
                    <div style={{fontSize:10,color:"#aaa"}}>From: <strong>{gift.from}</strong></div>
                    {gift.item?.rarity&&<RarityBadge rarity={gift.item.rarity}/>}
                  </div>
                  <button className="btn" onClick={()=>claimGift(gift)} style={{
                    background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
                    color:"#fff",padding:"8px 12px",fontSize:12}}>
                    🎁 Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
  // ── PROFILE ───────────────────────────────────────────────────────────────
  if (screen==="profile") return (
    <div style={wrap}>
      <style>{css}</style>
      {stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>

        {/* Hero Card */}
        <div className="card" style={{marginBottom:10,textAlign:"center",
          border:`1px solid ${avatar.color}40`,animation:"slideIn 0.4s ease"}}>
          <div style={{fontSize:64,marginBottom:4}}>{avatar.emoji}</div>
          <h2 style={{color:"#fde68a",margin:"2px 0",fontSize:20}}>{state.username}</h2>
          <div style={{color:avatar.color,fontSize:11,marginBottom:4}}>{avatar.name}</div>
          <div style={{color:"#a78bfa",fontSize:11,fontStyle:"italic",marginBottom:12}}>{title}</div>
          <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#fde68a"}}>Lv {level}</div>
              <div style={{fontSize:8,color:"#aaa"}}>Level</div>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#34d399"}}>🪙{state.tokens}</div>
              <div style={{fontSize:8,color:"#aaa"}}>Tokens</div>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#ef4444"}}>💀#{state.bossIndex}</div>
              <div style={{fontSize:8,color:"#aaa"}}>Current Boss</div>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#fbbf24"}}>🔥{state.streak}</div>
              <div style={{fontSize:8,color:"#aaa"}}>Streak</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>
            ⚔️ DMG: {totalDamage} | 🎯 Crit: {critChance}% | ⚡ {currentEnergy}/{MAX_ENERGY}
          </div>
          <StatBar label="XP" value={xi.progress} max={xi.total} color="#f59e0b"/>
        </div>

        {/* Gear Slots */}
        <div className="card" style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🛡️ Equipped Gear</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {GEAR_SLOTS.map(slot=>(
              <GearSlot key={slot} slot={slot} item={state.gear?.[slot]}
                onEquip={()=>{
                  const items=(state.inventory||[]).filter(i=>i&&i.slot===slot);
                  if (!items.length) return;
                  const best=items.sort((a,b)=>RARITY_ORDER.indexOf(b.rarity)-RARITY_ORDER.indexOf(a.rarity))[0];
                  equipItem(best);
                }}/>
            ))}
          </div>
          <div style={{fontSize:9,color:"#555",marginTop:6,textAlign:"center"}}>
            Tap a slot to auto-equip best item
          </div>
        </div>

        {/* Inventory */}
        <div className="card" style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>
            🎒 Inventory ({(state.inventory||[]).length} items)
          </div>
          {!(state.inventory||[]).length
            ? <div style={{color:"#444",fontSize:12,textAlign:"center"}}>No items yet. Defeat bosses!</div>
            : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {(state.inventory||[]).slice().reverse().slice(0,12).map((item,i)=>(
                  <div key={i} onClick={()=>equipItem(item)} style={{
                    background:`${RARITY_COLORS[item.rarity]}12`,
                    border:`1px solid ${RARITY_COLORS[item.rarity]}40`,
                    borderRadius:8,padding:8,cursor:"pointer",textAlign:"center",
                  }}>
                    <div style={{fontSize:20}}>{item.emoji}</div>
                    <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                    <div style={{fontSize:8,color:"#555"}}>+{GEAR_DAMAGE[item.rarity]} dmg</div>
                  </div>
                ))}
              </div>}
        </div>

        {/* Energy timer in profile */}
        <div className="card" style={{marginBottom:10}}>
          <EnergyBar current={currentEnergy} max={MAX_ENERGY} nextMs={nextMs} fullMs={Math.max(0,fullMs)}/>
        </div>

        <div style={{textAlign:"center",marginBottom:8}}>
          <button className="btn" onClick={()=>{
            if(confirm("Reset everything? You will lose all progress!")) {
              setState(initialState);
              saveLocal(initialState);
              setScreen("register");
            }
          }} style={{background:"transparent",color:"#333",fontSize:10,border:"1px solid #222",padding:"3px 10px"}}>
            reset account
          </button>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
  // ── VIEW EXTERNAL PROFILE ─────────────────────────────────────────────────
  if (screen==="viewProfile"&&viewProfile) {
    const vAvatar=AVATARS.find(a=>a.id===viewProfile.avatar)||AVATARS[0];
    return (
      <div style={wrap}>
        <style>{css}</style>
        {stars}
        <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
          <button className="btn" onClick={()=>setScreen("social")} style={{
            background:"rgba(255,255,255,0.06)",color:"#aaa",
            border:"1px solid #333",padding:"6px 14px",fontSize:12,marginBottom:10}}>← Back</button>

          <div className="card" style={{marginBottom:10,textAlign:"center",
            border:`1px solid ${vAvatar.color}40`,animation:"slideIn 0.4s ease"}}>
            <div style={{fontSize:56}}>{vAvatar.emoji}</div>
            <h2 style={{color:"#fde68a",margin:"4px 0 2px",fontSize:20}}>{viewProfile.username}</h2>
            <div style={{color:vAvatar.color,fontSize:10,marginBottom:4}}>{vAvatar.name}</div>
            <div style={{color:"#a78bfa",fontSize:11,fontStyle:"italic",marginBottom:10}}>{viewProfile.title}</div>
            <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:8}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"#fde68a"}}>Lv {viewProfile.level}</div>
                <div style={{fontSize:8,color:"#aaa"}}>Level</div>
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"#34d399"}}>🪙{viewProfile.tokens}</div>
                <div style={{fontSize:8,color:"#aaa"}}>Tokens</div>
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"#ef4444"}}>💀#{viewProfile.bossIndex}</div>
                <div style={{fontSize:8,color:"#aaa"}}>Boss</div>
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"#fbbf24"}}>🔥{viewProfile.streak||0}</div>
                <div style={{fontSize:8,color:"#aaa"}}>Streak</div>
              </div>
            </div>
          </div>

          {/* Their Gear */}
          {viewProfile.gear&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🛡️ Their Gear</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {GEAR_SLOTS.map(slot=>(
                  <GearSlot key={slot} slot={slot} item={viewProfile.gear?.[slot]} onEquip={()=>{}}/>
                ))}
              </div>
            </div>
          )}

          {/* Their latest items */}
          {viewProfile.inventory?.length>0&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🎒 Latest items</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {viewProfile.inventory.slice(-6).reverse().map((item,i)=>(
                  <div key={i} style={{
                    background:`${RARITY_COLORS[item.rarity]}12`,
                    border:`1px solid ${RARITY_COLORS[item.rarity]}40`,
                    borderRadius:8,padding:8,textAlign:"center",
                  }}>
                    <div style={{fontSize:18}}>{item.emoji}</div>
                    <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gift button */}
          {(state.friends||[]).includes(viewProfile.username)&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>
                🎁 Send Gift to {viewProfile.username} (−100 tokens)
              </div>
              {giftMsg&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:8}}>{giftMsg}</div>}
              <button className="btn" onClick={()=>doSendGift(viewProfile.username)}
                disabled={giftSending||state.tokens<100} style={{
                width:"100%",background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
                color:"#fff",padding:"10px",fontSize:13,
                opacity:state.tokens<100?0.5:1}}>
                {giftSending?"⏳ Sending...":"🎁 Send random item"}
              </button>
            </div>
          )}

        </div>
        <BottomNav/>
      </div>
    );
  }

  return null;
}
