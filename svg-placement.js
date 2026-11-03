const IDENTITY = [1, 0, 0, 1];
const OPERATIONS = {
  left: [0, -1, 1, 0],
  right: [0, 1, -1, 0],
  mirrorX: [-1, 0, 0, 1],
  mirrorY: [1, 0, 0, -1],
};

// Canvas/SVG matrix order: x' = a*x + c*y, y' = b*x + d*y.
// Restrict stored values to quarter turns and reflections so artwork cannot be
// stretched, translated off the canvas, or clipped by an arbitrary rotation.
export function normalizeOrientation(value) {
  if (!Array.isArray(value) || value.length !== 4 ||
      !value.every(number => Number.isInteger(number) && Math.abs(number) <= 1)) return [...IDENTITY];
  const [a,b,c,d] = value;
  if (a*a+b*b !== 1 || c*c+d*d !== 1 || a*c+b*d !== 0) return [...IDENTITY];
  return value.map(number => number === 0 ? 0 : number);
}

export function transformOrientation(current, action) {
  if (action === 'reset') return [...IDENTITY];
  const operation = OPERATIONS[action];
  if (!operation) throw new RangeError('Unknown artwork orientation action.');
  const [a,b,c,d] = normalizeOrientation(current), [oa,ob,oc,od] = operation;
  // Left multiplication applies each button operation in the current screen
  // axes, so “mirror horizontally” stays horizontal after a quarter turn.
  return normalizeOrientation([
    oa*a+oc*b, ob*a+od*b,
    oa*c+oc*d, ob*c+od*d,
  ]);
}

export function placementTransform(matrix) {
  return `translate(200 200) matrix(${normalizeOrientation(matrix).join(' ')} 0 0) translate(-200 -200)`;
}

export function drawPlacedArtwork(context, image, matrix) {
  const [a,b,c,d] = normalizeOrientation(matrix);
  context.save();
  try {
    context.translate(200, 200);
    context.transform(a, b, c, d, 0, 0);
    context.translate(-200, -200);
    context.drawImage(image, 0, 0, 400, 400);
  } finally { context.restore(); }
}
