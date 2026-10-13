// Build 363: transform the built-practice HTML before it enters #app.
// This avoids post-render observers fighting the core render order.
const app=document.getElementById('app');
const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');

function ensureStyle(){
 if(document.getElementById('rp363-built-practice-style'))return;
 const style=document.createElement('style');
 style.id='rp363-built-practice-style';
 style.textContent=`
  #app .rp363-section-title{
   display:block!important;
   visibility:visible!important;
   opacity:1!important;
   margin:0 0 7px!important;
   padding:0!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
  #app .practice-hero>.rp363-section-title{margin-bottom:10px!important}
  #app #rp363-practice-status>h2{display:none!important}
  #app[data-practice-view="plan"] .rp-section-label,
  #app[data-practice-view="review"] .rp-section-label,
  #app[data-practice-view="plan"] .drill-category,
  #app[data-practice-view="review"] .drill-category{
   margin:0 0 7px!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
 `;
 document.head.appendChild(style);
}

function statusPanel(root){
 const panels=[...root.querySelectorAll('section.panel')];
 return panels.find(panel=>panel.querySelector('#activate-shared,#coach-logout,#practice-status-coach-signin'))
  ||panels.find(panel=>/^(Shared Practice|Practice Status)$/i.test((panel.querySelector(':scope > h2')?.textContent||'').trim()))
  ||null;
}

function transform(value){
 if(typeof value!=='string'||!value.includes('practice-hero'))return value;
 const template=document.createElement('template');
 template.innerHTML=value;
 const root=template.content;
 const hero=root.querySelector('.practice-hero');
 if(!hero)return value;

 let overview=hero.querySelector(':scope > .rp363-section-title');
 if(!overview){
  overview=document.createElement('p');
  overview.className='rp363-section-title';
  overview.textContent='PRACTICE OVERVIEW';
  hero.prepend(overview);
 }

 const panel=statusPanel(root);
 if(panel){
  panel.id='rp363-practice-status';
  panel.querySelectorAll(':scope > .rp-practice-status-title-fixed,:scope > .rp-section-label,:scope > .rp359-status-label').forEach(el=>el.remove());
  let status=panel.querySelector(':scope > .rp363-section-title');
  if(!status){
   status=document.createElement('p');
   status.className='rp363-section-title';
   panel.prepend(status);
  }
  status.textContent='PRACTICE STATUS';
  const heading=panel.querySelector(':scope > h2');
  if(heading)heading.style.display='none';
  if(hero.nextElementSibling!==panel)hero.after(panel);
 }
 return template.innerHTML;
}

ensureStyle();
if(app&&inner?.get&&inner?.set){
 Object.defineProperty(app,'innerHTML',{
  configurable:true,
  enumerable:false,
  get(){return inner.get.call(this);},
  set(value){inner.set.call(this,transform(value));}
 });
}
