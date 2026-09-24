import * as THREE from "three";
// Projection of the same 3D mesh scene for browsers without WebGL.
export class SoftwareRenderer {
 domElement=document.createElement("canvas");shadowMap={enabled:false,type:0};toneMapping=0;toneMappingExposure=1;private ratio=1;private width=1;private height=1;
 setPixelRatio(n:number){this.ratio=Math.min(n,1.25)}
 setClearColor(){}
 setSize(w:number,h:number){this.width=w;this.height=h;this.domElement.width=w*this.ratio;this.domElement.height=h*this.ratio;this.domElement.style.width=w+"px";this.domElement.style.height=h+"px";}
 render(scene:THREE.Scene,camera:THREE.Camera){
 const ctx=this.domElement.getContext("2d")!;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,this.width,this.height);scene.updateMatrixWorld();camera.updateMatrixWorld();
 const matrix=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),normal=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),light=new THREE.Vector3(-.4,.8,.5).normalize();
 const faces:{points:number[];depth:number;color:string;alpha:number}[]=[],labels:{x:number;y:number;w:number;h:number;image:CanvasImageSource}[]=[];
 const hemi=scene.children.find(o=>(o as THREE.HemisphereLight).isHemisphereLight) as THREE.HemisphereLight;const night=hemi.intensity<1.4;
 scene.traverseVisible(o=>{
 if((o as THREE.Sprite).isSprite){const s=o as THREE.Sprite,m=s.material as THREE.SpriteMaterial,v=new THREE.Vector3().setFromMatrixPosition(s.matrixWorld).applyMatrix4(matrix);if(v.z>1)return;const distance=camera.position.distanceTo(s.position),h=this.height*s.scale.y/(distance*.69);if(m.map?.image)labels.push({x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height,w:h*4,h,image:m.map.image as CanvasImageSource});return;}
 if(!(o as THREE.Mesh).isMesh)return;const mesh=o as THREE.Mesh,g=mesh.geometry,m=mesh.material as THREE.MeshStandardMaterial;if(!m.color)return;const pos=g.attributes.position,idx=g.index;
 const world:THREE.Vector3[]=[],points:THREE.Vector3[]=[];for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);world.push(v);points.push(v.clone().applyMatrix4(matrix));}
 const count=idx?idx.count:pos.count,step=g.type==="BoxGeometry"?6:3;
 for(let i=0;i<count;i+=step){const ids=step===6?[0,1,4,2].map(j=>idx!.getX(i+j)):[0,1,2].map(j=>idx?idx.getX(i+j):i+j);a.copy(world[ids[0]]);b.copy(world[ids[1]]);c.copy(world[ids[2]]);normal.subVectors(b,a).cross(c.sub(a)).normalize();if(normal.dot(camera.position.clone().sub(a))<=0)continue;
 const vs=ids.map(j=>points[j]);if(vs.some(v=>v.z>1||v.z< -1))continue;const shade=(night?.27:.65)+(night?.2:.4)*Math.max(0,normal.dot(light));const color=m.color.clone().multiplyScalar(shade);if(m.emissive)color.add(m.emissive.clone().multiplyScalar((m.emissiveIntensity||0)*.65));color.convertLinearToSRGB();faces.push({points:vs.flatMap(v=>[(v.x*.5+.5)*this.width,(-v.y*.5+.5)*this.height]),depth:Math.max(...ids.map(j=>world[j].y))<.95?10-ids.reduce((t,j)=>t+world[j].y,0)/ids.length*.1:vs.reduce((t,v)=>t+v.z,0)/vs.length,color:`rgb(${Math.min(255,color.r*255)|0},${Math.min(255,color.g*255)|0},${Math.min(255,color.b*255)|0})`,alpha:m.opacity});
 }
 });
 faces.sort((a,b)=>b.depth-a.depth);for(const f of faces){ctx.globalAlpha=f.alpha;ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(f.points[0],f.points[1]);for(let j=2;j<f.points.length;j+=2)ctx.lineTo(f.points[j],f.points[j+1]);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;for(const l of labels)ctx.drawImage(l.image,l.x-l.w/2,l.y-l.h/2,l.w,l.h);
 }
 dispose(){this.domElement.remove()}
}
