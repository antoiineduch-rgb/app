// Interoperability format: Bambu Studio's paint_color stores a per-facet binary
// subdivision tree. Splits change paint only, never the validated print mesh.
// Format reference: bambulab/BambuStudio, TriangleSelector::perform_split and
// FacetsAnnotation::get_triangle_as_string. This encoder is implemented locally.
const rgb=hex=>[1,3,5].map(at=>parseInt(hex.slice(at,at+2),16));
const hex=color=>'#'+color.map(value=>Math.round(value).toString(16).padStart(2,'0')).join('').toUpperCase();
const distance=(a,b)=>.2126*(a[0]-b[0])**2+.7152*(a[1]-b[1])**2+.0722*(a[2]-b[2])**2;
const bin=(r,g,b)=>(r>>3)*1024+(g>>3)*32+(b>>3);
function composite(data,at,base){const a=data[at+3]/255;return [0,1,2].map(k=>Math.round(data[at+k]*a+base[k]*(1-a)));}

export function dominantArtworkColor(raster,fallback){
  if(!raster)return fallback;
  const {rgba}=raster,counts=new Uint32Array(32768),sums=[new Float64Array(32768),new Float64Array(32768),new Float64Array(32768)];
  let mode=0,best=0;
  for(let at=0;at<rgba.length;at+=4)if(rgba[at+3]>=240){const key=bin(rgba[at],rgba[at+1],rgba[at+2]);if(++counts[key]>best){best=counts[key];mode=key;}for(let k=0;k<3;k++)sums[k][key]+=rgba[at+k];}
  return best?hex(sums.map(values=>values[mode]/best)):fallback;
}

export function filamentPaint(raster,baseColor,maxColors=4){
  if(![2,4,8,16].includes(maxColors))throw Error('Choose 2, 4, 8, or 16 filaments.');
  if(typeof baseColor!=='string'||!/^#[0-9a-f]{6}$/i.test(baseColor))throw Error('Choose a valid back color.');
  const base=rgb(baseColor);
  if(!raster)return {palette:[hex(base)],map:null,mips:null};
  const {rgba,width,height}=raster;
  if(!(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray)||!Number.isInteger(width)||width<2||width>2048||height!==width||rgba.length!==width*height*4)throw Error('The SVG filament-color image is incomplete.');
  const counts=new Uint32Array(32768),sums=[new Float64Array(32768),new Float64Array(32768),new Float64Array(32768)];
  let total=0;
  for(let at=0;at<rgba.length;at+=4)if(rgba[at+3]>=128){const color=composite(rgba,at,base),key=bin(...color);counts[key]++;total++;for(let k=0;k<3;k++)sums[k][key]+=color[k];}
  const samples=[];
  for(let key=0;key<counts.length;key++)if(counts[key])samples.push({key,count:counts[key],color:sums.map(values=>values[key]/counts[key])});
  let centers=[base];
  while(centers.length<maxColors){
    let selected=null,best=0;
    for(const sample of samples){const gap=Math.min(...centers.map(center=>distance(sample.color,center))),score=gap*sample.count;if(gap>64&&score>best){best=score;selected=sample;}}
    if(!selected)break;centers.push(selected.color);
  }
  const nearest=(color,values)=>{let index=0,best=Infinity;for(let i=0;i<values.length;i++){const d=distance(color,values[i]);if(d<best){index=i;best=d;}}return index;};
  for(let iteration=0;iteration<6;iteration++){
    const groups=centers.map(()=>({sum:[0,0,0],count:0}));
    for(const sample of samples){const group=groups[nearest(sample.color,centers)];group.count+=sample.count;for(let k=0;k<3;k++)group.sum[k]+=sample.color[k]*sample.count;}
    centers=centers.map((color,i)=>i&&groups[i].count?groups[i].sum.map(value=>value/groups[i].count):color);
  }
  const representatives=centers.map(()=>({mass:0,mode:null}));
  for(const sample of samples){const group=representatives[nearest(sample.color,centers)];group.mass+=sample.count;if(!group.mode||sample.count>group.mode.count)group.mode=sample;}
  const colors=[base];
  // Retain actual dominant SVG colors instead of averaging flat fills into
  // invented shades. Tiny antialiasing-only clusters do not consume AMS slots.
  for(const group of representatives.slice(1).sort((a,b)=>b.mass-a.mass))if(group.mode&&group.mass>=Math.max(1,total*.0005)&&!colors.some(color=>distance(color,group.mode.color)<16))colors.push(group.mode.color);
  const palette=colors.map(hex),lookup=new Uint8Array(32768);
  for(const sample of samples)lookup[sample.key]=nearest(sample.color,colors);
  const map=new Uint8Array(width*height);
  for(let i=0;i<map.length;i++)if(rgba[i*4+3]>=128)map[i]=lookup[bin(...composite(rgba,i*4,base))];
  const mips=[{width,data:Uint16Array.from(map,value=>1<<value)}];
  while(mips.at(-1).width>1){
    const previous=mips.at(-1),size=Math.ceil(previous.width/2),data=new Uint16Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let mask=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(x*2+dx<previous.width&&y*2+dy<previous.width)mask|=previous.data[(y*2+dy)*previous.width+x*2+dx];
      data[y*size+x]=mask;
    }
    mips.push({width:size,data});
  }
  return {palette,map,mips,width};
}

