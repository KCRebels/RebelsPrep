// Build 367: own only the built-practice overview label and section order.
// Practice Status content/title/buttons are owned exclusively by practice-status-rp366.mjs.
const app=document.getElementById('app');
const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');

function ensureStyle(){
 if(document.getElementById('rp367-built-practice-style'))return;
 document.getElementById('rp363-built-practice-style')?.remove();
 const style=document.createElement('style');
 style.id='rp367-built-practice-style';
 style.textContent=`
  #app .rp367-overview-title{
   display:block!important;
   visibility:visible!important;
   opacity:1!important;
   margin:0 0 10px!important;
   padding:0!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
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
 return panels.find(panel=>panel.querySelector('#activate-shared,#coach-logout,#coach-login'))
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
 let overview=hero.querySelector(':scope > .rp367-overview-title');
 if(!overview){overview=document.createElement('p');overview.className='rp367-overview-title';hero.prepend(overview);}
 overview.textContent='PRACTICE OVERVIEW';
 const panel=statusPanel(root);
 if(panel){
  panel.id='rp367-practice-status';
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
