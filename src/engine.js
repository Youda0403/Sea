import {keywords,values,pasts,purposes,episode,traits} from './content.js';
const clamp = n => Math.max(0,Math.min(100,n));
const copy = x => structuredClone(x);
const assert = (ok,message) => { if(!ok) throw new Error(message); };
export function validateContent(){
  for(const [id,c] of Object.entries(episode.choices)){
    assert(episode.tables[id]?.at(-1).max===1,'결과 테이블 누락');
    let previous=0;for(const row of episode.tables[id]){assert(row.max>previous&&row.max<=1,'결과 확률 순서 오류');previous=row.max;}
    if(c.autonomy) assert(episode.choices[c.alternative], '대체 선택지 누락');
    for(const row of episode.tables[id]) assert(episode.outcomes[row.id]?.action===c.action,'결과 행동 불일치');
  }
}
export function createGame(profile,seed=Date.now()>>>0){
  assert(typeof profile.name==='string' && profile.name.trim().length>0 && profile.name.length<=30,'이름은 1~30자로 입력해 줘.');
  assert(Array.isArray(profile.keywords)&&profile.keywords.length===3&&new Set(profile.keywords).size===3&&profile.keywords.every(k=>keywords[k]),'서로 다른 성격을 3개 골라 줘.');
  assert(values[profile.value]&&pasts[profile.past]&&purposes[profile.purpose],'캐릭터 설정을 확인해 줘.');
  const t=Object.fromEntries(Object.keys(traits).map(k=>[k,50]));
  for(const k of profile.keywords) for(const [id,v] of Object.entries(keywords[k].effects)) t[id]+=v;
  for(const k in t)t[k]=clamp(t[k]);
  return {saveVersion:1,runId:globalThis.crypto.randomUUID(),revision:0,day:1,rngState:seed||1,phase:'hub',profile:{...copy(profile),name:profile.name.trim()},character:{traits:t,energy:100,integrity:100,stability:100,beliefs:{fear_flooded_places:profile.past==='flood'?65:0},emotions:{fear:profile.past==='flood'?40:0,guilt:0}},inventory:{drone:1,override:1,kit:1},world:{},pending:null,resolution:null,memories:[],diaries:[],attempts:[],lastMessage:''};
}
function random(s){let x=s.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;s.rngState=x>>>0;return s.rngState/4294967296;}
export function conflict(s,c){
  const tp=Math.min(50,(c.conflicts||[]).reduce((n,r)=>n+r.weight*(r.direction==='low'?100-s.character.traits[r.trait]:s.character.traits[r.trait])/100,0));
  return clamp(tp+Math.min(30,c.valueConflicts?.[s.profile.value]||0)+Math.min(20,(c.fearWeight||0)*s.character.beliefs.fear_flooded_places/100));
}
export function gate(s,id){const c=episode.choices[id];if(!c)return '없는 행동이야.';if(c.item&&!s.inventory[c.item])return '필요한 장비가 없어.';if(s.character.energy<c.cost)return '전력이 부족해.';return '';}
function finish(s,id,forced=false){
  const c=episode.choices[id];assert(!gate(s,id),gate(s,id));
  const roll=random(s);const adjusted=id==='enter'&&s.profile.purpose==='medical'?Math.max(0,roll-0.08):id==='drone'&&s.profile.purpose==='repair'?Math.max(0,roll-0.08):roll;
  const outcomeId=episode.tables[id].find(r=>adjusted<r.max||r.max===1).id;const o=episode.outcomes[outcomeId];
  s.character.energy-=c.cost;
  const before=copy(s.character);const itemUses=[];
  if(forced){assert(s.inventory.override>0,'강제 명령 모듈이 없어.');s.inventory.override--;s.character.stability=clamp(s.character.stability-12);itemUses.push({itemId:'override',count:1});}
  for(const [k,v] of Object.entries(o.effects)){if(k in traits)s.character.traits[k]=clamp(s.character.traits[k]+v);else if(k==='fear'){s.character.beliefs.fear_flooded_places=clamp(s.character.beliefs.fear_flooded_places+v);s.character.emotions.fear=clamp(s.character.emotions.fear+v);}else s.character[k]=clamp(s.character[k]+v);}
  if(id==='leave'&&s.profile.value==='life')s.character.emotions.guilt=25;
  s.world[o.flag]=true;
  s.resolution={eventInstanceId:s.runId+':warehouse:1',eventId:episode.id,gameDay:1,playerChoiceId:s.pending.originalChoice,intendedActionId:episode.choices[s.pending.originalChoice].action,actualActionId:c.action,outcomeId,result:o.result,forcedOverrideUsed:forced,itemUses,outcomeTags:[...o.tags,...(forced?['forced_override']:[])],decision:s.pending.decision,attempts:copy(s.attempts),before,after:copy(s.character),worldFlag:o.flag};
  s.memories.push({id:s.runId+':memory:1',sourceEventInstanceId:s.resolution.eventInstanceId,text:o.fact,tags:s.resolution.outcomeTags});
  s.phase='outcome';s.pending=null;
}
// Pure transition: callers must persist the returned snapshot before displaying it.
export function transition(original,command){
  const s=copy(original);s.lastMessage='';
  if(command.type==='depart'){assert(s.phase==='hub','지금은 출발할 수 없어.');s.character.energy-=8;s.phase='scene';}
  else if(command.type==='repair'){assert(s.phase==='hub'&&s.inventory.kit>0&&s.character.integrity<100,'지금은 수리할 수 없어.');s.inventory.kit--;s.character.integrity=clamp(s.character.integrity+20);}
  else if(command.type==='choose'){
    assert(s.phase==='scene','이미 처리한 선택이야.');assert(!gate(s,command.id),gate(s,command.id));
    const c=episode.choices[command.id],score=conflict(s,c);const roll=c.autonomy?random(s):1;
    const chance=score<40?0:score<70?0.05+(score-40)/30*0.1:0.15+(score-70)/30*0.15;
    const refused=roll<chance;
    s.pending={originalChoice:command.id,decision:refused?'refuse':score>=40?'hesitate':'accept',score};
    s.attempts.push({choiceId:command.id,decision:s.pending.decision});
    if(refused){s.phase='refused';s.lastMessage=command.id==='enter'?'물에 잠긴 전선을 바라보며 발을 멈췄다. 지금은 저 안으로 들어갈 수 없었다.':'아직 응답이 들리고 있었다. 이대로 등을 돌릴 수는 없었다.';}
    else finish(s,command.id);
  }else if(command.type==='alternative'){
    assert(s.phase==='refused','대안을 고를 수 없는 단계야.');const id=episode.choices[s.pending.originalChoice].alternative;
    s.attempts.push({choiceId:id,decision:'alternative'});finish(s,id);
  }else if(command.type==='withdraw'){
    assert(s.phase==='refused'&&s.pending.originalChoice==='enter','지금은 선택할 수 없어.');s.attempts.push({choiceId:'leave',decision:'accept_refusal'});finish(s,'leave');
  }else if(command.type==='override'){
    assert(s.phase==='refused'&&command.confirmed===true,'강제 명령 사용 확인이 필요해.');s.attempts.push({choiceId:s.pending.originalChoice,decision:'forced'});finish(s,s.pending.originalChoice,true);
  }else if(command.type==='return'){
    assert(s.phase==='outcome','아직 결과가 확정되지 않았어.');s.phase='returned';
  }else if(command.type==='endDay'){
    assert(s.phase==='returned'&&s.diaries.length===0,'이미 종료한 하루야.');
    const o=episode.outcomes[s.resolution.outcomeId];let reaction=s.character.traits.sociability<45?'오래 말하고 싶지는 않다. 그래도 이 일만은 남겨 둔다.':'거점의 불빛을 보자 긴장이 조금 풀렸다. 오늘 있었던 일을 잊고 싶지 않다.';
    if(s.profile.past==='flood')reaction+=' 예전 침수 사고가 떠올랐다. 오늘의 기억은 그 기억 옆에 남을 것이다.';
    if(s.resolution.forcedOverrideUsed)reaction+=s.profile.value==='freedom'?' 강제 명령이 몸을 움직였다. 내 판단과 움직임 사이의 틈이 아직 낯설다.':'명령 모듈이 작동한 뒤 몸이 먼저 움직였다. 결과와 별개로 그 어긋남은 남아 있다.';
    if(s.character.emotions.guilt>0)reaction+=' 돌아오는 길에도 남겨 둔 신호가 마음에 걸렸다.';
    s.diaries.push({day:1,text:o.fact+'\n\n'+reaction,sourceEventInstanceIds:[s.resolution.eventInstanceId],templateIds:[s.resolution.outcomeId,s.resolution.forcedOverrideUsed?'forced':'normal'],voiceId:s.character.traits.sociability<45?'quiet':'reflective'});s.phase='ended';
  }else throw new Error('알 수 없는 명령이야.');
  s.revision++;return s;
}
export function validateSave(s){
  assert(s&&s.saveVersion===1,'지원하지 않는 저장 버전이야. 원본은 변경하지 않았어.');
  createGame(s.profile,1);
  assert(typeof s.runId==='string'&&s.runId.length<100&&Number.isInteger(s.revision)&&s.revision>=0&&s.day===1,'잘못된 저장 정보야.');
  assert(Number.isInteger(s.rngState)&&s.rngState>0&&s.rngState<=4294967295,'난수 정보가 손상됐어.');
  assert(['hub','scene','refused','outcome','returned','ended'].includes(s.phase),'장면 정보가 손상됐어.');
  for(const k of ['energy','integrity','stability'])assert(Number.isFinite(s.character?.[k])&&s.character[k]>=0&&s.character[k]<=100,'기체 수치가 손상됐어.');
  for(const k in traits)assert(Number.isFinite(s.character.traits?.[k])&&s.character.traits[k]>=0&&s.character.traits[k]<=100,'성향 정보가 손상됐어.');
  for(const v of [s.character.beliefs?.fear_flooded_places,s.character.emotions?.fear,s.character.emotions?.guilt])assert(Number.isFinite(v)&&v>=0&&v<=100,'기억 수치가 손상됐어.');
  for(const k of ['drone','override','kit'])assert(Number.isInteger(s.inventory?.[k])&&s.inventory[k]>=0&&s.inventory[k]<=1,'아이템 정보가 손상됐어.');
  assert(Array.isArray(s.attempts)&&s.attempts.length<=3&&s.attempts.every(a=>episode.choices[a.choiceId]&&typeof a.decision==='string'),'선택 기록이 손상됐어.');
  assert(Array.isArray(s.memories)&&Array.isArray(s.diaries)&&s.memories.length<=1&&s.diaries.length<=1,'기록 정보가 손상됐어.');
  assert(s.world&&typeof s.world==='object'&&!Array.isArray(s.world)&&Object.values(s.world).every(v=>typeof v==='boolean'),'세계 정보가 손상됐어.');
  if(s.phase==='refused')assert(episode.choices[s.pending?.originalChoice]?.autonomy&&s.pending.decision==='refuse','거부 상태가 손상됐어.');
  if(['outcome','returned','ended'].includes(s.phase)){
    const r=s.resolution,o=episode.outcomes[r?.outcomeId];assert(o&&o.action===r.actualActionId&&o.result===r.result&&episode.choices[r.playerChoiceId]?.action===r.intendedActionId,'사건 결과가 손상됐어.');
    assert(typeof r.forcedOverrideUsed==='boolean'&&Array.isArray(r.itemUses)&&Array.isArray(r.outcomeTags)&&Array.isArray(r.attempts)&&r.before?.traits&&r.after?.traits,'결과 기록이 손상됐어.');
    assert(s.memories.length===1&&s.memories[0].text===o.fact&&s.memories[0].sourceEventInstanceId===r.eventInstanceId,'기억이 사실과 일치하지 않아.');
  }else assert(!s.resolution&&s.memories.length===0&&s.diaries.length===0,'미완료 사건에 결과가 있어.');
  if(s.phase==='ended')assert(s.diaries.length===1&&s.diaries[0].day===1&&typeof s.diaries[0].text==='string'&&s.diaries[0].text.length<5000&&s.diaries[0].sourceEventInstanceIds?.[0]===s.resolution.eventInstanceId,'일기 정보가 손상됐어.');
  else assert(s.diaries.length===0,'하루가 끝나기 전에 일기가 있어.');
  return s;
}
validateContent();
