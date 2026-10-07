// Build 221: put the Drills back link and scheduler header at app level, matching Attendance.
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function fix(){
 if(activeView()!=='drills')return;
 const app=document.getElementById('app');
 const bar=document.getElementById('rp-builder-top');
 const header=document.getElementById('rp207-setup-header');
 if(!app||!bar||!header)return;
 const nativePanel=header.closest('section.panel');
 if(nativePanel&&nativePanel!==header){
  nativePanel.before(bar);
  bar.after(header);
  nativePanel.classList.add('rp221-drills-content');
  const labels=[...nativePanel.querySelectorAll(':scope > .rp-section-label')];
  labels.forEach(label=>{if(/practice drills/i.test(label.textContent||''))label.remove();});
  const nativeHeading=nativePanel.querySelector(':scope > h1');
  if(nativeHeading&&/practice drills/i.test(nativeHeading.textContent||''))nativeHeading.remove();
 }
}
window.addEventListener('load',()=>setTimeout(fix,0));
setTimeout(fix,0);
new MutationObserver(()=>queueMicrotask(fix)).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});