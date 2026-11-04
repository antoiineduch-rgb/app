import clipping from 'polygon-clipping';
import { traceContours, simplifyRing } from './contours.js';
import { extrudeLayers } from './mesh-extrusion.js';
import { hourNumeralPolygons } from './hour-numerals.js';
import { artworkRelief,artworkFrame,usesSVGBacking,backingDepth,artworkSurfaceHeight } from './svg-details.js';

const CURVE_ERROR = .02;
const snap = value => Math.round(value*1e6)/1e6;

function area(ring) {
  let sum=0;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++)sum+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];
  return sum/2;
}
function contains(point,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function closed(ring,positive=true) {
  if((area(ring)>0)!==positive)ring.reverse();
  const points=ring.map(([x,y])=>[snap(x),snap(y)]);
  return [...points,points[0]];
}

function silhouette(alpha,n,diameter,frame=null,threshold=127.5) {
  const source=traceContours(alpha,n,threshold);
  if(!source.length){if(frame)return {polygons:[],frame};throw Error('This shape has no printable filled area. Try another SVG.');}
  if(source.length>4096)throw Error('This SVG has too many separate details. Simplify its smallest shapes before exporting.');
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const ring of source)for(const [x,y]of ring){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const span=Math.max(maxX-minX,maxY-minY);
  frame ||= {scale:diameter/span,cx:(minX+maxX)/2,cy:(minY+maxY)/2};
  const {scale,cx,cy}=frame;
  if(!Number.isFinite(scale)||span<=0)throw Error('The SVG outline could not be measured.');
  const rings=source.map(ring=>simplifyRing(ring,CURVE_ERROR/scale).map(([x,y])=>[(x-cx)*scale,(cy-y)*scale]))
    .filter(ring=>ring.length>=3&&Math.abs(area(ring))>1e-6)
    .map(ring=>({ring,size:Math.abs(area(ring)),depth:0,parent:null,polygon:null}))
    .sort((a,b)=>b.size-a.size);
  const result=[];
  for(let i=0;i<rings.length;i++){
    const entry=rings[i];
    for(let j=i-1;j>=0;j--)if(contains(entry.ring[0],rings[j].ring)){entry.parent=rings[j];entry.depth=rings[j].depth+1;break;}
    if(entry.depth%2===0){entry.polygon=[closed(entry.ring)];result.push(entry.polygon);}
    else entry.parent.polygon.push(closed(entry.ring,false));
  }
  return {polygons:result,frame};
}

// Preserve a narrow, smooth rim around all outer edges and SVG cutouts. The
// same fitting frame is retained; shrinking a detail mask never resizes it.
function insetAlpha(alpha,n,radius) {
  const output=new Uint8Array(alpha.length),offsets=[];
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)if(x*x+y*y<=radius*radius)offsets.push(y*n+x);
  for(let y=radius;y<n-radius;y++)for(let x=radius;x<n-radius;x++){
    const index=y*n+x;if(alpha[index]<128)continue;
    let value=255;
    for(const offset of offsets){value=Math.min(value,alpha[index+offset]);if(!value)break;}
    output[index]=value;
  }
  return output;
}

function circle(radius,error=CURVE_ERROR,minimum=32) {
  const count=Math.ceil(Math.max(minimum,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-error/radius))))/4)*4;
  return Array.from({length:count+1},(_,i)=>{const a=(i%count)/count*Math.PI*2;return [snap(radius*Math.cos(a)),snap(radius*Math.sin(a))];});
}
function markerPolygons(diameter,padding=0) {
  const result=[];
  for(let i=0;i<12;i++){
    const originalLength=diameter*(i%3===0?17:10)/400;
    const width=diameter*5/400+padding*2,length=originalLength+padding*2,radius=Math.min(width*.35,length*.15),y=diameter*.31-originalLength/2;
    const ring=[];
    for(const [cx,cy,start]of[[width/2-radius,y+length/2-radius,0],[-width/2+radius,y+length/2-radius,90],[-width/2+radius,y-length/2+radius,180],[width/2-radius,y-length/2+radius,270]]){
      for(let j=0;j<=5;j++){const a=(start+j*18)*Math.PI/180;ring.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a)]);}
    }
    const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);
    result.push([closed(ring.map(([x,y])=>[x*c-y*s,x*s+y*c]))]);
  }
  return result;
}
function ripplePolygons(diameter) {
  const result=[];
  // Narrow circular ridges replace the old square, 2 mm wide voxel bands.
  for(let radius=2;radius<diameter*.72;radius+=2){
    const outer=circle(radius+.4),inner=circle(Math.max(.1,radius-.4));
    result.push([outer,inner.reverse()]);
  }
  return result;
}
function hatchPolygons(diameter) {
  const strips=[],reach=diameter*.75,halfWidth=.25;
  for(const angle of [Math.PI/4,-Math.PI/4]){
    const ux=Math.cos(angle),uy=Math.sin(angle),nx=-uy,ny=ux;
    for(let offset=-reach;offset<=reach;offset+=4){
      const ring=[[-reach,offset-halfWidth],[reach,offset-halfWidth],[reach,offset+halfWidth],[-reach,offset+halfWidth]].map(([t,u])=>[t*ux+u*nx,t*uy+u*ny]);
      strips.push([closed(ring)]);
    }
  }
  return clipping.union(...strips);
}

