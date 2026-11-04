import {bedFit} from './mesh-analysis.js';
import {flatMechanismBox} from './artwork-surface.js';

export function printReadiness({settings,stats=null,error=null,hours=null,invalid=null,plate={width:220,depth:220},plateValid=true,loading=false,checking=false}){
  const items=[],add=(id,tone,text,action=null,label=null)=>items.push({id,tone,text,action,label});
  if(loading)return {tone:'neutral',title:'Opening your design…',items:[],action:null};
  if(invalid)add('dimensions','error','Finish the highlighted size or mechanism measurement.','dimensions','Edit measurements');
  if(hours?.missing?.length)add('hours','error',`${hours.labels.length}/12 complete hours fit this SVG. A round backing can support all 12.`,'hours','Fit all 12 hours');
  if(error&&!hours?.missing?.length){
    const backing=settings.design==='custom'&&/solid clock face|inside solid material/.test(error);
    const room=/leave at least/.test(error);
    add('geometry','error',error,backing?'backing':room?'room':'check',backing?'Add a backing':room?'Make room for the pocket':'Check again');
  }
  if(flatMechanismBox(settings)&&settings.exportFormat==='stl'&&(settings.markers||settings.design==='custom'&&settings.svgDetail==='artwork'))add('colors','warning','STL keeps the flat shape and box. Flat SVG artwork and hour numbers need a color 3MF.','colors','Keep the artwork colors');
  if(!plateValid)add('printer','error','Enter a valid printer width and depth.','printer','Edit build plate');
  else if(stats&&!bedFit(stats.dimensions,plate.width,plate.depth).fits)add('plate','warning',`This model exceeds your ${plate.width} × ${plate.depth} mm build plate.`,'fit','Make it fit');
  if(stats?.components>1)add('parts','warning',`${stats.components} separate pieces. Add a backing to print the artwork as one piece.`,settings.design==='custom'?'backing':null,'Join the pieces');
  if(settings.mechanismRecess&&!flatMechanismBox(settings))add('orientation','warning','Inspect the rear mount and review print orientation and supports in your slicer.','back','Inspect the back');
  if(!stats&&!error&&!invalid&&!hours?.missing?.length)add('unchecked','neutral','Check this version of the design before slicing. Changes to its shape need a fresh check.','check','Check this design');
  if(checking)return {tone:'neutral',title:'Checking this design…',items,action:null};
  const first=items.find(i=>i.tone==='error')||items.find(i=>i.tone==='warning')||items[0];
  if(first)return {tone:first.tone,title:first.tone==='error'?'Finish the print setup':first.tone==='warning'?'Review before slicing':'Check your print',items,action:first.action,label:first.label};
  add('ready','success',`One closed piece · ${stats.dimensions.map(v=>Number(v.toFixed(1))).join(' × ')} mm · fits your build plate.`);
  if(flatMechanismBox(settings))add('flat','success','Flat front on the bed, with the open mechanism box pointing up.');
  return {tone:'success',title:'Ready for your slicer',items,action:'preview',label:'Inspect the print mesh'};
}
