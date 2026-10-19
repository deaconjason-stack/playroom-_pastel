/* Small, dependency-free rules shared by Playroom Festival and its tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PlayroomFestival=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const FESTIVAL=['pocket-pinball','air-hockey','sky-hop','beat-bloom'];
 const TRAILS=[
  {id:'arcade',icon:'🚀',name:'Arcade All-Stars',description:'A pinball party, a space mission, then up into the clouds.',games:['pocket-pinball','space-defender','sky-hop'],color:'lilac'},
  {id:'family',icon:'💞',name:'Family Game Night',description:'Three friendly face-offs. Take turns or team up on one screen.',games:['tic-tac-toe','connect-four','air-hockey'],color:'peach'},
  {id:'discovery',icon:'🗺️',name:'Little Big Adventure',description:'Find hidden gems, putt through the clouds, and make music.',games:['treasure-quest','mini-golf','beat-bloom'],color:'mint'}
 ];
 const FRAMES=[{id:'cloud',icon:'☁️',name:'Cloud Club',need:0},{id:'peach',icon:'🌸',name:'Peach Glow',need:3},{id:'garden',icon:'🌼',name:'Star Garden',need:9},{id:'orbit',icon:'🪐',name:'Rainbow Orbit',need:18},{id:'royal',icon:'👑',name:'Arcade Royalty',need:30}];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const number=(n,max=10000000)=>Number.isFinite(Number(n))?clamp(Math.floor(Number(n)),0,max):0;
 const copy=s=>JSON.parse(JSON.stringify(s));
 function emptyDaily(day){return {day,rounds:0,wins:0,ids:[],festival:0}}
 function restore(raw,baseline,day,ids){
  let input={};try{input=typeof raw==='string'?JSON.parse(raw):raw||{};if(!input||typeof input!=='object'||Array.isArray(input))input={}}catch{}
  baseline=baseline||{};const known=new Set(ids),list=v=>Array.isArray(v)?[...new Set(v.filter(x=>known.has(x)))]:[];
  const s={version:1,mastery:{},favorites:list(input.favorites),recent:list(input.recent).slice(0,8),frame:'cloud',processed:Array.isArray(input.processed)?input.processed.filter(x=>typeof x==='string'&&x.length<256).slice(-500):[],daily:emptyDaily(day),activeTrail:null,trails:{}};
  for(const id of ids){const old=input.mastery?.[id]||{},played=Math.max(number(old.played),number(baseline.playsByGame?.[id]));if(!played)continue;const wins=Math.min(played,number(old.wins));s.mastery[id]={played,wins,best:Math.max(number(old.best),number(baseline.bests?.[id])),stars:Math.max(1,number(old.stars,3),wins>=3?3:wins>0?2:1)}}
  if(input.daily?.day===day){s.daily={day,rounds:number(input.daily.rounds),wins:number(input.daily.wins),ids:list(input.daily.ids),festival:number(input.daily.festival)}}
  for(const trail of TRAILS){const old=input.trails?.[trail.id]||{};s.trails[trail.id]={step:number(old.step,trail.games.length-1),completions:number(old.completions)}}
  if(TRAILS.some(t=>t.id===input.activeTrail))s.activeTrail=input.activeTrail;
  const selected=FRAMES.find(f=>f.id===input.frame);if(selected&&selected.need<=totalStars(s))s.frame=selected.id;
  return s;
 }
 function totalStars(s){return Object.values(s.mastery||{}).reduce((sum,m)=>sum+number(m.stars,3),0)}
 function missions(s){return [{id:'explorer',icon:'🧭',name:'World hopper',detail:'Finish 3 different games',value:s.daily.ids.length,target:3},{id:'winner',icon:'🏆',name:'Victory lap',detail:'Win 2 real rounds',value:s.daily.wins,target:2},{id:'festival',icon:'🎪',name:'Fresh discovery',detail:'Finish a new Festival game',value:s.daily.festival,target:1}].map(m=>({...m,complete:m.value>=m.target}))}
 function record(state,event,ids,day){
  if(!event||!ids.includes(event.id)||typeof event.token!=='string'||!event.token||event.token.length>=256||state.processed.includes(event.token))return {state,changed:false};
  const s=restore(state,{},day,ids),id=event.id,won=event.won===true,old=s.mastery[id]||{played:0,wins:0,best:0,stars:0},wins=old.wins+(won?1:0),explicit=won?number(event.meta?.stars,3):1;
  s.mastery[id]={played:old.played+1,wins,best:Math.max(old.best,number(event.score)),stars:Math.max(old.stars,1,won?2:1,wins>=3?3:0,explicit)};
  s.processed.push(event.token);s.processed=s.processed.slice(-500);s.recent=[id,...s.recent.filter(x=>x!==id)].slice(0,8);
  s.daily.rounds++;s.daily.wins+=won?1:0;if(!s.daily.ids.includes(id))s.daily.ids.push(id);s.daily.festival+=FESTIVAL.includes(id)?1:0;
  let trailCompleted=null,trailAdvanced=false;const trail=TRAILS.find(t=>t.id===s.activeTrail);
  if(trail&&trail.games[s.trails[trail.id].step]===id){trailAdvanced=true;s.trails[trail.id].step++;if(s.trails[trail.id].step===trail.games.length){trailCompleted=trail.id;s.trails[trail.id]={step:0,completions:s.trails[trail.id].completions+1};s.activeTrail=null}}
  return {state:s,changed:true,starGain:s.mastery[id].stars-old.stars,trailAdvanced,trailCompleted,missionsComplete:missions(s).every(m=>m.complete)};
 }
 function beginTrail(state,id){if(!TRAILS.some(t=>t.id===id))return {state,changed:false};const s=copy(state);s.activeTrail=id;return {state:s,changed:true}}
 function equip(state,id){const f=FRAMES.find(x=>x.id===id);if(!f||f.need>totalStars(state))return {state,changed:false};const s=copy(state);s.frame=id;return {state:s,changed:true}}
 function makeChart(bpm,beats,seed){
  bpm=clamp(Number(bpm)||112,60,180);beats=clamp(Math.floor(beats)||48,16,128);let n=Number(seed)>>>0;const rand=()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296};const chart=[];
  for(let i=0;i<beats;i++){const lane=Math.floor(rand()*4),time=(4+i)*60/bpm;chart.push({lane,time,hit:false});if(i>0&&i%8===7)chart.push({lane:(lane+2)%4,time,hit:false})}
  return chart.sort((a,b)=>a.time-b.time||a.lane-b.lane);
 }
 function judge(deltaMs,windowMs=150){const d=Math.abs(deltaMs);return d<=windowMs*.5?{name:'Perfect',points:100}:d<=windowMs?{name:'Good',points:60}:{name:'Miss',points:0}}
 function circleHit(ball,cx,cy,radius,restitution=1,boost=0){
  let dx=ball.x-cx,dy=ball.y-cy,d=Math.hypot(dx,dy),min=ball.r+radius;if(d>=min)return false;
  if(d<.00001){dx=-(ball.vx||1);dy=-(ball.vy||0);d=Math.hypot(dx,dy)}const nx=dx/d,ny=dy/d;
  ball.x=cx+nx*(min+.02);ball.y=cy+ny*(min+.02);const dot=ball.vx*nx+ball.vy*ny;
  if(dot<0){ball.vx-=(1+restitution)*dot*nx;ball.vy-=(1+restitution)*dot*ny}if(boost){ball.vx+=nx*boost;ball.vy+=ny*boost}
  const speed=Math.hypot(ball.vx,ball.vy);if(speed>1050){ball.vx*=1050/speed;ball.vy*=1050/speed}return true;
 }
 function segmentHit(ball,ax,ay,bx,by,thickness=4,boost=0){const dx=bx-ax,dy=by-ay,t=clamp(((ball.x-ax)*dx+(ball.y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return circleHit(ball,ax+t*dx,ay+t*dy,thickness,.9,boost)}
 function rinkStep(p,w,h,mouth,dt){
  const steps=Math.max(1,Math.ceil(Math.min(.1,dt)/.006)),delta=Math.min(.1,dt)/steps;
  for(let i=0;i<steps;i++){p.x+=p.vx*delta;p.y+=p.vy*delta;if(p.x<p.r){p.x=p.r;p.vx=Math.abs(p.vx)}if(p.x>w-p.r){p.x=w-p.r;p.vx=-Math.abs(p.vx)}
   const inGoal=p.x>w/2-mouth/2+p.r&&p.x<w/2+mouth/2-p.r;
   if(p.y<p.r&&!inGoal){p.y=p.r;p.vy=Math.abs(p.vy)}if(p.y>h-p.r&&!inGoal){p.y=h-p.r;p.vy=-Math.abs(p.vy)}
   if(p.y< -p.r&&inGoal)return 'player';if(p.y>h+p.r&&inGoal)return 'computer';
  }return null;
 }
 function landing(previous,next,platforms){if(next.vy<0)return null;return platforms.filter(p=>previous.y+previous.r<=p.y+.5&&next.y+next.r>=p.y&&next.x+next.r>p.x&&next.x-next.r<p.x+p.w).sort((a,b)=>a.y-b.y)[0]||null}
 return {FESTIVAL,TRAILS,FRAMES,restore,record,totalStars,missions,beginTrail,equip,makeChart,judge,circleHit,segmentHit,rinkStep,landing,clamp};
});
