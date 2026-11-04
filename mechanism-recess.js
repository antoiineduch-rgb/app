import clipping from 'polygon-clipping';
import {artworkSurfaceHeight} from './svg-details.js';
export const RECESS_SKIN=1.2;
const snap=x=>Math.round(x*1e6)/1e6;
export function recessDimensions(settings){
  const width=settings.recessWidth??55,height=settings.recessHeight??55,depth=settings.recessDepth??5.5,clearance=settings.recessClearance??.5;
  if(![width,height,depth,clearance].every(Number.isFinite)||width<5||width>90||height<5||height>90||depth<.5||depth>8||clearance<0||clearance>2)throw Error('Rear pocket: choose valid movement dimensions, 0.5–8 mm depth, and 0–2 mm clearance.');
  return {width:width+clearance*2,height:height+clearance*2,depth,clearance};
}
export function movementRectangle(width,height,radius){
  if(!radius)return [[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2],[-width/2,-height/2]]];
  const points=[];
  for(const [x,y,start]of [[width/2-radius,height/2-radius,0],[-width/2+radius,height/2-radius,90],[-width/2+radius,-height/2+radius,180],[width/2-radius,-height/2+radius,270]])for(let i=0;i<=12;i++){
    const a=(start+i*90/12)*Math.PI/180;points.push([snap(x+radius*Math.cos(a)),snap(y+radius*Math.sin(a))]);
  }
  points.push(points[0]);return [points];
}
const area=polygons=>polygons.reduce((sum,p)=>sum+p.reduce((part,r,i)=>{let a=0;for(let j=0;j<r.length-1;j++)a+=r[j][0]*r[j+1][1]-r[j+1][0]*r[j][1];return part+(i?-1:1)*Math.abs(a/2);},0),0);
export function withMechanismRecess(layers,settings,shaft){
  if(!settings.mechanismRecess)return layers;
  const {width,height,depth,clearance}=recessDimensions(settings),roof=depth+RECESS_SKIN;
  if(roof>artworkSurfaceHeight(settings)+1e-6)throw Error(`Rear pocket: leave at least ${RECESS_SKIN} mm of material in front. Increase face/backing thickness to at least ${Number(roof.toFixed(1))} mm or reduce pocket depth.`);
  const support=layers.find(layer=>layer.height>=roof-1e-6)?.polygons;
  const filled=support?.length?clipping.union(support,[[shaft]]):[];
  const required=[movementRectangle(width+RECESS_SKIN*2,height+RECESS_SKIN*2,0)];
  if(!filled.length||area(clipping.difference(required,filled))>1e-5)throw Error('Rear pocket: the movement does not fit inside solid material at this depth. Add a thick round backing, reduce the pocket size, or use a shallower recess.');
  const pocket=[movementRectangle(width,height,Math.min(1,clearance*2))],result=[];let low=0;
  for(const layer of layers){
    if(layer.height<=depth+1e-7)result.push({...layer,polygons:clipping.difference(layer.polygons,pocket)});
    else if(low<depth-1e-7){result.push({height:depth,polygons:clipping.difference(layer.polygons,pocket)});result.push({...layer,closeUnderside:true});}
    else result.push({...layer,...(Math.abs(low-depth)<1e-7?{closeUnderside:true}:{})});
    low=layer.height;
  }
  return result;
}
