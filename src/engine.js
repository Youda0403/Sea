import {keywords,values,pasts,purposes,events,schedule,traits,people,MAX_DAY} from './content.js';
const clamp=n=>Math.max(0,Math.min(100,n));
const copy=x=>structuredClone(x);
const assert=(ok,message)=>{if(!ok)throw new Error(message);};

export function validateContent(){
  assert(Object.keys(schedule).length===MAX_DAY,'14일 일정이 완성되지 않았어.');
  for(let day=1;day<=MAX_DAY;day++){
    assert(schedule[day]?.length===2,`${day}일차 사건은 2개여야 해.`);
    assert(events[schedule[day][0]]?.kind==='ambient'&&events[schedule[day][1]]?.kind==='main',`${day}일차 필수 사건 순서 오류`);
  }
  for(const event of Object.values(events))for(const [id,c] of Object.entries(event.choices)){
    const table=event.tables[id];assert(table?.at(-1)?.max===1,`${event.id}/${id} 결과 테이블 누락`);
    let previous=0;for(const row of table){assert(row.max>previous&&row.max<=1,'결과 확률 순서 오류');previous=row.max;assert(event.outcomes[row.id]?.action===c.action,'결과 행동 불일치');}
    if(c.autonomy)assert(event.choices[c.alternative],`${event.id}/${id} 대체 행동 누락`);
  }
}

export function createGame(profile,seed=Date.now()>>>0){
  assert(typeof profile.name==='string'&&profile.name.trim().length>0&&profile.name.length<=30,'이름은 1~30자로 입력해 줘.');
  assert(Array.isArray(profile.keywords)&&profile.keywords.length===3&&new Set(profile.keywords).size===3&&profile.keywords.every(k=>keywords[k]),'서로 다른 성격을 3개 골라 줘.');
  assert(values[profile.value]&&pasts[profile.past]&&purposes[profile.purpose],'캐릭터 설정을 확인해 줘.');
  const t=Object.fromEntries(Object.keys(traits).map(k=>[k,50]));
  for(const k of profile.keywords)for(const [id,v]of Object.entries(keywords[k].effects))t[id]+=v;
  for(const k in t)t[k]=clamp(t[k]);
  return {saveVersion:2,runId:globalThis.crypto.randomUUID(),revision:0,day:1,dayEventIndex:0,rngState:seed||1,phase:'hub',profile:{...copy(profile),name:profile.name.trim()},character:{traits:t,energy:100,integrity:100,stability:100,beliefs:{fear_flooded_places:profile.past==='flood'?65:0},emotions:{fear:profile.past==='flood'?40:0,guilt:0}},inventory:{drone:1,override:2,kit:2,cell:2,sealant:1},world:{},meters:{community:0,truth:0,signal:0,isolation:0},pending:null,currentResolution:null,eventLog:[],memories:[],diaries:[],discoveries:['haon'],attempts:[],lastMessage:'',ending:null};
}

