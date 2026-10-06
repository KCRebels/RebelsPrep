// Build 181: signed-in builders can open and cleanly exit an active coach assignment. My Practice sits with Home actions instead of floating under the logo.
import * as shared from './shared-rp52.mjs?v=rp135';
import {openPortal} from './portal.mjs?v=rp129';
const KEY='RebelsPrep:coach-pilot:1';
let user=null,busy=false,inPortal=false;
function draft(){try{const active=localStorage.getItem(KEY+':active-team');if(!active)return null;return JSON.parse(localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY)||'null');}catch{return null;}}
async function activeDirectory(){const d=draft(),active=localStorage.getItem(KEY+':active-team');if(!d||!active)return null;const ids=[active,...(d.teamIds||[])].filter(Boolean);for(const id of [...new Set(ids)]){try{const directory=await shared.registry(id);if(!directory?.clockToken)continue;for(const coachId of d.coachIds||[]){const entry=directory.portals?.[coachId];if(entry?.role==='coach'&&entry?.token)return {entry};}}catch{}}return null;}
function exitButton(){if(!inPortal)return;const app=document.querySelector('#app');if(!app||document.querySelector('#exit-my-practice'))return;const b=document.createElement('button');b.id='exit-my-practice';b.type='button';b.textContent='← Back to RebelsPrep';b.style.cssText='font-size:16px;font-weight:700;padding:10px 16px;margin:0 0 12px;min-height:48px';b.onclick=()=>{inPortal=false;location.hash='';location.reload();};app.prepend(b);}
function isHome(){return document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');}
function homeActions(){if(!isHome())return null;const continueButton=document.querySelector('#build-selected-teams');return continueButton?.closest('.actions.step-actions')||null;}
function button(){if(!shared.configured||!shared.allowed(user)||inPortal)return;let wrap=document.querySelector('#my-practice-wrap');if(!wrap){wrap=document.createElement('div');wrap.id='my-practice-wrap';wrap.innerHTML='<button id="my-practice-button" type="button">My Practice</button>';wrap.querySelector('button').onclick=async()=>{if(busy)return;busy=true;const b=wrap.querySelector('button');b.disabled=true;b.textContent='Opening…';try{const found=await activeDirectory();if(!found)throw Error('No active coach assignment was found for this practice.');inPortal=true;wrap.remove();location.hash='portal='+found.entry.token;await openPortal(found.entry.token);exitButton();}catch(e){inPortal=false;alert(e.message);}finally{busy=false;if(document.body.contains(b)){b.disabled=false;b.textContent='My Practice';}}};}
 const actions=homeActions();if(actions){wrap.style.cssText='display:contents';if(wrap.parentElement!==actions)actions.appendChild(wrap);const b=wrap.querySelector('button');b.style.cssText='font-size:16px;font-weight:700;padding:10px 18px;min-height:48px;height:48px';actions.style.display='grid';actions.style.gridTemplateColumns='1fr 1fr';actions.style.gap='10px';}
 else {wrap.remove();}
}
function remove(){document.querySelector('#my-practice-wrap')?.remove();}
if(shared.configured){shared.observeAuth(u=>{user=u;if(shared.allowed(u))button();else remove();}).catch(()=>{});}
new MutationObserver(()=>{if(inPortal)exitButton();else if(shared.allowed(user))button();}).observe(document.documentElement,{childList:true,subtree:true});
