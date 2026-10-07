// Build 231: make Attendance > Adjust behave like HotB's inline expanded player card.
let pendingPerson=null;
let activeForm=null;

document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-adjust]');
  if(button) pendingPerson=button.closest('.person');
},true);

const nativeShowModal=HTMLDialogElement.prototype.showModal;
const nativeClose=HTMLDialogElement.prototype.close;

HTMLDialogElement.prototype.showModal=function(){
  const form=this.querySelector('#adjust-form');
  if(!form) return nativeShowModal.call(this);
  activeForm=form;
  const person=pendingPerson;
  pendingPerson=null;
  if(!person) return nativeShowModal.call(this);

  // HotB expands the adjustment controls directly under the selected player.
  document.querySelectorAll('.rp231-adjust-inline').forEach(x=>x.remove());
  const wrap=document.createElement('div');
  wrap.className='rp231-adjust-inline';
  person.insertAdjacentElement('afterend',wrap);
  wrap.appendChild(form);

  const adjustButton=person.querySelector('[data-adjust]');
  if(adjustButton){adjustButton.textContent='Done';adjustButton.dataset.rp231Open='1';}

  // Do not focus a time input when opening. This prevents iOS from immediately
  // opening its scrolling time picker; the picker opens only when the coach taps a time box.
  requestAnimationFrame(()=>document.activeElement?.blur?.());
};

HTMLDialogElement.prototype.close=function(returnValue){
  if(activeForm && !this.contains(activeForm)){
    const wrap=activeForm.closest('.rp231-adjust-inline');
    const person=wrap?.previousElementSibling;
    const adjustButton=person?.querySelector?.('[data-adjust]');
    if(adjustButton){adjustButton.textContent='Adjust';delete adjustButton.dataset.rp231Open;}
    wrap?.remove();
    activeForm=null;
    return;
  }
  return nativeClose.call(this,returnValue);
};
