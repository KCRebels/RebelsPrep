// Build 180: grouped controls, contextual Back links, equal button heights, and 120-minute default for new practices.
const KEY='RebelsPrep:coach-pilot:1';
const MIN_H='48px';
const backLabels={
 setup:'← Back to Home',
 attendance:'← Back to Setup',
 drills:'← Back to Attendance',
 review:'← Back to Drills',
 plan:'← Back to Review'
};
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function contextualBack(){
 const view=activeView();
 if(!view||view==='home')return;
 // Prefer the app's existing specific back controls and normalize their wording/size.
 let b=document.querySelector('#back-attendance-players,#back-drills-attendance,.picker-back,[data-rp-specific-back]');
 if(!b){
   b=document.getElementById('rp-context-back');
   if(!b){b=document.createElement('button');b.id='rp-context-back';b.type='button';b.className='rp-context-back';}
   const target={setup:'home',attendance:'setup',drills:'attendance',review:'drills',plan:'review'}[view];
   b.onclick=()=>document.querySelector('.bottom-nav [data-view="'+target+'"]')?.click();
   const app=document.querySelector('#app');const heading=app?.querySelector('h1');if(heading)heading.before(b);
 }
 b.textContent=backLabels[view]||'← Back';
 b.style.minHeight=MIN_H;b.style.height=MIN_H;b.style.padding='0 16px';b.style.margin='0 0 18px';b.style.width='auto';
}
function groupTopButtons(){
 const app=document.querySelector('#app');if(!app)return;
 const global=document.querySelector('#rp-global-nav');
 const my=app.querySelector('#rp-my-practice');
 if(global&&my&&activeView()!=='home'){
   let row=document.getElementById('rp-builder-actions');
   if(!row){row=document.createElement('div');row.id='rp-builder-actions';row.className='rp-builder-actions';}
   if(row.parentElement!==app)app.prepend(row);
   row.append(my,global);
 }
}
function equalize(){document.querySelectorAll('#app button,.bottom-nav button,#rp-global-nav button').forEach(b=>{b.style.minHeight=MIN_H;});}
function hideGenericBack(){document.querySelectorAll('#rp-global-back').forEach(b=>b.remove());}
function defaultDuration(){
 // Only change untouched/new setup drafts. Existing practices keep the duration the coach selected.
 const input=document.querySelector('#durationMinutes');if(!input||input.dataset.rp180)return;input.dataset.rp180='1';
 try{
   const id=localStorage.getItem(KEY+':active-team');const k=id?KEY+':team:'+id:null;const raw=k&&localStorage.getItem(k);if(!raw)return;
   const d=JSON.parse(raw);const untouched=!d?.steps?.setup&&!d?.plan&&!d?.clock&&(!d?.selectedDrills||!d.selectedDrills.length)&&(!d?.included||!d.included.length);
   if(untouched&&Number(d.durationMinutes)===180){d.durationMinutes=120;localStorage.setItem(k,JSON.stringify(d));input.value='120';input.dispatchEvent(new Event('change',{bubbles:true}));}
 }catch{}
}
function css(){if(document.getElementById('rp180-style'))return;const s=document.createElement('style');s.id='rp180-style';s.textContent=`
.rp-builder-actions{display:flex;gap:12px;align-items:stretch;margin:0 0 18px}.rp-builder-actions>#rp-my-practice,.rp-builder-actions>#rp-global-nav{flex:1;margin:0!important}.rp-builder-actions button{width:100%;height:${MIN_H};min-height:${MIN_H};padding:0 14px!important}.rp-context-back{font-weight:700}.actions.step-actions{align-items:stretch}.actions.step-actions button{min-height:${MIN_H}}@media(max-width:520px){.rp-builder-actions{display:grid;grid-template-columns:1fr 1fr}}
`;document.head.appendChild(s);}
function mount(){css();hideGenericBack();contextualBack();groupTopButtons();equalize();defaultDuration();}
let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;mount();});}).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',()=>requestAnimationFrame(mount));setInterval(mount,700);mount();