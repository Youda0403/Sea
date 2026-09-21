import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createGame,transition,currentEvent} from '../src/engine.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const profile={name:'테스트 기체',purpose:'scout',keywords:['timid','kind','careful'],value:'self',past:'flood'};
function atWarehouse(seed){let s=transition(createGame(profile,seed),{type:'depart'});s=transition(s,{type:'choose',id:Object.keys(currentEvent(s).choices)[0]});s=transition(s,{type:'continue'});return s;}
function seedFor(predicate){for(let n=1;n<100000;n++){const s=transition(atWarehouse(n),{type:'choose',id:'enter'});if(predicate(s))return n;}throw Error('seed missing');}
const refusalSeed=seedFor(s=>s.phase==='refused');
const failureSeed=seedFor(s=>s.phase==='refused'&&transition(s,{type:'override',confirmed:true}).currentResolution.result==='failure');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
async function saved(){return page.evaluate(async()=>(await import('./src/storage.js')).load());}
async function seed(n){await page.goto('http://localhost:4173');await page.evaluate(async({profile,n})=>{const e=await import('./src/engine.js'),db=await import('./src/storage.js'),old=await db.load();await db.commit(e.createGame(profile,n),old,{replace:true});},{profile,n});await page.reload();}
async function click(name){await page.getByRole('button',{name,exact:true}).click();}
async function firstEvent(){await click('오늘의 탐사 시작');await click('화살표를 따라 안전한 길을 확인한다');}
try{
  await page.goto('http://localhost:4173');
  if(await page.getByRole('button',{name:'기체 활성화',exact:true}).count()){await page.getByLabel('이름',{exact:true}).fill('<테스트>');for(const x of ['소심한','다정한','신중한'])await page.getByText(x,{exact:true}).click();await click('기체 활성화');}
  assert.equal((await saved()).day,1);await page.getByText('탐사 사건 · 1/2').waitFor();await page.getByText('필수 사건 · 2/2').waitFor();console.log('PASS creator and two-event day plan');

  await seed(refusalSeed);await firstEvent();await page.getByRole('heading',{name:'마른 길의 방향'}).waitFor();assert.equal(await page.getByText('처음 고른 행동').count(),0);assert.equal(await page.getByText('실제로 한 행동').count(),0);assert.equal(await page.getByText(/수용/).count(),0);console.log('PASS result screen starts with narrative and hides diagnostic record');
  await click('다음 필수 사건으로 이동');await click('통로에 직접 들어가 구조한다');await page.getByText('CHOICE REFUSED / 선택 거부').waitFor();await page.getByRole('heading',{name:'몸이 선택을 받아들이지 않았다'}).waitFor();const before=await saved();await page.reload();assert.deepEqual(await saved(),before);await click('대체 행동 · 드론으로 우회로를 찾는다');await page.getByText('조우 기록 추가 · 류').waitFor();await click('베이스');await page.getByRole('heading',{name:'류',exact:true}).waitFor();assert.equal(await page.getByText('물류 운반 기체',{exact:true}).count(),1);console.log('PASS explicit refusal, reload stability, alternative and encounter compendium unlock');

  await click('기록');await page.getByText('선택 거부 · 대체 행동').waitFor();assert.equal(await page.getByText('실제로 한 행동',{exact:true}).last().isVisible(),false);await page.getByText('선택 기록 보기').last().click();await page.getByText('실제로 한 행동',{exact:true}).last().waitFor();console.log('PASS detailed choice/actual-action record stays collapsed in archive');

  await seed(failureSeed);await firstEvent();await click('다음 필수 사건으로 이동');await click('통로에 직접 들어가 구조한다');await click('강제 명령 모듈 사용');let s=await saved();assert.equal(s.currentResolution.result,'failure');assert.equal(s.inventory.override,1);assert.equal(s.character.stability,88);assert.equal(await page.getByText('처음 고른 행동').count(),0);console.log('PASS forced failure and simplified result');

  await click('베이스');await click('테스트용 · 같은 캐릭터로 1일차 초기화');s=await saved();assert.equal(s.day,1);assert.equal(s.phase,'hub');assert.equal(s.eventLog.length,0);assert.equal(s.profile.name,'테스트 기체');console.log('PASS one-tap test reset keeps character and restarts route');

  for(const width of [320,360,390,768]){await page.setViewportSize({width,height:844});for(const name of ['탐사','베이스','캐릭터','기록']){await click(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}}await mkdir('test-results',{recursive:true});await page.setViewportSize({width:390,height:844});await click('베이스');await page.screenshot({path:'test-results/base-compendium.png',fullPage:true});console.log('PASS 320/360/390/768 no horizontal overflow');
  assert.deepEqual(errors,[]);console.log('PASS no browser JavaScript errors');console.log(JSON.stringify({refusalSeed,failureSeed}));
}finally{await browser.close();}
