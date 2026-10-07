// Build 204: HotB-style selected drill presentation on Review Practice only.
const CARD_ID='rp-review-drills-hotb';
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function css(){if(document.getElementById('rp204-review-drills-style'))return;const s=document.createElement('style');s.id='rp204-review-drills-style';s.textContent=`
#${CARD_ID}{background:#fff;border:2px solid #d8ddd9;border-radius:22px;padding:20px 18px;margin:16px 0}
#${CARD_ID} .rp-drill-eyebrow{margin:0 0 7px;color:#b51f2e;font-size:14px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
#${CARD_ID} h2{margin:0 0 14px;color:#0c1222;font-size:28px;line-height:1.08;font-weight:850;letter-spacing:-.025em}
#${CARD_ID} .rp-drill-list{display:grid;gap:8px;margin:0 0 18px}
#${CARD_ID} .rp-drill-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;color:#0c1222;font-size:18px;font-weight:800;line-height:1.2}
#${CARD_ID} .rp-drill-num{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;background:#111;color:#fff;font-size:17px;font-weight:900}
#${CARD_ID} #rp-change-drills{width:100%;min-height:54px;border:2px solid #cfd5d2;border-radius:14px;background:#fff;color:#111;font-size:18px;font-weight:850}
@media(max-width:430px){#${CARD_ID}{padding:18px 16px}#${CARD_ID} h2{font-size:26px}#${CARD_ID} .rp-drill-row{font-size:17px}}
`;document.head.appendChild(s);}
function mount(){css();const app=document.querySelector('#app'),old=document.getElementById(CARD_ID);if(!app||activeView()!=='review'){old?.remove();return;}
 const panels=[...app.querySelectorAll('section.panel')];const native=panels.find(p=>p.querySelector('h2')?.textContent.trim()==='Drills');if(!native)return;
 const names=[...native.querySelectorAll('.review-list li')].map(li=>li.textContent.trim()).filter(Boolean);if(!names.length)return;
 let card=old;if(!card){card=document.createElement('section');card.id=CARD_ID;native.before(card);}
 card.innerHTML='<p class="rp-drill-eyebrow">Drill Stations</p><h2>Practice Drills Selected</h2><div class="rp-drill-list">'+names.map((name,i)=>'<div class="rp-drill-row"><span class="rp-drill-num">'+(i+1)+'</span><span>Drill Station '+(i+1)+' — '+esc(name)+'</span></div>').join('')+'</div><button type="button" id="rp-change-drills">Change Drills</button>';
 native.style.display='none';card.querySelector('#rp-change-drills').onclick=()=>native.querySelector('[data-view="drills"]')?.click();
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,700);