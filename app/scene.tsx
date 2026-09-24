"use client";
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {SoftwareRenderer} from "./software-renderer";
export type Space={id:string;sector:string;x:number;z:number;occupied:boolean;accessible:boolean;rotation:number;lane?:number};
export type CampusId="sede"|"4r";
const sedeSpaces=():Space[]=>["A","B","V"].flatMap((sector,si)=>Array.from({length:24},(_,i)=>({id:`${sector}-${String(i+1).padStart(2,"0")}`,sector,x:si===0?-32+(i%2)*9:si===1?23+(i%2)*9:-19+(i%12)*3.45,z:si<2?-24+Math.floor(i/2)*4.1:27+Math.floor(i/12)*8,occupied:i>=[18,16,8][si],accessible:i<2,rotation:si<2?(i%2===0?-Math.PI/2:Math.PI/2):(i<12?Math.PI:0)})));
const r4Spaces=():Space[]=>{
 const aisle=(sector:string,baseX:number,baseLane:number,dir:1|-1)=>Array.from({length:72},(_,i)=>{const col=i%6,row=Math.floor(i/6),mod=Math.floor(col/2),sub=col%2;return{id:`${sector}-${String(i+1).padStart(2,"0")}`,sector,x:baseX+dir*mod*18+sub*9,z:-24+row*4.1,lane:baseLane+dir*mod*18,occupied:i>=54,accessible:i<2,rotation:sub===0?-Math.PI/2:Math.PI/2};});
 const v=Array.from({length:36},(_,i)=>{const col=i%18,row=Math.floor(i/18);return{id:`V-${String(i+1).padStart(2,"0")}`,sector:"V",x:-19+col*3.45,z:27+row*8,occupied:i>=12,accessible:i<2,rotation:row===0?Math.PI:0};});
 return[...aisle("A",-32,-27.5,-1),...aisle("B",23,27.5,1),...v];
};
export const spacesFor=(campus:CampusId):Space[]=>campus==="4r"?r4Spaces():sedeSpaces();
export type CampusHandle={focus:(s:string)=>void;zoom:(f:number)=>void};
type Props={night:boolean;playing:boolean;tour:boolean;route:boolean;colorblind:boolean;campus:CampusId;spaces:Space[];selected:string;onTraffic:(id:string,occupied:boolean|null,message:string)=>void;onSpace:(s:Space)=>void};
const Campus=forwardRef<CampusHandle,Props>(function Campus(props,ref){
const host=useRef<HTMLDivElement>(null),state=useRef(props),api=useRef<CampusHandle|null>(null);state.current=props;
const [error,setError]=useState(false),[ready,setReady]=useState(false);
useImperativeHandle(ref,()=>({focus:s=>api.current?.focus(s),zoom:f=>api.current?.zoom(f)}),[]);
useEffect(()=>{if(!host.current)return;const el=host.current;const campus=props.campus,campusSpaces=spacesFor(campus),big=campus==="4r";let renderer:THREE.WebGLRenderer;let software=false;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{renderer=new SoftwareRenderer() as unknown as THREE.WebGLRenderer;software=true;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;el.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-label",`Maquete 3D interativa do campus UDF ${big?"4R":"Sede"}`);renderer.domElement.tabIndex=0;
const home=big?{pos:[165,175,210] as [number,number,number],target:[0,0,3] as [number,number,number],min:50,max:340}:{pos:[102,108,130] as [number,number,number],target:[0,0,1] as [number,number,number],min:38,max:220};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,900);camera.position.set(...home.pos);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...home.target);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=home.min;controls.maxDistance=home.max;controls.maxPolarAngle=Math.PI/2.18;controls.minPolarAngle=.15;controls.enablePan=false;controls.autoRotateSpeed=.55;
const hemi=new THREE.HemisphereLight(0xe8f2ff,0x507157,2.6);scene.add(hemi);const sun=new THREE.DirectionalLight(0xfff4de,3.4);sun.position.set(-35,80,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,big?{left:-110,right:110,top:110,bottom:-110,near:1,far:320}:{left:-65,right:65,top:65,bottom:-65,near:1,far:200});sun.shadow.bias=-.0005;scene.add(sun);
const mats:THREE.Material[]=[],geos:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[];
const mat=(c:THREE.ColorRepresentation,opts:THREE.MeshStandardMaterialParameters={})=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.75,...opts});mats.push(m);return m;};
const white=mat(0xe8edf1),navy=mat(0x203853),glass=mat(0x486982,{metalness:.35,roughness:.25}),roof=mat(0xb4c2ce),concrete=mat(0xc7cfd0),asphalt=mat(0x3f4b56),grass=mat(0x749581),red=mat(0xd7193f),trunk=mat(0x796b57),leaf=mat(0x388574),leaf2=mat(0x4e9981),rubber=mat(0x18212b),lamp=mat(0xffedb2,{emissive:0xffd484,emissiveIntensity:0});
const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene)=>{const g=new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/5)),1,Math.max(1,Math.ceil(d/5)));geos.push(g);const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;};
const cylinder=(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene)=>{const g=new THREE.CylinderGeometry(r,r,h,10);geos.push(g);const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;parent.add(a);return a;};
const label=(text:string,x:number,y:number,z:number,color="#203853",scale=10,parent:THREE.Object3D=scene)=>{const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d")!;ctx.fillStyle="rgba(255,255,255,.95)";ctx.beginPath();ctx.roundRect(4,4,504,120,20);ctx.fill();ctx.fillStyle=color;ctx.font="bold 48px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,256,66);const tx=new THREE.CanvasTexture(c);textures.push(tx);const m=new THREE.SpriteMaterial({map:tx,depthTest:false});mats.push(m);const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(scale,scale/4,1);parent.add(s);return s;};
if(big){
 box(160,2,100,white,0,-1.5,-2);box(158,.5,98,grass,0,-.3,-2);box(150,.25,92,asphalt,0,.05,-2);
 box(16,6,10,white,0,3,-34);box(17,.6,11,roof,0,6.2,-34);box(16.2,1,.2,navy,0,3.6,-28.95);box(5,2.2,.2,glass,0,2.3,-28.9);label("4R",0,10,-34,"#d7193f",9);
 box(7,.12,66,concrete,0,.7,3);for(let z=-24;z<32;z+=6){box(2.2,.55,.6,navy,-4,.8,z);box(2.2,.55,.6,navy,4,.8,z);}
 for(let i=0;i<50;i++){const side=i%2?-1:1,x=i<30?side*75:side*(20+(i%5)*10),z=i<30?-40+Math.floor(i/2)*5.5:40;cylinder(.27,2.5,trunk,x,1.6,z);const g=new THREE.IcosahedronGeometry(1.8+(i%3)*.22,1);geos.push(g);const a=new THREE.Mesh(g,i%3?leaf:leaf2);a.position.set(x,3.5,z);a.scale.y=1.15;a.castShadow=true;scene.add(a);}
 for(const x of [-75,75])for(let z=-38;z<42;z+=7)box(.18,.05,3,white,x,.25,z);for(let x=-70;x<71;x+=7)box(3,.05,.18,white,x,.25,44);
 label("A",-50,6,-2,"#d7193f",12);label("B",50,6,-2,"#d7193f",12);label("VISITANTES",10,4,44,"#d7193f",13);
}else{
 box(88,2,92,white,0,-1.5,0);box(86,.5,90,grass,0,-.3,0);box(81,.25,85,asphalt,0,.05,0);box(69,.3,72,concrete,0,.22,-1);box(39,.3,50,grass,0,.42,-7);
 for(const x of [-10,10]){box(10,8,36,white,x,4.6,-8);box(10.8,.6,37,roof,x,8.9,-8);box(10.1,1.1,36.1,navy,x,1.7,-8);for(let z=-23;z<=6;z+=3.2)for(const side of [-1,1])for(const y of [3.5,6.2])box(.12,1.5,2,glass,x+side*5.05,y,z);for(let z=-20;z<4;z+=4)box(7,.12,2.9,glass,x,9.25,z);}
 box(32,11,12,white,0,6,-26);box(33,.7,13,roof,0,11.9,-26);box(32.2,2.2,.2,glass,0,8,-19.9);box(32.2,1,.2,red,0,4.2,-19.7);box(7,3,.5,glass,0,2,-19.5);box(6,.3,7,white,0,3.8,-16.5);label("UDF",0,15,-26,"#d7193f",9);
 box(7,.12,34,concrete,0,.7,-1);for(let z=-11;z<12;z+=5){box(2.2,.55,.6,navy,-4,.8,z);box(2.2,.55,.6,navy,4,.8,z);}
 for(let i=0;i<40;i++){const side=i%2?-1:1,x=i<24?side*37:side*(4+(i%3)*5),z=i<24?-35+Math.floor(i/2)*6.4:13+(Math.floor((i-24)/6)*4);cylinder(.27,2.5,trunk,x,1.6,z);const g=new THREE.IcosahedronGeometry(1.8+(i%3)*.22,1);geos.push(g);const a=new THREE.Mesh(g,i%3?leaf:leaf2);a.position.set(x,3.5,z);a.scale.y=1.15;a.castShadow=true;scene.add(a);}
 for(const x of [-41,41])for(let z=-38;z<40;z+=7)box(.18,.05,3,white,x,.25,z);for(let x=-35;x<36;x+=7)box(3,.05,.18,white,x,.25,41);
 label("A · BLOCO A",-28,5,-30,"#d7193f",12);label("B · BLOCO B",28,5,-30,"#d7193f",12);label("VISITANTES",0,4,39,"#d7193f",13);label("VIA W5 SUL",-43,1,0,"#526079",12);label("VIA W4 SUL",43,1,0,"#526079",12);
}
const car=(color:number)=>{const group=new THREE.Group(),m=mat(color,{metalness:.25,roughness:.35});box(1.75,.65,3.3,m,0,.75,0,group);box(1.55,.7,1.65,glass,0,1.25,-.1,group);box(1.6,.16,1.3,m,0,1.65,-.2,group);const wheels:THREE.Mesh[]=[];for(const x of [-.88,.88])for(const z of [-1,1]){const w=cylinder(.35,.19,rubber,0,0,0,group);w.rotation.z=Math.PI/2;w.position.set(x,.55,z);wheels.push(w);}box(1.3,.16,.05,lamp,0,.85,1.68,group);const tail=mat(0x2b0d0f,{emissive:0xff2b2b,emissiveIntensity:0});box(1.3,.16,.05,tail,0,.85,-1.68,group);group.userData.wheels=wheels;group.userData.tail=tail;scene.add(group);return group;};
const hits:THREE.Object3D[]=[],tiles:THREE.Mesh[]=[],cars:THREE.Group[]=[];campusSpaces.forEach((s,i)=>{const m=mat(0x29b68b,{emissive:0x0c563b,emissiveIntensity:.15}),tile=box(2.85,.09,5.9,m,s.x,.5,s.z);tile.rotation.y=s.rotation;tile.userData.index=i;hits.push(tile);tiles.push(tile);const c=car([0xe7e8ed,0xcedae5,0x263953,0xcc3655,0x75a8b8][i%5]);c.position.set(s.x,.5,s.z);c.rotation.y=s.rotation;c.traverse(o=>{o.userData.index=i;});hits.push(c);cars.push(c);});
const person=(shirt:number)=>{const group=new THREE.Group(),body=mat(shirt,{roughness:.85}),skin=mat(0xe3b48c,{roughness:.75});const tg=new THREE.CapsuleGeometry(.28,.7,4,8);geos.push(tg);const torso=new THREE.Mesh(tg,body);torso.position.y=1;torso.castShadow=true;group.add(torso);const hg=new THREE.SphereGeometry(.2,10,8);geos.push(hg);const head=new THREE.Mesh(hg,skin);head.position.y=1.75;head.castShadow=true;group.add(head);scene.add(group);return group;};
const walkZ:[number,number]=big?[-27,33]:[-17,15];
const walkers=[0x3a6ea5,0x8a4b3d,0x4e6b4e,0xb08a2e,0x5b4b7a,0x2e7a7a].map((c,i)=>{const x=[-2.2,-1.1,-.3,.3,1.1,2.2][i],g=person(c);g.position.set(x,.5,(walkZ[0]+walkZ[1])/2);return{g,x,speed:.00016+i*.00003,phase:i*1.9};});
const routeGroup=new THREE.Group();scene.add(routeGroup);const routeMat=mat(0xffd16d,{emissive:0xffbc38,emissiveIntensity:1.3});
if(big){for(let z=31;z>-27;z-=1.7)box(.48,.1,.9,routeMat,0,.86,z,routeGroup);for(let x=-19;x<0;x+=1.7)box(.9,.1,.48,routeMat,x,.86,31,routeGroup);}
else{for(let z=23;z>-17;z-=1.7)box(.48,.1,.9,routeMat,0,.86,z,routeGroup);for(let x=-19;x<0;x+=1.7)box(.9,.1,.48,routeMat,x,.86,23,routeGroup);}
// Pontos de atenção: proposta ilustrativa por visibilidade (longe dos postes centrais), não é levantamento de ocorrências reais.
const attentionGroup=new THREE.Group();scene.add(attentionGroup);let warnMat:THREE.MeshStandardMaterial|null=null;
if(big){
 warnMat=mat(0xf59e0b,{emissive:0xb45309,emissiveIntensity:.6,transparent:true,opacity:.32});
 for(const ax of [-63.5,63.5]){
  const g=new THREE.CylinderGeometry(11,11,.06,28);geos.push(g);
  const disc=new THREE.Mesh(g,warnMat);disc.position.set(ax,.3,-1.5);attentionGroup.add(disc);
  label("PONTO DE ATENÇÃO",ax,7,-1.5,"#b45309",13,attentionGroup);
 }
}
const lights:THREE.PointLight[]=[];const lampX=[-18,18],lampZ=big?[-30,-10,10,30]:[-28,-10,10,20];for(const x of lampX)for(const z of lampZ){cylinder(.12,4,navy,x,2.4,z);box(1.2,.2,.8,lamp,x,4.5,z);const l=new THREE.PointLight(0xffd78a,0,18,1.6);l.position.set(x,4.1,z);scene.add(l);lights.push(l);}
let targetPos:THREE.Vector3|null=null,targetLook:THREE.Vector3|null=null;
// One maneuver at a time keeps the narrow access lanes clear.
const v=(x:number,z:number)=>new THREE.Vector3(x,.5,z);
const roadCurve=(points:THREE.Vector3[])=>{
 const path=new THREE.CurvePath<THREE.Vector3>();let previous=points[0];
 for(let i=1;i<points.length-1;i++){
  const corner=points[i],before=points[i-1],after=points[i+1];
  const radius=Math.min(1.5,corner.distanceTo(before)/3,corner.distanceTo(after)/3);
  const entry=corner.clone().add(before.clone().sub(corner).normalize().multiplyScalar(radius));
  const exit=corner.clone().add(after.clone().sub(corner).normalize().multiplyScalar(radius));
  path.add(new THREE.LineCurve3(previous,entry));path.add(new THREE.QuadraticBezierCurve3(entry,corner,exit));previous=exit;
 }
 path.add(new THREE.LineCurve3(previous,points[points.length-1]));return path;
};
const paths=(s:Space)=>{
 const side=s.sector!=="V",lane=s.lane??(s.sector==="A"?-27.5:27.5);
 const gate=big?v(95,55):v(41,40);
 const start=side?v(lane,s.z+3):v(s.x+3,31);
 const road=roadCurve(side?[gate,v(lane,gate.z),start]:[gate,v(big?15:27.5,gate.z),v(big?15:27.5,31),start]);
 const end=v(s.x,s.z),front=new THREE.Vector3(Math.sin(s.rotation),0,Math.cos(s.rotation));
 const maneuver=new THREE.CubicBezierCurve3(start,side?v(lane,s.z):v(s.x,31),end.clone().addScaledVector(front,-2),end);
 return {road,maneuver};
};
type Journey={index:number;arrival:boolean;phase:"road"|"maneuver";distance:number;road:THREE.CurvePath<THREE.Vector3>;maneuver:THREE.CubicBezierCurve3};
let journey:Journey|null=null,delay=1,sequence=0;
const traffic=(dt:number)=>{
 if(!state.current.playing)return;
 if(!journey){
  delay-=dt;if(delay>0)return;
  const arrival=sequence%2===0,sector=["V","V","A","A","B","B"][sequence%6];
  const available=state.current.spaces.map((s,index)=>({s,index})).filter(({s})=>s.sector===sector&&s.occupied!==arrival&&!s.accessible);
  sequence++;if(!available.length){delay=2;return;}
  const {s,index}=available[(sequence*5)%available.length];
  journey={index,arrival,phase:arrival?"road":"maneuver",distance:0,...paths(s)};
  state.current.onTraffic(s.id,null,arrival?"Veículo chegando":"Saindo da vaga em ré");
 }
 const j=journey,s=state.current.spaces[j.index],c=cars[j.index];
 const curve=j.phase==="road"?j.road:j.maneuver,length=curve.getLength(),rate=j.phase==="road"?(big?14:8):2.3;
 j.distance+=dt*rate;
 const raw=Math.min(1,j.distance/length),eased=raw<.5?4*raw**3:1-(-2*raw+2)**3/2,u=j.arrival?eased:1-eased;
 c.visible=true;c.position.copy(curve.getPointAt(u));
 const tangent=curve.getTangentAt(u);c.rotation.y=Math.atan2(tangent.x,tangent.z)+(j.arrival||j.phase==="maneuver"?0:Math.PI);
 const reversing=!j.arrival&&j.phase==="maneuver";
 (c.userData.wheels as THREE.Mesh[]).forEach(w=>w.rotateX((reversing?-1:1)*dt*rate/.35));
 (c.userData.tail as THREE.MeshStandardMaterial).emissiveIntensity=raw>.72?(raw-.72)/.28:0;
 if(raw<1)return;
 if(j.arrival&&j.phase==="road"){
  j.phase="maneuver";j.distance=0;state.current.onTraffic(s.id,null,"Manobrando para estacionar");
 }else if(!j.arrival&&j.phase==="maneuver"){
  j.phase="road";j.distance=0;state.current.onTraffic(s.id,false,"Vaga liberada · veículo saindo");
 }else{
  (c.userData.tail as THREE.MeshStandardMaterial).emissiveIntensity=0;
  if(j.arrival){c.position.set(s.x,.5,s.z);c.rotation.y=s.rotation;state.current.onTraffic(s.id,true,"Veículo estacionado");}
  else{c.visible=false;state.current.onTraffic(s.id,null,"Veículo deixou o estacionamento");}
  journey=null;delay=3;
 }
};
const sectorTarget=(s:string):[number,number]=>big?(s==="A"?[-50,-1]:s==="B"?[50,-1]:s==="V"?[10,31]:[0,-2]):(s==="A"?[-24,0]:s==="B"?[24,0]:s==="V"?[0,26]:[0,0]);
const focusReach=big?{xz:70,y:100}:{xz:42,y:64};
api.current={focus:s=>{const[x,z]=sectorTarget(s);targetLook=new THREE.Vector3(x,0,z);targetPos=s?new THREE.Vector3(x+focusReach.xz,focusReach.y,z+focusReach.xz):new THREE.Vector3(...home.pos);},zoom:f=>{camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();}};controls.addEventListener("start",()=>{targetPos=null;targetLook=null;});
const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0};const pd=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};const pu=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const h=ray.intersectObjects(hits,true).find(h=>h.object.parent?.visible!==false&&h.object.visible);if(h)state.current.onSpace(state.current.spaces[h.object.userData.index]);};renderer.domElement.addEventListener("pointerdown",pd);renderer.domElement.addEventListener("pointerup",pu);
let frame=0,last=0,lastDraw=0;const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const render=(time:number)=>{const dt=Math.min((time-last)/1000,.05);last=time;const p=state.current;hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,p.night?.6:2.6,.04);sun.intensity=THREE.MathUtils.lerp(sun.intensity,p.night?.3:3.4,.04);lamp.emissiveIntensity=p.night?3:0;lights.forEach(l=>{l.intensity=p.night?35:0;});routeGroup.visible=p.route;routeMat.emissiveIntensity=1.1+Math.sin(time*.002)*.3;attentionGroup.visible=p.route;if(warnMat)warnMat.emissiveIntensity=(p.night?1.3:.55)+Math.sin(time*.0025)*.25;
const palette=p.colorblind?{occupied:0xe69f00,accessible:0xcc79a7,free:0x56b4e9}:{occupied:0xcb6671,accessible:0x5498ec,free:0x35b88d};
const glow=p.colorblind?{occupied:0x7a4f00,accessible:0x5c2f52,free:0x0b4a72}:{occupied:0x501725,accessible:0x163b83,free:0x085b40};
tiles.forEach((t,i)=>{const s=p.spaces[i],m=t.material as THREE.MeshStandardMaterial,key=s.occupied?"occupied":s.accessible?"accessible":"free";m.color.setHex(palette[key]);m.emissive.setHex(glow[key]);m.emissiveIntensity=p.night?.6:.12;m.opacity=p.selected&&p.selected!==s.sector?.38:1;m.transparent=true;if(journey?.index!==i)cars[i].visible=s.occupied;});
if(p.playing&&!reduced)walkers.forEach(w=>{const a=time*w.speed+w.phase,u=(Math.sin(a)+1)/2;w.g.position.set(w.x,.5+Math.abs(Math.sin(a*7))*.06,THREE.MathUtils.lerp(walkZ[0],walkZ[1],u));w.g.rotation.y=Math.cos(a)>=0?0:Math.PI;});
if(!reduced)traffic(dt);
else if(p.playing){delay-=dt;if(delay<=0){const i=(sequence++*17+5)%p.spaces.length,s=p.spaces[i];state.current.onTraffic(s.id,!s.occupied,s.occupied?"Vaga liberada":"Veículo estacionado");delay=8.5;}}

if(targetPos&&targetLook){camera.position.lerp(targetPos,reduced?1:.06);controls.target.lerp(targetLook,reduced?1:.06);if(camera.position.distanceTo(targetPos)<.08){targetPos=null;targetLook=null;}}controls.autoRotate=p.tour&&!reduced;controls.update(dt);if(!software||time-lastDraw>45){renderer.render(scene,camera);lastDraw=time;}frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);setReady(true);
const loss=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener("webglcontextlost",loss);
return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.domElement.remove();api.current=null;};},[]);
return <div className="scene-host" ref={host}>{!ready&&!error&&<div className="scene-message">Preparando o campus 3D…</div>}{error&&<div className="scene-message">Seu navegador não conseguiu abrir o 3D.<br/>Você ainda pode explorar vagas e planos no painel.</div>}</div>;
});export default Campus;
