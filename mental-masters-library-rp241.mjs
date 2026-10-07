// Mental Masters belongs to BJ Fox: show it in Drill Selection whenever BJ is selected.
const BJ_ID='rp-c-57';
const CARD_ID='rp-mental-masters-library-card';
function bjSelected(){
 const checked=[...document.querySelectorAll('input:checked')];
 return checked.some(el=>el.value===BJ_ID||el.dataset.coachId===BJ_ID||el.closest('[data-coach-id="'+BJ_ID+'"]')) ||
   [...document.querySelectorAll('[data-coach-id="'+BJ_ID+'"]')].some(el=>el.matches('.selected,[aria-pressed="true"],[data-selected="true"]'));
}
function onDrills(){
 const app=document.getElementById('app');if(!app)return false;
 return /drill/i.test(document.querySelector('.bottom-nav [aria-current="page"]')?.textContent||'')||
   [...app.querySelectorAll('h1,h2')].some(h=>/select.*drill|drill.*select|drill library/i.test(h.textContent||''));
}
function mount(){
 let card=document.getElementById(CARD_ID);
 if(!onDrills()||!bjSelected()){card?.remove();return;}
 if(card)return;
 const app=document.getElementById('app');
 const anchor=[...app.querySelectorAll('section,.panel')].find(x=>/drill/i.test(x.querySelector('h1,h2')?.textContent||''))||app.firstElementChild;
 card=document.createElement('section');card.id=CARD_ID;card.className='panel';
 card.innerHTML=`<div style="border:2px solid #111;border-radius:18px;background:#fff;padding:16px;margin:12px 0"><div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#b51f2e;margin-bottom:5px">BJ Fox Only</div><div style="font-size:22px;font-weight:900;color:#111;margin-bottom:7px">Mental Masters</div><div style="font-size:15px;font-weight:700;line-height:1.35;color:#59657d">Mental side of the game · 8–12 preferred · 5–15 allowed · No equipment or practice space required.</div><div style="margin-top:10px;font-size:14px;font-weight:900;color:#111">Automatically included while BJ Fox is attending.</div></div>`;
 anchor?.before(card);
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,600);
