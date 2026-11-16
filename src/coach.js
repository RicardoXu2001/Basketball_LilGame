const ICONS={
 ball:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c7 1 10 4 12.8 12.8M5.6 18.4c1-7 4-10 12.8-12.8"/>',
 play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
 swap:'<path d="M4 7h15l-4-4M20 17H5l4 4M19 7l-4 4M5 17l4-4"/>',
 tactic:'<circle cx="6" cy="17" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 15V6h6M10 3l3 3-3 3M16 15l5 5M21 15l-5 5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 flag:'<path d="M5 22V3c6-5 8 5 15 0v11c-7 5-9-5-15 0"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.ball}</svg>`;
const app=document.getElementById('app');
app.innerHTML=`
<header class="topbar">
  <a class="brand" href="#" aria-label="Streetball Coach 首页"><span class="brand-ball">${icon('ball')}</span><span>STREETBALL<span class="brand-sub">COACH <i>街头篮球教练</i></span></span></a>
  <nav aria-label="主导航"><button class="nav-item active" data-action="match">比赛日 <span>MATCHDAY</span></button><button class="nav-item" data-action="team">我的球队 <span>MY SQUAD</span></button><button class="nav-item" data-action="rules">街区联赛 <span>THE LEAGUE</span></button></nav>
  <div class="header-right"><span class="offline"><i></i> 离线可玩</span><button class="help-button" data-action="help" aria-label="操作指南">${icon('info')}</button><div class="coach-avatar">C<span>教练</span></div></div>
</header>
<main class="match-stage" aria-label="3D 像素街头篮球比赛">
  <canvas id="court" aria-label="固定等距视角的夕阳街头球场"></canvas>
  <div class="location"><span class="eyebrow">NEIGHBORHOOD SERIES / 01</span><h1>这一场，<br>由你掌局<span>。</span></h1><p>${icon('pin')} 河畔球场 <b>RIVERSIDE COURT</b></p><span class="weather">${icon('sun')} 18:42 · 日落时分 <span>24°C</span></span></div>
  <div class="scoreboard" aria-label="实时比分">
    <div class="team team-home"><span class="team-emblem">R</span><div><strong>河畔队</strong><small>RIVERSIDE</small></div></div>
    <div class="score-center"><div class="scores"><strong id="home-score">00</strong><span>:</span><strong id="away-score">00</strong></div><div class="clock-row"><span id="period">Q1</span><b id="game-clock">03:00</b><span class="live-dot"></span><span id="live-label">LIVE</span></div></div>
    <div class="team team-away"><div><strong>铁街队</strong><small>IRON STREET</small></div><span class="team-emblem">I</span></div>
  </div>
  <aside class="sideline-note"><div class="note-title"><span class="tiny-square"></span> 场边观察 <span>COURTSIDE</span></div><div id="possession-label" class="possession-label">河畔队持球</div><div class="shot-line"><span>进攻时间</span><strong id="shot-clock">24<span>s</span></strong></div><div class="shot-track"><i id="shot-fill"></i></div><p id="play-label">组织推进</p><div class="note-divider"></div><div class="on-court-legend"><i></i> 河畔队 <i></i> 铁街队</div><div class="handler-label">持球球员 <b id="handler-name">#3 迈尔斯</b></div></aside>
  <div id="court-banner" class="court-banner" hidden></div>
  <div class="stage-bottom"><div class="stage-status"><i></i><span>街区友谊赛</span><em>5 v 5</em><span class="status-divider"></span><span>每一回合，都有你的决定。</span></div><button class="tactics-toggle" data-action="overlay" aria-pressed="false">${icon('tactic')} 战术视图 <span class="toggle-switch"></span></button></div>
  <div id="webgl-error" class="webgl-error" hidden></div>
