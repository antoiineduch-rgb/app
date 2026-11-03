// Import self-contained SVG artwork without inserting its markup into the editor.
// Geometry is measured in an isolated shadow root, then rendered to an alpha
// silhouette shared by the preview and STL export.
export const SVG_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
const SVG_RASTER_SIZE = 2048;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_ELEMENTS = new Set(['svg','g','path','rect','circle','ellipse','polygon','polyline','line','defs','symbol','use','clipPath','mask','linearGradient','radialGradient','stop','pattern','text','tspan','textPath','image']);
const SVG_ATTRIBUTES = new Set(['id','class','d','x','y','width','height','cx','cy','r','rx','ry','x1','x2','y1','y2','points','transform','viewBox','preserveAspectRatio','maskUnits','maskContentUnits','clipPathUnits','gradientUnits','gradientTransform','patternUnits','patternContentUnits','patternTransform','offset','spreadMethod','lengthAdjust','textLength','startOffset','dx','dy','rotate','pathLength']);
const SVG_STYLES = new Set(['fill','fill-opacity','fill-rule','stroke','stroke-opacity','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','opacity','clip-path','clip-rule','mask','mask-type','display','visibility','color','font-family','font-size','font-style','font-weight','font-variant','letter-spacing','text-anchor','dominant-baseline','paint-order','vector-effect','transform','transform-origin','transform-box','stop-color','stop-opacity']);

