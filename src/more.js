"use strict";
(()=>{
if(typeof games==="undefined"||typeof runners==="undefined"||typeof open!=="function"||typeof finish!=="function"||typeof score!=="function"){
 console.error("Playroom core game engine is not ready");return;
}
const $=id=>document.getElementById(id);
const newGames=[
 ["brick-breaker","🧱","Brick Breaker","Bounce the ball and clear a wall of pastel bricks."],
 ["fruit-catcher","🍓","Fruit Catcher","Move your basket and catch falling fruit."],
 ["math-dash","➕","Math Dash","Ten quick math puzzles. How many can you solve?"],
 ["mini-sudoku","🔢","Mini Sudoku","Fill a friendly 4×4 number puzzle."],
 ["sliding-tiles","🧩","Sliding Tiles","Put the tiles back in order."],
 ["odd-one-out","👀","Odd One Out","Find the one different emoji before time runs out."]
];
for(const g of newGames)if(!games.some(x=>x[0]===g[0]))games.push(g);
const cards=$("cards");
if(cards){const count=cards.querySelectorAll(".gameCard").length;cards.insertAdjacentHTML("beforeend",newGames.map((g,i)=>{
 const n=count+i;return '<article class="gameCard"><div class="gameIcon">'+g[1]+'</div><h3>'+g[2]+'</h3><p>'+g[3]+'</p><div class="cardBottom"><span>🏅 Best <strong id="cardbest'+n+'">'+(bests[g[0]]||0)+'</strong></span><button class="smallBtn" type="button" data-more-play="'+g[0]+'">Play ↗</button></div></article>';
 }).join(""));cards.querySelectorAll("[data-more-play]").forEach(b=>b.onclick=()=>open(b.dataset.morePlay));}
const badgeCount=document.querySelector("#games .count");if(badgeCount)badgeCount.textContent=games.length+" games • all free";
const randomButton=$("surprisePick");if(randomButton)randomButton.onclick=()=>{const g=games[Math.floor(Math.random()*games.length)];open(g[0]);};
const todayPick=()=>{const d=new Date(),seed=d.getFullYear()*400+(d.getMonth()+1)*31+d.getDate();return games[seed%games.length]};
const pick=todayPick();if($("dailyGameName"))$("dailyGameName").textContent=pick[2];if($("dailyGamePlay"))$("dailyGamePlay").onclick=()=>open(pick[0]);
function sparkle(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const colors=["#ffd0e8","#ded0ff","#b8ecd9","#ffe3a9","#bfd9ff"];
 for(let i=0;i<28;i++){const piece=document.createElement("i");piece.className="v3Confetti";piece.style.setProperty("--x",Math.random()*100+"vw");piece.style.setProperty("--c",colors[i%colors.length]);piece.style.setProperty("--dur",(2.1+Math.random()*1.6)+"s");piece.style.setProperty("--dx",((Math.random()-.5)*180)+"px");piece.style.setProperty("--r",(Math.random()*360)+"deg");document.body.appendChild(piece);setTimeout(()=>piece.remove(),4000)} }
let audioContext;
function sound(kind="tap"){
 const b=$("fxToggle");if(!b||b.getAttribute("aria-pressed")!=="true")return;
 const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
 try{if(!audioContext)audioContext=new Context();if(audioContext.state==="suspended")audioContext.resume().catch(()=>{});
 const notes=kind==="win"?[523,659,784,1046]:kind==="wrong"?[240,170]:kind==="catch"?[660,880]:kind==="tap"?[523]:[390,580];
 notes.forEach((freq,i)=>{const time=audioContext.currentTime+i*.07,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=kind==="wrong"?"triangle":"sine";osc.frequency.setValueAtTime(freq,time);gain.gain.setValueAtTime(0,time);let volume=Math.min(.1,(+( $("audioVol")?.value||40)/100)*.07);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+.16);osc.connect(gain);gain.connect(audioContext.destination);osc.start(time);osc.stop(time+.17)})
 }catch(e){console.warn("Sound effect skipped",e)}
}
function finishNew(id,won,points,msg){if(won){sound("win");sparkle()}else sound("wrong");finish(id,won,points,msg)}
function alive(id){return typeof current!=="undefined"&&current?.id===id&&!current.done}
function arena(s){$("arena").innerHTML=s}
function buttonSet(id,fn){document.querySelectorAll("[data-v3-"+id+"]").forEach(b=>b.onclick=()=>fn(b.dataset["v3"+id.charAt(0).toUpperCase()+id.slice(1)]))}

// Physics-based brick breaker: player controls the paddle with touch, mouse, or arrow keys.
runners["brick-breaker"]=()=>{
 const id="brick-breaker",W=580,H=365,pw=100,ph=13,rows=4,cols=8,bw=60,bh=21,gap=9,left=(W-cols*(bw+gap)+gap)/2;
 let pad=(W-pw)/2,ball={x:W/2,y:H-55,dx:2.8,dy:-3.5,r:8},bricks=Array.from({length:rows},()=>Array(cols).fill(true)),remaining=rows*cols,pts=0,raf=0,started=false,lastFrame=0;
 arena('<p>Move your paddle to keep the ball bouncing. Clear all 32 bricks!</p><canvas id="brickCanvas" class="v3Canvas" width="580" height="365" aria-label="Brick breaker board"></canvas><div class="v3Controls"><button class="action" id="brickStart">Start Brick Breaker</button><button class="v3Button" id="brickLeft">◀ Move left</button><button class="v3Button" id="brickRight">Move right ▶</button></div><p class="v3Tip">Drag or tap the board to move the paddle. Arrow keys also work.</p>');
 const cv=$("brickCanvas"),c=cv.getContext("2d");let held=0;
 function draw(){c.fillStyle="#f7f2ff";c.fillRect(0,0,W,H);const colors=["#edb9d6","#bdd8f2","#b2e7cf","#f9d5ac"];
  for(let r=0;r<rows;r++)for(let j=0;j<cols;j++)if(bricks[r][j]){c.fillStyle=colors[r];c.beginPath();c.roundRect(left+j*(bw+gap),44+r*(bh+gap),bw,bh,6);c.fill()}
  c.fillStyle="#7858bc";c.beginPath();c.roundRect(pad,H-26,pw,ph,8);c.fill();c.fillStyle="#ee88bd";c.beginPath();c.arc(ball.x,ball.y,ball.r,0,Math.PI*2);c.fill();}
 function movePad(e){if(!alive(id))return;const rect=cv.getBoundingClientRect();pad=Math.max(0,Math.min(W-pw,(e.clientX-rect.left)*W/rect.width-pw/2));if(!started)ball.x=pad+pw/2;draw()}
 cv.addEventListener("pointermove",movePad);cv.addEventListener("pointerdown",movePad);
 const keyHandler=e=>{if(!alive(id)||!(e.key==="ArrowLeft"||e.key==="ArrowRight"))return;e.preventDefault();pad=Math.max(0,Math.min(W-pw,pad+(e.key==="ArrowLeft"?-36:36)))};
 document.addEventListener("keydown",keyHandler);
 function setHeld(v){held=v}const l=$("brickLeft"),r=$("brickRight");for(const [b,v] of [[l,-1],[r,1]]){b.addEventListener("pointerdown",()=>setHeld(v));b.addEventListener("pointerup",()=>setHeld(0));b.addEventListener("pointerleave",()=>setHeld(0));b.onclick=()=>{pad=Math.max(0,Math.min(W-pw,pad+v*35));draw()}}
 function tick(t){if(!alive(id)||!started)return;if(!lastFrame)lastFrame=t;if(t-lastFrame>70)lastFrame=t;else if(t-lastFrame<14){raf=requestAnimationFrame(tick);return}else lastFrame=t;
  pad=Math.max(0,Math.min(W-pw,pad+held*7));ball.x+=ball.dx;ball.y+=ball.dy;
  if(ball.x<=ball.r||ball.x>=W-ball.r)ball.dx*=-1;if(ball.y<ball.r)ball.dy=Math.abs(ball.dy);
  if(ball.dy>0&&ball.y+ball.r>=H-26&&ball.y<H-10&&ball.x>=pad&&ball.x<=pad+pw){ball.dy=-Math.abs(ball.dy);ball.dx=Math.max(-5,Math.min(5,(ball.x-(pad+pw/2))/14));sound("tap")}
  outer:for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)if(bricks[row][col]){const x=left+col*(bw+gap),y=44+row*(bh+gap);if(ball.x+ball.r>=x&&ball.x-ball.r<=x+bw&&ball.y+ball.r>=y&&ball.y-ball.r<=y+bh){bricks[row][col]=false;remaining--;pts+=10;score(pts);ball.dy*=-1;sound("catch");break outer}}
  draw();if(remaining===0)return finishNew(id,true,pts,"All the bricks cleared!");if(ball.y>H+ball.r)return finishNew(id,false,pts,"Nice bouncing!");raf=requestAnimationFrame(tick)
 }
 $("brickStart").onclick=()=>{if(started)return;started=true;$("brickStart").hidden=true;raf=requestAnimationFrame(tick)};
 stoppers.push(()=>{cancelAnimationFrame(raf);cv.removeEventListener("pointermove",movePad);cv.removeEventListener("pointerdown",movePad);document.removeEventListener("keydown",keyHandler)});draw()
};

