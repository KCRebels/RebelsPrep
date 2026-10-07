// Screenshot names plus explicit written role corrections. Additions remain subject to coach review.
const names = [
 ['Alaina Assenmacher','P','written'],['Aubrey Bachkora','','image'],['Gabrielle Bachkora','','image'],
 ['Pera Bauer','','image'],['Morgan Beasley','','image'],['Dayle Bettens','','image'],['Maci Cass','','image'],
 ["M’Kyla Cisneros",'P','image'],['Haley Clark','','image'],['Ainsley Curry','P','written'],['Lucy Davenport','','image'],
 ['Kenley Dearing','','image'],['Jordyn Fawl','P','image'],['Sydney Flowers','C','image'],['Taylor Froese','','image'],
 ['Kerrigan Gaston','','image'],['Kyleigh Gooding','','image'],['Stella Hamilton','','image'],['Teagan Hills','C','written'],
 ['Hayli Houfek','P','image'],['Kate Jacquinot','P','image'],['Landri Kistner','','image'],['Jenna May','','image'],
 ['Kinslee Mendez','','image'],['Delilah Miles','C','image'],['Aubrey Noonan','C','image'],['Capri Olsen','','image'],
 ['Heidi Olsen','','image'],['Ella Olson','','image'],['Evangeline Pham','C','written'],['Emma Robertson','P','written'],
 ['Rylee Rushton','P','written'],['Grace Samuels','C','written'],['Ava Sarber','P','image'],['Savannah Smith','','image'],
 ['Bobbi Snook','','image'],['Shanley Taylor','C','written'],['Avree Troxel','C','written'],['Stella Utter','P','written'],
 ['Peyton Valenzuela','','image'],['Avery Whitaker','P','image'],['Rylie Whitfield','','image'],['Kaydence Wilson','','image'],
 ['Olivia Wolf','','image'],['Kaylee Wood','','image']
];
export const players = names.map(([name,role,roleSource],i)=>({
 id:'rp-p-'+String(i+1).padStart(2,'0'),name,pitcher:role.includes('P'),catcher:role.includes('C'),roleSource
}));

