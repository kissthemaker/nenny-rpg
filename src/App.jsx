import React, { useState, useEffect, useRef } from "react";

// ─── VERSION ──────────────────────────────────────────────────────────────────
const VERSION = "0.03";
const PATCH_NOTES = [
  {
    version: "0.03",
    date: "2026-06-12",
    changes: [
      "🔐 Account system: username + password, no more duplicates",
      "☁️ Fixed cloud save, leaderboard and friends list",
      "⚡ Energy regen: 1 every 6 min (was 10)",
      "⚡ Energy cap: 180 (was 60)",
      "📺 Watch Ad: +5 energy (was +1)",
      "⚔️ Attack x1 / x5 switch added",
      "🎒 Full gear overhaul: names, stats, armor, dodge, hit rate",
      "👢 Boots: +Energy cap bonus",
      "🩲 Leggings: +Crit% +Hit%, Legendary x1.1 on x5",
      "🪙 Tokens per kill: 5 (was 1)",
      "🔥 Daily streak fixed",
      "🔊 Sound toggle + original lo-fi music",
      "📢 Monetag script above nav bar",
    ]
  },
  {
    version: "0.02",
    date: "2026-06-11",
    changes: [
      "🔧 FIX: Boss HP no longer resets on page refresh",
      "☁️ Account data saved to cloud",
      "📢 Banner ads moved above navigation bar",
      "📋 Patch Notes tab added",
      "⚡ Watch Ad gives +1 energy",
      "🎁 Item drop rate increased to 20%",
      "💀 Energy drops reduced by 25%",
    ]
  },
  {
    version: "0.01",
    date: "2026-06-01",
    changes: [
      "⚔️ Initial release of Token Quest",
      "🎭 5 hero classes",
      "💀 Progressive boss system",
      "🎒 6 gear slots",
      "✨ 5 rarity tiers",
      "🏆 Global leaderboard",
      "👥 Friends & Gift system",
      "⚡ Energy system",
    ]
  },
];

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

const GEAR_STATS = {
  Sword: {
    Common:    { name:"Wooden Sword",    dmg:1, crit:0 },
    Uncommon:  { name:"Iron Sword",      dmg:2, crit:0 },
    Rare:      { name:"Steel Blade",     dmg:3, crit:0 },
    Epic:      { name:"Mithril Edge",    dmg:4, crit:0 },
    Legendary: { name:"Draconite Fang",  dmg:5, crit:5 },
  },
  Helmet: {
    Common:    { name:"Leather Cap",     armor:1, dodge:0 },
    Uncommon:  { name:"Iron Helm",       armor:2, dodge:0 },
    Rare:      { name:"Steel Helmet",    armor:3, dodge:0 },
    Epic:      { name:"Mithril Crown",   armor:4, dodge:0 },
    Legendary: { name:"Draconite Helm",  armor:5, dodge:5 },
  },
  Chest: {
    Common:    { name:"Leather Vest",    armor:1, dodge:0 },
    Uncommon:  { name:"Iron Chestplate", armor:2, dodge:0 },
    Rare:      { name:"Steel Armor",     armor:3, dodge:0 },
    Epic:      { name:"Mithril Plate",   armor:4, dodge:0 },
    Legendary: { name:"Draconite Mail",  armor:5, dodge:5 },
  },
  Boots: {
    Common:    { name:"Worn Boots",      energyCap:10, regenSpeed:0 },
    Uncommon:  { name:"Leather Boots",   energyCap:20, regenSpeed:0 },
    Rare:      { name:"Steel Greaves",   energyCap:30, regenSpeed:0 },
    Epic:      { name:"Mithril Boots",   energyCap:40, regenSpeed:0 },
    Legendary: { name:"Draconite Boots", energyCap:50, regenSpeed:5 },
  },
  Leggings: {
    Common:    { name:"Cloth Pants",     critRate:1, hitRate:1, x5bonus:false },
    Uncommon:  { name:"Leather Legs",    critRate:2, hitRate:2, x5bonus:false },
    Rare:      { name:"Steel Leggings",  critRate:3, hitRate:3, x5bonus:false },
    Epic:      { name:"Mithril Legs",    critRate:4, hitRate:4, x5bonus:false },
    Legendary: { name:"Draconite Legs",  critRate:5, hitRate:5, x5bonus:true  },
  },
  Gloves: {
    Common:    { name:"Cloth Wraps",     dmg:1, hitRate:0 },
    Uncommon:  { name:"Iron Gauntlets",  dmg:2, hitRate:0 },
    Rare:      { name:"Steel Gloves",    dmg:3, hitRate:0 },
    Epic:      { name:"Mithril Grips",   dmg:4, hitRate:0 },
    Legendary: { name:"Draconite Fists", dmg:5, hitRate:5 },
  },
};

const BASE_ENERGY_CAP = 180;
const BASE_ENERGY_START = 60;
const ENERGY_REGEN_MS = 6 * 60 * 1000; // 6 min

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

