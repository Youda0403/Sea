import {validateSave} from './engine.js?v=sea-20260921r3';
let dbPromise;
function db(){return dbPromise ||= new Promise((resolve,reject)=>{const r=indexedDB.open('sea-first-signal',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function load(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get('active');r.onsuccess=()=>{try{resolve(r.result?validateSave(r.result):null);}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});}
// Compare-and-swap inside one IndexedDB transaction protects against stale tabs.
export async function commit(next,expected,{replace=false}={}){
  validateSave(next);const d=await db();return new Promise((resolve,reject)=>{
    const tx=d.transaction('saves','readwrite'),store=tx.objectStore('saves');let reason;
    const r=store.get('active');r.onsuccess=()=>{const current=r.result;
      if((current?.runId!==expected?.runId)||(current?.revision!==expected?.revision)){reason=new Error('다른 탭에서 저장이 변경됐어. 페이지를 새로고침해 줘.');tx.abort();return;}
      try{if(replace&&current)store.put(current,'previous');store.put(next,'active');}catch(e){reason=e;tx.abort();}};
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(reason||tx.error||new Error('저장하지 못했어. 기존 기록은 유지돼.'));tx.onerror=()=>{};
  });
}
export async function rawBackup(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get('active');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function previous(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get('previous');r.onsuccess=()=>{try{resolve(r.result?validateSave(r.result):null);}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});}
