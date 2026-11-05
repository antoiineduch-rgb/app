import clipping from 'polygon-clipping';
import {artworkSurfaceHeight} from './svg-details.js';
import {recessDimensions,movementRectangle} from './mechanism-recess.js';
import {flatFrontOnBed} from './artwork-surface.js';
export {raisedMechanismBox,flatMechanismBox,flatFrontOnBed} from './artwork-surface.js';

export function boxDimensions(settings){
  let dimensions;
  try{dimensions=recessDimensions(settings);}catch(error){throw Error(error.message.replace('Rear pocket:','Rear box:').replace('depth','height'));}
  const wall=settings.mechanismWall??1.6;
  if(!Number.isFinite(wall)||wall<1.2||wall>4)throw Error('Rear box: choose a wall thickness from 1.2 to 4 mm.');
  return {...dimensions,wall,outerWidth:dimensions.width+wall*2,outerHeight:dimensions.height+wall*2};
}
const area=polygons=>polygons.reduce((sum,p)=>sum+p.reduce((part,r,i)=>{let a=0;for(let j=0;j<r.length-1;j++)a+=r[j][0]*r[j+1][1]-r[j+1][0]*r[j][1];return part+(i?-1:1)*Math.abs(a/2);},0),0);
const turnOver=polygons=>polygons.map(p=>p.map(r=>r.map(([x,y])=>[x,-y]).reverse()));

// The box is open at the rear. Its floor is the existing clock plate; only
// four vertical walls are added, without hollowing or thickening that plate.
export function withMechanismBox(layers,settings,shaft){
  const {width,height,depth,clearance,wall,outerWidth,outerHeight}=boxDimensions(settings),radius=Math.min(1,clearance*2);
  const outer=[movementRectangle(outerWidth,outerHeight,radius+wall)],inside=[movementRectangle(width,height,radius)];
  const base=layers[0].polygons,filled=clipping.union(base,[[shaft]]);
  if(area(clipping.difference(outer,filled))>1e-5)throw Error('Rear box: the movement box needs a solid clock face beneath it. Add a round backing or reduce the movement dimensions.');
  const walls=clipping.difference(outer,inside);
  if(area(clipping.intersection(walls,[[shaft]]))>1e-5)throw Error('Rear box: the movement opening must be large enough to keep the shaft hole clear. Increase the movement width or height.');
  if(flatFrontOnBed(settings)){
    const face=artworkSurfaceHeight(settings);
    // A proper half-turn about X keeps lettering readable on the underside.
    // A uniform face also supports the full round backing from the first layer.
    return [{height:face,polygons:turnOver(base)},{height:face+depth,polygons:turnOver(walls)}];
  }
  return [{height:depth,polygons:walls},...layers.map((layer,i)=>({...layer,height:layer.height+depth,...(i===0?{closeUnderside:true}:{})}))];
}
