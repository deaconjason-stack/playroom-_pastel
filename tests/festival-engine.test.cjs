'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {existsSync} = require('node:fs');
const path = require('node:path');
const ids = ['snake','memory-match','bubble-pop','tic-tac-toe','connect-four','air-hockey','sky-hop','pocket-pinball','beat-bloom','space-defender','word-scramble','treasure-quest','mini-golf'];
const fresh = () => engine().restore(null, {playsByGame:{snake:2}, bests:{snake:120}}, '2026-10-18', ids);
function engine(){const file=path.join(__dirname,'../src/festival-engine.js');assert.ok(existsSync(file),'The Festival progression and physics engine is implemented');return require(file)}
const round=(token,id='air-hockey',won=true)=>({token,id,won,score:250,meta:{}});

test('existing game history becomes mastery without changing the old rewards object',()=>{
 const old={playsByGame:{snake:2},bests:{snake:120},coins:135};const before=JSON.stringify(old);
 const s=engine().restore(null,old,'2026-10-18',ids);
 assert.equal(s.mastery.snake.played,2);assert.equal(s.mastery.snake.stars,1);assert.equal(s.mastery.snake.best,120);
 assert.equal(JSON.stringify(old),before);assert.equal(s.frame,'cloud');
});
test('the same completed round cannot award mastery or advance missions twice',()=>{
 const E=engine(),s=fresh();const one=E.record(s,round('round-1'),ids,'2026-10-18');
 const twice=E.record(one.state,round('round-1'),ids,'2026-10-18');
 assert.equal(one.changed,true);assert.equal(twice.changed,false);assert.deepEqual(twice.state,one.state);
 assert.equal(one.state.daily.rounds,1);assert.equal(one.state.mastery['air-hockey'].wins,1);
});
test('three wins earn a third skill star and losses never erase mastery',()=>{
 const E=engine();let s=fresh();for(let n=0;n<3;n++)s=E.record(s,round('win-'+n),ids,'2026-10-18').state;
 assert.equal(s.mastery['air-hockey'].stars,3);s=E.record(s,round('loss','air-hockey',false),ids,'2026-10-18').state;
 assert.equal(s.mastery['air-hockey'].stars,3);assert.equal(s.mastery['air-hockey'].played,4);
});
test('missions count different games, wins and actual Festival completions',()=>{
 const E=engine();let s=fresh();for(const [i,id] of ['snake','snake','air-hockey'].entries())s=E.record(s,round('mission-'+i,id),ids,'2026-10-18').state;
 let m=E.missions(s);assert.equal(m.find(x=>x.id==='explorer').value,2);assert.equal(m.find(x=>x.id==='festival').complete,true);
 s=E.record(s,round('mission-3','beat-bloom'),ids,'2026-10-18').state;
 assert.equal(E.missions(s).every(x=>x.complete),true);
});
test('a new day resets mini missions while preserving earned stars, favorites and trail progress',()=>{
 const E=engine();let s=fresh();s.favorites=['snake'];s=E.beginTrail(s,'arcade').state;s=E.record(s,round('trail-1','pocket-pinball'),ids,'2026-10-18').state;
 const restored=E.restore(JSON.stringify(s),{},'2026-10-19',ids);
 assert.equal(restored.daily.rounds,0);assert.deepEqual(restored.favorites,['snake']);assert.equal(restored.trails.arcade.step,1);
 assert.equal(restored.mastery['pocket-pinball'].stars,2);
});
test('a trail advances only for its next game and completes once after all three games',()=>{
 const E=engine();let s=E.beginTrail(fresh(),'arcade').state;
 s=E.record(s,round('wrong','sky-hop'),ids,'2026-10-18').state;assert.equal(s.trails.arcade.step,0);
 for(const [i,id] of E.TRAILS.find(x=>x.id==='arcade').games.entries())s=E.record(s,round('path-'+i,id),ids,'2026-10-18').state;
 assert.equal(s.trails.arcade.completions,1);assert.equal(s.activeTrail,null);assert.equal(s.trails.arcade.step,0);
});
test('damaged or forged local storage is repaired and unknown game identifiers are ignored',()=>{
 const E=engine();const s=E.restore('{broken',{},'2026-10-18',ids);assert.equal(s.daily.rounds,0);
 const bad=E.restore(JSON.stringify({frame:'royal',favorites:['snake','<script>','snake'],mastery:{snake:{played:1,stars:900,wins:-5,best:null}}}),{},'2026-10-18',ids);
 assert.deepEqual(bad.favorites,['snake']);assert.equal(bad.frame,'cloud');assert.ok(bad.mastery.snake.stars<=3);
 assert.equal(E.record(s,round('unknown','missing-game'),ids,'2026-10-18').changed,false);
});
test('cosmetic frames unlock at earned star thresholds and cannot be equipped early',()=>{
 const E=engine();let s=fresh();assert.equal(E.equip(s,'royal').changed,false);
 for(const [i,id] of ['air-hockey','beat-bloom','sky-hop'].entries())s=E.record(s,{...round('star-'+i,id),meta:{stars:3}},ids,'2026-10-18').state;
 assert.equal(E.totalStars(s),10);assert.equal(E.equip(s,'garden').changed,true);
 assert.equal(E.equip(s,'royal').changed,false);
});
test('rhythm charts repeat for the same song and seed and allow enough time between notes in one lane',()=>{
 const E=engine(),chart=E.makeChart(112,64,42);
 assert.deepEqual(chart,E.makeChart(112,64,42));assert.ok(chart.length>=64);
 assert.equal(new Set(chart.map(n=>n.lane)).size,4);
 for(const lane of [0,1,2,3]){const notes=chart.filter(n=>n.lane===lane);for(let i=1;i<notes.length;i++)assert.ok(notes[i].time-notes[i-1].time>=.2)}
 assert.equal(E.judge(35,150).name,'Perfect');assert.equal(E.judge(-115,150).points,60);assert.equal(E.judge(151,150).points,0);
});
test('every rhythm note lands on the same beat grid as the audible soundtrack',()=>{
 const E=engine();for(const bpm of [96,112,128]){const chart=E.makeChart(bpm,64,9);assert.ok(chart[0].time>=4*60/bpm);for(const note of chart){const beat=note.time*bpm/60;assert.ok(Math.abs(beat-Math.round(beat))<1e-8,'note at '+note.time+'s must land on a '+bpm+' BPM beat')}}
});
test('bumper collisions move a ball out of overlap and reflect an approaching ball',()=>{
 const b={x:10,y:0,vx:-100,vy:0,r:5};assert.equal(engine().circleHit(b,0,0,10,1,0),true);
 assert.ok(b.x>=15);assert.ok(b.vx>0);assert.ok(Number.isFinite(b.vy));
 const away={x:10,y:0,vx:100,vy:0,r:5};engine().circleHit(away,0,0,10,1,0);assert.equal(away.vx,100);
});
test('a hockey goal requires crossing the goal line inside the mouth',()=>{
 const E=engine(),outside={x:30,y:13,vx:0,vy:-500,r:10};assert.equal(E.rinkStep(outside,540,380,150,.05),null);assert.ok(outside.vy>0);
 const inside={x:270,y:13,vx:0,vy:-500,r:10};assert.equal(E.rinkStep(inside,540,380,150,.1),'player');
});
test('fast falling players land on a crossed platform but cannot land while rising',()=>{
 const E=engine(),platforms=[{x:100,y:180,w:90},{x:100,y:220,w:90}];
 assert.equal(E.landing({x:130,y:140,r:15},{x:130,y:230,r:15,vy:500},platforms),platforms[0]);
 assert.equal(E.landing({x:130,y:230,r:15},{x:130,y:140,r:15,vy:-500},platforms),null);
 assert.equal(E.landing({x:20,y:140,r:15},{x:20,y:230,r:15,vy:500},platforms),null);
});
