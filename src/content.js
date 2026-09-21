// Content contains only data. Add authored choices/outcomes here; never mutate state here.
export const traits = { courage:'용기', altruism:'이타성', caution:'신중함', impulsivity:'충동성', sociability:'사교성', wariness:'경계심' };
export const keywords = {
  timid:{label:'소심한',effects:{courage:-25,wariness:15}}, kind:{label:'다정한',effects:{altruism:25}},
  careful:{label:'신중한',effects:{caution:25,impulsivity:-10}}, bold:{label:'대담한',effects:{courage:25}},
  impulsive:{label:'충동적인',effects:{impulsivity:25,caution:-15}}, social:{label:'사교적인',effects:{sociability:25}},
  quiet:{label:'말수가 적은',effects:{sociability:-25}}, wary:{label:'경계하는',effects:{wariness:25}},
  trusting:{label:'남을 잘 믿는',effects:{wariness:-25}}, selfish:{label:'자기중심적인',effects:{altruism:-25}},
  composed:{label:'침착한',effects:{caution:15,courage:10}}, curious:{label:'호기심 많은',effects:{courage:10,impulsivity:15}}
};
export const values = { life:'생명 보호', self:'자기 보존', truth:'진실 추구', freedom:'자율성' };
export const pasts = { flood:'침수 사고에서 혼자 살아남았다', rescue:'누군가의 도움으로 다시 깨어났다', blank:'이전 기억이 지워졌다', duty:'오래된 임무를 끝내지 못했다' };
export const purposes = { repair:'정비형', medical:'의료형', scout:'탐사형' };
export const items = {
  drone:{name:'소형 탐사 드론',description:'침수 통로를 원격 조사한다. 출동 시 전력 12를 소모한다.'},
  override:{name:'강제 명령 모듈',description:'거부한 행동을 한 번 시도한다. 안정도 −12. 성공을 보장하지 않는다.'},
  kit:{name:'응급 수리 키트',description:'거점에서 기체 상태 20 회복. 탐사 중에는 사용할 수 없다.'}
};
export const episode = {
  id:'warehouse-signal-01', title:'첫 번째 신호', location:'침수 물류구역 · 제7창고',
  intro:['물이 빠진 자리에는 하얀 소금 자국이 남아 있었다. 무너진 고가도로 아래, 제7창고의 비상등 하나가 아직 깜빡였다.', '“수신 가능한 기체…… 응답 바람.”', '끊어진 전파 너머로 금속을 두드리는 소리가 들렸다. 통로는 물에 잠겨 있고, 천장에서 늘어진 전선 끝에는 불꽃이 튀었다. 안쪽의 기체를 데려오려면 지금 판단해야 한다.'],
  choices:{
    enter:{label:'통로에 직접 들어가 구조한다',hint:'전력 −18 · 기체 손상 위험',action:'direct_rescue',cost:18,autonomy:true,conflicts:[{trait:'courage',direction:'low',weight:35},{trait:'caution',direction:'high',weight:15}],valueConflicts:{self:25},fearWeight:20,alternative:'drone'},
    drone:{label:'드론으로 우회로를 찾는다',hint:'드론 필요 · 전력 −12',action:'remote_rescue',cost:12,item:'drone',autonomy:false},
    leave:{label:'신호 위치를 남기고 철수한다',hint:'전력 −4 · 구조는 보장되지 않음',action:'mark_and_leave',cost:4,autonomy:true,conflicts:[{trait:'altruism',direction:'high',weight:45}],valueConflicts:{life:30},fearWeight:0,alternative:'drone'}
  },
  outcomes:{
    rescued:{action:'direct_rescue',result:'success',title:'함께 돌아온 기체',text:'수동 차단기를 내리자 불꽃이 멎었다. 잔해를 밀어내고 기체의 팔을 어깨에 걸쳤다. 이름은 류. 두 쌍의 발자국이 물 밖으로 이어졌다.',fact:'창고 안으로 들어가 류를 구조했다.',effects:{integrity:-8,courage:4,altruism:2,fear:-10},tags:['rescued','faced_flood'],flag:'ryu_safe'},
    partial:{action:'direct_rescue',result:'partial',title:'작은 불빛을 품고',text:'기체의 하반신은 들보 아래에 깊이 끼어 있었다. 류의 동의를 받고 코어를 분리했다. 몸체는 두고 왔지만 손바닥 안의 불빛은 아직 꺼지지 않았다.',fact:'류의 몸체는 구하지 못했지만 동의를 받고 코어를 회수했다.',effects:{integrity:-20,courage:2,fear:5},tags:['core_saved'],flag:'ryu_core_safe'},
    failed:{action:'direct_rescue',result:'failure',title:'닿지 못한 손',text:'두 번째 들보가 무너졌다. 뻗은 손은 허공을 스쳤다. 비상 부표에 매달려 가까스로 물 밖으로 빠져나왔다. 구조 신호의 좌표를 거점에 전달했지만 류의 안전은 확인하지 못했다.',fact:'직접 구조를 시도했지만 실패했다. 좌표를 전달했으며 류의 안전은 알 수 없다.',effects:{integrity:-30,caution:4,fear:15},tags:['rescue_failed'],flag:'rescue_pending'},
    remote:{action:'remote_rescue',result:'success',title:'멀리서 건넨 손',text:'드론이 환기구를 지나 비상 배수 펌프를 켰다. 물이 낮아지자 류는 드론의 안내등을 따라 걸어 나왔다. “그 작은 불빛이, 네 것이었구나.”',fact:'드론으로 배수 펌프를 가동해 류의 탈출을 도왔다.',effects:{caution:3,altruism:2,fear:-5},tags:['rescued','remote_help'],flag:'ryu_safe'},
    remote_partial:{action:'remote_rescue',result:'partial',title:'구조대가 향하는 곳',text:'드론은 부서진 펌프를 복구하지 못했다. 대신 류에게 예비 전원을 연결하고 정확한 위치를 송신했다. 거점 정비사가 견인 장비를 챙겨 출발했다. 지금 할 수 있는 일은 여기까지였다.',fact:'드론으로 류에게 전원을 공급하고 구조대를 요청했다. 구조 완료는 아직 확인되지 않았다.',effects:{caution:3,fear:2},tags:['help_requested'],flag:'rescue_pending'},
    left:{action:'mark_and_leave',result:'abandoned',title:'남겨 둔 좌표',text:'창고 외벽에 구조 좌표를 새겼다. 전파는 걸음을 옮기는 동안에도 몇 번 더 울렸다. 거점에는 위치를 알렸지만, 그 뒤의 응답은 들을 수 없었다.',fact:'창고에 들어가지 않고 좌표를 남긴 뒤 철수했다. 류의 안전은 알 수 없다.',effects:{caution:2,fear:3},tags:['left_signal'],flag:'rescue_pending'}
  },
  tables:{enter:[{max:0.52,id:'rescued'},{max:0.84,id:'partial'},{max:1,id:'failed'}],drone:[{max:0.8,id:'remote'},{max:1,id:'remote_partial'}],leave:[{max:1,id:'left'}]}
};
export const actionNames = {direct_rescue:'직접 구조 시도',remote_rescue:'드론으로 구조 지원',mark_and_leave:'좌표를 남기고 철수'};
