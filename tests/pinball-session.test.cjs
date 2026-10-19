const {test}=require('node:test');
const assert=require('node:assert/strict');
const simulate=require('./helpers/pinball-session.cjs');
test('a launched pinball reaches the playable bumper field instead of instantly draining',()=>{
 const result=simulate({autoLaunch:false,seconds:1});
 assert.ok(result.minBallY<300,'a launched ball must rise above the lower rails into the bumper field');
 assert.ok(result.ballFrames>=30,'the first ball must remain in play through launch');
 assert.equal(result.finished,null,'one launch must not complete a three-ball round');
});
