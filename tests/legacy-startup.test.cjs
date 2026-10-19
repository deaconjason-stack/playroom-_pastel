const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const path=require('node:path');
function boot(){
 const element=()=>({value:'40',textContent:'',hidden:false,setAttribute(){},getAttribute(){return 'false'},addEventListener(){},appendChild(){},querySelector(){return element()}});
 const nodes=new Map(['stage','musicToggle','fxToggle','audioVol','games','cards'].map(id=>[id,element()]));
 const count=element(),runners={},games=[['snake']],calls=[];
 const document={hidden:false,body:element(),createElement:element,getElementById:id=>nodes.get(id)||null,querySelector:selector=>selector==='#games .count'?count:null,addEventListener(){}};
 const context={document,window:{addEventListener(){}},games,runners,open(){},finish(...args){calls.push(args)},score(){},bests:{},current:null,stoppers:[],console,setTimeout,clearTimeout,setInterval,clearInterval};
 assert.doesNotThrow(()=>vm.runInNewContext(readFileSync(path.join(__dirname,'../src/extras.js'),'utf8'),context));
 return {context,count,runners,calls};
}
test('the legacy expansion registers its five games when the collection count has no id',()=>{
 const {count,runners}=boot();
 for(const id of ['connect-four','bubble-pop','simon-says','word-scramble','rock-paper-scissors'])assert.equal(typeof runners[id],'function',id+' must be playable');
 assert.match(count.textContent,/6 games/);
});

test('legacy sound feedback forwards Festival mastery and round stats to the reward engine',()=>{
 const {context,calls}=boot(),meta={stars:3,stats:['4000 points','4× multiplier'],difficulty:'Arcade'};
 context.finish('pocket-pinball',true,4000,'Pinball royalty!',meta);
 assert.equal(calls.length,1);assert.deepEqual(calls[0][4],meta);
});
