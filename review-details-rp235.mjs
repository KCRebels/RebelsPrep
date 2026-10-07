// Build 235 — combine Review Practice setup + attendance summary into one Practice Details card.
const ID='rp235-practice-details';
function reviewActive(){return document.querySelector('.bottom-nav [data-view="review"][aria-current="page"]');}
function panels(){return [...document.querySelectorAll('#app section.panel,#app .panel')];}
function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim();}
function findCards(){
 const ps=panels();
 const setup=ps.find(p=>/practice details/i.test(text(p.querySelector(':scope > .rp-section-label'))) || /edit setup/i.test(text(p)));
 const attendance=ps.find(p=>p!==setup && (/^attendance$/i.test(text(p.querySelector(':scope > h2'))) || /edit attendance/i.test(text(p))));
 return {setup,attendance};
}
function parseSetup(setup){
 const lines=[...setup.querySelectorAll('p')].map(text).filter(Boolean).filter(x=>!/practice details/i.test(x));
 const dateLine=lines.find(x=>/\d{4}-\d{2}-\d{2}/.test(x))||'';
 const durationLine=lines.find(x=>/minute/i.test(x)&&/block/i.test(x))||'';
 const parts=dateLine.split('·').map(x=>x.trim());
 const date=parts[0]||'';
 const facility=parts.length>2?parts[1]:'';
 const time=parts.length>2?parts.slice(2).join(' · '):(parts[1]||'');
 const duration=(durationLine.match(/(\d+)\s*minutes?/i)||[])[1]||'';
 const block=(durationLine.match(/(\d+)\s*minute\s*blocks?/i)||[])[1]||'';
 return {date,time,facility,duration,block};
}
function parseAttendance(att){
 const all=text(att);
 const players=(all.match(/(\d+)\s*(?:hitters|players)/i)||[])[1]||'';
 const coaches=(all.match(/(\d+)\s*coaches?/i)||[])[1]||'';
 return {players,coaches};
}
function mount(){
 const old=document.getElementById(ID);
 if(!reviewActive()){old?.remove();return;}
 const {setup,attendance}=findCards();
 if(!setup||!attendance)return;
 const a=parseSetup(setup),b=parseAttendance(attendance);
 let card=old;
 if(!card){card=document.createElement('section');card.className='panel';card.id=ID;setup.before(card);}
 card.innerHTML='<p class="rp-section-label">PRACTICE DETAILS</p><p class="rp235-line"><strong>'+a.date+'</strong> <span>·</span> '+a.time+'</p><p class="rp235-line">'+a.facility+' <span>·</span> '+b.coaches+' '+(b.coaches==='1'?'coach':'coaches')+'</p><p class="rp235-line">'+a.duration+' min <span>·</span> '+a.block+' min blocks <span>·</span> '+b.players+' players</p><div class="actions"><button type="button" id="rp235-edit-setup">Edit Setup</button></div>';
 setup.style.display='none';attendance.style.display='none';
 card.querySelector('#rp235-edit-setup').onclick=()=>{const btn=setup.querySelector('button,[data-view]');if(btn)btn.click();};
 if(!document.getElementById('rp235-style')){const s=document.createElement('style');s.id='rp235-style';s.textContent='#rp235-practice-details{padding:22px 26px!important}#rp235-practice-details .rp235-line{margin:0 0 13px!important;font-size:17px!important;line-height:1.35!important;color:#111!important}#rp235-practice-details .rp235-line strong{font-weight:500!important}#rp235-practice-details .actions{margin-top:18px!important}#rp235-practice-details button{min-height:52px!important;padding:0 20px!important;border:1.5px solid #cfd5d2!important;border-radius:12px!important;background:#fff!important;color:#111!important;font-size:17px!important;font-weight:850!important}@media(max-width:430px){#rp235-practice-details{padding:18px!important}#rp235-practice-details .rp235-line{font-size:16px!important}}';document.head.appendChild(s);}
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,700);
