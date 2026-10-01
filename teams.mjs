import {rosterPlayers} from './team-rosters.mjs?v=rpbuild33';
const members=id=>rosterPlayers.filter(p=>p.memberTeamIds.includes(id));
export const teams=[
 {id:'kc-rebels-nationals',name:'KC Rebels All Nationals',description:'',players:members('kc-rebels-nationals')},
 {id:'kc-rebels-all-regional',name:'KC Rebels All Regional',description:'',players:members('kc-rebels-all-regional')},
 {id:'kc-rebels-18-national',name:'KC Rebels 18 National Mayhugh',description:'',players:members('kc-rebels-18-national')},
 {id:'kc-rebels-18-regional',name:'KC Rebels 18 Regional Jenkins',description:'',players:members('kc-rebels-18-regional')},
 {id:'kc-rebels-16-national',name:'KC Rebels 16 National Olsen',description:'',players:members('kc-rebels-16-national')},
 {id:'kc-rebels-16-regional',name:'KC Rebels 16 Regional Lickel',description:'',players:members('kc-rebels-16-regional')},
 {id:'kc-rebels-16-frans',name:'KC Rebels 16 Frans',description:'',players:members('kc-rebels-16-frans')},
 {id:'kc-rebels-14-national',name:'KC Rebels 14 National Shafer',description:'',players:members('kc-rebels-14-national')},
 {id:'kc-rebels-14-regional',name:'KC Rebels 14 Regional Oestmann',description:'',players:members('kc-rebels-14-regional')},
 {id:'kc-rebels-14-mason-shafer',name:'KC Rebels 14 Mason/Shafer',description:'',players:members('kc-rebels-14-mason-shafer')},
 {id:'kc-rebels-14-ufford',name:'KC Rebels 14 Ufford',description:'',players:members('kc-rebels-14-ufford')},
 {id:'kc-rebels-14b',name:'KC Rebels 14B',description:'',players:members('kc-rebels-14b')},
 {id:'kc-rebels-12-bachkora',name:'KC Rebels 12 Bachkora',description:'',players:members('kc-rebels-12-bachkora')},
 {id:'kc-rebels-12-eakin',name:'KC Rebels 12 Eakin',description:'',players:members('kc-rebels-12-eakin')},
 {id:'kc-rebels-12-huebert',name:'KC Rebels 12 Huebert',description:'',players:members('kc-rebels-12-huebert')},
 {id:'kc-rebels-12-perkins',name:'KC Rebels 12 Perkins',description:'',players:members('kc-rebels-12-perkins')},
 {id:'kc-rebels-12-stremsterfer',name:'KC Rebels 12 Stremsterfer',description:'',players:members('kc-rebels-12-stremsterfer')},
 {id:'kc-rebels-11-coppage',name:'KC Rebels 11 Coppage',description:'',players:members('kc-rebels-11-coppage')},
 {id:'kc-rebels-10-bachkora',name:'KC Rebels 10 Bachkora',description:'',players:members('kc-rebels-10-bachkora')},
 {id:'kc-rebels-10-carroll',name:'KC Rebels 10 Carroll',description:'',players:members('kc-rebels-10-carroll')},
 {id:'kc-rebels-10-graves',name:'KC Rebels 10 Graves',description:'',players:members('kc-rebels-10-graves')},
 {id:'kc-rebels-10-perkins',name:'KC Rebels 10 Perkins',description:'',players:members('kc-rebels-10-perkins')},
 {id:'kc-rebels-9-sherman',name:'KC Rebels 9 Sherman',description:'',players:members('kc-rebels-9-sherman')},
 {id:'kc-rebels-8-cairns',name:'KC Rebels 8 Cairns',description:'',players:members('kc-rebels-8-cairns')}
];
