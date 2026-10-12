/* Build 326: rename Ask the Library -> Ask the Librarian and give that view the HotB layout. */
const app=document.getElementById('app');
let queued=false;
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function renameCards(){
 app?.querySelectorAll('.coach-card h2').forEach(h=>{if(h.textContent.trim()==='Ask the Library')setText(h,'Ask the Librarian');});
}
function patchAsk(){
 if(!app)return;
 renameCards();
 const head=app.querySelector('.coach-page-head');
 const title=head?.querySelector('h1');
 if(!head||!title||!/^Ask the (Library|Librarian)$/i.test(title.textContent.trim()))return;
 const page=head.closest('.coach-portal-page');
 if(!page)return;
 page.classList.add('coach-librarian-page');
 setText(title,'Ask the Librarian');
 const back=head.querySelector('.coach-back');
 if(back)setText(back,'Back');
 let hero=page.querySelector('.coach-librarian-hero');
 if(!hero){
  hero=document.createElement('section');
  hero.className='coach-librarian-hero';
  hero.innerHTML='<span class="coach-librarian-kicker">DRILL FINDER</span><h2>What Do You Want to Work On?</h2><p>Describe what is happening in the swing or the pitch you are struggling to hit. The Librarian will recommend drills only from the RebelsPrep library.</p>';
  head.insertAdjacentElement('afterend',hero);
 }
 const source=page.querySelector('#coach-ask-search');
 if(!source)return;
 let ask=page.querySelector('.coach-librarian-ask');
 if(!ask){
  ask=document.createElement('section');
  ask.className='coach-librarian-ask';
  ask.innerHTML='<label for="coach-librarian-query">ASK THE LIBRARIAN</label><textarea class="coach-librarian-query" id="coach-librarian-query" placeholder="Example: I keep popping up."></textarea><button class="coach-librarian-find" type="button">Find My Drills</button>';
  source.insertAdjacentElement('afterend',ask);
  const textarea=ask.querySelector('#coach-librarian-query');
  textarea.value=source.value||'';
  ask.querySelector('.coach-librarian-find')?.addEventListener('click',()=>{
   source.value=textarea.value.trim();
   source.dispatchEvent(new Event('input',{bubbles:true}));
  });
  textarea.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')ask.querySelector('.coach-librarian-find')?.click();});
 }
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;patchAsk();});}
if(app){new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});schedule();}