// Fruit Catcher: a timed arcade game, controlled by pointer or keyboard.
runners["fruit-catcher"]=()=>{
 const id="fruit-catcher",W=560,H=345,icons=["🍓","🍋","🍎","🍊","🍒","🍑"];
 let basketX=W/2,fruits=[],tickNo=0,seconds=30,caught=0,missed=0,running=false,raf=0,keysHeld=0;
 arena('<p>Catch delicious fruits! You have 30 seconds.</p><canvas id="fruitCanvas" class="v3Canvas" width="560" height="345" aria-label="Falling fruit game"></canvas><div class="v3Progress" id="fruitInfo">🍓 0 caught · ⏱ 30s</div><div class="v3Controls"><button id="fruitStart" class="action">Start Catching</button><button id="fruitLeft" class="v3Button">◀ Left</button><button id="fruitRight" class="v3Button">Right ▶</button></div><p class="v3Tip">Touch or drag on the board to position your basket.</p>');const cv=$("fruitCanvas"),ctx=cv.getContext("2d");
 function paintFrame(){ctx.fillStyle="#f5f9ff";ctx.fillRect(0,0,W,H);ctx.font="32px sans-serif";for(const f of fruits)ctx.fillText(f.icon,f.x-16,f.y+12);ctx.fillStyle="#9171c2";ctx.beginPath();ctx.roundRect(basketX-52,H-38,104,29,13);ctx.fill();ctx.font="23px sans-serif";ctx.fillText("🧺",basketX-14,H-13);}
 function updatePointer(e){const r=cv.getBoundingClientRect();basketX=Math.max(55,Math.min(W-55,(e.clientX-r.left)*W/r.width));paintFrame()}
 cv.addEventListener("pointerdown",updatePointer);cv.addEventListener("pointermove",updatePointer);
 const k=e=>{if(!alive(id))return;if(["ArrowLeft","ArrowRight"].includes(e.key)){e.preventDefault();basketX=Math.max(55,Math.min(W-55,basketX+(e.key==="ArrowLeft"?-35:35)))}};
 document.addEventListener("keydown",k);
 for(const [s,v] of [["fruitLeft",-1],["fruitRight",1]])$(s).onclick=()=>{basketX=Math.max(55,Math.min(W-55,basketX+v*55));paintFrame()};
 function frame(){if(!alive(id)||!running)return;tickNo++;if(tickNo%27===0)fruits.push({x:30+Math.random()*(W-60),y:-20,speed:2.1+Math.random()*2,icon:icons[Math.floor(Math.random()*icons.length)]});fruits=fruits.filter(f=>{f.y+=f.speed;if(f.y>=H-42&&f.y<=H-10&&Math.abs(f.x-basketX)<57){caught++;sound("catch");score(caught*10);return false}if(f.y>H+20){missed++;return false}return true});$("fruitInfo").textContent="🍓 "+caught+" caught · ⏱ "+seconds+"s";paintFrame();raf=requestAnimationFrame(frame)}
 $("fruitStart").onclick=()=>{if(running)return;running=true;$("fruitStart").hidden=true;raf=requestAnimationFrame(frame);every(()=>{seconds--;if(seconds<=0){running=false;finishNew(id,caught>=10,caught*10,caught>=10?"Fruit basket champion!":"Sweet catching!")}},1000)};
 stoppers.push(()=>{cancelAnimationFrame(raf);cv.removeEventListener("pointerdown",updatePointer);cv.removeEventListener("pointermove",updatePointer);document.removeEventListener("keydown",k)});paintFrame()
};