export function buildClockLayers(alpha,n,settings,progress=()=>{},artwork=null) {
  if(!Number.isInteger(n)||n<2||!alpha||alpha.length!==n*n)throw Error('The outline image must be a square pixel grid.');
  const {diameter,hole,texture,markers}=settings,thickness=artworkSurfaceHeight(settings),backed=usesSVGBacking(settings);
  if(![diameter,settings.thickness,thickness,hole].every(value=>Number.isFinite(value)&&value>0)||!['smooth','ripple','grain'].includes(texture))throw Error('The clock dimensions or texture are invalid.');
  progress('outline');
  const {polygons:outline,frame}=silhouette(alpha,n,diameter,backed?artworkFrame(alpha,n,diameter,settings):null);
  // An analytic 128+ segment shaft circle maintains the requested fit without
  // stair-stepping or smoothing the hole into an undersized opening.
  const base=clipping.difference(outline,[[circle(hole/2,.001,128)]]);
  if(!base.length)throw Error('The center opening covers the entire clock face.');
  const layers=backed?[
    {height:backingDepth(settings),polygons:clipping.difference([[circle(diameter/2,CURVE_ERROR,128)]],[[circle(hole/2,.001,128)]])},
    {height:thickness,polygons:base}
  ]:[{height:thickness,polygons:base}];
  progress('details');
  const detailed=!!artwork?.rgba&&settings.design==='custom'&&settings.svgDetail!=='silhouette';
  if(texture==='smooth'&&!markers&&!detailed)return layers;
  const rimPixels=Math.max(1,Math.ceil(.3/frame.scale));
  const detailOutline=silhouette(insetAlpha(alpha,n,rimPixels),n,diameter,frame).polygons;
  const detailRegion=detailOutline.length?clipping.difference(detailOutline,[[circle(hole/2+.3,.001,128)]]):[];
  const useNumerals=['arabic','roman'].includes(settings.hourStyle);
  const markerShapes=markers?(useNumerals?hourNumeralPolygons(settings):markerPolygons(diameter)):[];
  const markerOutline=markers?silhouette(insetAlpha(alpha,n,rimPixels+1),n,diameter,frame).polygons:[];
  const markerRegion=markerOutline.length?clipping.difference(markerOutline,[[circle(hole/2+.3+frame.scale,.001,128)]]):[];
  const ticks=markers&&markerRegion.length?clipping.intersection(markerRegion,markerShapes):[];
  if(detailed){
    const height=settings.svgRelief??.8;
    if(!Number.isFinite(height)||height<0||height>2)throw Error('SVG relief must be between 0 and 2 mm.');
    const relief=height>0?artworkRelief(artwork.rgba,alpha,n,settings.svgTone||'contrast'):null;
    let top=thickness,previous=detailRegion;
    if(relief&&detailRegion.length){
      const steps=Math.max(1,Math.min(8,Math.round(height/.2)));
      for(let level=1;level<=steps;level++){
        const region=silhouette(relief,n,diameter,frame,(level-.5)*255/steps).polygons;
        // Keep all levels nested, including after contour simplification. Each
        // step is part of the same solid, never a floating illustration layer.
        const detail=region.length&&previous.length?clipping.intersection(previous,region):[];
        previous=detail;
        const raised=ticks.length?(detail.length?clipping.union(detail,ticks):ticks):detail;
        if(raised.length){top=thickness+height*level/steps;layers.push({height:top,polygons:raised});}
      }
    }
    if(ticks.length)layers.push({height:top+.8,polygons:ticks});
    return layers;
  }
  if(texture!=='smooth'){
    let pattern=texture==='ripple'?ripplePolygons(diameter):hatchPolygons(diameter);
    // Union the patterns before clipping them to the face. Unioning separately
    // clipped patterns can produce nearly coincident perimeter edges.
    let first=[];
    if(useNumerals&&markers){
      // Keep a clean halo around the lettering. Texture cannot intersect or
      // touch a glyph stroke, which also keeps small numerals legible in print.
      pattern=clipping.difference(pattern,hourNumeralPolygons(settings,.6));
      const textureArea=detailRegion.length?clipping.intersection(detailRegion,pattern):[];
      first=textureArea.length&&ticks.length?clipping.union(textureArea,ticks):ticks.length?ticks:textureArea;
    }else{
      const foundation=markers?clipping.union(pattern,markerPolygons(diameter,.15)):pattern;
      first=detailRegion.length?clipping.intersection(detailRegion,foundation):[];
    }
    if(first.length)layers.push({height:thickness+.4,polygons:first});
  }
  if(ticks.length)layers.push({height:thickness+.8,polygons:ticks});
  return layers;
}

export function makeClockSTL(alpha,n,settings,progress=()=>{},artwork=null) {
  const layers=buildClockLayers(alpha,n,settings,progress,artwork);
  progress('mesh');
  return extrudeLayers(layers);
}
