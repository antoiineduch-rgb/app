import earcut from 'earcut';
import polygonClipping from 'polygon-clipping';

// Resolve geometry well below printer tolerances, then share the exact Float32
// coordinates that will be stored in STL. Shared seams therefore stay shared
// after serialization, including at clipped texture and hour-marker edges.
const SNAP = 1e5;
const SEAM_EPSILON = 5e-5;
const coordinate = value => Math.fround(Math.round(value * SNAP) / SNAP);
const ringArea = ring => ring.reduce((sum,p,i) => {
  const q=ring[(i+1)%ring.length]; return sum+p[0]*q[1]-q[0]*p[1];
},0)/2;

function normalize(polygons) {
  if(!Array.isArray(polygons)) throw new TypeError('Layer geometry must be a MultiPolygon.');
  const result=[];
  for(const polygon of polygons) {
    if(!Array.isArray(polygon)) throw new TypeError('Invalid polygon.');
    const rings=[];
    for(let r=0;r<polygon.length;r++) {
      if(!Array.isArray(polygon[r])) throw new TypeError('Invalid polygon ring.');
      const ring=[];
      for(const point of polygon[r]) {
        if(!Array.isArray(point)||point.length<2||!Number.isFinite(point[0])||!Number.isFinite(point[1])) throw new RangeError('Polygon coordinates must be finite.');
        const p=[coordinate(point[0]),coordinate(point[1])],last=ring.at(-1);
        if(!last||last[0]!==p[0]||last[1]!==p[1]) ring.push(p);
      }
      if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
      if(ring.length<3||Math.abs(ringArea(ring))<1e-10) {
        if(r===0)break;
        continue;
      }
      if((ringArea(ring)>0)!==(r===0))ring.reverse();
      rings.push(ring);
    }
    if(rings.length)result.push(rings);
  }
  return result;
}

function pointTree(points,depth=0) {
  if(!points.length)return null;
  const axis=depth%2;
  points.sort((a,b)=>a[axis]-b[axis]);
  const middle=points.length>>1,point=points[middle];
  const left=pointTree(points.slice(0,middle),depth+1),right=pointTree(points.slice(middle+1),depth+1);
  return {point,left,right,
    minX:Math.min(point[0],left?.minX??Infinity,right?.minX??Infinity),
    minY:Math.min(point[1],left?.minY??Infinity,right?.minY??Infinity),
    maxX:Math.max(point[0],left?.maxX??-Infinity,right?.maxX??-Infinity),
    maxY:Math.max(point[1],left?.maxY??-Infinity,right?.maxY??-Infinity)};
}

function segmentInBox(a,b,node) {
  let low=0,high=1;
  for(let axis=0;axis<2;axis++) {
    const min=(axis?node.minY:node.minX)-SEAM_EPSILON,max=(axis?node.maxY:node.maxX)+SEAM_EPSILON;
    const direction=b[axis]-a[axis];
    if(Math.abs(direction)<1e-15) {if(a[axis]<min||a[axis]>max)return false;}
    else {
      const t1=(min-a[axis])/direction,t2=(max-a[axis])/direction;
      low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));
      if(low>high)return false;
    }
  }
  return true;
}

function pointsOnSegment(tree,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy,result=[];
  if(length2<SEAM_EPSILON*SEAM_EPSILON)return result;
  function visit(node) {
    if(!node||!segmentInBox(a,b,node))return;
    const p=node.point,t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2;
    if(t>1e-9&&t<1-1e-9) {
      const cross=dx*(p[1]-a[1])-dy*(p[0]-a[0]);
      if(cross*cross<=SEAM_EPSILON*SEAM_EPSILON*length2)result.push([t,p]);
    }
    visit(node.left);visit(node.right);
  }
  visit(tree);result.sort((a,b)=>a[0]-b[0]);return result.map(item=>item[1]);
}