// Math Dash: finite ten-question round, with correct-choice feedback.
runners["math-dash"]=()=>{
 const id="math-dash";let i=0,correct=0,remaining=90,locked=false,timerOn=false;
 arena('<div class="v3Progress"><span id="mathProgress">Question 1 of 10</span><span id="mathTimer">⏱ 90 seconds</span><span id="mathRight">⭐ 0 correct</span></div><h2 id="mathQuestion" class="v3Question"></h2><div id="mathAnswers" class="v3Answers"></div><p id="mathFeedback" class="v3Info" aria-live="polite"></p>');
 function question(){let op=Math.floor(Math.random()*3),a,b,ans,sign;if(op===0){a=1+Math.floor(Math.random()*25);b=1+Math.floor(Math.random()*25);ans=a+b;sign="+"}else if(op===1){a=5+Math.floor(Math.random()*30);b=Math.floor(Math.random()*(a+1));ans=a-b;sign="−"}else{a=2+Math.floor(Math.random()*10);b=2+Math.floor(Math.random()*9);ans=a*b;sign="×"}const choices=new Set([ans]);while(choices.size<3){let guess=ans+Math.floor(Math.random()*19)-9;if(guess>=0&&guess!==ans)choices.add(guess)}return {text:a+" "+sign+" "+b+" = ?",answer:ans,choices:[...choices].sort(()=>Math.random()-.5)}}
 let q;function draw(){q=question();locked=false;$("mathProgress").textContent="Question "+(i+1)+" of 10";$("mathQuestion").textContent=q.text;$("mathFeedback").textContent="Choose the right answer!";$("mathAnswers").innerHTML=q.choices.map(n=>'<button data-val="'+n+'">'+n+'</button>').join("");$("mathAnswers").querySelectorAll("button").forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const good=+b.dataset.val===q.answer;if(good){correct++;sound("catch")}else sound("wrong");score(correct*10);$("mathRight").textContent="⭐ "+correct+" correct";$("mathFeedback").textContent=good?"✅ Nicely done!":"Almost! The answer is "+q.answer;$("mathAnswers").innerHTML='<button id="mathNext" class="action">'+(i===9?"See score":"Next question →")+'</button>';$("mathNext").onclick=()=>{i++;if(i>=10)finishNew(id,correct>=7,correct*10,correct>=7?"Math superstar!":"Keep growing your math skills!");else draw()}})}draw();every(()=>{if(!alive(id))return;remaining--;$("mathTimer").textContent="⏱ "+remaining+" seconds";if(remaining<=0)finishNew(id,correct>=7,correct*10,"Time's up! Nice effort!")},1000)
};

