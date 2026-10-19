const {test}=require('node:test');
const assert=require('node:assert/strict');
const simulate=require('./helpers/pinball-session.cjs');
test('a launched pinball reaches the playable bumper field instead of instantly draining',()=>{
 const result=simulate({autoLaunch:false,seconds:1});
 assert.ok(result.minBallY<300,'a launched ball must rise above the lower rails into the bumper field');
 assert.ok(result.ballFrames>=30,'the first ball must remain in play through launch');
 assert.equal(result.finished,null,'one launch must not complete a three-ball round');
});
test('rhythm timing keeps the song duration on a slower 15-frame-per-second screen',()=>{
 const result=simulate({gameId:'beat-bloom',fps:15,seconds:40});
 assert.ok(result.finished,'the Moonbeam track must finish in under 40 real seconds, even at 15 FPS');
 assert.equal(result.finished[0],'beat-bloom');assert.equal(result.finished[4].stats.length,3);
});
