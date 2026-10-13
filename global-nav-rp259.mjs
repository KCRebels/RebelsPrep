// Build 348: Start Over delegates to the app's native same-page reset so draft state is not re-saved during reload.
function builtPractice(){
 const view=document.querySelector('#app')?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';
 return view==='plan'||view==='active'||!!document.querySelector('#activate-practice,#start-practice,#active-practice,[data-practice-ready]');
}
function removeBar(){document.querySelector('#rp-global-nav')?.remove();}
function bar(){
 let el=document.querySelector('#rp-global-nav');
 if(el)return el;
 el=document.createElement('div');
 el.id='rp-global-nav';
 el.style.cssText='display:flex;justify-content:flex-end;gap:12px;margin:0 0 22px;position:relative;z-index:9999';
 el.innerHTML='<button type="button" id="rp-global-start" style="font-weight:700;padding:10px 18px;min-width:150px">Start Over</button>';
 return el;
}
function mount(){
 const app=document.querySelector('#app');
 if(!app)return;
 if(builtPractice()){removeBar();return;}
 const el=bar();
 if(el.parentElement!==app)app.prepend(el);
}
function nativeReset(){
 const native=document.getElementById('start-over');
 if(native){native.click();return true;}
 const setup=document.querySelector('.bottom-nav [data-view="setup"]');
 if(!setup)return false;
 setup.click();
 requestAnimationFrame(()=>document.getElementById('start-over')?.click());
 return true;
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('#rp-global-start');
 if(!b)return;
 e.preventDefault();
 e.stopPropagation();
 if(!confirm('Start over and clear this practice draft?'))return;
 nativeReset();
},true);
window.addEventListener('hashchange',()=>setTimeout(mount,50));
window.addEventListener('load',()=>setTimeout(mount,500));
setInterval(()=>{
 const app=document.querySelector('#app');
 if(!app)return;
 if(builtPractice()){removeBar();return;}
 if(!document.querySelector('#rp-global-nav')||document.querySelector('#drill-picker'))mount();
},500);
setTimeout(mount,700);
