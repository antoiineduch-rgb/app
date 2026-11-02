self.onmessage = ({ data }) => {
  const { id, heights, n, step } = data;
  try {
    self.postMessage({ id, progress: 0.1 });
    const buffer = makeSTL(new Float32Array(heights), n, step);
    self.postMessage({ id, buffer }, [buffer]);
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Could not prepare the STL.' });
  }
};
