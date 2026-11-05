export const STAND_RIB=3.2;
export function standDimensions(settings){
  const width=settings.standWidth??45,depth=settings.standDepth??45,lean=settings.standLean??12;
  if(![width,depth,lean].every(Number.isFinite)||width<25||width>70||depth<25||depth>70||lean<6||lean>20)throw Error('Desk stand: use a width and depth of 25–70 mm and a backward lean of 6–20°.');
  return {width,depth,lean,rib:STAND_RIB};
}
export function standPose(settings,bottom,face){
  const angle=standDimensions(settings).lean*Math.PI/180;
  return {rotation:-Math.PI/2-angle,y:-bottom*Math.sin(angle)-face*Math.cos(angle),z:-bottom*Math.cos(angle)+face*Math.sin(angle)};
}
