/** Reference contracts for contributors. Runtime checks live in engine.js. */
export type TraitId='courage'|'altruism'|'caution'|'impulsivity'|'sociability'|'wariness';
export type Phase='hub'|'scene'|'refused'|'outcome'|'returned'|'ended';
export type ChoiceId='enter'|'drone'|'leave';
export type Command={type:'depart'|'repair'|'alternative'|'withdraw'|'return'|'endDay'}|{type:'choose';id:ChoiceId}|{type:'override';confirmed:true};
export interface Profile {name:string;purpose:'repair'|'medical'|'scout';keywords:string[];value:'life'|'self'|'truth'|'freedom';past:'flood'|'rescue'|'blank'|'duty'}
export interface CharacterState {traits:Record<TraitId,number>;energy:number;integrity:number;stability:number;beliefs:{fear_flooded_places:number};emotions:{fear:number;guilt:number}}
export interface Attempt {choiceId:ChoiceId;decision:string}
export interface EventResolution {eventInstanceId:string;eventId:string;gameDay:number;playerChoiceId:ChoiceId;intendedActionId:string;actualActionId:string;outcomeId:string;result:'success'|'partial'|'failure'|'abandoned';forcedOverrideUsed:boolean;itemUses:{itemId:string;count:number}[];outcomeTags:string[];decision:string;attempts:Attempt[];before:CharacterState;after:CharacterState;worldFlag:string}
export interface SaveData {saveVersion:1;runId:string;revision:number;day:1;rngState:number;phase:Phase;profile:Profile;character:CharacterState;inventory:Record<'drone'|'override'|'kit',number>;world:Record<string,boolean>;pending:null|{originalChoice:ChoiceId;decision:string;score:number};resolution:EventResolution|null;attempts:Attempt[];memories:{id:string;sourceEventInstanceId:string;text:string;tags:string[]}[];diaries:{day:number;text:string;sourceEventInstanceIds:string[];templateIds:string[];voiceId:string}[];lastMessage:string}