// A uniquely solvable 4-by-4 Sudoku generated by removing cells from a valid solution.
runners["mini-sudoku"]=()=>{
 const id="mini-sudoku",s=[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1],map=[1,2,3,4].sort(()=>Math.random()-.5);let solved=s.map(x=>map[x-1]);const swapRow=(a,b)=>{for(let c=0;c<4;c++)[solved[a*4+c],solved[b*4+c]]=[solved[b*4+c],solved[a*4+c]]};const swapCol=(a,b)=>{for(let r=0;r<4;r++)[solved[r*4+a],solved[r*4+b]]=[solved[r*4+b],solved[r*4+a]]};if(Math.random()<.5)swapRow(0,1);if(Math.random()<.5)swapRow(2,3);if(Math.random()<.5)swapCol(0,1);if(Math.random()<.5)swapCol(2,3);
 const choices=(board,index)=>{const row=Math.floor(index/4),col=index%4,used=new Set();for(let i=0;i<4;i++){used.add(board[row*4+i]);used.add(board[i*4+col])}const br=Math.floor(row/2)*2,bc=Math.floor(col/2)*2;for(let r=br;r<br+2;r++)for(let c=bc;c<bc+2;c++)used.add(board[r*4+c]);return [1,2,3,4].filter(n=>!used.has(n))};
 function solutions(board){let count=0;function rec(){if(count>=2)return;let best=-1,opts=null;for(let i=0;i<16;i++)if(board[i]===0){const x=choices(board,i);if(!x.length)return;if(!opts||x.length<opts.length){best=i;opts=x}}if(best<0){count++;return}for(const v of opts){board[best]=v;rec();board[best]=0;if(count>=2)return}}rec();return count}
 let puzzle=solved.slice(),idx=Array.from({length:16},(_,i)=>i).sort(()=>Math.random()-.5),removed=0;for(const i of idx){const prev=puzzle[i];puzzle[i]=0;if(solutions(puzzle.slice())!==1)puzzle[i]=prev;else removed++;if(removed>=8)break}const fixed=puzzle.map(v=>v!==0),user=puzzle.slice();let hints=0,moveCount=0;
 arena('<p>Each row, column, and 2×2 square needs the digits 1, 2, 3, and 4.</p><div class="v3Board sudokuBoard" id="sudoku"></div><div id="sudokuInfo" class="v3Info"></div><div class="v3Controls"><button class="v3Button" id="sudokuHint">💡 Use hint (2)</button><button class="action" id="sudokuCheck">Check puzzle</button></div><p class="v3Tip">Tap an empty square to cycle 1 → 2 → 3 → 4 → blank.</p>');
 function draw(){if(!$("sudoku"))return;$("sudoku").innerHTML=user.map((v,i)=>'<button data-cell="'+i+'" '+(fixed[i]?"disabled":"")+' class="v3Tile '+(fixed[i]?"fixed":v?"userFilled":"")+'" aria-label="Row '+(Math.floor(i/4)+1)+' column '+(i%4+1)+' '+(v||"blank")+'">'+(v||"·")+'</button>').join("");$("sudokuInfo").textContent="Filled "+user.filter(Boolean).length+" of 16 squares · Hints used: "+hints;$("sudoku").querySelectorAll("button:not(:disabled)").forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;user[i]=(user[i]+1)%5;moveCount++;sound("tap");draw()})}
 $("sudokuHint").onclick=()=>{if(hints>=2)return;const spots=user.map((v,i)=>!fixed[i]&&v!==solved[i]?i:-1).filter(i=>i>=0);if(!spots.length)return;const i=spots[Math.floor(Math.random()*spots.length)];user[i]=solved[i];fixed[i]=true;hints++;$("sudokuHint").textContent="💡 Use hint ("+(2-hints)+")";if(hints===2)$("sudokuHint").disabled=true;sound("catch");draw()};
 $("sudokuCheck").onclick=()=>{if(user.every((v,i)=>v===solved[i])){let pts=Math.max(30,180-moveCount*3-hints*25);finishNew(id,true,pts,"Sudoku solved!")}else{sound("wrong");notice("Not quite! Check the rows, columns and blocks")}};
 draw()
};

