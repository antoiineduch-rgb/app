import {usesSVGBacking} from './svg-details.js';
import {autoHourFit,hourPathSettings as pathFields} from './hour-layout.js';

// These keys use the captured snapshot, so an export cannot borrow artwork
// from a newer SVG or from edits made while its geometry is being prepared.
const sourceFields=({settings:s,revision,placement})=>[s.design,s.design==='custom'?[revision,placement]:null,s.diameter];
const frameFields=snapshot=>[sourceFields(snapshot),usesSVGBacking(snapshot.settings)?snapshot.settings.svgBackingMargin:false];
const paintFields=snapshot=>{const s=snapshot.settings;return [frameFields(snapshot),s.svgDetail,s.faceColor,s.markers?[s.hourStyle,s.hourColor,s.numberSize,s.numberPosition,s.hourFit,autoHourFit(s)?s.hole:null,pathFields(s)]:false];};
export const sourceKey=snapshot=>JSON.stringify(sourceFields(snapshot));
export const frameKey=snapshot=>JSON.stringify(frameFields(snapshot));
export function layoutKey(snapshot){
  const s=snapshot.settings;return JSON.stringify([frameFields(snapshot),autoHourFit(s)?[s.hourStyle,s.hourStyle==='ticks'?null:[s.numberSize,s.numberPosition],s.hole,pathFields(s)]:false]);
}
export const paintKey=snapshot=>JSON.stringify(paintFields(snapshot));
export function filamentKey(snapshot){
  const s=snapshot.settings;return JSON.stringify([paintFields(snapshot),s.filamentCount,s.bambuBackColor]);
}
