'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
function simulate({holdFlippers=false, autoLaunch=true, seconds=8, gameId='pocket-pinball', fps=60}={}) {
  let now=0, next=null, finished=null, minBallY=Infinity, ballFrames=0;
  const nodes=new Map(), events=new Map(), gradient={addColorStop(){}};
  const canvasContext=new Proxy({}, {
    get(_target, name) {
      if(name==='createLinearGradient')return ()=>gradient;
      if(name==='arc')return (_x,y,r)=>{if(r===10){minBallY=Math.min(minBallY,y);ballFrames++}};
      return ()=>{};
    },
    set(){return true}
  });
  function node(id) {
    if(!nodes.has(id))nodes.set(id, {
      id, value:'1', disabled:false, hidden:false, textContent:'', dataset:{},
      setPointerCapture(){}, getAttribute(){return 'false'},
      getContext(){return canvasContext},
      getBoundingClientRect(){return {left:0,top:0,width:420,height:610}},
      addEventListener(){}, removeEventListener(){}, focus(){}
    });
    return nodes.get(id);
  }
  const fixedMath=Object.create(Math);fixedMath.random=()=>.5;
  const c={Math:fixedMath,
    window:{matchMedia(){return {matches:true}},addEventListener(){},removeEventListener(){}},
    document:{hidden:false,getElementById:node,querySelectorAll(){return []},
      addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn)},
      removeEventListener(){},dispatchEvent(){}},
    localStorage:{getItem(){return null}},CustomEvent:function(){},
    current:{id:gameId,token:'run',done:false}, games:[],runners:{},stoppers:[],
    performance:{now(){return now}},
    requestAnimationFrame(fn){next=fn;return 1},cancelAnimationFrame(){},score(){},
    finish(...args){finished=args;c.current.done=true}
  };
  c.window.PlayroomFestival=require(path.join(repo,'src/festival-engine.js'));
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(repo,'src/festival-games.js'),'utf8'),c);
  c.window.PlayroomFestivalGames.install();c.runners[gameId]();
  node('festStart').onclick();if(gameId==='pocket-pinball')node('festLaunch').onclick();
  if(holdFlippers)for(const fn of events.get('keydown')||[])
    for(const code of ['KeyA','KeyD'])fn({code,target:{},preventDefault(){}});
  for(let i=0;i<seconds*fps&&!finished;i++) {
    if(autoLaunch&&gameId==='pocket-pinball')node('festLaunch').onclick();
    now+=1000/fps;const frame=next;next=null;if(frame)frame(now);
  }
  return {holdFlippers,autoLaunch,secondsRun:now/1000,minBallY,ballFrames,finished,hud:node('festHud').innerHTML};
}
if(require.main===module)for(const holdFlippers of [false,true])console.log(JSON.stringify(simulate({holdFlippers})));
module.exports=simulate;
