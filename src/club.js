/* Local, fictional club economy. Values are game currency, in thousands. */
const ClubPlayers=typeof module!=='undefined'&&module.exports?require('./match.js'):{makeTeam,refreshPlayer,tacticalFit,CORE_KEYS};
const CLUB_SAVE_KEY='streetball-coach-club-v2';
const CLUB_LIMITS={salary:140,attributes:400,roster:10};
function makeFreeAgents(){
  const specs=[
    ['fa-0','Theo Grant','西奥',44,'SG',27,197,93,[94,88,78,77,90],'单打得分手',33,94],
    ['fa-1','Eli Okafor','伊莱',5,'C',24,216,114,[43,93,62,94,85],'护筐中锋',24,94],
    ['fa-2','Dante Park','丹特',18,'PF',26,207,101,[88,70,78,76,74],'空间内线',18,88],
    ['fa-3','Rui Lin','小林',9,'PG',19,182,75,[68,61,79,62,85],'组织发动机',5,93],
    ['fa-4','Malik Ross','马利克',12,'SF',20,202,91,[65,80,57,76,88],'换防锋线',6,95],
    ['fa-5','Luca Silva','卢卡',28,'SG',22,194,84,[85,62,68,66,73],'接球射手',9,90],
  ];
  return specs.map(([id,name,short,number,position,age,height,weight,core,primaryStyle,salary,potential])=>ClubPlayers.refreshPlayer({id,name,short,number,position,age,height,weight,...Object.fromEntries(ClubPlayers.CORE_KEYS.map((k,i)=>[k,core[i]])),primaryStyle,tag:primaryStyle,salary,baseSalary:salary,potential,familiarity:24,condition:100,stamina:100,team:0,onCourt:false}));
}
class ClubModel {
  constructor(saved=null){
    this.version=2;this.day=1;this.cash=180;this.bond=78;this.prepActions=2;this.attack='Pick and Roll';this.wins=0;this.losses=0;this.activeDay=null;this.lastSettledDay=0;
    this.roster=ClubPlayers.makeTeam(0).map(p=>({...p,baseSalary:p.salary}));this.starters=this.roster.slice(0,5).map(p=>p.id);this.freeAgents=makeFreeAgents();this.history=[];
    this.log('球队成立。八个人，一片球场。');if(saved)this.restore(saved);
  }
  get lineup(){return this.starters.map(id=>this.roster.find(p=>p.id===id)).filter(Boolean);}
  get payroll(){return Math.round(this.roster.reduce((n,p)=>n+p.salary,0)*10)/10;}
  get attributeTotal(){return this.lineup.reduce((n,p)=>n+p.attributeCost,0);}
  get chemistry(){return Math.round(this.bond*.55+(this.lineup.reduce((n,p)=>n+p.familiarity,0)/Math.max(1,this.lineup.length))*.45);}
  get fit(){return Math.round(this.lineup.reduce((n,p)=>n+ClubPlayers.tacticalFit(p,this.attack),0)/Math.max(1,this.lineup.length));}
  get issues(){const issues=[];if(this.starters.length!==5)issues.push(`还需选择 ${Math.max(0,5-this.starters.length)} 位首发（必须五人）`);if(this.attributeTotal>CLUB_LIMITS.attributes)issues.push(`首发能力预算超出 ${this.attributeTotal-CLUB_LIMITS.attributes} 点`);if(this.payroll>CLUB_LIMITS.salary)issues.push('球队薪资超过工资帽');return issues;}
  get advice(){
    const players=this.lineup,result=[];
    if(!players.some(p=>p.playmaking>=80))result.push('缺少组织者：传球与失误控制会承压。');
    if(this.attack==='5-Out'&&players.filter(p=>p.shooting>=78).length<3)result.push('五外需要至少三位可靠射手，低投射内线会压缩空间。');
    if(this.attack==='Pick and Roll'&&(!players.some(p=>p.playmaking>=80)||!players.some(p=>p.finishing>=84&&p.height>=200)))result.push('挡拆需要持球组织者与可靠的顺下终结点。');
    if(!players.some(p=>p.height>=205&&p.defense>=80))result.push('护筐与后场篮板偏弱，考虑一位防守内线。');
    if(this.chemistry<65)result.push('磨合不足：战术合练可以减少失误并提高执行效率。');
    if(!result.length)result.push('阵容职责较完整。观察比赛中的体力和对手防守，再做调整。');return result;
  }
  log(text){this.history.unshift({day:this.day,text});this.history=this.history.slice(0,30);}
  selectStarter(id){
    const p=this.roster.find(p=>p.id===id);if(!p)return {ok:false,message:'球员不在球队中。'};
    if(this.starters.includes(id)){this.starters=this.starters.filter(other=>other!==id);return {ok:true,message:`${p.short} 调整为替补。`};}
    if(this.starters.length>=5)return {ok:false,message:'先移出一位首发，再选择他的替代者。'};
    this.starters.push(id);return {ok:true,message:`${p.short} 进入首发。`};
  }
  sign(id){
    const p=this.freeAgents.find(p=>p.id===id);if(!p)return {ok:false,message:'球员已不在自由市场。'};
    const fee=Math.round(p.salary*.5*10)/10;
    if(this.roster.length>=CLUB_LIMITS.roster)return {ok:false,message:'球队已满 10 人，请先释放一名球员。'};
    if(this.payroll+p.salary>CLUB_LIMITS.salary)return {ok:false,message:'签约会超过工资帽，请先调整薪资结构。'};
    if(this.cash<fee)return {ok:false,message:'球队资金不足以支付签约费。'};
    this.cash=Math.round((this.cash-fee)*10)/10;this.roster.push({...p,baseSalary:p.baseSalary||p.salary});this.freeAgents=this.freeAgents.filter(other=>other.id!==id);this.bond=Math.max(25,this.bond-5);
    this.log(`签约 ${p.name}：周薪 ${p.salary}K，签约费 ${fee}K。新援需要磨合。`);return {ok:true,message:`${p.short} 加盟。磨合度较低，安排合练帮助他融入。`};
  }
  release(id){
    const p=this.roster.find(p=>p.id===id);if(!p)return {ok:false,message:'找不到球员。'};
    if(this.starters.includes(id))return {ok:false,message:'请先将这名球员移出首发。'};
    if(this.roster.length<=5)return {ok:false,message:'球队至少需要五名球员。'};
    const buyout=Math.round(p.salary*.25*10)/10;if(this.cash<buyout)return {ok:false,message:'球队资金不足以支付解约费用。'};
    this.cash=Math.round((this.cash-buyout)*10)/10;this.roster=this.roster.filter(other=>other.id!==id);this.freeAgents.push({...p,familiarity:24,condition:100,onCourt:false});this.bond=Math.max(25,this.bond-2);
    this.log(`与 ${p.name} 解约，支付 ${buyout}K，腾出 ${p.salary}K 周薪。`);return {ok:true,message:`已释放 ${p.short} 的合同。`};
  }
  restructure(id){
    const p=this.roster.find(p=>p.id===id);if(!p)return {ok:false,message:'找不到球员。'};
    if(this.starters.includes(id))return {ok:false,message:'主力球员不接受轮换降薪，请先调整角色。'};
    if(p.restructured)return {ok:false,message:'这份合同已重谈，不能反复降薪。'};
    const old=p.salary;p.salary=Math.round(old*.9*10)/10;p.restructured=true;p.familiarity=Math.max(20,p.familiarity-6);this.bond=Math.max(25,this.bond-2);
    this.log(`${p.short} 接受轮换合同：${old}K → ${p.salary}K。球员信任略有下降。`);return {ok:true,message:`周薪节省 ${(old-p.salary).toFixed(1)}K；球队信任略有下降。`};
  }
  train(kind,playerId=null,key='shooting'){
    if(this.prepActions<=0)return {ok:false,message:'本比赛日的两次备战额度已用完。'};
    const cost=kind==='chemistry'?8:kind==='development'?6:3;if(this.cash<cost)return {ok:false,message:'球队资金不足以安排训练。'};
    if(!['chemistry','development','recovery'].includes(kind))return {ok:false,message:'未知训练项目。'};
    const p=this.roster.find(p=>p.id===playerId);
    if(kind==='development'&&(!p||!ClubPlayers.CORE_KEYS.includes(key)))return {ok:false,message:'请选择球员与训练方向。'};
    if(kind==='development'&&(p[key]>=96||p.overall>=p.potential))return {ok:false,message:'已达到当前培养上限，选择另一名球员或属性。'};
    this.cash-=cost;this.prepActions--;
    if(kind==='chemistry'){this.bond=Math.min(98,this.bond+7);this.roster.forEach(p=>{p.familiarity=Math.min(100,p.familiarity+(p.familiarity<50?14:8));p.condition=Math.max(60,p.condition-3);});this.log('完成战术合练：球队信任与新援磨合提升，体能小幅消耗。');}
    if(kind==='development'){const gain=p.age<=23?2:1;p[key]=Math.min(96,p[key]+gain);p.condition=Math.max(60,p.condition-5);ClubPlayers.refreshPlayer(p);this.log(`${p.short} 完成专项培养：${key} +${gain}，当前总评 ${p.overall}。`);}
    if(kind==='recovery'){this.roster.forEach(p=>p.condition=Math.min(100,p.condition+18));this.log('完成恢复训练：全队赛前体能恢复 18 点。');}
    return {ok:true,message:kind==='chemistry'?'合练完成，化学反应提升。':kind==='development'?`${p.short} 的能力已提升，首发能力预算已重新计算。`:'全队恢复完成。'};
  }
  beginMatch(){if(this.issues.length)return {ok:false,message:this.issues.join('；')};this.activeDay=this.day;return {ok:true,setup:{roster:this.roster.map(p=>({...p,hidden:{...p.hidden}})),starters:[...this.starters],chemistry:this.chemistry,bond:this.bond,attack:this.attack}};}
  completeMatch(score,players){
    if(this.activeDay!==this.day||this.lastSettledDay===this.day)return null;
    const won=score[0]>score[1],income=won?46:32,expense=Math.round(this.payroll/4*10)/10;
    this.cash=Math.max(0,Math.round((this.cash+income-expense)*10)/10);this[won?'wins':'losses']++;this.lastSettledDay=this.day;
    for(const p of this.roster){const played=players.find(other=>other.id===p.id);p.condition=Math.min(100,(played?.stamina??p.condition)+28);p.familiarity=Math.min(100,p.familiarity+(played?.onCourt?5:2));}
    this.bond=Math.min(98,this.bond+2);this.log(`${won?'胜利':'失利'} ${score[0]}:${score[1]} · 收入 ${income}K，比赛日薪资 ${expense}K。`);this.day++;this.prepActions=2;this.activeDay=null;return {income,expense,net:Math.round((income-expense)*10)/10};
  }
  serialize(){return JSON.stringify({version:2,day:this.day,cash:this.cash,bond:this.bond,prepActions:this.prepActions,attack:this.attack,wins:this.wins,losses:this.losses,activeDay:this.activeDay,lastSettledDay:this.lastSettledDay,roster:this.roster,starters:this.starters,freeAgents:this.freeAgents,history:this.history});}
  restore(raw){
    try{
      const s=typeof raw==='string'?JSON.parse(raw):raw;
      if(s.version!==2||!Array.isArray(s.roster)||s.roster.length<5||s.roster.length>10||!Array.isArray(s.starters)||s.starters.length>5||!Array.isArray(s.freeAgents)||s.freeAgents.length>20)throw Error('Invalid save');
      const people=[...s.roster,...s.freeAgents],ids=new Set();
      for(const p of people){if(typeof p.id!=='string'||!/^[a-zA-Z0-9-]+$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||p.name.length>60||typeof p.short!=='string'||p.short.length>30||['name','short','primaryStyle','secondaryStyle','tag'].some(key=>p[key]!==undefined&&(typeof p[key]!=='string'||/[<>]/.test(p[key])))||!['PG','SG','SF','PF','C'].includes(p.position)||!ClubPlayers.CORE_KEYS.every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=100)||!['age','height','weight','potential','number'].every(key=>Number.isFinite(p[key])&&p[key]>=0)||!Number.isFinite(p.salary)||p.salary<=0||p.salary>100||!Number.isFinite(p.familiarity)||p.familiarity<0||p.familiarity>100||!Number.isFinite(p.condition)||p.condition<0||p.condition>100)throw Error('Invalid player');ids.add(p.id);}
      if(new Set(s.starters).size!==s.starters.length||!s.starters.every(id=>s.roster.some(p=>p.id===id)))throw Error('Invalid starters');
      for(const key of ['day','cash','bond','prepActions','wins','losses','lastSettledDay'])if(!Number.isFinite(s[key])||s[key]<0)throw Error('Invalid club values');
      if(s.day<1||s.day>100000||s.bond>100||s.prepActions>2||!['5-Out','Pick and Roll','Motion','Fast Break','Isolation','Inside-Out'].includes(s.attack))throw Error('Invalid configuration');
      for(const key of ['day','cash','bond','prepActions','attack','wins','losses','activeDay','lastSettledDay'])this[key]=s[key];this.roster=s.roster.map(p=>ClubPlayers.refreshPlayer({...p}));this.freeAgents=s.freeAgents.map(p=>ClubPlayers.refreshPlayer({...p}));this.starters=[...s.starters];this.history=Array.isArray(s.history)?s.history.filter(item=>Number.isInteger(item.day)&&item.day>0&&typeof item.text==='string'&&item.text.length<400&&!/[<>]/.test(item.text)).slice(0,29):[];
      this.log('已恢复本机俱乐部存档。');return true;
    }catch{return false;}
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={ClubModel,CLUB_LIMITS,makeFreeAgents};
