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
export function currentEvent(s){return events[s.dayEventIndex===0?(s.selectedExploration||schedule[s.day]?.[0]):schedule[s.day]?.[1]];}
function unlocked(s,e){
  return (e.requiresFlags||[]).every(flag=>s.world[flag]) &&
    (!(e.requiresAnyFlags?.length)||e.requiresAnyFlags.some(flag=>s.world[flag])) &&
    !(e.excludesFlags||[]).some(flag=>s.world[flag]);
}
function choiceUnlocked(s,c){return (c.requiresFlags||[]).every(flag=>s.world[flag]);}
function minimumCost(s,e){
  return e.travelCost+Math.min(...Object.values(e.choices).filter(c=>choiceUnlocked(s,c)&&(!c.item||s.inventory[c.item])).map(c=>c.cost));
}
/** Main progression remains scheduled; each day the player chooses one side expedition. */
export function availableExplorations(s){
  const seen=new Set(s.eventLog.map(r=>r.eventId));
  const options=Object.values(events).filter(e=>e.kind==='ambient'&&e.day<=s.day&&!seen.has(e.id)&&unlocked(s,e));
  const baseline=events[schedule[s.day][0]];
  const rest=options.filter(e=>e.id!==baseline.id).sort((a,b)=>
    Number(Boolean(b.requiresFlags?.length||b.requiresAnyFlags?.length))-Number(Boolean(a.requiresFlags?.length||a.requiresAnyFlags?.length)) ||
    b.day-a.day || a.id.localeCompare(b.id));
  return [baseline,...rest].filter(e=>options.includes(e)).slice(0,4);
}
export function departureGate(s,eventId=s.selectedExploration||schedule[s.day]?.[0]){
  if(s.phase!=='hub')return '탐사를 준비할 수 있는 단계가 아니야.';
  if(!availableExplorations(s).some(e=>e.id===eventId))return '지금 선택할 수 없는 탐사 지역이야.';
  const needed=minimumCost(s,events[eventId])+minimumCost(s,events[schedule[s.day][1]]);
  if(s.character.energy<needed)return `오늘의 두 사건을 진행하려면 최소 전력 ${needed}이 필요해.`;
  if(s.character.integrity<=10)return '기체 상태가 위험해. 먼저 수리해 줘.';
  return '';
}
export function sceneDetails(s){
  const id=currentEvent(s)?.id;
  const notes=[];
  if(id==='warehouse_signal'&&s.world.dry_route)notes.push('앞서 조위 표식에서 발견한 마른 통로가 제7창고 뒤편으로 이어져 있다. 직접 물에 들어가지 않고도 구조할 수 있을지 모른다.');
  if(id==='salt_market'&&s.world.ryu_safe)notes.push('창고에서 구한 류가 비상 배선의 위치를 알고 있다. 그의 도움을 구한다면 혼자서는 불가능했던 길이 열릴 수 있다.');
  if(id==='scrap_hunter'&&!s.world.ryu_safe)notes.push('류의 구조 기록은 아직 완성되지 않았다. 노엘이 요구한 정보를 건네도 괜찮을지 신중히 판단해야 한다.');
  if(id==='storm_shelter'&&s.world.drain_safe)notes.push('앞서 열어 둔 제방 배수로 덕분에 대피소 안의 침수 위험이 줄었다. 문 앞의 기체들을 들일 여유를 조금 더 확보할 수 있다.');
  if(id==='relay_approach'&&s.world.release_protocol)notes.push('앞서 만든 원격 해제 절차를 단말에서 불러왔다. 구조대가 이곳에 도착하면 그대로 전달할 수 있다.');
  if(id==='relay_core'&&s.world.release_protocol&&s.world.pressure_regulator)notes.push('지난 탐사에서 마련한 원격 해제 절차와 압력 조절기를 함께 사용하면, 시설 전체를 멈추지 않고 강제 호출 기능만 분리할 수도 있다.');
  if(s.character.stability<=65)notes.push('지난 명령 개입의 여파로 관절 동기화가 흔들린다. 지금 내리는 판단이 전보다 더 낯설게 느껴진다.');
  return notes;
}
export function refusalDetail(s){
  const c=currentEvent(s)?.choices[s.pending?.originalChoice];
  if(!c)return '';
  const factors=(c.conflicts||[]).map(r=>({trait:r.trait,score:r.weight*(r.direction==='low'?100-s.character.traits[r.trait]:s.character.traits[r.trait])/100,direction:r.direction})).sort((a,b)=>b.score-a.score);
  const key=factors[0]?.trait;
  if(key==='courage'&&factors[0].direction==='low')return '고장 난 관절보다 먼저 겁이 발목을 잡았다. 몸을 내밀려 했지만 위험한 장면이 계속 떠올랐다.';
  if(key==='altruism')return factors[0].direction==='high'?'타인을 두고 떠나는 계산을 마쳤는데도 발이 움직이지 않았다. 눈앞의 기체를 없는 일처럼 넘길 수 없었다.':'위험을 감수해 남을 돕는 일에 쉽게 손이 가지 않았다. 왜 지금 내 몫까지 내주어야 할지 마음이 정리되지 않았다.';
  if(key==='wariness')return factors[0].direction==='high'?'낯선 상대를 믿으려는 순간 경계 신호가 켜졌다. 그 손에 무엇을 맡겨도 괜찮을지 확신할 수 없었다.':'상대를 의심하며 등을 돌리려 했지만, 그 판단을 끝내 납득할 수 없었다.';
  if(key==='caution')return factors[0].direction==='high'?'확인되지 않은 위험을 감수하려던 순간 몸이 멈췄다. 다른 절차가 있는지 먼저 살펴야 했다.':'눈앞의 기회를 분석만 하며 보내고 싶지 않았다. 계산을 계속하라는 판단에 손이 멈췄다.';
  if(s.character.stability<65)return '이전에 강제로 내렸던 명령의 여파가 남아 있다. 의도와 움직임 사이에 잠깐의 공백이 생겼다.';
  return '';
}
export function conflict(s,c){
  const tp=Math.min(50,(c.conflicts||[]).reduce((n,r)=>n+r.weight*(r.direction==='low'?100-s.character.traits[r.trait]:s.character.traits[r.trait])/100,0));
  return clamp(tp+Math.min(30,c.valueConflicts?.[s.profile.value]||0)+Math.min(20,(c.fearWeight||0)*s.character.beliefs.fear_flooded_places/100)+Math.min(12,(100-s.character.stability)*.18));
}
export function gate(s,id){
  const c=currentEvent(s)?.choices[id];if(!c)return '없는 행동이야.';
  if(!choiceUnlocked(s,c))return '이전 탐사에서 필요한 단서나 준비를 확보하지 못했어.';
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
  const today=s.eventLog.filter(r=>r.gameDay===s.day);
  const reserved={
    warehouse_signal:'창고에서 들었던 목소리가 돌아와서도 귓가를 떠나지 않는다.',
    salt_market:'그곳의 불빛은 단순한 전력 수치가 아니었다. 서로의 일상을 버티게 하는 빛이었다.',
    memory_buoy:'기억을 읽는 일과 그것을 내 것으로 만드는 일은 다르다고 생각했다.',
    storm_shelter:'누구에게 문을 열어 주고 누구를 기다리게 할지 결정하는 일은 생각보다 오래 남는다.',
    radio_tower:'한정된 출력에 수많은 목소리가 겹쳤다. 무엇을 먼저 들어야 할지 아직도 쉽지 않다.',
    relay_core:'마지막 송신등이 바뀌는 장면을 오래 바라보았다. 내일의 항로까지 결정한 것은 아니다.'
  };
  const paragraphs=today.map((r,i)=>{
    const tags=r.outcomeTags,first=events[r.eventId].outcomes[r.outcomeId].fact;
    let feeling=reserved[r.eventId]||(i===0?'해당 장소를 떠나고 나서야 놓쳤던 작은 소리들이 생각났다.':'오늘 두 번째로 마주한 일은 예상과 달랐다. 기록으로 남겨 두지 않았다면 잊었을지도 모른다.');
    if(tags.includes('rescued')||tags.includes('late_rescue'))feeling='무사히 돌아온 기체의 움직임이 계속 떠오른다. 내 판단만으로 이뤄낸 일은 아니었다.';
    else if(tags.includes('rescue_failed'))feeling='직접 손을 뻗었지만 닿지 못했다. 아직 남은 좌표를 다시 확인해 본다.';
    else if(tags.includes('left_signal'))feeling='좌표를 남겼으니 누군가 뒤를 이어 줄 수 있을 것이다. 그래도 신호가 끊겼는지는 확인하지 못했다.';
    else if(tags.includes('ryu_assisted'))feeling='며칠 전 창고에서 만난 류가 오늘은 내게 길을 알려 주었다. 이 일은 그날의 구조만으로 끝나지 않았다.';
    if(r.decision==='refuse')feeling+=' 처음의 선택은 내 몸이 받아들이지 않았다. 결국 다른 경로를 택했다.';
    if(r.forcedOverrideUsed)feeling+=s.profile.value==='freedom'?' 내가 받아들이지 못한 행동을 명령 모듈이 대신 결정했다. 결과가 남았고, 그와 별도로 불쾌한 틈도 남았다.':' 명령 모듈이 움직임을 대신했다. 끝난 뒤에도 내가 하려던 일과 실제로 한 일이 완전히 같게 느껴지지는 않는다.';
    if(r.result==='failure')feeling+=' 실패한 일까지 기록해야 다음에는 다른 방법을 고를 수 있다.';
    if(s.profile.past==='flood'&&tags.some(tag=>/flood|gate|lock/.test(tag)))feeling+=' 물이 닿았을 때 이전 사고를 떠올렸지만, 오늘의 일은 그때와 같지 않았다.';
    return first+'\n'+feeling;
  });
  const ending=s.character.traits.sociability<45?'많은 말을 적을 생각은 없다. 이 기록은 남겨 둔다.':s.character.traits.caution>=65?'오늘 결정한 것과 결정하지 못한 것을 나누어 두었다. 다음에는 이 기록을 참고할 것이다.':'베이스의 불빛 아래에서 다시 읽어 보니, 오늘은 생각보다 여러 번 마음이 바뀌었다.';
  return {day:s.day,text:paragraphs.join('\n\n')+'\n\n'+ending,sourceEventInstanceIds:today.map(r=>r.eventInstanceId),templateIds:today.map(r=>r.outcomeId),voiceId:s.character.traits.sociability<45?'quiet':'reflective'};
}
function endingFor(s){
  const prefix=s.world.ending_network?{id:'network',title:'스스로 부르는 귀환 신호',text:'필요한 거점만이 선택해 접속할 수 있는 중계망이 열렸다. 누군가의 몸을 억지로 부르는 명령은 송신 장치에서 사라졌다.'}:s.world.ending_home?{id:'home',title:'빛이 이어지는 항로',text:'귀환 신호는 이제 살아 있는 이들을 서로에게 안내했다. 방파제에서 먼 거점까지 불빛이 이어졌고, 네 이름도 그 구조망의 첫 기록에 남았다.'}:s.world.ending_archive?{id:'archive',title:'누구의 명령도 아닌 바다',text:'중계시설의 기록은 모든 거점에 공개됐다. 하나의 정답 대신 수많은 항로가 생겼다. 네가 남긴 기억 역시 누군가의 다음 선택을 돕게 될 것이다.'}:{id:'silence',title:'고요가 돌아온 자리',text:'오래된 귀환 명령은 완전히 멎었다. 바다는 고요했고, 살아남은 기체들은 더는 과거의 목적지에 끌려가지 않았다. 다음 목적지는 각자의 몫이 되었다.'};
  const echoes=[];
  if(s.world.ryu_safe)echoes.push('방파제의 류는 새 항로로 화물을 옮기기 시작했다. 창고에서 들리던 구조 신호는 이제 그의 이름으로 남았다.');
  else if(s.world.rescue_pending)echoes.push('제7창고에 남겨 둔 구조 좌표는 아직 거점 지도에 있다. 그 신호의 주인을 만났다는 기록은 끝내 추가되지 않았다.');
  if(s.world.market_independent)echoes.push('소금 시장의 관리 기체는 다음 정전을 스스로 복구했다. 그날 함께 익힌 배전 방법을 기억하고 있었다.');
  if(s.world.film_shared)echoes.push('공동 휴게소에서는 낡은 바다 영상이 다시 상영됐다. 같은 장면을 보고도 저마다 다른 이야기를 나누었다.');
  if(s.eventLog.some(r=>r.forcedOverrideUsed))echoes.push('항로의 기록에는 판단과 실제 행동이 어긋났던 순간들도 그대로 남았다. 그 시간을 없던 일로 만들지는 않았다.');
  return {...prefix,text:[prefix.text,...echoes].join('\n\n')};
}