function random(s){let x=s.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;s.rngState=x>>>0;return s.rngState/4294967296;}
export function currentEvent(s){return events[schedule[s.day]?.[s.dayEventIndex]];}
function minEventCost(event){return event.travelCost+Math.min(...Object.values(event.choices).map(c=>c.cost));}
export function departureGate(s){
  if(s.phase!=='hub')return '탐사를 준비할 수 있는 단계가 아니야.';
  const needed=schedule[s.day].reduce((n,id)=>n+minEventCost(events[id]),0);
  if(s.character.energy<needed)return `오늘의 필수 탐사를 마치려면 전력이 최소 ${needed} 필요해.`;
  if(s.character.integrity<=10)return '기체 상태가 위험해. 먼저 수리해 줘.';
  return '';
}
export function conflict(s,c){
  const tp=Math.min(50,(c.conflicts||[]).reduce((n,r)=>n+r.weight*(r.direction==='low'?100-s.character.traits[r.trait]:s.character.traits[r.trait])/100,0));
  return clamp(tp+Math.min(30,c.valueConflicts?.[s.profile.value]||0)+Math.min(20,(c.fearWeight||0)*s.character.beliefs.fear_flooded_places/100));
}
export function gate(s,id){
  const c=currentEvent(s)?.choices[id];if(!c)return '없는 행동이야.';
  if(c.item&&!s.inventory[c.item])return '필요한 장비가 없어.';
  if(s.character.energy<c.cost)return '전력이 부족해.';
  return '';
}
function applyEffect(s,key,value){
  if(key in traits)s.character.traits[key]=clamp(s.character.traits[key]+value);
  else if(key==='fear'){s.character.beliefs.fear_flooded_places=clamp(s.character.beliefs.fear_flooded_places+value);s.character.emotions.fear=clamp(s.character.emotions.fear+value);}
  else if(key in s.character)s.character[key]=clamp(s.character[key]+value);
}
function finish(s,id,forced=false){
  const event=currentEvent(s),c=event.choices[id];assert(!gate(s,id),gate(s,id));
  let roll=random(s);
  if((s.profile.purpose==='medical'&&c.action==='direct_rescue')||(s.profile.purpose==='repair'&&/repair|build|reroute|split/.test(c.action))||(s.profile.purpose==='scout'&&/scan|map|trace|route/.test(c.action)))roll=Math.max(0,roll-.08);
  const outcomeId=event.tables[id].find(r=>roll<r.max||r.max===1).id,o=event.outcomes[outcomeId];
  const before=copy(s.character),itemUses=[];s.character.energy=clamp(s.character.energy-c.cost);
  if(forced){assert(s.inventory.override>0,'강제 명령 모듈이 없어.');s.inventory.override--;s.character.stability=clamp(s.character.stability-12);itemUses.push({itemId:'override',count:1});}
  let sealantReduction=0;if(c.autoItem&&s.inventory[c.autoItem]>0){s.inventory[c.autoItem]--;itemUses.push({itemId:c.autoItem,count:1});sealantReduction=8;}
  for(const [k,v]of Object.entries(o.effects||{})){let delta=v;if(k==='integrity'&&delta<0&&sealantReduction)delta+=Math.min(-delta,sealantReduction);applyEffect(s,k,delta);}
  if(o.stability)applyEffect(s,'stability',o.stability);
  for(const [item,count]of Object.entries(o.rewards||{}))s.inventory[item]=Math.min(9,(s.inventory[item]||0)+count);
  for(const flag of o.flags||[])s.world[flag]=true;
  for(const [meter,value]of Object.entries(o.meters||{}))s.meters[meter]=(s.meters[meter]||0)+value;
  for(const person of o.discoveries||[])if(!s.discoveries.includes(person))s.discoveries.push(person);
  if(id==='leave'&&s.profile.value==='life')s.character.emotions.guilt=25;
  const resolution={eventInstanceId:`${s.runId}:${event.id}:${s.day}`,eventId:event.id,eventTitle:event.title,eventKind:event.kind,gameDay:s.day,playerChoiceId:s.pending.originalChoice,intendedActionId:event.choices[s.pending.originalChoice].action,actualActionId:c.action,outcomeId,result:o.result,forcedOverrideUsed:forced,itemUses,outcomeTags:[...(o.tags||[]),...(forced?['forced_override']:[])],decision:s.pending.decision,attempts:copy(s.attempts),before,after:copy(s.character)};
  s.currentResolution=resolution;s.eventLog.push(resolution);s.memories.push({id:`${resolution.eventInstanceId}:memory`,day:s.day,eventId:event.id,sourceEventInstanceId:resolution.eventInstanceId,text:o.fact,tags:resolution.outcomeTags});s.phase='outcome';s.pending=null;
}
function makeDiary(s){
  const today=s.eventLog.filter(r=>r.gameDay===s.day),facts=today.map(r=>events[r.eventId].outcomes[r.outcomeId].fact).join('\n');
  let reaction=s.character.traits.sociability<45?'오래 말하고 싶지는 않다. 그래도 오늘의 일은 남겨 둔다.':'베이스의 불빛을 보자 긴장이 조금 풀렸다. 오늘 있었던 일을 잊고 싶지 않다.';
  if(s.profile.past==='flood'&&today.some(r=>r.outcomeTags.some(t=>/flood|gate|lock/.test(t))))reaction+=' 차가운 물은 예전 사고를 떠올리게 했지만, 오늘의 기억은 그때와 다르게 끝났다.';
  if(today.some(r=>r.forcedOverrideUsed))reaction+=s.profile.value==='freedom'?' 강제 명령이 몸을 움직였다. 내 판단과 움직임 사이의 틈이 아직 낯설다.':' 명령 모듈이 작동한 뒤 몸이 먼저 움직였다. 결과와 별개로 그 어긋남은 남아 있다.';
  if(s.character.emotions.guilt>0)reaction+=' 돌아오는 길에도 남겨 둔 신호가 마음에 걸렸다.';
  return {day:s.day,text:facts+'\n\n'+reaction,sourceEventInstanceIds:today.map(r=>r.eventInstanceId),templateIds:today.map(r=>r.outcomeId),voiceId:s.character.traits.sociability<45?'quiet':'reflective'};
}
function endingFor(s){
  if(s.world.ending_home)return {id:'home',title:'빛이 이어지는 항로',text:'귀환 신호는 이제 살아 있는 이들을 서로에게 안내했다. 방파제에서 먼 거점까지 불빛이 이어졌고, 네 이름도 그 구조망의 첫 기록에 남았다.'};
  if(s.world.ending_archive)return {id:'archive',title:'누구의 명령도 아닌 바다',text:'중계시설의 기록은 모든 거점에 공개됐다. 하나의 정답 대신 수많은 항로가 생겼다. 네가 남긴 기억 역시 누군가의 다음 선택을 돕게 될 것이다.'};
  return {id:'silence',title:'고요가 돌아온 자리',text:'오래된 귀환 명령은 완전히 멎었다. 바다는 고요했고, 살아남은 기체들은 더는 과거의 목적지에 끌려가지 않았다. 다음 목적지는 각자의 몫이 되었다.'};
}

