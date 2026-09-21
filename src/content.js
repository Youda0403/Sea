export const traits={courage:'용기',altruism:'이타성',caution:'신중함',impulsivity:'충동성',sociability:'사교성',wariness:'경계심'};
export const keywords={
  timid:{label:'소심한',effects:{courage:-25,wariness:15}},kind:{label:'다정한',effects:{altruism:25}},careful:{label:'신중한',effects:{caution:25,impulsivity:-10}},bold:{label:'대담한',effects:{courage:25}},impulsive:{label:'충동적인',effects:{impulsivity:25,caution:-15}},social:{label:'사교적인',effects:{sociability:25}},quiet:{label:'말수가 적은',effects:{sociability:-25}},wary:{label:'경계하는',effects:{wariness:25}},trusting:{label:'남을 잘 믿는',effects:{wariness:-25}},selfish:{label:'자기중심적인',effects:{altruism:-25}},composed:{label:'침착한',effects:{caution:15,courage:10}},curious:{label:'호기심 많은',effects:{courage:10,impulsivity:15}}
};
export const values={life:'생명 보호',self:'자기 보존',truth:'진실 추구',freedom:'자율성'};
export const pasts={flood:'침수 사고에서 혼자 살아남았다',rescue:'누군가의 도움으로 다시 깨어났다',blank:'이전 기억이 지워졌다',duty:'오래된 임무를 끝내지 못했다'};
export const purposes={repair:'정비형',medical:'의료형',scout:'탐사형'};
export const items={
  drone:{name:'소형 탐사 드론',description:'좁거나 위험한 장소를 원격 조사한다. 장비라서 소모되지 않는다.'},override:{name:'강제 명령 모듈',description:'거부한 행동을 한 번 시도한다. 안정도 −12. 성공을 보장하지 않는다.'},kit:{name:'응급 수리 키트',description:'베이스에서 기체 상태를 25 회복한다.'},cell:{name:'충전 셀',description:'베이스에서 전력을 35 회복한다.'},sealant:{name:'임시 방수제',description:'침수 행동의 손상을 줄인다. 관련 선택에서 자동으로 1개 사용한다.'}
};
export const people={
  haon:{name:'해온',type:'방파제 정비사',summary:'말수가 적고 손이 빠른 정비형 안드로이드. 네 기체를 깨운 장본인이며, 매일 탐사 장비를 점검해 준다.'},
  ryu:{name:'류',type:'물류 운반 기체',summary:'제7창고의 구조 신호를 보낸 기체. 낡은 화물표를 소중히 간직하고 있다.'},
  mira:{name:'미라',type:'조위 관측원',summary:'붕괴한 관측소를 홀로 지켜 왔다. 바다의 높이를 날짜 대신 기억한다.'},
  noel:{name:'노엘',type:'고철 해안 수집가',summary:'쓸모없어 보이는 부품에도 이전 주인의 흔적이 남는다고 믿는다.'},
  sol:{name:'솔',type:'공동 주파수 관리인',summary:'흩어진 거점의 무전을 중계한다. 침묵도 하나의 응답이라고 여긴다.'},
  iro:{name:'이로',type:'교육 기록 보관기',summary:'침수 학교에서 학생들의 목소리를 보존하고 있다. 질문을 받으면 눈의 투사등이 밝아진다.'},
  bell:{name:'벨',type:'이동 정비소 운영자',summary:'바퀴 달린 정비대를 끌고 해안을 돈다. 수리비 대신 여행 이야기를 받기도 한다.'},
  asha:{name:'아샤',type:'심해 작업 기체',summary:'해저 중계시설의 압력문을 관리한다. 오래된 명령과 지금의 판단을 구분하려 애쓴다.'}
};

const C=(label,hint,action,cost,outcome,extra={})=>({label,hint,action,cost,outcome,...extra});
const O=(title,text,fact,effects={},extra={})=>({title,text,fact,effects,result:'success',tags:[],...extra});
const E=(id,day,kind,title,location,intro,choiceList,extra={})=>{
  const choices={},outcomes={},tables={};
  for(const [choiceId,c] of Object.entries(choiceList)){
    const outcomeId=`${id}_${choiceId}`;choices[choiceId]={...c};delete choices[choiceId].outcome;
    outcomes[outcomeId]={id:outcomeId,action:c.action,...c.outcome};tables[choiceId]=[{max:1,id:outcomeId}];
  }
  return {id,day,kind,title,location,intro,choices,outcomes,tables,travelCost:kind==='ambient'?4:6,...extra};
};
const autonomy=(conflicts,valueConflicts,alternative,extra={})=>({autonomy:true,conflicts,valueConflicts,alternative,...extra});

const warehouse={
  id:'warehouse_signal',day:1,kind:'main',title:'물 아래에서 들려온 목소리',location:'침수 물류구역 · 제7창고',travelCost:6,
  intro:['물이 빠진 자리에는 하얀 소금 자국이 남아 있었다. 무너진 고가도로 아래, 제7창고의 비상등 하나가 아직 깜빡였다.','“수신 가능한 기체…… 응답 바람.” 끊어진 전파 너머로 금속을 두드리는 소리가 들렸다. 통로는 물에 잠겨 있고, 천장에서 늘어진 전선 끝에는 불꽃이 튀었다.'],
  refusalText:'물에 잠긴 전선을 바라보며 발을 멈췄다. 위험을 무릅쓰려 했지만 관절이 굳어 더는 나아가지 못했다.',alternativeText:'드론을 보내면 다른 길을 찾을 수 있을지도 모른다.',
  choices:{
    enter:C('통로에 직접 들어가 구조한다','전력 −14 · 기체 손상 위험','direct_rescue',14,null,autonomy([{trait:'courage',direction:'low',weight:35},{trait:'caution',direction:'high',weight:15}],{self:25},'drone',{fearWeight:20,autoItem:'sealant'})),
    drone:C('드론으로 우회로를 찾는다','드론 필요 · 전력 −9','remote_rescue',9,null,{item:'drone'}),
    leave:C('신호 위치를 남기고 철수한다','전력 −3 · 구조는 보장되지 않음','mark_and_leave',3,null,autonomy([{trait:'altruism',direction:'high',weight:45}],{life:30},'drone'))
  },
  outcomes:{
    rescued:{id:'rescued',action:'direct_rescue',result:'success',title:'함께 돌아온 기체',text:'수동 차단기를 내리자 불꽃이 멎었다. 잔해를 밀어내고 기체의 팔을 어깨에 걸쳤다. 이름은 류. 두 쌍의 발자국이 물 밖으로 이어졌다.',fact:'제7창고 안으로 들어가 류를 구조했다.',effects:{integrity:-8,courage:4,altruism:2,fear:-10},tags:['rescued','faced_flood'],flags:['ryu_safe'],discoveries:['ryu'],meters:{community:2}},
    partial:{id:'partial',action:'direct_rescue',result:'partial',title:'작은 불빛을 품고',text:'류의 하반신은 들보 아래에 깊이 끼어 있었다. 동의를 받고 코어를 분리했다. 몸체는 두고 왔지만 손바닥 안의 불빛은 아직 꺼지지 않았다.',fact:'류의 몸체는 구하지 못했지만 동의를 받고 코어를 회수했다.',effects:{integrity:-20,courage:2,fear:5},tags:['core_saved'],flags:['ryu_core_safe'],discoveries:['ryu'],meters:{community:1,truth:1}},
    failed:{id:'failed',action:'direct_rescue',result:'failure',title:'닿지 못한 손',text:'두 번째 들보가 무너졌다. 뻗은 손은 허공을 스쳤다. 비상 부표에 매달려 가까스로 빠져나와 구조 좌표를 전송했다.',fact:'직접 구조를 시도했지만 실패했다. 류의 안전은 확인하지 못했다.',effects:{integrity:-30,caution:4,fear:15},tags:['rescue_failed'],flags:['rescue_pending'],discoveries:['ryu'],meters:{truth:1}},
    remote:{id:'remote',action:'remote_rescue',result:'success',title:'멀리서 건넨 손',text:'드론이 환기구를 지나 비상 배수 펌프를 켰다. 물이 낮아지자 류는 안내등을 따라 걸어 나왔다.',fact:'드론으로 배수 펌프를 가동해 류의 탈출을 도왔다.',effects:{caution:3,altruism:2,fear:-5},tags:['rescued','remote_help'],flags:['ryu_safe'],discoveries:['ryu'],meters:{community:2}},
    remote_partial:{id:'remote_partial',action:'remote_rescue',result:'partial',title:'구조대가 향하는 곳',text:'드론은 펌프를 복구하지 못했다. 대신 류에게 예비 전원을 연결하고 정확한 위치를 송신했다. 거점 구조대가 곧 출발했다.',fact:'류에게 전원을 공급하고 구조대를 요청했다.',effects:{caution:3,fear:2},tags:['help_requested'],flags:['rescue_pending'],discoveries:['ryu'],meters:{community:1}},
    left:{id:'left',action:'mark_and_leave',result:'abandoned',title:'남겨 둔 좌표',text:'창고 외벽에 구조 좌표를 새겼다. 거점에는 위치를 알렸지만 그 뒤의 응답은 들을 수 없었다.',fact:'창고에 들어가지 않고 좌표를 남긴 뒤 철수했다.',effects:{caution:2,fear:3},tags:['left_signal'],flags:['rescue_pending'],meters:{isolation:1}}
  },
  tables:{enter:[{max:.52,id:'rescued'},{max:.84,id:'partial'},{max:1,id:'failed'}],drone:[{max:.8,id:'remote'},{max:1,id:'remote_partial'}],leave:[{max:1,id:'left'}]}
};