// Sliding puzzle: generate a solvable scramble using legal moves, never random shuffling.
runners["sliding-tiles"]=()=>{
 const id="sliding-tiles";let b=[1,2,3,4,5,6,7,8,0],moves=0,last=-1;
 const neighbors=i=>{const r=Math.floor(i/3),c=i%3,out=[];if(r>0)out.push(i-3);if(r<2)out.push(i+3);if(c>0)out.push(i-1);if(c<2)out.push(i+1);return out};
 for(let k=0;k<75;k++){let blank=b.indexOf(0),opts=neighbors(blank).filter(n=>n!==last);let choose=opts[Math.floor(Math.random()*opts.length)];[b[blank],b[choose]]=[b[choose],b[blank]];last=blank}
 if(b.every((v,i)=>v===(i+1)%9))[b[7],b[8]]=[b[8],b[7]];
 arena('<p>Slide a neighboring tile into the empty square until the numbers read 1 through 8.</p><div id="sliderBoard" class="v3Board slideBoard"></div><div id="sliderCount" class="v3Info"></div><p class="v3Tip">Tip: work from the top row down. Every generated puzzle is solvable.</p>');
 function draw(){$("sliderBoard").innerHTML=b.map((n,i)=>'<button class="v3Tile '+(n===0?"empty":"")+'" data-pos="'+i+'" '+(n===0?"disabled":"")+'>'+ (n===0?"":n)+'</button>').join("");$("sliderCount").textContent="Moves: "+moves;$("sliderBoard").querySelectorAll("button:not(:disabled)").forEach(el=>el.onclick=()=>{const i=+el.dataset.pos,blank=b.indexOf(0);if(!neighbors(blank).includes(i)){notice("Choose a tile next to the empty space");return}[b[blank],b[i]]=[b[i],b[blank]];moves++;sound("tap");score(Math.max(10,300-moves*3));if(b.every((v,k)=>v===(k+1)%9))return finishNew(id,true,Math.max(20,300-moves*3),"Puzzle complete!");draw()})}draw()
};

