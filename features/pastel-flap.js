/* Playroom Pastel Flap v1 — original bird-and-pipes arcade game. */
'use strict';
(()=>{
  const ID='pastel-flap';
  function register(){
    if(typeof runners==='undefined'||typeof finish!=='function'||typeof stoppers==='undefined'){
      console.warn('Pastel Flap requires Playroom core');return;
    }
    runners[ID]=function startPastelFlap(){
      const box=document.getElementById('arena');
      if(!box)return;
      const isActive=()=>typeof current!=='undefined'&&current?.id===ID&&!current.done;
      box.innerHTML=`<div class="flapGame">
        <div class="flapHud"><span>🌟 Pipes <strong id="flapPassed">0</strong></span><span>🏅 Best <strong id="flapBest">0</strong></span><span>🎯 10 = golden star</span></div>
        <div class="flapBoard"><canvas id="flapCanvas" class="flapCanvas" width="390" height="510" role="img" aria-label="Pastel Flap: guide the little bird between columns by tapping or pressing Space"></canvas></div>
        <div class="flapControls"><button type="button" id="flapPrimary" class="flapPrimary">▶ Start flying</button><button type="button" id="flapPause" disabled>⏸ Pause</button><label for="flapDifficulty">Mode <select id="flapDifficulty"><option value="cozy">🌸 Cozy</option><option value="classic" selected>🐤 Classic</option><option value="zippy">⚡ Zippy</option></select></label></div>
        <p id="flapStatus" class="flapStatus" role="status" aria-live="polite">Ready for a little flight? 🐤</p>
        <p class="flapHowto">Tap the sky, press Space / ↑, or press FLAP. No timer. Avoid the columns and the ground. Sounds follow your FX toggle.</p></div>`;
      const cv=document.getElementById('flapCanvas'),ctx=cv.getContext('2d'),btn=document.getElementById('flapPrimary'),pauseBtn=document.getElementById('flapPause'),mode=document.getElementById('flapDifficulty'),status=document.getElementById('flapStatus'),passedEl=document.getElementById('flapPassed'),bestEl=document.getElementById('flapBest');
      if(!ctx){status.textContent='Canvas graphics are not available in this browser.';btn.disabled=true;return;}
      const W=390,H=510,GROUND=461,BX=104,BR=15,PW=64;
      let birdY=208,vel=0,pipes=[],distance=0,passed=0,running=false,paused=false,started=false,frame=0,lastTs=0,raf=0,best=0,finished=false;
      try{best=Number(bests?.[ID]||0)}catch{}
      bestEl.textContent=Math.round(best/10);
      const modes={cozy:{speed:1.72,gap:206,gravity:.265,impulse:-4.6},classic:{speed:2.18,gap:182,gravity:.32,impulse:-5.12},zippy:{speed:2.68,gap:158,gravity:.34,impulse:-5.32}};
      let chosen=modes.classic;
      const colors={cloud:'#ffffffed',pipe:'#b4eccd',side:'#83d0b2',pink:'#f7aaca',lavender:'#d5bbfb',yellow:'#ffe08f'};
      function roundRect(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
      function cloud(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=colors.cloud;for(const [px,py,r] of [[0,7,19],[-17,12,14],[18,12,15],[-2,-4,17]]){ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill()}ctx.restore()}
      function drawBird(){const wobble=running?Math.sin(frame*.16)*1.6:Math.sin(frame*.045)*5;ctx.save();ctx.translate(BX,birdY+wobble);ctx.rotate(Math.min(.85,Math.max(-.44,vel*.06)));ctx.fillStyle='#ffe994';ctx.beginPath();ctx.ellipse(0,0,19,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f6b1d0';ctx.beginPath();ctx.ellipse(-9,5,10,7,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(7,-5,6.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#594267';ctx.beginPath();ctx.arc(9,-5,2.9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffab7d';ctx.beginPath();ctx.moveTo(16,1);ctx.lineTo(29,5);ctx.lineTo(16,11);ctx.closePath();ctx.fill();ctx.fillStyle='#fff5fb';ctx.beginPath();ctx.ellipse(-8,-7,4,3,-.4,0,Math.PI*2);ctx.fill();ctx.restore()}
      function drawPipe(p){const upper=p.top,lower=p.top+p.gap;roundRect(p.x,-16,PW,upper+15,10,colors.pipe);roundRect(p.x-6,upper-19,PW+12,22,7,colors.side);roundRect(p.x,lower,PW,GROUND-lower+20,10,colors.pipe);roundRect(p.x-6,lower,PW+12,22,7,colors.side);ctx.fillStyle='#fff8';ctx.fillRect(p.x+9,0,5,Math.max(0,upper-19));ctx.fillRect(p.x+9,lower+25,5,Math.max(0,GROUND-lower-30));}
      function draw(){const sky=ctx.createLinearGradient(0,0,0,GROUND);sky.addColorStop(0,'#dfeeff');sky.addColorStop(.54,'#f6e5fd');sky.addColorStop(1,'#fff1e9');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        cloud(45-(distance*.17)%460,75,1.2);cloud(226-(distance*.1)%500,115,.83);cloud(430-(distance*.15)%470,55,.75);
        for(let i=0;i<4;i++){const x=(i*140-(distance*.22)%560+560)%560-75;ctx.fillStyle='#e4f6ed';ctx.beginPath();ctx.ellipse(x,453,94,44,0,Math.PI,Math.PI*2);ctx.fill()}
        for(const p of pipes)drawPipe(p);
        ctx.fillStyle='#ace8d0';ctx.fillRect(0,GROUND,W,H-GROUND);ctx.fillStyle='#89d7bb';ctx.fillRect(0,GROUND,W,7);for(let i=0;i<12;i++){const x=(i*44-(distance*.5)%528+528)%528-20;ctx.fillStyle=i%2?'#fff6af':'#f9acd3';ctx.beginPath();ctx.arc(x,484,3,0,Math.PI*2);ctx.fill()}
        drawBird();if(!running){ctx.fillStyle='#ffffffd9';roundRect(61,188,268,98,20,'#ffffffdf');ctx.textAlign='center';ctx.fillStyle='#7756a5';ctx.font='900 22px system-ui';ctx.fillText(paused?'⏸ Paused':started?'🐣 Keep smiling!':'🐤 Pastel Flap',195,225);ctx.font='650 14px system-ui';ctx.fillText(paused?'Tap Resume to continue':'Tap Start or the sky to flap',195,253)}
        if(passed>=10){roundRect(290,8,87,32,14,'#ffecaf');ctx.fillStyle='#7c579e';ctx.textAlign='center';ctx.font='800 13px system-ui';ctx.fillText('🌟 STAR!',333,29)}
      }
      function piped(){const gap=Math.max(chosen.gap-(passed>16?16:0),145);const minTop=58,maxTop=GROUND-gap-65;return {x:W+32,top:Math.round(minTop+Math.random()*(maxTop-minTop)),gap,scored:false}}
      function fx(t='flap') {const toggle=document.getElementById('fxToggle');if(toggle?.getAttribute('aria-pressed')!=='true')return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{const ac=window.__flapAudio||(window.__flapAudio=new AC());if(ac.state==='suspended')ac.resume().catch(()=>{});const osc=ac.createOscillator(),amp=ac.createGain(),now=ac.currentTime,volume=Math.min(.09,Math.max(0,Number(document.getElementById('audioVol')?.value||40)/100)*.08);osc.type='sine';osc.frequency.setValueAtTime(t==='score'?720:t==='crash'?180:470,now);osc.frequency.exponentialRampToValueAtTime(t==='crash'?90:t==='score'?950:680,now+.12);amp.gain.setValueAtTime(Math.max(.001,volume),now);amp.gain.exponentialRampToValueAtTime(.001,now+.15);osc.connect(amp);amp.connect(ac.destination);osc.start(now);osc.stop(now+.16)}catch{}}
      function live(){return isActive()&&!finished}
      function end(){if(!live())return;finished=true;running=false;cancelAnimationFrame(raf);fx('crash');const won=passed>=10;finish(ID,won,passed*10,won?'Golden wings! 🌟':'Keep those wings fluttering!')}
      function tick(ts){if(!running||!live())return;const dt=Math.min(2,Math.max(.4,(ts-(lastTs||ts-16.667))/16.667));lastTs=ts;frame+=dt;distance+=chosen.speed*dt;
        vel+=chosen.gravity*dt;birdY+=vel*dt;
        if(!pipes.length||pipes[pipes.length-1].x<W-225)pipes.push(piped());
        for(const p of pipes){p.x-=chosen.speed*dt;if(!p.scored&&p.x+PW<BX-BR){p.scored=true;passed++;passedEl.textContent=passed;if(typeof score==='function')score(passed*10);if(passed*10>best){best=passed*10;bestEl.textContent=passed}fx('score');status.textContent=passed>=10?'🌟 Golden star earned! Keep going!':'🌈 Beautiful flying!'}
          if(BX+BR-4>p.x&&BX-BR+4<p.x+PW&&(birdY-BR+5<p.top||birdY+BR-5>p.top+p.gap))return end()}
        pipes=pipes.filter(p=>p.x>-PW-20);
        if(birdY-BR<-3||birdY+BR>GROUND-1)return end();draw();raf=requestAnimationFrame(tick)
      }
      function begin(){if(!live()||started)return;chosen=modes[mode.value]||modes.classic;mode.disabled=true;started=true;running=true;paused=false;btn.textContent='🐤 FLAP!';pauseBtn.disabled=false;status.textContent='Flap gently between the pastel columns ✨';vel=chosen.impulse;lastTs=0;fx();raf=requestAnimationFrame(tick)}
      function flap(){if(!live()||paused)return;if(!started)return begin();if(!running)return;vel=chosen.impulse;fx()}
      function pause(){if(!live()||!started)return;if(running){running=false;paused=true;cancelAnimationFrame(raf);pauseBtn.textContent='▶ Resume';status.textContent='⏸ Take your time—your flight is saved until you leave the game.';draw()}else if(paused){paused=false;running=true;lastTs=0;pauseBtn.textContent='⏸ Pause';status.textContent='Fly, little bird! 🐤';raf=requestAnimationFrame(tick)}}
      const keyDown=e=>{if(!live())return;if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)flap()}if(e.code==='KeyP'){e.preventDefault();pause()}};
      const press=e=>{e.preventDefault();flap()};const onVisibility=()=>{if(document.hidden&&running)pause()};
      cv.addEventListener('pointerdown',press);btn.addEventListener('click',flap);pauseBtn.addEventListener('click',pause);document.addEventListener('keydown',keyDown);document.addEventListener('visibilitychange',onVisibility);
      stoppers.push(()=>{cancelAnimationFrame(raf);cv.removeEventListener('pointerdown',press);btn.removeEventListener('click',flap);pauseBtn.removeEventListener('click',pause);document.removeEventListener('keydown',keyDown);document.removeEventListener('visibilitychange',onVisibility)});
      draw();
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});else register();
})();