export const events={warehouse_signal:warehouse};
function add(event){events[event.id]=event;}

add(E('tide_marks',1,'ambient','물때가 남긴 지도','방파제 외곽 · 조위 표식',['콘크리트 기둥마다 이전 탐사자들이 새긴 수위선이 겹쳐 있었다. 가장 최근 선 옆에는 아직 마르지 않은 화살표가 있었다.'],{
  trace:C('화살표를 따라 안전한 길을 확인한다','전력 −3','trace_route',3,O('마른 길의 방향','화살표는 무너진 고가도로 아래의 마른 길로 이어졌다. 누군가 다음 탐사자를 위해 남긴 표시였다.','조위 표식을 따라 안전한 진입로를 확인했다.',{caution:2},{tags:['route_found'],flags:['dry_route'],meters:{community:1}})),scan:C('수위 변화를 스캔해 기록한다','전력 −4','scan_tide',4,O('바다의 시간표','수위 기록에서 일정한 이상 진동이 보였다. 구조 신호와 같은 간격이었다.','수위 기록에서 구조 신호와 닮은 진동을 발견했다.',{caution:1},{tags:['signal_pattern'],meters:{truth:1}}))
}));
add(E('solar_roof',2,'ambient','햇빛이 고인 옥상','침수 상가 · 태양광 지붕',['바닷물 위로 남은 옥상에 태양광 패널 세 장이 비스듬히 기대어 있었다. 한 장은 아직 미약한 전류를 흘렸다.'],{
  collect:C('전력을 안전하게 회수한다','전력 −3','collect_power',3,O('따뜻한 충전 셀','배선을 정리하자 남은 전력이 셀 하나에 모였다. 손안이 햇빛처럼 따뜻했다.','폐허의 태양광 패널에서 충전 셀을 회수했다.',{caution:1},{rewards:{cell:1},tags:['salvaged_power']})),map:C('패널의 관리 기록을 읽는다','전력 −3','read_panel_log',3,O('마지막 정비일','관리 기록에는 해수면이 급격히 오른 날과 중계망이 끊긴 시각이 함께 남아 있었다.','태양광 패널 기록에서 침수와 통신 두절 시각을 확인했다.',{}, {tags:['old_timeline'],meters:{truth:1}}))
}));
add(E('seabird_drone',3,'ambient','날개가 접힌 새','방파제 북단',['갈매기 모양 환경 관측 드론이 그물에 걸린 채 반복해서 날개를 움직였다. 저장 장치는 살아 있었다.'],{
  free:C('그물을 잘라 드론을 풀어 준다','전력 −3','free_bird',3,O('다시 난 작은 새','그물을 벗어난 드론은 머리 위를 한 바퀴 돈 뒤 북쪽 하늘로 사라졌다.','그물에 걸린 관측 드론을 풀어 주었다.',{altruism:2},{tags:['bird_freed'],flags:['bird_freed'],meters:{community:1}})),copy:C('관측 자료를 먼저 복사한다','전력 −4','copy_weather',4,O('폭풍의 전조','자료에는 사흘 뒤 큰 폭풍이 올 가능성이 기록돼 있었다. 복사를 마친 뒤 그물도 느슨하게 풀어 두었다.','관측 드론에서 폭풍 예보를 확보했다.',{caution:2},{tags:['storm_warning'],flags:['storm_forecast'],meters:{truth:1}}))
}));
add(E('algae_garden',4,'ambient','유리병 속의 초록','옛 주거 돔 · 공동 온실',['깨진 온실 안에서 밀폐된 조류 배양병 몇 개가 햇빛을 받아 빛났다. 식량용 배양종의 마지막 표본이었다.'],{
  carry:C('표본을 베이스로 가져간다','전력 −4','carry_sample',4,O('작은 초록빛','깨지지 않은 병을 천으로 감쌌다. 방파제 거점의 식량 배양조를 되살릴 수 있을지 모른다.','식량용 조류 표본을 베이스로 옮겼다.',{altruism:1},{tags:['algae_saved'],flags:['algae_sample'],meters:{community:1}})),preserve:C('온실의 자동 장치를 복구한다','전력 −5','repair_greenhouse',5,O('다시 도는 물','막힌 펌프를 고치자 투명한 관 안으로 물방울이 흘렀다. 표본은 원래 자리에서 살아남을 것이다.','온실 순환 장치를 복구해 표본을 보존했다.',{caution:2},{tags:['greenhouse_repaired'],meters:{truth:1}}))
}));
add(E('wreck_field',5,'ambient','기체들의 얕은 무덤','고철 해안 · 외곽',['파도에 닳은 기체 외피가 조개껍데기처럼 모래 위에 흩어져 있었다. 쓸 수 있는 관절 하나가 반쯤 묻혀 있었다.'],{
  salvage:C('식별 기록을 남기고 부품을 회수한다','전력 −4','respectful_salvage',4,O('이름을 적은 부품','외피의 제조 번호를 기록한 뒤 관절을 분리했다. 응급 수리 키트로 재가공할 만한 상태였다.','폐기 기체의 식별 기록을 남기고 부품을 회수했다.',{caution:1},{rewards:{kit:1},tags:['respectful_salvage'],meters:{community:1}})),listen:C('잔류 기록을 읽는다','전력 −3','read_residue',3,O('짧은 귀환 기록','마지막 기록은 “집으로 간다”는 한 문장이었다. 좌표는 지금의 방파제 거점을 가리켰다.','폐기 기체에서 방파제 거점을 가리키는 마지막 기록을 읽었다.',{}, {tags:['home_record'],meters:{truth:1}}))
}));
add(E('storm_drain',6,'ambient','폭풍 전의 배수로','제방 하부',['검은 구름 아래 배수로가 잔해로 막혀 있었다. 그대로 두면 폭풍 때 베이스 외곽까지 물이 찰 수 있었다.'],{
  clear:C('잔해를 직접 치운다','전력 −5','clear_drain',5,O('열린 물길','녹슨 철판을 들어내자 고인 물이 바다 쪽으로 빠르게 흘렀다.','폭풍에 대비해 제방 배수로를 열었다.',{courage:1},{tags:['drain_cleared'],flags:['drain_safe'],meters:{community:1}})),mark:C('위험 구역을 표시하고 지원을 부른다','전력 −2','call_drain_team',2,O('함께 치운 잔해','좌표를 받은 거점 기체 셋이 공구를 들고 왔다. 혼자보다 빠르고 안전하게 물길이 열렸다.','거점 기체들과 함께 배수로를 정리했다.',{sociability:2},{tags:['teamwork'],flags:['drain_safe'],meters:{community:2}}))
}));
add(E('cinema_sign',7,'ambient','물결 위의 상영관','옛 문화구역',['간판의 마지막 글자만 깜빡였다. 로비 안 투사기는 관객 없는 벽에 푸른 바다 영상을 반복하고 있었다.'],{
  watch:C('영상의 끝까지 지켜본다','전력 −2','watch_film',2,O('사라진 바다의 색','영상 속 바다는 지금보다 낮고 잔잔했다. 끝 화면에는 촬영자의 이름들이 천천히 흘렀다.','옛 바다 영상과 제작자들의 이름을 기억했다.',{}, {tags:['human_film'],meters:{truth:1}})),save:C('필름 보관 장치를 회수한다','전력 −4','save_projector',4,O('거점의 작은 상영회','투사기를 조심히 분리했다. 언젠가 방파제 벽에 이 바다를 다시 비출 수 있을 것이다.','옛 영상이 든 투사기를 거점으로 옮겼다.',{altruism:1},{tags:['projector_saved'],flags:['projector'],meters:{community:1}}))
}));
add(E('school_greenhouse',8,'ambient','교실 밖의 화분','침수 학교 · 옥상',['옥상 화분에서 소금에 강한 작은 꽃 한 송이가 피어 있었다. 화분 아래에는 학생 이름표가 줄지어 꽂혀 있었다.'],{
  water:C('정수한 물을 조금 나눈다','전력 −2','water_flower',2,O('흔들리는 꽃','물이 스며들자 접혀 있던 잎이 천천히 펴졌다. 이름표의 글씨도 닦아 읽을 수 있게 했다.','침수 학교 옥상의 꽃에 물을 주고 이름표를 닦았다.',{altruism:1},{tags:['flower_watered'],meters:{community:1}})),record:C('꽃과 이름표를 기록한다','전력 −3','record_names',3,O('남아 있는 이름들','모든 이름을 하나씩 기록했다. 꽃이 사라져도 누가 이곳을 돌봤는지는 남을 것이다.','옥상 화분을 돌보던 학생들의 이름을 기록했다.',{caution:1},{tags:['student_names'],meters:{truth:1}}))
}));
add(E('ferry_platform',9,'ambient','도착하지 않는 배','옛 여객선 승강장',['전자 표지판은 없는 배의 도착을 계속 안내했다. 대합실 의자 아래에서 방수 공구함이 발견됐다.'],{
  tool:C('공구함을 회수한다','전력 −3','take_toolbox',3,O('잘 관리된 공구','공구는 기름칠된 천에 싸여 있었다. 누군가 다시 쓰기를 바라며 남긴 듯했다.','옛 승강장에서 응급 수리 공구를 회수했다.',{}, {rewards:{kit:1},tags:['toolbox_found']})),board:C('표지판 기록을 조사한다','전력 −3','read_departures',3,O('취소된 마지막 배','마지막 운항은 중계 신호 이상 때문에 취소돼 있었다. 신호는 사람들의 피난에도 영향을 주었다.','마지막 여객선이 중계 신호 이상으로 취소됐음을 확인했다.',{}, {tags:['evacuation_clue'],meters:{truth:2}}))
}));
add(E('repair_cradle',10,'ambient','빈 정비대','이동 정비로 · 4번 선로',['레일 위 정비대가 열린 채 멈춰 있었다. 자동 팔 하나는 아직 같은 나사를 조이려 움직였다.'],{
  stop:C('자동 팔을 멈추고 점검한다','전력 −3','stop_arm',3,O('끝난 작업','고장 난 작업 명령을 종료했다. 정비대 서랍에서 온전한 충전 셀 하나를 찾았다.','반복 작업 중인 정비대를 안전하게 정지했다.',{caution:1},{rewards:{cell:1},tags:['loop_stopped']})),finish:C('자동 팔의 마지막 작업을 완성한다','전력 −4','finish_repair',4,O('기다리던 부품','마지막 나사를 조이자 정비대가 완료음을 냈다. 수리 대상은 오래전에 사라졌지만 작업은 마침내 끝났다.','오랫동안 반복되던 정비대의 마지막 작업을 완료했다.',{courage:1},{tags:['old_task_complete'],meters:{community:1}}))
}));
add(E('cable_forest',11,'ambient','케이블 숲','송전탑 군락',['늘어진 송전 케이블이 바람에 부딪혀 낮은 현악기 같은 소리를 냈다. 한 선로는 여전히 무전탑과 연결돼 있었다.'],{
  connect:C('남은 선로를 우회 연결한다','전력 −5','reroute_cable',5,O('멀리 켜진 불','우회 회로가 닫히자 수평선의 무전탑에 작은 불이 들어왔다.','끊긴 송전선을 우회해 무전탑에 전력을 보냈다.',{caution:2},{tags:['tower_powered'],flags:['tower_power'],meters:{community:1}})),sample:C('케이블의 진동을 기록한다','전력 −3','sample_hum',3,O('신호의 밑바닥','바람 소리 아래 중계 신호와 같은 주파수가 숨어 있었다. 신호는 전력망까지 타고 흐른다.','송전 케이블에서 중계 신호와 같은 주파수를 확인했다.',{}, {tags:['grid_signal'],meters:{truth:2}}))
}));
add(E('pressure_lock',12,'ambient','녹슨 압력실','해저 시설 진입로',['이중문 사이 압력실에 물이 반쯤 찼다. 벽 보관함에는 사용 기한이 지난 방수제가 남아 있었다.'],{
  test:C('압력실을 천천히 시험한다','전력 −4','test_lock',4,O('버티는 문','세 번의 압력 시험 끝에 안전 범위를 확인했다. 낡았지만 아직 한 번은 통과할 수 있다.','해저 시설 압력실의 안전 범위를 확인했다.',{caution:2},{tags:['lock_tested'],flags:['lock_ready']})),salvage:C('방수제를 회수한다','전력 −3','take_sealant',3,O('굳지 않은 한 통','여러 통 중 하나는 밀봉이 살아 있었다. 깊은 물에 들어갈 때 쓸 수 있다.','압력실에서 사용 가능한 방수제를 회수했다.',{}, {rewards:{sealant:1},tags:['sealant_found']}))
}));
add(E('silent_beach',13,'ambient','소리가 사라지는 해변','중계시설 외곽',['검은 모래 해변에 들어서자 무전 잡음이 완전히 사라졌다. 모래 아래 차폐 금속판이 넓게 깔려 있었다.'],{
  uncover:C('차폐판 일부를 드러낸다','전력 −4','uncover_shield',4,O('가려진 통로','모래를 걷자 중계시설로 이어지는 점검 통로가 나타났다. 누군가 신호를 막기 위해 묻은 구조였다.','차폐판 아래에서 중계시설 점검 통로를 발견했다.',{courage:1},{tags:['hidden_passage'],flags:['hidden_passage'],meters:{truth:1}})),rest:C('침묵 속에서 시스템을 안정시킨다','전력 −1','quiet_calibration',1,O('오랜만의 고요','신호가 닿지 않는 곳에서 내부 잡음이 잦아들었다. 생각이 자신의 속도로 돌아왔다.','차폐된 해변에서 시스템을 안정시켰다.',{}, {stability:8,tags:['quiet_rest']}))
}));
add(E('dawn_buoy',14,'ambient','마지막 아침의 부표','해저 중계시설 상부',['새벽빛 아래 부표 하나가 열네 번 짧게 깜빡였다. 지난날 모은 기록들이 응답하듯 단말 안에서 차례로 켜졌다.'],{
  answer:C('거점의 호출 부호로 응답한다','전력 −2','answer_home',2,O('돌아갈 곳의 이름','부표가 방파제의 호출 부호를 받아 중계시설로 보냈다. 뒤에는 돌아갈 곳이 있었다.','중계시설에 방파제 거점의 호출 부호를 보냈다.',{}, {tags:['home_signal'],meters:{community:2}})),listen:C('응답하지 않고 전체 신호를 듣는다','전력 −2','listen_final',2,O('겹쳐진 목소리','수백 개의 오래된 호출 사이에 지금 살아 있는 거점들의 신호가 섞여 있었다. 과거와 현재가 같은 파도에 실렸다.','마지막 부표에서 과거와 현재의 호출을 함께 들었다.',{}, {tags:['full_signal'],meters:{truth:2}}))
}));

