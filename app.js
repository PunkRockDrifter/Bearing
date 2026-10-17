/* ===== Bearing: app ===== */
const KEY = 'bearing.v1';
const TIER = ['S','A','B','C','D'];
const TIER_NAME = { S:'Top match', A:'Strong match', B:'Good match', C:'Possible', D:'Unlikely' };
// Label column: first word large, the rest small underneath ("Top" / "match").
const tierLab = t => { const [w,...rest]=TIER_NAME[t].split(' '); return `${w}${rest.length?`<small>${rest.join(' ')}</small>`:''}`; };
const READY = ['Could step in soon','Short bridge','Longer pathway'];

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hash(str){ let h=2166136261; for(const ch of str){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr, seedStr){ const r=rng(hash(seedStr)); const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const flip = id => hash('side'+id) % 2 === 1;
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const nm = () => (F && F.for) ? F.for : 'them';
const okEmail = e => typeof e==='string' && e.length<=120 && /^[^\s@<>"',;:]+@[^\s@<>"',;:]+\.[^\s@<>"',;:]+$/.test(e);
/* A friend's answers, minus the invite details (the sender's email never travels back inside the code). */
const friendOut = () => { const {reply,lock,...rest}=F; return rest; };
const APK_URL = (typeof window!=='undefined' && window.BEARING_APK_URL) || '';

function encode(prefix, obj){
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return prefix + b64;
}
function decode(code){
  code = (code||'').trim().replace(/\s+/g,'');
  const found = code.match(/(BRG-[PF]1\.[A-Za-z0-9_-]+)/); if(found) code = found[1];
  const m = code.match(/^(BRG-P1\.|BRG-F1\.)(.+)$/);
  if(!m) return null;
  try{
    let b = m[2].replace(/-/g,'+').replace(/_/g,'/'); while(b.length%4) b+='=';
    return { kind: m[1]==='BRG-P1.' ? 'profile' : 'friend', data: JSON.parse(decodeURIComponent(escape(atob(b)))) };
  }catch(e){ return null; }
}

/* ---------- state ---------- */
function fresh(){ return { v:1, phase:'intro', idx:0, name:'', stories:{}, stories2:{}, storyText:{}, pairs:{}, ipip:{}, cond:{},
  exp:{ skills:[], q:null }, expSkipped:false, refine:{ pairs:{}, deep:{}, drain:[] }, refineDone:false, friends:[], view:'tiers', open:null, roles:[], useHistory:false, minPay:0 }; }
function freshF(){ return { for:'', by:'', pairs:{}, ipip:{}, cond:{}, text:'' }; }
let S = fresh(), F = null;
const HOSTED = typeof window!=='undefined' && window.BEARING_HOSTED===true;
const SKEY = 'bearing.settings';
let SET = { ai:false };
let deferredInstall = null;
const HOST_THEME = typeof document!=='undefined' ? document.documentElement.getAttribute('data-theme') : null;
const darkQuery = typeof window!=='undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function isDark(){
  const t = SET.theme || 'system';
  if(t==='dark') return true; if(t==='light') return false;
  if(HOST_THEME) return HOST_THEME==='dark';
  return !!(darkQuery && darkQuery.matches);
}
function applyTheme(){
  const root=document.documentElement, t=SET.theme||'system';
  if(t==='system'){ if(HOST_THEME) root.setAttribute('data-theme',HOST_THEME); else root.removeAttribute('data-theme'); }
  else root.setAttribute('data-theme',t);
  const dark=isDark(), ground = dark ? '#121A15' : '#E8EBE3';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{ m.setAttribute('content',ground); m.removeAttribute('media'); });
  try{ if(window.BearingNative && window.BearingNative.setBars) window.BearingNative.setBars(dark); }catch(e){}
}
function saveSet(){ try{ localStorage.setItem(SKEY, JSON.stringify(SET)); }catch(e){} }
function loadSet(){ try{ const r=localStorage.getItem(SKEY); if(r) SET=Object.assign({ai:false,theme:'system'}, JSON.parse(r)); }catch(e){} }
const ANDROID = typeof window!=='undefined' && window.BEARING_ANDROID===true;
const NATIVE = typeof window!=='undefined' && !!window.BearingNative;
const SHARE_BASE = (typeof window!=='undefined' && window.BEARING_SHARE_BASE) || '';
// Share links need a public web address. Inside the Android app that comes from config.js.
const LINKS = HOSTED && (!ANDROID || !!SHARE_BASE);
const baseUrl = () => SHARE_BASE || (location.origin + location.pathname);
const APP_VERSION = '1.0';
const FEEDBACK_URL = (typeof window!=='undefined' && window.BEARING_FEEDBACK_URL) || '';
const FEEDBACK_ON = HOSTED && !!FEEDBACK_URL;
const FB_FIT = [['spot','Spot on'],['mostly','Mostly'],['partly','Partly'],['no','Not at all']];
const FB_USE = [['new','Gave me new ideas'],['confirmed','Confirmed what I thought'],['not','Not useful']];
const FB_AGE = ['16\u201317','18\u201324','25\u201334','35\u201344','45\u201354','55+'];
const FB_STATE = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT','Outside Australia'];
const r2 = x => x===null||x===undefined ? null : Math.round(x*100)/100;
function newId(){ const a=new Uint8Array(6); (crypto.getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*256)); return 'B-'+Array.from(a,b=>b.toString(36).padStart(2,'0')).join('').slice(0,10).toUpperCase(); }
/* Builds exactly what is sent. The preview shows this same object. */
function buildFeedback(){
  const fb=S.fb||{}; const out = { v:APP_VERSION, id:fb.id||'(assigned when sent)', fit:fb.fit||null, useful:fb.useful||null,
    explore:fb.explore||[], comment:(fb.comment||'').slice(0,500), age:fb.age||null, state:fb.state||null, answers:null };
  if(fb.include){
    const P=profile(S), D=directionOf(P), sc=LAST.length?LAST:scoreJobs(P,S);
    out.answers = {
      direction:D.key, bearing:P.bearing.deg, lean:r2(P.bearing.strength),
      interests:Object.fromEntries(ORDER.map(t=>[t,r2(P.rel[t])])),
      traits:Object.fromEntries(TRAIT_ORDER.map(k=>[k,r2(P.selfTraits[k])])),
      conditions:Object.fromEntries(COND_KEYS.map(k=>[k,S.cond[k]??null])),
      stories:S.stories, stories_also:S.stories2||{}, pairs:S.pairs, ratings:S.ipip,
      refine: S.refineDone ? { pairs:S.refine.pairs, drain:S.refine.drain, tags:Object.fromEntries(Object.entries(S.refine.deep).map(([k,d])=>[k,d.tags])) } : null,
      experience: S.expSkipped||S.exp.q===null ? null : { qual:S.exp.q, skills:S.exp.skills },
      roles: (S.roles||[]).map(r=>({ types:r.types, good:r.good, enjoy:r.enjoy })),
      history_used: !!S.useHistory, friends_added:(S.friends||[]).length,
      filters:{ min_pay:S.minPay||0, max_training:S.maxQ??4 },
      tiers:{ S:sc.filter(o=>o.tier==='S').map(o=>o.j.t), A:sc.filter(o=>o.tier==='A').map(o=>o.j.t), B:sc.filter(o=>o.tier==='B').map(o=>o.j.t) }
    };
  }
  return out;
}
async function postFeedback(payload){
  // Apps Script web apps don't answer CORS preflights, so send as a simple text/plain request.
  await fetch(FEEDBACK_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload) });
}
async function flushQueue(){
  if(!FEEDBACK_ON || !(SET.queue||[]).length) return;
  const q=SET.queue.slice(); SET.queue=[];
  for(const item of q){ try{ await postFeedback(item); } catch(e){ SET.queue.push(item); } }
  saveSet();
}
function shareLink(title, text, url, fallbackEl){
  if(NATIVE){ window.BearingNative.share(title, text+'\n'+url); return; }
  if(navigator.share){ navigator.share({ title, text, url }).catch(()=>{}); return; }
  copyText(url, fallbackEl);
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify({S,F})); }catch(e){} }
function load(){ try{ const raw = localStorage.getItem(KEY); if(raw){ const o=JSON.parse(raw); if(o && o.S){ S=Object.assign(fresh(),o.S); F=o.F||null; } } }catch(e){} }

/* ---------- screen lists ---------- */
const SECS = {interlude:5, story:28, pair:10, ipip:30, cond:25, exp:45, roles:60, deep:60, drain:15, fname:20, fpair:10, fipip:30, fcond:30, ftext:30, fdone:0};
const secsOf = list => list.reduce((a,x)=>a+(SECS[x.type]??10),0);
const minsOf = list => Math.max(1, Math.round(secsOf(list)/60));
function chunk(a,n){ const out=[]; for(let i=0;i<a.length;i+=n) out.push(a.slice(i,i+n)); return out; }
function quickScreens(){
  const s=[{type:'interlude', part:1, title:'Stories', text:'Six questions about the things you’re drawn to. There are no wrong answers and nothing here is about jobs. Go with your first instinct.'}];
  STORIES.forEach(it=>s.push({type:'story', item:it, part:1}));
  s.push({type:'interlude', part:2, title:'Trade-offs', text:'Fifteen quick choices between two things you might do for a day. Skills don’t matter, so pick the one you’d come home happier from.'});
  shuffle(PAIRS,'pairs').forEach(it=>s.push({type:'pair', item:it, set:'pairs', part:2}));
  s.push({type:'interlude', part:3, title:'How you run', text:'Twenty short statements. Rate how much each sounds like you most of the time, not how you’d like to be.'});
  chunk(IPIP,5).forEach(items=>s.push({type:'ipip', items, part:3}));
  s.push({type:'interlude', part:4, title:'Conditions', text:'Where you’d sit between two ways a working day can go. The middle is fine if you genuinely don’t mind.'});
  chunk(COND,3).forEach(items=>s.push({type:'cond', items, part:4}));
  s.push({type:'exp', part:5});
  s.push({type:'roles', part:5});
  return s;
}
function refineScreens(){
  const s=[{type:'interlude', part:1, title:'Refining round', text:'', refine:true}];
  shuffle(PAIRS_REFINE,'refine').forEach(it=>s.push({type:'pair', item:it, set:'refine', part:1}));
  DEEP.forEach(it=>s.push({type:'deep', item:it, part:2}));
  s.push({type:'drain', part:3});
  s[0].text = `Fifteen more trade-offs, three questions to answer in your own words, and one about what wears you out. About ${minsOf(s)} minutes.`;
  return s;
}
function friendScreens(){
  const s=[{type:'fname'}];
  FRIEND_PAIRS.map(id=>PAIRS.find(p=>p.id===id)).forEach(it=>s.push({type:'fpair', item:it}));
  chunk(IPIP.filter(i=>i.f),5).forEach(items=>s.push({type:'fipip', items}));
  s.push({type:'fcond'}); s.push({type:'ftext'}); s.push({type:'fdone'});
  return s;
}
function screens(){ return S.phase==='quick'?quickScreens(): S.phase==='refine'?refineScreens(): S.phase==='friend'?friendScreens(): []; }
const PART_NAMES = { quick:['Stories','Trade-offs','How you run','Conditions','Experience'], refine:['Trade-offs','In your words','What drains you'] };

