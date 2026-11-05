export const STAND_RIB=3.2;
export function standDimensions(settings){
  const width=settings.standWidth??45,depth=settings.standDepth??45,lean=settings.standLean??12,clearance=settings.standClearance??4;
  if(![width,depth,lean].every(Number.isFinite)||width<25||width>70||depth<25||depth>70||lean<6||lean>20)throw Error('Desk stand: use a width and depth of 25–70 mm and a backward lean of 6–20°.');
  if(!Number.isFinite(clearance)||clearance<2||clearance>20)throw Error('Desk stand: leave 2–20 mm of extra space below the mechanism.');
  return {width,depth,lean,clearance,rib:STAND_RIB};
}
// A movement still occupies space when its optional printed mount is off.
// Keep this lightweight so the viewer can draw the same reserved envelope.
export function standMovementSpace(settings){
  const w=settings.recessWidth??55,h=settings.recessHeight??55,depth=settings.recessDepth??5.5,fit=settings.recessClearance??.5;
  const wall=settings.mechanismRecess===true&&settings.mechanismMount==='box'?(settings.mechanismWall??1.6):0;
  if(![w,h,depth,fit,wall].every(Number.isFinite)||w<5||w>90||h<5||h>90||depth<.5||depth>8||fit<0||fit>2||wall<0||wall>4)throw Error('Desk stand: enter valid movement width, height, depth and fit allowance.');
  const width=w+fit*2+wall*2,height=h+fit*2+wall*2,{clearance}=standDimensions(settings);
  return {width,height,depth,clearance,bottom:height/2+clearance,centerY:clearance/2,guideHeight:height+clearance};
}
export function standPose(settings,bottom,face){
  const angle=standDimensions(settings).lean*Math.PI/180;
  return {rotation:-Math.PI/2-angle,y:-bottom*Math.sin(angle)-face*Math.cos(angle),z:-bottom*Math.cos(angle)+face*Math.sin(angle)};
}