function getBossDrops(playerLevel) {
  const r = Math.random() * 100;
  if (r < 20) return { type:"item", rarity:getItemRarity(playerLevel) };
  const a = Math.random() * 100;
  if (a < 5)  return { type:"attacks", amount:15 };
  if (a < 20) return { type:"attacks", amount:11 };
  if (a < 40) return { type:"attacks", amount:7 };
  return       { type:"attacks", amount:4 };
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

function hashPassword(pwd) {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    hash = ((hash << 5) - hash) + pwd.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function getGearStats(gear) {
  let dmg=0, critRate=0, hitRate=0, armor=0, dodge=0, energyCapBonus=0, regenSpeedBonus=0, x5bonus=false;
  if (!gear) return { dmg, critRate, hitRate, armor, dodge, energyCapBonus, regenSpeedBonus, x5bonus };
  Object.entries(gear).forEach(([slot, item]) => {
    if (!item) return;
    const s = GEAR_STATS[slot]?.[item.rarity];
    if (!s) return;
    if (s.dmg)         dmg += s.dmg;
    if (s.crit)        critRate += s.crit;
    if (s.critRate)    critRate += s.critRate;
    if (s.hitRate)     hitRate += s.hitRate;
    if (s.armor)       armor += s.armor;
    if (s.dodge)       dodge += s.dodge;
    if (s.energyCap)   energyCapBonus += s.energyCap;
    if (s.regenSpeed)  regenSpeedBonus += s.regenSpeed;
    if (s.x5bonus)     x5bonus = true;
  });
  return { dmg, critRate, hitRate, armor, dodge, energyCapBonus, regenSpeedBonus, x5bonus };
}

function calcMaxEnergy(gear) {
  const { energyCapBonus } = getGearStats(gear);
  return BASE_ENERGY_CAP + energyCapBonus;
}

function calcRegenMs(gear) {
  const { regenSpeedBonus } = getGearStats(gear);
  const speedMult = 1 - (regenSpeedBonus / 100);
  return Math.max(60000, ENERGY_REGEN_MS * speedMult);
}

function calcEnergy(energy, lastEnergyTime, gear) {
  const regenMs = calcRegenMs(gear);
  const elapsed = Date.now() - (lastEnergyTime||Date.now());
  const regen = Math.floor(elapsed / regenMs);
  return Math.min(calcMaxEnergy(gear), (energy||0) + regen);
}

function getNextEnergyMs(lastEnergyTime, gear) {
  const regenMs = calcRegenMs(gear);
  const elapsed = Date.now() - (lastEnergyTime||Date.now());
  return regenMs - (elapsed % regenMs);
}

function formatTime(ms) {
  const s=Math.ceil(ms/1000), m=Math.floor(s/60);
  return `${m}:${(s%60).toString().padStart(2,"0")}`;
}
function formatFullTime(ms) {
  const s=Math.ceil(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
  if(h>0) return `${h}h ${m}m`;
  if(m>0) return `${m}m ${s%60}s`;
  return `${s%60}s`;
}

const initialState = {
  username:"", avatar:null,
  totalXp:0, tokens:0,
  streak:0, lastDay:null,
  bossIndex:1, currentBossHp:1,
  gear:{ Sword:null, Helmet:null, Chest:null, Boots:null, Leggings:null, Gloves:null },
  inventory:[],
  energy:BASE_ENERGY_START, lastEnergyTime:Date.now(),
  log:[], friends:[], inbox:[],
};

function loadCache() {
  try { const s=localStorage.getItem("tq_cache_v3"); return s?JSON.parse(s):null; } catch{ return null; }
}
function saveCache(s) { try { if(s) localStorage.setItem("tq_cache_v3",JSON.stringify(s)); else localStorage.removeItem("tq_cache_v3"); } catch{} }

// ─── CLOUD ────────────────────────────────────────────────────────────────────
async function cloudSave(state) {
  if (!state.username) return;
  try { await window.storage.set(`tq3_player:${state.username}`, JSON.stringify({...state, updatedAt:Date.now()}), true); } catch{}
}
async function cloudLoad(username) {
  try { const r=await window.storage.get(`tq3_player:${username}`,true); return r?JSON.parse(r.value):null; } catch{ return null; }
}
async function cloudCheckExists(username) {
  try { const r=await window.storage.get(`tq3_auth:${username}`,true); return !!r; } catch{ return false; }
}
async function cloudSaveAuth(username, pwdHash) {
  try { await window.storage.set(`tq3_auth:${username}`, JSON.stringify({username,pwdHash}), true); } catch{}
}
async function cloudLoadAuth(username) {
  try { const r=await window.storage.get(`tq3_auth:${username}`,true); return r?JSON.parse(r.value):null; } catch{ return null; }
}
async function pushPublicProfile(state) {
  if (!state.username) return;
  try {
    await window.storage.set(`tq3:${state.username}`, JSON.stringify({
      username:state.username, avatar:state.avatar,
      level:getLevel(state.totalXp), totalXp:state.totalXp,
      tokens:state.tokens, streak:state.streak,
      title:getTitle(state.totalXp), bossIndex:state.bossIndex,
      gear:state.gear, inventory:(state.inventory||[]).slice(-6),
      updatedAt:Date.now(),
    }), true);
  } catch{}
}
async function fetchPublicProfile(username) {
  try { const r=await window.storage.get(`tq3:${username}`,true); return r?JSON.parse(r.value):null; } catch{ return null; }
}
async function fetchLeaderboard() {
  try {
    const r=await window.storage.list("tq3:",true);
    if (!r?.keys?.length) return [];
    const profiles=await Promise.all(r.keys.map(async k=>{
      try { const v=await window.storage.get(k,true); return v?JSON.parse(v.value):null; } catch{return null;}
    }));
    return profiles.filter(Boolean).filter(p=>p.username).sort((a,b)=>b.totalXp-a.totalXp).slice(0,20);
  } catch{ return []; }
}
async function sendGift(from,to,item) {
  try { await window.storage.set(`gift3:${to}:${Date.now()}`,JSON.stringify({from,item,sentAt:Date.now()}),true); return true; } catch{ return false; }
}
async function fetchInbox(username) {
  try {
    const r=await window.storage.list(`gift3:${username}:`,true);
    if (!r?.keys?.length) return [];
    const gifts=await Promise.all(r.keys.map(async k=>{
      try { const v=await window.storage.get(k,true); return v?{...JSON.parse(v.value),key:k}:null; } catch{return null;}
    }));
    return gifts.filter(Boolean).sort((a,b)=>b.sentAt-a.sentAt);
  } catch{ return []; }
}
async function deleteGift(key) { try { await window.storage.delete(key,true); } catch{} }

// ─── AUDIO ────────────────────────────────────────────────────────────────────
let audioCtx = null;
let musicNodes = [];
let musicPlaying = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}

function playNote(freq, start, dur, vol=0.15, type="sine") {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0, ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur - 0.02);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
    musicNodes.push(osc);
  } catch{}
}

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  // Lo-fi chill melody — original composition
  const melody = [
    [261.63,0,0.4],[293.66,0.4,0.4],[329.63,0.8,0.4],[349.23,1.2,0.4],
    [329.63,1.6,0.4],[293.66,2.0,0.4],[261.63,2.4,0.8],[293.66,3.2,0.4],
    [261.63,3.6,0.4],[246.94,4.0,0.4],[220.00,4.4,0.4],[246.94,4.8,0.4],
    [261.63,5.2,0.8],[293.66,6.0,0.4],[329.63,6.4,0.4],[349.23,6.8,0.4],
    [392.00,7.2,0.4],[349.23,7.6,0.4],[329.63,8.0,0.4],[293.66,8.4,0.8],
  ];
  const bass = [
    [130.81,0,1.6],[130.81,1.6,1.6],[123.47,3.2,1.6],[130.81,4.8,1.6],
    [130.81,6.4,1.6],[98.00,8.0,0.8],
  ];
  const loop = () => {
    if (!musicPlaying) return;
    melody.forEach(([f,s,d]) => playNote(f,s,d,0.12,"sine"));
    bass.forEach(([f,s,d]) => playNote(f,s,d,0.08,"triangle"));
    setTimeout(loop, 9000);
  };
  loop();
}

function stopMusic() {
  musicPlaying = false;
  musicNodes.forEach(n => { try { n.stop(); } catch{} });
  musicNodes = [];
}

function playSfx(type) {
  try {
    const ctx = getAudioCtx();
    if (type==="attack") playNote(440,0,0.08,0.1,"square");
    if (type==="crit")   { playNote(880,0,0.1,0.15,"square"); playNote(1100,0.1,0.1,0.1,"sine"); }
    if (type==="victory"){ playNote(523,0,0.15,0.12,"sine"); playNote(659,0.15,0.15,0.12,"sine"); playNote(784,0.3,0.3,0.12,"sine"); }
    if (type==="loot")   playNote(660,0,0.2,0.1,"sine");
  } catch{}
}

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
  const pct=Math.min(100,(current/max)*100);
  const color=pct>60?"#22c55e":pct>30?"#f59e0b":"#ef4444";
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
        <span style={{fontSize:10,color:"#22c55e",fontWeight:700}}>⚡ Energy</span>
        <span style={{fontSize:10,color:"#fff",fontWeight:700}}>{current}/{max}</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:6,height:10,overflow:"hidden",border:"1px solid #222"}}>
        <div style={{width:`${pct}%`,background:color,height:"100%",borderRadius:6,transition:"width 0.3s",boxShadow:`0 0 6px ${color}60`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
        {current<max
          ? <><span style={{fontSize:9,color:"#555"}}>+1 in {formatTime(nextMs)}</span>
               <span style={{fontSize:9,color:"#555"}}>full in {formatFullTime(fullMs)}</span></>
          : <span style={{fontSize:9,color:"#22c55e"}}>⚡ Energy full!</span>}
      </div>
    </div>
  );
}

