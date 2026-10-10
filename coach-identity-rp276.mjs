import {coaches} from './roster.mjs?v=rp129';
const aliases={'recruiting@rebelssoftball.org':'rp-c-9','chrisolsen@finditds.com':'rp-c-4'};
export function coachIdentity(email){
 const clean=String(email||'').trim().toLowerCase();
 return coaches.find(c=>c.id===aliases[clean]||c.email&&c.email.toLowerCase()===clean)||null;
}
export function coachAccountData(coach){
 coach=coaches.find(c=>c.id===coach?.id);if(!coach)throw Error('Choose a roster coach.');
 return {role:coach.id==='rp-c-9'?'org_admin':coach.id==='rp-c-4'?'org_coach':'team_coach',active:true,coachId:coach.id,playerId:'',displayName:coach.name,teamIds:[...new Set(coach.teamIds||[])]};
}