// Coach IDs 1-9 are intentionally preserved so existing saved RebelsPrep drafts remain valid.
// teamIds controls each coach's home-team assignment. The coach picker can also search the full organization directory.
const coachRows = [
 ['rp-c-1','John Shafer','john@rebelssoftball.org',['kc-rebels-14-national','kc-rebels-16-national','kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-2','Bill Latteman','Bill.Latteman@gmail.com',['kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-3','Halley Rindom','halley.rindom@gmail.com',['kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-4','Chris Olsen','olsen@rebelssoftball.org',['kc-rebels-14-national','kc-rebels-16-national','kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-5','Jimmy Miles','jmiles0707@gmail.com',['kc-rebels-16-national','kc-rebels-nationals']],
 ['rp-c-6','Rylie Giddens','rylieg2002@gmail.com',['kc-rebels-16-national','kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-7','Dwight Mayhugh','dmayhugh425511@gmail.com',['kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-8','Chris Bachkora','cbachkora@logosmart365.com',['kc-rebels-10-bachkora','kc-rebels-14-national','kc-rebels-nationals']],
 ['rp-c-9','Dan Lickel','Lickel@rebelssoftball.org',['kc-rebels-16-regional']],
 ['rp-c-10','Bryan Bachkora','bryan.bachkora@gmail.com',['kc-rebels-12-bachkora']],
 ['rp-c-11','Joshua Bachler','joshuabachler3@gmail.com',['kc-rebels-12-eakin','kc-rebels-16-frans']],
 ['rp-c-12','Toni Bergquist','toni.bergquist@gmail.com',['kc-rebels-12-eakin']],
 ['rp-c-13','Megan Black','mblack3511@gmail.com',['kc-rebels-10-bachkora','kc-rebels-14-ufford']],
 ['rp-c-14','Cory Cairns','corycairns@hotmail.com',['kc-rebels-8-cairns']],
 ['rp-c-15','Marissa Carroll','carrollm@usd231.com',['kc-rebels-10-carroll']],
 ['rp-c-16','Mark Clear','mclear2525@aol.com',['kc-rebels-14-regional']],
 ['rp-c-17','Tim Coppage','coppage@rebelssoftball.org',['kc-rebels-11-coppage']],
 ['rp-c-18','Tricia Daniels','theck_7@hotmail.com',['kc-rebels-12-perkins']],
 ['rp-c-19','Kurt Dearing','krdearing20@gmail.com',['kc-rebels-16-frans']],
 ['rp-c-20','Dan Eakin','Eakindan@gmail.com',['kc-rebels-12-eakin']],
 ['rp-c-21','Ben Fawl','ben.fawl@bnsf.com',[]],
 ['rp-c-22','Joe Flowers','joeflowers27@hotmail.com',['kc-rebels-14-national','kc-rebels-nationals']],
 ['rp-c-23','Shelby Frans','shelbyfrans6@gmail.com',['kc-rebels-16-frans']],
 ['rp-c-24','Scott Geier','geiersm@gmail.com',['kc-rebels-12-stremsterfer']],
 ['rp-c-25','Garrett Graves','Coachgarrettgraves@gmail.com',['kc-rebels-10-graves']],
 ['rp-c-26','Emily Hawkins','emilyhawkins2619@gmail.com',['kc-rebels-12-huebert']],
 ['rp-c-27','Brian Hubbs','bhubbs01@gmail.com',['kc-rebels-14-regional']],
 ['rp-c-28','Erin Huebert','ehuebert26@gmail.com',['kc-rebels-12-huebert']],
 ['rp-c-29','Mark Jenkins','Jenkins@rebelssoftball.org',['kc-rebels-18-regional']],
 ['rp-c-30','Ashley Jenkins-Ruder','nickle.ruder05@gmail.com',['kc-rebels-18-national','kc-rebels-nationals']],
 ['rp-c-31','Adam Keating','akeating102211@gmail.com',['kc-rebels-10-graves']],
 ['rp-c-32','Bobbi Lewis','bobbifry@hotmail.com',['kc-rebels-16-national','kc-rebels-nationals']],
 ['rp-c-33','Bret Mason','bretmason32@yahoo.com',['kc-rebels-14-mason-shafer']],
 ['rp-c-34','Jimmy Massey','pipefitter533@yahoo.com',['kc-rebels-11-coppage']],
 ['rp-c-35','Myke McJunkins','mykemcjunkins@gmail.com',['kc-rebels-10-graves']],
 ['rp-c-36','Theresa Mock','tharper0802@gmail.com',['kc-rebels-10-bachkora']],
 ['rp-c-37','Jay Muller','Jay.muller@gmail.com',['kc-rebels-10-bachkora','kc-rebels-14-ufford']],
 ['rp-c-38','Leah Neece','leah.mountain@gmail.com',['kc-rebels-12-huebert']],
 ['rp-c-39','Lyndsi Oestmann','lyndsi@lomavistanursery.com',['kc-rebels-14-regional']],
 ['rp-c-40','Brad Perkins','brad@chicanemotorsport.com',['kc-rebels-10-perkins','kc-rebels-12-perkins']],
 ['rp-c-41','John Pfeiffer','jpfeiffer12@gmail.com',['kc-rebels-12-bachkora']],
 ['rp-c-42','Ryan Pickert','pa4084@yahoo.com',['kc-rebels-12-perkins']],
 ['rp-c-43','Erica Schumacher','schuerica24@gmail.com',['kc-rebels-14b']],
 ['rp-c-44','Brad Scott','bradleyofkansas@gmail.com',['kc-rebels-12-eakin']],
 ['rp-c-45','Lauren Shafer','lauren.shafer33@gmail.com',['kc-rebels-14-mason-shafer']],
 ['rp-c-46','Brian Shaw','brianshaw1518@gmail.com',['kc-rebels-11-coppage']],
 ['rp-c-47','Nick Shepard','nick@kchomesolutions.com',['kc-rebels-14-regional']],
 ['rp-c-48','Troy Simpson','troysimp.11@gmail.com',['kc-rebels-14-ufford']],
 ['rp-c-49','Donald Smith','smithdonald106@gmail.com',['kc-rebels-11-coppage']],
 ['rp-c-50','Marc Spellman','marcspellman@sunflower.com',['kc-rebels-18-regional']],
 ['rp-c-51','Rick Stang','Rickstang70@gmail.com',['kc-rebels-12-bachkora','kc-rebels-14b']],
 ['rp-c-52','Todd Stremsterfer','toddstrem15@gmail.com',['kc-rebels-12-stremsterfer']],
 ['rp-c-53','Chip Ufford','chufford93@gmail.com',['kc-rebels-14-ufford']],
 ['rp-c-54','Bob Waddell','bobwad01@gmail.com',['kc-rebels-16-regional']],
 ['rp-c-55','Brian Woods','race66bw@gmail.com',['kc-rebels-14-mason-shafer']],
 ['rp-c-56','Hannah Jenkins','',['kc-rebels-18-regional']],
 ['rp-c-57','BJ Fox','bjfox@mentalmastersathlete.com',['kc-rebels-16-national','kc-rebels-nationals']]
];
export const coaches = coachRows.map(([id,name,email,teamIds])=>({id,name,email,teamIds})).sort((a,b)=>a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1))||a.name.localeCompare(b.name));
export const rosterReview = {
 complete:true,
 message:'Team rosters include the spreadsheet and previously confirmed pitching and catching assignments.',
 writtenPitchers:['Stella Utter','Rylee Rushton','Alaina Assenmacher','Ainsley Curry','Emma Robertson'],
 writtenCatchers:['Avree Troxel','Grace Samuels','Evangeline Pham','Teagan Hills','Shanley Taylor']
};
