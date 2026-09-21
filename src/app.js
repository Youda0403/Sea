import {keywords,values,pasts,purposes,traits,items,events,schedule,people,actionNames,MAX_DAY} from './content.js?v=sea-20260921r3';
import {createGame,transition,gate,departureGate,currentEvent,validateSave,availableExplorations,sceneDetails,refusalDetail} from './engine.js?v=sea-20260921r3';
import {load,commit,previous,rawBackup} from './storage.js?v=sea-20260921r3';
const app=document.querySelector('#app');let state=null,tab='explore',busy=false,creating=false,broken=false;
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function button(label,fn,cls='button'){const b=el('button',label,cls);b.type='button';b.onclick=fn;return b;}
let noticeTimer;function notice(t){clearTimeout(noticeTimer);document.querySelector('#notice').textContent=t;noticeTimer=setTimeout(()=>document.querySelector('#notice').textContent='',8000);}
function download(s){const u=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}));const a=el('a');a.href=u;a.download=`sea-${s.profile?.name||'save'}-day${s.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
async function act(command){if(busy)return;busy=true;render();try{const next=transition(state,command);await commit(next,state);state=next;if(next.lastMessage)notice(next.lastMessage);else notice('진행을 저장했어.');}catch(e){notice(e.message);}finally{busy=false;render();}}
function paragraph(root,text){for(const p of String(text).split('\n\n'))root.append(el('p',p));}
function field(label,node){const l=el('label',undefined,'field');l.append(el('span',label),node);return l;}
function select(options){const s=el('select');for(const [id,label]of Object.entries(options)){const o=el('option',label);o.value=id;s.append(o);}return s;}
function creator(root){
  root.append(el('div','CHARACTER / NEW ROUTE','eyebrow'),el('h2','너의 항로를 시작해'));paragraph(root,'바다는 대부분의 이름을 지웠다. 하지만 네 이름은, 네가 정할 수 있다. 이 항로는 열네 번째 날에 반드시 끝난다.');
  const form=el('form'),name=el('input');name.maxLength=30;name.required=true;name.placeholder='기체의 이름';name.autocomplete='off';const purpose=select(purposes),value=select(values),past=select(pasts);
  form.append(field('이름',name),field('제작 목적',purpose),el('small','제작 목적은 일부 행동에 작은 보정을 주지만 성격을 정하지 않아.'));
  const box=el('fieldset');box.append(el('legend','성격 · 3개 선택'));const grid=el('div',undefined,'chips');for(const [id,k]of Object.entries(keywords)){const c=el('input');c.type='checkbox';c.value=id;c.name='keyword';const l=el('label',undefined,'chip');l.append(c,el('span',k.label));grid.append(l);}box.append(grid);form.append(box,field('핵심 가치관',value),field('과거',past));
  const submit=el('button','기체 활성화','button primary');submit.type='submit';form.append(submit);form.onsubmit=async e=>{e.preventDefault();if(busy)return;try{const next=createGame({name:name.value,purpose:purpose.value,value:value.value,past:past.value,keywords:[...form.querySelectorAll('input:checked')].map(x=>x.value)});busy=true;await commit(next,state,{replace:!!state});state=next;creating=false;tab='explore';busy=false;render();notice('새 항로를 저장했어.');}catch(err){notice(err.message);}finally{busy=false;}};
  root.append(form);if(state)root.append(button('현재 항로로 돌아가기',()=>{creating=false;render();},'text-button'));
}
function stats(root){
  const day=el('section',undefined,'day-progress');day.append(el('span',`${String(state.day).padStart(2,'0')}일차 / ${MAX_DAY}일`,`day-number`));const p=el('progress');p.max=MAX_DAY;p.value=state.day;p.setAttribute('aria-label','전체 항로 진행');day.append(p);root.append(day);
  const s=el('div',undefined,'stats');for(const [key,label]of [['energy','전력'],['integrity','기체 상태'],['stability','안정도']]){const cell=el('div');cell.append(el('span',label),el('strong',String(state.character[key])),el('small',' / 100'));const meter=el('progress');meter.max=100;meter.value=state.character[key];meter.setAttribute('aria-label',label);cell.append(meter);s.append(cell);}root.append(s);
}
function commandButton(root,label,command,cls='button primary',disabledReason=''){const b=button(label,()=>act(command),cls);b.disabled=busy||!!disabledReason;root.append(b);if(disabledReason)root.append(el('small',disabledReason));}
function planCard(root,event,index){const c=el('section',undefined,'plan-card');c.append(el('span',index===0?'탐사 사건 · 1/2':'필수 사건 · 2/2','eyebrow'),el('h3',event.title),el('p',event.location));root.append(c);}
function explore(root){
  if(state.phase==='hub'){
    root.append(el('div',`DAY ${String(state.day).padStart(2,'0')} / BASE`,'eyebrow'),el('h2',state.day===1?'첫 번째 항로를 준비하며':`${state.day}일차의 항로`));
    paragraph(root,state.day===1?'해온이 작업대에 장비를 늘어놓았다. “첫 목적지는 네가 정해. 신호를 확인할 시간은 따로 확보해 뒀으니까.”':'밤사이 충전된 전력이 몸 안을 돌았다. 오늘의 필수 신호를 확인하기 전에, 어느 폐허에 들를지 스스로 결정할 수 있다.');
    root.append(el('p','이번 버전에서는 탐사 지역을 직접 선택할 수 있어. 아래 카드 중 한 곳에서 출발해 줘.','inner'),el('h3','오늘 들를 곳을 골라 줘'),el('p','한 곳을 골라 탐사한 뒤 날짜별 필수 사건으로 이어져. 이전에 찾은 단서나 구해 둔 인물 때문에 새로운 장소가 열리기도 해.','inner'));
    const options=availableExplorations(state);
    for(const event of options){
      const card=el('section',undefined,'plan-card expedition');
      card.append(el('span',event.requiresFlags?.length||event.requiresAnyFlags?.length?'NEW ROUTE / 이전 선택으로 해금':'EXPLORATION / 자유 탐사','eyebrow'),el('h3',event.title),el('p',event.location),el('p',event.intro[0]));
      commandButton(card,'이곳으로 탐사 떠나기',{type:'depart',eventId:event.id},'button choice',departureGate(state,event.id));
      root.append(card);
    }
    root.append(el('h3','오늘 반드시 마주할 사건'));
    planCard(root,events[schedule[state.day][1]],1);
    root.append(el('p','자유 탐사 후 이어지는 사건이야. 그 전에 무엇을 발견하고 누구를 만났는지에 따라 새로운 선택지가 열릴 수 있어.','inner'));
  }else if(state.phase==='scene'){
    const event=currentEvent(state);root.append(el('div',`${event.kind==='main'?'REQUIRED':'EXPLORATION'} · ${state.dayEventIndex+1}/2 · ${event.location}`,'eyebrow'),el('h2',event.title));if(state.dayEventIndex===0){root.append(el('p','이미 탐사 중이야. 장소를 바꾸려면 아래에서 현재 탐사를 취소하고 베이스로 돌아가면 돼.','inner'));commandButton(root,'현재 탐사를 취소하고 다른 장소 고르기',{type:'returnHub'},'button');}else root.append(el('p','오늘은 필수 사건 진행 중이야. 내일 베이스에서 새로운 탐사 장소를 고를 수 있어.','inner'));event.intro.forEach(t=>paragraph(root,t));sceneDetails(state).forEach(t=>paragraph(root,t));
    if(event.id==='warehouse_signal'&&state.profile.past==='flood')root.append(el('p','차가운 물이 발끝에 닿자 이전 사고의 감각이 되살아났다.','inner'));
    for(const [id,c]of Object.entries(event.choices)){if(c.requiresFlags?.some(flag=>!state.world[flag]))continue;commandButton(root,c.label,{type:'choose',id},'button choice',gate(state,id));root.append(el('small',c.hint));}
  }else if(state.phase==='refused'){
    const event=currentEvent(state);root.append(el('section',undefined,'refusal-banner'));root.lastChild.append(el('div','CHOICE REFUSED / 선택 거부','eyebrow'),el('h2','몸이 선택을 받아들이지 않았다'));paragraph(root.lastChild,event.refusalText||'행동하려 했지만 몸이 움직이지 않았다.');const personal=refusalDetail(state);if(personal)paragraph(root.lastChild,personal);
    root.append(el('p',event.alternativeText||'다른 방법을 찾을 수 있다.','inner'));const alternative=event.choices[event.choices[state.pending.originalChoice].alternative];commandButton(root,`대체 행동 · ${alternative.label}`,{type:'alternative'},'button primary',gate(state,event.choices[state.pending.originalChoice].alternative));
    const force=button('강제 명령 모듈 사용',()=>{if(confirm('강제 명령 모듈 1개 소모 · 안정도 −12\n거부한 행동을 시도하지만 성공은 보장되지 않아. 사용할까?'))act({type:'override',confirmed:true});},'button danger');force.disabled=busy||!state.inventory.override;root.append(force,el('small',state.inventory.override?`보유 ${state.inventory.override}개 · 거부 기록은 그대로 남아.`:'보유한 강제 명령 모듈이 없어.'));
  }else if(state.phase==='outcome'){
    const r=state.currentResolution,event=events[r.eventId],o=event.outcomes[r.outcomeId];root.append(el('div',`${state.day}일차 · ${event.location}`,'eyebrow'),el('h2',o.title));
    if(r.forcedOverrideUsed)root.append(el('p','강제 명령이 관절을 움직였다. 판단과 행동 사이의 어긋남이 안정도에 남았다.','forced-note'));
    if(r.decision==='hesitate')root.append(el('p','잠깐 멈췄다가 스스로 결정을 내렸다.','inner'));
    paragraph(root,o.text);if((o.discoveries||[]).length)root.append(el('p',`조우 기록 추가 · ${o.discoveries.map(id=>people[id].name).join(', ')}`,'unlock'));
    commandButton(root,state.dayEventIndex===0?'다음 필수 사건으로 이동':'방파제 베이스로 귀환',{type:'continue'});
  }else if(state.phase==='returned'){
    const today=state.eventLog.filter(r=>r.gameDay===state.day);root.append(el('p','오늘의 자유 탐사와 필수 사건을 마쳤어. 다음 날 베이스에서 탐사 지역을 다시 고를 수 있어.','inner'),el('div',`RETURN / DAY ${String(state.day).padStart(2,'0')}`,'eyebrow'),el('h2','불빛이 있는 곳으로'));
    paragraph(root,`오늘의 탐사 ${today.length}건이 기억 장치에 저장됐다. 해온이 손상과 남은 전력을 확인하고, 베이스의 저녁등을 켰다.`);if(state.day===MAX_DAY)paragraph(root,'중계시설의 신호는 더 이상 같은 방식으로 울리지 않았다. 오늘의 기록을 마치면 이 항로의 결말이 열린다.');
    commandButton(root,state.day===MAX_DAY?'14일차를 기록하고 엔딩 보기':'하루를 기록하고 다음 날로',{type:'endDay'});
  }else if(state.phase==='ending'){
    root.append(el('div','ROUTE COMPLETE / DAY 14','eyebrow'),el('h2',state.ending.title));paragraph(root,state.ending.text);root.append(el('p',`기억 ${state.memories.length}개 · 일기 ${state.diaries.length}일 · 조우 ${state.discoveries.length}/${Object.keys(people).length}`,'badge'));root.append(button('14일의 일기 읽기',()=>{tab='records';render();},'button primary'));paragraph(root,'같은 사건도 다른 성격과 가치관으로 선택과 거부가 달라질 수 있어. 베이스의 초기화 버튼으로 같은 캐릭터의 항로를 빠르게 다시 시작할 수 있다.');
  }
}
function resolutionCard(root,r){
  const event=events[r.eventId],o=event.outcomes[r.outcomeId],card=el('article',undefined,'memory-card');const top=el('div',undefined,'memory-head');top.append(el('span',`${String(r.gameDay).padStart(2,'0')}일 · ${event.kind==='main'?'필수':'탐사'}`,'eyebrow'),el('h3',event.title));card.append(top,el('p',o.fact));
  if(r.decision==='refuse'||r.attempts.some(a=>a.decision==='alternative'||a.decision==='forced'))card.append(el('span',r.forcedOverrideUsed?'선택 거부 · 강제 명령 사용':'선택 거부 · 대체 행동','refusal-tag'));
  const details=el('details');details.append(el('summary','선택 기록 보기'));const first=event.choices[r.playerChoiceId]?.label||r.playerChoiceId;details.append(el('small','처음 고른 행동'),el('p',first),el('small','실제로 한 행동'),el('p',actionNames[r.actualActionId]||r.actualActionId));card.append(details);root.append(card);
}
function records(root){
  root.append(el('h2','기억과 일기'));if(!state.eventLog.length)paragraph(root,'탐사에서 확정된 사실이 이곳에 쌓일 거야.');else{root.append(el('h3','사건 기억'));[...state.eventLog].reverse().forEach(r=>resolutionCard(root,r));}
  root.append(el('h3','날짜별 일기'));if(!state.diaries.length)paragraph(root,'하루의 탐사를 마치면 일기가 기록돼.');else[...state.diaries].reverse().forEach(d=>{const details=el('details',undefined,'diary-entry');const summary=el('summary',`${String(d.day).padStart(2,'0')}일의 일기`);details.append(summary);const paper=el('article',undefined,'diary');paragraph(paper,d.text);details.append(paper);root.append(details);});
}
function character(root){
  root.append(el('h2',state.profile.name),el('p',purposes[state.profile.purpose]+' · '+values[state.profile.value]));paragraph(root,pasts[state.profile.past]);root.append(el('h3','처음의 성격'),el('p',state.profile.keywords.map(k=>keywords[k].label).join(' · ')),el('h3','현재의 기색'));paragraph(root,state.character.beliefs.fear_flooded_places>=50?'물이 고인 곳을 유심히 살피며 경계하고 있다.':'물에 잠긴 폐허를 조심스레 관찰하고 있다.');
  const first=state.eventLog[0],last=state.eventLog.at(-1);
  if(first&&last){
    const changed=Object.keys(traits).map(k=>({k,difference:last.after.traits[k]-first.before.traits[k]})).filter(r=>r.difference!==0).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference));
    if(changed.length)paragraph(root,changed.slice(0,3).map(r=>traits[r.k]+(r.difference>0?'이/가 조금씩 강해지고 있다.':'에 대한 태도가 전보다 누그러졌다.')).join(' '));
  }
  if(state.character.stability<80)paragraph(root,'명령 개입의 흔적이 안정도에 남아 있다. 회복되지 않은 어긋남은 다음 선택의 망설임에도 영향을 준다.');
}
function inventory(root){
  root.append(el('h2','방파제 베이스'),el('p',state.phase==='hub'?'탐사 탭에서 오늘 갈 장소를 고를 수 있어. 여기서 수리·충전을 마친 뒤 출발해 줘.':'탐사 중에는 베이스 장비를 사용할 수 없어. 다음 날 출발 전 탐사 탭에서 장소를 선택할 수 있어.'));
  root.append(el('h3','장비와 소모품'));for(const [id,item]of Object.entries(items)){const c=el('section',undefined,'item-card');const head=el('div',undefined,'item-head');head.append(el('h3',item.name),el('strong',id==='drone'?'장착':`× ${state.inventory[id]}`));c.append(head,el('p',item.description));if(id==='kit')commandButton(c,'수리 키트 사용',{type:'useItem',id},'button compact',state.phase!=='hub'?'탐사 중 사용 불가':state.character.integrity===100?'기체 상태가 이미 100이야.':!state.inventory.kit?'보유 수량이 없어.':'');if(id==='cell')commandButton(c,'충전 셀 사용',{type:'useItem',id},'button compact',state.phase!=='hub'?'탐사 중 사용 불가':state.character.energy===100?'전력이 이미 100이야.':!state.inventory.cell?'보유 수량이 없어.':'');root.append(c);}
  root.append(el('h3',`조우 기록 · ${state.discoveries.length}/${Object.keys(people).length}`));const grid=el('div',undefined,'people-grid');for(const [id,p]of Object.entries(people)){const met=state.discoveries.includes(id),c=el('article',undefined,met?'person-card':'person-card locked');c.append(el('span',met?p.type:'미등록 개체','eyebrow'),el('h3',met?p.name:'???'),el('p',met?p.summary:'탐사에서 직접 만나면 기록이 해금된다.'));grid.append(c);}root.append(grid);settings(root);
}
function settings(root){
  root.append(el('h3','저장 및 테스트'),el('p','진행은 이 브라우저에 자동 저장돼. 브라우저 데이터를 지우면 사라질 수 있으니 JSON 백업을 보관해 줘.'));
  root.append(button('JSON 백업 내려받기',async()=>{try{const s=state||await rawBackup();if(s)download(s);else notice('저장된 진행이 없어.');}catch(e){notice(e.message);}}));
  const input=el('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{if(busy||!input.files[0])return;try{const f=input.files[0];if(f.size>2000000)throw Error('저장 파일은 2MB 이하만 읽을 수 있어.');const next=validateSave(JSON.parse(await f.text()));if(!confirm(`${next.profile.name} · ${next.day}일차\n이 기록을 불러올까? 현재 진행은 이전 저장으로 보관해.`))return;busy=true;await commit(next,state,{replace:true});state=next;creating=false;tab='explore';busy=false;render();notice('백업을 불러왔어.');}catch(e){notice(e.message);}finally{busy=false;input.value='';}};root.append(field('JSON 백업 불러오기',input));
  root.append(button('교체 전 저장 복구',async()=>{if(busy)return;try{const next=await previous();if(!next)throw Error('교체 전 저장이 없어.');if(!confirm(`${next.profile.name}의 이전 저장으로 돌아갈까?`))return;busy=true;await commit(next,state,{replace:true});state=next;creating=false;tab='explore';busy=false;render();notice('이전 저장을 복구했어.');}catch(e){notice(e.message);}finally{busy=false;}}));
  if(state){root.append(button('테스트용 · 같은 캐릭터로 1일차 초기화',async()=>{if(busy||!confirm('현재 항로를 1일차로 초기화할까? 현재 저장은 교체 전 저장에 한 번 보관돼.'))return;try{busy=true;const next=createGame(state.profile);await commit(next,state,{replace:true});state=next;tab='explore';busy=false;render();notice('1일차로 초기화했어.');}catch(e){notice(e.message);}finally{busy=false;}},'button danger'));root.append(button('새 캐릭터 만들기',()=>{if(confirm('새 캐릭터를 만들까? 현재 진행은 새 캐릭터 활성화 전까지 유지돼.')){creating=true;render();}},'text-button'));}
}
function render(){
  app.replaceChildren();const shell=el('div',undefined,'shell'),header=el('header');header.append(el('div','SEA / ROUTE 014 · 탐사 선택 v0.3','eyebrow'),el('h1','잔해의 항로'),el('p','인류가 떠난 바다, 남겨진 의지의 기록.','subtitle'));shell.append(header);const main=el('main');main.id='main';
  if(broken){main.append(el('h2','저장 기록을 확인해 줘'),el('p','저장소를 읽지 못했어. 원본을 보호하기 위해 새 게임은 시작하지 않았어.'));main.append(button('원본 JSON 백업',async()=>{try{const s=await rawBackup();if(s)download(s);}catch(e){notice(e.message);}}));}
  else if(!state||creating){creator(main);if(!state)settings(main);}else{stats(main);({explore,records,character,base:inventory}[tab])(main);}shell.append(main);
  if(state&&!creating&&!broken){const nav=el('nav');nav.setAttribute('aria-label','게임 메뉴');for(const [id,label]of [['explore','탐사'],['base','베이스'],['character','캐릭터'],['records','기록']]){const b=button(label,()=>{tab=id;render();},id===tab?'nav active':'nav');if(id===tab)b.setAttribute('aria-current','page');nav.append(b);}shell.append(nav);}app.append(shell);if(busy)app.querySelectorAll('button').forEach(b=>b.disabled=true);
}
try{state=await load();}catch(e){broken=true;notice('저장 불러오기 실패: '+e.message);}render();
