import {artworkSurfaceHeight} from './svg-details.js';
export const raisedMechanismBox=settings=>settings.mechanismRecess===true&&settings.mechanismMount==='box';
export const flatMechanismBox=settings=>raisedMechanismBox(settings)&&settings.mechanismFlatFront!==false;

// Shared by the viewer and both exporters, including face-down artwork.
export function artworkPlacement(settings,frame){
  const flat=flatMechanismBox(settings);
  return {frame:flat?{...frame,flipY:true}:frame,thickness:artworkSurfaceHeight(settings)+(raisedMechanismBox(settings)&&!flat?(settings.recessDepth??5.5):0),...(flat?{side:'bottom'}:{})};
}
export function artworkPixel(point,frame){
  return [point[0]/frame.scale+frame.cx,frame.cy-(frame.flipY?-point[1]:point[1])/frame.scale];
}
export function paintedTriangle(points,artwork){
  return !!artwork&&points.every(point=>artwork.side==='bottom'?Math.abs(point[2])<=1e-5:point[2]>=artwork.thickness-1e-5);
}
