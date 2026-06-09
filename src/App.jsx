import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

const initialState = {
  username: "",
  stats:{FOR:10,RES:10,LCK:10,SAG:10},
  totalXp:0, gettoni:0, gettoniExtra:0,
  streak:0, lastDay:null,
  inventory:[], log:[],
  bossDay:0, weekSeed:0,
  todayDefeated:false, todayLooted:false,
  weeklyBossDefeated:false, weeklyBossLooted:false,
  friends:[], // array of usernames
  inbox:[], // gift notifications
};

function loadLocal() {
  try { const s=localStorage.getItem("nenny_rpg_v3"); return s?{...initialState,...JSON.parse(s)}:initialState; }
  catch { return initialState; }
}
function saveLocal(s) { try { localStorage.setItem("nenny_rpg_v3",JSON.stringify(s)); } catch{} }

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────

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
                            ? <div style={{fontSize:10,color:"#aaa"}}>Lv {p.level} — {p.title}</div>
                            : <div style={{fontSize:10,color:"#555"}}>Tocca per caricare profilo</div>}
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <button className="btn" onClick={e=>{e.stopPropagation();setGiftTarget(name);}} style={{
                            background:"rgba(168,85,247,0.15)",color:"#c084fc",border:"1px solid #a855f730",
                            padding:"5px 10px",fontSize:11,
                          }}>🎁 Gift<br/><span style={{fontSize:9}}>−100🪙</span></button>
                        </div>
                      </div>
                      {giftTarget===name&&(
                        <div style={{marginTop:8,padding:8,background:"rgba(168,85,247,0.08)",borderRadius:8,border:"1px solid #a855f730"}} onClick={e=>e.stopPropagation()}>
                          <div style={{fontSize:11,color:"#c084fc",marginBottom:6}}>Invia un oggetto casuale a {name} (−100 gettoni)</div>
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

        {/* Inbox */}
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

  // ── PROFILE ─────────────────────────────────────────────────────────────────
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

        {/* Ultimi oggetti */}
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

  // ── VIEW EXTERNAL PROFILE ───────────────────────────────────────────────────
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
        {/* Gift button */}
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
