// Build 358: prioritize Practice Status and normalize all red built-practice section labels.
const app=document.getElementById('app');
let frame=0;

function ensureStyle(){
 if(document.getElementById('rp357-plan-layout-style'))return;
 const style=document.createElement('style');
 style.id='rp357-plan-layout-style';
 style.textContent=`
  #app[data-practice-view="plan"] .rp-section-label,
  #app[data-practice-view="review"] .rp-section-label,
  #app[data-practice-view="plan"] .drill-category,
  #app[data-practice-view="review"] .drill-category,
  #app[data-practice-view="plan"] .rp357-hero-label,
  #app[data-practice-view="review"] .rp357-hero-label{
   margin:0 0 7px!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
  .practice-hero>.rp357-hero-label{margin-bottom:10px!important}
 `;
 document.head.appendChild(style);
}

function sharedPanel(){
 const panels=[...app.querySelectorAll('section.panel')];
 return panels.find(panel=>{
  const h=panel.querySelector(':scope > h2');
  const label=panel.querySelector(':scope > .rp-section-label');
  const text=(h?.textContent||label?.textContent||'').trim();
  return /^(Shared Practice|Practice Status)$/i.test(text);
 })||null;
}

function decorateHero(){
 const hero=app.querySelector('.practice-hero');
 if(!hero)return;
 let label=hero.querySelector(':scope > .rp357-hero-label');
 if(!label){
  label=document.createElement('p');
  label.className='rp357-hero-label';
  label.textContent='PRACTICE OVERVIEW';
  hero.prepend(label);
 }
}

function prioritizeStatus(){
 const hero=app.querySelector('.practice-hero');
 const panel=sharedPanel();
 if(!hero||!panel)return;
 panel.id='rp357-practice-status';
 let label=panel.querySelector(':scope > .rp-section-label');
 const heading=panel.querySelector(':scope > h2');
 if(!label){
  label=document.createElement('p');
  label.className='rp-section-label';
  heading?.before(label);
 }
 label.textContent='PRACTICE STATUS';
 if(heading)heading.style.display='none';
 if(hero.nextElementSibling!==panel)hero.after(panel);
}

function mount(){
 ensureStyle();
 if(app?.dataset.practiceView!=='plan'&&app?.dataset.practiceView!=='review')return;
 decorateHero();
 prioritizeStatus();
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
ensureStyle();schedule();
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view']});
