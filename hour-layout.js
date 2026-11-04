import clipping from 'polygon-clipping';
import {hourNumeralLabels} from './hour-numerals.js';
import {usesSVGBacking} from './svg-details.js';
const snap=value=>Math.round(value*1e6)/1e6;
export const autoHourFit=settings=>settings.design==='custom'&&settings.hourFit===true&&settings.markers;
function tickLabels(settings,padding=0){
  const result=[],d=settings.diameter;
  for(let hour=1;hour<=12;hour++){
    const length=d*(hour%3===0?17:10)/400,w=d*5/400+padding*2,h=length+padding*2,r=Math.min(w*.35,h*.15),radius=d*.31-length/2,angle=hour*Math.PI/6,s=Math.sin(angle),c=Math.cos(angle),x=s*radius,y=c*radius,ring=[];
    for(const [cx,cy,start]of [[w/2-r,h/2-r,0],[-w/2+r,h/2-r,90],[-w/2+r,-h/2+r,180],[w/2-r,-h/2+r,270]])for(let j=0;j<=5;j++){
      const a=(start+j*18)*Math.PI/180,px=cx+r*Math.cos(a),py=cy+r*Math.sin(a);ring.push([snap(x+px*c+py*s),snap(y-px*s+py*c)]);
    }
    ring.push(ring[0]);result.push({hour,text:String(hour),x,y,height:h,polygons:[[ring]]});
  }
  return result;
}
const sourceLabels=(settings,padding=0)=>['arabic','roman'].includes(settings.hourStyle)?hourNumeralLabels(settings,padding):tickLabels(settings,padding);
const bounds=polygons=>{const b=[Infinity,Infinity,-Infinity,-Infinity];for(const polygon of polygons)for(const ring of polygon)for(const [x,y]of ring){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}return b;};
function footprint(alpha,n,frame,settings){
  if(usesSVGBacking(settings))return b=>Math.max(...[[b[0],b[1]],[b[0],b[3]],[b[2],b[1]],[b[2],b[3]]].map(([x,y])=>Math.hypot(x,y)))<=settings.diameter/2-.6;
  const stride=n+1,invalid=new Uint32Array(stride*stride);
  for(let y=0;y<n;y++){let row=0;for(let x=0;x<n;x++){row+=alpha[y*n+x]<128?1:0;invalid[(y+1)*stride+x+1]=invalid[y*stride+x+1]+row;}}
  return b=>{
    const x0=Math.floor(b[0]/frame.scale+frame.cx),x1=Math.ceil(b[2]/frame.scale+frame.cx),y0=Math.floor(frame.cy-b[3]/frame.scale),y1=Math.ceil(frame.cy-b[1]/frame.scale);
    if(x0<0||y0<0||x1>=n||y1>=n)return false;
    return invalid[(y1+1)*stride+x1+1]-invalid[y0*stride+x1+1]-invalid[(y1+1)*stride+x0]+invalid[y0*stride+x0]===0;
  };
}
export function fitHourLayout(alpha,n,frame,settings){
  const originals=sourceLabels(settings);if(!settings.markers)return {labels:[],missing:[],scale:1};
  if(!autoHourFit(settings))return {labels:originals.map(label=>({...label,scale:1})),missing:[],scale:1};
  const inside=footprint(alpha,n,frame,settings),clearance=.6,step=Math.max(.4,settings.diameter/350),maxRadius=settings.diameter*.8;
  const minimum=settings.hourStyle==='ticks'?Math.min(1,.6/(settings.diameter*5/400)):Math.min(1,4.2/(originals[0]?.height||4.2));
  const limits=originals.map(label=>{const b=bounds(label.polygons);return {label,b:[b[0]-label.x,b[1]-label.y,b[2]-label.x,b[3]-label.y]};});
  let best={labels:[],missing:originals.map(l=>l.hour),scale:1};
  for(let scale=1;;scale=Math.max(minimum,scale*.9)){
    const options=limits.map(({label,b})=>{
      const angle=label.hour*Math.PI/6,s=Math.sin(angle),c=Math.cos(angle),preferred=Math.hypot(label.x,label.y),radii=[preferred];
      for(let r=step;r<=maxRadius;r+=step){if(preferred-r>0)radii.push(preferred-r);if(preferred+r<=maxRadius)radii.push(preferred+r);}
      const candidates=[];
      for(const radius of radii){
        const x=s*radius,y=c*radius,box=[x+b[0]*scale-clearance,y+b[1]*scale-clearance,x+b[2]*scale+clearance,y+b[3]*scale+clearance];
        const nearX=box[0]<=0&&box[2]>=0?0:Math.min(Math.abs(box[0]),Math.abs(box[2])),nearY=box[1]<=0&&box[3]>=0?0:Math.min(Math.abs(box[1]),Math.abs(box[3]));
        if(Math.hypot(nearX,nearY)>settings.hole/2+.6&&inside(box))candidates.push({x,y,box});
      }
      return {label,candidates};
    }).sort((a,b)=>a.candidates.length-b.candidates.length||a.label.hour-b.label.hour);
    const placed=[];
    for(const {label,candidates}of options){
      const candidate=candidates.find(({box:a})=>placed.every(({box:b})=>a[2]+.3<b[0]||b[2]+.3<a[0]||a[3]+.3<b[1]||b[3]+.3<a[1]));
      if(candidate){const {x,y,box}=candidate,polygons=label.polygons.map(p=>p.map(r=>r.map(([px,py])=>[snap(x+(px-label.x)*scale),snap(y+(py-label.y)*scale)])));placed.push({...label,x:snap(x),y:snap(y),scale,box,polygons});}
    }
    if(placed.length>best.labels.length)best={labels:placed.sort((a,b)=>a.hour-b.hour),missing:originals.filter(l=>!placed.some(p=>p.hour===l.hour)).map(l=>l.hour),scale};
    if(placed.length===12||scale===minimum)return best;
  }
}
export function fittedHourPolygons(settings,layout,padding=0){
  if(!layout.labels.length)return [];
  if(!padding)return clipping.union(...layout.labels.map(label=>label.polygons));
  const originals=sourceLabels(settings,padding/layout.scale);
  return clipping.union(...layout.labels.map(placed=>{
    const original=originals.find(label=>label.hour===placed.hour);return original.polygons.map(p=>p.map(r=>r.map(([x,y])=>[snap(placed.x+(x-original.x)*placed.scale),snap(placed.y+(y-original.y)*placed.scale)])));
  }));
}
export function hourLayoutMarkup(layout,project,colors=null){
  return layout.labels.map(label=>`<path data-hour="${label.hour}" aria-label="${label.text}"${colors?` fill="${colors[label.hour]}"`:''} d="${label.polygons.map(p=>p.map(r=>r.map(([x,y],i)=>{const point=project(x,y);return `${i?'L':'M'}${point[0]} ${point[1]}`;}).join('')+'Z').join('')).join('')}" fill-rule="evenodd"/>`).join('');
}
