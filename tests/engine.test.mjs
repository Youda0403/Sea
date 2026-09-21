import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,transition,validateSave,validateContent,conflict,currentEvent,departureGate,availableExplorations,gate} from '../src/engine.js';
import {events,schedule,people,MAX_DAY} from '../src/content.js';
const profile={name:'테스트',purpose:'scout',keywords:['timid','kind','careful'],value:'self',past:'flood'};
function toMain(seed){let s=transition(createGame(profile,seed),{type:'depart'});const id=Object.keys(currentEvent(s).choices)[0];s=transition(s,{type:'choose',id});if(s.phase==='refused')s=transition(s,{type:'alternative'});return transition(s,{type:'continue'});}
function mainChoice(seed,id='enter'){const s=toMain(seed);return transition(s,{type:'choose',id});}
function find(predicate){for(let seed=1;seed<100000;seed++){const s=mainChoice(seed);if(predicate(s))return seed;}throw Error('seed not found');}
function chooseAffordable(s,preferred){const choices=currentEvent(s).choices;const id=preferred&&choices[preferred]?preferred:Object.entries(choices).sort((a,b)=>a[1].cost-b[1].cost)[0][0];let next=transition(s,{type:'choose',id});if(next.phase==='refused')next=transition(next,{type:'alternative'});return next;}
function fullRun(seed=10){let s=createGame(profile,seed);while(s.phase!=='ending'){
  if(s.phase==='hub'){
    while(departureGate(s)&&s.inventory.cell&&s.character.energy<100)s=transition(s,{type:'useItem',id:'cell'});
    if(s.character.integrity<=10&&s.inventory.kit)s=transition(s,{type:'useItem',id:'kit'});
    s=transition(s,{type:'depart'});
  }else if(s.phase==='scene')s=chooseAffordable(s,currentEvent(s).kind==='main'?Object.keys(currentEvent(s).choices)[0]:undefined);
  else if(s.phase==='outcome')s=transition(s,{type:'continue'});
  else if(s.phase==='returned')s=transition(s,{type:'endDay'});
  else throw new Error('unexpected phase '+s.phase);
  validateSave(s);
 }return s;
}
test('35 authored events retain 14 scheduled days with one ambient and one required event',()=>{validateContent();assert.equal(Object.keys(events).length,35);assert.equal(Object.values(events).filter(e=>e.kind==='main').length,14);assert.equal(Object.keys(schedule).length,MAX_DAY);});
test('character rejects invalid and duplicate keywords',()=>assert.throws(()=>createGame({...profile,keywords:['kind','kind','kind']})));
test('same seed and input produce identical outcomes; original state is immutable',()=>{const s=toMain(55),old=structuredClone(s);assert.deepEqual(transition(s,{type:'choose',id:'enter'}),transition(s,{type:'choose',id:'enter'}));assert.deepEqual(s,old);});
test('personality, value and past affect refusal conflict',()=>{const shy=toMain(1);let brave=createGame({...profile,keywords:['bold','impulsive','social'],value:'truth',past:'blank'},1);brave=transition(brave,{type:'depart'});brave=chooseAffordable(brave);brave=transition(brave,{type:'continue'});assert.ok(conflict(shy,currentEvent(shy).choices.enter)>conflict(brave,currentEvent(brave).choices.enter));});
test('refusal -> alternative keeps intended and actual action separate',()=>{const seed=find(s=>s.phase==='refused'),s=mainChoice(seed);const r=transition(s,{type:'alternative'}).currentResolution;assert.equal(r.intendedActionId,'direct_rescue');assert.equal(r.actualActionId,'remote_rescue');assert.equal(r.decision,'refuse');});
test('forced failure consumes once and records factual memory',()=>{const seed=find(s=>s.phase==='refused'&&transition(s,{type:'override',confirmed:true}).currentResolution.result==='failure');const s=transition(mainChoice(seed),{type:'override',confirmed:true});assert.equal(s.inventory.override,1);assert.equal(s.character.stability,88);assert.equal(s.currentResolution.forcedOverrideUsed,true);assert.match(s.memories.at(-1).text,/실패/);assert.throws(()=>transition(s,{type:'override',confirmed:true}));});
test('base items repair and charge only before departure',()=>{let s=createGame(profile,1);s.character.integrity=60;s.character.energy=40;s=transition(s,{type:'useItem',id:'kit'});s=transition(s,{type:'useItem',id:'cell'});assert.equal(s.character.integrity,85);assert.equal(s.character.energy,75);assert.equal(s.inventory.kit,1);assert.equal(s.inventory.cell,1);s=transition(s,{type:'depart'});assert.throws(()=>transition(s,{type:'useItem',id:'cell'}));});
test('complete route always reaches an ending on day 14 with 28 memories and 14 diaries',()=>{const s=fullRun();assert.equal(s.phase,'ending');assert.equal(s.day,14);assert.equal(s.eventLog.length,28);assert.equal(s.memories.length,28);assert.equal(s.diaries.length,14);assert.ok(['home','archive','silence'].includes(s.ending.id));assert.ok(s.discoveries.length>=Object.keys(people).length-1);});
test('every day and every outcome retains valid save invariants across 200 full runs',()=>{for(let seed=1;seed<=200;seed++)validateSave(fullRun(seed));});
test('v1 completed save migrates to day 2 and preserves memory/diary',()=>{let old=createGame(profile,1);old.saveVersion=1;old.phase='ended';old.day=1;old.inventory={drone:1,override:1,kit:1};old.resolution={eventInstanceId:'old:warehouse:1',eventId:'warehouse-signal-01',gameDay:1,playerChoiceId:'drone',intendedActionId:'remote_rescue',actualActionId:'remote_rescue',outcomeId:'remote',result:'success',forcedOverrideUsed:false,itemUses:[],outcomeTags:['rescued'],decision:'accept',attempts:[{choiceId:'drone',decision:'accept'}],before:old.character,after:old.character};old.memories=[{id:'m',sourceEventInstanceId:'old:warehouse:1',text:events.warehouse_signal.outcomes.remote.fact,tags:['rescued']}];old.diaries=[{day:1,text:events.warehouse_signal.outcomes.remote.fact,sourceEventInstanceIds:['old:warehouse:1'],templateIds:['remote'],voiceId:'quiet'}];delete old.eventLog;delete old.currentResolution;delete old.discoveries;delete old.meters;delete old.dayEventIndex;delete old.ending;const s=validateSave(old);assert.equal(s.saveVersion,2);assert.equal(s.day,2);assert.equal(s.phase,'hub');assert.equal(s.memories.length,1);assert.equal(s.diaries.length,1);assert.ok(s.discoveries.includes('ryu'));});
test('corrupt and future saves are rejected',()=>{const s=createGame(profile,1);for(const mutate of [x=>x.saveVersion=99,x=>x.inventory.override=-1,x=>x.rngState=0,x=>x.character.traits.courage=null,x=>x.day=15,x=>x.discoveries.push('unknown')]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateSave(bad));}});

