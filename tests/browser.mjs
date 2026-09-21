// Requires Playwright installed separately: npm install --no-save playwright
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createGame,transition} from '../src/engine.js';
const profile={name:'테스트 기체',purpose:'scout',keywords:['timid','kind','careful'],value:'self',past:'flood'};
function seedFor(predicate){for(let i=1;i<100000;i++){const s=transition(transition(createGame(profile,i),{type:'depart'}),{type:'choose',id:'enter'});if(predicate(s))return i;}}
const refusalSeed=seedFor(s=>s.phase==='refused');
const failureSeed=seedFor(s=>s.phase==='refused'&&transition(s,{type:'override',confirmed:true}).resolution.result==='failure');
const successSeed=seedFor(s=>s.phase==='outcome'&&s.resolution.result==='success');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
async function seed(n){await page.goto('http://localhost:4173');await page.evaluate(async({profile,n})=>{const e=await import('./src/engine.js');const db=await import('./src/storage.js');await db.commit(e.createGame(profile,n),await db.load(),{replace:true});},{profile,n});await page.reload();}
async function saved(){return page.evaluate(async()=> (await import('./src/storage.js')).load());}
async function click(text){await page.getByRole('button',{name:text,exact:true}).click();}
async function end(){await click('방파제 거점으로 돌아가기');await click('하루를 마치고 일기 쓰기');await click('오늘의 일기 읽기');}
try{
 await page.goto('http://localhost:4173');await page.getByLabel('이름',{exact:true}).fill('<테스트>');
 for(const label of ['소심한','다정한','신중한'])await page.getByText(label,{exact:true}).click();
 await click('기체 활성화');await page.getByRole('button',{name:'신호를 따라 출발하기 · 전력 −8'}).waitFor();assert.equal((await saved()).profile.name,'<테스트>');console.log('PASS character creator, safe text and initial save');
 await seed(refusalSeed);await click('신호를 따라 출발하기 · 전력 −8');await click('통로에 직접 들어가 구조한다');await page.getByRole('heading',{name:'몸이 움직이지 않았다'}).waitFor();const refused=await saved();await page.reload();assert.deepEqual(await saved(),refused);await click('대안을 받아들인다 · 드론 투입');await end();let s=await saved();assert.equal(s.resolution.actualActionId,'remote_rescue');assert.equal(s.diaries.length,1);await page.reload();assert.deepEqual(await saved(),s);console.log('PASS refusal -> reload -> alternative -> memory -> diary -> reload');
 await seed(failureSeed);await click('신호를 따라 출발하기 · 전력 −8');await click('통로에 직접 들어가 구조한다');await click('강제 명령 모듈 사용');await end();s=await saved();assert.equal(s.resolution.result,'failure');assert.equal(s.inventory.override,0);assert.equal(s.character.stability,88);assert.match(s.diaries[0].text,/실패/);await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/sea-mobile.png',fullPage:true});console.log('PASS confirmed override -> failure -> factual diary and single cost');
 for(const width of [320,360,390,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);for(const name of ['탐사','거점','캐릭터','기록']){await click(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}}console.log('PASS 320/360/390/768 layouts all tabs');
 await click('거점');const backup=await saved();await page.getByLabel('JSON 백업 불러오기').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('백업을 불러왔어'));assert.deepEqual(await saved(),backup);await click('기록');console.log('PASS JSON import and usable navigation');
 await seed(successSeed);await click('신호를 따라 출발하기 · 전력 −8');await click('통로에 직접 들어가 구조한다');await end();assert.equal((await saved()).resolution.result,'success');console.log('PASS accepted choice -> success -> diary');
 await seed(refusalSeed);const second=await context.newPage();await second.goto('http://localhost:4173');await click('신호를 따라 출발하기 · 전력 −8');await second.getByRole('button',{name:'신호를 따라 출발하기 · 전력 −8',exact:true}).click();await second.waitForFunction(()=>document.querySelector('#notice').textContent.includes('다른 탭'));assert.equal((await saved()).character.energy,92);await second.close();console.log('PASS stale-tab write rejected without duplicate cost');
 const before=await saved();await page.evaluate(async()=>{const storage=await import('./src/storage.js');const engine=await import('./src/engine.js');const current=await storage.load();const next=engine.transition(current,{type:'choose',id:'drone'});const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Injected quota failure','QuotaExceededError');};try{await storage.commit(next,current);throw Error('Expected failure');}catch(e){if(e.message==='Expected failure')throw e;}finally{IDBObjectStore.prototype.put=put;}});assert.deepEqual(await saved(),before);console.log('PASS simulated transaction failure leaves original save unchanged');
 assert.deepEqual(errors,[]);console.log('PASS no browser JS errors');
 console.log(JSON.stringify({refusalSeed,failureSeed,successSeed}));
}finally{await browser.close();}
