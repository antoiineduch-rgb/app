import { makeClockSTL } from './mesh.js';

self.onmessage = ({ data }) => {
  const { id, alpha, n, settings } = data;
  try {
    const buffer = makeClockSTL(new Uint8Array(alpha), n, settings, stage => self.postMessage({ id, stage }));
    self.postMessage({ id, buffer }, [buffer]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the STL.' });
  }
};
