const rgb=color=>[1,3,5].map(at=>parseInt(color.slice(at,at+2),16));
const brightness=color=>(color[0]*.2126+color[1]*.7152+color[2]*.0722)/255;
export function defaultHourInk(settings){
  return settings.hourColor==='dark'||settings.hourColor==='auto'&&brightness(rgb(settings.faceColor||'#C47F62'))>.58?'#24382D':'#F5E5CD';
}
export function hourInkColors(rgba,n,frame,layout,settings){
  if(settings.hourColor!=='auto'||settings.svgDetail==='silhouette')return Object.fromEntries(layout.labels.map(label=>[label.hour,defaultHourInk(settings)]));
  // Sample the unpainted SVG, rather than counting newly added numerals.
  // Prefer existing source inks so readable hours do not consume an AMS slot.
  const histogram=new Map(),step=Math.max(1,Math.floor(n/64));
  for(let y=0;y<n;y+=step)for(let x=0;x<n;x+=step){const at=(y*n+x)*4;if(rgba[at+3]<240)continue;const color='#'+[0,1,2].map(k=>rgba[at+k].toString(16).padStart(2,'0')).join('').toUpperCase();histogram.set(color,(histogram.get(color)||0)+1);}
  const colors=[...histogram].filter(([,count])=>count>=3).sort((a,b)=>brightness(rgb(a[0]))-brightness(rgb(b[0])));
  const dark=colors.length&&brightness(rgb(colors[0][0]))<.55?colors[0][0]:'#24382D',light=colors.length&&brightness(rgb(colors.at(-1)[0]))>.75?colors.at(-1)[0]:'#F5E5CD';
  const dominant=[...histogram].sort((a,b)=>b[1]-a[1])[0]?.[0]||settings.faceColor||'#C47F62',base=rgb(dominant);
  return Object.fromEntries(layout.labels.map(label=>{
    let sum=0,count=0;
    for(const polygon of label.polygons)for(const ring of polygon)for(let i=0;i<ring.length;i+=Math.max(1,Math.floor(ring.length/16))){
      const [x,y]=ring[i],px=Math.round(x/frame.scale+frame.cx),py=Math.round(frame.cy-y/frame.scale),at=(py*n+px)*4,inside=px>=0&&py>=0&&px<n&&py<n,a=inside?rgba[at+3]/255:0;
      sum+=brightness(base.map((value,k)=>inside?rgba[at+k]*a+value*(1-a):value));count++;
    }
    return [label.hour,sum/Math.max(1,count)>.58?dark:light];
  }));
}