</main>
<section class="coach-desk" aria-label="教练控制台">
  <div class="desk-toolbar"><div class="desk-title">${icon('tactic')} <h2>教练工作台</h2><span>COACH’S DESK</span><span class="desk-state" id="desk-state">比赛进行中</span></div><div class="match-controls"><button class="timeout-button" data-action="timeout">${icon('flag')} 请求暂停 <span id="timeout-count">3</span></button><span class="control-divider"></span><button class="pause-button" data-action="pause" aria-label="暂停比赛">${icon('pause')}<span id="pause-label">暂停</span></button><div class="speed-controls" aria-label="比赛速度">${[1,2,4].map(n=>`<button data-speed="${n}" class="${n===1?'selected':''}" aria-pressed="${n===1}">${n}×</button>`).join('')}</div><button class="restart-button" data-action="restart" aria-label="重新开始">${icon('reset')}</button></div></div>
  <div class="desk-grid">
    <section class="roster-panel"><div class="panel-heading"><h3>我的阵容 <span id="lineup-count">5 人在场</span></h3><button class="text-button" data-action="sub">${icon('swap')} 换人</button></div><div class="roster-tabs" role="tablist" aria-label="阵容筛选"><button role="tab" aria-selected="true" data-roster="court" class="selected">场上球员 <span>05</span></button><button role="tab" aria-selected="false" data-roster="bench">替补席 <span>03</span></button><span>点击球员查看详情</span></div><div class="roster-table-wrap"><table class="roster-table"><thead><tr><th>球员 / 位置</th><th>体力</th><th>得分</th><th>犯规</th><th>状态</th></tr></thead><tbody id="roster-body"></tbody></table></div></section>
    <section class="tactics-panel"><div class="panel-heading"><h3>战术板</h3><span class="applied">${icon('check')} 即时生效</span></div><div class="tactic-section-label">进攻战术 <span>OFFENSE</span></div><div class="offense-options">${Object.entries(ATTACKS).map(([key,t],i)=>`<button class="offense-button ${i===1?'selected':''}" data-attack="${key}" title="${t.hint}" aria-pressed="${i===1}"><span class="play-diagram diagram-${i}"><i></i><i></i><i></i><i></i><i></i></span><span><b>${key}</b><small>${t.name}</small></span>${icon('check')}</button>`).join('')}</div><div class="strategy-row"><label>防守策略<select id="defense" aria-label="防守策略">${Object.entries(DEFENSES).map(([key,v])=>`<option value="${key}">${v}</option>`).join('')}</select></label><label>进攻重点<select id="focus" aria-label="进攻重点">${Object.entries(FOCUSES).map(([key,v])=>`<option value="${key}">${v}</option>`).join('')}</select></label></div><div class="tempo-row"><span>比赛节奏</span><div class="tempo-options">${[['Slow','稳扎稳打'],['Balanced','均衡'],['Fast','快速']].map(([k,v])=>`<button data-tempo="${k}" class="${k==='Balanced'?'selected':''}" aria-pressed="${k==='Balanced'}">${v}</button>`).join('')}</div></div></section>
    <section class="events-panel"><div class="panel-heading"><h3>比赛动态 <span class="feed-live"><i></i> LIVE FEED</span></h3><button class="text-button" data-action="stats" title="查看技术统计">数据 ${icon('chevron')}</button></div><div id="event-feed" class="event-feed" tabindex="0" aria-label="比赛事件记录"></div><div class="coach-tip" id="coach-tip">${icon('info')} 挡拆配合：持球人和内线协作。</div></section>
  </div>
  <footer class="desk-footer"><span><i></i> 你的战术，正在场上发生。</span><span id="footer-tactic">PICK AND ROLL <b> / </b> MAN-TO-MAN</span><span>STREETBALL COACH <b>·</b> CLUB EDITION 02</span></footer>