export function transition(original,command){
  const s=copy(original);s.lastMessage='';
  if(command.type==='depart'){
    const eventId=command.eventId||schedule[s.day][0];assert(!departureGate(s,eventId),departureGate(s,eventId));s.selectedExploration=eventId;const event=currentEvent(s);s.character.energy=clamp(s.character.energy-event.travelCost);s.phase='scene';
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
    if(s.dayEventIndex+1<schedule[s.day].length){s.dayEventIndex++;s.currentResolution=null;s.attempts=[];const next=currentEvent(s),needed=minimumCost(s,next);if(s.character.energy<needed){s.lastMessage='비상 견인 전력을 연결했다. 안정도가 5 낮아졌다.';s.character.energy=needed;s.character.stability=clamp(s.character.stability-5);}s.character.energy=clamp(s.character.energy-next.travelCost);s.phase='scene';}else s.phase='returned';
  }else if(command.type==='endDay'){
    assert(s.phase==='returned','아직 하루의 탐사가 끝나지 않았어.');assert(!s.diaries.some(d=>d.day===s.day),'이미 기록한 하루야.');s.diaries.push(makeDiary(s));
    if(s.day===MAX_DAY){s.ending=endingFor(s);s.phase='ending';}
    else{s.day++;s.dayEventIndex=0;s.selectedExploration=null;s.currentResolution=null;s.attempts=[];s.pending=null;s.phase='hub';s.character.energy=clamp(s.character.energy+32);s.character.stability=clamp(s.character.stability+4);s.character.emotions.fear=clamp(s.character.emotions.fear-8);s.character.emotions.guilt=clamp(s.character.emotions.guilt-5);if([5,9,13].includes(s.day))s.inventory.cell=Math.min(9,s.inventory.cell+1);}
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
  if(s.selectedExploration!=null)assert(events[s.selectedExploration]?.kind==='ambient'&&events[s.selectedExploration].day<=s.day,'탐사 선택 정보가 손상됐어.');for(const k of Object.keys(s.inventory))assert(Number.isInteger(s.inventory[k])&&s.inventory[k]>=0&&s.inventory[k]<=9,'아이템 정보가 손상됐어.');assert(['drone','override','kit','cell','sealant'].every(k=>k in s.inventory),'아이템 정보가 빠졌어.');
  assert(Array.isArray(s.eventLog)&&s.eventLog.length<=MAX_DAY*2&&Array.isArray(s.memories)&&s.memories.length===s.eventLog.length&&Array.isArray(s.diaries)&&s.diaries.length<=MAX_DAY,'기록 정보가 손상됐어.');assert(Array.isArray(s.discoveries)&&new Set(s.discoveries).size===s.discoveries.length&&s.discoveries.every(id=>people[id]),'조우 기록이 손상됐어.');
  for(const r of s.eventLog){const e=events[r.eventId],o=e?.outcomes[r.outcomeId];assert(o&&o.action===r.actualActionId&&e.choices[r.playerChoiceId]?.action===r.intendedActionId&&r.gameDay>=1&&r.gameDay<=MAX_DAY,'사건 기록이 손상됐어.');}
  for(const m of s.memories)assert(s.eventLog.some(r=>r.eventInstanceId===m.sourceEventInstanceId),'기억의 원본 사건이 없어.');for(const d of s.diaries)assert(d.day>=1&&d.day<=MAX_DAY&&Array.isArray(d.sourceEventInstanceIds)&&d.sourceEventInstanceIds.every(id=>s.eventLog.some(r=>r.eventInstanceId===id)),'일기 정보가 손상됐어.');
  if(s.phase==='refused')assert(s.pending?.eventId===currentEvent(s).id&&currentEvent(s).choices[s.pending.originalChoice]?.autonomy,'거부 상태가 손상됐어.');if(['outcome','returned'].includes(s.phase))assert(s.currentResolution&&s.eventLog.at(-1).eventInstanceId===s.currentResolution.eventInstanceId,'현재 결과가 손상됐어.');if(s.phase==='ending')assert(s.day===MAX_DAY&&s.ending&&s.diaries.some(d=>d.day===MAX_DAY),'엔딩 정보가 손상됐어.');
  return s;
}
validateContent();
