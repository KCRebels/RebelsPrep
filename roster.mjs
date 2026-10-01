// Screenshot names plus explicit written role corrections. Additions remain subject to coach review.
const names = [
 ['Alaina Assenmacher','P','written'],['Aubrey Bachkora','','image'],['Gabrielle Bachkora','','image'],
 ['Pera Bauer','','image'],['Morgan Beasley','','image'],['Dayle Bettens','','image'],['Maci Cass','','image'],
 ["M’Kyla Cisneros",'P','image'],['Haley Clark','','image'],['Ainsley Curry','P','written'],['Lucy Davenport','','image'],
 ['Kenley Dearing','','image'],['Jordyn Fawl','P','image'],['Sydney Flowers','C','image'],['Taylor Froese','','image'],
 ['Kerrigan Gaston','','image'],['Kyleigh Gooding','','image'],['Stella Hamilton','','image'],['Teagan Hills','C','written'],
 ['Hayli Houfek','P','image'],['Kate Jacquinot','P','image'],['Landri Kistner','','image'],['Jenna May','','image'],
 ['Kinslee Mendez','','image'],['Delilah Miles','C','image'],['Aubrey Noonan','C','image'],['Capri Olsen','','image'],
 ['Heidi Olsen','','image'],['Ella Olsen','','image'],['Evangeline Pham','C','written'],['Emma Robertson','P','written'],
 ['Rylee Rushton','P','written'],['Grace Samuels','C','written'],['Ava Sarber','P','image'],['Savannah Smith','','image'],
 ['Bobbi Snook','','image'],['Shanley Taylor','C','written'],['Avree Troxel','C','written'],['Stella Utter','P','written'],
 ['Peyton Valenzuela','','image'],['Avery Whitaker','P','image'],['Rylie Whitfield','','image'],['Kaydence Wilson','','image'],
 ['Olivia Wolf','','image'],['Kaylee Wood','','image']
];
export const players = names.map(([name,role,roleSource],i)=>({
 id:'rp-p-'+String(i+1).padStart(2,'0'),name,pitcher:role.includes('P'),catcher:role.includes('C'),roleSource
}));
export const coaches = ['John Shafer','Bill Latteman','Halley Rindom','Chris Olsen','Jimmy Miles','Rylie Giddens','Dwight Mayhugh','Chris Bachkora','Dan Lickel'].map((name,i)=>({id:'rp-c-'+(i+1),name})).sort((a,b)=>a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1))||a.name.localeCompare(b.name));
export const rosterReview = {
 complete:true,
 message:'Roster combines the images with the written pitching and catching corrections confirmed September 30.',
 writtenPitchers:['Stella Utter','Rylee Rushton','Alaina Assenmacher','Ainsley Curry','Emma Robertson'],
 writtenCatchers:['Avree Troxel','Grace Samuels','Evangeline Pham','Teagan Hills','Shanley Taylor']
};