</section>
<dialog id="modal"><div id="modal-content"></div></dialog>
<div id="toast" class="toast" role="status"></div>`;

class UIController {
  constructor(engine) {
    this.engine=engine;this.filter='court';this.lastRevision=-1;this.lastRoster='';this.lastTick=-1;this.modal=document.getElementById('modal');this.toastTimer=null;
    app.addEventListener('click',event=>this.click(event));
    document.getElementById('defense').addEventListener('change',event=>engine.setTactic('defense',event.target.value));
    document.getElementById('focus').addEventListener('change',event=>engine.setTactic('focus',event.target.value));
    this.modal.addEventListener('click',event=>{if(event.target===this.modal)this.modal.close();});
    this.modal.addEventListener('change',event=>{if(event.target.id==='sub-out')this.openSub(event.target.value);});
    document.addEventListener('keydown',event=>{if(event.code==='Space'&&!this.modal.open&&!['SELECT','INPUT','BUTTON','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();engine.togglePause();} });
  }
  toast(message) {const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);}
  click(event) {
    const el=event.target.closest('button,[data-player],.brand');if(!el)return;const e=this.engine;
    if(el.matches('.brand')){event.preventDefault();return;}
    if(el.dataset.attack){e.setTactic('attack',el.dataset.attack);this.toast(`${el.dataset.attack} · ${ATTACKS[el.dataset.attack].hint}`);}
    if(el.dataset.tempo)e.setTactic('tempo',el.dataset.tempo);
    if(el.dataset.speed){e.speed=Number(el.dataset.speed);e.revision++;}
    if(el.dataset.roster){this.filter=el.dataset.roster;this.lastRoster='';this.update();}
    if(el.dataset.player)this.playerDetails(el.dataset.player);
    if(el.dataset.subIn){const out=document.getElementById('sub-out').value;if(e.substitute(out,el.dataset.subIn)){this.modal.close();this.toast(e.paused?'换人完成':'已排队，将在本回合结束时换人');}else this.toast(e.lastSubError||'无法执行换人，请选择其他球员。');}
    const action=el.dataset.action;
    if(action==='pause')e.togglePause();
    if(action==='timeout'){if(e.timeout())this.toast('暂停中 · 调整战术或换人后，点击继续');else this.toast('本场暂停次数已用完');}
    if(action==='overlay'&&court){court.showTactics=!court.showTactics;el.setAttribute('aria-pressed',court.showTactics);}
    if(action==='quality'&&court){court.quality=court.quality==='clear'?'retro':'clear';court.resize();el.textContent=court.quality==='clear'?'画质：清晰':'画质：复古';el.setAttribute('aria-pressed',court.quality==='clear');}
    if(action==='sub')this.openSub(el.dataset.out);
    if(action==='team'){if(!e.started)hub.show('lineup');else this.teamDetails();}
    if(action==='rules')this.info('街区联赛','NEIGHBORHOOD SERIES',`<div class="league-card"><span>RIVERSIDE COURT</span><h3>河畔球场 · 日落对决</h3><p>河畔队 vs 铁街队</p><div class="rule-grid"><div><b>5 v 5</b><span>全场街头篮球</span></div><div><b>4 × 3′</b><span>四节 · 每节三分钟</span></div><div><b>24″</b><span>单回合进攻时间</span></div><div><b>3 次</b><span>球队暂停机会</span></div></div></div><p class="modal-copy">你担任河畔队教练。常规时间打平后进入一分钟加时，直到分出胜负。六次犯规离场。第三节交换半场。这里没有排名压力，先打好眼前的每一个回合。</p>`);
    if(action==='help')this.info('把场边，变成你的主场。','COACH’S PLAYBOOK',`<div class="help-steps"><div><b>01</b><section><h3>先看比赛</h3><p>金色圆环标记持球人。蓝绿色是你的河畔队，橙色是铁街队。比分、进攻时间和事件会实时更新。</p></section></div><div><b>02</b><section><h3>做出决定</h3><p>点击六种进攻战术，改变跑位与出手倾向。调整防守、进攻重点和节奏，观察下个回合的执行。</p></section></div><div><b>03</b><section><h3>管理体力</h3><p>点击球员查看五项核心能力与打法适配。选择替补换人；进行中的换人会在回合结束执行，暂停时立即执行。暂停恢复 9 点体力。</p></section></div></div><div class="keyboard-hint"><kbd>SPACE</kbd> 暂停 / 继续 <span>·</span> <kbd>ESC</kbd> 关闭面板</div>`);
    if(action==='match'){this.modal.close();if(!e.started)hub.show();else document.querySelector('.match-stage').scrollIntoView({behavior:'smooth',block:'start'});}
    if(action==='stats')this.stats();
    if(action==='close')this.modal.close();
    if(action==='restart')this.info(e.ended?'回到球队总部':'返回赛前准备？','CLUB HEADQUARTERS',`<p class="modal-copy">${e.ended?'本场经营收入已结算，可以准备下一场比赛。':'本场比赛尚未结束。返回后将重新备战，这场比赛不结算收入。'}</p><button class="primary-button" data-action="return-club">${icon('arrow')} 返回球队总部</button>`);
    if(action==='return-club'){this.modal.close();hub.show();}
    if(action==='release-player'){const result=club.release(el.dataset.id);this.modal.close();hub.notify(result);}
    if(action==='new-club'){Object.assign(club,new ClubModel());hub.save();this.modal.close();hub.show('lineup');this.toast('新俱乐部已建立。');}
    this.update();
  }
  info(title,kicker,body) {document.getElementById('modal-content').innerHTML=`<div class="modal-top"><span class="eyebrow">${kicker}</span><button data-action="close" class="modal-close" aria-label="关闭">${icon('close')}</button></div><h2>${title}</h2>${body}`;if(!this.modal.open)this.modal.showModal();}
  playerDetails(id) {
    const p=(this.engine.started?this.engine.teams.flat():[...club.roster,...club.freeAgents]).find(p=>p.id===id);if(!p)return;
    const labels=CORE_LABELS;
    this.info(p.name,`PLAYER PROFILE / #${p.number}`,`<div class="player-profile"><div class="profile-jersey ${p.team?'away':''}">${p.number}</div><div><span class="player-role">${p.position} · ${p.primaryStyle}${p.secondaryStyle?' / '+p.secondaryStyle:''}</span><h3>${p.short} <span class="profile-ovr">${p.overall} OVR</span></h3><p>${p.age} 岁 · ${p.height}cm / ${p.weight}kg · 体能 ${Math.round(this.engine.started?p.stamina:p.condition)}%</p></div></div>${this.engine.started?`<div class="profile-stats">${[['得分',p.points],['助攻',p.assists],['篮板',p.rebounds],['抢断',p.steals]].map(([k,v])=>`<div><b>${v||0}</b><span>${k}</span></div>`).join('')}</div>`:''}<div class="attribute-grid five-core">${Object.entries(labels).map(([key,label])=>`<div><label>${label}<b>${p[key]}</b></label><span><i style="width:${p[key]}%"></i></span></div>`).join('')}</div><div class="profile-fit-note"><b>战术适配 ${tacticalFit(p,this.engine.started?this.engine.attack:club.attack)} · ${fitLabel(tacticalFit(p,this.engine.started?this.engine.attack:club.attack))}</b><p>首发能力成本 ${p.attributeCost} · 熟悉度 ${p.familiarity} · 周薪 ${p.salary}K</p><small>OVR 按位置加权计算；具体投篮、控球、篮板等细节由隐藏能力参与模拟。</small></div>${this.engine.started&&!p.team&&p.onCourt&&!this.engine.ended?`<button class="primary-button" data-action="sub" data-out="${id}">${icon('swap')} 为 ${p.short} 安排轮换</button>`:''}`);
  }
  openSub(outId) {
    const e=this.engine,out=e.lineup(0).find(p=>p.id===outId)||e.lineup(0)[0];
    this.info('让新鲜体力上场。','ROTATION / 换人调整',`<p class="modal-copy">${e.paused?'比赛已暂停，换人立即生效。':'比赛进行中，换人会在本回合结束时执行。'}</p><label class="sub-label">换下球员<select id="sub-out">${e.lineup(0).map(p=>`<option value="${p.id}" ${p===out?'selected':''}>#${p.number} ${p.name} · ${p.position} · 体力 ${Math.round(p.stamina)}%</option>`).join('')}</select></label><div class="bench-options">${e.teams[0].filter(p=>!p.onCourt).map(p=>`<button data-sub-in="${p.id}" ${p.fouls>=6?'disabled':''}><span class="mini-jersey">${p.number}</span><span><b>${p.name}</b><small>${p.position} · ${p.tag} · ${p.fouls>=6?'六犯离场':`体力 ${Math.round(p.stamina)}%`}</small></span><span>换上 ${icon('arrow')}</span></button>`).join('')}</div>${e.pendingSubs.length?`<p class="modal-copy">已有 ${e.pendingSubs.length} 组换人等待执行。</p>`:''}`);
  }
  teamDetails(){const e=this.engine;this.info('河畔队','RIVERSIDE / MY SQUAD',`<p class="modal-copy">八个人，同一片球场。点击姓名查看球员状态和能力。</p><div class="squad-list">${e.teams[0].map(p=>`<button data-player="${p.id}"><span class="mini-jersey">${p.number}</span><span><b>${p.name}</b><small>${p.position} · ${p.tag}</small></span><span class="squad-status">${p.onCourt?'场上':'替补'} · ${Math.round(p.stamina)}%</span>${icon('chevron')}</button>`).join('')}</div>`);}
  stats(){const e=this.engine;this.info('每个回合，都有记录。','BOX SCORE / 技术统计',`<div class="stats-match"><b>河畔队</b><strong>${e.score[0]} : ${e.score[1]}</strong><b>铁街队</b></div>${e.teams.map((team,i)=>`<h3 class="stats-team-title">${i?'IRON STREET / 铁街队':'RIVERSIDE / 河畔队'}</h3><table class="box-score"><thead><tr><th>球员</th><th>得分</th><th>篮板</th><th>助攻</th><th>投篮</th></tr></thead><tbody>${team.map(p=>`<tr><td><button data-player="${p.id}">#${p.number} ${p.short}</button></td><td>${p.points}</td><td>${p.rebounds}</td><td>${p.assists}</td><td>${p.made}/${p.attempts}</td></tr>`).join('')}</tbody></table>`).join('')}`);}
  update() {
    const e=this.engine;
    if(e.ended&&!e.settled){club.attack=e.attack;e.settlement=club.completeMatch(e.score,e.teams[0]);e.settled=true;hub.save();}
    document.getElementById('home-score').textContent=String(e.score[0]).padStart(2,'0');document.getElementById('away-score').textContent=String(e.score[1]).padStart(2,'0');
    document.getElementById('period').textContent=e.period>4?`OT${e.period-4}`:`Q${e.period}`;document.getElementById('game-clock').textContent=clockText(e.clock);
    document.getElementById('shot-clock').innerHTML=`${Math.ceil(e.shotClock).toString().padStart(2,'0')}<span>s</span>`;
    document.getElementById('shot-fill').style.width=`${e.shotClock/24*100}%`;document.getElementById('shot-fill').classList.toggle('urgent',e.shotClock<5);
    document.getElementById('possession-label').textContent=e.ended?'全场比赛结束':`${e.possession?'铁街队':'河畔队'}持球 ${e.possession?'←':'→'}`;
    document.getElementById('handler-name').textContent=`#${e.handler.number} ${e.handler.short}`;
    document.getElementById('play-label').textContent=e.lastAction;
    const rosterKey=`${this.filter}-${Math.floor(e.time)}-${e.revision}`;
    if(this.lastRoster!==rosterKey){this.lastRoster=rosterKey;this.renderRoster();}
    if(this.lastRevision===e.revision)return;this.lastRevision=e.revision;
    document.getElementById('live-label').textContent=e.ended?'FINAL':e.paused?'PAUSED':'LIVE';
    document.querySelector('.clock-row').classList.toggle('is-paused',e.paused);
    document.getElementById('desk-state').textContent=e.ended?'全场结束':e.paused?'暂停调整中':'比赛进行中';
    document.querySelector('.pause-button').innerHTML=`${icon(e.paused?'play':'pause')}<span>${e.paused?'继续':'暂停'}</span>`;
    document.querySelector('.pause-button').setAttribute('aria-label',e.paused?'继续比赛':'暂停比赛');
    document.querySelector('.pause-button').disabled=e.ended;
    document.getElementById('timeout-count').textContent=e.timeouts[0];document.querySelector('[data-action="timeout"]').disabled=!e.timeouts[0]||e.ended;
    document.querySelector('[data-action="sub"]').disabled=e.ended;
    document.querySelectorAll('[data-speed]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.speed)===e.speed);b.setAttribute('aria-pressed',Number(b.dataset.speed)===e.speed);});
    document.querySelectorAll('[data-attack]').forEach(b=>{b.classList.toggle('selected',b.dataset.attack===e.attack);b.setAttribute('aria-pressed',b.dataset.attack===e.attack);b.disabled=e.ended;});
    document.querySelectorAll('[data-tempo]').forEach(b=>{b.classList.toggle('selected',b.dataset.tempo===e.tempo);b.setAttribute('aria-pressed',b.dataset.tempo===e.tempo);b.disabled=e.ended;});
    for(const id of ['defense','focus']){document.getElementById(id).value=e[id];document.getElementById(id).disabled=e.ended;}
    document.getElementById('footer-tactic').innerHTML=`${e.attack.toUpperCase()} <b> / </b> ${e.defense.toUpperCase()}`;
    document.getElementById('coach-tip').innerHTML=`${icon('info')} ${ATTACKS[e.attack].hint}。`;
    const feed=document.getElementById('event-feed'),oldScroll=feed.scrollTop;
    feed.innerHTML=e.events.map(ev=>`<div class="event ${ev.type}"><time>${ev.time}</time><span class="event-icon">${ev.type==='score'?'+':ev.type==='tactic'?'↗':ev.type==='sub'?'⇄':ev.type==='miss'?'×':ev.type==='rebound'?'↓':'·'}</span><p>${ev.text}</p>${ev.team===0?'<i class="home-event"></i>':''}</div>`).join('');feed.scrollTop=oldScroll;
    const banner=document.getElementById('court-banner');banner.hidden=!e.paused&&!e.result;
    banner.innerHTML=e.ended?`<span>FINAL WHISTLE</span><b>${e.score[0]>e.score[1]?'拿下这片球场。':'下一场，赢回来。'}</b><p>河畔队 ${e.score[0]} : ${e.score[1]} 铁街队</p><p>${e.settlement?`本场收入 ${e.settlement.income}K · 薪资 ${e.settlement.expense}K`:''}</p><button data-action="return-club">下一场备战 ${icon('arrow')}</button>`:e.paused?`<span>TIME TO REGROUP</span><b>比赛已暂停</b><p>看看体力，调整战术。准备好就继续。</p><button data-action="pause">${icon('play')} 继续比赛</button>`:`<span>${e.shot?.three?'FROM DOWNTOWN':'STRAIGHT TO THE RIM'}</span><b>${e.result} ${e.shot?.three?'THREE!':'BUCKET!'}</b>`;
  }
  renderRoster() {
    const e=this.engine;document.querySelectorAll('[data-roster]').forEach(b=>{b.classList.toggle('selected',b.dataset.roster===this.filter);b.setAttribute('aria-selected',b.dataset.roster===this.filter);});
    document.querySelector('[data-roster="court"] span').textContent=String(e.lineup(0).length).padStart(2,'0');document.querySelector('[data-roster="bench"] span').textContent=String(e.teams[0].filter(p=>!p.onCourt).length).padStart(2,'0');
    document.getElementById('lineup-count').textContent=`${e.lineup(0).length} 人在场`;
    document.getElementById('roster-body').innerHTML=e.teams[0].filter(p=>p.onCourt===(this.filter==='court')).map(p=>`<tr><td><button class="roster-player" data-player="${p.id}"><span class="mini-jersey">${p.number}</span><span><b>${p.name}</b><small>${p.position} <i>·</i> ${p.tag}</small></span></button></td><td><div class="energy"><span><i class="${p.stamina<35?'low':''}" style="width:${p.stamina}%"></i></span><b>${Math.round(p.stamina)}<small>%</small></b></div></td><td class="numeric">${p.points}</td><td class="numeric muted">${p.fouls}</td><td><span class="heat ${p.heat>0?'hot':p.heat<0?'cold':''}">${p.heat>0?'↑ 火热':p.heat<0?'↓ 冷却':'— 稳定'}</span></td></tr>`).join('');
  }
}
const club=new ClubModel();let saveNotice='';try{const saved=localStorage.getItem(CLUB_SAVE_KEY);if(saved&&!club.restore(saved))saveNotice='旧存档不可用，已建立新俱乐部。';}catch{saveNotice='浏览器未开放本机存档，本次进度仅保留在当前页面。';}
const match=new MatchEngine({autoStart:false});
const ui=new UIController(match);
let court;
try {court=new CourtRenderer(document.getElementById('court'),match);}
catch(error){const panel=document.getElementById('webgl-error');panel.hidden=false;panel.innerHTML='<h2>球场暂时无法显示</h2><p>请使用支持 WebGL 的浏览器，并开启硬件加速后刷新页面。</p>';console.error(error);}
const hub=new ClubHub(club,match,ui);if(saveNotice){hub.storageWarning=saveNotice;hub.render();}
document.querySelector('.stage-bottom').insertAdjacentHTML('beforeend','<button class="quality-button" data-action="quality" aria-pressed="true">画质：清晰</button>');
document.querySelector('.restart-button').setAttribute('aria-label','返回球队总部');document.querySelector('.restart-button').title='返回球队总部';
let previous=performance.now(),uiElapsed=0;
function frame(now){const dt=Math.min(.075,(now-previous)/1000);previous=now;if(match.started){match.update(dt);court?.render(dt);uiElapsed+=dt;if(uiElapsed>.14){ui.update();uiElapsed=0;}}requestAnimationFrame(frame);}
ui.update();requestAnimationFrame(frame);
// Readable diagnostics for local development and deterministic verification.
window.streetball={match,ui,club,hub,get court(){return court;}};


