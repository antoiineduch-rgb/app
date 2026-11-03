import { makeClockSTL } from './mesh.js';
import { stlTo3MF } from './export-3mf.js';

self.onmessage = ({ data }) => {
  const { id, alpha, n, settings, stlBuffer } = data;
  try {
    const mesh = stlBuffer || makeClockSTL(new Uint8Array(alpha), n, settings, stage => self.postMessage({ id, stage }));
    if(settings.exportFormat==='3mf'){
      self.postMessage({id,stage:'package'});
      const buffer=stlTo3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor||'#C47F62'});
      self.postMessage({id,buffer,stlBuffer:mesh},[buffer,mesh]);
    }else self.postMessage({id,buffer:mesh},[mesh]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the print file.' });
  }
};