export function filamentCode(index){
  if(!Number.isInteger(index)||index<0||index>=16)throw Error('The filament index is invalid.');
  const state=index+1;
  return state<3?(state*4).toString(16).toUpperCase():(state-3).toString(16).toUpperCase()+'C';
}

function uniformRectangle(paint,minX,minY,maxX,maxY,bit){
  const last=paint.mips.length-1;
  function visit(level,x,y){
    const mip=paint.mips[level];if(x>=mip.width||y>=mip.width)return true;
    const span=2**level,left=x*span,top=y*span,right=left+span-1,bottom=top+span-1;
    if(right<minX||bottom<minY||left>maxX||top>maxY)return true;
    const mask=mip.data[y*mip.width+x];
    if((mask&~bit)===0)return true;
    if(level===0||(left>=minX&&top>=minY&&right<=maxX&&bottom<=maxY))return false;
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(!visit(level-1,x*2+dx,y*2+dy))return false;
    return true;
  }
  return visit(last,0,0);
}

export function paintFacet(points,frame,paint,budget={nodes:0}){
  if(!paint.map)return filamentCode(0);
  if(!frame||frame.n!==paint.width||![frame.scale,frame.cx,frame.cy].every(Number.isFinite)||frame.scale<=0)throw Error('The SVG filament colors have an invalid placement.');
  const project=point=>[point[0]/frame.scale+frame.cx,frame.cy-point[1]/frame.scale];
  const sample=(x,y)=>paint.map[Math.max(0,Math.min(paint.width-1,Math.floor(y)))*paint.width+Math.max(0,Math.min(paint.width-1,Math.floor(x)))];
  const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  // Quarter-millimeter paint precision; independent of the geometry sampling.
  const tolerance=.25/frame.scale;
  function split(vertices,depth){
    if(++budget.nodes>2000000)throw Error('The SVG color map is too complex. Choose fewer filaments or simplify its smallest details.');
    const centroid=[0,1].map(k=>(vertices[0][k]+vertices[1][k]+vertices[2][k])/3),color=sample(...centroid);
    const bounds=[0,1].map(k=>[Math.floor(Math.min(...vertices.map(p=>p[k]))),Math.floor(Math.max(...vertices.map(p=>p[k])))]);
    const lengths=vertices.map((a,i)=>{const b=vertices[(i+1)%3];return (a[0]-b[0])**2+(a[1]-b[1])**2;});
    const longest=Math.max(...lengths);
    if(longest<=tolerance*tolerance||depth>=20||uniformRectangle(paint,bounds[0][0],bounds[1][0],bounds[0][1],bounds[1][1],1<<color))return {code:filamentCode(color),color};
    const special=(lengths.indexOf(longest)+2)%3,[a,b,c]=[0,1,2].map(i=>vertices[(special+i)%3]),middle=midpoint(b,c);
    const left=split([a,b,middle],depth+1),right=split([middle,c,a],depth+1);
    if(left.color>=0&&left.color===right.color)return left;
    return {code:left.code+right.code+(special*4+1).toString(16).toUpperCase(),color:-1};
  }
  return split(points.map(project),0).code;
}