function BossHPBar({current,max,name,emoji}) {
  const pct=Math.max(0,(current/max)*100);
  const color=pct>50?"#ef4444":pct>25?"#f59e0b":"#22c55e";
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:14,fontWeight:700,color:"#fca5a5"}}>{emoji} {name}</span>
        <span style={{fontSize:12,color:"#ef4444",fontWeight:700}}>{Math.max(0,current)}/{max} HP</span>
      </div>
      <div style={{background:"#1a1a2e",borderRadius:6,height:12,overflow:"hidden",border:"1px solid #ef444430"}}>
        <div style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},#ef4444)`,height:"100%",borderRadius:6,transition:"width 0.3s",boxShadow:"0 0 8px #ef444460"}}/>
      </div>
    </div>
  );
}

function GearSlot({slot,item,onEquip}) {
  const s = item ? GEAR_STATS[slot]?.[item.rarity] : null;
  return (
    <div onClick={onEquip} style={{
      background:item?`${RARITY_COLORS[item.rarity]}15`:"rgba(255,255,255,0.02)",
      border:`1px solid ${item?RARITY_COLORS[item.rarity]+"50":"#333"}`,
      borderRadius:8,padding:8,cursor:"pointer",textAlign:"center",minHeight:64,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    }}>
      <div style={{fontSize:item?20:16,opacity:item?1:0.3}}>{item?item.emoji:GEAR_EMOJI[slot]}</div>
      <div style={{fontSize:8,color:item?RARITY_COLORS[item.rarity]:"#444",marginTop:2,lineHeight:1.2}}>
        {item?s?.name||item.rarity:slot}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TokenQuest() {
  const [state, setState]   = useState(()=>loadCache()||initialState);
  const [screen, setScreen] = useState("loading");
  const [authMode, setAuthMode] = useState("register");
  const [regName, setRegName]   = useState("");
  const [regPwd,  setRegPwd]    = useState("");
  const [regPwd2, setRegPwd2]   = useState("");
  const [regAvatar, setRegAvatar] = useState(null);
  const [regError,  setRegError]  = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPwd,  setLoginPwd]  = useState("");
  const [loginError,setLoginError]= useState("");

  const [combatLog,     setCombatLog]     = useState([]);
  const [combatResult,  setCombatResult]  = useState(null);
  const [dropResult,    setDropResult]    = useState(null);
  const [showDrop,      setShowDrop]      = useState(false);
  const [attackMode,    setAttackMode]    = useState(1); // 1 or 5

  const [socialTab,      setSocialTab]      = useState("leaderboard");
  const [leaderboard,    setLeaderboard]    = useState([]);
  const [loadingLB,      setLoadingLB]      = useState(false);
  const [friendInput,    setFriendInput]    = useState("");
  const [friendProfiles, setFriendProfiles] = useState({});
  const [inbox,          setInbox]          = useState([]);
  const [loadingInbox,   setLoadingInbox]   = useState(false);
  const [giftTarget,     setGiftTarget]     = useState(null);
  const [giftSending,    setGiftSending]    = useState(false);
  const [giftMsg,        setGiftMsg]        = useState("");
  const [viewProfile,    setViewProfile]    = useState(null);

  const [showInventory, setShowInventory] = useState(false);
  const [equipFrom,     setEquipFrom]     = useState(null);
  const [watchingAd,    setWatchingAd]    = useState(false);
  const [adTimer,       setAdTimer]       = useState(0);
  const [soundOn,       setSoundOn]       = useState(true);
  const [showOptions,   setShowOptions]   = useState(false);
  const adRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(()=>{
    async function boot() {
      const cache=loadCache();
      if (cache?.username) {
        const cloud=await cloudLoad(cache.username);
        const data=cloud||cache;
        setState({...initialState,...data});
        saveCache({...initialState,...data});
        setScreen("main");
      } else {
        setScreen("auth");
      }
    }
    boot();
  },[]);

  useEffect(()=>{ const t=setInterval(()=>setTick(p=>p+1),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    if (!state.username) return;
    saveCache(state);
    if (tick%15===0) { cloudSave(state).catch(()=>{}); pushPublicProfile(state).catch(()=>{}); }
  },[tick,state]);

  useEffect(()=>{ if(screen==="social"){loadLeaderboard();loadInbox();} },[screen]);

  useEffect(()=>{ if(soundOn) startMusic(); else stopMusic(); return()=>{}; },[soundOn]);

  // streak check
  useEffect(()=>{
    if (!state.username) return;
    const today = new Date().toDateString();
    if (state.lastDay===today) return;
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const newStreak = state.lastDay===yesterday ? (state.streak||0)+1 : 1;
    setState(prev=>({...prev, streak:newStreak, lastDay:today}));
  },[state.username]);

  const gearStats    = getGearStats(state.gear);
  const maxEnergy    = calcMaxEnergy(state.gear);
  const regenMs      = calcRegenMs(state.gear);
  const currentEnergy= calcEnergy(state.energy, state.lastEnergyTime, state.gear);
  const nextMs       = getNextEnergyMs(state.lastEnergyTime, state.gear);
  const fullMs       = Math.max(0,(maxEnergy-currentEnergy)*regenMs-(Date.now()-(state.lastEnergyTime||Date.now()))%regenMs);
  const level        = getLevel(state.totalXp);
  const xi           = xpInfo(state.totalXp);
  const title        = getTitle(state.totalXp);
  const avatar       = AVATARS.find(a=>a.id===state.avatar)||AVATARS[0];
  const totalDmg     = 1 + gearStats.dmg;
  const totalCrit    = gearStats.critRate;
  const totalHit     = gearStats.hitRate;
  const totalArmor   = gearStats.armor;
  const totalDodge   = gearStats.dodge;

  // ── AUTH ──────────────────────────────────────────────────────────────────
  async function handleRegister() {
    const name=regName.trim();
    if (!name||name.length<2)          { setRegError("At least 2 characters!"); return; }
    if (name.length>20)                 { setRegError("Max 20 characters!"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setRegError("Only letters, numbers and _"); return; }
    if (!regPwd||regPwd.length<4)       { setRegError("Password: min 4 characters!"); return; }
    if (regPwd!==regPwd2)               { setRegError("Passwords don't match!"); return; }
    if (!regAvatar)                     { setRegError("Choose your class!"); return; }
    const exists=await cloudCheckExists(name);
    if (exists) { setRegError("Username already taken!"); return; }
    const pwdHash=hashPassword(regPwd);
    const newState={...initialState,username:name,avatar:regAvatar,energy:BASE_ENERGY_START,lastEnergyTime:Date.now(),currentBossHp:1,lastDay:new Date().toDateString(),streak:1};
    await cloudSaveAuth(name,pwdHash);
    await cloudSave(newState);
    await pushPublicProfile(newState);
    setState(newState); saveCache(newState);
    setScreen("main");
    if(soundOn) startMusic();
  }

  async function handleLogin() {
    const name=loginName.trim();
    if (!name||!loginPwd) { setLoginError("Enter username and password!"); return; }
    const auth=await cloudLoadAuth(name);
    if (!auth) { setLoginError("Account not found!"); return; }
    if (auth.pwdHash!==hashPassword(loginPwd)) { setLoginError("Wrong password!"); return; }
    const cloud=await cloudLoad(name);
    if (!cloud) { setLoginError("Account data not found!"); return; }
    setState({...initialState,...cloud}); saveCache({...initialState,...cloud});
    setScreen("main");
    if(soundOn) startMusic();
  }

  // ── COMBAT ────────────────────────────────────────────────────────────────
  function attack() {
    const cost=attackMode;
    if (currentEnergy<cost||combatResult) return;
    if(soundOn) playSfx("attack");

    const isCrit=Math.random()*100<totalCrit;
    let dmg=totalDmg*attackMode;
    if (isCrit) dmg*=2;
    if (attackMode===5&&gearStats.x5bonus) dmg=Math.floor(dmg*1.1);

    const newHp=Math.max(0,(state.currentBossHp||state.bossIndex)-dmg);
    const logLine=isCrit?`💥 CRITICAL x${attackMode}! ${dmg} dmg!`:`⚔️ x${attackMode} — ${dmg} damage!`;
    setCombatLog(prev=>[logLine,...prev.slice(0,4)]);
    if(isCrit&&soundOn) playSfx("crit");

    if (newHp<=0) {
      if(soundOn) playSfx("victory");
      const xpGain=state.bossIndex*10;
      const drop=getBossDrops(level);
      let newInventory=[...(state.inventory||[])];
      let extraEnergy=0;

      if (drop.type==="attacks") {
        extraEnergy=drop.amount;
      } else {
        if(soundOn) playSfx("loot");
        const slot=GEAR_SLOTS[Math.floor(Math.random()*GEAR_SLOTS.length)];
        const stats=GEAR_STATS[slot][drop.rarity];
        drop.item={id:Date.now(),slot,rarity:drop.rarity,emoji:GEAR_EMOJI[slot],name:stats.name,date:new Date().toLocaleDateString("en")};
        newInventory=[...newInventory.slice(-49),drop.item];
      }

      setDropResult(drop); setShowDrop(true); setCombatResult("victory");
      const newEnergy=Math.min(maxEnergy,Math.max(0,currentEnergy-cost)+extraEnergy);
      const newBossIndex=state.bossIndex+1;

      setState(prev=>({
        ...prev,
        totalXp:prev.totalXp+xpGain, tokens:prev.tokens+5,
        bossIndex:newBossIndex, currentBossHp:newBossIndex,
        inventory:newInventory, energy:newEnergy, lastEnergyTime:Date.now(),
        log:[...(prev.log||[]).slice(-20),`Boss #${state.bossIndex} defeated! +${xpGain}XP +5🪙`],
      }));
    } else {
      setState(prev=>({...prev,currentBossHp:newHp,energy:Math.max(0,currentEnergy-cost),lastEnergyTime:Date.now()}));
    }
  }

  function nextBoss() { setCombatResult(null); setCombatLog([]); setShowDrop(false); setDropResult(null); }

  // ── WATCH AD ──────────────────────────────────────────────────────────────
  function startWatchAd() {
    if (watchingAd||currentEnergy>=maxEnergy) return;
    setWatchingAd(true); setAdTimer(30);
    adRef.current=setInterval(()=>{
      setAdTimer(prev=>{
        if(prev<=1){
          clearInterval(adRef.current); setWatchingAd(false);
          setState(p=>({...p,energy:Math.min(calcMaxEnergy(p.gear),calcEnergy(p.energy,p.lastEnergyTime,p.gear)+5)}));
          return 0;
        }
        return prev-1;
      });
    },1000);
  }

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  async function loadLeaderboard() {
    setLoadingLB(true); setLeaderboard(await fetchLeaderboard()); setLoadingLB(false);
  }
  async function loadInbox() {
    if(!state.username) return;
    setLoadingInbox(true); setInbox(await fetchInbox(state.username)); setLoadingInbox(false);
  }
  async function addFriend() {
    const name=friendInput.trim();
    if(!name||name===state.username) return;
    if((state.friends||[]).includes(name)) return;
    const p=await fetchPublicProfile(name);
    if(!p){alert("User not found!");return;}
    setState(prev=>({...prev,friends:[...(prev.friends||[]),name]}));
    setFriendProfiles(prev=>({...prev,[name]:p}));
    setFriendInput("");
  }
  async function loadFriendProfile(name) {
    const p=await fetchPublicProfile(name);
    if(p){setFriendProfiles(prev=>({...prev,[name]:p}));setViewProfile(p);setScreen("viewProfile");}
  }
  async function doSendGift(toUsername) {
    if(state.tokens<100){setGiftMsg("Need 100 tokens!");return;}
    setGiftSending(true);
    const inv=(state.inventory||[]).filter(i=>i);
    if(!inv.length){setGiftMsg("No items to send!");setGiftSending(false);return;}
    const item=inv[Math.floor(Math.random()*inv.length)];
    const ok=await sendGift(state.username,toUsername,item);
    if(ok){setState(prev=>({...prev,tokens:prev.tokens-100}));setGiftMsg(`🎁 Sent!`);}
    else setGiftMsg("Error. Try again.");
    setGiftSending(false); setTimeout(()=>setGiftMsg(""),3000);
  }
  async function claimGift(gift) {
    await deleteGift(gift.key);
    setInbox(prev=>prev.filter(g=>g.key!==gift.key));
    setState(prev=>({...prev,inventory:[...(prev.inventory||[]).slice(-49),{...gift.item,date:new Date().toLocaleDateString("en"),gift:true}]}));
  }
  function equipItem(item) { setState(prev=>({...prev,gear:{...prev.gear,[item.slot]:item}})); setEquipFrom(null); }

  // ─── STYLES ────────────────────────────────────────────────────────────────
  const css=`
    @keyframes twinkle{from{opacity:0.1}to{opacity:0.7}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes slideIn{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .btn{cursor:pointer;border:none;border-radius:8px;font-family:Georgia,serif;font-weight:700;transition:all 0.2s}
    .btn:hover{transform:translateY(-2px);filter:brightness(1.15)}
    .btn:active{transform:translateY(0)}
    .btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;filter:none}
    .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;backdrop-filter:blur(4px)}
    .tab{cursor:pointer;padding:7px 8px;border-radius:8px;font-size:11px;font-family:Georgia,serif;font-weight:700;border:none;transition:all 0.2s}
    input{background:#0d0d2b;border:1px solid #333;border-radius:8px;padding:9px 12px;color:#fde68a;font-family:Georgia,serif;outline:none;width:100%;box-sizing:border-box}
    input::placeholder{color:#444}
    input[type=password]{letter-spacing:2px}
  `;
  const wrap={minHeight:"100vh",background:"linear-gradient(135deg,#0a0a1a 0%,#0d0d2b 50%,#0a0a1a 100%)",fontFamily:"Georgia,serif",color:"#e8e0d0",padding:"12px 12px 100px 12px",position:"relative",overflow:"hidden"};
  const stars=(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {[...Array(30)].map((_,i)=>(
        <div key={i} style={{position:"absolute",width:2,height:2,background:"#fff",borderRadius:"50%",left:`${(i*37+13)%100}%`,top:`${(i*53+7)%100}%`,opacity:0.15+(i%5)*0.08,animation:`twinkle ${2+(i%3)}s infinite alternate`}}/>
      ))}
    </div>
  );

  function OptionsBtn() {
    return (
      <div style={{position:"relative"}}>
        <button className="btn" onClick={()=>setShowOptions(!showOptions)} style={{background:"rgba(255,255,255,0.06)",color:"#aaa",border:"1px solid #333",padding:"4px 10px",fontSize:14}}>⚙️</button>
        {showOptions&&(
          <div style={{position:"absolute",right:0,top:36,background:"#0d0d2b",border:"1px solid #333",borderRadius:10,padding:12,zIndex:200,minWidth:160,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>⚙️ Options</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:12,color:"#e8e0d0"}}>🔊 Sound</span>
              <button className="btn" onClick={()=>{setSoundOn(p=>{const n=!p;if(n)startMusic();else stopMusic();return n;})}} style={{background:soundOn?"#22c55e":"#333",color:"#fff",padding:"3px 10px",fontSize:11}}>{soundOn?"ON":"OFF"}</button>
            </div>
            <button className="btn" onClick={()=>{setShowOptions(false);if(confirm("Log out?")) {saveCache(null);setState(initialState);stopMusic();setScreen("auth");}}} style={{width:"100%",background:"transparent",color:"#555",border:"1px solid #333",padding:"5px",fontSize:11,marginTop:4}}>🚪 Log Out</button>
          </div>
        )}
      </div>
    );
  }

  function BottomNav() {
    return (
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50}}>
        {/* Monetag script zone */}
        <div id="monetag-banner" style={{background:"rgba(0,0,0,0.85)",borderTop:"1px solid #111",padding:"4px 0",minHeight:28,textAlign:"center"}}>
          <span style={{fontSize:8,color:"#222"}}>ad</span>
        </div>
        <div style={{display:"flex",background:"rgba(5,5,20,0.97)",borderTop:"1px solid #222",padding:"6px 8px 10px"}}>
          {[
            {key:"main",    emoji:"⚔️", label:"Fight"},
            {key:"social",  emoji:"🏆", label:"Social"},
            {key:"patches", emoji:"📋", label:"Patches"},
            {key:"profile", emoji:"👤", label:"Profile"},
          ].map(({key,emoji,label})=>(
            <button key={key} className="btn" onClick={()=>setScreen(key)} style={{flex:1,padding:"5px 0",fontSize:9,background:screen===key?"rgba(245,158,11,0.15)":"transparent",color:screen===key?"#fde68a":"#444",border:screen===key?"1px solid #f59e0b30":"1px solid transparent",borderRadius:8}}>{emoji}<br/>{label}</button>
          ))}
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if(screen==="loading") return (
    <div style={{...wrap,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{css}</style>{stars}
      <div style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{fontSize:48,animation:"spin 1s linear infinite"}}>⚔️</div>
        <div style={{color:"#f59e0b",marginTop:12,fontSize:14}}>Loading Token Quest...</div>
        <div style={{color:"#555",fontSize:11,marginTop:4}}>v{VERSION}</div>
      </div>
    </div>
  );

  // ── AUTH ──────────────────────────────────────────────────────────────────
  if(screen==="auth") return (
    <div style={wrap}>
      <style>{css}</style>{stars}
      <div style={{maxWidth:400,margin:"0 auto",position:"relative",zIndex:1,paddingTop:30}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:4}}>⚔️ TOKEN QUEST ⚔️</div>
          <h1 style={{color:"#fde68a",textShadow:"0 0 20px #f59e0b80",margin:"6px 0 4px",fontSize:26}}>{authMode==="register"?"CREATE HERO":"LOGIN"}</h1>
          <div style={{color:"#555",fontSize:10}}>v{VERSION}</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[["register","⚔️ New Hero"],["login","🔑 Login"]].map(([m,l])=>(
            <button key={m} className="tab" onClick={()=>setAuthMode(m)} style={{flex:1,padding:"9px",background:authMode===m?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",color:authMode===m?"#fde68a":"#555",border:authMode===m?"1px solid #f59e0b40":"1px solid #222"}}>{l}</button>
          ))}
        </div>
        {authMode==="register"&&(
          <>
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>👤 Username</div>
              <input value={regName} onChange={e=>{setRegName(e.target.value);setRegError("");}} placeholder="e.g. DragonSlayer99" style={{fontSize:14,marginBottom:8}}/>
              <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>🔑 Password</div>
              <input type="password" value={regPwd} onChange={e=>{setRegPwd(e.target.value);setRegError("");}} placeholder="Min 4 characters" style={{fontSize:14,marginBottom:8}}/>
              <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>🔑 Confirm Password</div>
              <input type="password" value={regPwd2} onChange={e=>{setRegPwd2(e.target.value);setRegError("");}} placeholder="Repeat password" style={{fontSize:14,marginBottom:6}}/>
              {regError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:4}}>⚠️ {regError}</div>}
              <div style={{fontSize:9,color:"#555"}}>Saved to cloud. Login from any device.</div>
            </div>
            <div className="card" style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:10}}>🎭 Choose your class</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {AVATARS.map(av=>(
                  <div key={av.id} onClick={()=>setRegAvatar(av.id)} style={{textAlign:"center",padding:"10px 6px",borderRadius:10,cursor:"pointer",background:regAvatar===av.id?`${av.color}20`:"rgba(255,255,255,0.02)",border:`2px solid ${regAvatar===av.id?av.color:"#333"}`,transition:"all 0.2s"}}>
                    <div style={{fontSize:28}}>{av.emoji}</div>
                    <div style={{fontSize:10,fontWeight:700,color:regAvatar===av.id?av.color:"#aaa",marginTop:4}}>{av.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn" onClick={handleRegister} style={{width:"100%",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#000",padding:"13px",fontSize:15}}>⚔️ ENTER THE DUNGEON</button>
          </>
        )}
        {authMode==="login"&&(
          <div className="card">
            <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>👤 Username</div>
            <input value={loginName} onChange={e=>{setLoginName(e.target.value);setLoginError("");}} placeholder="Your username" style={{fontSize:14,marginBottom:8}}/>
            <div style={{fontSize:11,color:"#aaa",marginBottom:6}}>🔑 Password</div>
            <input type="password" value={loginPwd} onChange={e=>{setLoginPwd(e.target.value);setLoginError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Your password" style={{fontSize:14,marginBottom:8}}/>
            {loginError&&<div style={{color:"#ef4444",fontSize:11,marginBottom:8}}>⚠️ {loginError}</div>}
            <button className="btn" onClick={handleLogin} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",padding:"13px",fontSize:15}}>🔑 LOGIN</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN FIGHT ────────────────────────────────────────────────────────────
  if(screen==="main") return (
    <div style={wrap}>
      <style>{css}</style>{stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:26,background:`${avatar.color}20`,borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${avatar.color}60`}}>{avatar.emoji}</div>
            <div>
              <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2}}>TOKEN QUEST v{VERSION}</div>
              <div style={{fontSize:15,fontWeight:700,color:"#fde68a"}}>{state.username}</div>
              <div style={{fontSize:9,color:"#a78bfa",fontStyle:"italic"}}>{title}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,color:"#fde68a",fontWeight:700}}>Lv {level}</div>
              <div style={{fontSize:10,color:"#ef4444"}}>Boss #{state.bossIndex}</div>
              <div style={{fontSize:10,color:"#aaa"}}>🪙 {state.tokens}</div>
            </div>
            <OptionsBtn/>
          </div>
        </div>

        <div style={{marginBottom:8}}>
          <div style={{background:"#1a1a2e",borderRadius:6,height:7,overflow:"hidden",border:"1px solid #222"}}>
            <div style={{width:`${Math.min(100,(xi.progress/xi.total)*100)}%`,background:"linear-gradient(90deg,#f59e0b,#ef4444)",height:"100%",borderRadius:6,transition:"width 0.8s"}}/>
          </div>
          <div style={{fontSize:9,color:"#555",marginTop:1,textAlign:"right"}}>{xi.progress}/{xi.total} XP → Lv {level+1}</div>
        </div>

        <EnergyBar current={currentEnergy} max={maxEnergy} nextMs={nextMs} fullMs={fullMs}/>

        <div className="card" style={{marginBottom:10,border:"1px solid #ef444425",background:"rgba(239,68,68,0.04)"}}>
          <BossHPBar
            current={combatResult==="victory"?0:(state.currentBossHp||state.bossIndex)}
            max={state.bossIndex}
            name={`Boss #${state.bossIndex}`}
            emoji={["👹","💀","🧌","🧛","👿","🌑","😈","☠️"][state.bossIndex%8]}
          />
          <div style={{minHeight:44,marginBottom:8}}>
            {!combatLog.length&&!combatResult&&<div style={{textAlign:"center",color:"#555",fontSize:11,padding:"6px 0"}}>⚔️ Attack the boss!</div>}
            {combatLog.map((line,i)=>(
              <div key={i} style={{fontSize:11,color:i===0?"#fde68a":"#555",marginBottom:2,animation:i===0?"slideIn 0.2s ease":"none"}}>{line}</div>
            ))}
          </div>

          {combatResult==="victory"&&showDrop&&dropResult&&(
            <div style={{marginBottom:10,padding:10,background:"rgba(34,197,94,0.08)",border:"1px solid #22c55e30",borderRadius:8,animation:"slideIn 0.3s ease",textAlign:"center"}}>
              <div style={{fontSize:13,color:"#22c55e",fontWeight:700,marginBottom:4}}>⚔️ VICTORY! +{(state.bossIndex-1)*10} XP +5🪙</div>
              {dropResult.type==="attacks"&&<div style={{fontSize:12,color:"#f59e0b"}}>⚡ +{dropResult.amount} energy!</div>}
              {dropResult.type==="item"&&dropResult.item&&(
                <div>
                  <div style={{fontSize:22}}>{dropResult.item.emoji}</div>
                  <div style={{fontSize:11,fontWeight:700,color:RARITY_COLORS[dropResult.item.rarity]}}>{dropResult.item.name}</div>
                  <RarityBadge rarity={dropResult.item.rarity}/>
                </div>
              )}
            </div>
          )}

          {/* Attack mode switch */}
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            {[1,5].map(m=>(
              <button key={m} className="btn" onClick={()=>setAttackMode(m)} style={{flex:1,padding:"6px",fontSize:11,background:attackMode===m?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.04)",color:attackMode===m?"#fca5a5":"#555",border:attackMode===m?"1px solid #ef444450":"1px solid #333"}}>
                x{m} {m===1?"(1⚡)":"(5⚡)"}
                {m===5&&gearStats.x5bonus&&<span style={{color:"#FF9800"}}> ×1.1</span>}
              </button>
            ))}
          </div>

          {!combatResult?(
            <button className="btn" onClick={attack} disabled={currentEnergy<attackMode} style={{width:"100%",background:currentEnergy>=attackMode?"linear-gradient(135deg,#ef4444,#b91c1c)":"#333",color:"#fff",padding:"14px",fontSize:16}}>
              ⚔️ ATTACK x{attackMode}{currentEnergy<attackMode?" (No Energy)":""}
            </button>
          ):(
            <button className="btn" onClick={nextBoss} style={{width:"100%",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",padding:"14px",fontSize:14}}>➡️ Next Boss #{state.bossIndex}</button>
          )}
        </div>

        <div className="card" style={{marginBottom:10,background:"rgba(245,158,11,0.04)",border:"1px solid #f59e0b20"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>📺 Watch Ad</div>
              <div style={{fontSize:10,color:"#666"}}>+5 ⚡ energy</div>
            </div>
            {watchingAd?(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,color:"#f59e0b",fontWeight:700}}>{adTimer}s</div>
                <div style={{background:"#1a1a2e",borderRadius:4,height:4,width:70,overflow:"hidden",marginTop:3}}>
                  <div style={{width:`${((30-adTimer)/30)*100}%`,background:"#f59e0b",height:"100%",transition:"width 1s"}}/>
                </div>
              </div>
            ):(
              <button className="btn" onClick={startWatchAd} disabled={currentEnergy>=maxEnergy} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#000",padding:"8px 16px",fontSize:12}}>{currentEnergy>=maxEnergy?"Full":"Watch"}</button>
            )}
          </div>
        </div>

        {/* AdSense placeholder */}
        <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(255,255,255,0.01)",border:"1px dashed #222",borderRadius:8,textAlign:"center"}}>
          <div style={{fontSize:8,color:"#222"}}>Advertisement</div>
          <div style={{fontSize:10,color:"#333",marginTop:1}}>[ AdSense — pending approval ]</div>
        </div>

        <button className="btn" onClick={()=>setShowInventory(!showInventory)} style={{width:"100%",background:"rgba(168,85,247,0.08)",color:"#c084fc",border:"1px solid #a855f725",padding:"8px",fontSize:11,marginBottom:8}}>
          🎒 Inventory ({(state.inventory||[]).length}) {showInventory?"▲":"▼"}
        </button>
        {showInventory&&(
          <div className="card" style={{marginBottom:10,animation:"slideIn 0.3s ease"}}>
            {!(state.inventory||[]).length
              ? <div style={{textAlign:"center",color:"#444",fontSize:12}}>No items yet!</div>
              : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                  {(state.inventory||[]).slice().reverse().slice(0,12).map((item,i)=>(
                    <div key={i} onClick={()=>setEquipFrom(item)} style={{background:`${RARITY_COLORS[item.rarity]}12`,border:`1px solid ${RARITY_COLORS[item.rarity]}40`,borderRadius:8,padding:8,cursor:"pointer",textAlign:"center"}}>
                      <div style={{fontSize:18}}>{item.emoji}</div>
                      <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                      <div style={{fontSize:8,color:"#555"}}>tap to equip</div>
                    </div>
                  ))}
                </div>}
          </div>
        )}
        {equipFrom&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div className="card" style={{maxWidth:280,width:"90%",textAlign:"center",border:`2px solid ${RARITY_COLORS[equipFrom.rarity]}`,boxShadow:`0 0 30px ${RARITY_COLORS[equipFrom.rarity]}40`}}>
              <div style={{fontSize:40,marginBottom:8}}>{equipFrom.emoji}</div>
              <div style={{fontSize:16,fontWeight:700,color:RARITY_COLORS[equipFrom.rarity]}}>{equipFrom.name}</div>
              <RarityBadge rarity={equipFrom.rarity}/>
              <div style={{fontSize:11,color:"#aaa",margin:"8px 0",lineHeight:1.6}}>
                {equipFrom.slot}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.dmg>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].dmg} dmg`}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.armor>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].armor} armor`}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.dodge>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].dodge}% dodge`}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.critRate>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].critRate}% crit`}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.hitRate>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].hitRate}% hit`}
                {GEAR_STATS[equipFrom.slot]?.[equipFrom.rarity]?.energyCap>0&&` • +${GEAR_STATS[equipFrom.slot][equipFrom.rarity].energyCap} energy cap`}
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button className="btn" onClick={()=>equipItem(equipFrom)} style={{flex:1,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",padding:"10px",fontSize:12}}>✅ Equip</button>
                <button className="btn" onClick={()=>setEquipFrom(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",color:"#aaa",border:"1px solid #333",padding:"10px",fontSize:12}}>✕</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  if(screen==="social") return (
    <div style={wrap}>
      <style>{css}</style>{stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:10,color:"#f59e0b",letterSpacing:3}}>🏆 SOCIAL</div></div>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {[["leaderboard","🏆 Top"],["friends","👥 Friends"],["inbox","🎁 Inbox"]].map(([k,l])=>(
            <button key={k} className="tab" onClick={()=>setSocialTab(k)} style={{flex:1,background:socialTab===k?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",color:socialTab===k?"#fde68a":"#555",border:socialTab===k?"1px solid #f59e0b40":"1px solid #222"}}>
              {l}{k==="inbox"&&inbox.length>0&&<span style={{color:"#ef4444"}}> {inbox.length}</span>}
            </button>
          ))}
        </div>

        {socialTab==="leaderboard"&&(
          <div style={{animation:"slideIn 0.3s ease"}}>
            <button className="btn" onClick={loadLeaderboard} style={{width:"100%",background:"rgba(245,158,11,0.1)",color:"#fde68a",border:"1px solid #f59e0b30",padding:"8px",fontSize:12,marginBottom:10}}>
              {loadingLB?"⏳ Loading...":"🔄 Refresh"}
            </button>
            {leaderboard.length===0&&!loadingLB&&<div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No players yet!</div>}
            {leaderboard.map((p,i)=>(
              <div key={p.username} className="card" style={{marginBottom:6,cursor:"pointer",border:p.username===state.username?"1px solid #f59e0b60":"1px solid rgba(255,255,255,0.06)",background:p.username===state.username?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.02)"}}
                onClick={()=>{setViewProfile(p);setScreen("viewProfile");}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:16,fontWeight:700,minWidth:22,textAlign:"center",color:i<3?["#f59e0b","#aaa","#CD7F32"][i]:"#444"}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
                  <div style={{fontSize:20}}>{(AVATARS.find(a=>a.id===p.avatar)||AVATARS[0]).emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:p.username===state.username?"#fde68a":"#e8e0d0"}}>{p.username}{p.username===state.username&&" (you)"}</div>
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
                <input value={friendInput} onChange={e=>setFriendInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFriend()} placeholder="Exact username..."/>
                <button className="btn" onClick={addFriend} style={{background:"rgba(245,158,11,0.2)",color:"#fde68a",border:"1px solid #f59e0b40",padding:"9px 12px",fontSize:12,whiteSpace:"nowrap"}}>➕</button>
              </div>
            </div>
            {!(state.friends||[]).length
              ? <div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No friends yet!</div>
              : (state.friends||[]).map(name=>{
                  const p=friendProfiles[name];
                  return (
                    <div key={name} className="card" style={{marginBottom:6,cursor:"pointer"}} onClick={()=>loadFriendProfile(name)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:22}}>{p?(AVATARS.find(a=>a.id===p.avatar)||AVATARS[0]).emoji:"👤"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#fde68a"}}>{name}</div>
                          {p?<div style={{fontSize:10,color:"#aaa"}}>Lv {p.level} — Boss #{p.bossIndex}</div>:<div style={{fontSize:10,color:"#555"}}>Tap to load</div>}
                        </div>
                        <button className="btn" onClick={e=>{e.stopPropagation();setGiftTarget(name);}} style={{background:"rgba(168,85,247,0.15)",color:"#c084fc",border:"1px solid #a855f730",padding:"5px 8px",fontSize:10}}>🎁<br/><span style={{fontSize:8}}>−100🪙</span></button>
                      </div>
                      {giftTarget===name&&(
                        <div style={{marginTop:8,padding:8,background:"rgba(168,85,247,0.08)",borderRadius:8,border:"1px solid #a855f730"}} onClick={e=>e.stopPropagation()}>
                          <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>Send random item to {name} (−100 tokens)</div>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn" onClick={()=>doSendGift(name)} disabled={giftSending||state.tokens<100} style={{flex:1,background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"8px",fontSize:12,opacity:state.tokens<100?0.5:1}}>{giftSending?"⏳":"✅ Confirm"}</button>
                            <button className="btn" onClick={()=>setGiftTarget(null)} style={{background:"rgba(255,255,255,0.05)",color:"#aaa",border:"1px solid #333",padding:"8px 10px",fontSize:12}}>✕</button>
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
            <button className="btn" onClick={loadInbox} style={{width:"100%",background:"rgba(168,85,247,0.1)",color:"#c084fc",border:"1px solid #a855f730",padding:"8px",fontSize:12,marginBottom:10}}>{loadingInbox?"⏳ Loading...":"🔄 Check Gifts"}</button>
            {!inbox.length&&!loadingInbox&&<div style={{textAlign:"center",color:"#444",fontSize:12,padding:20}}>No gifts yet!</div>}
            {inbox.map((gift,i)=>(
              <div key={i} className="card" style={{marginBottom:8,border:"1px solid #a855f740",background:"rgba(168,85,247,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:28}}>{gift.item?.emoji||"🎁"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#c084fc"}}>{gift.item?.name||"Mystery Item"}</div>
                    <div style={{fontSize:10,color:"#aaa"}}>From: <strong>{gift.from}</strong></div>
                    {gift.item?.rarity&&<RarityBadge rarity={gift.item.rarity}/>}
                  </div>
                  <button className="btn" onClick={()=>claimGift(gift)} style={{background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"8px 12px",fontSize:12}}>🎁 Claim</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );

  // ── PATCHES ───────────────────────────────────────────────────────────────
  if(screen==="patches") return (
    <div style={wrap}>
      <style>{css}</style>{stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:3}}>📋 PATCH NOTES</div>
          <div style={{fontSize:10,color:"#555",marginTop:4}}>Token Quest — Version History</div>
        </div>
        {PATCH_NOTES.map((patch,i)=>(
          <div key={patch.version} className="card" style={{marginBottom:12,border:i===0?"1px solid #f59e0b40":"1px solid rgba(255,255,255,0.08)",background:i===0?"rgba(245,158,11,0.04)":"rgba(255,255,255,0.02)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {i===0&&<span style={{fontSize:9,background:"#f59e0b",color:"#000",padding:"1px 6px",borderRadius:4,fontWeight:700}}>LATEST</span>}
                <span style={{fontSize:16,fontWeight:700,color:"#fde68a"}}>v{patch.version}</span>
              </div>
              <span style={{fontSize:10,color:"#555"}}>{patch.date}</span>
            </div>
            {patch.changes.map((change,j)=>(
              <div key={j} style={{fontSize:11,color:"#aaa",marginBottom:5,paddingLeft:8,borderLeft:"2px solid #333",lineHeight:1.4}}>{change}</div>
            ))}
          </div>
        ))}
      </div>
      <BottomNav/>
    </div>
  );

  // ── PROFILE ───────────────────────────────────────────────────────────────
  if(screen==="profile") return (
    <div style={wrap}>
      <style>{css}</style>{stars}
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div className="card" style={{marginBottom:10,textAlign:"center",border:`1px solid ${avatar.color}40`,animation:"slideIn 0.4s ease"}}>
          <div style={{fontSize:56,marginBottom:4}}>{avatar.emoji}</div>
          <h2 style={{color:"#fde68a",margin:"2px 0",fontSize:20}}>{state.username}</h2>
          <div style={{color:avatar.color,fontSize:11,marginBottom:4}}>{avatar.name}</div>
          <div style={{color:"#a78bfa",fontSize:11,fontStyle:"italic",marginBottom:12}}>{title}</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
            <div><div style={{fontSize:18,fontWeight:700,color:"#fde68a"}}>Lv {level}</div><div style={{fontSize:8,color:"#aaa"}}>Level</div></div>
            <div><div style={{fontSize:18,fontWeight:700,color:"#34d399"}}>🪙{state.tokens}</div><div style={{fontSize:8,color:"#aaa"}}>Tokens</div></div>
            <div><div style={{fontSize:18,fontWeight:700,color:"#ef4444"}}>💀#{state.bossIndex}</div><div style={{fontSize:8,color:"#aaa"}}>Boss</div></div>
            <div><div style={{fontSize:18,fontWeight:700,color:"#fbbf24"}}>🔥{state.streak||0}</div><div style={{fontSize:8,color:"#aaa"}}>Streak</div></div>
          </div>
          <div style={{fontSize:10,color:"#aaa",marginBottom:8,lineHeight:1.8}}>
            ⚔️ DMG: {totalDmg} | 🎯 Crit: {totalCrit}% | 🎯 Hit: {totalHit}%<br/>
            🛡️ Armor: {totalArmor} | 💨 Dodge: {totalDodge}% | ⚡ {currentEnergy}/{maxEnergy}
          </div>
          <StatBar label="XP" value={xi.progress} max={xi.total} color="#f59e0b"/>
        </div>

        <div className="card" style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🛡️ Equipped Gear</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {GEAR_SLOTS.map(slot=>(
              <GearSlot key={slot} slot={slot} item={state.gear?.[slot]}
                onEquip={()=>{
                  const items=(state.inventory||[]).filter(i=>i&&i.slot===slot);
                  if(!items.length) return;
                  const best=items.sort((a,b)=>RARITY_ORDER.indexOf(b.rarity)-RARITY_ORDER.indexOf(a.rarity))[0];
                  equipItem(best);
                }}/>
            ))}
          </div>
          <div style={{fontSize:9,color:"#555",marginTop:6,textAlign:"center"}}>Tap slot to auto-equip best</div>
        </div>

        <div className="card" style={{marginBottom:10}}>
          <EnergyBar current={currentEnergy} max={maxEnergy} nextMs={nextMs} fullMs={fullMs}/>
        </div>

        <div className="card" style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🎒 Inventory ({(state.inventory||[]).length})</div>
          {!(state.inventory||[]).length
            ? <div style={{color:"#444",fontSize:12,textAlign:"center"}}>No items yet!</div>
            : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {(state.inventory||[]).slice().reverse().slice(0,12).map((item,i)=>(
                  <div key={i} onClick={()=>equipItem(item)} style={{background:`${RARITY_COLORS[item.rarity]}12`,border:`1px solid ${RARITY_COLORS[item.rarity]}40`,borderRadius:8,padding:8,cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:18}}>{item.emoji}</div>
                    <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                  </div>
                ))}
              </div>}
        </div>

        <div style={{textAlign:"center",marginBottom:8,fontSize:9,color:"#333"}}>☁️ Account saved to cloud</div>
      </div>
      <BottomNav/>
    </div>
  );

  // ── VIEW PROFILE ──────────────────────────────────────────────────────────
  if(screen==="viewProfile"&&viewProfile) {
    const vAv=AVATARS.find(a=>a.id===viewProfile.avatar)||AVATARS[0];
    return (
      <div style={wrap}>
        <style>{css}</style>{stars}
        <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
          <button className="btn" onClick={()=>setScreen("social")} style={{background:"rgba(255,255,255,0.06)",color:"#aaa",border:"1px solid #333",padding:"6px 14px",fontSize:12,marginBottom:10}}>← Back</button>
          <div className="card" style={{marginBottom:10,textAlign:"center",border:`1px solid ${vAv.color}40`}}>
            <div style={{fontSize:48}}>{vAv.emoji}</div>
            <h2 style={{color:"#fde68a",margin:"4px 0 2px",fontSize:20}}>{viewProfile.username}</h2>
            <div style={{color:vAv.color,fontSize:10,marginBottom:4}}>{vAv.name}</div>
            <div style={{color:"#a78bfa",fontSize:11,fontStyle:"italic",marginBottom:10}}>{viewProfile.title}</div>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:8}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#fde68a"}}>Lv {viewProfile.level}</div><div style={{fontSize:8,color:"#aaa"}}>Level</div></div>
              <div><div style={{fontSize:16,fontWeight:700,color:"#34d399"}}>🪙{viewProfile.tokens}</div><div style={{fontSize:8,color:"#aaa"}}>Tokens</div></div>
              <div><div style={{fontSize:16,fontWeight:700,color:"#ef4444"}}>💀#{viewProfile.bossIndex}</div><div style={{fontSize:8,color:"#aaa"}}>Boss</div></div>
              <div><div style={{fontSize:16,fontWeight:700,color:"#fbbf24"}}>🔥{viewProfile.streak||0}</div><div style={{fontSize:8,color:"#aaa"}}>Streak</div></div>
            </div>
          </div>
          {viewProfile.gear&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🛡️ Their Gear</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {GEAR_SLOTS.map(slot=><GearSlot key={slot} slot={slot} item={viewProfile.gear?.[slot]} onEquip={()=>{}}/>)}
              </div>
            </div>
          )}
          {viewProfile.inventory?.length>0&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#aaa",marginBottom:8}}>🎒 Latest items</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {viewProfile.inventory.slice(-6).reverse().map((item,i)=>(
                  <div key={i} style={{background:`${RARITY_COLORS[item.rarity]}12`,border:`1px solid ${RARITY_COLORS[item.rarity]}40`,borderRadius:8,padding:8,textAlign:"center"}}>
                    <div style={{fontSize:18}}>{item.emoji}</div>
                    <div style={{fontSize:9,fontWeight:700,color:RARITY_COLORS[item.rarity]}}>{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(state.friends||[]).includes(viewProfile.username)&&(
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>🎁 Send Gift (−100 tokens)</div>
              {giftMsg&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:8}}>{giftMsg}</div>}
              <button className="btn" onClick={()=>doSendGift(viewProfile.username)} disabled={giftSending||state.tokens<100} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"#fff",padding:"10px",fontSize:13,opacity:state.tokens<100?0.5:1}}>
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