function cross(a,b,c) {
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  return [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
}

export function extrudeLayers(input) {
  if(!Array.isArray(input)||!input.length)throw new RangeError('At least one mesh layer is required.');
  let previous=0;
  const layers=input.map(layer=>{
    if(!Number.isFinite(layer.height)||layer.height<=previous)throw new RangeError('Layer heights must be positive and increasing.');
    previous=layer.height;
    return {height:Math.fround(layer.height),polygons:normalize(layer.polygons)};
  });
  if(!layers[0].polygons.length)throw new RangeError('The clock face has no printable area.');
  const vertices=[],vertexIds=new Map(),xyPoints=new Map(),xyCells=new Map(),triangles=[];
  function canonicalXY(x,y) {
    x=coordinate(x);y=coordinate(y);
    const cellX=Math.floor(x/SEAM_EPSILON),cellY=Math.floor(y/SEAM_EPSILON);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const point of xyCells.get(`${cellX+dx},${cellY+dy}`)||[]) {
      if(Math.hypot(point[0]-x,point[1]-y)<=SEAM_EPSILON)return point;
    }
    const point=[x,y],key=`${cellX},${cellY}`;
    if(!xyCells.has(key))xyCells.set(key,[]);
    xyCells.get(key).push(point);xyPoints.set(`${x},${y}`,point);return point;
  }
  function vertex(x,y,z) {
    [x,y]=canonicalXY(x,y);z=Math.fround(z);
    const key=`${x},${y},${z}`;
    if(vertexIds.has(key))return vertexIds.get(key);
    const id=vertices.length;vertices.push([x,y,z]);vertexIds.set(key,id);
    return id;
  }
  function triangle(a,b,c) {
    if(a===b||b===c||c===a)return;
    const n=cross(vertices[a],vertices[b],vertices[c]);
    if(Math.hypot(...n)>1e-12)triangles.push(a,b,c);
  }
  function cap(polygons,z,up) {
    for(const polygon of polygons) {
      const flat=[],holes=[],ids=[];
      polygon.forEach((ring,index)=>{
        const ringIds=[];
        for(const p of ring){const id=vertex(p[0],p[1],z);if(ringIds.at(-1)!==id)ringIds.push(id);}
        if(ringIds.length>1&&ringIds[0]===ringIds.at(-1))ringIds.pop();
        if(ringIds.length<3)return;
        if(index)holes.push(ids.length);
        for(const id of ringIds){const p=vertices[id];flat.push(p[0],p[1]);ids.push(id);}
      });
      const indices=earcut(flat,holes,2);
      for(let i=0;i<indices.length;i+=3) {
        let a=ids[indices[i]],b=ids[indices[i+1]],c=ids[indices[i+2]];
        if((cross(vertices[a],vertices[b],vertices[c])[2]>0)!==up)[b,c]=[c,b];
        triangle(a,b,c);
      }
    }
  }
  cap(layers[0].polygons,0,false);
  for(let i=0;i<layers.length;i++) {
    const {polygons,height}=layers[i],low=i?layers[i-1].height:0,next=layers[i+1]?.polygons;
    const exposed=next?.length?normalize(polygonClipping.difference(polygons,next)):polygons;
    cap(exposed,height,true);
    for(const polygon of polygons)for(const ring of polygon)for(let j=0;j<ring.length;j++) {
      const a=ring[j],b=ring[(j+1)%ring.length];
      const al=vertex(a[0],a[1],low),bl=vertex(b[0],b[1],low),ah=vertex(a[0],a[1],height),bh=vertex(b[0],b[1],height);
      triangle(al,bl,bh);triangle(al,bh,ah);
    }
  }

  // Earcut may remove collinear ring vertices. Clipping also adds intersections
  // to one level but not its neighbor. Insert the same split chain into every
  // horizontal edge, so both incident surfaces serialize matching seam edges.
  const tree=pointTree([...xyPoints.values()]),splitCache=new Map(),repaired=[];
  function splits(a,b) {
    const pa=vertices[a],pb=vertices[b];
    if(pa[2]!==pb[2])return [];
    const aKey=`${pa[0]},${pa[1]}`,bKey=`${pb[0]},${pb[1]}`,forward=aKey<bKey;
    const key=forward?`${aKey}|${bKey}`:`${bKey}|${aKey}`;
    if(!splitCache.has(key))splitCache.set(key,pointsOnSegment(tree,forward?pa:pb,forward?pb:pa));
    const points=splitCache.get(key),ordered=forward?points:[...points].reverse();
    return ordered.map(p=>vertex(p[0],p[1],pa[2]));
  }
  function repairedTriangle(a,b,c) {
    if(a===b||b===c||c===a)return;
    const n=cross(vertices[a],vertices[b],vertices[c]);
    if(Math.hypot(...n)>1e-12)repaired.push(a,b,c);
  }
  for(let i=0;i<triangles.length;i+=3) {
    const a=triangles[i],b=triangles[i+1],c=triangles[i+2],ab=splits(a,b),bc=splits(b,c),ca=splits(c,a);
    const changed=Number(ab.length>0)+Number(bc.length>0)+Number(ca.length>0);
    if(!changed){repairedTriangle(a,b,c);continue;}
    if(changed===1) {
      const edge=ab.length?[a,...ab,b]:bc.length?[b,...bc,c]:[c,...ca,a];
      const opposite=ab.length?c:bc.length?a:b;
      for(let j=0;j<edge.length-1;j++)repairedTriangle(opposite,edge[j],edge[j+1]);
    } else {
      const p=vertices[a],q=vertices[b],r=vertices[c];
      const center=vertex((p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3,(p[2]+q[2]+r[2])/3);
      const boundary=[a,...ab,b,...bc,c,...ca];
      for(let j=0;j<boundary.length;j++)repairedTriangle(center,boundary[j],boundary[(j+1)%boundary.length]);
    }
  }
  // A collapsed difference sliver can triangulate into coincident faces with
  // opposite winding. They enclose no volume and must not survive as an
  // internal, doubled surface after seam vertices have been welded.
  const triangleBuckets=new Map(),removed=new Set();
  for(let i=0;i<repaired.length;i+=3) {
    const ids=repaired.slice(i,i+3),sorted=[...ids].sort((a,b)=>a-b),key=sorted.join(',');
    const parity=(Number(ids[0]>ids[1])+Number(ids[0]>ids[2])+Number(ids[1]>ids[2]))%2;
    if(!triangleBuckets.has(key))triangleBuckets.set(key,[[],[]]);
    const bucket=triangleBuckets.get(key);
    if(bucket[1-parity].length){removed.add(bucket[1-parity].pop());removed.add(i);}
    else bucket[parity].push(i);
  }
  if(removed.size) {
    let target=0;
    for(let i=0;i<repaired.length;i+=3)if(!removed.has(i)){repaired[target++]=repaired[i];repaired[target++]=repaired[i+1];repaired[target++]=repaired[i+2];}
    repaired.length=target;
  }
  // A near-coincident clipped boundary may leave a flat, sub-tolerance flap
  // after cancellation. Remove it only if every one of its edges becomes
  // either absent or exactly two-sided afterward; never remove a real solid
  // face merely because it is small. Twenty microns is below contour accuracy.
  const incidence=new Map();
  const edgeKey=(a,b)=>a<b?`${a},${b}`:`${b},${a}`;
  function edgeIncidence(a,b) {
    const key=edgeKey(a,b);
    if(!incidence.has(key))incidence.set(key,{forward:0,reverse:0});
    return incidence.get(key);
  }
  for(let i=0;i<repaired.length;i+=3)for(let j=0;j<3;j++) {
    const a=repaired[i+j],b=repaired[i+(j+1)%3],edge=edgeIncidence(a,b);
    edge[a<b?'forward':'reverse']++;
  }
  const flaps=new Set();
  for(let i=0;i<repaired.length;i+=3) {
    const ids=repaired.slice(i,i+3),points=ids.map(id=>vertices[id]);
    if(points[0][2]!==points[1][2]||points[0][2]!==points[2][2])continue;
    const normal=cross(...points),maxEdge=Math.max(...points.map((p,j)=>Math.hypot(...p.map((value,k)=>value-points[(j+1)%3][k]))));
    if(Math.hypot(...normal)/maxEdge>.02)continue;
    const edges=ids.map((a,j)=>{
      const b=ids[(j+1)%3],edge=edgeIncidence(a,b),direction=a<b?'forward':'reverse';
      return {edge,direction,forward:edge.forward-(direction==='forward'?1:0),reverse:edge.reverse-(direction==='reverse'?1:0)};
    });
    if(!edges.every(({forward,reverse})=>(forward===0&&reverse===0)||(forward===1&&reverse===1)))continue;
    flaps.add(i);
    for(const {edge,direction}of edges)edge[direction]--;
  }
  if(flaps.size) {
    let target=0;
    for(let i=0;i<repaired.length;i+=3)if(!flaps.has(i)){repaired[target++]=repaired[i];repaired[target++]=repaired[i+1];repaired[target++]=repaired[i+2];}
    repaired.length=target;
  }
  for(const edge of incidence.values())if((edge.forward!==0||edge.reverse!==0)&&(edge.forward!==1||edge.reverse!==1)) {
    throw new Error('The artwork produced an unclosed surface. Try a simpler outline or a smooth texture.');
  }
  const count=repaired.length/3,buffer=new ArrayBuffer(84+count*50),view=new DataView(buffer);
  new Uint8Array(buffer,0,80).set(new TextEncoder().encode('Clock Factory | smooth contour mesh | millimeters | flat side down'));
  view.setUint32(80,count,true);
  for(let i=0;i<count;i++) {
    const a=vertices[repaired[i*3]],b=vertices[repaired[i*3+1]],c=vertices[repaired[i*3+2]],n=cross(a,b,c),length=Math.hypot(...n);
    let offset=84+i*50;
    for(const value of [n[0]/length,n[1]/length,n[2]/length,...a,...b,...c]) {view.setFloat32(offset,value,true);offset+=4;}
  }
  return buffer;
}
