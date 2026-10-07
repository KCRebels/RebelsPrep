// Build 216: stable scheduler navigation. Never hide the app or force scroll position.
// The previous transition helper caused blank redraws and Attendance to jump vertically.
const STYLE='rp216-stable-nav-style';
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
.bottom-nav button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
`;document.head.appendChild(s);}
function clearOldTransitionState(){document.body.classList.remove('rp210-changing','rp215-changing');const app=document.getElementById('app');if(app){app.style.opacity='';}}
window.addEventListener('load',()=>{css();clearOldTransitionState();});
css();clearOldTransitionState();