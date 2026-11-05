// WebGL DataTextures start at the lower-left; the artwork raster starts at
// the upper-left. Reverse rows once so SVG lettering keeps its orientation.
export function filamentTexture(map,width,colors){
  const bytes=new Uint8Array(colors.length*4);
  colors.forEach((color,i)=>{for(let k=0;k<3;k++)bytes[i*4+k]=parseInt(color.slice(1+k*2,3+k*2),16);bytes[i*4+3]=255;});
  const palette=new Uint32Array(bytes.buffer),pixels=new Uint32Array(width*width);
  for(let y=0;y<width;y++){const source=y*width,target=(width-1-y)*width;for(let x=0;x<width;x++)pixels[target+x]=palette[map[source+x]];}
  return new Uint8Array(pixels.buffer);
}