export function transition(original,command){
  const s=copy(original);s.lastMessage='';
  if(command.type==='depart'){
    assert(!departureGate(s),departureGate(s));const event=currentEvent(s);s.character.energy=clamp(s.character.energy-event.travelCost);s.phase='scene';
  }else if(command.type==='choose'){
    assert(s.phase==='scene','이미 처리한 선택이야.');assert(!gate(s,command.id),gate(s,command.id));
    const c=currentEvent(s).choices[command.id],score=conflict(s,c),roll=c.autonomy?random(s):1,chance=score<40?0:score<70?.05+(score-40)/30*.1:.15+(score-70)/30*.15,refused=roll<chance;
    s.pending={eventId:currentEvent(s).id,originalChoice:command.id,decision:refused?'refuse':score>=40?'hesitate':'accept',score};s.attempts.push({choiceId:command.id,decision:s.pending.decision});
    if(refused)s.phase='refused';else finish(s,command.id);
  }else if(command.type==='alternative'){
    assert(s.phase==='refused','대안을 고를 수 없는 단계야.');const id=currentEvent(s).choices[s.pending.originalChoice].alternative;s.attempts.push({choiceId:id,decision:'alternative'});finish(s,id);
  }else if(command.type==='override'){
    assert(s.phase==='refused'&&command.confirmed===true,'강제 명령 사용 확인이 필요해.');s.attempts.push({choiceId:s.pending.originalChoice,decision:'forced'});finish(s,s.pending.originalChoice,true);
  }else if(command.type==='continue'){
    assert(s.phase==='outcome','아직 결과가 확정되지 않았어.');
    if(s.dayEventIndex+1<schedule[s.day].length){s.dayEventIndex++;s.currentResolution=null;s.attempts=[];const next=currentEvent(s),needed=minEventCost(next);if(s.character.energy<needed){s.lastMessage='비상 견인 전력을 연결했다. 안정도가 5 낮아졌다.';s.character.energy=needed;s.character.stability=clamp(s.character.stability-5);}s.character.energy=clamp(s.character.energy-next.travelCost);s.phase='scene';}else s.phase='returned';
  }else if(command.type==='endDay'){
    assert(s.phase==='returned','아직 하루의 탐사가 끝나지 않았어.');assert(!s.diaries.some(d=>d.day===s.day),'이미 기록한 하루야.');s.diaries.push(makeDiary(s));
    if(s.day===MAX_DAY){s.ending=endingFor(s);s.phase='ending';}
    else{s.day++;s.dayEventIndex=0;s.currentResolution=null;s.attempts=[];s.pending=null;s.phase='hub';s.character.energy=clamp(s.character.energy+32);s.character.stability=clamp(s.character.stability+4);s.character.emotions.fear=clamp(s.character.emotions.fear-8);s.character.emotions.guilt=clamp(s.character.emotions.guilt-5);if([5,9,13].includes(s.day))s.inventory.cell=Math.min(9,s.inventory.cell+1);}
  }else if(command.type==='useItem'){
    assert(s.phase==='hub','아이템은 출발 전 베이스에서 사용해 줘.');
    if(command.id==='kit'){assert(s.inventory.kit>0&&s.character.integrity<100,'지금은 수리 키트를 사용할 수 없어.');s.inventory.kit--;s.character.integrity=clamp(s.character.integrity+25);}
    else if(command.id==='cell'){assert(s.inventory.cell>0&&s.character.energy<100,'지금은 충전 셀을 사용할 수 없어.');s.inventory.cell--;s.character.energy=clamp(s.character.energy+35);}
    else throw new Error('베이스에서 사용할 수 없는 아이템이야.');
  }else throw new Error('알 수 없는 명령이야.');
  s.revision++;return s;
}