test('player can select a first-day expedition and stored selection survives save validation',()=>{
  let s=createGame(profile,9);
  assert.ok(availableExplorations(s).some(e=>e.id==='dry_dock'));
  s=transition(s,{type:'depart',eventId:'dry_dock'});
  assert.equal(currentEvent(s).id,'dry_dock');
  assert.equal(s.selectedExploration,'dry_dock');
  validateSave(s);
  assert.throws(()=>transition(createGame(profile,9),{type:'depart',eventId:'ryu_return'}));
});
test('an earlier exploration opens a materially different rescue route and later NPC help',()=>{
  let s=transition(createGame(profile,9),{type:'depart',eventId:'tide_marks'});
  s=transition(s,{type:'choose',id:'trace'});
  s=transition(s,{type:'continue'});
  assert.equal(gate(s,'safe_entry'),'');
  s=transition(s,{type:'choose',id:'safe_entry'});
  assert.equal(s.currentResolution.actualActionId,'safe_rescue');
  assert.ok(s.world.ryu_safe);
  s=transition(transition(s,{type:'continue'}),{type:'endDay'});
  assert.ok(availableExplorations(s).some(e=>e.id==='ryu_return'));
  s=transition(s,{type:'depart',eventId:'ryu_return'});
  s=transition(s,{type:'choose',id:'listen'});
  s=transition(s,{type:'continue'});
  assert.equal(gate(s,'ryu_support'),'');
  s=transition(s,{type:'choose',id:'ryu_support'});
  assert.ok(s.world.market_balanced);
  assert.equal(s.currentResolution.actualActionId,'ryu_assist');
  validateSave(s);
});
test('locked preparation routes cannot be chosen without their actual prior event',()=>{
  let s=transition(createGame(profile,3),{type:'depart',eventId:'dry_dock'});
  s=transition(s,{type:'choose',id:'take'});
  s=transition(s,{type:'continue'});
  assert.match(gate(s,'safe_entry'),/이전 탐사/);
  assert.throws(()=>transition(s,{type:'choose',id:'safe_entry'}));
});
test('earlier forced commands increase subsequent autonomy conflict while diary keeps factual outcomes',()=>{
  const s=toMain(3);
  const a=conflict(s,currentEvent(s).choices.enter);
  const low=structuredClone(s);low.character.stability=40;
  assert.ok(conflict(low,currentEvent(low).choices.enter)>a);
});

test('a saved first expedition can return to base and select a different location without erasing earlier records',()=>{
  let s=createGame(profile,19);
  const beforeEnergy=s.character.energy;
  s=transition(s,{type:'depart',eventId:'tide_marks'});
  assert.equal(s.phase,'scene');
  assert.ok(s.character.energy<beforeEnergy);
  const reloaded=validateSave(structuredClone(s));
  const returned=transition(reloaded,{type:'returnHub'});
  assert.equal(returned.phase,'hub');
  assert.equal(returned.character.energy,beforeEnergy);
  assert.equal(returned.eventLog.length,0);
  assert.equal(returned.selectedExploration,null);
  assert.equal(availableExplorations(returned).length>=2,true);
  const other=transition(returned,{type:'depart',eventId:'dry_dock'});
  assert.equal(currentEvent(other).id,'dry_dock');
  other.dayEventIndex=1;
  assert.throws(()=>transition(other,{type:'returnHub'}));
});