/* ---------- scoring ---------- */
function relFrom(raw){
  const vals = ORDER.map(t=>raw[t]); const mn = Math.min(...vals);
  const shifted = vals.map(v=>v-mn+0.0001); const sum = shifted.reduce((a,b)=>a+b,0);
  const o={}; ORDER.forEach((t,i)=>o[t]= sum>0 ? shifted[i]/sum : 1/6); return o;
}
function selfRaw(st){
  const raw={R:0,I:0,A:0,S:0,E:0,C:0};
  Object.values(st.stories).forEach(t=>{ if(raw[t]!==undefined) raw[t]+=2; });
  Object.values(st.stories2||{}).forEach(t=>{ if(raw[t]!==undefined) raw[t]+=1; });
  const scorePairs = (ans, list) => list.forEach(p=>{ const a=ans[p.id]; if(a==='a') raw[p.a[0]]+=2; else if(a==='b') raw[p.b[0]]+=2; else if(a==='A') raw[p.a[0]]+=3; else if(a==='B') raw[p.b[0]]+=3; else if(a==='both'){ raw[p.a[0]]+=1; raw[p.b[0]]+=1; } });
  scorePairs(st.pairs, PAIRS); scorePairs(st.refine.pairs, PAIRS_REFINE);
  Object.values(st.refine.deep).forEach(d=>(d.tags||[]).forEach(t=>raw[t]+=1.5));
  (st.refine.drain||[]).forEach(t=>raw[t]-=1.5);
  if(st.useHistory) (st.roles||[]).forEach(r=>{ const v=roleVerdict(r); const d={fuel:1.5, skill:-1, again:0.75}[v.k]||0; (r.types||[]).forEach(t=>raw[t]+=d); });
  return raw;
}
function roleVerdict(r){
  if(r.good===null||r.good===undefined||r.enjoy===null||r.enjoy===undefined) return { k:'none', label:'Not rated' };
  if(r.enjoy===2 && r.good>=1) return { k:'fuel', label:'Fuel', text:'You enjoyed it and did it well. That\u2019s strong evidence for this kind of work.' };
  if(r.good===2 && r.enjoy===0) return { k:'skill', label:'Skill, not a calling', text:'You were good at it but didn\u2019t enjoy it. Useful to have, but be wary of jobs built mostly around it.' };
  if(r.enjoy===2 && r.good===0) return { k:'again', label:'Worth another look', text:'You liked it but it hadn\u2019t clicked yet. Training or a better setting might change that.' };
  if(r.enjoy===0) return { k:'drain', label:'Not for you', text:'Neither enjoyable nor a strength. Little reason to head back this way.' };
  return { k:'mixed', label:'Mixed', text:'Some good, some not. It neither pulls you toward this work nor away from it.' };
}
function friendRaw(fd){
  const raw={R:0,I:0,A:0,S:0,E:0,C:0}; let n=0;
  FRIEND_PAIRS.forEach(id=>{ const p=PAIRS.find(x=>x.id===id); const a=fd.pairs[id]; if(a==='a'){raw[p.a[0]]+=1;n++;} else if(a==='b'){raw[p.b[0]]+=1;n++;} });
  return n ? raw : null;
}
function traitsFrom(ans, items){
  const by={}; items.forEach(it=>{ const v=ans[it.id]; if(v){ (by[it.k]=by[it.k]||[]).push(it.r? 6-v : v); } });
  const o={}; TRAIT_ORDER.forEach(k=>{ o[k] = by[k] ? (mean(by[k])-3)/2 : null; }); return o;
}
function profile(st){
  const self = relFrom(selfRaw(st));
  const fr = (st.friends||[]).map(f=>({ name:f.data.by||'A friend', rel: friendRaw(f.data) ? relFrom(friendRaw(f.data)) : null,
    traits: traitsFrom(f.data.ipip||{}, IPIP.filter(i=>i.f)), cond: f.data.cond||{}, text:f.data.text||'' }));
  const w = fr.length ? 0.25 : 0;
  const rel={}; ORDER.forEach(t=>{ const fv = fr.filter(f=>f.rel).map(f=>f.rel[t]); rel[t] = fv.length ? (1-w)*self[t] + w*mean(fv) : self[t]; });
  const selfTraits = traitsFrom(st.ipip, IPIP);
  const traits={}; TRAIT_ORDER.forEach(k=>{ const fv=fr.map(f=>f.traits[k]).filter(v=>v!==null); const s=selfTraits[k];
    traits[k] = s===null ? (fv.length?mean(fv):null) : fv.length ? (1-w)*s + w*mean(fv) : s; });
  const cond={}; COND_KEYS.forEach(k=>{ const s=st.cond[k]; const fv=fr.map(f=>f.cond[k]).filter(v=>typeof v==='number');
    cond[k] = (s===undefined||s===null) ? (fv.length?mean(fv):null) : fv.length ? (1-w)*s + w*mean(fv) : s; });
  return { self, rel, traits, selfTraits, cond, friends:fr, bearing: bearingOf(rel) };
}
function bearingOf(rel){
  let x=0,y=0; ORDER.forEach(t=>{ const a=TYPES[t].deg*Math.PI/180; x+=rel[t]*Math.sin(a); y+=rel[t]*Math.cos(a); });
  let deg = Math.atan2(x,y)*180/Math.PI; if(deg<0) deg+=360;
  return { deg: Math.round(deg)%360, strength: Math.hypot(x,y) };
}
function jobVec(code){ const v={R:0,I:0,A:0,S:0,E:0,C:0}; [3,2,1].forEach((w,i)=>{ if(code[i]) v[code[i]]=w; }); return v; }
function pearson(a,b){ const xa=ORDER.map(t=>a[t]), xb=ORDER.map(t=>b[t]); const ma=mean(xa), mb=mean(xb);
  let n=0,da=0,db=0; for(let i=0;i<6;i++){ n+=(xa[i]-ma)*(xb[i]-mb); da+=(xa[i]-ma)**2; db+=(xb[i]-mb)**2; } return (da&&db)? n/Math.sqrt(da*db) : 0; }

/* Holland hexagon congruence: same type 3, neighbours 2, alternate 1, opposite 0; positions weighted 3,2,1 */
function hexDist(a,b){ const d=Math.abs(ORDER.indexOf(a)-ORDER.indexOf(b)); return Math.min(d,6-d); }
function congruence(top, code){ let n=0,d=0; code.split('').forEach((t,i)=>{ const w=[3,2,1][i]; n+=w*(3-hexDist(top[i],t)); d+=w*3; }); return d? n/d : 0; }
function scoreJobs(P, st){
  const topTypes = ORDER.slice().sort((a,b)=>P.rel[b]-P.rel[a]);
  const out = JOBS.map(j=>{
    const r = 0.6*((pearson(P.rel, jobVec(j.code))+1)/2) + 0.4*congruence(topTypes, j.code);
    let cw=0, cd=0; COND_KEYS.forEach((k,i)=>{ const c=P.cond[k]; if(c===null||c===undefined) return; const w=0.5+Math.abs(c)/2; cw+=w; cd+=w*Math.abs(c-j.c[i]); });
    const cf = cw ? 1 - cd/(4*cw) : 0.5;
    const tk = Object.keys(j.tr||{}); let tf=0.5;
    if(tk.length){ let num=0, den=0; tk.forEach(k=>{ const z=P.traits[k]; if(z!==null){ num+=z*j.tr[k]; den+=Math.abs(j.tr[k]); } }); if(den) tf=0.5+0.5*num/den; }
    const total = 0.6*r + 0.28*cf + 0.12*tf;
    return { j, r, cf, tf, total };
  });
  const tot = out.map(o=>o.total); const m=mean(tot); const sd=Math.sqrt(mean(tot.map(v=>(v-m)**2)))||1;
  out.sort((a,b)=>b.total-a.total);
  out.forEach((o,i)=>{ const z=(o.total-m)/sd; o.z=z;
    o.tier = (z>=1.3 && i<6)?'S': (z>=0.8 && i<20)?'A': (z>=0.3 && i<40)?'B': z>=-0.3?'C':'D'; });
  out.forEach(o=>{ o.why = reasons(o, P, topTypes); o.ready = readiness(o.j, st); });
  return out;
}
function reasons(o, P, topTypes){
  const j=o.j, why=[], watch=[];
  const top3 = topTypes.slice(0,3);
  const shared = j.code.split('').filter(t=>top3.includes(t));
  if(shared.length) { const n=shared.map(t=>TYPES[t].name); why.push(`Draws on your ${n.length>1? n.slice(0,-1).join(', ')+' and '+n[n.length-1] : n[0]} side${n.length>1?'s':''}.`); }
  if(!top3.includes(j.code[0])) watch.push(`At its core this is ${TYPES[j.code[0]].name} work (${TYPES[j.code[0]].blurb}), which wasn’t one of your strongest pulls.`);
  const matches=[];
  COND.forEach((c,i)=>{ const p=P.cond[c.k]; if(p===null||p===undefined) return; const jv=j.c[i];
    if(Math.abs(p)>=1 && Math.sign(p)===Math.sign(jv) && Math.abs(jv)>=1) matches.push({s:Math.abs(p)+Math.abs(jv), t:(jv>0?c.hi:c.lo).toLowerCase()});
    if(Math.abs(p)>=1 && Math.abs(p-jv)>=2.75) watch.push(`This job leans toward “${(jv>0?c.hi:c.lo).toLowerCase()}”, and you leaned toward “${(p>0?c.hi:c.lo).toLowerCase()}”.`); });
  matches.sort((a,b)=>b.s-a.s);
  if(matches.length) why.push(`Fits the conditions you picked: ${matches.slice(0,3).map(m=>m.t).join('; ')}.`);
  Object.entries(j.tr||{}).forEach(([k,v])=>{ const z=P.traits[k]; if(z===null||v<0.5) return;
    if(z>=0.3) why.push(`Your ${TRAITS[k].name.toLowerCase()} suits it.`);
    else if(z<=-0.3) watch.push(`It asks a lot of ${TRAITS[k].name.toLowerCase()}, which came out lower for you.`); });
  const not=[];
  if(o.tier!=='S'){
    if(o.r<0.72){ const jt=j.code.slice(0,2).split('').map(t=>TYPES[t].name).join(' and '); const pt=topTypes.slice(0,2).map(t=>TYPES[t].name).join(' and ');
      not.push(o.r<0.5 ? `Your interests point a different way. This is mostly ${jt} work, and your strongest pulls are ${pt}.` : `Only a partial interest match. This is mostly ${jt} work, while your strongest pulls are ${pt}.`); }
    if(o.cf<0.72 && !watch.some(w=>w.startsWith('This job leans'))) not.push('Several of its working conditions sit away from what you picked, though none sharply.');
    if(o.tf<0.45) not.push('Your personality answers fit it less well than most jobs on the list.');
    if(!not.length && !watch.length) not.push('It fits reasonably on every count. Other jobs just matched more closely.');
  }
  return { why, watch: watch.slice(0,3), not };
}
function readiness(j, st){
  if(st.expSkipped || st.exp.q===null || st.exp.q===undefined) return null;
  const carry = j.sk.filter(s=>st.exp.skills.includes(s));
  let lvl = 2;
  if(st.exp.q>=j.q && carry.length>=1) lvl=0;
  else if(j.q-st.exp.q<=1 || carry.length>=2) lvl=1;
  return { lvl, carry: carry.map(s=>SKILLS.find(x=>x[0]===s)[1]) };
}
function directionOf(P){
  const top = ORDER.slice().sort((a,b)=>P.rel[b]-P.rel[a]);
  const key = ORDER.filter(t=>t===top[0]||t===top[1]).join('');
  if(P.bearing.strength<0.06) return { top, key:'ALL', n:'The All-Rounder', d:'Your answers pulled evenly in every direction. You could be content in many kinds of work, so the conditions you want from a day matter more than the field.' };
  return { top, key, ...DIRECTIONS[key] };
}
/* Plain-language reading of the compass angle: which two types on the dial it sits between. */
function bearingWords(P, D){
  const deg=P.bearing.deg, byDeg=ORDER.slice().sort((a,b)=>TYPES[a].deg-TYPES[b].deg);
  const lo=byDeg[Math.floor(deg/60)%6], hi=byDeg[(Math.floor(deg/60)+1)%6];
  const off=deg-TYPES[lo].deg, near = off<=30 ? lo : hi;
  const where = (off<=8 || off>=52) ? `points almost straight at ${TYPES[near].name}` : `points between ${TYPES[lo].name} and ${TYPES[hi].name}, closer to ${TYPES[near].name}`;
  const gap = Math.abs(((TYPES[D.top[0]].deg-TYPES[D.top[1]].deg)+540)%360-180);
  return gap<=60 ? `· your needle ${where}.`
    : `· your two strongest types sit on different sides of the compass, so they partly cancel out and the needle ${where}.`;
}
const levelWord = r => r>=0.85 ? 'Strong' : r>=0.55 ? 'Moderate' : r>=0.3 ? 'Some' : 'Low';
const leanLabel = s => s>=0.3 ? 'Clear lean' : s>=0.15 ? 'Moderate lean' : 'All-rounder';

