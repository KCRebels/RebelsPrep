// Adds an explicit clear X to the drill-library search without changing drill logic.
function mount(){
 const input=document.getElementById('drill-search');if(!input)return;
 let wrap=input.parentElement?.querySelector(':scope > .rp-drill-search-wrap');
 if(input.parentElement?.classList.contains('rp-drill-search-wrap'))return;
 wrap=document.createElement('div');wrap.className='rp-drill-search-wrap';wrap.style.cssText='position:relative;width:100%';
 input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);input.style.paddingRight='46px';
 const x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Clear drill search');x.textContent='×';x.style.cssText='position:absolute;right:8px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:0;background:transparent;font-size:28px;line-height:30px;font-weight:700;color:#59657d;padding:0;display:none';wrap.appendChild(x);
 const sync=()=>x.style.display=input.value?'block':'none';
 x.onclick=()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};
 input.addEventListener('input',sync);sync();
}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,500);
