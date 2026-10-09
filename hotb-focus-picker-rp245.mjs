// Build 245 — make RebelsPrep Machine + Front Toss focus controls match HotB's native practice controls.
const STYLE_ID='rp245-hotb-focus-picker-style';
function reviewActive(){return !!document.querySelector('.bottom-nav [data-view="review"][aria-current="page"]');}
function css(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#rp-review-built-in-hotb{display:grid!important;gap:13px!important;margin:12px 0!important;padding:15px 16px!important;border:2px solid #d5dcda!important;border-radius:14px!important;background:#fff!important}
#rp-review-built-in-hotb .rp-drill-eyebrow{margin:0!important;color:#a51e27!important;font-size:11px!important;font-weight:950!important;letter-spacing:.07em!important;text-transform:uppercase!important}
#rp-review-built-in-hotb h2{margin:4px 0 6px!important;color:#0c1222!important;font-size:21px!important;line-height:1.08!important;font-weight:850!important;letter-spacing:0!important}
#rp-review-built-in-hotb .rp-built-copy{margin:0 0 13px!important;color:#596579!important;font-size:14px!important;font-weight:700!important;line-height:1.35!important}
#rp-review-built-in-hotb label{display:grid!important;gap:5px!important;min-width:0!important;margin:0 0 10px!important;color:#596579!important;font-size:12px!important;font-weight:900!important;letter-spacing:0!important;text-transform:uppercase!important}
#rp-review-built-in-hotb select{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;height:auto!important;min-height:52px!important;margin:0!important;padding:10px 12px!important;border:2px solid #ced4d1!important;border-radius:14px!important;background:#fff!important;color:#182233!important;font:700 17px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;box-shadow:none!important}
#rp-review-built-in-hotb select:disabled{opacity:.35!important;cursor:not-allowed!important}
`;document.head.appendChild(s);}
function mount(){if(!reviewActive())return;const card=document.getElementById('rp-review-built-in-hotb');if(!card)return;css();}
window.addEventListener('load',mount);window.addEventListener('hashchange',()=>setTimeout(mount,0));setTimeout(mount,0);setInterval(mount,500);
