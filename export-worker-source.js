import { makeClockSTL } from './mesh.js';
import { stlTo3MF } from './export-3mf.js';
import { analyzeSTL } from './mesh-analysis.js';
import { stlToBambu3MF } from './export-bambu.js';
import {filamentPaint,dominantArtworkColor} from './bambu-paint.js';
import {makeFitTestSTL} from './hole-fit.js';

self.onmessage = ({ data }) => {
  const { id, alpha, n, settings, stlBuffer, artwork } = data;
  try {
    if(data.operation==='fit-test'){
      const buffer=makeFitTestSTL(data.center);self.postMessage({id,buffer},[buffer]);return;
    }
    if(data.operation==='filament-proof'){
      const base=settings.bambuBackColor==='background'?dominantArtworkColor(artwork.painting,settings.faceColor):settings.faceColor;
      const paint=filamentPaint(artwork.painting,base,settings.filamentCount,{mips:false});
      self.postMessage({id,palette:paint.palette,map:paint.map,width:paint.width},[paint.map.buffer]);return;
    }
    const mesh = stlBuffer || makeClockSTL(new Uint8Array(alpha), n, settings, stage => self.postMessage({ id, stage }), artwork);
    const stats=data.stats||analyzeSTL(mesh);
    if(settings.exportFormat==='3mf'){
      self.postMessage({id,stage:'package'});
      let buffer,palette=null;
      if(settings.threeMFTarget==='bambu-a1'){
        self.postMessage({id,stage:'filaments'});
        const result=stlToBambu3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62',painting:artwork?.painting,analysis:artwork?.analysis,maxColors:settings.filamentCount||4,backColor:settings.bambuBackColor,colorOverrides:settings.bambuColors});buffer=result.buffer;palette=result.palette;
      }else buffer=stlTo3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62',artwork:artwork?.texture});
      self.postMessage({id,buffer,stlBuffer:mesh,stats,palette},[buffer,mesh]);
    }else self.postMessage({id,buffer:mesh,stats},[mesh]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the print file.' });
  }
};
