import { Scene,Color,PerspectiveCamera,WebGLRenderer,BufferAttribute,BufferGeometry,Mesh,MeshStandardMaterial,HemisphereLight,DirectionalLight,LineSegments,LineBasicMaterial,PlaneGeometry,Texture,SRGBColorSpace,DoubleSide,Vector3,ACESFilmicToneMapping,PCFSoftShadowMap } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Loaded only when the user requests print inspection. Render on interaction,
// resize, or model changes; an idle studio does not run an animation loop.
export class PrintView{
  constructor(container,{onError=()=>{}}={}){
    this.container=container;this.sequence=0;this.visible=false;this.colored=true;this.wireframe=false;this.plateVisible=true;this.frame=null;this.appearanceKey=null;
    this.scene=new Scene();this.scene.background=new Color('#eeeee6');
    this.camera=new PerspectiveCamera(36,1,.1,5000);this.camera.up.set(0,0,1);this.camera.position.set(0,-250,350);
    this.renderer=new WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.outputColorSpace=SRGBColorSpace;
    this.renderer.toneMapping=ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.canvas=this.renderer.domElement;this.canvas.setAttribute('aria-label','Printable clock mesh. Drag to orbit; scroll or pinch to zoom.');this.canvas.setAttribute('role','img');this.canvas.tabIndex=0;
    container.append(this.canvas);
    this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enableDamping=false;this.controls.enablePan=false;this.controls.maxPolarAngle=Math.PI-.02;
    this.controls.addEventListener('change',()=>this.render());
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();onError(Error('3D graphics were interrupted. Switch to Design, then retry Print mesh.'));});
    this.canvas.addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)){
        event.preventDefault();if(event.key.startsWith('Arrow')){if(event.key==='ArrowLeft'||event.key==='ArrowRight')this.controls.rotateLeft(event.key==='ArrowLeft'?.12:-.12);else this.controls.rotateUp(event.key==='ArrowUp'?.12:-.12);this.controls.update();}else this.zoom(event.key==='-'?1.12:1/1.12);
      }
    });
    const ambient=new HemisphereLight(0xfff9ea,0x727c69,.9);ambient.position.set(0,0,1);this.scene.add(ambient);
    const key=new DirectionalLight(0xfff5de,3);key.position.set(-150,-100,300);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-300;key.shadow.camera.right=key.shadow.camera.top=300;key.shadow.camera.near=1;key.shadow.camera.far=900;key.shadow.bias=-.0001;this.scene.add(key);this.keyLight=key;
    const fill=new DirectionalLight(0xe8edff,.9);fill.position.set(180,100,90);this.scene.add(fill);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
  }
  resize(){const {width,height}=this.container.getBoundingClientRect();if(width<2||height<2)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.render();}
  render(){if(this.visible&&this.model&&this.frame===null)this.frame=requestAnimationFrame(()=>{this.frame=null;if(this.visible&&this.model)this.renderer.render(this.scene,this.camera);});}
  setVisible(visible){if(this.visible===visible)return;this.visible=visible;if(visible)this.resize();}
  async setModel(result,settings,{signal}={}){
    signal?.throwIfAborted();
    const sequence=++this.sequence,view=new DataView(result.stlBuffer),count=view.getUint32(80,true);
    const positions=new Float32Array(count*9),normals=new Float32Array(count*9),uv=new Float32Array(count*6),groups=[];
    const texture=result.artwork?.texture;
    let start=0,previous=-1;
    for(let i=0;i<count;i++){
      let painted=!!texture;
      for(let j=0;j<3;j++){
        const at=i*9+j*3,x=view.getFloat32(96+i*50+j*12,true),y=view.getFloat32(100+i*50+j*12,true),z=view.getFloat32(104+i*50+j*12,true);
        positions.set([x,y,z],at);normals.set([0,1,2].map(k=>view.getFloat32(84+i*50+k*4,true)),at);
        if(z<(texture?.thickness??settings.thickness)-1e-5)painted=false;
        if(texture){const {scale,cx,cy,n}=texture.frame;uv.set([(x/scale+cx)/n,1-(cy-y/scale)/n],i*6+j*2);}
      }
      const material=painted?1:0;
      if(material!==previous){if(previous>=0)groups.push([start,(i*3)-start,previous]);start=i*3;previous=material;}
    }
    groups.push([start,count*3-start,previous]);
    const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('normal',new BufferAttribute(normals,3));geometry.setAttribute('uv',new BufferAttribute(uv,2));
    groups.forEach(group=>geometry.addGroup(...group));geometry.computeBoundingSphere();
    const base=new MeshStandardMaterial({color:settings.faceColor,roughness:.65,metalness:0,side:DoubleSide});
    const painted=new MeshStandardMaterial({color:settings.faceColor,roughness:.7,metalness:0,side:DoubleSide});
    let map=null;
    if(texture){
      const url=URL.createObjectURL(new Blob([texture.png],{type:'image/png'}));
      try{const image=new Image();image.src=url;await image.decode();map=new Texture(image);map.colorSpace=SRGBColorSpace;map.needsUpdate=true;}
      finally{URL.revokeObjectURL(url);}
    }
    if(sequence!==this.sequence||signal?.aborted){geometry.dispose();base.dispose();painted.dispose();map?.dispose();signal?.throwIfAborted();return;}
    if(this.model){this.scene.remove(this.model);this.model.geometry.dispose();for(const material of this.model.material)material.dispose();this.texture?.dispose();}
    this.texture=map;this.model=new Mesh(geometry,[base,painted]);this.model.castShadow=true;this.model.receiveShadow=false;this.scene.add(this.model);this.renderer.shadowMap.needsUpdate=true;this.appearanceKey=null;
    this.span=Math.max(...result.stats.dimensions.slice(0,2));this.controls.minDistance=this.span*.35;this.controls.maxDistance=this.span*6;
    this.setAppearance(settings.faceColor,this.colored,this.wireframe);this.setView('angle');this.resize();
    this.canvas.dataset.triangles=String(count);this.canvas.dataset.vertices=String(result.stats.vertices);this.canvas.dataset.span=String(this.span);
  }
  setAppearance(color,colored=this.colored,wireframe=this.wireframe){
    this.colored=colored;this.wireframe=wireframe;if(!this.model)return;
    const key=JSON.stringify([color,colored,wireframe]);if(key===this.appearanceKey)return;this.appearanceKey=key;
    const [base,painted]=this.model.material;base.color.set(color);painted.color.set(this.texture&&colored?'#ffffff':color);painted.map=colored?this.texture:null;
    for(const material of [base,painted]){material.wireframe=wireframe;material.needsUpdate=true;}
    this.render();
  }
  setBed(width,depth,fits=true,visible=this.plateVisible){
    this.plateVisible=visible;
    const key=[width,depth,fits].join(',');
    if(key===this.bedKey&&this.bed){for(const object of this.bed)object.visible=visible&&this.viewMode!=='back';this.render();return;}
    this.bedKey=key;
    for(const object of this.bed||[]){this.scene.remove(object);object.geometry.dispose();object.material.dispose();}
    const points=[];
    for(let x=-width/2;x<=width/2+.01;x+=10)points.push(x,-depth/2,-.35,x,depth/2,-.35);
    for(let y=-depth/2;y<=depth/2+.01;y+=10)points.push(-width/2,y,-.35,width/2,y,-.35);
    const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(points),3));
    const grid=new LineSegments(geometry,new LineBasicMaterial({color:fits?'#d3d8cb':'#d9b6a6'}));
    const plane=new Mesh(new PlaneGeometry(width,depth),new MeshStandardMaterial({color:fits?'#e7eadf':'#eee1d8',roughness:1,metalness:0,side:DoubleSide}));plane.position.z=-.4;plane.receiveShadow=true;
    this.bed=[plane,grid];for(const object of this.bed){object.visible=visible&&this.viewMode!=='back';this.scene.add(object);}this.render();
  }
  setView(view){
    this.viewMode=view;for(const object of this.bed||[])object.visible=this.plateVisible&&view!=='back';
    const distance=(this.span||200)*1.65;
    this.controls.target.set(0,0,0);
    this.camera.position.copy(view==='front'?new Vector3(0,-.001,distance):view==='back'?new Vector3(distance*.15,-distance*.45,-distance*.9):new Vector3(distance*.22,-distance*.65,distance*.82));
    this.controls.update();this.render();
  }
  zoom(factor){const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()*factor)));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.render();}
  dispose(){this.sequence++;if(this.frame!==null)cancelAnimationFrame(this.frame);this.observer.disconnect();this.controls.dispose();if(this.model){this.model.geometry.dispose();for(const material of this.model.material)material.dispose();}for(const object of this.bed||[]){object.geometry.dispose();object.material.dispose();}this.texture?.dispose();this.keyLight.shadow.map?.dispose();this.renderer.dispose();this.canvas.remove();}
}
