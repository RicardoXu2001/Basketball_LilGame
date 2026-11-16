// Re-run logic checks and bind the observed browser journey to this exact build.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const command='node qa/verify.mjs',evidence='qa/evidence/run.json';
fs.mkdirSync('qa/evidence',{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const run=args=>spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
const build=run(['build.mjs']);
const tests=run(['--test','tests/match.test.cjs']);
fs.writeFileSync('qa/evidence/test.log',`${tests.stdout||''}${tests.stderr||''}`);
const checks=Object.fromEntries(['launch','render','input','coreLoop','outcome','restart'].map(key=>[key,'NOT_RUN']));
let browser=null,error=null,artifactSha256=null,threeRevision=null;
try {
  if(build.status!==0)throw new Error(`Build failed: ${build.stderr}`);
  const html=fs.readFileSync('index.html','utf8');artifactSha256=hash(html);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if(scripts.length!==2)throw new Error('Expected two inline scripts');
  scripts.forEach((script,i)=>new vm.Script(script[1],{filename:`inline-${i}.js`}));
  if(/<(?:script|img)[^>]+src\s*=|<link[^>]+href\s*=/i.test(html))throw new Error('External document dependency detected');
  const context={console};vm.runInNewContext(fs.readFileSync('three.min.js','utf8'),context);threeRevision=context.THREE.REVISION;
  if(!fs.existsSync('qa/evidence/browser.json'))throw new Error('NOT_RUN: collect the browser journey first');
  browser=JSON.parse(fs.readFileSync('qa/evidence/browser.json','utf8'));
  if(browser.artifactSha256!==artifactSha256)throw new Error('Browser evidence belongs to a different build; collect it again');
  const state=step=>browser.checkpoints.find(c=>c.step===step)?.state;
  const initial=state('initial reload observed'),input=state('tactics, timeout, substitution'),final=state('final outcome'),restart=state('restart');
  const exists=file=>fs.existsSync(file)&&fs.statSync(file).size>1500;
  const noErrors=!browser.console.some(log=>log.level==='error');
  checks.launch=initial&&noErrors?'PASS':'FAIL';
  checks.render=exists('qa/evidence/desktop.jpg')&&exists('qa/evidence/final.jpg')&&exists('qa/evidence/court-before.jpg')&&exists('qa/evidence/court-after.jpg')&&hash(fs.readFileSync('qa/evidence/court-before.jpg'))!==hash(fs.readFileSync('qa/evidence/court-after.jpg'))?'PASS':'FAIL';
  checks.input=input?.selectedAttack==='5-Out'&&input.defense==='2-3 Zone'&&input.tempo==='Fast'&&input.status==='PAUSED'&&input.roster.some(p=>p.includes('Leo Chen'))?'PASS':'FAIL';
  const statTotals=browser.stats?.map(team=>team.reduce((total,row)=>total+Number(row[1]),0));
  checks.coreLoop=tests.status===0&&statTotals?.every((total,i)=>total===Number(final?.score[i]))&&statTotals.every(total=>total>0)?'PASS':'FAIL';
  checks.outcome=final?.status==='FINAL'&&final.clock==='00:00'&&final.score[0]!==final.score[1]?'PASS':'FAIL';
  checks.restart=restart?.score.every(n=>n==='00')&&restart.period==='Q1'&&restart.selectedAttack==='Pick and Roll'&&restart.speed==='1'&&restart.roster.some(p=>p.includes('Miles Carter'))&&!restart.roster.some(p=>p.includes('Leo Chen'))?'PASS':'FAIL';
} catch(caught) {error=caught.message;if(!error.startsWith('NOT_RUN:'))checks.launch='FAIL';}
const status=Object.values(checks).every(s=>s==='PASS')?'PASS':Object.values(checks).includes('FAIL')?'FAIL':'NOT_RUN';
const exitCode=status==='PASS'?0:1;
const limitations=[
  {scope:'offline file launch',reason:'In-app browser security policy rejected file:// navigation. Offline dependencies are statically verified; the full browser journey used local HTTP.'},
  {scope:'simulation',reason:'Probabilistic simplified defense and procedural movement; no body collision solver, full officiating or animated free throws. Last eligible player stays if all eight foul out.'},
  {scope:'devices and balance',reason:'1440×960 desktop and 390×844 responsive layout observed. Actual mobile hardware, other browsers, long-term balance and career saving were not tested.'},
];
if(error)limitations.push({scope:'verification',reason:error});
const terminal=checks.outcome==='PASS'?'designed-outcome':'NOT_RUN';
const restart=checks.restart==='PASS'?'initial-state':'NOT_RUN';
const machineEvidence={qa:{command,exitCode,completeRun:{terminal,restart},checks},generatedAt:new Date().toISOString(),runtime:{node:process.version,threeRevision,browser:browser?.runtime},artifactSha256,browserEvidence:'qa/evidence/browser.json',tests:{exitCode:tests.status,log:'qa/evidence/test.log'},error};
const report={schemaVersion:2,status,verify:{command,exitCode,suites:[{name:'offline build and inline syntax',exitCode:build.status},{name:'simulation regression, 6 tests',exitCode:tests.status}]},completeRun:{id:'coaching-match-to-final-and-restart',cleanContext:true,terminal,restart,evidence},checks:Object.fromEntries(Object.entries(checks).map(([key,value])=>[key,{status:value,evidence:[evidence]}])),limitations};
function atomicWrite(file,value){fs.writeFileSync(`${file}.tmp`,JSON.stringify(value,null,2)+'\n');fs.renameSync(`${file}.tmp`,file);}
atomicWrite(evidence,machineEvidence);atomicWrite('qa/verification.json',report);
fs.writeFileSync('qa/QA_REPORT.md',`# Streetball Coach 验证记录\n\n状态：${status}\n\n命令：\`${command}\`，退出码 ${exitCode}。\n\n环境：${process.version}，Three.js r${threeRevision}，${browser?.runtime||'NOT_RUN'}。\n\n${Object.entries(checks).map(([key,value])=>`- ${key}: ${value}`).join('\n')}\n\n实机路径：开赛 → 五外 / 联防 / 快节奏 → 暂停 → Leo Chen 替补上场 → 4× → 全场 41:27 → 重开归零。状态与画面位于 \`qa/evidence\`。六组模拟回归同时检查完整比赛、数值不变量和倍速一致性。\n\n限制：\n\n${limitations.map(l=>`- ${l.scope}: ${l.reason}`).join('\n')}\n\n不将这些检查视为趣味性、长期平衡或商业发布质量的证明。\n`);
console.log(`${status}: ${Object.entries(checks).map(([key,value])=>`${key}=${value}`).join(', ')}`);
if(error)console.error(error);
process.exitCode=exitCode;
