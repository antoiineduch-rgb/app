// Keep the artwork, orientation, diameter, backing and chosen spool colors.
export function flatColorClock(settings){
  return {...settings,thickness:3,svgDetail:'artwork',markers:true,hourStyle:'arabic',hourColor:'auto',hourFit:true,numberSize:100,numberPosition:100,mechanismRecess:true,mechanismMount:'box',mechanismFlatFront:true,mechanismWall:1.6,recessWidth:55,recessHeight:55,recessDepth:5.5,recessClearance:.5,exportFormat:'3mf',threeMFTarget:'bambu-a1',filamentCount:4};
}
