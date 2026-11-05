import clipping from 'polygon-clipping';
import {artworkSurfaceHeight} from './svg-details.js';
import {withMechanismRecess,recessDimensions} from './mechanism-recess.js';
import {boxDimensions} from './mechanism-box.js';
import {raisedMechanismBox} from './artwork-surface.js';
import {standDimensions,standPose} from './stand-settings.js';

const snap=value=>Math.round(value*1e6)/1e6;
const turnOver=polygons=>polygons.map(p=>p.map(r=>r.map(([x,y])=>[x,-y]).reverse()));
const area=polygons=>polygons.reduce((sum,p)=>sum+p.reduce((part,r,i)=>{let a=0;for(let j=0;j<r.length-1;j++)a+=r[j][0]*r[j+1][1]-r[j+1][0]*r[j][1];return part+(i?-1:1)*Math.abs(a/2);},0),0);

// A desk stand always prints with a flat front. Retain a recessed movement's
// opening, and make a round backing a fully supported plate from layer one.
export function flatStandPlate(layers,settings,shaft){
  const face=artworkSurfaceHeight(settings),cut=withMechanismRecess([{height:face,polygons:layers[0].polygons}],settings,shaft);
  return cut.map((layer,i)=>({height:snap(face-(i?cut[i-1].height:0)),polygons:turnOver(layer.polygons)})).reverse();
}
function supportShape(width,rib,low,high,centerX=0){
  const x=width/2,points=[[-x,low],[x,low],[x,high],[x-rib,high],[x-rib,low+rib],[-x+rib,low+rib],[-x+rib,high],[-x,high],[-x,low]];
  return [points.map(([px,py])=>[snap(px+centerX),snap(-py)]).reverse()];
}
function plateCenter(polygons){
  let total=0,x=0,y=0;
  for(const polygon of polygons)for(let r=0;r<polygon.length;r++){
    const ring=polygon[r];let twice=0,cx=0,cy=0;
    for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1],cross=a[0]*b[1]-b[0]*a[1];twice+=cross;cx+=(a[0]+b[0])*cross;cy+=(a[1]+b[1])*cross;}
    if(Math.abs(twice)<1e-8)continue;const weight=(r?-1:1)*Math.abs(twice);total+=weight;x+=weight*cx/(3*twice);y+=weight*cy/(3*twice);
  }
  return [x/total,y/total];
}
export function standLayout(layers,settings){
  const dimensions=standDimensions(settings),face=artworkSurfaceHeight(settings),foundation=layers.find(layer=>layer.height>=face-1e-6)?.polygons;
  if(!foundation?.length)throw Error('Desk stand: the clock needs a solid plate beneath its rear support.');
  let maxY=-Infinity;for(const polygon of foundation)for(const point of polygon[0])maxY=Math.max(maxY,point[1]);
  const bottom=-maxY,low=bottom+dimensions.depth*Math.tan(dimensions.lean*Math.PI/180);
  const center=plateCenter(foundation),contacts=foundation.flatMap(p=>p[0].filter(point=>point[1]>=maxY-.01).map(point=>point[0])),frontX=(Math.min(...contacts)+Math.max(...contacts))/2,angle=dimensions.lean*Math.PI/180;
  const centerDepth=-(center[1]+bottom)*Math.sin(angle)-face/2*Math.cos(angle),fraction=Math.max(.1,Math.min(.9,centerDepth/(dimensions.depth/Math.cos(angle))));
  const centerX=(center[0]-(1-fraction)*frontX)/fraction;
  let limit=-settings.hole/2-2;
  if(settings.mechanismRecess){const movementHeight=raisedMechanismBox(settings)?boxDimensions(settings).outerHeight:recessDimensions(settings).height;limit=Math.min(limit,-movementHeight/2-2);}
  if(limit-low<dimensions.rib*2+1.2)throw Error('Desk stand: there is not enough space below the mechanism. Use a round backing, reduce stand depth or lean, or increase clock size.');
  // Find solid attachment material on scalloped or rounded faces. The lower
  // wall can grow outward at at most 37° from vertical when printed face-down.
  for(let offset=0;offset<=dimensions.depth*.75;offset+=.5){
    const rootLow=low+offset,high=Math.min(rootLow+28,limit);if(high-rootLow<dimensions.rib*2+1.2)break;
    const root=[supportShape(dimensions.width,dimensions.rib,rootLow,high,centerX)];
    if(area(clipping.difference(root,foundation))<=1e-5)return {...dimensions,face,bottom,low,rootLow,high,centerX,root};
  }
  throw Error('Desk stand: its attachment needs solid material near the bottom of the clock. Use a round backing, reduce stand width, or increase its depth or lean.');
}
export function withDeskStand(layers,settings){
  if(!settings.deskStand)return layers;
  const plan=standLayout(layers,settings),{face,depth,width,rib,low,rootLow,high,centerX}=plan,top=face+depth;
  const shape=z=>{const t=Math.min(1,Math.max(0,(z-face)/depth));return [supportShape(width,rib,rootLow+(low-rootLow)*t,high+(low+rib*2-high)*t,centerX)];};
  const heights=[...new Set([...layers.map(layer=>layer.height),face,top])].sort((a,b)=>a-b),result=[];let previous=0;
  for(const height of heights){
    const original=layers.find(layer=>layer.height>=height-1e-6),clock=original?.polygons||[],active=previous>=face-1e-6&&height<=top+1e-6;
    const polygons=active?[...clock,...shape(previous)]:clock;
    result.push({height,polygons,...(active?{topPolygons:[...clock,...shape(height)]}:{}),...(original?.closeUnderside?{closeUnderside:true}:{})});previous=height;
  }
  return result;
}
// A geometric balance check, before hardware and slicer infill are added.
// Use the actual desk-contact polygon, not the clock's bounding rectangle.
export function validateStandBalance(buffer,settings){
  const view=new DataView(buffer),count=view.getUint32(80,true),face=artworkSurfaceHeight(settings),foot=face+standDimensions(settings).depth,candidates=[],moment=[0,0,0];
  let volume=0,maxY=-Infinity;
  for(let i=0;i<count;i++){
    const p=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true))),[a,b,c]=p;
    const v=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;volume+=v;
    for(let k=0;k<3;k++)moment[k]+=v*(a[k]+b[k]+c[k])/4;
    for(const point of p){maxY=Math.max(maxY,point[1]);if(Math.abs(point[2]-face)<1e-4||Math.abs(point[2]-foot)<1e-4)candidates.push(point);}
  }
  const pose=standPose(settings,-maxY,face),transform=p=>[p[0],p[1]*Math.cos(pose.rotation)-p[2]*Math.sin(pose.rotation)+pose.y,p[1]*Math.sin(pose.rotation)+p[2]*Math.cos(pose.rotation)+pose.z];
  const center=transform(moment.map(v=>v/volume)),unique=new Map();
  for(const p of candidates){const q=transform(p);if(Math.abs(q[2])<.02)unique.set(`${snap(q[0])},${snap(q[1])}`,[q[0],q[1]]);}
  const points=[...unique.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=values=>{const result=[];for(const p of values){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
  const lower=half(points),upper=half([...points].reverse()),hull=[...lower.slice(0,-1),...upper.slice(0,-1)];
  if(hull.length<3||hull.some((p,i)=>cross(p,hull[(i+1)%hull.length],center)<-1e-5))throw Error('Desk stand: the model’s center of mass lies outside its support. Increase stand depth or width, reduce backward lean, or use a round backing for uneven artwork.');
}
