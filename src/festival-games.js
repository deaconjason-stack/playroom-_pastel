/* Original Playroom Festival games. Everything runs locally; no downloaded media. */
(()=>{
 'use strict';
 const E=window.PlayroomFestival,$=id=>document.getElementById(id),clamp=E.clamp;
 const NEW=[['pocket-pinball','🎯','Pocket Pinball','Three balls, bouncy bumpers, flashing targets and real flippers.','retro'],['air-hockey','🏒','Glow Air Hockey','Quick puck rallies against the computer or a friend beside you.','sports'],['sky-hop','☁️','Sky Hop','Bounce through cloud gardens, collect stars, and climb higher.','adventure'],['beat-bloom','🎶','Beat Bloom','Four lanes, three original tracks, and a garden that grows with your rhythm.','retro']];
 const P={ink:'#493764',lilac:'#b5a0ed',pink:'#f2a4c4',mint:'#8dd6bf',yellow:'#f8d48d',blue:'#9cbff1',white:'#fffdfd'};
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const avatars={bunny:'🐰',cat:'🐱',robot:'🤖',astronaut:'👩‍🚀',unicorn:'🦄',dragon:'🐲'};
 function avatar(){try{return avatars[localStorage.getItem('playroom_avatar_v1')]||'🐰'}catch{return '🐰'}}
 let audio;
 function tone(frequency,duration=.12,type='sine',strength=.035,music=false){
  if(document.hidden||$(music?'musicToggle':'fxToggle')?.getAttribute('aria-pressed')!=='true')return;
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=audio||new C();if(audio.state==='suspended')audio.resume().catch(()=>{});const at=audio.currentTime,o=audio.createOscillator(),g=audio.createGain(),v=Number($('audioVol')?.value||0)/100;
   o.type=type;o.frequency.setValueAtTime(frequency,at);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(Math.max(.0001,v*strength),at+.009);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+duration+.02);
  }catch{}
 }
 function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function disc(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function text(c,s,x,y,size=18,color=P.ink){c.fillStyle=color;c.font='700 '+size+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y)}
 function particles(list,x,y,color,count=9){if(reduced())return;for(let n=0;n<count;n++)list.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.65)*220,life:.6+Math.random()*.35,color})}
 function drawParticles(c,list,dt){for(let n=list.length-1;n>=0;n--){const p=list[n];p.life-=dt;if(p.life<=0){list.splice(n,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;c.globalAlpha=Math.min(1,p.life*2);disc(c,p.x,p.y,3,p.color)}c.globalAlpha=1}
 function room(id,w,h,help,extra='',controls=''){
  const token=current.token;let active=true,started=false,paused=false,raf=0,last=0,elapsed=0,dtFrame=0,musicFocus=false;const cleaners=[];
  $('arena').innerHTML='<div class="festSettings"><label>Challenge <select id="festDifficulty"><option value="0">Cozy</option><option value="1" selected>Arcade</option><option value="2">Expert</option></select></label>'+extra+'<button type="button" class="festPauseBtn" id="festPause" disabled>Ⅱ Pause</button></div><div class="festHud" id="festHud" role="status" aria-live="off"></div><div class="festCanvasWrap" style="--board-ratio:'+w+'/'+h+'"><canvas id="festCanvas" width="'+w+'" height="'+h+'" tabindex="0" aria-label="'+NEW.find(g=>g[0]===id)[2]+' game board"></canvas><div class="festGameOverlay" id="festOverlay"><span class="festOverlayIcon">'+NEW.find(g=>g[0]===id)[1]+'</span><h3>Ready when you are.</h3><p>'+help+'</p><button type="button" class="action" id="festStart">Let’s play ↗</button></div><div class="festGameOverlay" id="festPaused" hidden><span class="festOverlayIcon">☁️</span><h3>Taking a little breather.</h3><p>Your game is paused.</p><button type="button" class="action" id="festResume">Resume play ▶</button></div></div><div class="festGameControls">'+controls+'</div><p class="festGameHelp">'+help+'</p><div class="festMasteryHint" id="festMasteryHint"></div>';
  const canvas=$('festCanvas'),c=canvas.getContext('2d');
  const api={canvas,c,width:w,height:h,get elapsed(){return elapsed},get dt(){return dtFrame},get playing(){return active&&started&&!paused},difficulty:1,onStart(){},update(){},draw(){},cleanup(){},
   listen(el,event,fn,opts){el.addEventListener(event,fn,opts);cleaners.push(()=>el.removeEventListener(event,fn,opts))},
   hud(html){if($('festHud'))$('festHud').innerHTML=html},
   hint(s){$('festMasteryHint').textContent=s},
   focusMusic(on){musicFocus=on;document.dispatchEvent(new CustomEvent('playroom:music-focus',{detail:on}))},
   point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*w/r.width,y:(event.clientY-r.top)*h/r.height}},
   complete(won,points,label,stars=won?2:1,stats=[]){if(!active)return;active=false;finish(id,won,Math.max(0,Math.round(points)),label,{stars,stats,difficulty:['Cozy','Arcade','Expert'][api.difficulty]})}
  };
  function pause(on){if(!active||!started)return;paused=on;$('festPaused').hidden=!on;$('festPause').textContent=on?'▶ Resume':'Ⅱ Pause';last=performance.now();if(on&&musicFocus)document.dispatchEvent(new CustomEvent('playroom:music-focus',{detail:true}));if(!on)canvas.focus({preventScroll:true})}
  $('festStart').onclick=()=>{if(started)return;api.difficulty=Number($('festDifficulty').value);started=true;$('festOverlay').hidden=true;$('festPause').disabled=false;document.querySelectorAll('.festSettings select').forEach(s=>s.disabled=true);last=performance.now();api.onStart();canvas.focus({preventScroll:true})};
  $('festPause').onclick=()=>pause(!paused);$('festResume').onclick=()=>pause(false);
  api.listen(document,'visibilitychange',()=>{if(document.hidden)pause(true)});
  api.listen(document,'keydown',e=>{if(e.key==='Escape'&&started&&active){e.preventDefault();pause(!paused)}});
  function frame(now){if(!active||current?.token!==token||current.done)return;const realDelta=Math.min(.25,Math.max(0,(now-last)/1000||0));dtFrame=Math.min(.033,realDelta);last=now;if(started&&!paused){elapsed+=realDelta;api.update(dtFrame,elapsed)}if(!active)return;api.draw(elapsed,paused?0:dtFrame);raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  stoppers.push(()=>{active=false;cancelAnimationFrame(raf);cleaners.forEach(fn=>fn());api.cleanup();if(musicFocus)document.dispatchEvent(new CustomEvent('playroom:music-focus',{detail:false}))});
  return api;
 }
 function keyControls(g,held,allowed){g.listen(document,'keydown',e=>{if(!g.playing||e.target.closest?.('input,select,textarea'))return;if(allowed.includes(e.code)){e.preventDefault();held.add(e.code)}});g.listen(document,'keyup',e=>held.delete(e.code));g.listen(window,'blur',()=>held.clear())}
 function heldButton(g,id,held,key){const el=$(id);if(!el)return;g.listen(el,'pointerdown',e=>{e.preventDefault();if(g.playing){held.add(key);el.setPointerCapture?.(e.pointerId)}});for(const event of ['pointerup','pointercancel','lostpointercapture'])g.listen(el,event,()=>held.delete(key))}

 function pinball(){
  const ID='pocket-pinball',g=room(ID,420,610,'Launch with Space or Launch ball. Hold A / ← for the left flipper and D / → for the right. Light all three bumpers for a score multiplier. Three balls per round.','', '<button id="festLeft" class="festTouch">← Left flipper</button><button id="festLaunch" class="action">Launch ball ↑</button><button id="festRight" class="festTouch">Right flipper →</button>');
  const c=g.c,held=new Set(),sparks=[],bumpers=[{x:134,y:174,r:29,color:P.pink,last:-10},{x:286,y:174,r:29,color:P.mint,last:-10},{x:210,y:276,r:35,color:P.lilac,last:-10}];let ball=null,balls=3,points=0,multi=1,lit=new Set(),cooldown=0,flash=0,trail=[];
  g.hint('Skill stars: finish a round ★ · score 1,500 ★★ · score 4,000 ★★★.');
  function hud(){g.hud('<span>🎯 '+points.toLocaleString()+'</span><span>● '+balls+' balls</span><span>✦ '+multi+'× multiplier</span>');score(points)}
  function launch(){if(!g.playing||ball||cooldown>0)return;ball={x:374,y:350,vx:-74-Math.random()*18,vy:-710,r:10};tone(440,.2,'triangle');$('festLaunch').disabled=true;trail=[]}
  keyControls(g,held,['ArrowLeft','ArrowRight','KeyA','KeyD','Space']);heldButton(g,'festLeft',held,'KeyA');heldButton(g,'festRight',held,'KeyD');$('festLaunch').onclick=launch;
  g.listen(document,'keydown',e=>{if(e.code==='Space'&&g.playing){e.preventDefault();launch()}});
  g.onStart=()=>{hud();$('festLaunch').disabled=false};
  g.update=(dt,t)=>{cooldown=Math.max(0,cooldown-dt);flash=Math.max(0,flash-dt);if(!ball)return;const left=held.has('KeyA')||held.has('ArrowLeft'),right=held.has('KeyD')||held.has('ArrowRight');
   for(let step=0;step<5;step++){const d=dt/5;ball.vy+=[315,365,420][g.difficulty]*d;ball.x+=ball.vx*d;ball.y+=ball.vy*d;
    if(ball.x<27){ball.x=27;ball.vx=Math.abs(ball.vx)*.92}if(ball.x>393){ball.x=393;ball.vx=-Math.abs(ball.vx)*.92}if(ball.y<28){ball.y=28;ball.vy=Math.abs(ball.vy)*.92}
    E.segmentHit(ball,30,392,100,492,7);E.segmentHit(ball,390,392,320,492,7);E.segmentHit(ball,32,500,122,551,6);E.segmentHit(ball,388,500,298,551,6);
    const flippers=[[120,551,199,left?521:571,left],[300,551,221,right?521:571,right]];
    for(const f of flippers){if(E.segmentHit(ball,...f.slice(0,4),9,f[4]?80:0)&&f[4]){ball.vy=-[490,540,570][g.difficulty];ball.vx+=(210-ball.x)*1.4;tone(660,.07)}}
    for(let i=0;i<bumpers.length;i++){const b=bumpers[i];if(E.circleHit(ball,b.x,b.y,b.r,1.03,t-b.last>.1?105:0)&&t-b.last>.1){b.last=t;points+=100*multi;lit.add(i);particles(sparks,b.x,b.y,b.color);tone([659,784,988][i]);if(lit.size===3){multi=Math.min(5,multi+1);lit.clear();points+=250;flash=.45}hud()}}
    if(ball.y>625){ball=null;balls--;cooldown=.7;lit.clear();hud();if(!balls){g.complete(points>=1500,points,points>=4000?'Pinball royalty!':'What a bumper party!',points>=4000?3:points>=1500?2:1,[points.toLocaleString()+' points',multi+'× best multiplier']);return}$('festLaunch').disabled=false;break}
   }
   if(ball){trail.push({x:ball.x,y:ball.y});if(trail.length>12)trail.shift()}
  };
  g.draw=(t,dt)=>{const bg=c.createLinearGradient(0,0,0,610);bg.addColorStop(0,'#f4edff');bg.addColorStop(1,'#ffe7ee');c.fillStyle=bg;c.fillRect(0,0,420,610);rounded(c,15,15,390,580,28,null,'#cdb5e5');c.lineWidth=3;
   for(let i=0;i<12;i++){const x=45+(i%4)*110,y=56+Math.floor(i/4)*130;text(c,i%2?'✧':'·',x,y,22,'#dac8ec')}
   text(c,'CLOUD NINE',210,65,25,P.ink);text(c,'PINBALL CLUB',210,95,12,'#8e78aa');
   for(let i=0;i<bumpers.length;i++){const b=bumpers[i],on=t-b.last<.16;disc(c,b.x,b.y,b.r+9,on?'#fff':'#fff9');disc(c,b.x,b.y,b.r,b.color);disc(c,b.x,b.y,b.r-8,on?'#fff':'#ffffff55');text(c,lit.has(i)?'✦':'✿',b.x,b.y,27,P.ink)}
   const rails=[[30,392,100,492],[390,392,320,492],[32,500,122,551],[388,500,298,551]];c.lineWidth=13;c.lineCap='round';c.strokeStyle='#a9c4e9';for(const a of rails){c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(a[2],a[3]);c.stroke()}
   const L=held.has('KeyA')||held.has('ArrowLeft'),R=held.has('KeyD')||held.has('ArrowRight');for(const f of [[120,551,199,L?521:571,L],[300,551,221,R?521:571,R]]){c.strokeStyle=f[4]?'#8f73d0':'#ed91b5';c.lineWidth=17;c.beginPath();c.moveTo(f[0],f[1]);c.lineTo(f[2],f[3]);c.stroke()}
   text(c,'✦  '+multi+'×  ✦',210,380,26);text(c,ball?'KEEP IT BOUNCING':balls===3?'LAUNCH YOUR FIRST BALL':'READY FOR ANOTHER?',210,435,12,'#8a739f');
   if(!reduced())trail.forEach((p,i)=>{c.globalAlpha=i/trail.length*.35;disc(c,p.x,p.y,7,P.lilac)});c.globalAlpha=1;if(ball){disc(c,ball.x+2,ball.y+4,11,'#89799e44');disc(c,ball.x,ball.y,10,'#fff','#bca6d4')}
   if(flash){c.fillStyle='#fff';c.globalAlpha=flash*.3;c.fillRect(0,0,420,610);c.globalAlpha=1}drawParticles(c,sparks,dt);
  };hud();
 }

 function airHockey(){
  const ID='air-hockey',g=room(ID,540,390,'Drag your pink paddle, or use arrow keys. First to 3 goals wins. Local duel: the top player uses W A S D or a second touch.', '<label>Opponent <select id="festOpponent"><option value="cpu">Computer</option><option value="local">Local two-player</option></select></label>','<button id="festHockeyLeft" class="festTouch">← Move left</button><button id="festHockeyRight" class="festTouch">Move right →</button>');
  const c=g.c,held=new Set(),sparks=[],puck={x:270,y:195,vx:155,vy:200,r:11},bottom={x:270,y:318,r:25,vx:0,vy:0},top={x:270,y:72,r:25,vx:0,vy:0},targets=new Map();let yours=0,theirs=0,reset=1,goalText='FIRST TO THREE',local=false,puckTrail=[],touching=false;
  g.hint('Skill stars: finish the match ★ · win ★★ · win with 0 or 1 goal conceded ★★★.');
  function hud(){g.hud('<span>🌸 You '+yours+'</span><span>FIRST TO 3</span><span>🌿 '+(local?'Friend ':'CPU ')+theirs+'</span>');score(yours*150)}
  keyControls(g,held,['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD']);heldButton(g,'festHockeyLeft',held,'ArrowLeft');heldButton(g,'festHockeyRight',held,'ArrowRight');
  function setTarget(e){if(!g.playing)return;const p=g.point(e);if(e.type==='pointerdown'){g.canvas.setPointerCapture?.(e.pointerId);targets.set(e.pointerId,local&&p.y<195?'top':'bottom')}let side=targets.get(e.pointerId);if(!side&&e.pointerType==='mouse'&&!local)side='bottom';if(!side)return;const paddle=side==='top'?top:bottom;const x=clamp(p.x,30,510),y=clamp(p.y,side==='top'?30:222,side==='top'?168:360);paddle.vx=clamp((x-paddle.x)*18,-650,650);paddle.vy=clamp((y-paddle.y)*18,-650,650);paddle.x=x;paddle.y=y;touching=true}
  g.listen(g.canvas,'pointerdown',setTarget);g.listen(g.canvas,'pointermove',setTarget);for(const ev of ['pointerup','pointercancel'])g.listen(g.canvas,ev,e=>{targets.delete(e.pointerId);touching=false});
  g.onStart=()=>{local=$('festOpponent').value==='local';hud()};
  function paddleCollision(p){const before=Math.hypot(puck.vx,puck.vy);if(E.circleHit(puck,p.x,p.y,p.r,1.02,45)){puck.vx+=p.vx*.35;puck.vy+=p.vy*.35;let speed=Math.hypot(puck.vx,puck.vy);if(speed<230){puck.vx*=230/(speed||1);puck.vy=(p===bottom?-1:1)*Math.max(150,Math.abs(puck.vy))}if(speed>760){puck.vx*=760/speed;puck.vy*=760/speed}particles(sparks,puck.x,puck.y,p===bottom?P.pink:P.mint,5);tone(before>400?880:659,.065)}}
  g.update=(dt,t)=>{const move=(p,left,right,up,down)=>{const x=p.x,y=p.y;if(held.has(left))p.x-=350*dt;if(held.has(right))p.x+=350*dt;if(held.has(up))p.y-=350*dt;if(held.has(down))p.y+=350*dt;p.x=clamp(p.x,30,510);p.y=clamp(p.y,p===top?30:222,p===top?168:360);if(x!==p.x||y!==p.y){p.vx=(p.x-x)/dt;p.vy=(p.y-y)/dt}else{p.vx*=.85;p.vy*=.85}};
   move(bottom,'ArrowLeft','ArrowRight','ArrowUp','ArrowDown');if(local)move(top,'KeyA','KeyD','KeyW','KeyS');else{const speed=[155,245,335][g.difficulty],tx=clamp(puck.x+(puck.vy<0?puck.vx*.14:0),32,508),ty=puck.y<200?clamp(puck.y-28,35,162):77;const x=top.x,y=top.y;top.x+=clamp(tx-top.x,-speed*dt,speed*dt);top.y+=clamp(ty-top.y,-speed*dt,speed*dt);top.vx=(top.x-x)/dt;top.vy=(top.y-y)/dt}
   if(reset>0){reset-=dt;if(reset<=0){puck.x=270;puck.y=195;puck.vx=(Math.random()-.5)*240;puck.vy=theirs>yours?190:-190}return}
   let goal=null;for(let i=0;i<4;i++){goal=E.rinkStep(puck,540,390,156,dt/4);if(goal)break;paddleCollision(bottom);paddleCollision(top)}
   if(goal){if(goal==='player')yours++;else theirs++;goalText=goal==='player'?'BEAUTIFUL GOAL!':'NICE SHOT!';tone(goal==='player'?988:330,.23,'triangle');particles(sparks,270,195,goal==='player'?P.pink:P.mint,22);hud();reset=1.35;puck.vx=puck.vy=0;puckTrail=[];if(yours>=3||theirs>=3){g.complete(yours>=3,yours*150+Math.max(0,3-theirs)*50,yours>=3?'Rink royalty!':'A great little face-off!',yours>=3?(theirs<=1?3:2):1,[yours+' – '+theirs+' final score',local?'Local two-player':'Against the computer']);return}}
   puckTrail.push({x:puck.x,y:puck.y});if(puckTrail.length>11)puckTrail.shift();
  };
  g.draw=(t,dt)=>{rounded(c,0,0,540,390,22,'#f5fbff');c.lineWidth=7;rounded(c,12,12,516,366,25,null,'#c9b9eb');c.strokeStyle='#d7c9ed';c.lineWidth=2;c.setLineDash([9,9]);c.beginPath();c.moveTo(18,195);c.lineTo(522,195);c.stroke();c.setLineDash([]);disc(c,270,195,56,null,'#d7c9ed');
   for(const y of [0,390]){rounded(c,192,y===0?0:377,156,13,5,y===0?P.pink:P.mint);c.globalAlpha=.2;disc(c,270,y,70,y===0?P.pink:P.mint);c.globalAlpha=1}
   for(const p of [top,bottom]){disc(c,p.x,p.y+5,28,'#85739822');disc(c,p.x,p.y,25,p===bottom?P.pink:P.mint,'#fff');disc(c,p.x,p.y,13,p===bottom?'#e681ac':'#5eb99e');disc(c,p.x-4,p.y-5,5,'#fff8')}
   if(!reduced())puckTrail.forEach((p,i)=>{c.globalAlpha=i/25;disc(c,p.x,p.y,8,P.lilac)});c.globalAlpha=1;disc(c,puck.x,puck.y+3,12,'#5e4c8022');disc(c,puck.x,puck.y,11,'#584a76','#fff');
   if(reset>0){rounded(c,138,164,264,62,18,'#fffffff2');text(c,goalText,270,195,18)}drawParticles(c,sparks,dt);
  };hud();
 }

 function skyHop(){
  const ID='sky-hop',g=room(ID,420,560,'Bounce automatically. Use ← →, A / D, or drag across the sky to steer. Catch stars and green spring clouds. You have three hearts, and there is no time limit.','', '<button id="festHopLeft" class="festTouch">← Float left</button><button id="festBankClimb" class="action" disabled>Finish climb ✓</button><button id="festHopRight" class="festTouch">Float right →</button>');
  const c=g.c,held=new Set(),sparks=[];let player,platforms,stars,camera=0,altitude=0,collected=0,hearts=3,target=null,highest=480,index=0,lastHud=-1,landings=0,restoreFlash=0;
  function reset(){player={x:210,y:430,vx:0,vy:-510,r:17};platforms=[{x:140,y:480,w:140,base:140,kind:'normal'}];stars=[];camera=0;highest=480;index=0;altitude=0;collected=0;hearts=3;target=null;generate()}
  function generate(){while(highest>camera-250){index++;highest-=80+(g.difficulty===2?15:0)+Math.random()*12;const w=[118,94,76][g.difficulty],x=35+Math.random()*(350-w),kind=index%7===0?'spring':index>4&&index%4===0?'moving':'normal';platforms.push({x,y:highest,w,base:x,kind,phase:Math.random()*6});if(index%2===0)stars.push({x:x+w/2,y:highest-34,taken:false})}}
  function hud(){g.hud('<span>☁️ '+Math.floor(altitude)+' m</span><span>⭐ '+collected+'</span><span aria-label="'+hearts+' hearts">'+ '♥'.repeat(hearts)+'</span>');score(Math.floor(altitude)+collected*75);$('festBankClimb').disabled=altitude<60}
  function complete(){g.complete(altitude>=150,altitude+collected*75,altitude>=400?'Head in the clouds!':'What a lovely little climb!',altitude>=400?3:altitude>=150?2:1,[Math.floor(altitude)+' meters climbed',collected+' stars collected',landings+' cloud landings'])}
  g.hint('Skill stars: finish a climb ★ · reach 150 m ★★ · reach 400 m ★★★.');keyControls(g,held,['ArrowLeft','ArrowRight','KeyA','KeyD']);heldButton(g,'festHopLeft',held,'ArrowLeft');heldButton(g,'festHopRight',held,'ArrowRight');
  const steer=e=>{if(!g.playing)return;if(e.type==='pointerdown')g.canvas.setPointerCapture?.(e.pointerId);if(e.type==='pointerdown'||e.buttons||e.pointerType==='mouse')target=g.point(e).x};g.listen(g.canvas,'pointerdown',steer);g.listen(g.canvas,'pointermove',steer);$('festBankClimb').onclick=()=>{if(g.playing&&altitude>=60)complete()};
  g.onStart=()=>{reset();hud()};
  g.update=(dt,t)=>{restoreFlash=Math.max(0,restoreFlash-dt);let direction=(held.has('ArrowRight')||held.has('KeyD')?1:0)-(held.has('ArrowLeft')||held.has('KeyA')?1:0);if(direction){target=null;player.vx=direction*[265,290,320][g.difficulty]}else if(target!==null)player.vx=clamp((target-player.x)*8,-300,300);else player.vx*=Math.pow(.82,dt*60);
   const previous={...player};player.x+=player.vx*dt;if(player.x< -17)player.x=437;if(player.x>437)player.x=-17;player.vy+=860*dt;player.y+=player.vy*dt;
   for(const p of platforms)if(p.kind==='moving')p.x=clamp(p.base+Math.sin(t*1.15+p.phase)*48,15,405-p.w);
   const landed=E.landing(previous,player,platforms);if(landed){player.y=landed.y-player.r;player.vy=landed.kind==='spring'?-650:-510;landings++;particles(sparks,player.x,player.y-camera,landed.kind==='spring'?P.mint:P.lilac,6);tone(landed.kind==='spring'?880:440,.09,'triangle')}
   altitude=Math.max(altitude,(430-player.y)/5);if(player.y<camera+225)camera=player.y-225;
   for(const s of stars){if(!s.taken&&Math.hypot(player.x-s.x,player.y-s.y)<32){s.taken=true;collected++;particles(sparks,s.x,s.y-camera,P.yellow,11);tone(988,.13)}}
   if(player.y>camera+600){hearts--;hud();if(!hearts)return complete();player={x:210,y:camera+360,vx:0,vy:-530,r:17};platforms.push({x:135,y:camera+425,w:150,base:135,kind:'normal'});restoreFlash=.8;target=null;tone(260,.2,'triangle')}
   generate();platforms=platforms.filter(p=>p.y<camera+650);stars=stars.filter(s=>s.y<camera+650);if(t-lastHud>.12){lastHud=t;hud()}
  };
  g.draw=(t,dt)=>{const bg=c.createLinearGradient(0,0,0,560);bg.addColorStop(0,'#e8e3ff');bg.addColorStop(.6,'#e6f2ff');bg.addColorStop(1,'#fff1f6');c.fillStyle=bg;c.fillRect(0,0,420,560);
   for(let i=0;i<9;i++){const x=(i*123+32)%470-25,y=((i*97-camera*.2)%650+650)%650-50;c.globalAlpha=.6;disc(c,x,y,28,'#fff');disc(c,x+32,y+3,36,'#fff');disc(c,x+65,y,23,'#fff')}c.globalAlpha=1;
   for(const p of platforms){const y=p.y-camera;if(y< -25||y>600)continue;const color=p.kind==='spring'?P.mint:p.kind==='moving'?P.lilac:'#fff';rounded(c,p.x,y+4,p.w,13,9,'#c7b7df44');rounded(c,p.x,y,p.w,13,9,color);disc(c,p.x+17,y,11,color);disc(c,p.x+p.w*.5,y-4,15,color);disc(c,p.x+p.w-16,y+1,10,color);if(p.kind!=='normal')text(c,p.kind==='spring'?'↑↑':'↔',p.x+p.w/2,y+2,14,P.ink)}
   for(const s of stars)if(!s.taken&&s.y-camera> -30&&s.y-camera<600)text(c,'✦',s.x,s.y-camera+(reduced()?0:Math.sin(t*3+s.x)*3),27,'#e7ae42');
   const py=player.y-camera;c.globalAlpha=restoreFlash>0?.6:1;disc(c,player.x,py+16,17,'#b9addb33');text(c,avatar(),player.x,py,38);c.globalAlpha=1;drawParticles(c,sparks,dt);
   if(altitude<15){rounded(c,91,54,238,48,18,'#ffffffe8');text(c,'THE SKY IS YOUR PLAYGROUND',210,78,12)}
  };reset();hud();
 }

 function beatBloom(){
  const ID='beat-bloom',g=room(ID,480,560,'Tap the four pads or press D F J K as notes reach the glowing line. Perfect timing grows your garden. Music and effects use your sound switches.', '<label>Track <select id="festTrack"><option value="0">Peach Pop · gentle</option><option value="1">Moonbeam Groove · bouncy</option><option value="2">Starlight Sprint · lively</option></select></label>', ['D','F','J','K'].map((k,i)=>'<button class="festRhythmPad lane'+i+'" data-rhythm-lane="'+i+'" aria-label="Tap rhythm lane '+k+'">'+['✿','✦','❋','✧'][i]+'<small>'+k+'</small></button>').join(''));
  const c=g.c,colors=[P.pink,P.lilac,P.mint,P.blue],songs=[{bpm:96,beats:48,seed:8},{bpm:112,beats:64,seed:26},{bpm:128,beats:72,seed:45}],melody=[523,659,784,659,587,698,880,784,659,784,988,784,587,698,784,659];let song=songs[0],chart=[],points=0,combo=0,bestCombo=0,misses=0,judgement='',judgementUntil=0,glows=[0,0,0,0],lastTap=[-1,-1,-1,-1],lastBeat=-1,flowers=0,windowMs=150,lastHud=-1;
  g.hint('Skill stars: finish a track ★ · 55% accuracy ★★ · 90% accuracy with a 12-note combo ★★★.');
  function hud(){const done=chart.filter(n=>n.hit).length;g.hud('<span>✦ '+points.toLocaleString()+'</span><span>🔥 '+combo+' combo</span><span>🌷 '+done+'/'+chart.length+' notes</span>');score(points)}
  function hit(lane){if(!g.playing||g.elapsed-lastTap[lane]<.075)return;lastTap[lane]=g.elapsed;const candidates=chart.filter(n=>!n.hit&&n.lane===lane).sort((a,b)=>Math.abs(a.time-g.elapsed)-Math.abs(b.time-g.elapsed)),n=candidates[0],result=n?E.judge((g.elapsed-n.time)*1000,windowMs):{name:'Find the beat',points:0};
   if(result.points){n.hit=result.name;points+=result.points;combo++;bestCombo=Math.max(bestCombo,combo);flowers=Math.floor(chart.filter(x=>x.hit&&x.hit!=='Miss').length/5);tone([523,659,784,988][lane],.11,'triangle');glows[lane]=.22}else{combo=0;glows[lane]=.08}judgement=result.name;judgementUntil=g.elapsed+.45;hud()
  }
  document.querySelectorAll('[data-rhythm-lane]').forEach(b=>g.listen(b,'pointerdown',e=>{e.preventDefault();hit(Number(b.dataset.rhythmLane))}));
  g.listen(g.canvas,'pointerdown',e=>{e.preventDefault();hit(clamp(Math.floor(g.point(e).x/120),0,3))});
  g.listen(document,'keydown',e=>{const lane=['KeyD','KeyF','KeyJ','KeyK'].indexOf(e.code);if(lane>=0&&g.playing&&!e.repeat&&!e.target.closest?.('input,select,textarea')){e.preventDefault();hit(lane)}});
  g.onStart=()=>{song=songs[Number($('festTrack').value)];chart=E.makeChart(song.bpm,song.beats,song.seed);windowMs=[210,150,110][g.difficulty];g.focusMusic(true);hud()};
  g.update=(dt,t)=>{for(let i=0;i<4;i++)glows[i]=Math.max(0,glows[i]-dt);for(const n of chart){if(!n.hit&&t-n.time>windowMs/1000){n.hit='Miss';misses++;combo=0;judgement='Keep the rhythm';judgementUntil=t+.28}}
   const beat=Math.floor(t*song.bpm/60);if(beat!==lastBeat){lastBeat=beat;tone(melody[beat%melody.length],.22,'triangle',.042,true);if(beat%2===0)tone([131,147,165,147][Math.floor(beat/8)%4],.32,'sine',.055,true);if(beat%4===0)tone(55,.1,'triangle',.055,true)}
   if(t-lastHud>.2){lastHud=t;hud()}if(t>chart[chart.length-1].time+.8){const accuracy=Math.round(points/(chart.length*100)*100),stars=accuracy>=90&&bestCombo>=12?3:accuracy>=55?2:1;g.complete(accuracy>=55,points,accuracy>=90?'Your garden is glowing!':'You made a little music!',stars,[accuracy+'% accuracy',bestCombo+' best combo',misses+' missed notes'])}
  };
  g.draw=(t)=>{rounded(c,0,0,480,560,20,'#f3edff');for(let i=0;i<4;i++){c.fillStyle=i%2?'#f5f0ff':'#fff6fa';c.fillRect(i*120,0,120,485);if(glows[i]){c.globalAlpha=glows[i]*2;c.fillStyle=colors[i];c.fillRect(i*120,0,120,485);c.globalAlpha=1}c.strokeStyle='#e3d9ee';c.beginPath();c.moveTo(i*120,0);c.lineTo(i*120,485);c.stroke();disc(c,i*120+60,460,31,'#fff',colors[i]);text(c,['D','F','J','K'][i],i*120+60,460,19,P.ink)}
   c.strokeStyle='#b69cdc';c.lineWidth=3;c.beginPath();c.moveTo(8,460);c.lineTo(472,460);c.stroke();
   const notes=chart.length?chart:[{lane:0,time:1.4},{lane:2,time:1.4},{lane:1,time:2.1},{lane:3,time:2.5}];for(const n of notes){if(n.hit)continue;const y=460-(n.time-t)*202;if(y< -35||y>490)continue;rounded(c,n.lane*120+24,y-15,72,29,13,colors[n.lane]);text(c,'✦',n.lane*120+60,y,19,'#fff')}
   rounded(c,0,493,480,67,0,'#dff1df');for(let i=0;i<Math.min(24,flowers);i++){const x=15+i*19,y=536-(i%3)*7;c.strokeStyle='#7fb592';c.lineWidth=2;c.beginPath();c.moveTo(x,559);c.lineTo(x,y);c.stroke();for(let k=0;k<5;k++)disc(c,x+Math.cos(k*Math.PI*2/5)*6,y+Math.sin(k*Math.PI*2/5)*6,5,colors[i%4]);disc(c,x,y,4,P.yellow)}
   if(judgementUntil>t){rounded(c,118,155,244,52,19,'#fffffff2');text(c,judgement,240,181,20,P.ink)}if(!chart.length)text(c,'LET YOUR LITTLE GARDEN GROW',240,83,14,'#9a80b3');
  };hud();
 }

 function install(){for(const def of NEW)if(!games.some(g=>g[0]===def[0]))games.push(def);Object.assign(runners,{'pocket-pinball':pinball,'air-hockey':airHockey,'sky-hop':skyHop,'beat-bloom':beatBloom})}
 window.PlayroomFestivalGames={games:NEW,install};
})();