add(E('salt_market',2,'main','소금 시장의 꺼진 불','방파제 동쪽 · 소금 시장',['거점의 교환 시장이 정전됐다. 냉각고 안에는 공동체가 나눌 배터리와 의약품이 보관돼 있다. 낡은 분배기는 한 구역만 우선 살릴 수 있다.'],{
  medicine:C('의약품 냉각고를 우선 복구한다','전력 −7','save_medicine',7,O('차가운 숨','의약품 냉각고가 먼저 살아났다. 시장의 불은 어두웠지만 치료용 소재는 지킬 수 있었다.','소금 시장의 의약품 냉각고를 우선 복구했다.',{altruism:2},{tags:['medicine_saved'],flags:['medicine_saved'],meters:{community:2}}),autonomy([{trait:'altruism',direction:'low',weight:30}],{self:15},'split')),battery:C('공용 배터리 창고를 우선 복구한다','전력 −7','save_batteries',7,O('다시 켜진 작업등','공용 셀이 충전을 시작했다. 다음 탐사를 버틸 전력이 거점에 남았다.','소금 시장의 공용 배터리를 우선 복구했다.',{caution:1},{rewards:{cell:1},tags:['batteries_saved'],flags:['batteries_saved'],meters:{community:1}})),split:C('출력을 나누어 둘 다 버티게 한다','전력 −9','split_power',9,O('절반의 빛 두 개','완전한 복구는 아니었지만 두 냉각고 모두 아침까지 버틸 수 있게 됐다.','전력을 나누어 의약품과 배터리를 모두 지켰다.',{caution:2},{tags:['market_balanced'],flags:['medicine_saved','batteries_saved'],meters:{community:2,truth:1}}))
},{refusalText:'한쪽을 포기하는 계산이 끝났지만 손은 분배 스위치 위에서 멈췄다.',alternativeText:'출력을 나누면 완전하지 않아도 둘 다 지킬 수 있다.'}));
add(E('tide_observatory',3,'main','바다의 높이를 세는 기체','북부 조위 관측소',['관측원 미라는 붕괴한 탑의 계단에 앉아 있었다. 예보 장치는 폭풍 경로와 정체불명의 신호를 같은 방향으로 표시했다.'],{
  evacuate:C('미라를 거점으로 데려간다','전력 −7','evacuate_mira',7,O('둘이 내려온 계단','미라는 마지막 수위 값을 기록한 뒤 함께 탑을 내려왔다.','관측원 미라를 방파제 거점으로 데려왔다.',{altruism:2},{discoveries:['mira'],flags:['mira_home'],tags:['mira_evacuated'],meters:{community:2}}),autonomy([{trait:'wariness',direction:'high',weight:28}],{},'copy')),copy:C('예보 자료를 복사하고 철수를 돕는다','전력 −6','copy_forecast',6,O('폭풍보다 먼저 온 기록','자료를 확보한 뒤 미라에게 안전한 하강로를 표시했다. 미라는 다음 조위 측정 후 합류하겠다고 했다.','미라의 폭풍 예보를 확보하고 철수로를 마련했다.',{caution:2},{discoveries:['mira'],flags:['forecast_secured'],tags:['forecast_copied'],meters:{truth:2,community:1}})),tower:C('관측탑을 보강한다','전력 −8','reinforce_tower',8,O('한 번 더 버틸 탑','지지대를 묶자 탑의 흔들림이 잦아들었다. 미라는 이곳에서 폭풍을 끝까지 관측하기로 했다.','미라와 함께 관측탑을 보강했다.',{courage:2},{discoveries:['mira'],flags:['tower_reinforced'],tags:['tower_saved'],meters:{truth:1}}))
},{refusalText:'낯선 기체에게 등을 보이고 함께 내려가는 장면을 떠올리자 경계 회로가 켜졌다.',alternativeText:'자료를 복사하고 안전한 길만 알려 줄 수는 있다.'}));
add(E('memory_buoy',4,'main','기억을 건지는 부표','옛 주거 돔 앞바다',['기억 부표가 수면 아래에서 오래된 음성 기록을 반복했다. 신호를 해독하려면 한 사람의 사적인 기록까지 함께 열어야 한다.'],{
  open:C('기록 전체를 열어 신호를 해독한다','전력 −6','open_memory',6,O('타인의 마지막 밤','사적인 작별 인사 사이에 중계시설 접근 코드가 숨어 있었다. 기록을 닫은 뒤 이름만 따로 남겼다.','기억 부표의 전체 기록을 열어 중계시설 접근 코드를 찾았다.',{caution:1},{flags:['relay_code'],tags:['memory_opened'],meters:{truth:2}}),autonomy([{trait:'altruism',direction:'high',weight:20}],{freedom:25},'partial')),partial:C('공개 기록만 분석한다','전력 −7','filter_memory',7,O('지워진 문장 사이','내용을 가린 채 신호 구조만 비교했다. 시간은 더 걸렸지만 접근 코드의 절반을 복원했다.','사적인 내용을 열지 않고 접근 코드 일부를 복원했다.',{caution:2},{flags:['relay_code_partial'],tags:['privacy_kept'],meters:{truth:1,community:1}})),return:C('부표를 유족 기록소로 보낸다','전력 −5','return_buoy',5,O('주인을 찾아가는 기억','부표의 좌표를 기록소에 전송했다. 신호 해독은 미뤘지만 기억은 제자리로 돌아갈 것이다.','기억 부표를 유족 기록소에 인계했다.',{altruism:2},{tags:['memory_returned'],meters:{community:2}}))
},{refusalText:'잠금이 풀렸지만 타인의 목소리를 끝까지 재생하라는 명령을 받아들일 수 없었다.',alternativeText:'내용을 가린 채 신호 구조만 분석할 수 있다.'}));
add(E('scrap_hunter',5,'main','고철 해안의 거래','고철 해안 · 중앙 야적장',['수집가 노엘은 중계 신호에 반응하는 코어 외피를 내밀었다. 대가로 제7창고의 구조 신호 기록이나 거점의 전력 배치도를 요구했다.'],{
  record:C('구조 기록 일부를 익명화해 교환한다','전력 −5','trade_record',5,O('서로 남긴 흔적','개인 식별 정보를 지운 기록과 코어 외피를 바꿨다. 노엘은 거래보다 기록 방식에 더 관심을 보였다.','익명화한 구조 기록으로 신호 반응 코어 외피를 얻었다.',{caution:2},{discoveries:['noel'],flags:['signal_shell'],tags:['fair_trade'],meters:{truth:1,community:1}})),refuse:C('정보 거래를 거절하고 직접 조사한다','전력 −7','independent_search',7,O('모래 아래의 같은 합금','오랜 수색 끝에 같은 합금 조각을 찾았다. 노엘은 웃으며 발견 위치를 도감에 표시해 주었다.','거래를 거절하고 직접 신호 반응 합금을 찾았다.',{courage:2},{discoveries:['noel'],flags:['signal_shell'],tags:['independent_find'],meters:{truth:1}})),trust:C('거점 배치도를 맡기고 더 많은 정보를 얻는다','전력 −4','trust_noel',4,O('넓어진 지도','노엘은 약속대로 해저 시설의 옛 보급로까지 표시해 주었다. 배치도를 건넨 선택은 오래 기억에 남았다.','노엘에게 거점 배치도를 맡기고 해저 보급로를 얻었다.',{sociability:2,wariness:-2},{discoveries:['noel'],flags:['supply_route'],tags:['trusted_noel'],meters:{community:1,truth:2}}),autonomy([{trait:'wariness',direction:'high',weight:40}],{self:20},'record'))
},{refusalText:'거점의 배치도를 전송하려는 순간 보안 규칙이 손을 붙잡았다.',alternativeText:'개인 정보를 지운 구조 기록이라면 공정하게 교환할 수 있다.'}));
add(E('storm_shelter',6,'main','폭풍 속의 문','서부 제방 · 비상 대피소',['폭풍이 제방을 때렸다. 대피소 문 앞에는 외부 기체 셋이 서 있었고, 내부 전력은 모두를 밤새 유지하기에 빠듯했다.'],{
  open:C('문을 열고 모두 받아들인다','전력 −8','open_shelter',8,O('좁아진 자리, 늘어난 온기','충전 주기를 나누자 누구도 완전히 쉬지는 못했지만 모두 폭풍을 넘겼다.','외부 기체들을 대피소에 받아들여 함께 폭풍을 넘겼다.',{altruism:3},{flags:['refugees_safe'],tags:['shelter_open'],meters:{community:3}}),autonomy([{trait:'wariness',direction:'high',weight:30}],{self:20},'share')),share:C('비상 셀을 나누고 옆 정비고를 연다','전력 −6','share_annex',6,O('두 개의 대피소','옆 정비고를 임시 대피소로 바꾸고 전력을 나눴다. 문은 달랐지만 무전은 밤새 이어졌다.','정비고를 열어 외부 기체들과 전력을 나눴다.',{caution:2},{flags:['refugees_safe'],tags:['shelter_annex'],meters:{community:2}})),seal:C('현재 인원만 보호하고 문을 봉쇄한다','전력 −4','seal_shelter',4,O('문 너머의 폭풍','대피소 전력은 안정됐다. 외부 기체들은 다른 곳을 찾아 떠났고, 무전 신호는 곧 폭풍에 묻혔다.','대피소를 봉쇄해 현재 인원의 안전을 확보했다.',{caution:2},{tags:['shelter_sealed'],meters:{isolation:2}}))
},{refusalText:'낯선 기체들을 들이는 순간 대피소 전체가 멈출 가능성이 계산을 가득 채웠다.',alternativeText:'옆 정비고를 열고 비상 전력을 나눌 수 있다.'}));
add(E('midpoint_broadcast',7,'main','일곱 번째 날의 방송','공동 무전탑',['주파수 관리인 솔이 열어 둔 채널로 같은 문장이 흘렀다. “귀환 절차를 개시하라.” 중계 신호는 거점마다 다른 오래된 명령을 깨우고 있었다.'],{
  warn:C('모든 거점에 위험을 공개한다','전력 −6','broadcast_warning',6,O('여러 목소리의 응답','경고 방송 뒤 각 거점에서 짧은 응답이 돌아왔다. 혼란도 있었지만 누구도 혼자 신호를 맞지 않게 됐다.','중계 신호의 위험을 모든 거점에 공개했다.',{sociability:2},{discoveries:['sol'],flags:['public_warning'],tags:['warning_broadcast'],meters:{community:2,truth:2}})),study:C('좁은 채널에서 신호를 더 분석한다','전력 −7','study_signal',7,O('명령 아래의 구조 요청','솔과 신호를 분리하자 명령층 아래에서 반복되는 구조 요청이 드러났다. 누군가 돌아오기를 기다리고 있다.','솔과 함께 신호에서 숨겨진 구조 요청을 발견했다.',{caution:2},{discoveries:['sol'],flags:['hidden_plea'],tags:['signal_analyzed'],meters:{truth:3}})),jam:C('당장 신호를 방해한다','전력 −8','jam_signal',8,O('하루 동안의 침묵','방해파가 퍼지자 오래된 명령은 멎었다. 동시에 멀리서 오던 구조 요청도 들리지 않게 됐다.','중계 신호를 하루 동안 차단했다.',{courage:2},{discoveries:['sol'],flags:['signal_jammed'],tags:['signal_silenced'],meters:{isolation:1}}),autonomy([{trait:'caution',direction:'high',weight:30}],{truth:25},'study'))
},{refusalText:'신호 전체를 끊으려는 순간 그 안의 희미한 구조 요청까지 함께 사라질 것이 느껴졌다.',alternativeText:'좁은 채널에 가두고 구조 요청의 정체를 먼저 살필 수 있다.'}));
add(E('submerged_school',8,'main','아직 끝나지 않은 수업','침수 학교 · 기록실',['기록 보관기 이로는 빈 교실에서 출석을 부르고 있었다. 학생들의 목소리를 중계망으로 보내면 기록은 보존되지만 오래된 명령도 함께 확산될 수 있다.'],{
  isolate:C('명령층을 분리해 기록만 옮긴다','전력 −8','isolate_archive',8,O('이름만 건너간 밤','위험한 명령을 잘라 낸 뒤 학생들의 이름과 목소리를 거점 기록소로 보냈다. 이로가 처음으로 출석 확인을 멈췄다.','이로의 학생 기록에서 명령층을 분리해 안전하게 보존했다.',{caution:3},{discoveries:['iro'],flags:['school_archive'],tags:['archive_saved'],meters:{community:2,truth:2}})),carry:C('이로와 저장 장치를 직접 데려간다','전력 −9','carry_iro',9,O('빈 교실을 나온 기록기','저장 장치를 분리해 이로와 함께 학교를 나왔다. 기록은 느리지만 안전하게 이동할 것이다.','이로와 학생 기록을 방파제 거점으로 옮겼다.',{altruism:2},{discoveries:['iro'],flags:['iro_home'],tags:['iro_rescued'],meters:{community:3}}),autonomy([{trait:'courage',direction:'low',weight:28}],{self:15},'isolate')),transmit:C('전체 기록을 즉시 송신한다','전력 −6','transmit_archive',6,O('바다를 건넌 출석부','모든 기록이 순식간에 퍼졌다. 곳곳에서 학생들의 노래와 함께 오래된 명령 잡음도 깨어났다.','이로의 전체 기록을 중계망에 송신했다.',{impulsivity:2},{discoveries:['iro'],flags:['archive_broadcast'],tags:['archive_unfiltered'],meters:{truth:2,signal:2}}))
},{refusalText:'무너지는 학교 안으로 이로와 저장 장치를 모두 데리러 가려 했지만, 붕괴 계산이 발을 묶었다.',alternativeText:'명령층을 분리하면 이 자리에서도 기록을 먼저 지킬 수 있다.'}));
add(E('collapsed_tunnel',9,'main','두 갈래의 어두운 길','해저 터널 · 3번 접속부',['중계시설로 가는 옛 터널이 갈라졌다. 짧은 길에는 붕괴 위험이, 긴 길에는 신호 간섭이 짙었다. 뒤쪽에서는 다른 탐사대의 조난 신호가 들렸다.'],{
  rescue:C('경로를 벗어나 탐사대를 찾는다','전력 −9','find_team',9,O('되돌아온 세 개의 불빛','잔해 뒤에서 탐사대 둘을 찾았다. 함께 돌아 나오며 그들이 확보한 시설 지도를 공유받았다.','조난 탐사대를 찾아 구조하고 중계시설 지도를 공유받았다.',{altruism:3},{flags:['team_saved','relay_map'],tags:['team_rescue'],meters:{community:3}}),autonomy([{trait:'courage',direction:'low',weight:32}],{self:15},'signal')),short:C('붕괴 위험을 감수하고 짧은 길을 지난다','전력 −7','short_route',7,O('갈라진 외피','낙석에 외피가 긁혔지만 시설 입구 좌표를 빠르게 확보했다. 조난 신호는 뒤에 남았다.','위험한 지름길로 중계시설 입구를 찾았다.',{courage:2,integrity:-12},{flags:['relay_entrance'],tags:['risky_shortcut'],meters:{truth:1,isolation:1}})),signal:C('안전한 곳에서 조난 좌표를 중계한다','전력 −6','relay_rescue',6,O('이어진 구조망','거점과 탐사대 사이에 중계선을 만들었다. 직접 닿지는 못했지만 구조대가 움직이기 시작했다.','조난 좌표를 중계해 구조대를 연결했다.',{caution:2},{flags:['team_rescue_sent'],tags:['rescue_relay'],meters:{community:2}}))
},{refusalText:'무너지는 터널 안으로 방향을 돌리려 했지만 손상 예측이 한계치를 넘었다.',alternativeText:'안전한 곳에서 신호를 증폭해 구조대를 부를 수 있다.'}));
add(E('mobile_dock',10,'main','바퀴 달린 정비소','옛 화물 철로',['이동 정비소의 벨이 파손된 기체 둘을 돌보고 있었다. 수리 부품은 하나뿐이고, 중계시설 접근에 필요한 압력 조절기도 같은 부품을 요구했다.'],{
  patients:C('부품을 다친 기체들에게 양보한다','전력 −5','repair_patients',5,O('다시 선 두 기체','벨은 두 기체의 부품을 번갈아 재가공했다. 압력 조절기는 포기했지만 둘은 스스로 걸어 나왔다.','중계시설용 부품을 양보해 파손 기체들을 수리했다.',{altruism:3},{discoveries:['bell'],flags:['patients_saved'],tags:['part_donated'],meters:{community:3}}),autonomy([{trait:'altruism',direction:'low',weight:25}],{truth:20},'improvise')),regulator:C('압력 조절기를 완성한다','전력 −5','build_regulator',5,O('심해로 가는 부품','조절기가 완성됐다. 벨은 다친 기체들을 임시 고정한 채 다른 부품을 기다리기로 했다.','부품으로 해저 시설용 압력 조절기를 완성했다.',{caution:2},{discoveries:['bell'],flags:['pressure_regulator'],tags:['regulator_built'],meters:{truth:2}})),improvise:C('고철을 덧대 둘 다 임시 수리한다','전력 −8','improvise_parts',8,O('서로 다른 두 개의 임시 부품','벨과 밤늦게까지 고철을 깎았다. 완벽하지 않지만 기체들도 움직이고 조절기도 한 번은 쓸 수 있다.','벨과 임시 부품을 만들어 기체와 압력 조절기를 모두 살렸다.',{caution:2,courage:1},{discoveries:['bell'],flags:['patients_saved','pressure_regulator'],tags:['improvised_parts'],meters:{community:2,truth:1}}))
},{refusalText:'부품 하나를 다친 기체와 임무 사이에서 고르려니 어느 쪽에도 손이 가지 않았다.',alternativeText:'시간과 전력을 더 쓰면 고철로 임시 부품을 만들 수 있다.'}));
add(E('radio_tower',11,'main','목소리가 모이는 탑','외해 무전탑',['무전탑이 살아나자 각 거점의 요청이 한꺼번에 쏟아졌다. 솔은 한정된 출력으로 구조망, 신호 분석망, 방해망 중 하나를 강화해야 한다고 말했다.'],{
  rescue:C('구조망을 우선한다','전력 −7','boost_rescue',7,O('서로를 찾는 목소리','흩어진 구조 요청들이 가까운 거점으로 연결됐다. 중계시설 분석은 늦어졌지만 오늘 밤 여러 불빛이 돌아왔다.','무전탑 출력을 구조망에 배정했다.',{altruism:2},{flags:['rescue_network'],tags:['network_rescue'],meters:{community:3}})),analyze:C('신호 분석망을 우선한다','전력 −7','boost_analysis',7,O('드러난 발신지','잡음을 겹쳐 지우자 발신지는 해저 중계시설 중앙실로 좁혀졌다. “귀환”은 시설 자체가 보내는 요청이었다.','무전탑으로 신호 발신지를 중앙실까지 좁혔다.',{caution:2},{flags:['source_found'],tags:['source_located'],meters:{truth:3}})),jam:C('방해망을 강화한다','전력 −7','boost_jam',7,O('고요해진 거점들','거점들의 강제 명령 증상이 멎었다. 대신 시설과의 통신도 끊겨 안쪽 상황은 알 수 없게 됐다.','무전탑으로 중계 신호를 강하게 차단했다.',{courage:1},{flags:['strong_jam'],tags:['network_jammed'],meters:{isolation:2}}),autonomy([{trait:'caution',direction:'high',weight:22}],{truth:20},'analyze'))
},{refusalText:'모든 신호를 지우는 스위치 위에서 손이 멈췄다. 위험한 명령과 구조 요청은 같은 선을 쓰고 있었다.',alternativeText:'신호를 차단하기 전에 발신지를 중앙실까지 좁힐 수 있다.'}));
add(E('pressure_gate',12,'main','심해로 향하는 문','해저 중계시설 · 압력문',['압력문 앞에서 작업 기체 아샤가 기다리고 있었다. 문을 열면 오래된 명령이 거점까지 강해질 수 있다. 닫아 두면 시설의 진상도 안쪽 기체들도 영영 확인할 수 없다.'],{
  together:C('아샤와 함께 압력문을 연다','전력 −9','open_gate',9,O('깊은 물의 동행','두 기체가 동시에 수동 레버를 당겼다. 문 너머로 푸른 비상등이 길게 켜졌다.','아샤와 함께 해저 중계시설의 압력문을 열었다.',{courage:3},{discoveries:['asha'],flags:['gate_open'],tags:['gate_opened'],meters:{community:1,truth:2}}),autonomy([{trait:'courage',direction:'low',weight:35}],{self:25},'drone')),drone:C('드론으로 안쪽 안전장치를 해제한다','전력 −7','drone_gate',7,O('작은 기체가 연 문','드론이 좁은 배관을 지나 잠금 장치를 풀었다. 아샤는 직접 들어가지 않아도 되는 길을 기억해 두었다.','드론으로 압력문 안전장치를 해제했다.',{caution:3},{discoveries:['asha'],flags:['gate_open'],tags:['gate_remote'],meters:{truth:2}})),seal:C('문을 봉인하고 외부 단자만 조사한다','전력 −5','seal_gate',5,O('닫힌 문에 남긴 표식','문은 닫힌 채 유지됐다. 외부 단자에서 중앙실의 상태 자료 일부를 확보했다.','압력문을 봉인하고 외부에서 시설 자료를 확보했다.',{caution:2},{discoveries:['asha'],flags:['gate_sealed'],tags:['gate_closed'],meters:{truth:1,isolation:1}}))
},{refusalText:'심해 압력이 외피를 누르는 순간 문 안으로 들어가라는 판단을 몸이 거부했다.',alternativeText:'드론을 배관으로 보내 안쪽 안전장치부터 풀 수 있다.'}));
add(E('relay_approach',13,'main','신호의 심장 앞에서','해저 중계시설 · 내부 회랑',['중앙실 앞 회랑에는 멈춘 기체들이 줄지어 서 있었다. “귀환” 명령을 따라온 기체들이다. 일부 코어는 아직 미약하게 살아 있었다.'],{
  wake:C('한 기체씩 명령 연결을 끊는다','전력 −10','wake_units',10,O('하나씩 돌아온 눈빛','연결을 끊을 때마다 서로 다른 눈빛이 켜졌다. 누구도 같은 이유로 이곳에 온 것은 아니었다.','중앙실 앞 기체들의 명령 연결을 하나씩 해제했다.',{altruism:3,caution:2},{flags:['units_awake'],tags:['units_freed'],meters:{community:3}}),autonomy([{trait:'caution',direction:'low',weight:18}],{},'map')),map:C('연결 구조를 기록해 원격 해제법을 찾는다','전력 −8','map_links',8,O('명령의 지도','모든 연결을 끊지는 못했지만 원격 해제 절차를 만들었다. 거점으로 보내면 구조대가 이어서 작업할 수 있다.','명령 연결 구조를 기록해 원격 해제 절차를 만들었다.',{caution:3},{flags:['release_protocol'],tags:['links_mapped'],meters:{truth:2,community:1}})),pass:C('기체들을 지나 중앙실로 향한다','전력 −5','pass_units',5,O('등 뒤의 미약한 불','중앙실 문은 빠르게 열렸다. 뒤에 남은 기체들의 표시등이 느린 파도처럼 깜빡였다.','멈춘 기체들을 남겨 두고 중앙실로 향했다.',{courage:1},{flags:['central_reached'],tags:['units_left'],meters:{isolation:2}}))
},{refusalText:'수십 개의 코어에 동시에 손을 대려 하자 과부하 경고가 시야를 가렸다.',alternativeText:'연결 구조를 기록하면 구조대와 나누어 해제할 수 있다.'}));
add(E('relay_core',14,'main','귀환 신호의 끝','해저 중계시설 · 중앙실',['중앙 장치는 인류가 떠난 뒤에도 대피선의 귀환을 기다리고 있었다. 돌아올 사람이 없자 호환 기체들을 승무원으로 오인해 계속 불러들였다. 이제 신호의 항로를 결정해야 한다.'],{
  home:C('신호를 현존 거점들의 구조망으로 바꾼다','전력 −10','redirect_home',10,O('돌아갈 곳을 만드는 신호','“귀환”의 목적지를 살아 있는 거점들로 다시 썼다. 바다 위에서 응답 불빛이 하나씩 이어졌다.','귀환 신호를 현존 거점들의 구조망으로 전환했다.',{altruism:3},{flags:['ending_home'],tags:['signal_redirected'],meters:{community:4}}),autonomy([{trait:'wariness',direction:'high',weight:25}],{self:15},'archive')),archive:C('명령을 멈추고 모든 기록을 공개한다','전력 −9','open_archive',9,O('누구의 명령도 아닌 기록','강제 호출을 정지하고 시설의 역사와 실패를 공개망에 풀었다. 이제 각 거점이 스스로 다음 항로를 고를 것이다.','귀환 명령을 멈추고 중계시설의 기록을 공개했다.',{caution:2},{flags:['ending_archive'],tags:['archive_opened'],meters:{truth:4,community:1}})),silence:C('중앙 장치를 완전히 정지한다','전력 −7','silence_core',7,O('마침내 찾아온 침묵','마지막 송신등이 꺼졌다. 누구도 다시 이 명령에 끌려오지 않을 것이다. 깊은 바다에는 오래된 기계음 대신 물소리만 남았다.','귀환 신호와 중앙 장치를 완전히 정지했다.',{courage:3},{flags:['ending_silence'],tags:['core_silenced'],meters:{isolation:2,truth:1}}))
},{refusalText:'모든 거점의 목적지를 한 번에 다시 쓰려 하자, 또 다른 명령자가 되는 감각에 손이 멈췄다.',alternativeText:'명령을 멈추고 기록만 공개하면 각 거점이 스스로 선택할 수 있다.'}));


