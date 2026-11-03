import { traceContours } from './contours.js';

// Use the exact same contour bounds as the clock mesh, including its half-pixel
// antialiasing. This keeps a 3MF texture registered after fitting or rotation.
export function artworkFrame(alpha, n, diameter) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const ring of traceContours(alpha,n))for(const [x,y]of ring){
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  }
  const span=Math.max(maxX-minX,maxY-minY);
  if(!Number.isFinite(span)||span<=0)throw Error('The SVG has no printable artwork.');
  return {scale:diameter/span,cx:(minX+maxX)/2,cy:(minY+maxY)/2,n};
}

const luminance=(r,g,b)=>.2126*r+.7152*g+.0722*b;

// The dominant painted color acts as the background, so white lettering on a
// dark badge and dark lettering on paper both become raised detail by default.
// RGB distance also retains differences between colors of equal brightness.
export function artworkRelief(rgba, alpha, n, mode='contrast') {
  if(!ArrayBuffer.isView(rgba)||rgba.length!==n*n*4||alpha?.length!==n*n)throw Error('The SVG detail image is incomplete.');
  if(!['contrast','dark','light'].includes(mode))throw Error('Choose a valid SVG relief style.');
  const histogram=new Uint32Array(32768);
  let dominant=0,dominantCount=0,minLight=255,maxLight=0,count=0;
  for(let i=0;i<alpha.length;i++)if(alpha[i]>=240){
    const p=i*4,r=rgba[p],g=rgba[p+1],b=rgba[p+2],key=(r>>3)*1024+(g>>3)*32+(b>>3);
    if(++histogram[key]>dominantCount){dominant=key;dominantCount=histogram[key];}
    const light=luminance(r,g,b);minLight=Math.min(minLight,light);maxLight=Math.max(maxLight,light);count++;
  }
  // Thin/translucent artwork still has a footprint; use its painted pixels when
  // no fully opaque samples exist. Do not treat transparent black as artwork.
  const opaque=count>0,cutoff=opaque?240:128;
  if(!opaque)for(let i=0;i<alpha.length;i++)if(alpha[i]>=cutoff){
    const p=i*4,r=rgba[p],g=rgba[p+1],b=rgba[p+2],key=(r>>3)*1024+(g>>3)*32+(b>>3);
    if(++histogram[key]>dominantCount){dominant=key;dominantCount=histogram[key];}
    const light=luminance(r,g,b);minLight=Math.min(minLight,light);maxLight=Math.max(maxLight,light);
  }
  let red=0,green=0,blue=0,samples=0;
  for(let i=0;i<alpha.length;i++)if(alpha[i]>=cutoff){
    const p=i*4,r=rgba[p],g=rgba[p+1],b=rgba[p+2];
    if((r>>3)*1024+(g>>3)*32+(b>>3)===dominant){red+=r;green+=g;blue+=b;samples++;}
  }
  if(!samples)return null;
  red/=samples;green/=samples;blue/=samples;
  const distance=(r,g,b)=>Math.sqrt(.2126*(r-red)**2+.7152*(g-green)**2+.0722*(b-blue)**2);
  let maxDistance=0;
  if(mode==='contrast')for(let i=0;i<alpha.length;i++)if(alpha[i]>=cutoff){
    const p=i*4;maxDistance=Math.max(maxDistance,distance(rgba[p],rgba[p+1],rgba[p+2]));
  }
  const range=maxLight-minLight;
  if((mode==='contrast'?maxDistance:range)<4)return null;
  const relief=new Uint8Array(n*n);
  for(let i=0;i<alpha.length;i++)if(alpha[i]>=128){
    const p=i*4,r=rgba[p],g=rgba[p+1],b=rgba[p+2],light=luminance(r,g,b);
    const value=mode==='contrast'?distance(r,g,b)/maxDistance:mode==='dark'?(maxLight-light)/range:(light-minLight)/range;
    relief[i]=Math.min(255,Math.max(0,Math.round(value*255)),alpha[i]);
  }
  return relief;
}
