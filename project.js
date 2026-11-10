import { designs } from './geometry.js';
import { normalizeOrientation } from './svg-placement.js';
import {normalizeFilamentOverrides,validFilamentOverrides} from './filament-colors.js';

export const MAX_PROJECT_BYTES=12*1024*1024;
export const DEFAULT_SETTINGS=Object.freeze({design:'petal',projectName:'My Clock',color:0,texture:'ripple',diameter:200,thickness:3,hole:8,markers:true,hourStyle:'ticks',hourColor:'light',numberSize:100,numberPosition:100,exportFormat:'stl',svgDetail:'artwork',svgRelief:.8,svgTone:'contrast',showHands:true,threeMFTarget:'bambu-a1',filamentCount:4,bambuBackColor:'background',bambuColors:Object.freeze({}),svgBacking:false,svgBackingThickness:1.2,svgBackingMargin:3,hourFit:true,hourFollowPath:false,hourPathInset:2,hourPathRotate:false,mechanismRecess:false,recessWidth:55,recessHeight:55,recessDepth:5.5,recessClearance:.5,mechanismMount:'box',mechanismWall:1.6,mechanismFlatFront:true,deskStand:false,standWidth:45,standDepth:45,standLean:12,standClearance:4});
const choices={design:[...designs.map(d=>d.id),'custom'],texture:['smooth','ripple','grain'],hourStyle:['ticks','arabic','roman'],hourColor:['light','dark','auto'],exportFormat:['stl','3mf'],svgDetail:['artwork','silhouette'],svgTone:['contrast','dark','light'],threeMFTarget:['bambu-a1','standard'],filamentCount:[2,4],bambuBackColor:['background','face'],mechanismMount:['box','recess']};
const ranges={color:[0,6,1],diameter:[100,300,1],thickness:[2,10,.5],hole:[5,15,.1],numberSize:[70,130,5],numberPosition:[80,120,5],hourPathInset:[0,15,.5],svgRelief:[0,2,.2],svgBackingThickness:[1,10,.2],svgBackingMargin:[1,12,.5],recessWidth:[5,90,.5],recessHeight:[5,90,.5],recessDepth:[.5,8,.1],recessClearance:[0,2,.1],mechanismWall:[1.2,4,.2],standWidth:[25,70,1],standDepth:[25,70,1],standLean:[6,20,1],standClearance:[2,20,1]};
const bytes=value=>new TextEncoder().encode(value).byteLength;
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function projectName(value){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,80)||'My Clock':'My Clock';}
export function normalizeSettings(input={}){
  if(!record(input))input={};
  const settings={...DEFAULT_SETTINGS,projectName:projectName(input.projectName)};
  settings.bambuColors=normalizeFilamentOverrides(input.bambuColors);
  for(const [key,values]of Object.entries(choices))if(values.includes(input[key]))settings[key]=input[key];
  for(const [key,[min,max,step]]of Object.entries(ranges)){
    const value=Number(input[key]);
    if(input[key]!=null&&Number.isFinite(value))settings[key]=Number(Math.min(max,Math.max(min,Math.round(value/step)*step)).toFixed(5));
  }
  for(const key of ['markers','showHands','svgBacking','hourFit','hourFollowPath','hourPathRotate','mechanismRecess','mechanismFlatFront','deskStand'])if(typeof input[key]==='boolean')settings[key]=input[key];
  if(input.mechanismRecess===true&&input.mechanismMount===undefined)settings.mechanismMount='recess';
  return settings;
}
function checkedArtwork(value){
  if(value==null)return null;
  if(!record(value)||typeof value.source!=='string'||!value.source.trim())throw Error('This project is missing its SVG artwork.');
  if(value.source.length>5*1024*1024||bytes(value.source)>5*1024*1024)throw Error('The project SVG must be smaller than 5 MB.');
  const name=typeof value.name==='string'?value.name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,255):'Imported SVG.svg';
  return {name:name||'Imported SVG.svg',source:value.source};
}
export function parseProject(text){
  if(typeof text!=='string'||text.length>MAX_PROJECT_BYTES||bytes(text)>MAX_PROJECT_BYTES)throw Error('Choose a Clock Factory project smaller than 12 MB.');
  let data;try{data=JSON.parse(text);}catch{throw Error('This file is not a valid Clock Factory project.');}
  if(!record(data)||data.format!=='clock-factory-project'||data.version!==1||!record(data.settings))throw Error('This project format is not supported. Open a .clock file saved by Clock Factory.');
  for(const [key,values]of Object.entries(choices))if(data.settings[key]!==undefined&&!values.includes(data.settings[key]))throw Error(`The project has an invalid ${key} setting.`);
  for(const [key,[min,max,step]]of Object.entries(ranges)){
    const value=data.settings[key];
    if(value!==undefined&&(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.abs(value/step-Math.round(value/step))>1e-6))throw Error(`The project has an invalid ${key} setting.`);
  }
  for(const key of ['markers','showHands','svgBacking','hourFit','hourFollowPath','hourPathRotate','mechanismRecess','mechanismFlatFront','deskStand'])if(data.settings[key]!==undefined&&typeof data.settings[key]!=='boolean')throw Error(`The project has an invalid ${key} setting.`);
  if(data.settings.bambuColors!==undefined&&!validFilamentOverrides(data.settings.bambuColors))throw Error('The project has invalid filament colors.');
  const settings=normalizeSettings(data.settings),artwork=checkedArtwork(data.artwork),orientation=normalizeOrientation(data.orientation);
  if(settings.design==='custom'&&!artwork)throw Error('The project is missing its imported SVG.');
  if(data.orientation!==undefined&&(!Array.isArray(data.orientation)||data.orientation.length!==4||!data.orientation.every((v,i)=>v===orientation[i])))throw Error('The project SVG orientation is invalid.');
  return {settings,artwork,orientation};
}
export function serializeProject(settings,artwork=null,orientation=null){
  const text=JSON.stringify({format:'clock-factory-project',version:1,settings:normalizeSettings(settings),artwork:checkedArtwork(artwork),orientation:normalizeOrientation(orientation)},null,2);
  parseProject(text);
  return text;
}
export function projectFilename(name){
  let filename=projectName(name).replace(/[\\/:*?"|]/g,'-').replace(/[. ]+$/g,'').slice(0,80)||'My Clock';
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename))filename='Clock-'+filename;
  return `${filename}.clock`;
}
