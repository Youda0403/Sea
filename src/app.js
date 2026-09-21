import {keywords,values,pasts,purposes,traits,items,episode,actionNames} from './content.js';
import {createGame,transition,gate,validateSave} from './engine.js';
import {load,commit,previous,rawBackup} from './storage.js';
const app=document.querySelector('#app');let state=null,tab='explore',busy=false,creating=false,broken=false;
// All user input is rendered with textContent, never interpolated into markup.
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function add(parent,...children){parent.append(...children);return parent;}
function button(label,fn,cls='button'){const b=el('button',label,cls);b.type='button';b.onclick=fn;return b;}
let noticeTimer;
function notice(t){clearTimeout(noticeTimer);document.querySelector('#notice').textContent=t;noticeTimer=setTimeout(()=>document.querySelector('#notice').textContent='',8000);}
function download(s){const u=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}));const a=el('a');a.href=u;a.download='sea-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
async function act(command){if(busy)return;busy=true;render();try{const next=transition(state,command);await commit(next,state);state=next;notice('진행을 저장했어.');}catch(e){notice(e.message);}finally{busy=false;render();}}
function paragraph(root,text){for(const p of text.split('\n\n'))root.append(el('p',p));}
function field(label,node){const l=el('label',undefined,'field');l.append(el('span',label),node);return l;}
function select(options){const s=el('select');for(const [id,label]of Object.entries(options)){const o=el('option',label);o.value=id;s.append(o);}return s;}
function creator(root){
  root.append(el('div','CHARACTER / 01','eyebrow'),el('h2','너의 항로를 시작해'));
  paragraph(root,'바다는 대부분의 이름을 지웠다. 하지만 네 이름은, 네가 정할 수 있다.');
  const form=el('form'),name=el('input');name.maxLength=30;name.required=true;name.placeholder='기체의 이름';name.autocomplete='off';
  const purpose=select(purposes),value=select(values),past=select(pasts);
  form.append(field('이름',name),field('제작 목적',purpose),el('small','의료형은 직접 구조, 정비형은 드론 작업에 소폭 유리해. 제작 목적은 성격을 정하지 않아.'));
  const box=el('fieldset');box.append(el('legend','성격 · 3개 선택'));const grid=el('div',undefined,'chips');
  for(const [id,k]of Object.entries(keywords)){const c=el('input');c.type='checkbox';c.value=id;c.name='keyword';const l=el('label',undefined,'chip');l.append(c,el('span',k.label));grid.append(l);}box.append(grid);form.append(box,field('핵심 가치관',value),field('과거',past));
  const submit=el('button','기체 활성화','button primary');submit.type='submit';form.append(submit);
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;try{const next=createGame({name:name.value,purpose:purpose.value,value:value.value,past:past.value,keywords:[...form.querySelectorAll('input:checked')].map(x=>x.value)});busy=true;submit.disabled=true;await commit(next,state,{replace:!!state});state=next;creating=false;tab='explore';busy=false;render();notice('캐릭터를 저장했어.');}catch(err){notice(err.message);}finally{busy=false;submit.disabled=false;}};
  root.append(form);if(state)root.append(button('현재 항로로 돌아가기',()=>{creating=false;render();},'text-button'));
}
function stats(root){const s=el('div',undefined,'stats');for(const [key,label]of [['energy','전력'],['integrity','기체 상태'],['stability','안정도']]){const cell=el('div');cell.append(el('span',label),el('strong',String(state.character[key])),el('small',' / 100'));const meter=el('progress');meter.max=100;meter.value=state.character[key];meter.setAttribute('aria-label',label);cell.append(meter);s.append(cell);}root.append(s);}
function commandButton(root,label,command,cls='button primary',disabledReason=''){const b=button(label,()=>act(command),cls);b.disabled=busy||!!disabledReason;root.append(b);if(disabledReason)root.append(el('small',disabledReason));}
function explore(root){
  if(state.phase==='hub'){
    root.append(el('div','BREAKWATER / HOME','eyebrow'),el('h2','방파제의 아침'));
    paragraph(root,'정비사 해온이 충전 케이블을 걷었다. “제7창고에서 신호가 와. 오래된 자동 송신일 수도 있고, 누군가 기다리고 있을 수도 있어.”\n\n드론과 강제 명령 모듈을 챙겼다. 모듈의 봉인에는 작은 경고가 적혀 있었다. ‘판단과 행동 사이의 불일치가 발생할 수 있음.’');
    commandButton(root,'신호를 따라 출발하기 · 전력 −8',{type:'depart'});
  }else if(state.phase==='scene'){
    root.append(el('div',episode.location,'eyebrow'),el('h2','물 아래에서 들려온 목소리'));
    episode.intro.forEach(t=>paragraph(root,t));
    if(state.profile.past==='flood')root.append(el('p','차가운 물이 발끝에 닿자 이전 사고의 감각이 되살아났다.','inner'));
    for(const [id,c]of Object.entries(episode.choices)){commandButton(root,c.label,{type:'choose',id},'button choice',gate(state,id));root.append(el('small',c.hint));}
  }else if(state.phase==='refused'){
    root.append(el('div','AUTONOMY / 선택의 틈','eyebrow'),el('h2','몸이 움직이지 않았다'));
    paragraph(root,state.pending.originalChoice==='enter'?'물에 잠긴 전선을 바라보며 발을 멈췄다. 위험을 무릅쓰려 했지만, 지금은 저 안으로 들어갈 수 없었다.':'아직 응답이 들리고 있었다. 이대로 등을 돌릴 수는 없었다.');
    root.append(el('p','“드론을 보내면…… 다른 길을 찾을 수 있을지도 몰라.”','inner'));
    commandButton(root,'대안을 받아들인다 · 드론 투입',{type:'alternative'},'button primary',gate(state,'drone'));
    if(state.pending.originalChoice==='enter')commandButton(root,'거부를 받아들이고 좌표를 남긴다',{type:'withdraw'},'button');
    const force=button('강제 명령 모듈 사용',()=>{if(confirm('모듈 1개 소모 · 안정도 −12\n거부한 행동을 시도하지만 성공은 보장되지 않아. 사용할까?'))act({type:'override',confirmed:true});},'button danger');force.disabled=busy||!state.inventory.override;root.append(force,el('small','거부는 저장됐어. 새로고침해도 다시 추첨하지 않아.'));
  }else if(state.phase==='outcome'){
    const r=state.resolution,o=episode.outcomes[r.outcomeId];root.append(el('div','RESOLUTION / 남겨진 흔적','eyebrow'),el('h2',o.title));
    if(r.decision==='hesitate')root.append(el('p','잠시 망설였다. 그리고, 움직였다.','inner'));
    if(r.forcedOverrideUsed)root.append(el('p','명령 모듈이 켜졌다. 결심보다 먼저 관절이 움직였다. 안정도 −12.','inner'));
    paragraph(root,o.text);record(root);commandButton(root,'방파제 거점으로 돌아가기',{type:'return'});
  }else if(state.phase==='returned'){
    root.append(el('div','RETURN / 해가 지는 곳','eyebrow'),el('h2','오늘의 항로를 접으며'));
    paragraph(root,state.world.ryu_safe?'류는 정비대에서 짧게 손을 들었다. 해온이 두 기체 몫의 전원을 연결했다.':'해온은 전송받은 좌표와 기록을 확인했다. “알려 줘서 고마워. 나머지는 우리가 살펴볼게.”');
    paragraph(root,'바깥의 바다는 어두워지고 있었다. 오늘의 기억을 기록하고 절전 모드에 들어갈 시간이다.');
    commandButton(root,'하루를 마치고 일기 쓰기',{type:'endDay'});
  }else{
    root.append(el('div','EPILOGUE / 첫 번째 신호','eyebrow'),el('h2',episode.outcomes[state.resolution.outcomeId].title));
    paragraph(root,'신호 하나를 따라갔던 하루가 끝났다. 바다는 여전히 넓고, 이 기억은 이제 네 안에 남아 있다.');
    root.append(el('p','첫 번째 테스트 에피소드 완료','badge'));
    root.append(button('오늘의 일기 읽기',()=>{tab='records';render();},'button primary'));
    paragraph(root,'이 버전은 여기까지야. 다른 성격으로 새 항로를 시작해 볼 수 있어. 현재 기록은 먼저 백업해 줘.');
  }
}
function record(root){const r=state.resolution;if(!r){paragraph(root,'아직 확정된 사건이 없어.');return;}
  const box=el('section',undefined,'record');box.append(el('h3','선택과 실제 행동'));
  for(const [label,text]of [['최초 선택',episode.choices[r.playerChoiceId].label],['실제 행동',actionNames[r.actualActionId]],['결과',episode.outcomes[r.outcomeId].fact]])box.append(el('small',label),el('p',text));
  const labels={accept:'수용',hesitate:'주저 후 수용',refuse:'거부',alternative:'대체 행동',forced:'강제 명령',accept_refusal:'거부를 받아들임'};
  box.append(el('small','행동 흐름'),el('p',r.attempts.map(a=>labels[a.decision]||a.decision).join(' → ')));
  if(r.forcedOverrideUsed)box.append(el('p','강제 명령 모듈 1개 소모 · 안정도 −12','warning'));
  root.append(box);
}
function records(root){root.append(el('h2','기억과 일기'));record(root);root.append(el('h3','오늘의 기억'));if(state.memories.length)state.memories.forEach(m=>paragraph(root,m.text));else paragraph(root,'하루의 흔적이 이곳에 쌓일 거야.');root.append(el('h3','01일 · 나의 일기'));if(state.diaries.length){const paper=el('article',undefined,'diary');paragraph(paper,state.diaries[0].text);root.append(paper);}else paragraph(root,'거점으로 돌아와 하루를 마치면 일기가 기록돼.');}
function character(root){root.append(el('h2',state.profile.name),el('p',purposes[state.profile.purpose]+' · '+values[state.profile.value]));paragraph(root,pasts[state.profile.past]);root.append(el('h3','처음의 성격'),el('p',state.profile.keywords.map(k=>keywords[k].label).join(' · ')),el('h3','현재의 기색'));
  paragraph(root,state.character.beliefs.fear_flooded_places>=50?'물이 고인 곳을 유심히 살피며 경계하고 있다.':'물에 잠긴 폐허를 조심스레 관찰하고 있다.');
  if(state.resolution){const changes=Object.keys(traits).filter(k=>state.resolution.after.traits[k]!==state.resolution.before.traits[k]);paragraph(root,changes.map(k=>traits[k]+'에 작은 변화가 남았다.').join(' '));}
  if(state.character.stability<100)paragraph(root,'판단과 움직임이 어긋났던 감각이 남아 있다.');
}
function hub(root){root.append(el('h2','장비와 기록 보관'));for(const [id,item]of Object.entries(items)){const c=el('section',undefined,'record');c.append(el('h3',item.name+' × '+state.inventory[id]),el('p',item.description));root.append(c);}commandButton(root,'응급 수리 키트 사용',{type:'repair'},'button',state.phase!=='hub'?'첫 출발 전 거점에서만 사용 가능':state.character.integrity===100?'기체가 완전한 상태야.':'');settings(root);}
function settings(root){
  root.append(el('h3','저장 및 백업'),el('p','진행은 이 브라우저에 자동 저장돼. 브라우저 데이터를 지우면 사라질 수 있으니 JSON 백업을 보관해 줘. 다른 기기로 자동 동기화되지는 않아.'));
  root.append(button('JSON 백업 내려받기',async()=>{try{const s=state||await rawBackup();if(s)download(s);else notice('저장된 진행이 없어.');}catch(e){notice(e.message);}}));
  const input=el('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{if(busy||!input.files[0])return;try{const f=input.files[0];if(f.size>1000000)throw Error('저장 파일은 1MB 이하만 읽을 수 있어.');const next=validateSave(JSON.parse(await f.text()));if(!confirm(next.profile.name+' · 1일차 · '+next.phase+'\n이 기록을 불러올까? 현재 진행은 이전 저장으로 보관해.'))return;busy=true;await commit(next,state,{replace:true});state=next;creating=false;tab='explore';busy=false;render();notice('백업을 불러왔어.');}catch(e){notice(e.message);}finally{busy=false;input.value='';}};root.append(field('JSON 백업 불러오기',input));
  root.append(button('교체 전 저장 복구',async()=>{if(busy)return;try{const next=await previous();if(!next)throw Error('교체 전 저장이 없어.');if(!confirm(next.profile.name+'의 이전 저장으로 돌아갈까?'))return;busy=true;await commit(next,state,{replace:true});state=next;creating=false;tab='explore';busy=false;render();notice('이전 저장을 복구했어.');}catch(e){notice(e.message);}finally{busy=false;}}));
  if(state)root.append(button('새 캐릭터 만들기',()=>{if(confirm('현재 진행을 백업했어? 새 캐릭터 활성화 시 현재 진행은 이전 저장으로 보관돼.')){creating=true;render();}},'text-button'));
}
function render(){app.replaceChildren();const shell=el('div',undefined,'shell');const header=el('header');header.append(el('div','SEA / ARCHIVE 001','eyebrow'),el('h1','잔해의 항로'),el('p','인류가 떠난 바다, 남겨진 의지의 기록.','subtitle'));shell.append(header);
  const main=el('main');main.id='main';if(broken){main.append(el('h2','저장 기록을 확인해 줘'),el('p','저장소를 읽지 못했어. 원본을 보호하기 위해 새 게임은 시작하지 않았어. JSON 백업을 내려받고 새로고침하거나, 저장이 허용된 일반 브라우저에서 다시 열어 줘.'));main.append(button('원본 JSON 백업',async()=>{try{const s=await rawBackup();if(s)download(s);}catch(e){notice(e.message);}}));}
  else if(!state||creating){creator(main);if(!state)settings(main);}else{stats(main);({explore,records,character,hub}[tab])(main);}
  shell.append(main);if(state&&!creating&&!broken){const nav=el('nav');nav.setAttribute('aria-label','게임 메뉴');for(const [id,label]of [['explore','탐사'],['hub','거점'],['character','캐릭터'],['records','기록']]){const b=button(label,()=>{tab=id;render();},id===tab?'nav active':'nav');if(id===tab)b.setAttribute('aria-current','page');nav.append(b);}shell.append(nav);}app.append(shell);if(busy)app.querySelectorAll('button').forEach(b=>b.disabled=true);
}
try{state=await load();}catch(e){broken=true;notice('저장 불러오기 실패: '+e.message);}render();
