// Build 342: shared builder-access rules for the universal coach dashboard.
export const FULL_BUILDER_EMAILS=Object.freeze([
 'recruiting@rebelssoftball.org',
 'chrisolsen@finditds.com'
]);

export const TEAM_BUILDER_ACCESS=Object.freeze({
 'corycairns@hotmail.com':['kc-rebels-8-cairns'],
 'cbachkora@logosmart365.com':['kc-rebels-10-bachkora'],
 'carrollm@usd231.com':['kc-rebels-10-carroll'],
 'coachgarrettgraves@gmail.com':['kc-rebels-10-graves'],
 'brad@chicanemotorsport.com':['kc-rebels-10-perkins','kc-rebels-12-perkins'],
 'coppage@rebelssoftball.org':['kc-rebels-11-coppage'],
 'bryan.bachkora@gmail.com':['kc-rebels-12-bachkora'],
 'eakindan@gmail.com':['kc-rebels-12-eakin'],
 'ehuebert26@gmail.com':['kc-rebels-12-huebert'],
 'toddstrem15@gmail.com':['kc-rebels-12-stremsterfer'],
 'john.shafer@prosourcekc.com':['kc-rebels-14-national'],
 'latrn.shafer33@gmail.com':['kc-rebels-14-national','kc-rebels-14-mason-shafer'],
 'lyndsi@lomavistanursery.com':['kc-rebels-14-regional'],
 'chufford93@gmail.com':['kc-rebels-14-ufford'],
 'rickstang70@gmail.com':['kc-rebels-14b'],
 'bretmason32@yahoo.com':['kc-rebels-14-mason-shafer'],
 'rylieg2002@gmail.com':['kc-rebels-16-national'],
 'krdearing20@gmail.com':['kc-rebels-16-frans'],
 'shelbyfrans6@gmail.com':['kc-rebels-16-frans'],
 'halley.rindom@gmail.com':['kc-rebels-18-national'],
 'dmayhugh425511@gmail.com':['kc-rebels-18-national'],
 'mjenkins@hearthhomemortgage.com':['kc-rebels-18-regional'],
 'marcspellman@sunflower.com':['kc-rebels-18-regional']
});

const clean=email=>String(email||'').trim().toLowerCase();
export function builderAccess(email){
 const key=clean(email);
 if(FULL_BUILDER_EMAILS.includes(key))return {builder:true,full:true,teamIds:[]};
 const teamIds=TEAM_BUILDER_ACCESS[key];
 return teamIds?{builder:true,full:false,teamIds:[...teamIds]}:{builder:false,full:false,teamIds:[]};
}
export function builderEmails(){return [...new Set([...FULL_BUILDER_EMAILS,...Object.keys(TEAM_BUILDER_ACCESS)])];}
export function builderHref(email){
 const access=builderAccess(email);
 if(!access.builder)return '';
 if(access.full)return './?build=1';
 if(access.teamIds.length===1)return './?build=1&team='+encodeURIComponent(access.teamIds[0])+'&attendance=1';
 return './?build=1';
}
