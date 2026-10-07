// Build 232: HotB-style inline Attendance > Adjust card and controls.
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

  document.querySelectorAll('.rp231-adjust-inline').forEach(x=>x.remove());
  const wrap=document.createElement('div');
  wrap.className='rp231-adjust-inline';
  person.insertAdjacentElement('afterend',wrap);
  wrap.appendChild(form);

  // Match HotB wording/meaning. The underlying RebelsPrep fields remain unchanged:
  // unchecked "Not pitching" means available to pitch; unchecked noPitchWarmup means warm-up required.
  const noWarm=form.querySelector('input[name="noPitchWarmup"]');
  const notPitch=form.querySelector('input[name="notPitching"]');
  if(noWarm){
    const label=noWarm.closest('label');
    if(label){
      const hot=document.createElement('label');hot.className='check rp232-hotb-check';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=!noWarm.checked;
      cb.addEventListener('change',()=>{noWarm.checked=!cb.checked;});
      hot.append(cb,document.createTextNode('Pitch warm-up required'));
      label.replaceWith(hot);
    }
  }
  if(notPitch){
    const label=notPitch.closest('label');
    if(label){
      const hot=document.createElement('label');hot.className='check rp232-hotb-check';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=!notPitch.checked;
      cb.addEventListener('change',()=>{notPitch.checked=!cb.checked;});
      hot.append(cb,document.createTextNode('Available to pitch live'));
      label.replaceWith(hot);
    }
  }

  const adjustButton=person.querySelector('[data-adjust]');
  if(adjustButton){adjustButton.textContent='Done';adjustButton.dataset.rp231Open='1';}
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
