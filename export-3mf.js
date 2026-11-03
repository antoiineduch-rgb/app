import { strToU8, zipSync } from 'fflate';

const CORE_NAMESPACE = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
const MODEL_TYPE = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

function escapeXML(value) {
  // Remove characters XML 1.0 cannot represent, including lone surrogates.
  const text = [...value].filter(character => {
    const code = character.codePointAt(0);
    return code === 9 || code === 10 || code === 13 ||
      (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff);
  }).join('');
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function stlView(input) {
  if (input instanceof ArrayBuffer) return new DataView(input);
  if (ArrayBuffer.isView(input)) return new DataView(input.buffer, input.byteOffset, input.byteLength);
  throw new TypeError('The printable mesh must be a binary STL buffer.');
}

// A generic 3MF Core model. The same validated geometry used for STL is indexed
// without rounding or re-triangulation, then packaged using the OPC ZIP layout.
export function stlTo3MF(buffer, { name = 'Clock Factory', color = '#C47F62' } = {}) {
  if (typeof name !== 'string') throw new TypeError('The model name must be text.');
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color)) {
    throw new TypeError('The model color must be #RRGGBB or #RRGGBBAA.');
  }
  const materialColor = color.toUpperCase() + (color.length === 7 ? 'FF' : '');
  const view = stlView(buffer);
  if (view.byteLength < 84) throw new RangeError('The printable mesh is incomplete.');
  const count = view.getUint32(80, true);
  if (!count || 84 + count * 50 !== view.byteLength) throw new RangeError('The printable mesh has an invalid triangle count.');

  const vertexIds = new Map(), vertices = [], triangles = [];
  function vertex(point) {
    const key = point.join(',');
    let index = vertexIds.get(key);
    if (index === undefined) {
      index = vertices.length;
      vertexIds.set(key, index);
      vertices.push(`<vertex x="${point[0]}" y="${point[1]}" z="${point[2]}"/>`);
    }
    return index;
  }
  for (let i = 0; i < count; i++) {
    const offset = 84 + i * 50 + 12;
    const points = [0,1,2].map(j => [0,1,2].map(k => view.getFloat32(offset + j * 12 + k * 4, true)));
    if (!points.every(point => point.every(Number.isFinite))) throw new RangeError('The printable mesh contains invalid coordinates.');
    const [a,b,c] = points;
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    if (Math.hypot(uy*vz-uz*vy, uz*vx-ux*vz, ux*vy-uy*vx) === 0) {
      throw new RangeError('The printable mesh contains an empty triangle.');
    }
    const indices = points.map(vertex);
    triangles.push(`<triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}"/>`);
  }

  const title = escapeXML(name.trim() || 'Clock Factory');
  const model = `${XML_HEADER}\n<model unit="millimeter" xml:lang="en-US" xmlns="${CORE_NAMESPACE}">
<metadata name="Application">Clock Factory</metadata>
<metadata name="Title">${title}</metadata>
<resources>
<basematerials id="1"><base name="Clock face" displaycolor="${materialColor}"/></basematerials>
<object id="2" type="model" name="${title}" pid="1" pindex="0"><mesh>
<vertices>${vertices.join('')}</vertices>
<triangles>${triangles.join('')}</triangles>
</mesh></object>
</resources>
<build><item objectid="2"/></build>
</model>`;
  const contentTypes = `${XML_HEADER}\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="${MODEL_TYPE}"/>
<Override PartName="/3D/3dmodel.model" ContentType="${MODEL_TYPE}"/>
</Types>`;
  const relationships = `${XML_HEADER}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>
</Relationships>`;
  const zip = zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(relationships),
    '3D/3dmodel.model': strToU8(model),
  }, { level: 6, mtime: new Date(2000, 0, 1) });
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
}
