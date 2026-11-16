const {test}=require('node:test');const assert=require('node:assert/strict');
const {ClubModel,CLUB_LIMITS}=require('../src/club.js');
const {MatchEngine,refreshPlayer,tacticalFit,CORE_KEYS,OVERALL_WEIGHTS}=require('../src/match.js');
test('five-core overall is computed, while raw capability budgets stop stacked stars',()=>{
  const c=new ClubModel();assert.equal(c.lineup.length,5);assert.equal(c.issues.length,0);
  for(const p of c.roster)assert.equal(p.overall,Math.round(CORE_KEYS.reduce((n,k,i)=>n+p[k]*OVERALL_WEIGHTS[p.position][i],0)));
  for(const p of c.lineup){CORE_KEYS.forEach(k=>p[k]=99);refreshPlayer(p);}assert.ok(c.attributeTotal>CLUB_LIMITS.attributes);assert.equal(c.beginMatch().ok,false);
});
test('style and composition make tactical fit distinct from overall',()=>{
  const c=new ClubModel(),center=c.roster[4],shooter=c.freeAgents.find(p=>p.id==='fa-5');
  assert.ok(center.overall>shooter.overall);assert.ok(tacticalFit(shooter,'5-Out')>tacticalFit(center,'5-Out')+20);assert.ok(tacticalFit(center,'Inside-Out')>tacticalFit(center,'5-Out')+20);
});
test('salary cap, roster cap, signing cost, contract tradeoffs and release are enforced',()=>{
  const c=new ClubModel(),cash=c.cash,bond=c.bond;assert.equal(c.sign('fa-0').ok,false);assert.equal(c.cash,cash);
  assert.ok(c.sign('fa-3').ok);assert.equal(c.payroll,119);assert.equal(c.cash,177.5);assert.ok(c.bond<bond);assert.equal(c.roster.find(p=>p.id==='fa-3').familiarity,24);
  assert.ok(c.sign('fa-4').ok);assert.equal(c.roster.length,10);assert.equal(c.sign('fa-5').ok,false);
  assert.equal(c.release(c.starters[0]).ok,false);assert.ok(c.restructure('fa-3').ok);assert.equal(c.restructure('fa-3').ok,false);assert.equal(c.roster.find(p=>p.id==='fa-3').salary,4.5);
  assert.ok(c.release('fa-3').ok);assert.equal(c.roster.length,9);assert.ok(c.freeAgents.some(p=>p.id==='fa-3'));
});
test('new signings lower chemistry, practice builds it, and training cannot be spammed',()=>{
  const c=new ClubModel();c.sign('fa-3');c.selectStarter('0-0');c.selectStarter('fa-3');const before=c.chemistry;
  assert.ok(c.train('chemistry').ok);assert.ok(c.chemistry>before);const rookie=c.roster.find(p=>p.id==='fa-3'),shooting=rookie.shooting;
  assert.ok(c.train('development',rookie.id,'shooting').ok);assert.equal(rookie.shooting,shooting+2);assert.equal(c.prepActions,0);const cash=c.cash;assert.equal(c.train('chemistry').ok,false);assert.equal(c.cash,cash);
});
test('the match waits before start, uses selected players and settles exactly once',()=>{
  const c=new ClubModel(),e=new MatchEngine({seed:2,quarterLength:15,autoStart:false});e.update(100);assert.equal(e.time,0);assert.equal(e.clock,15);
  c.selectStarter('0-0');c.selectStarter('0-5');c.attack='Motion';const result=c.beginMatch();e.configure(result.setup);assert.equal(e.attack,'Motion');assert.ok(e.lineup(0).some(p=>p.id==='0-5'));assert.ok(!e.lineup(0).some(p=>p.id==='0-0'));
  for(let i=0;i<10000&&!e.ended;i++)e.update(.1);assert.ok(e.ended);const cash=c.cash;const settlement=c.completeMatch(e.score,e.teams[0]);assert.ok(settlement);assert.equal(c.cash,Math.round((cash+settlement.net)*10)/10);assert.equal(c.day,2);assert.equal(c.prepActions,2);assert.equal(c.completeMatch(e.score,e.teams[0]),null);
});
test('save restores profiles, core-derived ratings, contracts and selected lineup; invalid saves are rejected',()=>{
  const c=new ClubModel();c.sign('fa-3');c.train('chemistry');const save=JSON.parse(c.serialize());save.roster[0].overall=999;
  const restored=new ClubModel(save);assert.equal(restored.roster.length,9);assert.equal(restored.prepActions,1);assert.ok(restored.roster[0].overall<100);assert.deepEqual(restored.starters,c.starters);
  const broken=JSON.parse(c.serialize());broken.roster[0].name='<img onerror=alert(1)>';assert.equal(restored.restore(broken),false);assert.equal(restored.restore('{bad'),false);
});
test('live substitutions cannot evade the capability cap',()=>{
  const c=new ClubModel();c.roster[5]=refreshPlayer({...c.roster[5],shooting:99,finishing:99,playmaking:99,defense:99,athleticism:99});
  const e=new MatchEngine();e.configure(c.beginMatch().setup);assert.equal(e.substitute('0-4','0-5'),false);assert.ok(e.lastSubError.includes('400'));
});
