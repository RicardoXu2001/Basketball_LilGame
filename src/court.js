/* A self-contained sunset diorama: every texture and object is made locally. */
class CourtRenderer {
  constructor(canvas,engine) {
    this.canvas=canvas; this.engine=engine; this.random=seededRandom(7721); this.rigs=new Map(); this.crowd=[]; this.materials=new Map(); this.showTactics=false;this.quality='clear';
    this.scene=new THREE.Scene(); this.scene.fog=new THREE.Fog(0xc8b6ac,110,180);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputEncoding=THREE.sRGBEncoding; this.renderer.setClearColor(0x000000,0);
    this.camera=new THREE.OrthographicCamera(-25,25,15,-15,.1,180);
    this.camera.position.set(31,34,39); this.camera.lookAt(0,1,-2.2);
    this.scene.add(new THREE.HemisphereLight(0xffe4bd,0x657985,.8));
    const sun=new THREE.DirectionalLight(0xffb975,1.05); sun.position.set(-22,30,-16); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-30,right:30,top:25,bottom:-25,near:1,far:95}); sun.shadow.bias=-.0005; sun.shadow.normalBias=.03; this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0xc3d6f1,.35);fill.position.set(15,12,25);this.scene.add(fill);
    this.cube=new THREE.BoxGeometry(1,1,1); this.buildWorld();this.batchStaticBoxes(); this.buildBall(); this.syncPlayers();
    this.tacticGroup=new THREE.Group();this.scene.add(this.tacticGroup); this.tacticKey='';
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  }
  batchStaticBoxes(){
    const groups=new Map();this.scene.updateMatrixWorld(true);
    for(const mesh of [...this.scene.children])if(mesh.isMesh&&mesh.geometry===this.cube){const key=mesh.material;const group=groups.get(key)||[];group.push(mesh);groups.set(key,group);}
    for(const [material,meshes]of groups){const batch=new THREE.InstancedMesh(this.cube,material,meshes.length);meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);this.scene.remove(mesh);});batch.castShadow=batch.receiveShadow=true;this.scene.add(batch);}
  }
  rand(a,b) { return a+(b-a)*this.random(); }
  material(color) { if(!this.materials.has(color)) this.materials.set(color,new THREE.MeshLambertMaterial({color})); return this.materials.get(color); }
  box(x,y,z,w,h,d,color,parent=this.scene) {
    const m=new THREE.Mesh(this.cube,this.material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  cylinder(x,y,z,r,h,color,segments=8,parent=this.scene) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),this.material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  line(points,color,opacity=1,parent=this.scene) {
    const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    const m=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));parent.add(m);return m;
  }
  texture(w,h,draw) {
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;draw(ctx,w,h);
    const tex=new THREE.CanvasTexture(canvas);tex.minFilter=tex.magFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.encoding=THREE.sRGBEncoding;return tex;
  }
  sign(text,w,h,bg,fg,size=46,font='900',parent=this.scene) {
    const tex=this.texture(512,128,(c)=>{c.fillStyle=bg;c.fillRect(0,0,512,128);c.fillStyle=fg;c.font=`${font} ${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66,490);});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide}));parent.add(mesh);return mesh;
  }
  buildWorld() {
    // A thick, collectible city block, with a pavement border and worn asphalt.
    this.box(0,-.85,-1.8,38,1.5,29,0x766f6a);this.box(0,-.12,-1.8,38,.18,29,0xb4a89a);
    this.box(0,.005,0,29.4,.12,16.7,0x3e565e);
    this.box(0,-.08,10.8,38,.1,3.1,0x6b7072);
    for(let x=-17;x<18;x+=3) this.box(x,.005,10.85,1.5,.02,.12,0xcdbfa8);
    // Hand-painted, weathered full court texture.
    const courtTexture=this.texture(1024,560,(c,w,h)=>{
      c.fillStyle='#48686d';c.fillRect(0,0,w,h);
      c.fillStyle='#3c5b60';c.fillRect(0,0,w/2,h);c.fillStyle='#426267';c.fillRect(w/2,0,w/2,h);
      c.fillStyle='#b26d53';c.fillRect(18,168,185,224);c.fillRect(w-203,168,185,224);
      c.fillStyle='#b87c5f';c.fillRect(18,168,65,224);c.fillRect(w-83,168,65,224);
      for(let i=0;i<15000;i++) {c.fillStyle=this.random()>.5?'rgba(231,210,172,.07)':'rgba(15,39,45,.09)';c.fillRect(this.rand(0,w),this.rand(0,h),this.rand(1,4),this.rand(1,3));}
      const line='#dfd7b9';c.strokeStyle=line;c.lineWidth=3;c.strokeRect(20,20,w-40,h-40);
      c.beginPath();c.moveTo(w/2,20);c.lineTo(w/2,h-20);c.stroke();
      c.beginPath();c.arc(w/2,h/2,62,0,Math.PI*2);c.stroke();
      for(const right of [false,true]) {
        c.save();if(right){c.translate(w,0);c.scale(-1,1);}
        c.strokeRect(20,168,183,224);c.beginPath();c.arc(203,280,76,-Math.PI/2,Math.PI/2);c.stroke();
        c.beginPath();c.moveTo(20,58);c.lineTo(84,58);c.arc(84,280,222,-Math.PI/2,Math.PI/2);c.lineTo(20,502);c.stroke();
        c.beginPath();c.arc(78,280,34,-Math.PI/2,Math.PI/2);c.stroke();c.restore();
      }
      c.fillStyle='#d8cbb0';c.font='900 31px Arial';c.textAlign='center';c.save();c.translate(w/2,h/2);c.rotate(-Math.PI/2);c.fillText('RIVERSIDE',0,-8);c.font='bold 12px monospace';c.fillText('OUR COURT. OUR RULES.',0,15);c.restore();
      // Fine cracks and chipped paint, never enough to hide court geometry.
      c.strokeStyle='rgba(19,40,44,.35)';c.lineWidth=1;
      for(let i=0;i<24;i++){const x=this.rand(40,980),y=this.rand(25,535);c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y+5);c.lineTo(x+17,y+18);c.lineTo(x+30,y+21);c.stroke();}
    });
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,15),new THREE.MeshLambertMaterial({map:courtTexture}));floor.rotation.x=-Math.PI/2;floor.position.y=.08;floor.receiveShadow=true;this.scene.add(floor);
    for(const x of [-12,12])this.hoop(x);
    // Back wall, street art and independent neighborhood shops.
    this.box(0,.92,-9.2,35,1.85,.35,0x826e62);
    for(let x=-17;x<17;x+=.8)for(let y=.25;y<1.8;y+=.32)this.box(x+(Math.floor(y*3)%2)*.35,y,-8.997,.7,.018,.01,0xa38a73);
    const graffiti=this.texture(1024,128,(c,w,h)=>{
      c.fillStyle='#7c6b63';c.fillRect(0,0,w,h);c.textBaseline='middle';c.textAlign='center';
      c.font='italic 900 93px Arial';c.strokeStyle='#253f48';c.lineWidth=12;c.strokeText('STAY  IN  THE  GAME',w/2,68);c.fillStyle='#e8bc77';c.fillText('STAY  IN  THE  GAME',w/2,68);
      c.strokeStyle='#b86f59';c.lineWidth=5;c.beginPath();c.moveTo(40,111);c.lineTo(360,102);c.moveTo(640,112);c.lineTo(980,102);c.stroke();
    });
    const art=new THREE.Mesh(new THREE.PlaneGeometry(20,1.8),new THREE.MeshLambertMaterial({map:graffiti}));art.position.set(0,1,-8.98);this.scene.add(art);
    this.fence(-17,-9,17,-9,3.2);this.fence(-15,-9,-15,6,2.8);this.fence(15,-9,15,6,2.8);
    const blocks=[[-13,7,7,0x9f7057],[-6.4,5.5,8.7,0xc18e69],[.2,6.6,6.1,0x797f72],[7,5.8,9.3,0xb87e61],[13.4,6.4,6.9,0x8f8b7a]];
    blocks.forEach(([x,w,h,col],i)=>this.building(x,-13,w,h,col,i));
    // Background roof tanks and aerials punctuate the skyline.
    for(const x of [-12.5,6.5]) {
      const y=x<0?8.1:10.5;
      for(const dx of [-.65,.65])for(const dz of [-.65,.65])this.box(x+dx,y-.4,-13+dz,.11,1.4,.11,0x3f4647);
      this.cylinder(x,y+.8,-13,1,1.6,0x63594d,12);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.13,.55,12),this.material(0x424b4b));roof.position.set(x,y+1.85,-13);this.scene.add(roof);
    }
    // A small shop awning and a local hand-painted sign.
    this.box(-11,1.8,-9.9,4.2,.22,1.7,0x315d5a);
    for(let i=0;i<9;i++)this.box(-12.9+i*.46,1.81,-9.9,.2,.24,1.72,0xd8c59b);
    const deli=this.sign('CORNER DELI',4.1,.65,'#ded3b5','#2c514e',47);deli.position.set(-11,2.5,-10.35);
    const shop=this.sign('RECORDS & TAPES',4.7,.75,'#33444a','#e0ba86',38);shop.position.set(9.6,2.5,-10.3);
    // Fire escape ladders on the apartment face.
    for(let y=3.5;y<8;y+=2.15) {
      this.box(-5.4,y,-9.9,2,.1,1.1,0x42494a);
      for(const x of [-6.35,-4.45])this.box(x,y+.4,-9.35,.065,.8,.065,0x3f4749);
      this.box(-5.4,y+.75,-9.35,2,.055,.055,0x3f4749);
      for(let k=0;k<9;k++)this.box(-5.9+k*.13,y+.08+k*.2,-9.95,.5,.08,.08,0x454a49);
    }
    for(const [x,z] of [[-16,5],[15.8,-7],[-1,-9.8]])this.lamp(x,z);
    // Overhead service cable.
    this.line([[-18,7.3,-8],[-10,6.4,-8],[-2,6.1,-8],[7,6.4,-8],[17,7.5,-8]],0x494b49,.8);
    this.box(-17.8,3.65,-8,.16,7.3,.16,0x6c5c4a);this.box(17,3.8,-8,.16,7.6,.16,0x6c5c4a);
    // Living edges: benches, milk crates, cans, bike, plants, spectators.
    this.bench(-6,8.7);this.bench(6.8,8.7);this.bench(-11,-7.9);
    this.box(-3, .36,8.8,.85,.65,.65,0x336e78);this.box(-3,.71,8.8,.9,.1,.7,0xe7d3b0);
    for(let i=0;i<5;i++)this.cylinder(-3.3+i*.15,.85,8.8,.045,.22,i%2?0xd3ad66:0xc7d6ca,6);
    for(const [x,z]of [[-16,7.5],[13.5,8.5],[-15,-7.7]]){this.cylinder(x,.5,z,.4,1,0x495c55);this.cylinder(x,1.03,z,.44,.12,0x293c39);}
    this.box(8.6,.18,9.5,.45,.35,.38,0x8e6555);this.box(9.15,.16,9.4,.45,.28,.4,0x3e4b61);
    this.bike(-13.5,8.7);
    for(const [x,z]of [[-17,-4],[-17,-11],[17,-11]])this.tree(x,z);
    this.box(16,.35,5,1.2,.7,1.2,0x918372);this.box(16,.9,5,1.1,.6,1.1,0x7c8b5e);
    const spectators=[[-10,8,0],[-9.25,8.25,0],[-8.4,8.15,0],[-4,8.65,0],[-.5,8.8,0],[.3,9.1,0],[1.1,8.9,0],[4.2,8.4,0],[5.2,8.5,0],[10.7,8.3,0],[11.5,8.7,0],[-15,2,1.2],[-15,-.3,1.3],[-14.6,-2,1.4],[15,2,-1.4],[15,3.2,-1.5],[14.8,-2,-1.4],[-10,-7.8,2.9],[-8.6,-7.9,2.9],[6,-8,2.9],[7.1,-7.9,2.9]];
    spectators.forEach(([x,z,face],i)=>{
      const person=this.person(['#e4bd87','#5b7979','#b66e55','#e1d7b8','#596778','#83946b'][i%6],i%4,false);
      person.root.position.set(x,.12,z);person.root.rotation.y=face;person.root.scale.setScalar(this.rand(.78,.98));this.crowd.push(person);
    });
    const courtName=this.sign('RIVERSIDE  /  EST. 1996',7,.42,'#b5a08a','#4f5c57',30);courtName.rotation.x=-Math.PI/2;courtName.position.set(0,.04,8.1);
  }
  hoop(x) {
    const side=Math.sign(x), pole=x+side*2.3;
    this.box(pole,.2,0,1,.4,1.35,0x3a4d4f);this.box(pole,1.95,0,.18,3.7,.18,0x56696c);
    this.box(x+side*.7,3.7,0,3,.13,.14,0x657b7b);
    const board=this.box(x+side*.46,3.5,0,.13,1.45,2.3,0xd4d4bc);
    this.box(x+side*.38,3.5,0,.025,.72,1.1,0x3f6063);this.box(x+side*.35,3.5,0,.028,.58,.96,0xdad7bd);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.29,.045,4,16),this.material(0xe78c44));rim.rotation.x=Math.PI/2;rim.position.set(x,3.05,0);this.scene.add(rim);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;this.line([[x+Math.cos(a)*.28,3.04,Math.sin(a)*.28],[x+Math.cos(a+.15)*.17,2.53,Math.sin(a+.15)*.17]],0xf1e6c9,.85);}
    const band=new THREE.Mesh(new THREE.TorusGeometry(.18,.018,3,12),this.material(0xe4dfc8));band.rotation.x=Math.PI/2;band.position.set(x,2.55,0);this.scene.add(band);
    this.box(pole,.9,0,.45,1.2,.55,0x98684f);
  }
  fence(x1,z1,x2,z2,height) {
    const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),dir=new THREE.Vector3(dx/len,0,dz/len);
    for(let d=0;d<=len;d+=3.3)this.box(x1+dir.x*d,height/2,z1+dir.z*d,.085,height,.085,0x4c5d5a);
    this.line([[x1,height,z1],[x2,height,z2]],0x4c5d5a);
    const pts=[];
    for(let d=-height;d<len;d+=.55){const a=Math.max(0,d),b=Math.min(len,d+height),ya=Math.max(0,-d),yb=height-Math.max(0,d+height-len);pts.push([x1+dir.x*a,ya,z1+dir.z*a],[x1+dir.x*b,yb,z1+dir.z*b]);pts.push([x1+dir.x*a,height-ya,z1+dir.z*a],[x1+dir.x*b,height-yb,z1+dir.z*b]);}
    const geo=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));this.scene.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x53645e,transparent:true,opacity:.42})));
  }
  building(x,z,w,h,color,index) {
    this.box(x,h/2,z,w,h,5,color);this.box(x,h+.12,z,w+.25,.25,5.25,0x68655b);this.box(x,h+.33,z,w-.25,.3,4.7,0x8e8875);
    for(let yy=1.7;yy<h-.5;yy+=1.65)for(let xx=x-w/2+.8;xx<x+w/2-.2;xx+=1.4){
      this.box(xx,yy,z+2.53,.75,1,.08,0x4b6467);this.box(xx-.13,yy+.1,z+2.59,.22,.65,.02,this.random()>.5?0xe2b579:0x8caaa2);this.box(xx,yy-.55,z+2.62,.95,.1,.2,0xbaa58a);
    }
    for(let y=.6;y<h;y+=.43)this.box(x,y,z+2.51,w,.018,.012,index%2?0x9a745d:0x937c66);
    this.box(x+w/2-.35,h/2,z+2.6,.12,h,.17,0x6e6f60);
    if(index===2){const sign=this.sign('KEEP PLAYING',w-.5,.75,'#d0b082','#454c46',44);sign.position.set(x,h-.5,z+2.56);}
    this.box(x+.4,h+.6,z,1.4,.7,.9,0x828577);
  }
  lamp(x,z) {
    this.cylinder(x,.12,z,.32,.2,0x475052);this.cylinder(x,3.6,z,.08,7,0x48565a);
    this.box(x+.6,7,z,1.3,.1,.1,0x48565a);this.box(x+1.15,6.9,z,.55,.15,.32,0xf6d29a);
    const light=new THREE.PointLight(0xffc278,.45,9);light.position.set(x+1.15,6.7,z);this.scene.add(light);
  }
  bench(x,z) {
    for(const zz of [-.2,0,.2])this.box(x,.58,z+zz,2.4,.11,.16,0xb68a58);
    for(const xx of [-.9,.9])this.box(x+xx,.28,z,.1,.55,.52,0x3e5353);
    this.box(x,.95,z+.25,2.4,.35,.09,0x997349);
  }
  bike(x,z) {
    for(const dx of [-.65,.65]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.46,.045,4,18),this.material(0x303d3c));wheel.position.set(x+dx,.5,z);this.scene.add(wheel);}
    this.line([[x-.65,.5,z],[x-.2,1.25,z],[x+.65,.5,z],[x,.5,z],[x-.2,1.25,z]],0xa9764c);this.line([[x,.5,z],[x+.45,1.3,z],[x+.65,.5,z]],0xa9764c);
    this.box(x-.2,1.3,z,.35,.08,.2,0x354442);this.box(x+.5,1.4,z,.12,.1,.5,0x354442);
  }
  tree(x,z) {
    this.box(x,.25,z,1.3,.5,1.3,0x918372);this.box(x,1.7,z,.24,3,.24,0x715947);
    for(let i=0;i<9;i++)this.box(x+this.rand(-1,1),3.2+this.rand(0,1.7),z+this.rand(-.8,.8),this.rand(.9,1.6),this.rand(.7,1.3),this.rand(.9,1.4),[0x697a50,0x7a8854,0x9b995d][i%3]);
  }
  person(color,skinIndex=0,isPlayer=true,number=0) {
    const root=new THREE.Group();this.scene.add(root);const skin=[0xbc865e,0x855c42,0xdbad82,0x634a39][skinIndex%4];
    const body=new THREE.Group();body.position.y=.94;root.add(body);
    this.box(0,.15,0,.48,.65,.28,color,body);this.box(0,-.28,0,.49,.23,.31,isPlayer?color:0x3b4d52,body);
    this.box(0,.72,0,.36,.4,.35,skin,body);this.box(0,.94,-.015,.38,.12,.37,skinIndex===2?0x624332:0x2c2e2b,body);
    this.box(0,.5,0,.15,.13,.15,skin,body);
    const arms=[],legs=[],elbows=[],knees=[],hands=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.32,.4,0);body.add(arm);this.box(0,-.13,0,.17,.29,.19,skin,arm);
      const elbow=new THREE.Group();elbow.position.y=-.27;arm.add(elbow);this.box(0,-.12,0,.16,.25,.18,skin,elbow);const hand=new THREE.Group();hand.position.set(0,-.26,.02);elbow.add(hand);this.box(0,0,0,.18,.13,.19,skin,hand);arms.push(arm);elbows.push(elbow);hands.push(hand);
      const leg=new THREE.Group();leg.position.set(side*.15,-.37,0);body.add(leg);this.box(0,-.12,0,.18,.25,.2,skin,leg);const knee=new THREE.Group();knee.position.y=-.25;leg.add(knee);this.box(0,-.12,0,.17,.26,.19,skin,knee);this.box(0,-.28,.06,.23,.13,.37,isPlayer?0xe5ddc7:0x323f42,knee);legs.push(leg);knees.push(knee);
    }
    if(isPlayer){
      const tex=this.texture(64,64,c=>{c.clearRect(0,0,64,64);c.fillStyle='#ffedcc';c.font='bold 42px monospace';c.textAlign='center';c.fillText(number,32,48);});
      for(const front of [-1,1]) { const num=new THREE.Mesh(new THREE.PlaneGeometry(.34,.34),new THREE.MeshBasicMaterial({map:tex,transparent:true}));num.position.set(0,.16,front*.146);if(front<0)num.rotation.y=Math.PI;body.add(num); }
    }else{
      // One draw call per spectator; retain voxel colours without rendering every limb separately.
      const positions=[],normals=[],colors=[],v=new THREE.Vector3(),normal=new THREE.Vector3();root.updateMatrixWorld(true);
      root.traverse(part=>{if(!part.isMesh)return;const geometry=part.geometry.toNonIndexed(),pa=geometry.attributes.position,na=geometry.attributes.normal,nm=new THREE.Matrix3().getNormalMatrix(part.matrixWorld),color=part.material.color;
        for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(part.matrixWorld);normal.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();positions.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);colors.push(color.r,color.g,color.b);}geometry.dispose();});
      const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));merged.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      for(const child of [...root.children])root.remove(child);this.crowdMaterial ||=new THREE.MeshLambertMaterial({vertexColors:true});const spectator=new THREE.Mesh(merged,this.crowdMaterial);spectator.receiveShadow=true;root.add(spectator);
    }
    return {root,body,arms,legs,elbows,knees,hands};
  }
  syncPlayers() {
    const ids=new Set(this.engine.teams.flat().filter(p=>p.onCourt).map(p=>p.id));
    for(const [id,rig]of this.rigs) {rig.root.visible=ids.has(id);}
    for(const p of this.engine.teams.flat().filter(p=>p.onCourt)) {
      if(!this.rigs.has(p.id)) { const rig=this.person(p.team?'#bd663c':'#267c93',this.engine.teams[p.team].indexOf(p),true,p.number);rig.player=p;rig.root.position.set(p.team?3:-3,.1,this.rand(-5,5));this.rigs.set(p.id,rig); }
      this.rigs.get(p.id).root.visible=true;this.rigs.get(p.id).player=p;
    }
  }
  buildBall() {
    this.ball=new THREE.Group();this.scene.add(this.ball);
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),this.material(0xf1a151));mesh.castShadow=true;this.ball.add(mesh);
    for(const r of [[0,0,0],[Math.PI/2,0,0],[0,Math.PI/2,0]]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.202,.012,3,16),this.material(0x654832));ring.rotation.set(...r);this.ball.add(ring);}
    this.marker=new THREE.Mesh(new THREE.RingGeometry(.52,.62,24),new THREE.MeshBasicMaterial({color:0xffd393,side:THREE.DoubleSide,transparent:true,opacity:.9}));this.marker.rotation.x=-Math.PI/2;this.scene.add(this.marker);
    this.ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.23,12),new THREE.MeshBasicMaterial({color:0x192e35,transparent:true,opacity:.28,depthWrite:false}));this.ballShadow.rotation.x=-Math.PI/2;this.scene.add(this.ballShadow);
  }
  resize() {
    const {width,height}=this.canvas.parentElement.getBoundingClientRect();
    if(!width||!height)return;
    this.renderer.setPixelRatio(this.quality==='clear'?Math.min(devicePixelRatio||1,2):.7);
    this.renderer.setSize(Math.round(width),Math.round(height),false);
    const aspect=width/height, viewHeight=width<650?37/aspect:Math.max(32,50/aspect);
    this.camera.left=-viewHeight*aspect/2;this.camera.right=viewHeight*aspect/2;this.camera.top=viewHeight/2;this.camera.bottom=-viewHeight/2;this.camera.updateProjectionMatrix();
  }
  updateTactics(positions) {
    const e=this.engine,key=`${this.showTactics}-${e.attack}-${e.defense}-${e.possession}-${e.phase}`;
    if(key===this.tacticKey)return;this.tacticKey=key;
    for(const child of [...this.tacticGroup.children]){this.tacticGroup.remove(child);child.geometry.dispose();child.material.dispose();}
    this.tacticGroup.visible=this.showTactics;if(!this.showTactics)return;
    const off=positions.slice(0,5);
    for(let i=1;i<5;i++)this.line([[off[0].x,.12,off[0].z],[off[i].x,.12,off[i].z]],0xffe1a1,.55,this.tacticGroup);
    positions.forEach(p=>{const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.74,20),new THREE.MeshBasicMaterial({color:p.player.team?0xf1a77f:0x9edcda,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.12,p.z);this.tacticGroup.add(ring);});
  }
  render(dt) {
    const e=this.engine;this.syncPlayers();const positions=e.positions(),t=e.time,simDt=e.paused?0:dt*e.speed,alpha=e.paused?1:e.accumulator/.05;
    positions.forEach(target=>{
      const rig=this.rigs.get(target.player.id),p=rig.root.position;
      const motion=e.motion.sample(target.player.id,alpha),speed=motion?.speed||0,cycle=(motion?.distance||0)*4.4;
      p.x=motion?.x??target.x;p.z=motion?.z??target.z;
      const moving=speed>.15,stride=Math.min(1,speed/3.5),isDefending=target.state==='Defend';
      let jump=0;if(target.state==='Shoot'){if(e.phase==='shoot')jump=Math.sin(e.progress*Math.PI/2)*.38;else jump=Math.max(0,.38-e.progress*1.2);}
      if(target.state==='Rebound'&&Math.hypot(Math.abs(p.x)-12,p.z)<2.5)jump=Math.max(0,Math.sin(e.progress*Math.PI))*.38;
      p.y=.13+jump;rig.body.position.y=.94+(moving?Math.abs(Math.sin(cycle))*.025:Math.sin(t*1.7+target.player.number)*.009);
      rig.body.rotation.x=moving?Math.min(.13,speed*.025):0;
      rig.legs.forEach((leg,i)=>{const wave=Math.sin(cycle+i*Math.PI);leg.rotation.x=moving?wave*.6*stride:(isDefending?-.12:0);leg.rotation.z=isDefending?(i?-.13:.13):0;rig.knees[i].rotation.x=moving?Math.max(0,-wave)*.8*stride:.06;});
      rig.arms.forEach((arm,i)=>{
        let desired=moving?-Math.sin(cycle+i*Math.PI)*.42*stride:-.08;
        if(target.state==='Shoot')desired=e.phase==='shoot'?-.6-e.progress*2:-2.6+Math.min(1,e.progress*2)*.4;
        if(target.state==='Celebrate')desired=i===0?-2.2:-.3;
        if(target.state==='Catch')desired=-1.1+e.progress*.3;
        if(isDefending)desired=-.5;
        if(target.state==='Screen')desired=-.75;
        if(target.state==='Pass')desired=-.5-Math.sin(e.progress*Math.PI)*1.1;
        arm.rotation.x+=(desired-arm.rotation.x)*Math.min(1,Math.max(.02,simDt*13));
        arm.rotation.z=isDefending?(i?-.65:.65):0;
        rig.elbows[i].rotation.x=target.state==='Shoot'?-.4:target.state==='Screen'?-1.2:target.state==='Catch'?-.6:-.25;
      });
      if(target.state==='Dribble'){rig.arms[1].rotation.x=-.28+Math.cos(t*12)*.25;rig.elbows[1].rotation.x=-.25+Math.sin(t*12)*.3;}
      const side=(target.player.team===0?1:-1)*e.direction;
      const holder=e.motion.sample(e.handler.id),face=isDefending||(target.state==='Catch'&&e.phase==='pass')?Math.atan2(holder.x-p.x,holder.z-p.z):moving&&!['Shoot','Pass','Catch'].includes(target.state)?motion.heading:Math.atan2(side*12-p.x,-p.z);
      let delta=face-rig.root.rotation.y;delta=Math.atan2(Math.sin(delta),Math.cos(delta));rig.root.rotation.y+=delta*Math.min(1,simDt*6);
      rig.state=target.state;
    });
    const handler=this.rigs.get(e.handler.id), hp=handler.root.position;
    this.marker.position.set(hp.x,.12,hp.z);this.marker.visible=!e.ended&&e.phase!=='flight';
    const b=this.ball.position;
    if(e.phase==='pass'&&e.receiver) {
      const rp=this.rigs.get(e.receiver.id).root.position,u=e.progress,from=e.passOrigin||hp;
      b.set(from.x+(rp.x-from.x)*u,1.35+Math.sin(u*Math.PI)*.3,from.z+(rp.z-from.z)*u);
    } else if(e.phase==='shoot'&&e.shot) {
      b.set(hp.x,1.5+e.progress*.75,hp.z);
    } else if(e.phase==='flight'&&e.shot) {
      const start=e.shot.origin||new THREE.Vector3(hp.x,2.3,hp.z),u=e.progress;
      const endX=e.shot.side*12+(e.shot.made?0:.45),endZ=e.shot.made?0:.65;
      const arc=Math.max(1,Math.min(3.4,Math.hypot(endX-start.x,endZ-start.z)*.35));
      b.set(start.x+(endX-start.x)*u,start.y+(3.05-start.y)*u+Math.sin(u*Math.PI)*arc,start.z+(endZ-start.z)*u);
    } else if(['transition','rebound'].includes(e.phase)&&e.shot) {
      const u=e.progress;b.set(e.shot.side*12+(e.shot.made?0:.45+Math.sin(u*2)*1.3),Math.max(.21,3.05-u*4.1+Math.max(0,u-.6)*3),e.shot.made?0:.65+u*1.7);
    } else {const yaw=handler.root.rotation.y;b.set(hp.x+Math.cos(yaw)*.4+Math.sin(yaw)*.22,.23+Math.abs(Math.cos(t*6))*1.02,hp.z-Math.sin(yaw)*.4+Math.cos(yaw)*.22);}
    this.ball.rotation.x=t*5;this.ball.rotation.z=t*3;this.ballShadow.position.set(b.x,.115,b.z);
    this.crowd.forEach((rig,i)=>{const hype=e.phase==='transition'&&e.shot?.made;rig.root.position.y=.12+(hype?Math.abs(Math.sin(t*7+i))*.15:Math.sin(t*2+i)*.012);});
    this.updateTactics(positions);this.renderer.render(this.scene,this.camera);
  }
  reset() {for(const rig of this.rigs.values()){this.scene.remove(rig.root);rig.root.traverse(o=>{if(o.geometry&&o.geometry!==this.cube)o.geometry.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});}this.rigs.clear();this.syncPlayers();}
}

