import { makeClockSTL } from './mesh.js';
import { stlTo3MF } from './export-3mf.js';
import { analyzeSTL } from './mesh-analysis.js';

self.onmessage = ({ data }) => {
  const { id, alpha, n, settings, stlBuffer, artwork } = data;
  try {
    const mesh = stlBuffer || makeClockSTL(new Uint8Array(alpha), n, settings, stage => self.postMessage({ id, stage }), artwork);
    const stats=data.stats||analyzeSTL(mesh);
    if(settings.exportFormat==='3mf'){
      self.postMessage({id,stage:'package'});
      const buffer=stlTo3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62',artwork:artwork?.texture});
      self.postMessage({id,buffer,stlBuffer:mesh,stats},[buffer,mesh]);
    }else self.postMessage({id,buffer:mesh,stats},[mesh]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the print file.' });
  }
};
