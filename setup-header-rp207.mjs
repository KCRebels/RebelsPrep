// Build 208: Setup-only preview of the uniform RebelsPrep scheduler header.
const ID='rp207-setup-header';
function view(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function team(){const app=document.querySelector('#app');const h=app?.querySelector('h1');const p=h?.nextElementSibling;if(p?.classList.contains('muted')&&p.textContent.trim())return p.textContent.trim();for(const x of app?.querySelectorAll('p.muted')||[]){if(/KC Rebels/i.test(x.textContent||''))return x.textContent.trim();}return 'KC Rebels';}
function css(){if(document.getElementById(ID+'-style'))return;const s=document.createElement('style');s.id=ID+'-style';s.textContent=`
#${ID}{margin:8px 0 18px;padding:16px 18px;border:2px solid #d8ddd9;border-radius:20px;background:#fff;text-align:center}
#${ID} .rp207-team{margin:0 0 5px;color:#b51f2e;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;line-height:1.25}
#${ID} .rp207-title{margin:0;color:#0c1222;font-size:30px;font-weight:850;letter-spacing:-.025em;line-height:1.05}
#${ID} .rp207-page{margin:8px 0 0;color:#59657d;font-size:15px;font-weight:800}
#app[data-rp207-setup="1"]>h1,#app[data-rp207-setup="1"]>h1+p.muted{display:none!important}
#app[data-rp207-setup="1"] section.panel[data-rp208-details="1"]>h2{display:none!important}
@media(max-width:430px){#${ID}{padding:15px 16px}#${ID} .rp207-title{font-size:28px}}
`;document.head.appendChild(s);}
function cleanDetails(app){for(const panel of app.querySelectorAll('section.panel')){const label=panel.querySelector(':scope > .rp-section-label');const h2=panel.querySelector(':scope > h2');if(label?.textContent.trim()==='PRACTICE DETAILS'&&/practice settings/i.test(h2?.textContent||'')){panel.dataset.rp208Details='1';}}}
function mount(){css();const app=document.getElementById('app'),old=document.getElementById(ID);if(!app)return;if(view()!=='setup'){app.removeAttribute('data-rp207-setup');old?.remove();return;}app.setAttribute('data-rp207-setup','1');let box=old;if(!box){box=document.createElement('section');box.id=ID;const top=document.getElementById('rp-builder-top');if(top)top.after(box);else app.prepend(box);}box.innerHTML='<p class="rp207-team">'+esc(team())+'</p><h1 class="rp207-title">Practice Scheduler</h1><p class="rp207-page">Practice Setup</p>';cleanDetails(app);}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,700);