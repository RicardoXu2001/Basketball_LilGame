/* Deterministic planar movement. The simulation owns positions, not the renderer. */
class MotionSystem {
  constructor(){this.bodies=new Map();}
  reset(){this.bodies.clear();}
  sync(players){
    const active=new Set(players.map(p=>p.id));
    for(const id of this.bodies.keys())if(!active.has(id))this.bodies.delete(id);
    players.forEach((p,i)=>{if(!this.bodies.has(p.id)){const slot=i%5;this.bodies.set(p.id,{id:p.id,x:p.team?2.2:-4.2,z:(slot-2)*2.3,vx:0,vz:0,previousX:p.team?2.2:-4.2,previousZ:(slot-2)*2.3,distance:0,previousDistance:0,heading:p.team?-Math.PI/2:Math.PI/2,state:'Idle'});}});
  }
  update(targets,dt){
    this.sync(targets.map(t=>t.player));
    for(const target of targets){
      const b=this.bodies.get(target.player.id),p=target.player;
      b.previousX=b.x;b.previousZ=b.z;b.previousDistance=b.distance;b.state=target.state;
      const dx=target.x-b.x,dz=target.z-b.z,dist=Math.hypot(dx,dz);
      const maxSpeed=(2.5+p.athleticism/44)*(.72+p.stamina/360)*(target.state==='Drive'?1.17:1);
      let vx=dist>.03?dx/dist*Math.min(maxSpeed,dist*2.8):0,vz=dist>.03?dz/dist*Math.min(maxSpeed,dist*2.8):0;
      for(const other of this.bodies.values())if(other!==b){
        const ax=b.x-other.x,az=b.z-other.z,d=Math.hypot(ax,az);
        if(d>0&&d<1.55){const force=(1.55-d)*2.1;vx+=ax/d*force;vz+=az/d*force;}
      }
      const velocity=Math.hypot(vx,vz);if(velocity>maxSpeed){vx*=maxSpeed/velocity;vz*=maxSpeed/velocity;}
      const change=Math.hypot(vx-b.vx,vz-b.vz),acceleration=9*dt,k=change>acceleration?acceleration/change:1;
      b.vx+=(vx-b.vx)*k;b.vz+=(vz-b.vz)*k;b.x+=b.vx*dt;b.z+=b.vz*dt;
    }
    // Resolve body radii after steering. Ten actors need no spatial indexing.
    const bodies=[...this.bodies.values()];
    for(let iteration=0;iteration<10;iteration++)for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j];let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
      if(d<.88){if(d<.0001){dx=Math.cos(i+j);dz=Math.sin(i+j);d=1;}const push=(.88-Math.min(.88,Math.hypot(b.x-a.x,b.z-a.z)))/2+.00001;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push;}
    }
    for(const b of bodies){
      b.x=Math.max(-13.1,Math.min(13.1,b.x));b.z=Math.max(-6.65,Math.min(6.65,b.z));
      const traveled=Math.hypot(b.x-b.previousX,b.z-b.previousZ);b.distance+=traveled;b.speed=traveled/dt;
      if(b.speed>.12){const heading=Math.atan2(b.x-b.previousX,b.z-b.previousZ);const delta=Math.atan2(Math.sin(heading-b.heading),Math.cos(heading-b.heading));b.heading+=delta*Math.min(1,dt*9);}
    }
  }
  sample(id,alpha=1){const b=this.bodies.get(id);if(!b)return null;const k=Math.max(0,Math.min(1,alpha));return {...b,x:b.previousX+(b.x-b.previousX)*k,z:b.previousZ+(b.z-b.previousZ)*k,distance:b.previousDistance+(b.distance-b.previousDistance)*k};}
}
if(typeof module!=='undefined'&&module.exports)module.exports={MotionSystem};
