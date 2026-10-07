// Build 222: Drills hierarchy matches Attendance — back link outside, then scheduler card, then drill chooser.
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function fix(){
 if(activeView()!=='drills')return;
 const app=document.getElementById('app');
 const bar=document.getElementById('rp-builder-top');
 const header=document.getElementById('rp207-setup-header');
 if(!app||!bar||!header)return;
 const nativePanel=header.closest('section.panel');
 if(nativePanel&&nativePanel!==header){
  nativePanel.classList.add('rp221-drills-content');
  const labels=[...nativePanel.querySelectorAll(':scope > .rp-section-label')];
  labels.forEach(label=>{if(/practice drills/i.test(label.textContent||''))label.remove();});
  const nativeHeading=nativePanel.querySelector(':scope > h1');
  if(nativeHeading&&/practice drills/i.test(nativeHeading.textContent||''))nativeHeading.remove();
 }
 // Force both controls to be direct children of #app in Attendance order.
 // Moving header first prevents bar.after(header) from leaving bar inside the header.
 if(header.parentElement!==app)app.insertBefore(header,app.firstChild);
 if(bar.parentElement!==app)app.insertBefore(bar,header);
 else if(bar.nextElementSibling!==header)app.insertBefore(bar,header);
}
window.addEventListener('load',()=>setTimeout(fix,0));
setTimeout(fix,0);
new MutationObserver(()=>queueMicrotask(fix)).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});