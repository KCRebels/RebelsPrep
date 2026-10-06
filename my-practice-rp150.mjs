// Build 150: signed-in coaches can open their own active assignment screen directly.
import * as shared from './shared-rp52.mjs?v=rp135';
import {coaches} from './roster.mjs?v=rp129';
import {openPortal} from './portal.mjs?v=rp129';
const KEY='RebelsPrep:coach-pilot:1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,busy=false,message='';
function coach(){const email=user?.email?.trim().toLowerCase();return coaches.find(c=>String(c.email||'').trim().toLowerCase()===email)||null;}
async function activeDirectory(){
 const c=coach();if(!c)return null;
 const active=localStorage.getItem(KEY+':active-team');
 const ids=[active,...(c.memberTeamIds||[]),...(c.teamIds||[]),c.teamId].filter(Boolean);
 for(const id of [...new Set(ids)]){try{const d=await shared.registry(id);if(d?.clockToken&&d?.portals?.[c.id]?.token)return {directory:d,entry:d.portals[c.id]};}catch{}}
 return null;
}
function button(){
 if(!shared.configured||!shared.allowed(user)||!coach())return;
 const host=document.querySelector('main>header');if(!host||document.querySelector('#my-practice-button'))return;
 const wrap=document.createElement('div');wrap.id='my-practice-wrap';wrap.style.cssText='display:flex;justify-content:center;margin:10px 0 4px';
 wrap.innerHTML='<button id="my-practice-button" type="button" style="font-size:16px;font-weight:700;padding:10px 18px">My Practice</button>';
 host.appendChild(wrap);
 wrap.querySelector('button').onclick=async()=>{if(busy)return;busy=true;message='';const b=wrap.querySelector('button');b.disabled=true;b.textContent='Opening…';try{const found=await activeDirectory();if(!found)throw Error('No active practice is assigned to this coach.');location.hash='portal='+found.entry.token;await openPortal(found.entry.token);}catch(e){message=e.message;alert(message);}finally{busy=false;b.disabled=false;b.textContent='My Practice';}};
}
function remove(){document.querySelector('#my-practice-wrap')?.remove();}
if(shared.configured){shared.observeAuth(u=>{user=u;if(shared.allowed(u))button();else remove();}).catch(()=>{});}
new MutationObserver(()=>{if(shared.allowed(user))button();}).observe(document.documentElement,{childList:true,subtree:true});
