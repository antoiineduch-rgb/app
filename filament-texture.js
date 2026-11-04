// WebGL DataTextures start at the lower-left; the artwork raster starts at
// the upper-left. Reverse rows once so SVG lettering keeps its orientation.
export function filamentTexture(map,width,colors){
  const rgb=colors.map(color=>[1,3,5].map(at=>parseInt(color.slice(at,at+2),16))),data=new Uint8Array(width*width*4);
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
    const color=rgb[map[y*width+x]],at=((width-1-y)*width+x)*4;
    data[at]=color[0];data[at+1]=color[1];data[at+2]=color[2];data[at+3]=255;
  }
  return data;
}