function migrateV1(old){
  assert(old&&old.saveVersion===1,'지원하지 않는 저장 버전이야.');const s=createGame(old.profile,old.rngState);s.runId=old.runId;s.revision=old.revision;s.character=copy(old.character);s.inventory={drone:old.inventory?.drone??1,override:old.inventory?.override??1,kit:old.inventory?.kit??1,cell:2,sealant:1};s.world=copy(old.world||{});s.memories=(old.memories||[]).map(m=>({...m,day:1,eventId:'warehouse_signal'}));s.diaries=copy(old.diaries||[]);s.discoveries=['haon',...(s.memories.length?['ryu']:[])];
  if(old.resolution){const r={...copy(old.resolution),eventId:'warehouse_signal',eventTitle:'물 아래에서 들려온 목소리',eventKind:'main',gameDay:1};s.eventLog=[r];s.currentResolution=r;s.dayEventIndex=1;s.phase=old.phase==='outcome'?'outcome':old.phase==='returned'?'returned':'hub';}
  if(old.phase==='ended'){s.day=2;s.dayEventIndex=0;s.phase='hub';s.currentResolution=null;}
  if(['scene','refused'].includes(old.phase)){s.phase='hub';s.dayEventIndex=0;s.pending=null;s.attempts=[];s.character.energy=clamp(s.character.energy+8);}
  return s;
}
export function validateSave(raw){
  const s=raw?.saveVersion===1?migrateV1(raw):raw;assert(s&&s.saveVersion===2,'지원하지 않는 저장 버전이야. 원본은 변경하지 않았어.');createGame(s.profile,1);
  assert(typeof s.runId==='string'&&s.runId.length<100&&Number.isInteger(s.revision)&&s.revision>=0,'저장 정보가 손상됐어.');assert(Number.isInteger(s.day)&&s.day>=1&&s.day<=MAX_DAY&&Number.isInteger(s.dayEventIndex)&&s.dayEventIndex>=0&&s.dayEventIndex<2,'날짜 정보가 손상됐어.');assert(Number.isInteger(s.rngState)&&s.rngState>0&&s.rngState<=4294967295,'난수 정보가 손상됐어.');
  assert(['hub','scene','refused','outcome','returned','ending'].includes(s.phase),'장면 정보가 손상됐어.');
  for(const k of ['energy','integrity','stability'])assert(Number.isFinite(s.character?.[k])&&s.character[k]>=0&&s.character[k]<=100,'기체 수치가 손상됐어.');for(const k in traits)assert(Number.isFinite(s.character.traits?.[k])&&s.character.traits[k]>=0&&s.character.traits[k]<=100,'성향 정보가 손상됐어.');
  for(const k of Object.keys(s.inventory))assert(Number.isInteger(s.inventory[k])&&s.inventory[k]>=0&&s.inventory[k]<=9,'아이템 정보가 손상됐어.');assert(['drone','override','kit','cell','sealant'].every(k=>k in s.inventory),'아이템 정보가 빠졌어.');
  assert(Array.isArray(s.eventLog)&&s.eventLog.length<=MAX_DAY*2&&Array.isArray(s.memories)&&s.memories.length===s.eventLog.length&&Array.isArray(s.diaries)&&s.diaries.length<=MAX_DAY,'기록 정보가 손상됐어.');assert(Array.isArray(s.discoveries)&&new Set(s.discoveries).size===s.discoveries.length&&s.discoveries.every(id=>people[id]),'조우 기록이 손상됐어.');
  for(const r of s.eventLog){const e=events[r.eventId],o=e?.outcomes[r.outcomeId];assert(o&&o.action===r.actualActionId&&e.choices[r.playerChoiceId]?.action===r.intendedActionId&&r.gameDay>=1&&r.gameDay<=MAX_DAY,'사건 기록이 손상됐어.');}
  for(const m of s.memories)assert(s.eventLog.some(r=>r.eventInstanceId===m.sourceEventInstanceId),'기억의 원본 사건이 없어.');for(const d of s.diaries)assert(d.day>=1&&d.day<=MAX_DAY&&Array.isArray(d.sourceEventInstanceIds)&&d.sourceEventInstanceIds.every(id=>s.eventLog.some(r=>r.eventInstanceId===id)),'일기 정보가 손상됐어.');
  if(s.phase==='refused')assert(s.pending?.eventId===currentEvent(s).id&&currentEvent(s).choices[s.pending.originalChoice]?.autonomy,'거부 상태가 손상됐어.');if(['outcome','returned'].includes(s.phase))assert(s.currentResolution&&s.eventLog.at(-1).eventInstanceId===s.currentResolution.eventInstanceId,'현재 결과가 손상됐어.');if(s.phase==='ending')assert(s.day===MAX_DAY&&s.ending&&s.diaries.some(d=>d.day===MAX_DAY),'엔딩 정보가 손상됐어.');
  return s;
}
validateContent();
