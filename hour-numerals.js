import clipping from 'polygon-clipping';

// These are original, built-in monoline glyphs. Their polygon outlines are
// shared by the on-screen preview and printable mesh, without platform fonts.
const snap = value => { const result=Math.round(value * 1e6) / 1e6; return result===0?0:result; };
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const geometryCache = new Map();
const wordCache = new Map();

function path(start, commands) {
  const points = [start];
  for (const command of commands) {
    if (command.length === 2) points.push(command);
    else {
      const [cx,cy,x,y] = command, [ax,ay] = points.at(-1);
      for (let i=1;i<=10;i++) {
        const t=i/10,s=1-t;
        points.push([s*s*ax+2*s*t*cx+t*t*x,s*s*ay+2*s*t*cy+t*t*y]);
      }
    }
  }
  return points;
}
function ellipse(cx,cy,rx,ry) {
  return Array.from({length:41},(_,i)=>{
    const angle=i/40*Math.PI*2;
    return [cx+rx*Math.cos(angle),cy+ry*Math.sin(angle)];
  });
}
const SIX = path([5.1,9.5],[[3.9,10.7,2.1,9.5],[.4,8.2,.4,4.1],[.4,0,3,0],[5.6,0,5.6,3.1],[5.6,6,3,6],[.6,6,.6,3.1]]);
const GLYPHS = {
  '0': {width:6,paths:[ellipse(3,5,2.5,5)]},
  '1': {width:4,paths:[[[.5,8.4],[2,10],[2,0]],[[.5,0],[3.5,0]]]},
  '2': {width:6,paths:[path([.5,8],[[.6,10,3,10],[5.5,10,5.5,7.8],[5.5,6.3,3.2,4.3],[.5,0],[5.7,0]])]},
  '3': {width:6,paths:[path([.6,9],[[1.6,10,3.1,10],[5.5,10,5.5,7.6],[5.5,5.2,3,5],[5.6,5,5.6,2.5],[5.6,0,3.1,0],[1.5,0,.5,1]])]},
  '4': {width:6,paths:[[[4.7,0],[4.7,10],[.4,3.7],[5.9,3.7]]]},
  '5': {width:6,paths:[path([5.5,10],[[.6,10],[.6,5.5],[3.3,6.6,4.9,5],[6,3.6,5.3,1.8],[4.5,-.9,2.2,.1],[1.2,.4,.5,1.1]])]},
  '6': {width:6,paths:[SIX]},
  '7': {width:6,paths:[[[.3,10],[5.7,10],[1.5,0]]]},
  '8': {width:6,paths:[ellipse(3,7.5,2.3,2.5),ellipse(3,2.5,2.6,2.5)]},
  '9': {width:6,paths:[SIX.map(([x,y])=>[6-x,10-y])]},
  I: {width:1.4,paths:[[[.7,0],[.7,10]]]},
  V: {width:6,paths:[[[.2,10],[3,0],[5.8,10]]]},
  X: {width:6,paths:[[[.2,10],[5.8,0]],[[.2,0],[5.8,10]]]},
};

function bounded(value,min,max,fallback) {
  return Number.isFinite(value) ? Math.min(max,Math.max(min,value)) : fallback;
}
function configuration(settings) {
  const diameter=bounded(settings?.diameter,20,1000,200);
  const style=settings?.hourStyle==='roman'?'roman':settings?.hourStyle==='arabic'?'arabic':null;
  return {diameter,style,size:bounded(settings?.numberSize,70,130,100),position:bounded(settings?.numberPosition,80,120,100)};
}
function capsule(a,b,radius) {
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),ring=[];
  for(let i=0;i<=12;i++){
    const t=angle-Math.PI/2+i*Math.PI/12;
    ring.push([snap(b[0]+radius*Math.cos(t)),snap(b[1]+radius*Math.sin(t))]);
  }
  for(let i=0;i<=12;i++){
    const t=angle+Math.PI/2+i*Math.PI/12;
    ring.push([snap(a[0]+radius*Math.cos(t)),snap(a[1]+radius*Math.sin(t))]);
  }
  ring.push(ring[0]);
  return [ring];
}
function strokeWordPolygons(text,height,centerX,centerY,padding) {
  const stroke=1.4,scale=height/(10+stroke),radius=stroke*scale/2+padding;
  const advance=1.25;
  const width=[...text].reduce((sum,letter)=>sum+GLYPHS[letter].width+advance,0)-advance;
  let offset=-width/2;
  const strokes=[];
  for(const letter of text){
    const glyph=GLYPHS[letter];
    for(const points of glyph.paths)for(let i=1;i<points.length;i++){
      const a=[centerX+(points[i-1][0]+offset)*scale,centerY+(points[i-1][1]-5)*scale];
      const b=[centerX+(points[i][0]+offset)*scale,centerY+(points[i][1]-5)*scale];
      if(Math.hypot(a[0]-b[0],a[1]-b[1])>1e-9)strokes.push(capsule(a,b,radius));
    }
    offset+=glyph.width+advance;
  }
  return clipping.union(...strokes);
}
function numberPolygons(text,height,centerX,centerY,padding) {
  if(padding)return strokeWordPolygons(text,height,centerX,centerY,padding);
  // Unpadded lettering is affine geometry. Compile the small built-in word set
  // once, then scale/translate its outlines while the size/position sliders move.
  // Padded clearances are generated separately when preparing the print file.
  if(!wordCache.has(text))wordCache.set(text,strokeWordPolygons(text,11.4,0,0,0));
  const scale=height/11.4;
  return wordCache.get(text).map(polygon=>polygon.map(ring=>ring.map(([x,y])=>[snap(centerX+x*scale),snap(centerY+y*scale)])));
}

// Labels are upright in Cartesian millimeters (positive Y points toward 12).
// Positive padding grows every stroke for texture clearance or a supporting
// footprint. It never changes the placement or orientation of the labels.
export function hourNumeralLabels(settings,padding=0) {
  const {diameter,style,size,position}=configuration(settings);
  if(!style)return [];
  if(!Number.isFinite(padding)||padding<0||padding>5)throw new RangeError('Hour numeral padding must be between 0 and 5 mm.');
  const key=JSON.stringify([diameter,style,size,position,padding]);
  if(geometryCache.has(key))return geometryCache.get(key);
  const labels=[],radius=diameter*.30*position/100,height=diameter*.065*size/100;
  for(let hour=1;hour<=12;hour++){
    const angle=hour/12*Math.PI*2,x=snap(Math.sin(angle)*radius),y=snap(Math.cos(angle)*radius),text=style==='roman'?ROMAN[hour-1]:String(hour);
    labels.push({hour,text,x,y,height,polygons:numberPolygons(text,height,x,y,padding)});
  }
  geometryCache.set(key,labels);
  if(geometryCache.size>16)geometryCache.delete(geometryCache.keys().next().value);
  return labels;
}

export function hourNumeralPolygons(settings,padding=0) {
  const labels=hourNumeralLabels(settings,padding);
  return labels.length?clipping.union(...labels.map(label=>label.polygons)):[];
}

export function hourNumeralMarkup(settings,padding=0) {
  const diameter=configuration(settings).diameter,scale=400/diameter;
  return hourNumeralLabels(settings,padding).map(({hour,text,polygons})=>{
    const d=polygons.map(polygon=>polygon.map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${(200+x*scale).toFixed(5)} ${(200-y*scale).toFixed(5)}`).join('')+'Z').join('')).join('');
    return `<path data-hour="${hour}" aria-label="${text}" d="${d}" fill-rule="evenodd"/>`;
  }).join('');
}
