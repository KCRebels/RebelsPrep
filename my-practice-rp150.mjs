// Build 151: signed-in builders can open an active coach assignment directly.
import * as shared from './shared-rp52.mjs?v=rp135';
import {openPortal} from './portal.mjs?v=rp129';
const KEY='RebelsPrep:coach-pilot:1';
let user=null,busy=false;
function draft(){try{const active=localStorage.getItem(KEY+':active-team');if(!active)return null;return JSON.parse(localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY)||'null');}catch{return null;}}
async function activeDirectory(){
 const d=draft(),active=localStorage.getItem(KEY+':active-team');if(!d||!active)return null;
 const ids=[active,...(d.teamIds||[])].filter(Boolean);
 for(const id of [...new Set(ids)]){try{const directory=await shared.registry(id);if(!directory?.clockToken)continue;for(const coachId of d.coachIds||[]){const entry=directory.portals?.[coachId];if(entry?.role==='coach'&&entry?.token)return {entry};}}catch{}}
 return null;
}
function button(){
 if(!shared.configured||!shared.allowed(user))return;
 const host=document.querySelector('main>header');if(!host||document.querySelector('#my-practice-button'))return;
 const wrap=document.createElement('div');wrap.id='my-practice-wrap';wrap.style.cssText='display:flex;justify-content:center;margin:10px 0 4px';
 wrap.innerHTML='<button id="my-practice-button" type="button" style="font-size:16px;font-weight:700;padding:10px 18px">My Practice</button>';
 host.appendChild(wrap);
 wrap.querySelector('button').onclick=async()=>{if(busy)return;busy=true;const b=wrap.querySelector('button');b.disabled=true;b.textContent='Opening…';try{const found=await activeDirectory();if(!found)throw Error('No active coach assignment was found for this practice.');location.hash='portal='+found.entry.token;await openPortal(found.entry.token);}catch(e){alert(e.message);}finally{busy=false;b.disabled=false;b.textContent='My Practice';}};
}
function remove(){document.querySelector('#my-practice-wrap')?.remove();}
if(shared.configured){shared.observeAuth(u=>{user=u;if(shared.allowed(u))button();else remove();}).catch(()=>{});}
new MutationObserver(()=>{if(shared.allowed(user))button();}).observe(document.documentElement,{childList:true,subtree:true});
