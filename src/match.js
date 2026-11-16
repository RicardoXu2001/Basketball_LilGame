/* Match model. Metres: court length X, width Z; no rendering dependencies. */
const PlayerMotion=typeof module!=='undefined'&&module.exports?require('./motion.js').MotionSystem:MotionSystem;
const ATTACKS = {
  '5-Out': { name: '五外拉开', hint: '拉开空间，制造外线空位', outside: .74, pass: .76, drain: 1, efficiency: .025 },
  'Pick and Roll': { name: '挡拆配合', hint: '持球人与内线配合，创造突破机会', outside: .35, pass: .74, drain: 1.05, efficiency: .045 },
  Motion: { name: '动态进攻', hint: '持续跑动、分享球，寻找空切', outside: .48, pass: .9, drain: 1.15, efficiency: .035 },
  'Fast Break': { name: '快速反击', hint: '抢先推进，消耗更多体力', outside: .3, pass: .58, drain: 1.45, efficiency: .025 },
  Isolation: { name: '单打战术', hint: '为核心清空一侧，考验持球能力', outside: .36, pass: .18, drain: 1.1, efficiency: 0 },
  'Inside-Out': { name: '内外结合', hint: '先落低位，再向外分球', outside: .25, pass: .8, drain: 1, efficiency: .03 },
};
const DEFENSES = { 'Man-to-Man': '人盯人', '2-3 Zone': '2–3 联防', Switch: '无限换防', Press: '全场紧逼' };
const TEMPOS = { Slow: .8, Balanced: 1, Fast: 1.28 };
const FOCUSES = { balanced: '均衡分享', outside: '外线优先', inside: '冲击内线', star: '核心主攻' };
function seededRandom(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const limit = (n, min, max) => Math.max(min, Math.min(max, n));
const clockText = n => `${Math.floor(Math.max(0,n)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,n)%60).toString().padStart(2,'0')}`;
const PLAYER_DATA = [
  ['Miles Carter','迈尔斯',3,'PG','组织核心',84,79,74,89,76,45,91,88],
  ['Jay Williams','杰伊',11,'SG','外线射手',82,91,77,76,69,47,82,83],
  ['Kai Brooks','凯',23,'SF','全能锋线',88,83,91,80,85,76,87,86],
  ['Noah Davis','诺亚',7,'PF','防守悍将',73,63,85,70,91,87,69,85],
  ['Andre King','安德烈',32,'C','篮板支柱',65,49,88,67,86,95,57,82],
  ['Leo Chen','里奥',6,'PG','节奏大师',86,83,71,88,74,42,85,84],
  ['Zion Reed','锡安',14,'SG','微波射手',85,89,79,72,71,53,81,77],
  ['Isaac Cole','艾萨克',21,'C','内线屏障',69,58,84,64,89,91,62,80],
];
const OVERALL_WEIGHTS={PG:[.15,.12,.38,.15,.20],SG:[.35,.20,.20,.10,.15],SF:[.25,.25,.15,.20,.15],PF:[.15,.25,.10,.30,.20],C:[.05,.30,.10,.35,.20]};
const CORE_KEYS=['shooting','finishing','playmaking','defense','athleticism'];
const PLAYER_STYLES=['组织发动机','接球射手','突破终结者','换防锋线','护筐中锋','组织发动机','接球射手','篮板蓝领'];
function refreshPlayer(p){
  CORE_KEYS.forEach(k=>p[k]=limit(Number(p[k])||0,0,100));
  p.overall=Math.round(CORE_KEYS.reduce((n,k,i)=>n+p[k]*(OVERALL_WEIGHTS[p.position]||OVERALL_WEIGHTS.SF)[i],0));
  p.attributeCost=Math.round(CORE_KEYS.reduce((n,k)=>n+p[k],0)/5);
  const guard=['PG','SG'].includes(p.position),big=['PF','C'].includes(p.position);
  p.hidden={speed:p.athleticism+(guard?3:-3),passing:p.playmaking,ballHandling:limit(p.playmaking*.62+p.athleticism*.26+(guard?12:0),35,97),awareness:(p.playmaking+p.defense)/2,endurance:82+(p.athleticism-70)*.25,rebounding:limit(p.defense*.4+p.athleticism*.25+(p.height-170)*.65+(big?7:0),30,98),catchAndShoot:limit(p.shooting+(p.primaryStyle==='接球射手'?7:0),0,99),contactFinishing:limit(p.finishing+(p.weight-85)*.18,0,99)};
  Object.assign(p,{speed:p.hidden.speed,passing:p.hidden.passing,ballHandling:p.hidden.ballHandling,awareness:p.hidden.awareness,rebounding:p.hidden.rebounding});return p;
}
function tacticalFit(p,attack){
  const weights={'5-Out':[.5,.08,.2,.1,.12],'Pick and Roll':[.12,.27,.33,.12,.16],Motion:[.27,.16,.35,.1,.12],'Fast Break':[.12,.3,.17,.1,.31],Isolation:[.23,.35,.16,.07,.19],'Inside-Out':[.12,.38,.15,.23,.12]}[attack]||[.2,.2,.2,.2,.2];
  const styles={'5-Out':['接球射手','空间内线'],'Pick and Roll':['组织发动机','护筐中锋','突破终结者'],Motion:['组织发动机','接球射手','换防锋线'],'Fast Break':['突破终结者','换防锋线'],Isolation:['单打得分手','突破终结者'],'Inside-Out':['护筐中锋','篮板蓝领','空间内线']};
  const bonus=(styles[attack]||[]).includes(p.primaryStyle)?9:0;
  const spacingPenalty=attack==='5-Out'&&p.shooting<65?(65-p.shooting)*.65:0;
  return Math.round(limit(CORE_KEYS.reduce((n,k,i)=>n+p[k]*weights[i],0)+bonus-spacingPenalty,25,99));
}
function makeTeam(team) {
  const awayNames = ['D. Lewis','T. Rivers','J. Stone','M. Scott','R. Hayes','A. Price','C. West','B. Young'];
  return PLAYER_DATA.map((d,i) => ({ id: `${team}-${i}`, team, name: team ? awayNames[i] : d[0], short: team ? awayNames[i] : d[1], number: team ? [2,9,24,15,34,1,8,41][i] : d[2], position:d[3], tag:d[4],
    shooting:d[6]-(team?1:0), finishing:d[7], playmaking:d[8], defense:d[9],athleticism:d[5]-(team?2:0),height:[185,192,201,207,214,183,194,211][i],weight:[80,86,94,104,112,77,89,108][i],age:[26,25,24,28,29,21,22,23][i],potential:[87,90,94,88,87,91,92,89][i],primaryStyle:PLAYER_STYLES[i],secondaryStyle:i===2?'单打得分手':undefined,salary:[14,17,23,13,14,10,11,12][i],familiarity:team?78:80,condition:100,stamina:100,fouls:0,points:0,assists:0,rebounds:0,steals:0,attempts:0,made:0,heat:0,onCourt:i<5 })).map(refreshPlayer);
}
class MatchEngine {
  constructor({seed = Date.now(), quarterLength = 180,autoStart=true} = {}) { this.seed=seed; this.quarterLength=quarterLength;this.autoStart=autoStart;this.setup=null;this.motion=new PlayerMotion(); this.reset(); }
  reset() {
    this.random=seededRandom(this.seed); this.teams=[makeTeam(0),makeTeam(1)]; this.score=[0,0]; this.period=1; this.clock=this.quarterLength;
    if(this.setup)this.teams[0]=this.setup.roster.map(p=>refreshPlayer({...p,team:0,hidden:{...p.hidden},onCourt:this.setup.starters.includes(p.id),stamina:p.condition??100,fouls:0,points:0,assists:0,rebounds:0,steals:0,attempts:0,made:0,heat:0}));
    this.started=this.autoStart;this.settled=false;this.chemistry=this.setup?.chemistry??78;
    this.shotClock=24; this.possession=0; this.direction=1; this.attack='Pick and Roll'; this.defense='Man-to-Man'; this.tempo='Balanced'; this.focus='balanced';
    this.paused=false; this.ended=false; this.speed=1; this.time=0; this.accumulator=0; this.phaseTime=0; this.phase='bringup'; this.revision=0; this.events=[]; this.eventId=0;
    this.timeouts=[3,3]; this.possessions=0; this.passes=0; this.lastPasser=null; this.shot=null; this.plannedThree=null; this.result=''; this.pendingSubs=[]; this.lastAction='组织推进';
    this.handler=this.lineup(0).find(p=>p.position==='PG')||this.lineup(0)[0]; this.receiver=null; this.log('tip','街区对决开始。河畔队先攻，轮到你掌控节奏。');
    this.attack=this.setup?.attack||this.attack;this.motion.reset();this.motion.sync([...this.lineup(0),...this.lineup(1)]);this.possessionStarts=new Map();
  }
  configure(setup){this.setup=setup;this.autoStart=true;this.seed=Date.now();this.reset();}
  fit(team=this.possession){return this.lineup(team).reduce((n,p)=>n+tacticalFit(p,team===0?this.attack:'Motion'),0)/5;}
  lineup(team=this.possession) { return this.teams[team].filter(p=>p.onCourt); }
  log(type,text,team=null) { this.events.unshift({id:++this.eventId,type,text,team,time:clockText(this.clock),period:this.period}); this.events=this.events.slice(0,70); this.revision++; }
  choose(list, weight = () => 1) { const weights=list.map(p=>Math.max(.01,weight(p))); let roll=this.random()*weights.reduce((a,b)=>a+b,0); return list.find((p,i)=>(roll-=weights[i])<=0)||list.at(-1); }
  tactics(team=this.possession) { return team===0 ? ATTACKS[this.attack] : ATTACKS[this.possessions%3===0?'5-Out':'Motion']; }
  setTactic(key,value) {
    const allowed={attack:ATTACKS,defense:DEFENSES,tempo:TEMPOS,focus:FOCUSES};
    if(!Object.hasOwn(allowed,key)||!Object.hasOwn(allowed[key],value)||this.ended||this[key]===value) return false;
    this[key]=value; this.log('tactic',`战术调整 · ${key==='attack'?`${value} ${ATTACKS[value].name}`:key==='defense'?DEFENSES[value]:key==='tempo'?({Slow:'稳扎稳打',Balanced:'均衡节奏',Fast:'提速进攻'})[value]:FOCUSES[value]}`,0); return true;
  }
  togglePause() { if(!this.ended) { this.paused=!this.paused; this.revision++; } }
  timeout() {
    if(this.ended || !this.timeouts[0]) return false;
    this.timeouts[0]--; this.paused=true;
    this.teams[0].forEach(p=>p.stamina=Math.min(100,p.stamina+9));
    this.log('timeout',`河畔队请求暂停。球员恢复体力，还剩 ${this.timeouts[0]} 次暂停。`,0); return true;
  }
  substitute(outId,inId) {
    const out=this.teams[0].find(p=>p.id===outId), incoming=this.teams[0].find(p=>p.id===inId);
    if(this.ended || !out?.onCourt || !incoming || incoming.onCourt || incoming.fouls>=6) return false;
    const projected=this.lineup(0).reduce((n,p)=>n+p.attributeCost,0)-out.attributeCost+incoming.attributeCost+this.pendingSubs.reduce((n,s)=>n+this.teams[0].find(p=>p.id===s.inId).attributeCost-this.teams[0].find(p=>p.id===s.outId).attributeCost,0);
    this.lastSubError=projected>400?'这次换人会超过 400 点首发能力预算。':'';if(this.lastSubError)return false;
    if(this.pendingSubs.some(s=>s.outId===outId||s.inId===inId)) return false;
    this.pendingSubs.push({outId,inId});
    if(this.paused||this.phase==='transition') this.applySubs();
    else this.log('sub',`换人已排队 · ${incoming.short} 换下 ${out.short}，本回合结束时执行。`,0);
    return true;
  }
  applySubs() {
    for(const {outId,inId} of this.pendingSubs) {
      const out=this.teams[0].find(p=>p.id===outId), incoming=this.teams[0].find(p=>p.id===inId);
      if(!out.onCourt||incoming.onCourt||incoming.fouls>=6) continue;
      out.onCourt=false; incoming.onCourt=true;
      if(this.handler===out) this.handler=incoming;
      if(this.receiver===out) this.receiver=incoming;
      this.log('sub',`换人 · #${incoming.number} ${incoming.short} 上场，#${out.number} ${out.short} 休息。`,0);
    }
    this.pendingSubs=[];
    if(this.setup)this.chemistry=Math.round((this.setup.bond??this.chemistry)*.55+this.lineup(0).reduce((n,p)=>n+p.familiarity,0)/5*.45);
  }
  enter(phase) { this.phase=phase; this.phaseTime=0; this.revision++; }
  get phaseDuration() { return ({bringup:this.attack==='Fast Break'&&this.possession===0?1.5:3,setup:2.3,pass:.7,catch:.55,decision:1.5,shoot:.65,flight:1.15,rebound:1,transition:1.3})[this.phase] / (this.possession===0?TEMPOS[this.tempo]:1); }
  get progress() { return limit(this.phaseTime/this.phaseDuration,0,1); }
  update(dt) {
    if(!this.started||this.paused||this.ended) return;
    // Small steps preserve phase boundaries at every playback speed.
    this.accumulator+=Math.max(0,dt)*this.speed;
    while(this.accumulator+1e-9>=.05&&!this.ended&&!this.paused) { this.accumulator=Math.max(0,this.accumulator-.05); this.step(.05); }
  }
  step(dt) {
    this.time+=dt; this.phaseTime+=dt;
    if(this.phase!=='transition') {
      this.clock=Math.max(0,this.clock-dt); this.shotClock=Math.max(0,this.shotClock-dt);
      if(this.clock<=0) { if(this.phase==='flight') this.resolveShot(); this.nextPeriod(); return; }
      if(this.shotClock<=0&&!['shoot','flight','rebound'].includes(this.phase)) { this.log('turnover','24 秒违例，球权转换。',this.possession); this.newPossession(); return; }
    }
    for(const team of this.teams) for(const p of team) {
      const drain=.095*(88/p.hidden.endurance)*(p.team===0?ATTACKS[this.attack].drain*TEMPOS[this.tempo]*(this.defense==='Press'?1.3:1):1);
      p.stamina=limit(p.stamina+(p.onCourt?-drain:.17)*dt,0,100);
    }
    if(this.phaseTime>=this.phaseDuration) this.advance();
    this.motion.update(this.formationTargets(),dt);
  }
  nextPeriod() {
    this.applySubs();
    if(this.period>=4&&this.score[0]!==this.score[1]) { this.ended=true; this.paused=true; this.clock=0; this.phase='final'; this.log('final',`比赛结束 · 河畔队 ${this.score[0]} : ${this.score[1]} 铁街队。${this.score[0]>this.score[1]?'这片球场属于你们！':'下一次，再把胜利带回来。'}`); return; }
    this.period++; this.clock=this.period>4?60:this.quarterLength;
    this.direction=this.period>=3?-1:1; this.teams.flat().forEach(p=>p.stamina=Math.min(100,p.stamina+12));
    if(this.period===3) this.timeouts[0]=Math.min(3,this.timeouts[0]+1);
    this.log('period',this.period>4?`加时赛 ${this.period-4} · 再战一分钟。`:`第 ${this.period} 节开始 · 体力恢复，${this.period===3?'双方交换半场。':'重新组织进攻。'}`);
    this.newPossession(this.period%2); this.revision++;
  }
  advance() {
    const attack=this.tactics();
    if(this.phase==='bringup') { this.lastAction='战术落位'; this.enter('setup'); }
    else if(this.phase==='setup'||this.phase==='catch') {
      if(this.passes<(this.possession===0&&this.focus==='star'?1:2)&&this.random()<attack.pass) {
        this.lastPasser=this.handler;
        this.receiver=this.choose(this.lineup().filter(p=>p!==this.handler),p=>this.possession===0&&this.focus==='star'&&p.number===23?8:(this.focus==='outside'?p.shooting:p.awareness)/80);
        this.lastAction=`${this.handler.short} → ${this.receiver.short}`;this.passOrigin=this.motion.sample(this.handler.id); this.passes++; this.enter('pass');
      } else { this.plannedThree=this.random()<this.outsideChance(); this.lastAction=this.plannedThree?'寻找外线出手机会':this.attack==='Pick and Roll'&&this.possession===0?'挡拆后突破':'观察防守，冲击篮筐'; this.enter('decision'); }
    } else if(this.phase==='pass') { this.handler=this.receiver; this.receiver=null; this.enter('catch'); }
    else if(this.phase==='decision') this.decide();
    else if(this.phase==='shoot') {const p=this.motion.sample(this.handler.id);if(this.shot)this.shot.origin={x:p.x,y:2.25,z:p.z};this.enter('flight');}
    else if(this.phase==='flight') this.resolveShot();
    else if(this.phase==='rebound') this.resolveRebound();
    else if(this.phase==='transition') this.newPossession();
  }
  outsideChance() { return this.tactics().outside+(this.possession===0?(this.focus==='outside'?.27:this.focus==='inside'?-.23:0):0); }
  decide() {
    const p=this.handler, defenders=this.lineup(1-this.possession), defense=this.choose(defenders,d=>d.defense);
    const press=this.possession===1&&this.defense==='Press';
    const chemistry=this.possession===0?this.chemistry:78;
    const turnover=limit(.06+(defense.defense-p.ballHandling)/650+(press?.07:0)+(100-p.stamina)/1400+(70-chemistry)/600,.025,.25);
    if(this.random()<turnover) { defense.steals++; this.lastAction='抢断！'; this.log('steal',`${defense.short} 抢断 ${p.short}，发起反击！`,1-this.possession); this.enter('transition'); return; }
    if(this.random()<.065+(press?.025:0)) {
      defense.fouls++; this.lastAction='防守犯规'; this.log('foul',`${defense.short} 防守犯规（${defense.fouls} 次），${p.short} 两次罚球。`,defense.team);
      let made=0; for(let i=0;i<2;i++) if(this.random()<.54+p.shooting/360) made++;
      p.points+=made; this.score[p.team]+=made; this.log('score',`${p.short} 罚球 ${made}/2。`,p.team);
      if(defense.fouls>=6) this.foulOut(defense); this.enter('transition'); return;
    }
    const body=this.motion.sample(p.id),side=(p.team===0?1:-1)*this.direction,distance=Math.hypot(side*12-body.x,body.z);
    const three=(this.plannedThree??(this.random()<this.outsideChance()))&&distance>=6.3;this.plannedThree=three;
    const skill=three?(this.lastPasser?p.hidden.catchAndShoot:p.shooting):distance>3.5?(p.shooting+p.finishing)/2:p.hidden.contactFinishing;
    const avgDefense=defenders.reduce((a,d)=>a+d.defense*d.stamina/100,0)/5;
    const passBonus=this.lastPasser?this.lastPasser.passing/2800:0;
    const zone=this.possession===1&&this.defense==='2-3 Zone', switchDef=this.possession===1&&this.defense==='Switch';
    const efficiency=this.tactics().efficiency+(this.possession===0&&this.attack==='Pick and Roll'?p.passing/2200:0);
    const chemistryBonus=(chemistry-70)/650,fitBonus=(this.fit()-75)/340;
    const teammates=this.lineup().filter(other=>other!==p),spacing=teammates.reduce((n,other)=>n+Math.max(0,other.shooting-60),0)/2400;
    const chance=limit((three?.22:.38)+skill/330-avgDefense/600+efficiency+passBonus+p.heat*.012-(100-p.stamina)/420+(zone?(three?.07:-.07):0)-(switchDef?.025:0)+chemistryBonus+fitBonus+(three?spacing*.4:spacing),.12,.84);
    this.shot={shooter:p,three,chance,made:this.random()<chance,side,distance,origin:null};
    p.attempts++; this.lastAction=`${p.short} · ${three?'三分出手':distance>3.5?'两分跳投':'冲击篮筐'}`; this.enter('shoot');
  }
  resolveShot() {
    const shot=this.shot; if(!shot) { this.enter('transition'); return; }
    const p=shot.shooter;
    if(shot.made) {
      const points=shot.three?3:2; this.score[p.team]+=points; p.points+=points; p.made++; p.heat=Math.min(3,p.heat+1);
      this.log('score',`${p.short} ${shot.three?'三分命中！':shot.distance>3.5?'跳投命中！':'上篮得手！'} +${points}`,p.team);
      if(this.lastPasser&&this.lastPasser!==p) { this.lastPasser.assists++; this.log('assist',`${this.lastPasser.short} 送出助攻。`,p.team); }
      this.lastAction=shot.three?'THREE! 三分命中':'BUCKET! 两分入账'; this.result=`+${points}`; this.enter('transition');
    } else { p.heat=Math.max(-2,p.heat-1); this.log('miss',`${p.short} ${shot.three?'三分':shot.distance>3.5?'跳投':'上篮'}未中，争抢篮板。`,p.team); this.lastAction='争抢篮板'; this.result=''; this.enter('rebound'); }
  }
  resolveRebound() {
    const candidates=[...this.lineup(),...this.lineup(1-this.possession)];
    const p=this.choose(candidates,p=>{const body=this.motion.sample(p.id),d=Math.hypot((this.shot?.side||1)*12-(body?.x||0),body?.z||0);return p.rebounding*(.5+p.stamina/200)*(p.team===this.possession?.48:1)/(1+d*.09);}); p.rebounds++;
    const offensive=p.team===this.possession;
    this.log('rebound',`${p.short} 拿下${offensive?'进攻':'防守'}篮板。`,p.team);
    if(offensive) { this.handler=p; this.shotClock=14; this.passes=0; this.shot=null; this.plannedThree=null; this.lastPasser=null; this.enter('setup'); }
    else this.newPossession(p.team,p);
  }
  foulOut(player) {
    const replacement=this.teams[player.team].filter(p=>!p.onCourt&&p.fouls<6).sort((a,b)=>b.stamina-a.stamina)[0];
    if(replacement) { player.onCourt=false; replacement.onCourt=true; this.log('sub',`${player.short} 六犯离场，${replacement.short} 替补登场。`,player.team); }
    // ponytail: all eight fouled out leaves the last player eligible; no complete FIBA rulebook in this prototype.
  }
  newPossession(team=1-this.possession,handler=null) {
    this.applySubs(); this.possession=team; this.possessions++; this.passes=0; this.lastPasser=null; this.shot=null; this.plannedThree=null; this.result=''; this.receiver=null;
    this.handler=handler||this.choose(this.lineup(),p=>this.possession===0&&this.focus==='star'&&p.number===23?15:(p.position==='PG'?4:1)*p.ballHandling/80);
    this.shotClock=24; this.lastAction='攻防转换'; this.enter('bringup');
    this.possessionStarts=new Map([...this.motion.bodies].map(([id,p])=>[id,{x:p.x,z:p.z}]));
  }
  formationTargets() {
    const side=(this.possession===0?1:-1)*this.direction, attackName=this.possession===0?this.attack:'Motion';
    const layouts={
      '5-Out':[[4,0],[7,-5.6],[11,-5.8],[11,5.8],[7,5.6]],
      'Pick and Roll':[[5,0],[8,-5.5],[10.5,5.4],[7,1.7],[11,-2.3]],
      Motion:[[5,-2],[8,4.8],[10,-5],[9,1],[11,3.2]],
      'Fast Break':[[7,0],[10,-4],[11,4],[5,3],[3,-3]],
      Isolation:[[6,0],[10,-5.6],[11,5.6],[4,-5.5],[4,5.5]],
      'Inside-Out':[[5,0],[8,-5.3],[9,5.4],[11,2],[10.8,-2.5]],
    };
    const offense=[this.handler,...this.lineup().filter(p=>p!==this.handler)], defense=this.lineup(1-this.possession), layout=layouts[attackName], result=[];
    offense.forEach((p,i)=> {
      let [x,z]=layout[i]; const t=this.time;
      if(p===this.handler) { x=attackName==='Isolation'?6:5; z=0; }
      else if(attackName==='Motion') { x+=Math.sin(t*.7+i)*1.2; z+=Math.cos(t*.7+i)*1.15; }
      else { x+=Math.sin(t*.5+i)*.35; z+=Math.cos(t*.55+i)*.4; }
      if(attackName==='Pick and Roll'&&i===3) { x=6.3; z=1.2; }
      if(['decision','shoot','flight'].includes(this.phase)&&p===this.handler) { if(!(this.shot?.three??this.plannedThree)) x=this.phase==='decision'?5+this.progress*5.2:10.2; else { x=5;z=(i%2?-1:1)*4; } }
      let worldX=x*side;
      if(this.phase==='bringup'){const start=this.possessionStarts?.get(p.id)||this.motion.sample(p.id);if(start){const u=this.progress;worldX=start.x+(worldX-start.x)*u;z=start.z+(z-start.z)*u;}}
      if(this.phase==='rebound') {const a=i/10*Math.PI*2;worldX=(10.6+Math.cos(a)*1.3)*side;z=Math.sin(a)*2.5;}
      result.push({player:p,x:worldX,z,state:this.phase==='rebound'?'Rebound':this.phase==='pass'&&p===this.receiver?'Catch':this.phase==='transition'&&this.shot?.made&&p===this.shot.shooter?'Celebrate':p===this.handler?(['shoot','flight'].includes(this.phase)?'Shoot':this.phase==='catch'?'Catch':this.phase==='decision'?(this.plannedThree?'Idle':'Drive'):this.phase==='pass'?'Pass':'Dribble'):(attackName==='Pick and Roll'&&i===3?'Screen':'Move')});
    });
    const zone=this.possession===1&&this.defense==='2-3 Zone';
    defense.forEach((p,i)=> {
      const o=result[i], zoneLayout=[[6,-2.6],[6,2.6],[10,-4],[11,0],[10,4]];
      const actual=this.motion.sample(o.player.id)||o;
      let x=zone?zoneLayout[i][0]*side:actual.x+side*1.2, z=zone?zoneLayout[i][1]:actual.z*.94+(i%2?.28:-.28);
      if(this.possession===1&&this.defense==='Press'&&this.phase==='bringup') {x=o.x+side*.7;z=o.z+.6;}
      if(this.possession===1&&this.defense==='Switch') { const mark=result[(i+1)%5]; x=mark.x+side*1.2;z=mark.z*.85; }
      if(this.phase==='rebound'){const a=(i+5)/10*Math.PI*2;x=(10.6+Math.cos(a)*1.3)*side;z=Math.sin(a)*2.5;}
      result.push({player:p,x:limit(x,-12,12),z:limit(z,-6.4,6.4),state:this.phase==='rebound'?'Rebound':'Defend'});
    });
    return result;
  }
  positions(){return this.formationTargets().map(target=>{const body=this.motion.sample(target.player.id);return {...target,x:body?.x??target.x,z:body?.z??target.z};});}
}
if(typeof module!=='undefined'&&module.exports) module.exports={MatchEngine,ATTACKS,DEFENSES,makeTeam,refreshPlayer,tacticalFit,CORE_KEYS,OVERALL_WEIGHTS};
