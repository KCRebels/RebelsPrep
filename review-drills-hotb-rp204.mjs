// Build 236: HotB-style built-in hitting choices + selected drills on Review Practice only.
const CARD_ID='rp-review-drills-hotb',BUILT_ID='rp-review-built-in-hotb';
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function css(){if(document.getElementById('rp204-review-drills-style'))return;const s=document.createElement('style');s.id='rp204-review-drills-style';s.textContent=`
#${BUILT_ID},#${CARD_ID}{background:#fff;border:2px solid #d8ddd9;border-radius:22px;padding:20px 18px;margin:16px 0}
#${BUILT_ID} .rp-drill-eyebrow,#${CARD_ID} .rp-drill-eyebrow{margin:0 0 7px;color:#b51f2e;font-size:14px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
#${BUILT_ID} h2,#${CARD_ID} h2{margin:0 0 14px;color:#0c1222;font-size:28px;line-height:1.08;font-weight:850;letter-spacing:-.025em}
#${BUILT_ID} .rp-built-copy{margin:0 0 16px;color:#59657d;font-size:16px;font-weight:700;line-height:1.35}
#${BUILT_ID} label{display:block;margin:14px 0 7px;color:#59657d;font-size:14px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
#${BUILT_ID} select{box-sizing:border-box;width:100%;min-height:54px;border:2px solid #cfd5d2;border-radius:14px;background:#fff;padding:0 14px;color:#0c1222;font-size:18px;font-weight:800}
#${CARD_ID} .rp-drill-list{display:grid;gap:8px;margin:0 0 18px}
#${CARD_ID} .rp-drill-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;color:#0c1222;font-size:18px;font-weight:800;line-height:1.2}
#${CARD_ID} .rp-drill-num{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;background:#111;color:#fff;font-size:17px;font-weight:900}
#${CARD_ID} #rp-change-drills{width:100%;min-height:54px;border:2px solid #cfd5d2;border-radius:14px;background:#fff;color:#111;font-size:18px;font-weight:850}
@media(max-width:430px){#${BUILT_ID},#${CARD_ID}{padding:18px 16px}#${BUILT_ID} h2,#${CARD_ID} h2{font-size:26px}#${CARD_ID} .rp-drill-row{font-size:17px}}
`;document.head.appendChild(s);}
function drillNames(native){return [...native.querySelectorAll('.review-list li')].map(li=>li.textContent.trim()).filter(Boolean);}
function builtInOptions(names,type){const tests=type==='machine'?[/machine/i,/velocity/i,/velo/i,/high.*speed/i,/speed/i]:[/front\s*toss/i,/toss/i,/hunt.*zone/i,/zone/i];const found=names.filter(n=>tests.some(r=>r.test(n)));const defaults=type==='machine'?['Standard','Velocity Training']:['Standard','Hunt Your Zone'];return [...new Set([...defaults,...found])];}
function selectMarkup(id,label,options,value){return '<label for="'+id+'">'+label+'</label><select id="'+id+'">'+options.map(x=>'<option'+(x===value?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';}
function mount(){css();const app=document.querySelector('#app'),old=document.getElementById(CARD_ID),oldBuilt=document.getElementById(BUILT_ID);if(!app||activeView()!=='review'){old?.remove();oldBuilt?.remove();return;}
 const panels=[...app.querySelectorAll('section.panel')];const native=panels.find(p=>p.querySelector('h2')?.textContent.trim()==='Drills');if(!native)return;
 const names=drillNames(native);if(!names.length)return;
 const machine=builtInOptions(names,'machine'),front=builtInOptions(names,'front');
 let built=oldBuilt;
 if(!built){
   built=document.createElement('section');built.id=BUILT_ID;native.before(built);
   built.innerHTML='<p class="rp-drill-eyebrow">Built-In Hitting</p><h2>Machine + Front Toss Focus</h2><p class="rp-built-copy">Choose Standard or a library drill. This changes the existing rotation—it does not add another block.</p>'+selectMarkup('rp-machine-focus','Machine',machine,'Standard')+selectMarkup('rp-front-focus','Front Toss',front,'Standard');
 } else {
   // Do not rebuild this card while a native select menu is open. Replacing the
   // select every 700ms caused the browser picker to flash and immediately close.
   const m=built.querySelector('#rp-machine-focus'),f=built.querySelector('#rp-front-focus');
   if(m&&!m.matches(':focus')){const v=m.value;m.innerHTML=machine.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('');}
   if(f&&!f.matches(':focus')){const v=f.value;f.innerHTML=front.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('');}
 }
 let card=old;if(!card){card=document.createElement('section');card.id=CARD_ID;native.before(card);card.innerHTML='<p class="rp-drill-eyebrow">Drill Stations</p><h2>Practice Drills Selected</h2><div class="rp-drill-list">'+names.map((name,i)=>'<div class="rp-drill-row"><span class="rp-drill-num">'+(i+1)+'</span><span>Drill Station '+(i+1)+' — '+esc(name)+'</span></div>').join('')+'</div><button type="button" id="rp-change-drills">Change Drills</button>';card.querySelector('#rp-change-drills').onclick=()=>native.querySelector('[data-view="drills"]')?.click();}
 native.style.display='none';
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,700);