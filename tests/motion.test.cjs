const {test}=require('node:test');const assert=require('node:assert/strict');const {MatchEngine}=require('../src/match.js');
test('all actors preserve readable body separation across changes of possession and tactics',()=>{
  const e=new MatchEngine({seed:441,quarterLength:90});let minimum=Infinity,maximumStep=0;
  for(let frame=0;frame<6500&&!e.ended;frame++){
    if(frame===700)e.setTactic('attack','5-Out');if(frame===1400)e.setTactic('defense','2-3 Zone');if(frame===2100)e.setTactic('attack','Motion');e.update(.05);
    const bodies=[...e.motion.bodies.values()];for(let i=0;i<bodies.length;i++){const a=bodies[i];maximumStep=Math.max(maximumStep,Math.hypot(a.x-a.previousX,a.z-a.previousZ));for(let j=i+1;j<bodies.length;j++)minimum=Math.min(minimum,Math.hypot(a.x-bodies[j].x,a.z-bodies[j].z));}
  }
  assert.ok(minimum>.80,`minimum body gap ${minimum}`);assert.ok(maximumStep<.5,`largest 50ms step ${maximumStep}`);
});
test('flight release is based on simulated shooter position, without a render call',()=>{
  const e=new MatchEngine({seed:44});for(let i=0;i<1000&&e.phase!=='flight';i++)e.update(.05);assert.equal(e.phase,'flight');assert.ok(Number.isFinite(e.shot.origin.x));assert.ok(Math.abs(e.shot.origin.x)<=13.1);
});
