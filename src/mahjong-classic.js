/* Playroom Classic Mahjong Solitaire: authentic 144-tile, layered turtle-style game. */
'use strict';
(() => {
 const ID='mahjong-solitaire';
 const BOARD_W=748, BOARD_H=625, CW=54, CH=66, TILE_W=49, TILE_H=61;
 const SUITS=[['Characters',0x1F007],['Bamboo',0x1F010],['Dots',0x1F019]];
 const COMMON=[];
 for (const [suit,start] of SUITS) for(let number=1;number<=9;number++) COMMON.push({key:suit+'-'+number,face:String.fromCodePoint(start+number-1),name:suit+' '+number,kind:suit});
 for(let i=0;i<4;i++) COMMON.push({key:'wind-'+i,face:String.fromCodePoint(0x1F000+i),name:['East wind','South wind','West wind','North wind'][i],kind:'Wind'});
 for(let i=0;i<3;i++) COMMON.push({key:'dragon-'+i,face:String.fromCodePoint(0x1F004+i),name:['Red dragon','Green dragon','White dragon'][i],kind:'Dragon'});
 const FLOWERS=Array.from({length:4},(_,i)=>({key:'flower',face:String.fromCodePoint(0x1F022+i),name:['Plum flower','Orchid flower','Chrysanthemum flower','Bamboo flower'][i],kind:'Flower'}));
 const SEASONS=Array.from({length:4},(_,i)=>({key:'season',face:String.fromCodePoint(0x1F026+i),name:['Spring','Summer','Autumn','Winter'][i],kind:'Season'}));
 const rng=(n)=>Math.floor(Math.random()*n),shuffle=(a)=>{for(let i=a.length-1;i>0;i--){let j=rng(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
 function layout(){const cells=[];function add(z,row,col,offsetX=0,offsetY=0){let x=(col+1)*CW+offsetX,zshift=z*3,y=(row+0.75)*CH+offsetY;cells.push({id:cells.length,z,row,col,x:x+zshift,y:y-zshift,removed:false,def:null});}
  // Turtle-like silhouette: base has a stepped shell, central raised stack, head/tail on the sides.
  for(let row=0;row<8;row++)for(let col=0;col<12;col++){if((row===0||row===7)&&(col===0||col===11))continue;add(0,row,col)}
  for(let row of [3,4]){add(0,row,-1);add(0,row,12)} // Four protruding turtle-shell tiles
  for(let row=2;row<6;row++)for(let col=2;col<10;col++)add(1,row,col,0,0);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)add(2,row+2.5,col+4);
  for(let row=3;row<5;row++)for(let col=5;col<7;col++)add(3,row,col);
  if(cells.length!==144)throw Error('Mahjong layout must have exactly 144 tiles; got '+cells.length);
  return cells;
 }
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+TILE_W,b.x+TILE_W)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+TILE_H,b.y+TILE_H)-Math.max(a.y,b.y));
 function free(tile,cells,alive){if(!alive.has(tile.id))return false;
  // The tile may not have anything resting on it, even partially.
  for(const x of cells){if(x.z>tile.z&&alive.has(x.id)&&overlap(tile,x)>TILE_W*TILE_H*.05)return false;}
  // Its left or right side must be uncovered by a tile of the same height.
  let left=false,right=false;
  for(const x of cells){if(!alive.has(x.id)||x.id===tile.id||x.z!==tile.z)continue;
   const rowsAlign=Math.abs(x.y-tile.y)<CH*.46;
   if(!rowsAlign)continue;
   if(x.x<tile.x&&tile.x-x.x<CW*1.45&&tile.x-x.x>CW*.45)left=true;
   if(x.x>tile.x&&x.x-tile.x<CW*1.45&&x.x-tile.x>CW*.45)right=true;
   if(left&&right)return false;
  }
  return !left||!right;
 }
 function nextGeometryPairs(cells,ids){let active=new Set(ids),pairs=[];
  // Prioritize top-exposed free endpoints to keep the future solution recoverable.
  while(active.size){const possible=cells.filter(x=>free(x,cells,active));if(possible.length<2)return null;
   const tier=Math.max(...possible.map(x=>x.z));let choices=possible.filter(x=>x.z===tier);
   let a,b;
   // Often choose corresponding left/right endpoints in one row to preserve a solvable shell.
   const byRow=new Map();for(const t of choices){let k=t.row.toString();if(!byRow.has(k))byRow.set(k,[]);byRow.get(k).push(t)}
   const rows=[...byRow.values()].filter(v=>v.length>=2);
   if(rows.length){let row=rows[rng(rows.length)].sort((a,b)=>a.x-b.x);a=row[0];b=row[row.length-1]}
   else if(choices.length>=2){shuffle(choices);[a,b]=choices}
   else{a=choices[0];b=possible.find(x=>x.id!==a.id);if(!b)return null}
   pairs.push([a.id,b.id]);active.delete(a.id);active.delete(b.id);
  }
  return pairs;
 }
 function originalDeck(){let pairs=[];
  for(const f of COMMON){pairs.push([f,f]);pairs.push([f,f])}
  shuffle(FLOWERS.slice()).reduce((a,v,i,all)=>{if(i%2===0)pairs.push([v,all[i+1]]);return a},null);
  shuffle(SEASONS.slice()).reduce((a,v,i,all)=>{if(i%2===0)pairs.push([v,all[i+1]]);return a},null);
  if(pairs.length!==72)throw Error('Mahjong deck must have 72 pairs');return shuffle(pairs);
 }
 function initialGame(){let cells=layout(),geometry=nextGeometryPairs(cells,cells.map(x=>x.id));if(!geometry||geometry.length!==72)throw Error('Mahjong turtle path invalid');let faces=originalDeck();geometry.forEach((pair,i)=>{cells[pair[0]].def=faces[i][0];cells[pair[1]].def=faces[i][1]});return cells}
 function fromRemaining(cells){let kept=cells.filter(t=>!t.removed),plan=null;
  for(let i=0;i<12&&!plan;i++)plan=nextGeometryPairs(cells,kept.map(x=>x.id));
  if(!plan)return false;
  const groups=new Map();for(const t of kept){const k=t.def.key;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(t.def)}
  let pairList=[];
  for(const [key,all] of groups){shuffle(all);if(all.length%2)return false;for(let i=0;i<all.length;i+=2)pairList.push([all[i],all[i+1]])}
  if(pairList.length!==plan.length)return false;
  shuffle(pairList);plan.forEach((p,i)=>{cells[p[0]].def=pairList[i][0];cells[p[1]].def=pairList[i][1]});return true
 }
 function start(){if(typeof runners==='undefined'||typeof finish!=='function'||typeof score!=='function'||typeof stoppers==='undefined')return;
  let cells=initialGame(),selected=null,pairs=0,points=0,history=[],hintIds=[],hintTimeout=null,startAt=Date.now(),secs=0,ticking=null;
  const $=id=>document.getElementById(id);
  const stopTask=fn=>stoppers.push(fn);
  const stage=$('arena');if(!stage)return;
  stage.innerHTML='<section class="mahjongGame" aria-label="Traditional Mahjong Solitaire">'+
   '<div class="mahjongIntro">144 authentic-style tiles • four stacked layers • classic Turtle-inspired layout. Match identical tiles. <strong>Flowers match any flower; seasons match any season.</strong> A tile is playable only when nothing covers it and at least one long side is free.</div>'+ 
   '<div class="mahjongInfo"><span id="mjRemaining">144 tiles left</span><span id="mjMoves">0 / 72 pairs</span><span id="mjTime">00:00 elapsed · no limit</span></div>'+ 
   '<div class="mahjongToolbar"><button type="button" id="mjHint">💡 Hint</button><button type="button" id="mjUndo">↩ Undo</button><button type="button" id="mjShuffle">🔀 Reshuffle</button><button type="button" id="mjNew">🀄 New deal</button></div>'+ 
   '<div class="mahjongScroll"><div class="mahjongTurtle" id="mjBoard" role="group" aria-label="144 tile Mahjong Solitaire board. Scroll horizontally on small screens."></div></div>'+ 
   '<p class="mahjongMessage" id="mjStatus" aria-live="polite">Choose two free matching tiles to remove them. 🀄</p>'+ 
   '<p class="mahjongLegend">🀇 Characters · 🀐 Bamboo · 🀙 Dots · 🀀 Winds · 🀄 Dragons · 🀢 Flowers · 🀦 Seasons <span>• On phones, scroll sideways to see the full board.</span></p></section>';
  const board=$('mjBoard');const current=()=>typeof window!=='undefined'&&typeof open==='function'&&typeof games!=='undefined';
  const alive=()=>new Set(cells.filter(t=>!t.removed).map(t=>t.id));
  const movable=()=>{const a=alive();return cells.filter(t=>free(t,cells,a))};
  const matching=()=>{const playable=movable(),pairs=[];for(let i=0;i<playable.length;i++)for(let j=i+1;j<playable.length;j++)if(playable[i].def.key===playable[j].def.key)pairs.push([playable[i],playable[j]]);return pairs};
  function announce(s){if($('mjStatus'))$('mjStatus').textContent=s}
  function sync(){if(!$('mjRemaining'))return;$('mjRemaining').textContent=(144-pairs*2)+' tiles left';$('mjMoves').textContent=pairs+' / 72 pairs';if($('mjUndo'))$('mjUndo').disabled=history.length===0}
  function paint(){if(!board)return;const movableIds=new Set(movable().map(x=>x.id)),hint=new Set(hintIds);
   let html='';for(let z=0;z<4;z++)for(const t of cells){if(t.z!==z||t.removed)continue;const playable=movableIds.has(t.id),sel=selected===t.id;
    html+='<button type="button" data-tile="'+t.id+'" class="mjTile mjLevel'+z+' mjSuit'+t.def.kind+(playable?' mjFree':' mjLocked')+(sel?' mjSelected':'')+(hint.has(t.id)?' mjHint':'')+'" style="left:'+t.x+'px;top:'+t.y+'px;z-index:'+(z*10+1)+'" '+(!playable?'disabled':'')+' title="'+t.def.name+(playable?' (free)':' (blocked)')+'" aria-label="'+t.def.name+(playable?' — free':' — blocked')+'"><span class="mjFace">'+t.def.face+'\uFE0E'+'</span></button>';
   }board.innerHTML=html;
   board.querySelectorAll('.mjFree').forEach(b=>b.onclick=()=>pick(+b.dataset.tile));sync();
  }
  function playFx(){if($('fxToggle')?.getAttribute('aria-pressed')!=='true')return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=window.__mahjongAudio??(window.__mahjongAudio=new C());if(a.state==='suspended')a.resume().catch(()=>{});const oscillator=a.createOscillator(),gain=a.createGain(),tm=a.currentTime;oscillator.type='sine';oscillator.frequency.setValueAtTime(685,tm);oscillator.frequency.exponentialRampToValueAtTime(910,tm+.10);gain.gain.setValueAtTime(.028*(Number($('audioVol')?.value||40)/40),tm);gain.gain.exponentialRampToValueAtTime(.001,tm+.14);oscillator.connect(gain);gain.connect(a.destination);oscillator.start(tm);oscillator.stop(tm+.15)}catch{}}
  function clearHint(){hintIds=[];if(hintTimeout){clearTimeout(hintTimeout);hintTimeout=null}}
  function pick(id){const t=cells[id],valid=movable().some(x=>x.id===id);if(!valid)return;if(selected===id){selected=null;paint();return}if(selected===null){selected=id;clearHint();paint();return}
   const chosen=cells[selected];if(chosen&&!chosen.removed&&chosen.def.key===t.def.key){history.push([chosen.id,t.id]);chosen.removed=t.removed=true;pairs++;points+=20;score(points);playFx();selected=null;clearHint();paint();
    if(pairs===72){announce('You cleared the entire Turtle! 🏆');clearInterval(ticking);finish(ID,true,points,'Mahjong Turtle mastered!');return}
    const next=matching();if(!next.length)announce('No free matching pair right now. Try Undo or Reshuffle — your progress is safe.');else announce('Match found! '+(144-pairs*2)+' tiles remain.');
   }else{selected=id;clearHint();paint();announce('These tiles do not match. Try another pair.')}
  }
  $('mjHint').onclick=()=>{const options=matching();if(!options.length){announce('No matching free tiles; undo or reshuffle to continue.');return}clearHint();const pick=options[rng(options.length)];hintIds=pick.map(x=>x.id);paint();announce('Highlighted two matching free tiles! 💡');hintTimeout=setTimeout(()=>{hintIds=[];paint()},2600)};
  $('mjUndo').onclick=()=>{const prev=history.pop();if(!prev)return;cells[prev[0]].removed=cells[prev[1]].removed=false;pairs--;points=Math.max(0,points-20);score(points);selected=null;clearHint();paint();announce('Pair restored. Keep going!')};
  $('mjShuffle').onclick=()=>{if(!fromRemaining(cells)){announce('These remaining positions cannot form a guaranteed deal. Undo a pair or start a new deal.');return}selected=null;clearHint();paint();announce('Remaining tiles reshuffled into a solvable arrangement! 🔀')};
  $('mjNew').onclick=()=>{cells=initialGame();selected=null;pairs=0;points=0;history=[];clearHint();startAt=Date.now();secs=0;score(0);paint();announce('Fresh 144-tile Turtle deal. Good luck! 🀄')};
  ticking=setInterval(()=>{if(!$('mjTime'))return;secs=Math.floor((Date.now()-startAt)/1000);$('mjTime').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')+' elapsed · no limit'},1000);stopTask(()=>{clearInterval(ticking);clearHint()});paint();
  window.__playroomMahjongDebug={get tiles(){return cells},get free(){return movable()},get matchingPairs(){return matching()},get pairsRemoved(){return pairs},get score(){return points}};
 }
 function install(){if(typeof runners!=='undefined'){runners[ID]=start;const g=games.find(x=>x[0]===ID);if(g){g[3]='Classic 144-tile layered Turtle Mahjong with real blocking rules.';const card=document.querySelector('[data-game="'+ID+'"]');if(card){const p=card.closest('.gameCard')?.querySelector('p');if(p)p.textContent=g[3]}}}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
