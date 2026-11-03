export function analyzeSTL(buffer){
  const view=buffer instanceof ArrayBuffer?new DataView(buffer):ArrayBuffer.isView(buffer)?new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength):null;
  if(!view||view.byteLength<84)throw Error('The print model is incomplete.');
  const count=view.getUint32(80,true);
  if(!count||view.byteLength!==84+count*50)throw Error('The print model has an invalid triangle count.');
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],ids=new Map(),parents=[],ranks=[];
  let volume=0,surfaceArea=0;
  const root=id=>{while(parents[id]!==id){parents[id]=parents[parents[id]];id=parents[id];}return id;};
  const connect=(a,b)=>{a=root(a);b=root(b);if(a===b)return;if(ranks[a]<ranks[b])[a,b]=[b,a];parents[b]=a;if(ranks[a]===ranks[b])ranks[a]++;};
  function vertex(point){
    const key=point.join(',');let id=ids.get(key);
    if(id===undefined){id=parents.length;ids.set(key,id);parents.push(id);ranks.push(0);}
    return id;
  }
  for(let i=0;i<count;i++){
    const points=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)));
    for(const p of points)for(let k=0;k<3;k++){
      if(!Number.isFinite(p[k]))throw Error('The print model contains invalid coordinates.');
      min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);
    }
    const [a,b,c]=points,u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]);
    surfaceArea+=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    const [ia,ib,ic]=points.map(vertex);connect(ia,ib);connect(ia,ic);
  }
  let components=0;for(let i=0;i<parents.length;i++)if(root(i)===i)components++;
  return {triangles:count,vertices:parents.length,components,min,max,dimensions:max.map((value,i)=>value-min[i]),volume:Math.abs(volume),surfaceArea,bytes:view.byteLength};
}
export function bedFit(dimensions,width,depth,clearance=0){
  if(!Array.isArray(dimensions)||dimensions.length<2||![...dimensions.slice(0,2),width,depth,clearance].every(Number.isFinite)||width<=0||depth<=0||clearance<0)throw Error('Enter valid build plate dimensions.');
  const [x,y]=dimensions,fit=(a,b)=>a+clearance*2<=width+.05&&b+clearance*2<=depth+.05;
  return {fits:fit(x,y)||fit(y,x),rotated:!fit(x,y)&&fit(y,x)};
}
