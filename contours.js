// Marching-squares silhouettes from alpha samples at pixel centers. Coordinates
// are in pixel units, x right and y down; outer rings have positive signed area
// and holes negative area. Rings are closed implicitly (no repeated last point).
const CONTOUR_SEGMENTS = [
  [], [[0,3]], [[1,0]], [[1,3]], [[2,1]], [[0,3],[2,1]], [[2,0]], [[2,3]],
  [[3,2]], [[0,2]], [[1,0],[3,2]], [[1,2]], [[3,1]], [[0,1]], [[3,0]], [],
];

export function traceContours(alpha, n, threshold = 127.5) {
  if (!Number.isInteger(n) || n < 1 || n > 8192 || !alpha || alpha.length !== n*n || !(alpha instanceof Uint8Array || alpha instanceof Uint8ClampedArray)) {
    throw new RangeError('Alpha samples must be an n × n byte grid (up to 8192 pixels across).');
  }
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold >= 255) throw new RangeError('The contour threshold must be between 0 and 255.');
  // Avoid intersections exactly on a lattice vertex for integer thresholds.
  // The tiny inward nudge retains the usual alpha >= threshold interpretation.
  const iso = Number.isInteger(threshold) ? threshold - 1e-7 : threshold;
  const stride = n + 2;
  const samples = new Uint8Array(stride*stride);
  for (let y=0; y<n; y++) samples.set(alpha.subarray(y*n, (y+1)*n), (y+1)*stride+1);
  const next = new Map(), points = new Map();

  function vertex(edge, index, x, y, a, b, c, d) {
    // Horizontal and vertical edge IDs are unique and shared by adjacent cells.
    const key = edge === 0 ? index*2 : edge === 1 ? (index+1)*2+1 : edge === 2 ? (index+stride)*2 : index*2+1;
    if (!points.has(key)) {
      const point = edge === 0 ? [x-.5+(iso-a)/(b-a), y-.5]
        : edge === 1 ? [x+.5, y-.5+(iso-b)/(c-b)]
          : edge === 2 ? [x-.5+(iso-d)/(c-d), y+.5]
            : [x-.5, y-.5+(iso-a)/(d-a)];
      points.set(key, point);
      if (points.size > 1000000) throw new RangeError('This outline has too much detail. Simplify the SVG before exporting.');
    }
    return key;
  }

  for (let y=0; y<=n; y++) {
    let index=y*stride;
    for (let x=0; x<=n; x++,index++) {
      const a=samples[index],b=samples[index+1],c=samples[index+stride+1],d=samples[index+stride];
      const code=(a>=iso?1:0)|(b>=iso?2:0)|(c>=iso?4:0)|(d>=iso?8:0);
      for (const [from,to] of CONTOUR_SEGMENTS[code]) {
        next.set(vertex(from,index,x,y,a,b,c,d), vertex(to,index,x,y,a,b,c,d));
      }
    }
  }

  const rings=[];
  // One shared map iterator avoids repeatedly scanning deleted keys when an SVG
  // contains many disconnected islands. Each segment is consumed exactly once.
  for (const start of next.keys()) {
    if (!next.has(start)) continue;
    const ring=[];
    let current=start;
    do {
      const following=next.get(current);
      if (following===undefined) throw new Error('The SVG outline could not be closed. Try simplifying its smallest details.');
      ring.push(points.get(current));
      next.delete(current);
      current=following;
    } while (current!==start);
    if (ring.length>=3) rings.push(ring);
  }
  return rings;
}

function contourArea(ring) {
  let area=0;
  for (let i=0,j=ring.length-1; i<ring.length; j=i++) area+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];
  return area/2;
}

function pointSegmentDistanceSquared(point, a, b) {
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const length=dx*dx+dy*dy;
  const t=length ? Math.max(0, Math.min(1, ((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)) : 0;
  const x=point[0]-a[0]-t*dx,y=point[1]-a[1]-t*dy;
  return x*x+y*y;
}

// Closed Douglas-Peucker simplification. Two well-separated anchors prevent the
// coincident start/end of a closed ring from collapsing it into a single point.
// Tolerance is in the same units as the ring. Use a small tolerance for narrow
// imported details; simplification does not promise to retain sub-tolerance gaps.
export function simplifyRing(ring, tolerance) {
  if (!Array.isArray(ring) || ring.length<3 || ring.some(point=>!Array.isArray(point)||point.length<2||!Number.isFinite(point[0])||!Number.isFinite(point[1]))) {
    throw new RangeError('A contour must contain at least three finite points.');
  }
  if (!Number.isFinite(tolerance) || tolerance<0) throw new RangeError('Contour tolerance must be nonnegative.');
  if (!tolerance || ring.length===3) return ring.map(point=>[point[0],point[1]]);
  let anchor=0;
  for (let i=1;i<ring.length;i++) if (ring[i][0]<ring[anchor][0] || (ring[i][0]===ring[anchor][0] && ring[i][1]<ring[anchor][1])) anchor=i;
  const ordered=Array.from({length:ring.length+1}, (_,i)=>ring[(anchor+i)%ring.length]);
  let opposite=1,distance=0;
  for (let i=1;i<ring.length;i++) {
    const dx=ordered[i][0]-ordered[0][0],dy=ordered[i][1]-ordered[0][1],candidate=dx*dx+dy*dy;
    if (candidate>distance) { distance=candidate; opposite=i; }
  }
  const keep=new Uint8Array(ordered.length);
  keep[0]=keep[opposite]=keep[ring.length]=1;
  const stack=[0,opposite,opposite,ring.length],limit=tolerance*tolerance;
  while (stack.length) {
    const end=stack.pop(),start=stack.pop();
    let maximum=limit,farthest=-1;
    for (let i=start+1;i<end;i++) {
      const candidate=pointSegmentDistanceSquared(ordered[i],ordered[start],ordered[end]);
      if (candidate>maximum) { maximum=candidate; farthest=i; }
    }
    if (farthest>=0) { keep[farthest]=1; stack.push(start,farthest,farthest,end); }
  }
  const simplified=[];
  for (let i=0;i<ring.length;i++) if (keep[i]) simplified.push([ordered[i][0],ordered[i][1]]);
  if (simplified.length<3 || contourArea(simplified)*contourArea(ring)<=0) return ring.map(point=>[point[0],point[1]]);
  return simplified;
}