/* ---------- rendering ---------- */
const app = () => document.getElementById('app');
function topbar(){
  return `<header class="mast"><div class="inner"><div class="brand">${compassMark()}Bearing</div>
    <div class="cta-row" style="gap:6px">${S.phase!=='intro' && S.phase!=='settings' ? `<button class="linkbtn" data-act="home">Save and exit</button>` : ''}
      ${S.phase!=='settings' ? `<button class="iconbtn" data-act="settings" aria-label="Settings"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2.2" fill="var(--brg-surface)"/><circle cx="15" cy="12" r="2.2" fill="var(--brg-surface)"/><circle cx="7" cy="18" r="2.2" fill="var(--brg-surface)"/></svg></button>` : ''}</div></div></header>`;
}
function compassMark(){ return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.5" fill="var(--brg-surface)" stroke="var(--brg-ink)" stroke-width="1.5"/><path d="M16 4 L19 16 L13 16 Z" fill="var(--brg-accent)"/><path d="M16 28 L19 16 L13 16 Z" fill="var(--brg-ink)"/></svg>`; }
const CONTOURS = `<div class="contours" aria-hidden="true"><svg viewBox="0 0 390 460" preserveAspectRatio="none"><g vector-effect="non-scaling-stroke">
  <path vector-effect="non-scaling-stroke" d="M-20 120 C 60 60, 140 150, 220 90 S 360 40, 420 100"/>
  <path vector-effect="non-scaling-stroke" d="M-20 150 C 70 95, 150 180, 230 125 S 360 80, 420 135"/>
  <path vector-effect="non-scaling-stroke" d="M-20 182 C 80 130, 160 210, 240 160 S 365 120, 420 172"/>
  <path vector-effect="non-scaling-stroke" d="M300 40 C 330 30, 370 50, 360 75 S 300 95, 290 70 S 285 45, 300 40 Z"/>
  <path vector-effect="non-scaling-stroke" d="M310 52 C 325 47, 345 56, 340 67 S 312 78, 306 66 Z"/>
  <path vector-effect="non-scaling-stroke" d="M-20 380 C 90 330, 170 420, 260 370 S 370 330, 420 360"/>
  <path vector-effect="non-scaling-stroke" d="M-20 410 C 100 365, 180 450, 270 400 S 370 365, 420 392"/></g></svg></div>`;

let lastView='';
function render(){
  // Only jump to the top when moving to a different screen; tapping a chip on the same screen keeps your place.
  const view = S.phase+':'+S.idx, y = window.scrollY;
  let html = (S.phase==='intro' ? CONTOURS : '') + topbar() + incomingBanner();
  if(S.phase==='intro') html += intro();
  else if(S.phase==='settings') html += settings();
  else if(S.phase==='words') html += words();
  else if(S.phase==='results') html += results();
  else html += question();
  app().innerHTML = html;
  const pl=document.getElementById('paylabel'); if(pl) pl.textContent=payLabel();
  window.scrollTo(0, view===lastView ? y : 0);
  if(S.phase==='results' && view!==lastView) animateCompass();
  lastView = view;
}

// Results reveal: the profile shape grows out from the centre while the needle spins in,
// overshoots its bearing slightly and settles. Skipped if the phone asks for reduced motion.
function animateCompass(){
  const needle=document.querySelector('.compass .needle'), shape=document.querySelector('.compass .shape');
  if(!needle || !shape || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const deg=+needle.dataset.deg, t0=performance.now(), SPIN=1700, GROW=900;
  const frame=now=>{
    const t=now-t0, s=Math.min(1,t/SPIN), g=Math.min(1,t/GROW);
    // Damped swing: starts a full turn back, swings ~8° past the bearing, then settles.
    const off = s<1 ? -360*Math.exp(-6*s*1.5)*Math.cos(4.2*s*1.5) : 0;
    needle.setAttribute('transform',`rotate(${(deg+off).toFixed(2)})`);
    const k=1-Math.pow(1-g,3); // ease-out
    shape.setAttribute('transform',`scale(${k.toFixed(3)})`);
    if(s<1) requestAnimationFrame(frame);
  };
  shape.setAttribute('transform','scale(0)');
  requestAnimationFrame(frame);
}

function feedbackCard(){
  if(!FEEDBACK_ON || SET.noFeedback) return '';
  const fb=S.fb||{};
  if(fb.sentId) return `<section class="section"><div class="panel"><span class="eyebrow">Feedback</span><h3 style="font-size:24px;text-transform:uppercase">Thanks, that really helps</h3>
    <p style="margin:0;font-size:15px">Your submission ID is <b style="font-family:var(--mono)">${esc(fb.sentId)}</b>. It\u2019s saved in Settings, so you can ask for it to be deleted later.</p></div></section>`;
  const top = LAST.filter(o=>o.tier==='S'||o.tier==='A').map(o=>o.j.t);
  const chips = (key, opts, multi) => opts.map(o=>{ const [v,l]=Array.isArray(o)?o:[o,o]; const on = multi ? (fb[key]||[]).includes(v) : fb[key]===v;
    return `<button class="chipbtn sm" data-act="fb" data-id="${key}" data-v="${esc(v)}" data-multi="${multi?1:0}" aria-pressed="${on}">${esc(l)}</button>`; }).join('');
  return `<section class="section" id="feedback"><div class="panel fbcard"><span class="eyebrow">Feedback \u00b7 optional</span><h3 style="font-size:26px;text-transform:uppercase">Did this hit the mark?</h3>
    <div class="fbq"><div>Did the direction feel like you?</div><div class="chips">${chips('fit',FB_FIT)}</div></div>
    <div class="fbq"><div>Were the jobs useful?</div><div class="chips">${chips('useful',FB_USE)}</div></div>
    ${top.length?`<div class="fbq"><div>Which would you actually look into? <span class="muted">Tick any.</span></div><div class="chips">${chips('explore',top,true)}</div></div>`:''}
    <div class="fbq"><label for="fb-comment">Anything we missed, or got wrong? <span class="muted">Optional. Please leave out names and personal details.</span></label><textarea id="fb-comment" maxlength="500">${esc(fb.comment||'')}</textarea></div>
    <details class="saymore"><summary>Add your age range and state (optional, helps a lot)</summary>
      <div class="fbq"><div>Age range</div><div class="chips">${chips('age',FB_AGE)}</div></div>
      <div class="fbq"><div>State</div><div class="chips">${chips('state',FB_STATE)}</div></div></details>
    <label class="check"><input type="checkbox" id="fb-include" ${fb.include?'checked':''}> <span>Include my anonymous answers, so the questions and scoring can be improved</span></label>
    <p class="muted" style="margin:0;font-size:14px">Never sent: your name, anything you typed in your own words, friends\u2019 names or comments, or past job titles.</p>
    <details class="saymore" id="fb-preview-wrap"><summary>See exactly what\u2019s sent</summary><pre class="fbpre" id="fb-preview">${esc(JSON.stringify(buildFeedback(),null,1))}</pre></details>
    <div class="cta-row"><button class="btn" data-act="fb-send" ${fb.fit?'':'disabled'}>Send feedback</button><button class="linkbtn" data-act="fb-never">Don\u2019t ask me again</button></div></div></section>`;
}
function words(){
  const answered = STORIES.filter(q=>S.stories[q.id]);
  return `<main class="wrap"><section class="interlude"><span class="num">AI COACH</span><h2>In your own words</h2>
    <p class="hint">A sentence or two on any of these makes the AI coach\u2019s read much sharper. Skip any you like. This doesn\u2019t change your matches.</p></section>
    ${answered.map(q=>`<div class="scale-item"><div class="muted" style="font-size:15px">${esc(q.q)}</div><div><b>${esc(q.opts[S.stories[q.id]])}</b></div>
      <textarea id="st-${q.id}" placeholder="Who or what was it, and why did it stick with you?">${esc(S.storyText[q.id]||'')}</textarea></div>`).join('')}
    <div class="nav"><span></span><button class="btn" data-act="words-done">Done</button></div></main>`;
}
const ICON_SYS = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><line x1="10.5" y1="18" x2="13.5" y2="18"/></svg>`;
const ICON_SUN = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>`;
const ICON_MOON = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>`;
function settings(){
  const t = SET.theme||'system';
  const sw = (act, on, label) => `<button class="toggle-sw" data-act="${act}" aria-pressed="${on}" aria-label="${label}"><span></span></button>`;
  return `<main class="wrap settings"><section class="set-head"><div class="kicker">Settings</div><h1>Your app, your data</h1></section>
    <section class="setlist" aria-label="Settings">
      <div class="set-row set-row--stack"><div><div class="set-name">Appearance</div><div class="set-sub">${t==='system'?`Following your phone, currently ${isDark()?'dark':'light'}.`:t==='light'?'Always light.':'Always dark.'}</div></div>
        <div class="seg" role="radiogroup" aria-label="Appearance">
          ${[['system','Match phone',ICON_SYS],['light','Light',ICON_SUN],['dark','Dark',ICON_MOON]].map(([v,l,ic])=>`<button role="radio" data-act="set-theme" data-v="${v}" aria-checked="${t===v}">${ic}<span>${l}</span></button>`).join('')}
        </div></div>
      <div class="set-row"><div><div class="set-name">AI coach</div><div class="set-sub">Adds a button to your results that packages them into a prompt for any AI chat. Nothing is sent from this app; you choose where to paste it.</div></div>${sw('set-ai',!!SET.ai,'AI coach')}</div>
      ${FEEDBACK_ON ? `<div class="set-row"><div><div class="set-name">Ask me for feedback</div><div class="set-sub">Shows a short “Did this hit the mark?” card on your results. Nothing is sent unless you press Send.${(SET.submissions||[]).length ? ` Feedback you’ve sent: ${SET.submissions.map(x=>`<b class="mono">${esc(x)}</b>`).join(', ')}. To have one deleted, quote its ID using the contact details in the privacy policy.`:''}</div></div>${sw('set-fb',!SET.noFeedback,'Ask me for feedback')}</div>` : ''}
      ${deferredInstall ? `<div class="set-row"><div><div class="set-name">Install the app</div><div class="set-sub">Adds Bearing to your home screen. It works offline.</div></div><button class="btn ghost sm" data-act="install">Install</button></div>` : ''}
      <div class="set-row set-row--stack"><div><div class="set-name">Where your answers live</div><div class="set-sub">Only on this device. Your answers leave it only when you share a link or code yourself${FEEDBACK_ON?', or send feedback':''}. There are no accounts and no tracking.</div></div>
        ${S._confirmDelete ? `<div class="confirm"><p><b>Delete everything on this device?</b> Your answers, results and friends’ views will be gone. This can’t be undone.${(SET.submissions||[]).length?' Feedback you’ve already sent isn’t affected; note your IDs first if you want it deleted too.':''}</p>
          <div class="cta-row"><button class="btn" data-act="delete-all">Yes, delete it all</button><button class="btn ghost" data-act="delete-cancel">Keep my data</button></div></div>`
          : `<button class="btn ghost" data-act="delete-ask">Delete all my data</button>`}</div>
    </section>
    ${HOSTED ? `<p class="set-foot"><a href="privacy.html">Privacy policy</a></p>` : ''}
    <div class="nav"><button class="back" data-act="settings-back">${BACK_ICON}Back</button></div></main>`;
}
const BACK_ICON = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/></svg>`;
const SHARE_ICON = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>`;
const ARROW = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;
const LEGEND = [
  ['01','Stories','What you’re drawn to'], ['02','Trade-offs','Fifteen quick choices'], ['03','How you run','Twenty statements'],
  ['04','Conditions','Your kind of day'], ['05','Experience','Asked last',true], ['06','Next steps','Study and progress',true]
];
/* Where the person is up to, for the home screen list. Parts 1-5 only (the questionnaire). */
function partStatus(){
  const out={};
  const resuming = !S.done && (S.resumePhase||'quick')==='quick';
  const list = quickScreens();
  const reach = Math.max(S.reach||0, S.idx||0);
  const cur = resuming ? (list[Math.min(S.idx,list.length-1)]||{}).part : 0;
  for(let p=1;p<=5;p++){
    const at = list.map((x,i)=>x.part===p?i:-1).filter(i=>i>=0);
    if(S.done){ out[p] = (p===5 && S.expSkipped) ? {state:'skipped'} : {state:'done'}; continue; }
    if(!resuming){ continue; }
    if(p===cur){
      const qs = at.filter(i=>list[i].type!=='interlude');
      const n = Math.max(0, Math.min(qs.length, S.idx-at[0]-1));
      out[p] = {state:'current', note: n===0 ? 'Not started yet' : `${n} of ${qs.length} done`};
    } else if(reach>at[at.length-1]){ out[p]={state:'done'}; }
  }
  return out;
}
/* In a browser, a friend's reply or results link should end up in the app, not in the browser's own storage. */
function incomingBanner(){
  if(!INCOMING || ANDROID) return '';
  const what = INCOMING.k==='friend' ? 'Your friend’s answers are ready.' : 'These results are ready.';
  const href = 'bearing://open?'+INCOMING.k+'='+encodeURIComponent(INCOMING.v);
  return `<section class="card-dashed" style="margin:12px 16px"><div class="kicker">Open in the app</div><h2>${what}</h2>
    <p>Tap the button to add them to your Bearing app. If nothing happens, open this page in your phone’s browser (the ⋯ menu) and try again.</p>
    <a class="btn" href="${href}">Open in the Bearing app</a>
    ${APK_URL ? `<p style="margin-top:12px"><a href="${esc(APK_URL)}">Don’t have the app? Download it</a></p>` : ''}</section>`;
}
function intro(){
  const inProgress = (S.phase==='intro') && (Object.keys(S.stories).length || Object.keys(S.pairs).length);
  const hasResults = S.done;
  const PS = (inProgress||hasResults) ? partStatus() : {};
  const mins = Math.floor(secsOf(quickScreens())/60); // rounded down: the last two parts are optional
  const primary = hasResults ? ['show-results','See my results'] : inProgress ? ['resume', (()=>{ const c=Object.keys(PS).find(k=>PS[k].state==='current'); return c ? `Continue with ${LEGEND[c-1][1]}` : 'Continue where I left off'; })()] : ['start','Find my bearing'];
  return `<main class="wrap home"><section class="hero">
    <h1>Where are you <em>headed?</em></h1>
    <p class="lede">Ever had the thought, “I don’t know what I want to do when I grow up”? Or are you after a career direction change, but don’t know where to go? Let’s try to help you with that.</p>
    <section class="legend" aria-label="What’s ahead">
      <div class="legend__head kicker"><span>What’s ahead</span><span>6 parts · 2 optional</span></div>
      ${LEGEND.map(([n,name,sub,opt],i)=>{ const st=PS[i+1]||{}; const tag = st.state==='current' ? 'PAUSED HERE' : st.state==='done' ? 'DONE' : st.state==='skipped' ? 'SKIPPED' : (opt?'OPTIONAL':''); return `<div class="legend__row${opt?' legend__row--opt':''}${st.state?' legend__row--'+st.state:''}"><span class="legend__num">${st.state==='done'?'&#10003;':n}</span><div><div class="legend__name">${name}</div><div class="legend__sub">${st.state==='current'?st.note:sub}</div></div>${tag?`<span class="legend__tag">${tag}</span>`:''}</div>`; }).join('')}
    </section>
    <div class="start">
      <button class="btn" data-act="${primary[0]}">${primary[1]} ${ARROW}</button>
      ${hasResults||inProgress ? `<button class="linkbtn" data-act="start">Start again</button>` : `<div class="time">About ${mins} minutes</div>`}
    </div>
    <p class="privacy">Everything stays on this device. Nothing is sent anywhere, and no AI is involved unless you opt in. <button class="linkbtn" data-act="settings">Settings</button></p>
    ${S.pendingProfile ? `<div class="card-dashed pending"><div class="kicker">Shared with you</div><h2>You opened someone’s results</h2><p>Opening them replaces the results saved on this device.</p><button class="btn" data-act="open-pending">Open their results</button><button class="btn ghost" data-act="drop-pending" style="margin-top:10px">Not now</button></div>` : ''}
  </section>
  <details class="more-options"><summary>Other options: describe a friend, or reopen results with a code</summary>
  <section class="cards">
    <div class="card-dashed"><div class="kicker">Second opinion</div><h2>Answering for a friend?</h2>
      <p>If someone asked you to describe them, start here. It takes about ${minsOf(friendScreens())} minutes, and you’ll get ${LINKS?'a link':'a code'} to send back to them.</p>
      <button class="btn ghost" data-act="friend-start">Describe a friend</button></div>
    <div class="card-dashed"><div class="kicker">Coming back?</div><h2>Have a code?</h2>
      <label for="code-in">Paste a results code to reopen results, or a friend’s code to add their view.</label>
      <textarea id="code-in" class="codebox" rows="3" placeholder="BRG-P1… or BRG-F1…"></textarea>
      <button class="btn ghost" data-act="load-code">Load code</button></div>
  </section></details></main>`;
}

function progressBar(list){
  const sc = list[S.idx]; const total = list.length; const pct = Math.round(100*S.idx/Math.max(1,total-1));
  let label='', left='';
  if(S.phase==='friend'){ label=`Describing ${esc(nm())}`; left=`${Math.max(0,total-1-S.idx)} to go`; }
  else { const names=PART_NAMES[S.phase]; label=`Part ${sc.part} of ${names.length} · ${names[sc.part-1]}`;
    const remaining = secsOf(list.slice(S.idx));
    left = remaining>75 ? `about ${Math.round(remaining/60)} min left` : 'almost done'; }
  return `<div class="progress"><div class="row"><span class="eyebrow">${label}</span><span class="eyebrow">${left}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
}

function question(){
  const list = screens(); if(S.idx>=list.length) S.idx=list.length-1;
  const sc = list[S.idx]; let body='';
  const back = S.idx>0 ? `<button class="back" data-act="back">${BACK_ICON}Back</button>` : `<span></span>`;
  switch(sc.type){
    case 'interlude': {
      body = `<section class="interlude"><span class="num">${sc.refine?'OPTIONAL':'PART '+String(sc.part).padStart(2,'0')}</span><h2>${sc.title}</h2><p class="hint" style="font-size:18px">${sc.text}</p>
        ${S.phase==='quick'&&sc.part===1 ? `<label class="eyebrow" for="nm" style="margin-top:8px">Your first name (optional)</label><input id="nm" type="text" value="${esc(S.name)}" autocomplete="given-name">` : ''}</section>
        <div class="nav">${back}<button class="btn" data-act="next">${S.idx===0?'Begin':'Continue'}</button></div>`; break; }
    case 'story': {
      const it=sc.item; const opts=shuffle(ORDER,it.id);
      const s2=(S.stories2||{})[it.id];
      body = `<section class="screen"><div class="q">${esc(it.q)}</div><p class="hint">Pick the closest. If a second one is also true, tap it too.</p><div class="opts">${opts.map(t=>{ const main=S.stories[it.id]===t, also=s2===t;
          return `<button class="opt ${also?'also':''}" data-act="story" data-id="${it.id}" data-v="${t}" aria-pressed="${main||also}">${esc(it.opts[t])}${main&&s2?'<span class="tag">Closest</span>':''}${also?'<span class="tag">Also</span>':''}</button>`; }).join('')}</div>
        ${it.none ? `<div class="pair-alt"><button class="chipbtn" data-act="story-none" data-id="${it.id}" aria-pressed="${S.stories[it.id]==='none'}">${esc(it.none)}</button></div>` : ''}
        ${SET.ai ? `<details class="saymore" ${S.storyText[it.id]?'open':''}><summary>Add it in your own words (optional, used by the AI coach)</summary><textarea id="st-${it.id}" placeholder="Who, what, why it stuck with you…">${esc(S.storyText[it.id]||'')}</textarea></details>` : ''}</section>
        <div class="nav">${back}<button class="btn" data-act="next" ${S.stories[it.id]?'':'disabled'}>Next</button></div>`; break; }
    case 'pair': case 'fpair': {
      const it=sc.item; const store = sc.type==='fpair'? F.pairs : (sc.set==='refine'? S.refine.pairs : S.pairs);
      const sides = flip(it.id)? [['b',it.b],['a',it.a]] : [['a',it.a],['b',it.b]]; const cur=store[it.id];
      const q = sc.type==='fpair' ? `Which would <span class="friendq">${esc(nm())}</span> come home happier from?` : 'Which would you rather spend a day doing?';
      const weighted = sc.set==='refine', fr = sc.type==='fpair';
      const [L,R] = sides; const lean = cur && cur.toLowerCase();
      // Left-to-right scale under the two cards. Values are the same ones scoring already uses (A/a/both/b/B).
      const steps = fr ? [[L[0],'\u2190','This one'],[R[0],'\u2192','This one']]
        : weighted ? [[L[0].toUpperCase(),'\u2190\u2190','Much rather'],[L[0],'\u2190','Rather'],['both','=','Equal'],[R[0],'\u2192','Rather'],[R[0].toUpperCase(),'\u2192\u2192','Much rather']]
        : [[L[0],'\u2190','Rather this'],['both','=','Equal'],[R[0],'\u2192','Rather this']];
      body = `<section class="screen"><div class="q">${q}</div><p class="hint">${fr ? `Tap the one ${esc(nm())} would enjoy more. Skip it if you can\u2019t tell.` : 'Tap a card, or use the row below to show how strongly you lean.'}</p>
        <div class="pair">${[L,R].map(([k,v],n)=>`${n?'<span class="pair-or" aria-hidden="true">or</span>':''}<button class="opt" data-act="pick" data-id="${it.id}" data-v="${k}" aria-pressed="${lean===k}">${esc(v[1])}</button>`).join('')}</div>
        ${fr ? '' : `<div class="pairscale" role="group" aria-label="How strongly you lean" style="--n:${steps.length}">${steps.map(([v,ic,l])=>`<button data-act="pick" data-id="${it.id}" data-v="${v}" aria-pressed="${cur===v}"><span class="ic" aria-hidden="true">${ic}</span><span>${l}</span></button>`).join('')}</div>`}
        <div class="pair-alt">${fr ? `<button class="chipbtn" data-act="pick" data-id="${it.id}" data-v="skip" aria-pressed="${cur==='skip'}">Skip</button>`
          : `<button class="chipbtn" data-act="pick" data-id="${it.id}" data-v="none" aria-pressed="${cur==='none'}">Neither appeals</button>`}</div></section>
        <div class="nav">${back}<button class="btn ghost" data-act="next" ${cur?'':'disabled'}>Next</button></div>`; break; }
    case 'ipip': case 'fipip': {
      const store = sc.type==='fipip'? F.ipip : S.ipip; const all = sc.items.every(i=>store[i.id]!==undefined);
      body = `<section class="screen"><div class="q">${sc.type==='fipip' ? `How well does each describe <span class="friendq">${esc(nm())}</span>?` : 'How much does each sound like you?'}</div><div>
        ${sc.items.map(i=>`<div class="scale-item"><div>${sc.type==='fipip' ? esc(nm())+' '+esc(i.f) : esc(i.t)}</div><div class="scale" role="group" aria-label="${esc(i.t)}">${[1,2,3,4,5].map(v=>`<button data-act="rate" data-id="${i.id}" data-v="${v}" aria-pressed="${store[i.id]===v}" aria-label="${v}">${v}</button>`).join('')}</div>
          <div class="anchors"><span>Very unlike</span>${sc.type==='fipip'?`<button class="chipbtn sm" data-act="rate" data-id="${i.id}" data-v="0" aria-pressed="${store[i.id]===0}">Skip</button>`:''}<span>Very like</span></div></div>`).join('')}</div></section>
        <div class="nav">${back}<button class="btn" data-act="next" ${all?'':'disabled'}>Next</button></div>`; break; }
    case 'cond': case 'fcond': {
      const items = sc.type==='fcond' ? COND.filter(c=>FRIEND_COND.includes(c.k)) : sc.items; const store = sc.type==='fcond'? F.cond : S.cond;
      const all = items.every(c=>store[c.k]!==undefined); const fr = sc.type==='fcond';
      body = `<section class="screen"><div class="q">${sc.type==='fcond' ? `Where does <span class="friendq">${esc(nm())}</span> seem happiest?` : 'Where would you sit between these?'}</div><div>
        ${items.map(c=>`<div class="scale-item"><div class="anchors" style="font-size:15px;color:var(--ink)"><span>${fr?c.flo:c.lo}</span><span>${fr?c.fhi:c.hi}</span></div><div class="scale" role="group" aria-label="${esc(c.lo)} to ${esc(c.hi)}">${[-2,-1,0,1,2].map(v=>`<button data-act="cond" data-id="${c.k}" data-v="${v}" aria-pressed="${store[c.k]===v}" aria-label="${v}">${v===0?'•':(v<0?'←':'→').repeat(Math.abs(v))}</button>`).join('')}</div>${fr?`<div class="anchors" style="justify-content:center"><button class="chipbtn sm" data-act="cond" data-id="${c.k}" data-v="skip" aria-pressed="${store[c.k]==='skip'}">Skip</button></div>`:''}</div>`).join('')}</div></section>
        <div class="nav">${back}<button class="btn" data-act="next" ${all?'':'disabled'}>Next</button></div>`; break; }
    case 'exp': {
      body = `<section class="interlude" style="padding-top:20px"><span class="num">PART 05 · OPTIONAL</span><h2>Your experience</h2>
        <p class="hint" style="font-size:17px">Your direction and matches are already worked out. This adds a note on each job saying how quickly you could step into it and which skills carry over. Next you can add past roles.</p></section>
        <div class="panel"><div class="eyebrow">Things you’ve done a fair bit of, at work or outside it</div><div class="chips">${SKILLS.map(([k,l])=>`<button class="chipbtn" data-act="skill" data-v="${k}" aria-pressed="${S.exp.skills.includes(k)}">${l}</button>`).join('')}</div>
          <div class="eyebrow" style="margin-top:6px">Highest qualification</div><div class="chips">${QUALS.map((q,i)=>`<button class="chipbtn" data-act="qual" data-v="${i}" aria-pressed="${S.exp.q===i}">${q}</button>`).join('')}</div></div>
        <div class="nav">${back}<div class="cta-row"><button class="btn ghost" data-act="skip-exp">Skip</button><button class="btn" data-act="next" ${S.exp.q===null?'disabled':''}>Next</button></div></div>`; break; }
    case 'roles': {
      const roles = S.roles.length ? S.roles : [];
      body = `<section class="interlude" style="padding-top:20px"><span class="num">PART 05 \u00b7 OPTIONAL</span><h2>Past roles</h2>
        <p class="hint" style="font-size:17px">Up to three jobs or big roles you\u2019ve had, paid or not. These won\u2019t change your ranking unless you choose that on the results page.</p></section>
        ${roles.map((r,i)=>`<div class="panel role"><div class="cta-row" style="justify-content:space-between"><label class="eyebrow" for="role-${i}">Role ${i+1}</label><button class="linkbtn" data-act="role-del" data-v="${i}">Remove</button></div>
          <input id="role-${i}" type="text" value="${esc(r.t)}" placeholder="e.g. Warehouse supervisor, school canteen volunteer">
          <div class="eyebrow">What did it mostly involve? Pick up to two.</div><div class="chips">${ORDER.map(t=>`<button class="chipbtn" data-act="role-type" data-id="${i}" data-v="${t}" aria-pressed="${r.types.includes(t)}">${DEEP_TAGS[t]}</button>`).join('')}</div>
          <div class="grid2" style="gap:12px"><div><div class="eyebrow">Were you good at it?</div><div class="chips" style="margin-top:6px">${GOOD.map((g,k)=>`<button class="chipbtn" data-act="role-good" data-id="${i}" data-v="${k}" aria-pressed="${r.good===k}">${g}</button>`).join('')}</div></div>
            <div><div class="eyebrow">Did you enjoy it?</div><div class="chips" style="margin-top:6px">${ENJOY.map((g,k)=>`<button class="chipbtn" data-act="role-enjoy" data-id="${i}" data-v="${k}" aria-pressed="${r.enjoy===k}">${g}</button>`).join('')}</div></div></div></div>`).join('')}
        ${roles.length<3 ? `<button class="btn ghost" data-act="role-add" style="width:fit-content">+ Add a role</button>` : ''}
        <div class="nav">${back}<button class="btn" data-act="finish">See my results</button></div>`; break; }
    case 'deep': {
      const it=sc.item; const d=S.refine.deep[it.id]||{text:'',tags:[]};
      body = `<section class="screen"><div class="q">${esc(it.q)}</div>${SET.ai ? `<textarea id="dp-${it.id}" placeholder="Optional, for the AI coach. A few sentences is plenty.">${esc(d.text)}</textarea>` : ''}
        <div class="eyebrow">${esc(it.tagq)}</div><div class="chips">${shuffle(ORDER,it.id).map(t=>`<button class="chipbtn" data-act="tag" data-id="${it.id}" data-v="${t}" aria-pressed="${d.tags.includes(t)}">${DEEP_TAGS[t]}</button>`).join('')}</div></section>
        <div class="nav">${back}<button class="btn" data-act="next" ${d.tags.length?'':'disabled'}>Next</button></div>`; break; }
    case 'drain': {
      const cur=S.refine.drain;
      body = `<section class="screen"><div class="q">Which two would wear you out fastest, even if you were good at them?</div><div class="opts">${shuffle(ORDER,'drain').map(t=>`<button class="opt" data-act="drain" data-v="${t}" aria-pressed="${cur.includes(t)}">${DRAIN[t]}</button>`).join('')}</div></section>
        <div class="nav">${back}<button class="btn" data-act="finish-refine" ${cur.length===2?'':'disabled'}>Update my results</button></div>`; break; }
    case 'fname': {
      body = `<section class="interlude"><span class="num">DESCRIBING A FRIEND</span><h2>Who are you describing?</h2>
        <p class="hint">Answer the way they actually are, not how they describe themselves. That difference is the useful part.</p>
        <label class="eyebrow" for="ffor">Their first name${F.lock&&F.for?' (from the invite)':''}</label><input id="ffor" type="text" value="${esc(F.for)}" ${F.lock&&F.for?'readonly aria-readonly="true"':''}>
        ${F.reply ? `<label class="eyebrow" for="fto">Your answers will be sent to</label><input id="fto" type="email" value="${esc(F.reply)}" readonly aria-readonly="true">` : ''}
        <label class="eyebrow" for="fby">Your first name (so they know who this came from)</label><input id="fby" type="text" value="${esc(F.by)}"></section>
        <div class="nav"><button class="back" data-act="home">${BACK_ICON}Cancel</button><button class="btn" data-act="next">Begin</button></div>`; break; }
    case 'ftext': {
      body = `<section class="screen"><div class="q">What’s something <span class="friendq">${esc(nm())}</span> is better at than they realise?</div><textarea id="ftx" placeholder="Optional, but often the most useful answer.">${esc(F.text)}</textarea></section>
        <div class="nav">${back}<button class="btn" data-act="next">Finish</button></div>`; break; }
    case 'fdone': {
      const code = encode('BRG-F1.', friendOut());
      const backLink = baseUrl()+'?friend='+code;
      const mailto = F.reply ? `mailto:${F.reply}?subject=${encodeURIComponent((F.by||'A friend')+'\u2019s answers about you on Bearing')}&body=${encodeURIComponent('Here\u2019s how I see you. Open this link on your phone to add my answers to your Bearing results:\n\n'+backLink)}` : '';
      const getApp = (!ANDROID && APK_URL) ? `<div class="panel" style="margin-top:20px"><h3>Want your own results?</h3><p>Bearing is a free ten-minute questionnaire that suggests a career direction. Get the Android app.</p><a class="btn ghost" href="${esc(APK_URL)}">Download the Android app</a></div>` : '';
      body = LINKS ? `<section class="interlude"><span class="num">DONE</span><h2>Send your answers to ${esc(nm())}</h2>
        <p class="hint">When they open the link, your view is added to their results. It only contains your answers about them.</p>
        <div class="cta-row">${mailto ? `<a class="btn" href="${mailto}">Send my answers to ${esc(nm())}</a><button class="btn ghost" data-act="share-friend-back">Share another way</button>` : `<button class="btn" data-act="share-friend-back">Send to ${esc(nm())}</button>`}<button class="btn ghost" data-act="home">Back to start</button></div>
        <details class="saymore"><summary>Or copy a code instead</summary><textarea class="codebox" id="fcode" readonly>${code}</textarea><button class="btn ghost" data-act="copy" data-src="fcode">Copy code</button></details>${getApp}</section>`
      : `<section class="interlude"><span class="num">DONE</span><h2>Send this code to ${esc(nm())}</h2>
        <p class="hint">They paste it into the “Have a code?” box, or into the friend panel on their results page. It only contains your answers about them.</p>
        <textarea class="codebox" id="fcode" readonly>${code}</textarea>
        <div class="cta-row"><button class="btn" data-act="copy" data-src="fcode">Copy code</button><button class="btn ghost" data-act="home">Back to start</button></div></section>`; break; }
  }
  return `<main class="wrap">${sc.type==='fdone'?'':progressBar(list)}${body}</main>`;
}

/* ---------- results ---------- */
// Corner points of a profile shape on the compass (shared by the on-screen SVG and the share snapshot).
const radarXY = (P,t,R) => { const max=Math.max(...ORDER.map(k=>P.rel[k])); return ORDER.map(k=>{ const r=24+(R-24)*(t[k]/max); const a=TYPES[k].deg*Math.PI/180; return [r*Math.sin(a), -r*Math.cos(a)]; }); };
const needleLen = (P,R) => Math.min(R, 30+R*Math.min(1,P.bearing.strength/0.45));
function compassSVG(P){
  const R=118, pts=t=>radarXY(P,t,R).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  let ticks=''; for(let d=0; d<360; d+=10){ const a=d*Math.PI/180, l=d%30===0?8:4; ticks+=`<line x1="${(R*Math.sin(a)).toFixed(1)}" y1="${(-R*Math.cos(a)).toFixed(1)}" x2="${((R+l)*Math.sin(a)).toFixed(1)}" y2="${(-(R+l)*Math.cos(a)).toFixed(1)}" stroke="var(--muted)" stroke-width="1"/>`; }
  const labels = ORDER.map(k=>{ const a=TYPES[k].deg*Math.PI/180, r=R+26; const x=r*Math.sin(a), y=-r*Math.cos(a);
    return `<text class="tl" x="${x.toFixed(1)}" y="${(y+2).toFixed(1)}" text-anchor="middle">${TYPES[k].name}</text><text x="${x.toFixed(1)}" y="${(y+15).toFixed(1)}" text-anchor="middle">${String(TYPES[k].deg).padStart(3,'0')}°</text>`; }).join('');
  const b=P.bearing, nl=needleLen(P,R);
  const friendPoly = P.friends.filter(f=>f.rel).map(f=>`<polygon points="${pts(f.rel)}" fill="none" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/>`).join('');
  return `<svg class="compass" viewBox="-200 -168 400 343" role="img" aria-label="Compass showing your interest profile, bearing ${b.deg} degrees">
    ${[40,80,R].map(r=>`<circle r="${r}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('')}
    ${ORDER.map(k=>{ const a=TYPES[k].deg*Math.PI/180; return `<line x1="0" y1="0" x2="${(R*Math.sin(a)).toFixed(1)}" y2="${(-R*Math.cos(a)).toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`; }).join('')}
    ${ticks}
    <g class="shape"><polygon points="${pts(P.self)}" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2"/>
    ${friendPoly}</g>
    <g class="needle" data-deg="${b.deg}" transform="rotate(${b.deg})"><line x1="0" y1="0" x2="0" y2="${(-nl).toFixed(1)}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="${(-nl).toFixed(1)}" r="5" fill="var(--ink)"/></g>
    <circle r="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>
    ${labels}</svg>`;
}

/* ---------- share snapshot: a picture of the results header, in the current light/dark theme ---------- */
const snapTitle = () => { const n=(S.name||'').trim(); return n ? `${n}’${/s$/i.test(n)?'':'s'} Bearing` : 'My Bearing'; };
async function drawSnapshot(){
  const P=profile(S), D=directionOf(P), css=getComputedStyle(document.documentElement), v=k=>css.getPropertyValue('--brg-'+k).trim();
  const C={ bg:v('bg'), surface:v('surface'), ink:v('ink'), muted:v('ink-3'), line:v('contour'), soft:v('line-soft'), accent:v('accent') };
  const SERIF="'Instrument Serif',Georgia,serif", SANS="'Public Sans',system-ui,sans-serif", MONO="'IBM Plex Mono',monospace";
  try{ await Promise.all([`64px ${SERIF}`,`30px ${SANS}`,`28px ${MONO}`].map(f=>document.fonts.load(f))); }catch(e){}
  // Drawn on a tall canvas, then cropped to wherever the content ends.
  const W=1080, H=2400, M=80, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  g.fillStyle=C.bg; g.fillRect(0,0,W,H);
  // Faint contour lines in the top corner, as on the home screen.
  g.strokeStyle=C.soft; g.lineWidth=2; for(let r=80;r<420;r+=42){ g.beginPath(); g.ellipse(W+40,-60,r*1.5,r,0,0,Math.PI*2); g.stroke(); }
  const text=(s,x,y,font,color,align='left',track=0)=>{ g.font=font; g.fillStyle=color; g.textAlign=align; if('letterSpacing' in g) g.letterSpacing=track+'px'; g.fillText(s,x,y); if('letterSpacing' in g) g.letterSpacing='0px'; };
  // Header
  text('BEARING', M, 110, `500 26px ${MONO}`, C.accent, 'left', 6);
  text(snapTitle(), M, 200, `76px ${SERIF}`, C.ink);
  // Compass, drawn with the same geometry as the on-screen SVG, scaled up.
  const R=118, k=2.1; g.save(); g.translate(W/2, 600); g.scale(k,k);
  g.strokeStyle=C.line; g.lineWidth=1; [40,80,R].forEach(r=>{ g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.stroke(); });
  ORDER.forEach(t=>{ const a=TYPES[t].deg*Math.PI/180; g.beginPath(); g.moveTo(0,0); g.lineTo(R*Math.sin(a),-R*Math.cos(a)); g.stroke(); });
  g.strokeStyle=C.muted; for(let d=0;d<360;d+=10){ const a=d*Math.PI/180, l=d%30===0?8:4; g.beginPath(); g.moveTo(R*Math.sin(a),-R*Math.cos(a)); g.lineTo((R+l)*Math.sin(a),-(R+l)*Math.cos(a)); g.stroke(); }
  const poly=(pts)=>{ g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); };
  poly(radarXY(P,P.self,R)); g.globalAlpha=.18; g.fillStyle=C.accent; g.fill(); g.globalAlpha=1; g.strokeStyle=C.accent; g.lineWidth=2; g.stroke();
  P.friends.filter(f=>f.rel).forEach(f=>{ poly(radarXY(P,f.rel,R)); g.setLineDash([5,4]); g.strokeStyle=C.muted; g.stroke(); g.setLineDash([]); });
  const a=P.bearing.deg*Math.PI/180, nl=needleLen(P,R), nx=nl*Math.sin(a), ny=-nl*Math.cos(a);
  g.strokeStyle=C.ink; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(nx,ny); g.stroke();
  g.fillStyle=C.ink; g.beginPath(); g.arc(nx,ny,5,0,Math.PI*2); g.fill();
  g.fillStyle=C.bg; g.lineWidth=2; g.beginPath(); g.arc(0,0,5,0,Math.PI*2); g.fill(); g.stroke();
  ORDER.forEach(t=>{ const b=TYPES[t].deg*Math.PI/180, r=R+26, x=r*Math.sin(b), y=-r*Math.cos(b);
    text(TYPES[t].name.toUpperCase(), x, y+2, `15px ${SERIF}`, C.ink, 'center', .5);
    text(String(TYPES[t].deg).padStart(3,'0')+'°', x, y+15, `10px ${MONO}`, C.muted, 'center'); });
  g.restore();
  // Bearing, direction and lean
  let y=1020;
  text('YOUR BEARING', M, y, `24px ${MONO}`, C.muted, 'left', 5);
  text(D.key==='ALL' ? '—' : String(P.bearing.deg).padStart(3,'0')+'°', M, y+120, `500 120px ${MONO}`, C.accent);
  text(D.n, M, y+210, `80px ${SERIF}`, C.ink);
  text(`${leanLabel(P.bearing.strength)} · ${TYPES[D.top[0]].name} + ${TYPES[D.top[1]].name}`, M, y+270, `28px ${MONO}`, C.muted);
  // Description, wrapped
  g.font=`32px ${SANS}`; const words=D.d.split(' '); let line='', ly=y+340;
  for(const w of words){ const t=line?line+' '+w:w; if(g.measureText(t).width>W-2*M && line){ text(line,M,ly,`32px ${SANS}`,C.ink); line=w; ly+=46; } else line=t; }
  if(line) text(line,M,ly,`32px ${SANS}`,C.ink);
  // Interest mix bars
  let by=ly+80; const bx=M+250, bw=W-2*M-250-110;
  D.top.forEach((t,i)=>{ text(TYPES[t].name, M, by+10, `30px ${SANS}`, C.ink);
    g.fillStyle=C.soft; g.beginPath(); g.roundRect ? g.roundRect(bx,by-8,bw,14,7) : g.rect(bx,by-8,bw,14); g.fill();
    const fw=Math.max(0, bw*P.rel[t]/P.rel[D.top[0]]); if(fw>0){ g.fillStyle=i<2?C.accent:C.ink; g.beginPath(); g.roundRect ? g.roundRect(bx,by-8,fw,14,7) : g.rect(bx,by-8,fw,14); g.fill(); }
    text(Math.round(P.rel[t]*100)+'%', W-M, by+10, `28px ${MONO}`, C.muted, 'right'); by+=58; });
  by+=50; g.fillStyle=C.line; g.fillRect(M,by,W-2*M,2);
  text('Find your own bearing', M, by+60, `26px ${MONO}`, C.muted, 'left', 2);
  const out=document.createElement('canvas'); out.width=W; out.height=by+110;
  out.getContext('2d').drawImage(cv,0,0); return out;
}
async function shareSnapshot(){
  const P=profile(S), D=directionOf(P), title=snapTitle();
  const text=`${title}: ${D.key==='ALL'?'':String(P.bearing.deg).padStart(3,'0')+'° '}${D.n}. Found with Bearing.`;
  let cv; try{ cv=await drawSnapshot(); }catch(e){ toast('Couldn’t make the picture'); return; }
  if(NATIVE && window.BearingNative.shareImage){ window.BearingNative.shareImage(cv.toDataURL('image/png').split(',')[1], title, text); return; }
  const blob=await new Promise(r=>cv.toBlob(r,'image/png')); const file=new File([blob],'my-bearing.png',{type:'image/png'});
  if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], title, text}); }catch(e){} return; }
  if(NATIVE){ window.BearingNative.share(title, text); return; } // older app builds: text only
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='my-bearing.png'; document.body.appendChild(a); a.click(); a.remove(); toast('Picture saved to your downloads');
}
function jobDetail(o){
  const j=o.j, slug=(j.sq||j.t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return `<div class="detail" id="d-${hash(j.t)}"><div><span class="eyebrow">${FIELDS[j.f].name}</span><h3>${esc(j.t)}</h3></div>
    <div class="meta"><span><b>${TIER_NAME[o.tier]}</b></span><span>Pay <b>$${j.pay[0]}k–$${j.pay[1]}k</b> a year, indicative</span><span>Usual entry <b>${QUALS[j.q]}</b></span></div>
    ${o.ready ? `<div><span class="ready r${o.ready.lvl}">${READY[o.ready.lvl]}</span>${o.ready.carry.length?` <span class="muted" style="font-size:14px">Carries over: ${o.ready.carry.map(esc).join(', ')}</span>`:''}</div>` : ''}
    ${o.why.why.length ? `<div><div class="lbl">Why it fits</div><ul>${o.why.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <div><div class="lbl">Match breakdown</div><div class="meters">${[['Interests',o.r],['Conditions',o.cf],['Personality',o.tf]].map(([l,v])=>`<div class="meter"><span>${l}</span><div class="bar"><i style="width:${Math.round(Math.max(0.04,Math.min(1,v))*100)}%"></i></div><b>${v>=0.75?'Strong':v>=0.55?'Fair':'Weak'}</b></div>`).join('')}</div></div>
    ${(o.why.not.length||o.why.watch.length) ? `<div><div class="lbl">${o.tier==='S'?'Watch for':'Why it\u2019s not higher'}</div><ul>${o.why.not.concat(o.why.watch).map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <div><div class="lbl">A day in the life</div><p>${esc(j.day)}</p></div>
    <div><div class="lbl">How people get in</div><p>${esc(j.path)}</p></div>
    <div><div class="lbl">Courses that lead here</div><div class="links">
      <a href="https://www.google.com/search?q=${encodeURIComponent((j.cq||COURSE_Q[j.t]||j.t)+' course Australia')}" target="_blank" rel="noopener">Search \u201c${esc(j.cq||COURSE_Q[j.t]||j.t)}\u201d courses \u2197</a>
      ${j.q>=3 ? `<a href="https://www.courseseeker.edu.au/courses?q=${encodeURIComponent(j.cq||COURSE_Q[j.t]||j.t)}" target="_blank" rel="noopener">University courses: Course Seeker \u2197</a>` : `<a href="https://www.yourcareer.gov.au/learn-and-train/courses?q=${encodeURIComponent(j.cq||COURSE_Q[j.t]||j.t)}" target="_blank" rel="noopener">TAFE and VET courses: Your Career \u2197</a>`}</div></div>
    ${j.aka&&j.aka.length ? `<div><div class="lbl">Also advertised as</div><div class="aka">${j.aka.map(a=>`<a href="https://www.seek.com.au/${a.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-jobs/in-All-Australia" target="_blank" rel="noopener">${esc(a)}</a>`).join('')}</div></div>` : ''}
    <div class="links"><a class="primary" href="https://www.seek.com.au/${slug}-jobs/in-All-Australia" target="_blank" rel="noopener">Live listings on SEEK ↗</a>
      <a href="https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles" target="_blank" rel="noopener">Official pay and outlook ↗</a></div>
    <div><button class="btn ghost sm" data-act="open" data-v="${esc(j.t)}">Close ${esc(j.t)}</button></div></div>`;
}
function chip(o){ const open = S.open===o.j.t; return `<button class="jobchip" data-act="open" data-v="${esc(o.j.t)}" aria-expanded="${open}">${esc(o.j.t)}<small>$${o.j.pay[0]}–${o.j.pay[1]}k${o.ready?' · '+READY[o.ready.lvl].toLowerCase():''}</small></button>`; }
function tierBoard(scored){
  return `<div class="tiers">${TIER.map(t=>{ const list=scored.filter(o=>o.tier===t); const showAll = t!=='D' || S.showD;
    const openOne = list.find(o=>o.j.t===S.open);
    return `<div class="tier"><div class="lab" style="background:var(--t${t})">${tierLab(t)}</div><div class="jobs">
      ${list.length ? (showAll ? (()=>{ const cut = t==='C' && !S.showC && list.length>16; const shown = cut ? list.slice(0,16) : list;
          if(cut && openOne && !shown.includes(openOne)) shown.push(openOne);
          return `<div class="chips">${shown.map(o=>chip(o)+(o===openOne?jobDetail(o):'')).join('')}${cut?`<button class="chipbtn" data-act="show-c">Show ${list.length-shown.length} more</button>`:''}</div>`; })()
        : `<button class="chipbtn" data-act="show-d">Show ${list.length} unlikely fits</button>`) : `<span class="tier-empty">None here</span>`}
      </div></div>`; }).join('')}</div>`;
}
function fieldBoard(scored){
  const byField={}; scored.filter(o=>o.tier!=='D').forEach(o=>(byField[o.j.f]=byField[o.j.f]||[]).push(o));
  const fields=Object.keys(byField).sort((a,b)=>byField[b][0].total-byField[a][0].total);
  return `<div class="panel" style="padding-block:4px">${fields.map(f=>`<div class="field"><div><h3>${FIELDS[f].name}</h3><p class="muted" style="margin:2px 0 0;font-size:15px">${FIELDS[f].blurb}</p></div>
    <div class="chips">${byField[f].map(o=>`<button class="jobchip" data-act="open" data-v="${esc(o.j.t)}" aria-expanded="${S.open===o.j.t}"><span><span class="tb" style="background:var(--t${o.tier})">${TIER_NAME[o.tier].split(' ')[0]}</span>${esc(o.j.t)}</span><small>$${o.j.pay[0]}–${o.j.pay[1]}k</small></button>${S.open===o.j.t?jobDetail(o):''}`).join('')}</div>
    </div>`).join('')}</div>`;
}
function traitRows(P){
  const f = P.friends.length ? P.friends : [];
  return TRAIT_ORDER.map(k=>{ const z=P.selfTraits[k]; if(z===null) return '';
    const fz = f.map(x=>x.traits[k]).filter(v=>v!==null);
    return `<div class="trait"><div class="top"><b>${TRAITS[k].name}</b></div>
      <div class="spectrum"><span class="dot" style="left:${(50+z*45).toFixed(1)}%"></span>${fz.length?`<span class="dot friend" style="left:${(50+mean(fz)*45).toFixed(1)}%"></span>`:''}</div>
      <div class="ends"><span>${TRAITS[k].lo}</span><span>${TRAITS[k].hi}</span></div></div>`; }).join('');
}
function lookFor(P){
  return COND.map(c=>({c, v:P.cond[c.k]})).filter(x=>x.v!==null && Math.abs(x.v)>=1).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,4)
    .map(x=>`<li>${x.v>0?x.c.hi:x.c.lo}</li>`).join('') || '<li>You were flexible on working conditions, so they didn’t narrow things much.</li>';
}
let LAST = [];
function payLabel(){ const v=S.minPay||0; const mq=S.maxQ??4; const hidden=LAST.filter(o=>o.j.pay[1]<v || o.j.q>mq).length;
  return (v ? `Can pay at least $${v}k` : 'Any pay') + (hidden ? ` \u00b7 ${hidden} hidden` : ''); }
const TRAIN_OPTS = [[0,'None'],[1,'Certificate'],[2,'Diploma'],[3,'Degree'],[4,'Any']];
function board(){
  const maxQ = S.maxQ===undefined||S.maxQ===null ? 4 : S.maxQ;
  const list = LAST.filter(o=>o.j.pay[1] >= (S.minPay||0) && o.j.q <= maxQ);
  if(!list.length) return `<div class="panel"><p style="margin:0">No jobs match both filters. Lower the minimum pay or allow more training to see more.</p></div>`;
  return S.view==='fields' ? fieldBoard(list) : tierBoard(list);
}
function historySection(P, D){
  const roles=(S.roles||[]).filter(r=>r.t || r.types.length);
  if(!roles.length) return '';
  return `<section class="section"><h2>What your history says</h2>
    <p class="muted" style="margin:0">Your past roles, checked against your direction. By default they don\u2019t change your ranking, so the results above are a fresh read.</p>
    <div class="actions">${roles.map(r=>{ const v=roleVerdict(r); const inDir = r.types.some(t=>t===D.top[0]||t===D.top[1]);
      return `<div class="panel"><div class="eyebrow">${esc(v.label)}</div><h3>${esc(r.t||'Unnamed role')}</h3>
        ${r.types.length?`<p class="muted">Mostly ${r.types.map(t=>TYPES[t].name).join(' and ')} work. ${inDir?'That lines up with your direction.':'That sits outside your direction.'}</p>`:''}
        ${v.text?`<p>${esc(v.text)}</p>`:''}</div>`; }).join('')}</div>
    <div class="cta-row"><button class="toggle-sw" data-act="history" aria-pressed="${!!S.useHistory}"><span></span>Let my history adjust the ranking</button>
      <span class="muted" style="font-size:14px">${S.useHistory?'On: work you enjoyed and did well gets a boost, and work you were good at but disliked gets marked down.':'Off: the ranking ignores your history.'}</span></div></section>`;
}
function results(){
  const P = profile(S), D = directionOf(P), scored = scoreJobs(P, S); LAST = scored;
  const name = S.name ? esc(S.name)+'’s' : 'Your';
  const friendsHtml = P.friends.length ? `<section class="section"><h2>How others see you</h2>
    <p class="muted" style="margin:0">The dashed orange outline on the compass and the hollow dots below are from ${P.friends.map(f=>esc(f.name)).join(' and ')}. Their view counts for a quarter of your results.</p>
    ${P.friends.filter(f=>f.text).map(f=>`<div class="panel"><div class="eyebrow">${esc(f.name)} says you’re better than you realise at</div><p style="margin:0;font-size:19px">${esc(f.text)}</p></div>`).join('')}
    ${P.friends.filter(f=>f.rel).map(f=>{ const fb=bearingOf(f.rel); const diff=Math.abs(((fb.deg-P.bearing.deg+540)%360)-180); return `<p style="margin:0">${esc(f.name)}’s bearing for you: <b style="font-family:var(--mono)">${String(fb.deg).padStart(3,'0')}°</b>. ${diff<=30?'That’s close to how you see yourself.':diff<=75?'That’s a noticeably different angle from yours, worth talking about.':'That’s a very different read from yours. Ask them what they’ve seen.'}</p>`; }).join('')}</section>` : '';
  const sCount = scored.filter(o=>o.tier==='S').length;
  return `<main class="wide">
  <section class="res-head">
    <div>${compassSVG(P)}</div>
    <div class="dir"><span class="eyebrow">${name} bearing</span>
      <h1 class="dir-name">${D.n}</h1>
      ${D.key==='ALL' ? '' : `<p class="bearing-line"><b>${String(P.bearing.deg).padStart(3,'0')}°</b> ${bearingWords(P, D)}</p>`}
      <span class="lean">${leanLabel(P.bearing.strength)} · ${TYPES[D.top[0]].name} + ${TYPES[D.top[1]].name}</span>
      <p>${D.d}</p>
      ${P.bearing.strength<0.15 && D.key!=='ALL' ? `<p class="muted">Your answers spread fairly evenly across all six directions. That usually means you’d be happy in more kinds of work than most people, and that the conditions below matter more than the field.</p>` : ''}
      <div class="mix">${D.top.map((t,i)=>`<div class="mixrow ${i<2?'top':''}"><span>${TYPES[t].name}</span><div class="bar"><i style="width:${Math.max(4,100*P.rel[t]/P.rel[D.top[0]]).toFixed(0)}%"></i></div><span>${levelWord(P.rel[t]/P.rel[D.top[0]])}</span></div>`).join('')}</div>
    </div>
  </section>
  <section class="section grid2">
    <div><h2>Look for</h2><p class="muted" style="margin:4px 0 12px">Whatever job you pick, these were your strongest calls on how the day should run.</p><ul class="look">${lookFor(P)}</ul></div>
    <div><h2>How you run</h2><div style="margin-top:6px">${traitRows(P)}</div></div>
  </section>
  ${!SET.ai && !SET.aiOfferSeen ? `<section class="section"><div class="panel offer"><span class="eyebrow">Optional</span><h3 style="font-size:26px;text-transform:uppercase">Want to go deeper?</h3>
    <p style="margin:0">Turn on the AI coach and add a few lines in your own words (about 3 minutes). You\u2019ll get a prompt that gives any AI chat the full picture, so it can talk through your direction, the tensions in your answers, and a plan to get there.</p>
    <p class="muted" style="margin:0;font-size:14px">Nothing is sent from this app. You choose where to paste it. Your matches stay the same either way.</p>
    <div class="cta-row"><button class="btn" data-act="ai-offer-yes">Turn on and add my words</button><button class="btn ghost" data-act="ai-offer-no">No thanks</button></div></div></section>` : ''}
  ${friendsHtml}
  ${historySection(P, D)}
  <section class="section"><div class="cta-row" style="justify-content:space-between"><h2>Your heading</h2>
    <div class="toggle" role="group" aria-label="View"><button data-act="view" data-v="tiers" aria-pressed="${S.view==='tiers'}">By match</button><button data-act="view" data-v="fields" aria-pressed="${S.view==='fields'}">By field</button></div></div>
    <p class="muted" style="margin:0">Tap a job for why it fits, a day in the life, pay and live listings. ${S.useHistory?'Your past roles are adjusting this ranking.':(S.expSkipped||S.exp.q===null?'Your job history wasn’t used.':'Your experience only adds the readiness notes. It didn’t change the order.')}${sCount===0?' Nothing stood far enough ahead to be a top match, which is common for all-rounders.':''}</p>
    <div class="optstrip" role="group" aria-label="Optional next steps"><span class="eyebrow">Optional</span>
      ${!S.refineDone ? `<button class="chipbtn sm" data-act="jump" data-v="opt-refine">Refine it</button>` : ''}
      <button class="chipbtn sm" data-act="jump" data-v="opt-friend">Ask a friend</button>
      <button class="chipbtn sm" data-act="jump" data-v="ai-panel">AI coach</button>
      <button class="chipbtn sm" data-act="jump" data-v="opt-share">Keep or share</button></div>
    <div class="payfilter"><div class="frow"><label for="minpay" class="eyebrow">Minimum pay</label><input type="range" id="minpay" min="0" max="160" step="10" value="${S.minPay||0}"><span id="paylabel" class="paylabel"></span></div>
      <div class="frow"><span class="eyebrow">Most training I\u2019d do</span><div class="chips">${TRAIN_OPTS.map(([v,l])=>`<button class="chipbtn sm" data-act="maxq" data-v="${v}" aria-pressed="${(S.maxQ??4)===v}">${l}</button>`).join('')}</div></div></div>
    <div id="board">${board()}</div>
  </section>
  <section class="section"><h2>Optional next steps</h2><div class="actions">
    ${!S.refineDone ? `<div class="panel" id="opt-refine"><h3>Refine it</h3><p>About ${minsOf(refineScreens())} more minutes: fifteen more trade-offs and three questions in your own words. It sharpens the direction.</p><button class="btn" data-act="refine">Start refining round</button></div>` : ''}
    <div class="panel" id="opt-friend"><h3>Ask a friend</h3>${LINKS
      ? `<p>Send an invite to someone who knows you well. They answer about ${minsOf(friendScreens())} minutes of questions about you, then send their answers back to you.</p>
         <label class="eyebrow" for="reply-in">Your email, so their answers come straight back to you (optional)</label>
         <input id="reply-in" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="${esc(S.replyEmail||'')}">
         <button class="btn" data-act="share-invite">Send an invite</button>
         <details class="saymore"><summary>Got a code instead?</summary><textarea id="fcode-in" class="codebox" placeholder="BRG-F1.…"></textarea><button class="btn ghost" data-act="add-friend">Add their view</button></details>`
      : `<p>Send someone who knows you well the app. They choose “Describe a friend”, answer about you, and send you a code. Paste it here.</p>
      <textarea id="fcode-in" class="codebox" placeholder="BRG-F1.…"></textarea><button class="btn ghost" data-act="add-friend">Add their view</button>`}</div>
    <div class="panel" id="ai-panel"><h3>AI coach</h3>${SET.ai
      ? `<p>Copies your results as a prompt you can paste into any AI chat for a fuller conversation about direction and next steps.</p><div class="cta-row"><button class="btn" data-act="copy-prompt">Copy prompt for an AI coach</button><button class="btn ghost" data-act="ai-words">${Object.values(S.storyText||{}).some(t=>t&&t.trim())?'Edit my words':'Add my own words'}</button></div>`
      : `<p>Optional. Turn it on to get a prompt you can paste into any AI chat. Nothing is sent from this app.</p><button class="btn ghost" data-act="settings">Turn on in Settings</button>`}</div>
    <div class="panel" id="opt-share"><h3>Keep or share</h3><p>Share a picture of your bearing to messages, socials or email. The code holds all your answers: paste it into Bearing on any device to reopen these results.</p>
      <div class="cta-row"><button class="btn ghost sm" data-act="share-snap">${SHARE_ICON}Share my Bearing</button><button class="btn ghost sm" data-act="copy-profile">Copy code</button></div></div>
  </div></section>
  ${feedbackCard()}
  <section class="section note">
    <p><b>How this works.</b> The story questions are adapted from the themes of Mark Savickas’s Career Construction Interview. Answers map to Holland’s six interest types (RIASEC), the model behind the US Department of Labor’s O*NET Interest Profiler, and the job codes come from O*NET equivalents. “How you run” uses the Mini-IPIP, public-domain Big Five items from the International Personality Item Pool. Scoring is fixed rules, with no AI.</p>
    <p><b>Pay</b> is an indicative full-time range for Australia and varies a lot by state, experience and award. Check the official figures from Jobs and Skills Australia before deciding anything. Treat this as a map for exploring, not a verdict.</p>
    <p><button class="linkbtn" data-act="restart" style="padding-left:0">Start over with new answers</button></p>
  </section></main>`;
}

function aiPrompt(){
  const P=profile(S), D=directionOf(P), sc=scoreJobs(P,S);
  const L = [];
  L.push(`I'm exploring a career change in Australia and want help turning my questionnaire results into a direction and a plan.

HOW TO HELP
- Treat the results below as evidence, not a verdict. Base what you say on them and on what I tell you.
- Don't infer my field from any single answer, and don't steer me back toward past work unless the evidence points there.
- Plain language. No flattery and no labels like "blueprint" or "rare gift". If my answers pull against each other, say so plainly.
- Commit to one main direction and explain why, then give alternatives. You can suggest roles that aren't on my list.
- Use Australian job titles, pay in AUD, and real Australian pathways (TAFE, university, short courses, licences, apprenticeships).

ANSWER IN THIS ORDER
1. Direction: two or three sentences naming the kind of work, citing the specific answers that point there.
2. Tensions: up to three places my answers conflict, and what each means in practice.
3. Roles to look at: four to six specific roles. For each: why it fits (tie it to my answers), what a typical week involves, indicative Australian pay, the gap between me and the role, and the most direct way in.
4. What to look for: phrases and features in job ads that signal a good fit, and red flags that signal a poor one, based on my conditions and personality.
5. Test it this month: three cheap ways to try the main direction before committing, such as a short course, volunteering, a side project, or a conversation with someone doing the job.
6. Questions: at most two questions whose answers would most change your recommendation.

When I reply, update the recommendation and say what changed.

MY RESULTS`);
  L.push(`Direction: ${D.n}${D.key==='ALL'?'':` (bearing ${P.bearing.deg} degrees, ${leanLabel(P.bearing.strength).toLowerCase()})`}. Interest mix (Holland RIASEC): ${D.top.map(t=>`${TYPES[t].name} ${Math.round(P.rel[t]*100)}%`).join(', ')}.`);
  L.push('Personality (Mini-IPIP Big Five): '+TRAIT_ORDER.filter(k=>P.selfTraits[k]!==null).map(k=>`${TRAITS[k].name} ${P.selfTraits[k]>0.25?'high':P.selfTraits[k]<-0.25?'low':'middle'}`).join('; ')+'.');
  const cs = COND.filter(c=>P.cond[c.k]!==null&&Math.abs(P.cond[c.k])>=1).map(c=>(Math.abs(P.cond[c.k])>=2?'strongly: ':'')+(P.cond[c.k]>0?c.hi:c.lo));
  L.push('Working conditions I want: '+(cs.join('; ')||'no strong preferences')+'.');
  const st = STORIES.map(s=>{ const t=S.stories[s.id]; const extra=S.storyText[s.id]; const t2=(S.stories2||{})[s.id]; return t ? `- ${s.q} -> ${t==='none'?(s.none||'None of these'):s.opts[t]}${t2?` (also: ${s.opts[t2]})`:''}${extra?` (in my words: "${extra}")`:''}` : ''; }).filter(Boolean);
  L.push('\nStory answers:\n'+st.join('\n'));
  const deep = DEEP.map(d=>{ const a=S.refine.deep[d.id]; return a&&(a.text||a.tags.length) ? `- ${d.q} ${a.text?`"${a.text}"`:''}${a.tags.length?` [what mattered: ${a.tags.map(t=>DEEP_TAGS[t].toLowerCase()).join('; ')}]`:''}` : ''; }).filter(Boolean);
  if(deep.length) L.push('\nIn my own words:\n'+deep.join('\n'));
  if(S.refine.drain && S.refine.drain.length) L.push('What drains me fastest: '+S.refine.drain.map(t=>DRAIN[t].toLowerCase()).join('; ')+'.');
  P.friends.forEach(f=>{ const fb=f.rel?bearingOf(f.rel):null; L.push(`\nFriend's view (${f.name}): ${f.rel?`their read of my interests leans ${ORDER.slice().sort((a,b)=>f.rel[b]-f.rel[a]).slice(0,2).map(t=>TYPES[t].name).join(' and ')}.`:''}${f.text?` They say I'm better than I realise at: "${f.text}".`:''}`); });
  const roles=(S.roles||[]).filter(r=>r.t||r.types.length);
  if(roles.length) L.push('\nPast roles (judge these as evidence about what I enjoy and do well, not as a track to stay on):\n'+roles.map(r=>{ const v=roleVerdict(r); return `- ${r.t||'Unnamed role'}: mostly ${r.types.map(t=>TYPES[t].name).join(' and ')||'unspecified'} work; good at it: ${r.good!=null?GOOD[r.good].toLowerCase():'?'}; enjoyed it: ${r.enjoy!=null?ENJOY[r.enjoy].toLowerCase():'?'} (${v.label.toLowerCase()})`; }).join('\n'));
  if(!S.expSkipped && S.exp.q!==null) L.push(`Qualification: ${QUALS[S.exp.q]}. Skills I've used a lot: ${S.exp.skills.map(s=>SKILLS.find(x=>x[0]===s)[1].toLowerCase()).join(', ')||'not given'}.`);
  const tierLine = t => sc.filter(o=>o.tier===t).map(o=>o.j.t).join(', ');
  L.push(`\nQuestionnaire job matches (from a fixed list of ${JOBS.length} Australian jobs, so treat as a starting point):\nTop matches: ${tierLine('S')||'none'}\nStrong matches: ${tierLine('A')||'none'}\nGood matches: ${tierLine('B')||'none'}\nRuled out (unlikely), for contrast: ${sc.filter(o=>o.tier==='D').slice(-6).map(o=>o.j.t).join(', ')}`);
  if(S.minPay) L.push(`I need roles that can pay at least $${S.minPay}k a year.`);
  return L.join('\n');
}

