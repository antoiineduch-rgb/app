import clipping from 'polygon-clipping';
import {shaftOpening} from './mesh.js';
import {extrudeLayers} from './mesh-extrusion.js';

const round=value=>Math.round(value*1e6)/1e6;
const DIGITS=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
const SEGMENTS={a:[.25,3.6,2.25,4.2],b:[1.9,1.9,2.5,4],c:[1.9,.2,2.5,2.3],d:[.25,0,2.25,.6],e:[0,.2,.6,2.3],f:[0,1.9,.6,4],g:[.25,1.8,2.25,2.4]};
function labelPolygons(text,x,y){
  // A 0.6 mm segment width and 0.7 mm decimal point remain legible with a
  // 0.4 mm nozzle. These same outlines drive the preview and raised labels.
  const width=[...text].reduce((sum,c)=>sum+(c==='.'?.7:2.5)+.8,0)-.8,rectangles=[];
  let offset=-width/2;
  for(const char of text){
    const segments=char==='.'?[[0,0,.7,.7]]:[...DIGITS[Number(char)]].map(id=>SEGMENTS[id]);
    for(const [x0,y0,x1,y1]of segments){const a=round(x+offset+x0),b=round(x+offset+x1),c=round(y-2.1+y0),d=round(y-2.1+y1);rectangles.push([[[a,c],[b,c],[b,d],[a,d],[a,c]]]);}
    offset+=(char==='.'?.7:2.5)+.8;
  }
  return clipping.union(...rectangles);
}
function roundedRectangle(width,height){
  const radius=3,ring=[];
  for(const [x,y,start]of [[width/2-radius,height/2-radius,0],[-width/2+radius,height/2-radius,90],[-width/2+radius,-height/2+radius,180],[width/2-radius,-height/2+radius,270]])for(let i=0;i<=16;i++){
    const angle=(start+i*90/16)*Math.PI/180;ring.push([round(x+radius*Math.cos(angle)),round(y+radius*Math.sin(angle))]);
  }
  return [...ring,ring[0]];
}
export function fitTestPlan(center){
  if(!Number.isFinite(center)||center<5||center>15||Math.abs(center*10-Math.round(center*10))>1e-6)throw Error('Choose a center hole from 5 to 15 mm, in steps of 0.1 mm.');
  const value=Math.round(center*10),parity=value%2,first=Math.max(50+parity,Math.min(142-parity,value-4));
  const sizes=Array.from({length:5},(_,i)=>(first+i*2)/10),largest=sizes.at(-1),cell=largest+6,width=round(cell*5+8),depth=round(largest+14),thickness=2,relief=.6;
  const holes=sizes.map((diameter,i)=>({diameter,x:round(-width/2+4+cell*(i+.5)),y:3.5}));
  const outline=roundedRectangle(width,depth),openings=holes.map(({diameter,x,y})=>[shaftOpening(diameter).map(([px,py])=>[round(px+x),round(py+y)])]);
  const base=clipping.difference([[outline]],...openings);
  const labels=holes.map(({diameter,x})=>({text:diameter.toFixed(1),polygons:labelPolygons(diameter.toFixed(1),x,-depth/2+4)}));
  return {center,sizes,width,depth,thickness,relief,holes,base,labels};
}
export function makeFitTestSTL(center){
  const plan=fitTestPlan(center),letters=clipping.union(...plan.labels.map(label=>label.polygons));
  return extrudeLayers([{height:plan.thickness,polygons:plan.base},{height:plan.thickness+plan.relief,polygons:letters}]);
}