function safePaint(value) {
  if (/\\|(?:https?:|file:|data:|\/\/|@|expression\s*\(|var\s*\()/i.test(value)) return false;
  for (const match of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    if (!/^#[^\s<>"']+$/.test(match[2])) return false;
  }
  return true;
}
function cleanStyle(source) {
  const result = [];
  for (const property of source) {
    const value = source.getPropertyValue(property);
    if (SVG_STYLES.has(property) && safePaint(value)) result.push(`${property}:${value}${source.getPropertyPriority(property) ? '!important' : ''}`);
  }
  return result.join(';');
}

function sanitizedSVG(source) {
  if (typeof source !== 'string' || source.length > SVG_IMPORT_MAX_BYTES || new TextEncoder().encode(source).byteLength > SVG_IMPORT_MAX_BYTES) throw Error('Please choose an SVG smaller than 5 MB.');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw Error('This file isn’t a valid SVG.');
  const output = document.createElementNS(SVG_NS, 'svg');
  let nodes = 0;
  const copy = (input, parent) => {
    if (++nodes > 10000) throw Error('This SVG has too many shapes. Simplify it in your SVG editor, then try again.');
    if (input.nodeType === Node.TEXT_NODE) {
      if (['text','tspan','textPath'].includes(parent.localName)) parent.append(document.createTextNode(input.textContent));
      return;
    }
    if (input.nodeType !== Node.ELEMENT_NODE) return;
    if (input.localName === 'style') {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(input.textContent);
      const rules = [...sheet.cssRules].filter(rule => rule.type === CSSRule.STYLE_RULE).map(rule => {
        const declarations = cleanStyle(rule.style);
        return declarations ? `${rule.selectorText}{${declarations}}` : '';
      }).join('\n');
      if (rules) { const style = document.createElementNS(SVG_NS, 'style'); style.textContent = rules; parent.append(style); }
      return;
    }
    if (!SVG_ELEMENTS.has(input.localName)) return;
    const element = input === doc.documentElement ? output : document.createElementNS(SVG_NS, input.localName);
    for (const attribute of input.attributes) {
      const name = attribute.localName, value = attribute.value;
      if (SVG_ATTRIBUTES.has(name)) element.setAttribute(name, value);
      else if (SVG_STYLES.has(name) && safePaint(value)) element.setAttribute(name, value);
      else if (name === 'style') {
        const parsed = document.createElement('span').style; parsed.cssText = value;
        const safe = cleanStyle(parsed); if (safe) element.setAttribute('style', safe);
      } else if (name === 'href') {
        if (/^#[^\s<>"']+$/.test(value) && ['use','textPath'].includes(input.localName)) element.setAttribute('href', value);
        else if (input.localName === 'image' && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) element.setAttribute('href', value);
      }
    }
    if (element !== output) parent.append(element);
    for (const child of input.childNodes) copy(child, element);
  };
  copy(doc.documentElement, output);
  // Limit internal references before allowing the browser to expand <use>.
  const ids = new Map([...output.querySelectorAll('[id]')].map(element => [element.id, element]));
  const costs = new Map();
  function cost(element, active = new Set(), depth = 0) {
    if (active.has(element) || depth > 32) throw Error('This SVG has circular or deeply nested shapes. Expand its symbols and try again.');
    if (costs.has(element)) return costs.get(element);
    active.add(element);
    let total = 1;
    for (const child of element.children) total += cost(child, active, depth + 1);
    const reference = element.localName === 'use' && ids.get(element.getAttribute('href')?.slice(1));
    if (reference) total += cost(reference, active, depth + 1);
    active.delete(element);
    if (total > 50000) throw Error('This SVG repeats too many shapes. Expand or simplify its symbols and try again.');
    costs.set(element, total); return total;
  }
  cost(output);
  return output;
}

async function svgImage(svg) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try { image.src = url; await image.decode(); return image; }
  catch { throw Error('The SVG could not be drawn. Try exporting a plain SVG from your editor.'); }
  finally { URL.revokeObjectURL(url); }
}

export async function prepareSVG(source) {
  const svg = sanitizedSVG(source);
  svg.setAttribute('width', String(SVG_RASTER_SIZE)); svg.setAttribute('height', String(SVG_RASTER_SIZE));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-100000px;top:0;opacity:0;pointer-events:none;width:${SVG_RASTER_SIZE}px;height:${SVG_RASTER_SIZE}px;`;
  host.attachShadow({ mode: 'closed' }).append(svg); document.body.append(host);
  try {
    // Percentages must be resolved against the original viewport. Leaving them
    // relative would move artwork again when the fitted viewBox is assigned.
    for (const element of svg.querySelectorAll('*')) {
      if (element.closest('symbol[viewBox]')) continue;
      for (const name of ['x','y','width','height','cx','cy','r','rx','ry','x1','x2','y1','y2','dx','dy']) {
        if (!element.getAttribute(name)?.includes('%')) continue;
        const value = element[name]?.baseVal;
        if (value && Number.isFinite(value.value)) element.setAttribute(name, String(value.value));
        else if (value && Number.isInteger(value.numberOfItems)) {
          const values = Array.from({length:value.numberOfItems}, (_,i) => value.getItem(i).value);
          if (values.every(Number.isFinite)) element.setAttribute(name, values.join(' '));
        }
      }
      const style = getComputedStyle(element);
      const viewport = element.nearestViewportElement || svg;
      const width = viewport.viewBox?.baseVal.width || viewport.width?.baseVal.value || 1024;
      const height = viewport.viewBox?.baseVal.height || viewport.height?.baseVal.value || 1024;
      const diagonal = Math.hypot(width,height)/Math.SQRT2;
      for (const property of ['stroke-width','stroke-dasharray','stroke-dashoffset']) {
        const value = style.getPropertyValue(property);
        if (value.includes('%')) element.style.setProperty(property, value.replace(/(-?(?:\d*\.)?\d+)%/g, (_match,number) => String(Number(number)*diagonal/100)), 'important');
      }
    }
    // An outer SVG transform is applied outside its viewBox. Move it inside
    // before measuring, otherwise fitting the viewBox can clip translated art.
    const outerTransform = getComputedStyle(svg).transform;
    if (outerTransform && outerTransform !== 'none') {
      const group = document.createElementNS(SVG_NS, 'g');
      for (const property of ['fill','fill-opacity','fill-rule','stroke','stroke-opacity','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','color','font-family','font-size','font-style','font-weight','letter-spacing','text-anchor','dominant-baseline','paint-order']) group.style.setProperty(property, 'inherit', 'important');
      for (const [property,value] of [['opacity','1'],['clip-path','none'],['mask','none'],['display','inline'],['visibility','inherit'],['transform',outerTransform],['transform-origin','0 0']]) group.style.setProperty(property, value, 'important');
      group.append(...svg.childNodes); svg.append(group);
      svg.removeAttribute('transform'); svg.style.setProperty('transform', 'none', 'important');
    }
    const box = svg.getBBox();
    let padding = 0;
    const rootMatrix = svg.getScreenCTM()?.inverse();
    for (const element of svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text,use')) {
      const style = getComputedStyle(element);
      if (style.stroke === 'none' || style.display === 'none') continue;
      const matrix = rootMatrix && element.getScreenCTM();
      const relative = matrix && rootMatrix.multiply(matrix);
      const scale = relative ? Math.max(Math.hypot(relative.a, relative.b), Math.hypot(relative.c, relative.d)) : 1;
      padding = Math.max(padding, (parseFloat(style.strokeWidth) || 0) * scale * 2);
    }
    if (![box.x,box.y,box.width,box.height,padding].every(Number.isFinite) || (box.width <= 0 && box.height <= 0 && padding <= 0)) throw Error('This SVG has no visible shapes. Export your drawing as paths or filled shapes, then try again.');
    padding += Math.max(box.width, box.height, 1) * .02;
    svg.setAttribute('viewBox', `${box.x-padding} ${box.y-padding} ${box.width+padding*2} ${box.height+padding*2}`);
  } finally { host.remove(); }
  const svgText = new XMLSerializer().serializeToString(svg);
  const decoded = await svgImage(svgText);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = SVG_RASTER_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(decoded, 0, 0, SVG_RASTER_SIZE, SVG_RASTER_SIZE);
  const pixels = ctx.getImageData(0,0,SVG_RASTER_SIZE,SVG_RASTER_SIZE).data;
  let minX=SVG_RASTER_SIZE,minY=SVG_RASTER_SIZE,maxX=-1,maxY=-1;
  for (let y=0;y<SVG_RASTER_SIZE;y++) for (let x=0;x<SVG_RASTER_SIZE;x++) if (pixels[(y*SVG_RASTER_SIZE+x)*4+3] >= 16) {
    minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y);
  }
  if (maxX < 0) throw Error('This SVG has no visible artwork. Embedded links and hidden layers aren’t imported; export visible paths and try again.');
  const fitted = document.createElement('canvas'); fitted.width = fitted.height = SVG_RASTER_SIZE;
  const fit = fitted.getContext('2d');
  const width=maxX-minX+1,height=maxY-minY+1,scale=(SVG_RASTER_SIZE*860/1024)/Math.max(width,height);
  fit.drawImage(canvas,minX,minY,width,height,(SVG_RASTER_SIZE-width*scale)/2,(SVG_RASTER_SIZE-height*scale)/2,width*scale,height*scale);
  fit.globalCompositeOperation='source-in'; fit.fillStyle='#fff'; fit.fillRect(0,0,SVG_RASTER_SIZE,SVG_RASTER_SIZE);
  const dataURL = fitted.toDataURL('image/png');
  const image = new Image(); image.src = dataURL; await image.decode();
  return { markup: `<image x="0" y="0" width="400" height="400" href="${dataURL}"/>`, image, svgText };
}
