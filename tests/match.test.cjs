const {test}=require('node:test');
const assert=require('node:assert/strict');
const {MatchEngine}=require('../src/match.js');
function finish(e){for(let i=0;i<40000&&!e.ended;i++)e.update(.1);assert.ok(e.ended,'match reaches a final outcome');return e;}

test('a complete match conserves score, lineups and player state, and restarts',()=>{
  const e=finish(new MatchEngine({seed:701}));
  assert.equal(e.clock,0);assert.ok(e.period>=4);assert.notEqual(e.score[0],e.score[1]);
  e.teams.forEach((team,i)=>{assert.equal(team.filter(p=>p.onCourt).length,5);assert.equal(team.reduce((n,p)=>n+p.points,0),e.score[i]);team.forEach(p=>{assert.ok(p.energy>=0&&p.energy<=100);assert.ok(p.made<=p.attempts);});});
  assert.ok(e.events.some(ev=>ev.type==='final'));e.reset();assert.deepEqual(e.score,[0,0]);assert.equal(e.clock,180);assert.equal(e.period,1);assert.equal(e.ended,false);assert.equal(e.timeouts[0],3);assert.ok(e.teams.flat().every(p=>p.energy===100&&p.points===0));
});
test('pause freezes simulation; timeouts restore energy, are limited, and do not run clock',()=>{
  const e=new MatchEngine({seed:7});e.update(30);e.togglePause();const before=[e.clock,e.time,e.score.join(),e.handler.energy];e.update(20);assert.deepEqual([e.clock,e.time,e.score.join(),e.handler.energy],before);
  const low=e.teams[0][0];low.energy=40;assert.ok(e.timeout());assert.equal(low.energy,49);assert.ok(e.timeout());assert.ok(e.timeout());assert.equal(e.timeout(),false);assert.equal(e.timeouts[0],0);
  e.togglePause();e.update(.5);assert.ok(e.clock<before[0]);
});
test('substitutions queue until a possession ends; paused substitutions are immediate',()=>{
  const e=new MatchEngine({seed:9}),out=e.teams[0][0],sub=e.teams[0][5];
  assert.ok(e.substitute(out.id,sub.id));assert.ok(out.onCourt);assert.equal(sub.onCourt,false);assert.equal(e.substitute(out.id,sub.id),false);
  while(!e.possessions)e.update(.1);assert.equal(out.onCourt,false);assert.equal(sub.onCourt,true);assert.equal(e.lineup(0).length,5);
  e.togglePause();assert.ok(e.substitute(sub.id,out.id));assert.equal(out.onCourt,true);assert.equal(sub.onCourt,false);
  sub.fouls=6;assert.equal(e.substitute(out.id,sub.id),false);
});
test('tactics affect spacing, shot mix, pace, energy and results with identical seeds',()=>{
  const baseline=new MatchEngine({seed:31}),fast=new MatchEngine({seed:31});
  fast.setTactic('attack','Fast Break');fast.setTactic('tempo','Fast');assert.ok(fast.phaseDuration<baseline.phaseDuration);
  baseline.update(30);fast.update(30);assert.ok(fast.teams[0][0].energy<baseline.teams[0][0].energy);
  const five=new MatchEngine({seed:42}),inside=new MatchEngine({seed:42});five.setTactic('attack','5-Out');five.setTactic('focus','outside');inside.setTactic('attack','Inside-Out');inside.setTactic('focus','inside');
  assert.notDeepEqual(five.positions().map(p=>[p.x,p.z]),inside.positions().map(p=>[p.x,p.z]));
  const count=e=>{let threes=0,shots=0,previous=null;for(let i=0;i<18000&&!e.ended;i++){e.update(.1);if(e.shot&&e.shot!==previous){previous=e.shot;if(e.shot.shooter.team===0){shots++;if(e.shot.three)threes++;}}}return threes/shots;};
  assert.ok(count(five)>count(inside)+.2);
  const man=new MatchEngine({seed:1});man.possession=1;man.newPossession(1);const initial=man.positions();man.setTactic('defense','2-3 Zone');assert.notDeepEqual(initial.map(p=>[p.x,p.z]),man.positions().map(p=>[p.x,p.z]));
  assert.equal(man.setTactic('attack','constructor'),false);assert.equal(man.setTactic('__proto__','x'),false);
});
test('deterministic seeds and playback speeds preserve outcomes',()=>{
  const a=finish(new MatchEngine({seed:55})),b=new MatchEngine({seed:55});b.speed=4;finish(b);assert.deepEqual(a.score,b.score);assert.equal(a.possessions,b.possessions);
});
test('multiple matches finish without invalid positions, unbounded logs or negative clocks',()=>{
  for(let seed=1;seed<=20;seed++){
    const e=new MatchEngine({seed});e.setTactic('attack',['5-Out','Motion','Isolation','Inside-Out','Fast Break'][seed%5]);e.setTactic('defense',['Man-to-Man','2-3 Zone','Press','Switch'][seed%4]);
    for(let i=0;i<15000&&!e.ended;i++){e.update(.2);assert.ok(e.clock>=0);assert.ok(e.shotClock>=0);for(const p of e.positions()){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));assert.ok(Math.abs(p.x)<=14&&Math.abs(p.z)<=7.5);}}
    assert.ok(e.ended);assert.ok(e.events.length<=70);
  }
});
