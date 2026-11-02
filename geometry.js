export const designs = [
  {id:'petal',name:'Petal',description:'Soft curves. Warm tones. A sunny disposition.'},
  {id:'round',name:'Essential',description:'A clean silhouette. A timeless kind of simple.'},
  {id:'arch',name:'Arch',description:'An architectural little moment for your wall.'},
  {id:'wave',name:'Wave',description:'Easy rhythms. A playful change of pace.'},
  {id:'squircle',name:'Soft square',description:'Rounded edges. A fresh perspective on time.'},
  {id:'sun',name:'Sunburst',description:'A little sunshine, whatever the hour.'}
];
export function shapePath(id) {
  if(id==='arch') return 'M65 330V175 A135 135 0 0 1 335 175V330Q335 350 315 350H85Q65 350 65 330Z';
  if(id==='squircle') return 'M105 35H295Q365 35 365 105V295Q365 365 295 365H105Q35 365 35 295V105Q35 35 105 35Z';
  const points=[];
  for(let i=0;i<720;i++){
    const a=i/720*Math.PI*2;
    const r=id==='round'?168:id==='petal'?155+17*Math.cos(12*a):id==='wave'?151+20*Math.sin(6*a):153+18*Math.cos(24*a);
    points.push(`${i?'L':'M'}${(200+r*Math.cos(a)).toFixed(2)} ${(200+r*Math.sin(a)).toFixed(2)}`);
  }
  return points.join('')+'Z';
}