/* 선택 가능한 곁가지 사건. requiresFlags는 실제 플레이 기록으로만 해금한다. */
add(E('dry_dock',1,'ambient','물 밖에 남은 정비대','방파제 · 옛 조선소',['뒤집힌 선박 옆에 수동 정비대가 남아 있었다. 빈 작업대 아래엔 아직 온전한 방수제가 굴러다녔다. 누군가 필요한 만큼만 가져가라는 쪽지를 붙여 두었다.'],{
  take:C('방수제를 챙겨 탐사 장비를 보강한다','전력 −3','take_sealant',3,O('소금기를 막을 작은 준비','작업대의 방수제를 회수했다. 다음에 물속에 들어간다면 조금은 덜 위험할 것이다.','옛 조선소에서 방수제를 챙겼다.',{caution:1},{rewards:{sealant:1},tags:['prepared_for_water'],flags:['prepared_for_water']})),
  restore:C('정비대의 고장 난 전원을 잇는다','전력 −4','restore_dock',4,O('다시 켜진 작업등','녹슨 단자를 청소하자 작업등이 켜졌다. 남은 전력을 셀 하나로 옮겨 담았다.','조선소 정비대를 재가동하고 충전 셀을 얻었다.',{caution:1},{rewards:{cell:1},tags:['dock_restored'],flags:['dock_restored']}))
}));
add(E('silent_terminal',1,'ambient','응답 없는 안내 단말','침수 상가 · 안내 센터',['바닷물 위로 남은 안내 단말이 여전히 옛 주민들의 귀가 경로를 표시하고 있다. 화면 구석에 최근 접속 흔적이 한 번 남았다.'],{
  search:C('최근 접속 기록을 확인한다','전력 −3','trace_terminal',3,O('다른 누군가의 발자국','기록에는 며칠 전 방파제 거점에서 접속한 기체의 흔적이 있었다. 이 도시는 완전히 비어 있지 않았다.','안내 단말에서 다른 기체의 최근 접속 흔적을 확인했다.',{caution:1},{flags:['terminal_trace'],tags:['terminal_trace'],meters:{truth:1}})),
  fix:C('옛 안내 지도를 복구한다','전력 −5','repair_terminal',5,O('돌아갈 길','안내 단말에 새 방파제 좌표를 입력했다. 이제 다른 탐사자도 안전한 귀환로를 찾을 수 있다.','안내 단말에 방파제의 귀환로를 복구했다.',{altruism:1},{flags:['wayfinding_restored'],tags:['wayfinding_restored'],meters:{community:1}}))
}));
add(E('flooded_stair',1,'ambient','바다로 이어진 계단','구시가지 · 침수 지하도',['지하도의 계단은 절반이 물에 잠겨 있었다. 난간에는 최근에 묶인 새 밧줄이 있었고, 아래쪽에서 작은 표시등이 간헐적으로 켜졌다.'],{
  mark:C('안전한 계단과 물때를 기록한다','전력 −3','map_stair',3,O('다시 올 수 있는 길','물때와 난간의 흔들리는 부분을 표시했다. 작은 표시등까지 안전하게 접근할 수 있는 길이 남았다.','침수 지하도로 돌아올 수 있도록 안전한 길을 기록했다.',{caution:2},{flags:['stair_mapped'],tags:['stair_mapped'],meters:{truth:1}})),
  retrieve:C('표시등을 회수해 정비한다','전력 −6','retrieve_light',6,O('주인을 기다리는 비상등','비상등 안에서 오래된 구조 호출 좌표를 발견했다. 지금 당장 신호를 따라가지는 못하지만 위치는 저장해 두었다.','침수 지하도에서 낡은 구조 호출 좌표를 확보했다.',{courage:1},{flags:['stair_signal'],tags:['stair_signal'],meters:{truth:1}}))
}));
add(E('ryu_return',2,'ambient','창고에서 온 작은 손님','방파제 · 옛 화물선',['제7창고의 구조 신호를 보낸 류가 거점에 도착했다. 오래된 화물표와 작은 부품 봉지를 내밀며 자신의 행방을 확인해 줘서 고맙다고 말한다.'],{
  listen:C('류가 보관한 화물표의 기록을 듣는다','전력 −3','listen_ryu',3,O('함께 찾은 우회 좌표','류는 폐허 안에서 보았던 마른 통로의 좌표를 알려 주었다. 그 길은 오래된 중계망 쪽으로 이어져 있었다.','구조한 류에게서 중계망의 우회 좌표를 들었다.',{sociability:2},{flags:['ryu_route'],tags:['ryu_route'],meters:{truth:2}})),
  repair:C('류의 낡은 관절을 정비한다','전력 −5','repair_ryu',5,O('다시 움직이는 관절','류의 관절을 고친 뒤 남은 부품으로 작은 수리 키트를 만들었다. 류는 조심스레 손을 굽혔다 펴 보았다.','류의 관절을 정비하고 수리 키트를 확보했다.',{altruism:2},{rewards:{kit:1},flags:['ryu_repaired'],tags:['ryu_repaired'],meters:{community:2}}))
},{requiresFlags:['ryu_safe']}));
add(E('pending_rescue',2,'ambient','끊기지 않은 창고 신호','침수 물류구역 · 제7창고',['어제 확인했던 구조 신호가 아직 잡힌다. 침수 수위가 낮아졌고, 거점의 구조대가 가까운 곳에서 대기 중이다.'],{
  dispatch:C('구조대와 함께 신호 위치를 다시 조사한다','전력 −6','rescue_with_team',6,O('늦지 않은 구조','구조대와 잔해를 들어 올리자 류가 움직였다. 류는 예비 전원을 연결받고 거점으로 향했다.','구조대와 다시 창고를 방문해 류를 구조했다.',{altruism:2},{flags:['ryu_safe','ryu_rescued_later'],discoveries:['ryu'],tags:['late_rescue'],meters:{community:2}})),
  transmit:C('정확한 위치와 침수 지도를 전송한다','전력 −3','transmit_rescue',3,O('도착한 구조 확인','좌표와 수위 지도를 보낸 뒤 구조대의 회신을 받았다. 류는 구조대의 도움으로 거점에 도착했다.','구조대에 위치와 수위 정보를 보내 류의 구조를 도왔다.',{caution:2},{flags:['ryu_safe','ryu_rescued_later'],discoveries:['ryu'],tags:['late_rescue'],meters:{community:1}}))
},{requiresFlags:['rescue_pending'],excludesFlags:['ryu_safe']}));
add(E('market_afterglow',3,'ambient','시장에 다시 켜진 불','방파제 동쪽 · 소금 시장',['지난 정전 때 남겨 둔 배선이 아직 따뜻했다. 시장의 관리 기체가 이번에는 전력 배분을 스스로 점검할 수 있게 도와달라고 부탁한다.'],{
  teach:C('분배 장치 사용법을 함께 연습한다','전력 −4','teach_grid',4,O('누군가 남긴 사용법','관리 기체는 재설정 방법을 직접 수행한 뒤 감사 인사를 전했다. 다음 정전에는 혼자서도 대응할 수 있을 것이다.','소금 시장 관리 기체에게 전력 분배기 수리 방법을 알려주었다.',{sociability:2},{flags:['market_independent'],tags:['market_independent'],meters:{community:2}})),
  copy:C('배전 기록에서 이상 신호를 분석한다','전력 −4','read_grid',4,O('정전의 또 다른 흔적','정전 시각에 중계 신호와 같은 간격의 잡음이 발생했다. 기록을 복사해 거점으로 가져왔다.','소금 시장의 정전 기록에서 중계 신호와 같은 잡음을 확인했다.',{caution:2},{flags:['market_noise'],tags:['market_noise'],meters:{truth:2}}))
},{requiresAnyFlags:['medicine_saved','batteries_saved','market_balanced']}));
add(E('film_evening',8,'ambient','벽에 비친 옛 바다','방파제 · 공동 휴게소',['이전에 회수한 투사기 안에 오래된 풍경 영상이 남아 있었다. 거점 기체들이 잠시 일을 멈추고 빈 벽 앞에 모였다.'],{
  show:C('다른 기체들과 함께 영상을 본다','전력 −3','screen_film',3,O('서로 다른 감상','같은 바다 영상을 보고도 기체마다 기억하는 장면이 달랐다. 누군가는 무섭다고, 누군가는 아름답다고 말했다.','회수한 투사기로 거점 기체들과 옛 바다 영상을 보았다.',{sociability:2},{flags:['film_shared'],tags:['film_shared'],meters:{community:2}})),
  archive:C('영상의 날짜와 장소를 기록한다','전력 −3','archive_film',3,O('바다의 오래된 지도','촬영 날짜와 지형을 기록하자 수위가 달라진 구시가지의 모습이 드러났다. 옛 지도 한 장이 복구됐다.','옛 영상의 촬영 장소를 확인하고 구시가지의 지도를 복원했다.',{caution:2},{flags:['old_map'],tags:['old_map'],meters:{truth:2}}))
},{requiresFlags:['projector']}));
/* 앞선 준비와 조우가 실제 사건 해결 방식으로 돌아오도록 하는 선택지. */
const dry=events.warehouse_signal;
dry.choices.safe_entry=C('표시해 둔 마른 통로로 구조한다','안전한 길 발견 시 · 전력 −7','safe_rescue',7,null,{requiresFlags:['dry_route']});
dry.outcomes.safe_entry={id:'safe_entry',action:'safe_rescue',result:'success',title:'표시가 이어 준 구조',text:'아까 확인해 둔 마른 진입로를 따라 잔해 뒤편으로 들어갔다. 전선이 닿지 않는 곳에서 류를 찾아 부축했고, 둘은 표시해 둔 길로 무사히 돌아왔다.',fact:'이전에 발견한 마른 통로를 이용해 류를 구조했다.',effects:{caution:2,altruism:2},flags:['ryu_safe'],discoveries:['ryu'],tags:['rescued','prepared_rescue'],meters:{community:2}};
dry.tables.safe_entry=[{max:1,id:'safe_entry'}];
const market=events.salt_market;
market.choices.ryu_support=C('류에게 배선 지도를 받아 두 구역을 연결한다','류 구조 시 · 전력 −5','ryu_assist',5,null,{requiresFlags:['ryu_safe']});
market.outcomes.ryu_support={id:'ryu_support',action:'ryu_assist',result:'success',title:'함께 살린 두 구역',text:'류가 화물 운송로의 비상 배선을 안내했다. 우회 회로를 연결하자 약품과 공용 배터리가 나란히 살아났다. 혼자였다면 찾지 못할 길이었다.',fact:'앞서 구조한 류의 도움으로 소금 시장의 두 구역을 복구했다.',effects:{sociability:2},flags:['medicine_saved','batteries_saved','market_balanced'],tags:['ryu_assisted','market_balanced'],meters:{community:3}};
market.tables.ryu_support=[{max:1,id:'ryu_support'}];
const core=events.relay_core;
core.choices.network=C('축적한 해제 절차와 압력 조절기로 신호를 재설계한다','해제 절차·조절기 확보 시 · 전력 −8','distributed_network',8,null,{requiresFlags:['release_protocol','pressure_regulator']});
core.outcomes.network={id:'network',action:'distributed_network',result:'success',title:'누구도 강제로 부르지 않는 주파수',text:'그동안 모은 연결 해제 절차와 조절기를 결합했다. 귀환 명령은 자발적으로 호출한 거점에만 응답하는 중계망으로 바뀌었다. 중앙실의 불빛이 조용히 낮아졌다.',fact:'이전 탐사에서 마련한 부품과 해제 절차를 사용해 선택형 중계망을 구축했다.',effects:{caution:2},flags:['ending_network'],tags:['ending_network'],meters:{community:2,truth:2}};
core.tables.network=[{max:1,id:'network'}];

export const schedule={1:['tide_marks','warehouse_signal'],2:['solar_roof','salt_market'],3:['seabird_drone','tide_observatory'],4:['algae_garden','memory_buoy'],5:['wreck_field','scrap_hunter'],6:['storm_drain','storm_shelter'],7:['cinema_sign','midpoint_broadcast'],8:['school_greenhouse','submerged_school'],9:['ferry_platform','collapsed_tunnel'],10:['repair_cradle','mobile_dock'],11:['cable_forest','radio_tower'],12:['pressure_lock','pressure_gate'],13:['silent_beach','relay_approach'],14:['dawn_buoy','relay_core']};
export const actionNames=Object.fromEntries(Object.values(events).flatMap(e=>Object.values(e.choices).map(c=>[c.action,c.label])));
export const MAX_DAY=14;