// Spot the different emoji: a five-round visual observation game with a minute timer.
runners["odd-one-out"]=()=>{
 const id="odd-one-out",pairs=[["🐱","🐶"],["🍎","🍏"],["🌸","🌼"],["🦋","🐝"],["🍋","🍊"],["🌙","⭐"],["🐸","🐢"],["🎈","🎁"],["🐰","🐼"],["🍉","🍓"],["☀️","🌈"],["🦄","🐴"]];let round=0,sec=60,found=0,mistakes=0,odd=0;
 arena('<p>Spot the ONE emoji that is different! Find five in sixty seconds.</p><div id="oddInfo" class="v3Progress"></div><div class="v3Board spotBoard" id="oddBoard"></div><div id="oddFeedback" class="v3Info" aria-live="polite"></div>');
 function render(){if(!$("oddBoard"))return;const pair=pairs[Math.floor(Math.random()*pairs.length)],swapped=Math.random()<.5?pair:pair.slice().reverse();odd=Math.floor(Math.random()*25);$("oddBoard").innerHTML=Array.from({length:25},(_,i)=>'<button class="v3Tile" data-index="'+i+'" aria-label="Emoji '+(i+1)+'">'+(i===odd?swapped[1]:swapped[0])+'</button>').join("");$("oddFeedback").textContent="Which one is different?";updateInfo();$("oddBoard").querySelectorAll("button").forEach(el=>el.onclick=()=>{if(!alive(id))return;if(+el.dataset.index===odd){found++;round++;sound("catch");score(found*20);if(round>=5)return finishNew(id,true,found*20,"Sharp eyes! All five found!");render()}else{mistakes++;sound("wrong");sec=Math.max(1,sec-3);$("oddFeedback").textContent="Try another tile! (−3 seconds)";updateInfo()}})}
 function updateInfo(){if($("oddInfo"))$("oddInfo").textContent="🔍 Found: "+found+" / 5 · ⏱ "+sec+" seconds"}render();every(()=>{sec--;updateInfo();if(sec<1)finishNew(id,false,found*20,"Great spotting! Try again!")},1000)
};
console.info("Playroom expanded to "+games.length+" games; previous games and audio controls kept intact.");
})();