/* ---------- events ---------- */
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }
function copyText(text, fallbackEl){
  if(NATIVE){ try{ window.BearingNative.copy(text); toast('Copied'); return; }catch(e){} }
  const done=()=>toast('Copied');
  const fail=()=>{ if(fallbackEl){ fallbackEl.value=text; fallbackEl.focus(); fallbackEl.select(); } toast('Select the text and copy it'); };
  try{ navigator.clipboard.writeText(text).then(done, fail); }catch(e){ fail(); }
}
function grabText(){
  const nmEl=document.getElementById('nm'); if(nmEl) S.name=nmEl.value.trim().slice(0,40);
  STORIES.forEach(s=>{ const el=document.getElementById('st-'+s.id); if(el) S.storyText[s.id]=el.value.slice(0,1000); });
  DEEP.forEach(d=>{ const el=document.getElementById('dp-'+d.id); if(el){ const cur=S.refine.deep[d.id]||{text:'',tags:[]}; cur.text=el.value.slice(0,1500); S.refine.deep[d.id]=cur; } });
  (S.roles||[]).forEach((r,i)=>{ const el=document.getElementById('role-'+i); if(el) r.t=el.value.slice(0,80); });
  if(F){ const a=document.getElementById('ffor'), b=document.getElementById('fby'), c=document.getElementById('ftx');
    if(a) F.for=a.value.trim().slice(0,40); if(b) F.by=b.value.trim().slice(0,40); if(c) F.text=c.value.slice(0,600); }
}
function next(){ grabText(); const list=screens(); if(S.idx<list.length-1) S.idx++; if(S.phase==='quick') S.reach=Math.max(S.reach||0,S.idx); save(); render(); }
function profileCode(){ const {phase,idx,open,view,showD,showC,pendingFriends,pendingProfile,_confirmDelete,backPhase,resumePhase,prevPhase,fb,replyEmail,...rest}=S; return encode('BRG-P1.', rest); }

