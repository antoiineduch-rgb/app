import {strToU8,zipSync} from 'fflate';
import {binarySTLTriangles,escapeXML} from './export-3mf.js';
import {filamentPaint,paintFacet,filamentCode,dominantArtworkColor} from './bambu-paint.js';

const header='<?xml version="1.0" encoding="UTF-8"?>';
// Unsliced A1/0.4 project. The native Application prefix is Bambu's required
// format discriminator; Creator records the real generator. Profile IDs refer
// to Studio's installed presets. No temperatures or machine G-code are copied.
export function stlToBambu3MF(buffer,{name='Clock Factory',color='#C47F62',painting=null,maxColors=4,backColor='background'}={}){
  if(typeof name!=='string')throw new TypeError('The model name must be text.');
  if(![2,4].includes(maxColors))throw Error('An A1 with AMS Lite supports up to 4 filaments. Choose 2 or 4 colors.');
  if(painting&&(!painting.frame||painting.frame.n!==painting.width||!Number.isFinite(painting.thickness)||painting.thickness<=0))throw Error('The SVG filament colors have an invalid placement.');
  if(!['background','face'].includes(backColor))throw Error('Choose a valid back color mode.');
  const paint=filamentPaint(painting,backColor==='background'?dominantArtworkColor(painting,color):color,maxColors),title=escapeXML(name.trim()||'Clock Factory'),vertices=[],triangles=[],ids=new Map(),budget={nodes:0};
  let minX=Infinity,minY=Infinity;
  const vertex=point=>{
    const key=point.join(',');let id=ids.get(key);
    if(id===undefined){id=vertices.length;ids.set(key,id);vertices.push(`<vertex x="${point[0]}" y="${point[1]}" z="${point[2]}"/>`);minX=Math.min(minX,point[0]);minY=Math.min(minY,point[1]);}
    return id;
  };
  for(const points of binarySTLTriangles(buffer)){
    const indices=points.map(vertex),painted=painting&&points.every(point=>point[2]>=painting.thickness-1e-5);
    const code=painted?paintFacet(points,painting.frame,paint,budget):filamentCode(0);
    triangles.push(`<triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}" paint_color="${code}"/>`);
  }
  const model=`${header}\n<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Application">BambuStudio-02.00.00.00</metadata><metadata name="Creator">Clock Factory</metadata><metadata name="Title">${title}</metadata>
<metadata name="BambuStudio:3mfVersion">1</metadata><metadata name="BambuStudio:MmPaintingVersion">0</metadata>
<resources><object id="2" type="model" name="${title}"><mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object></resources>
<build><item objectid="2" transform="1 0 0 0 1 0 0 0 1 ${-minX} ${-minY} 0"/></build></model>`;
  const types=`${header}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="application/octet-stream"/></Types>`;
  const rels=`${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/></Relationships>`;
  const config=`${header}<config><object id="2"><metadata key="name" value="${title}"/><metadata key="extruder" value="1"/><part id="2" subtype="normal_part"><metadata key="name" value="Clock face"/><metadata key="extruder" value="1"/></part></object></config>`;
  const settings=JSON.stringify({filament_colour:paint.palette,filament_settings_id:paint.palette.map(()=>'Generic PLA @BBL A1'),printer_settings_id:'Bambu Lab A1 0.4 nozzle',print_settings_id:'0.20mm Standard @BBL A1',nozzle_diameter:['0.4'],printable_height:'256',printable_area:['0x0','256x0','256x256','0x256'],flush_volumes_matrix:[]});
  const zip=zipSync({'[Content_Types].xml':strToU8(types),'_rels/.rels':strToU8(rels),'3D/3dmodel.model':strToU8(model),'Metadata/model_settings.config':strToU8(config),'Metadata/project_settings.config':strToU8(settings)},{level:6,mtime:new Date(2000,0,1)});
  return {buffer:zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength),palette:paint.palette};
}
