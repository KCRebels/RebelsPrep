// Mental Masters belongs to BJ Fox: show it as a simple drill whenever BJ is selected.
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
 card.innerHTML='<div style="border:2px solid #cfd5d2;border-radius:14px;background:#fff;padding:14px 16px;margin:10px 0;font-size:18px;font-weight:850;color:#111">Mental Masters</div>';
 anchor?.before(card);
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,600);