function grabFb(){ S.fb=S.fb||{}; const c=document.getElementById('fb-comment'); if(c) S.fb.comment=c.value.slice(0,500); const i=document.getElementById('fb-include'); if(i) S.fb.include=i.checked; }
function refreshFb(){ const y=window.scrollY; const old=document.getElementById('feedback')||document.querySelector('.fbcard')?.closest('section');
  const html=feedbackCard(); if(old){ if(html){ const t=document.createElement('div'); t.innerHTML=html; old.replaceWith(t.firstElementChild); } else old.remove(); } window.scrollTo(0,y); }
async function onClick(e){
  const b = e.target.closest('[data-act]'); if(!b) return;
  const act=b.dataset.act, id=b.dataset.id, v=b.dataset.v;
  switch(act){
    case 'start': S=fresh(); S.phase='quick'; S.idx=0; save(); render(); break;
    case 'resume': S.phase='quick'; save(); render(); break;
    case 'show-results': S.phase='results'; save(); render(); break;
    case 'home': grabText(); if(S.phase==='words'){ S.phase='results'; save(); render(); break; } if(S.phase==='friend'){ S.phase = S.done?'results':'intro'; } else if(S.phase!=='results'){ S.resumePhase=S.phase; S.phase='intro'; } else S.phase='intro'; save(); render(); break;
    case 'next': next(); break;
    case 'jump': { const el=document.getElementById(v); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); break; }
    case 'back': grabText(); S.idx=Math.max(0,S.idx-1); save(); render(); break;
    case 'story-none': { grabText(); S.stories[id]='none'; if(S.stories2) delete S.stories2[id]; save(); render(); setTimeout(next, 220); break; }
    case 'story': { grabText(); S.stories2=S.stories2||{}; if(S.stories[id]==='none') delete S.stories[id]; const m=S.stories[id], a=S.stories2[id];
      if(m===v){ if(a){ S.stories[id]=a; delete S.stories2[id]; } else delete S.stories[id]; }
      else if(a===v){ delete S.stories2[id]; }
      else if(!m){ S.stories[id]=v; }
      else { S.stories2[id]=v; }
      save(); render(); break; }
    case 'pick': { const sc=screens()[S.idx]; const store = sc.type==='fpair'? F.pairs : sc.set==='refine'? S.refine.pairs : S.pairs; store[id]=v; save(); render(); setTimeout(next, 220); break; }
    case 'rate': { const sc=screens()[S.idx]; (sc.type==='fipip'?F.ipip:S.ipip)[id]=+v; save(); render(); break; }
    case 'cond': { const sc=screens()[S.idx]; (sc.type==='fcond'?F.cond:S.cond)[id]= v==='skip' ? 'skip' : +v; save(); render(); break; }
    case 'role-add': grabText(); S.roles.push({t:'',types:[],good:null,enjoy:null}); save(); render();
      { const el=document.getElementById('role-'+(S.roles.length-1)); if(el) el.closest('.role').scrollIntoView({behavior:'smooth',block:'start'}); } break;
    case 'role-del': grabText(); S.roles.splice(+v,1); save(); render(); break;
    case 'role-type': { grabText(); const r=S.roles[+id]; const i=r.types.indexOf(v); if(i>=0) r.types.splice(i,1); else if(r.types.length<2) r.types.push(v); save(); render(); break; }
    case 'role-good': grabText(); S.roles[+id].good=+v; save(); render(); break;
    case 'role-enjoy': grabText(); S.roles[+id].enjoy=+v; save(); render(); break;
    case 'history': { S.useHistory=!S.useHistory; save(); const y=window.scrollY; render(); window.scrollTo(0,y); toast(S.useHistory?'History now adjusts the ranking':'Ranking ignores your history'); break; }
    case 'skill': { const i=S.exp.skills.indexOf(v); if(i>=0) S.exp.skills.splice(i,1); else S.exp.skills.push(v); save(); render(); break; }
    case 'qual': S.exp.q=+v; save(); render(); break;
    case 'skip-exp': S.expSkipped=true; S.exp={skills:[],q:null}; S.done=true; mergePending(); S.phase='results'; save(); render(); break;
    case 'finish': S.expSkipped=false; S.done=true; mergePending(); S.phase='results'; save(); render(); break;
    case 'tag': { grabText(); const d=S.refine.deep[id]||{text:'',tags:[]}; const i=d.tags.indexOf(v); if(i>=0) d.tags.splice(i,1); else if(d.tags.length<2) d.tags.push(v); S.refine.deep[id]=d; save(); render(); break; }
    case 'drain': { const i=S.refine.drain.indexOf(v); if(i>=0) S.refine.drain.splice(i,1); else if(S.refine.drain.length<2) S.refine.drain.push(v); save(); render(); break; }
    case 'finish-refine': S.refineDone=true; S.phase='results'; save(); render(); toast('Results updated'); break;
    case 'refine': S.phase='refine'; S.idx=0; save(); render(); break;
    case 'restart': S=fresh(); save(); render(); break;
    case 'maxq': S.maxQ=+v; save(); document.getElementById('board').innerHTML=board(); document.getElementById('paylabel').textContent=payLabel(); document.querySelectorAll('[data-act="maxq"]').forEach(x=>x.setAttribute('aria-pressed', String(+x.dataset.v===S.maxQ))); break;
    case 'view': S.view=v; save(); document.getElementById('board').innerHTML=board(); document.querySelectorAll('[data-act="view"]').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.v===v))); break;
    case 'show-c': S.showC=true; document.getElementById('board').innerHTML=board(); break;
    case 'show-d': S.showD=true; document.getElementById('board').innerHTML=board(); break;
    case 'open': { S.open = S.open===v ? null : v; save(); document.getElementById('board').innerHTML=board(); if(S.open){ const el=document.getElementById('d-'+hash(v)); const chipEl=el&&el.previousElementSibling; const r=chipEl&&chipEl.getBoundingClientRect(); if(r && (r.top<0 || r.top>window.innerHeight*0.6)) chipEl.scrollIntoView({behavior:'smooth',block:'start'}); } else { const c=[...document.querySelectorAll('.jobchip')].find(b=>b.dataset.v===v); if(c){ const r=c.getBoundingClientRect(); if(r.top<0||r.bottom>window.innerHeight) c.scrollIntoView({behavior:'smooth',block:'center'}); } } break; }
    case 'friend-start': F=freshF(); S.prevPhase=S.phase; S.phase='friend'; S.idx=0; save(); render(); break;
    case 'copy': { const el=document.getElementById(b.dataset.src); copyText(el.value, el); break; }
    case 'copy-profile': { copyText(profileCode(), document.getElementById('fcode-in')); break; }
    case 'settings': grabText(); if(S.phase!=='settings'){ S.backPhase=S.phase; } S.phase='settings'; render(); break;
    case 'settings-back': S._confirmDelete=false; S.phase=S.backPhase||'intro'; render(); break;
    case 'ai-offer-yes': SET.ai=true; SET.aiOfferSeen=true; saveSet(); S.phase='words'; save(); render(); break;
    case 'ai-offer-no': SET.aiOfferSeen=true; saveSet(); { const y=window.scrollY; render(); window.scrollTo(0,y); } toast('No problem. You can turn it on later in Settings.'); break;
    case 'ai-words': S.phase='words'; save(); render(); break;
    case 'words-done': grabText(); S.phase='results'; save(); render(); { const el=document.getElementById('ai-panel'); if(el) el.scrollIntoView({block:'center'}); } toast('Your AI coach prompt is ready'); break;
    case 'fb': { S.fb=S.fb||{}; const fb=S.fb; grabFb();
      if(b.dataset.multi==='1'){ fb[id]=fb[id]||[]; const i=fb[id].indexOf(v); if(i>=0) fb[id].splice(i,1); else fb[id].push(v); }
      else fb[id] = fb[id]===v ? null : v;
      save(); refreshFb(); break; }
    case 'fb-send': { grabFb(); const fb=S.fb; if(!fb||!fb.fit) break;
      fb.id = newId(); const payload = buildFeedback(); b.disabled=true;
      try{ await postFeedback(payload); } catch(e){ (SET.queue=SET.queue||[]).push(payload); toast('You\u2019re offline. It\u2019ll send when you\u2019re back online.'); }
      fb.sentId=fb.id; SET.submissions=(SET.submissions||[]).concat(fb.id); saveSet(); save(); refreshFb(); toast('Feedback sent. Thank you'); break; }
    case 'fb-never': SET.noFeedback=true; saveSet(); refreshFb(); toast('Got it. You can turn this back on in Settings.'); break;
    case 'set-fb': SET.noFeedback=!SET.noFeedback; saveSet(); render(); break;
    case 'set-theme': SET.theme=v; saveSet(); applyTheme(); render(); break;
    case 'set-ai': SET.ai=!SET.ai; saveSet(); render(); toast(SET.ai?'AI coach turned on':'AI coach turned off'); break;
    case 'delete-ask': S._confirmDelete=true; render(); break;
    case 'delete-cancel': S._confirmDelete=false; render(); break;
    case 'delete-all': try{ localStorage.removeItem(KEY); localStorage.removeItem(SKEY); }catch(e){} S=fresh(); F=null; SET={ai:false,theme:'system'}; applyTheme(); render(); toast('All your data on this device is deleted'); break;
    case 'install': if(deferredInstall){ deferredInstall.prompt(); deferredInstall.userChoice.finally(()=>{ deferredInstall=null; render(); }); } break;
    case 'share-invite': { const el=document.getElementById('reply-in'); const em = el ? el.value.trim() : (S.replyEmail||'');
      if(em && !okEmail(em)){ toast('That email address doesn\u2019t look right'); break; }
      S.replyEmail = em; save();
      shareLink('Describe me on Bearing', `I'm using Bearing to work out a career direction. Could you answer a few questions about me? It takes about ${minsOf(friendScreens())} minutes.`, baseUrl()+'?describe='+encodeURIComponent(S.name||'')+(em?'&reply='+encodeURIComponent(em):''), null); break; }
    case 'share-friend-back': shareLink('My answers about you', `Here's how I see you. Open this to add it to your Bearing results.`, baseUrl()+'?friend='+encode('BRG-F1.',friendOut()), document.getElementById('fcode')); break;
    case 'share-snap': shareSnapshot(); break;
    case 'share-profile': shareLink('My Bearing results', 'My career direction results from Bearing.', baseUrl()+'?profile='+profileCode(), null); break;
    case 'open-pending': S=Object.assign(fresh(), S.pendingProfile); S.done=true; S.phase='results'; save(); render(); toast('Results opened'); break;
    case 'drop-pending': S.pendingProfile=null; save(); render(); break;
    case 'copy-prompt': { copyText(aiPrompt(), document.getElementById('fcode-in')); break; }
    case 'load-code': {
      const r=decode(document.getElementById('code-in').value);
      if(!r){ toast('That code wasn’t recognised. Check it was copied in full.'); break; }
      if(r.kind==='profile'){ S=Object.assign(fresh(), r.data); S.done=true; S.phase='results'; save(); render(); toast('Results loaded'); }
      else { if(!S.done){ toast('Finish your own questions first, then add their code on the results page.'); break; }
        S.friends.push({data:r.data}); S.phase='results'; save(); render(); toast('Friend’s view added'); }
      break; }
    case 'add-friend': {
      const r=decode(document.getElementById('fcode-in').value);
      if(!r || r.kind!=='friend'){ toast('That isn’t a friend code. Friend codes start with BRG-F1.'); break; }
      S.friends.push({data:r.data}); save(); render(); toast('Friend’s view added'); break; }
  }
}
// "resume" returns to whichever round was in progress
const _onClick = onClick;
function mergePending(){ (S.pendingFriends||[]).forEach(d=>S.friends.push({data:d})); S.pendingFriends=[]; }
let INCOMING = null;
function handleLink(){
  if(!HOSTED) return;
  const q = new URLSearchParams(location.search); let used=false;
  if(!ANDROID){ for(const k of ['friend','profile']){ if(q.has(k)) INCOMING={k, v:q.get(k)}; } }
  if(q.has('describe')){ F=freshF(); F.for=(q.get('describe')||'').slice(0,40); const rp=(q.get('reply')||'').trim(); if(okEmail(rp)) F.reply=rp; F.lock=!!(F.for||F.reply); S.phase='friend'; S.idx=0; used=true; }
  if(q.has('friend')){ const r=decode(q.get('friend')); used=true;
    if(r && r.kind==='friend'){ if(S.done){ S.friends.push({data:r.data}); S.phase='results'; setTimeout(()=>toast(`${r.data.by||'Your friend'}\u2019s view added`),300); }
      else { (S.pendingFriends=S.pendingFriends||[]).push(r.data); setTimeout(()=>toast(`Saved ${r.data.by||'your friend'}\u2019s answers. They\u2019ll be added when you finish.`),300); } } }
  if(q.has('profile')){ const r=decode(q.get('profile')); used=true;
    if(r && r.kind==='profile'){ const started = S.done || Object.keys(S.stories).length;
      if(!started){ S=Object.assign(fresh(), r.data); S.done=true; S.phase='results'; } else { S.pendingProfile=r.data; S.phase='intro'; } } }
  if(used){ save(); try{ history.replaceState(null,'',location.pathname); }catch(e){} }
}
/* Called by the Android back button. Returns true when the page handled it. */
function bearingBack(){
  if(S.phase==='settings'){ S._confirmDelete=false; S.phase=S.backPhase||'intro'; render(); return true; }
  if(S.phase==='words'){ grabText(); S.phase='results'; save(); render(); return true; }
  if(['quick','refine','friend'].includes(S.phase)){
    if(S.idx>0){ grabText(); S.idx--; save(); render(); }
    else { grabText(); if(S.phase==='friend'){ S.phase=S.done?'results':'intro'; } else { S.resumePhase=S.phase; S.phase=S.done&&S.phase==='refine'?'results':'intro'; } save(); render(); }
    return true; }
  if(S.phase==='results'){ S.phase='intro'; save(); render(); return true; }
  return false;
}
if(typeof window!=='undefined') window.bearingBack = bearingBack;
function boot(){
  load(); loadSet(); applyTheme(); handleLink();
  if(darkQuery){ const onChange=()=>{ if((SET.theme||'system')==='system') applyTheme(); };
    darkQuery.addEventListener ? darkQuery.addEventListener('change',onChange) : darkQuery.addListener(onChange); }
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstall=e; if(S.phase==='settings') render(); });
  if(S.phase==='quick' || S.phase==='refine' || S.phase==='friend'){ /* resume mid-flow */ }
  document.addEventListener('click', e=>{ const b=e.target.closest('[data-act="resume"]'); if(b){ S.phase=S.resumePhase||'quick'; save(); render(); return; } _onClick(e); });
  document.addEventListener('input', e=>{ if(e.target.id==='minpay'){ S.minPay=+e.target.value; document.getElementById('board').innerHTML=board(); document.getElementById('paylabel').textContent=payLabel(); } });
  document.addEventListener('change', e=>{ if(e.target.id==='minpay') save();
    if(e.target.id==='fb-include'){ grabFb(); save(); const pre=document.getElementById('fb-preview'); if(pre) pre.textContent=JSON.stringify(buildFeedback(),null,1); } });
  document.addEventListener('input', e=>{ if(e.target.id==='fb-comment'){ grabFb(); const pre=document.getElementById('fb-preview'); if(pre) pre.textContent=JSON.stringify(buildFeedback(),null,1); } });
  window.addEventListener('online', flushQueue); setTimeout(flushQueue, 2000);
  render();
}
if(typeof document!=='undefined' && document.getElementById('app')) boot();
if(typeof module!=='undefined') module.exports = { profile, scoreJobs, directionOf, fresh, encode, decode, aiPrompt, roleVerdict, setS:s=>{S=s;} };
