import { makeClockSTL } from './mesh.js';
import { stlTo3MF } from './export-3mf.js';
import { analyzeSTL } from './mesh-analysis.js';
import { stlToBambu3MF } from './export-bambu.js';

self.onmessage = ({ data }) => {
  const { id, alpha, n, settings, stlBuffer, artwork } = data;
  try {
    const mesh = stlBuffer || makeClockSTL(new Uint8Array(alpha), n, settings, stage => self.postMessage({ id, stage }), artwork);
    const stats=data.stats||analyzeSTL(mesh);
    if(settings.exportFormat==='3mf'){
      self.postMessage({id,stage:'package'});
      let buffer,palette=null;
      if(settings.threeMFTarget==='bambu-a1'){
        self.postMessage({id,stage:'filaments'});
        const result=stlToBambu3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62',painting:artwork?.painting,maxColors:settings.filamentCount||4,backColor:settings.bambuBackColor});buffer=result.buffer;palette=result.palette;
      }else buffer=stlTo3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62',artwork:artwork?.texture});
      self.postMessage({id,buffer,stlBuffer:mesh,stats,palette},[buffer,mesh]);
    }else self.postMessage({id,buffer:mesh,stats},[mesh]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the print file.' });
  }
};
