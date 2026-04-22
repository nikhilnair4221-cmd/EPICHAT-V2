import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Zap, Activity, Radio, ZoomIn, ZoomOut, RotateCcw, View, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── 10-20 EEG positions ──────────────────────────────────────────────────────
const ELECTRODES = [
  { id:0,  label:'Fp1', pos:[-0.30, 0.52, 0.80], region:'Frontal'   },
  { id:1,  label:'Fp2', pos:[ 0.30, 0.52, 0.80], region:'Frontal'   },
  { id:2,  label:'F7',  pos:[-0.82, 0.15, 0.50], region:'Frontal'   },
  { id:3,  label:'F8',  pos:[ 0.82, 0.15, 0.50], region:'Frontal'   },
  { id:4,  label:'F3',  pos:[-0.48, 0.42, 0.66], region:'Frontal'   },
  { id:5,  label:'F4',  pos:[ 0.48, 0.42, 0.66], region:'Frontal'   },
  { id:6,  label:'T7',  pos:[-0.95,-0.10, 0.14], region:'Temporal'  },
  { id:7,  label:'T8',  pos:[ 0.95,-0.10, 0.14], region:'Temporal'  },
  { id:8,  label:'C3',  pos:[-0.66, 0.36, 0.00], region:'Central'   },
  { id:9,  label:'C4',  pos:[ 0.66, 0.36, 0.00], region:'Central'   },
  { id:10, label:'P7',  pos:[-0.78,-0.14,-0.54], region:'Parietal'  },
  { id:11, label:'P8',  pos:[ 0.78,-0.14,-0.54], region:'Parietal'  },
  { id:12, label:'P3',  pos:[-0.48, 0.28,-0.62], region:'Parietal'  },
  { id:13, label:'P4',  pos:[ 0.48, 0.28,-0.62], region:'Parietal'  },
  { id:14, label:'O1',  pos:[-0.28, 0.04,-0.92], region:'Occipital' },
  { id:15, label:'O2',  pos:[ 0.28, 0.04,-0.92], region:'Occipital' },
  { id:16, label:'Fz',  pos:[ 0.00, 0.56, 0.74], region:'Frontal'   },
  { id:17, label:'Cz',  pos:[ 0.00, 0.80, 0.00], region:'Central'   },
];

const gauss = (v,mu,sig) => Math.exp(-((v-mu)**2)/(2*sig*sig));

// ─── Procedural Geometries ────────────────────────────────────────────────────
function buildHemiGeo() {
  const geo = new THREE.SphereGeometry(1.0, 80, 60);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    x*=0.90; y*=0.85; z*=0.76;
    const frontal   = gauss(z, 0.68,0.28)*gauss(y, 0.32,0.36)*0.15;
    const parietal  = gauss(z,-0.18,0.28)*gauss(y, 0.52,0.30)*0.13;
    const temporal  = gauss(Math.abs(x)-0.80,0,0.20)*gauss(y,-0.06,0.38)*0.12;
    const occipital = gauss(z,-0.82,0.25)*gauss(y, 0.00,0.32)*0.10;
    const gyri =
      Math.sin(z*11+y*8+x*2.5)*0.034+
      Math.sin(x*9+z*7+y*4  )*0.026+
      Math.cos(y*13+z*4.5   )*0.020+
      Math.sin(x*7+y*15     )*0.016+
      Math.cos(z*16+x*5.5   )*0.012+
      Math.sin(y*20+z*3     )*0.008;
    const disp=frontal+parietal+temporal+occipital+gyri;
    const len=Math.sqrt(x*x+y*y+z*z)||1;
    pos.setXYZ(i,x+(x/len)*disp,y+(y/len)*disp,z+(z/len)*disp);
  }
  pos.needsUpdate=true; geo.computeVertexNormals(); return geo;
}

function buildCerebellumGeo() {
  const geo = new THREE.SphereGeometry(0.40,48,36);
  const pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const ridge=Math.sin(y*20)*0.030+Math.sin(y*34)*0.014+Math.cos(x*15)*0.010;
    const len=Math.sqrt(x*x+y*y+z*z)||1;
    pos.setXYZ(i,x+(x/len)*ridge,y+(y/len)*ridge,z+(z/len)*ridge);
  }
  pos.needsUpdate=true; geo.computeVertexNormals(); return geo;
}

function buildHeadProfileGeo() {
  const geo = new THREE.SphereGeometry(1.35, 64, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    // Squish on X to make head oval
    x *= 0.8;
    y *= 1.15;
    z *= 1.05;
    
    // Frontal facial features (nose, lips, chin)
    if (z > 0.6 && Math.abs(x) < 0.35) {
      // Nose bridge
      const nose = gauss(y, -0.05, 0.18) * gauss(x, 0, 0.15) * 0.28;
      // Brow ridge
      const brow = gauss(y, 0.35, 0.1) * gauss(x, 0, 0.25) * 0.08;
      // Chin
      const chin = gauss(y, -0.7, 0.15) * gauss(x, 0, 0.2) * 0.15;
      
      z += (nose + brow + chin);
    }
    
    // Neck taper
    if (y < -0.8) {
      const taper = Math.max(0, (-0.8 - y) * 0.4);
      x *= (1 - taper);
      z *= (1 - taper);
    }
    
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate=true; geo.computeVertexNormals(); return geo;
}

const hemiGeo       = buildHemiGeo();
const cerebellumGeo = buildCerebellumGeo();
const headGeo       = buildHeadProfileGeo();

// ─── Waveform Canvas ──────────────────────────────────────────────────────────
function WaveformCanvas({ electrodeId, status, width=220, height=50 }) {
  const ref=useRef();
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const dpr=window.devicePixelRatio||1;
    c.width=width*dpr; c.height=height*dpr;
    const ctx=c.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    
    const color = status === 'Seizure' ? '#ef4444' : status === 'Elevated' ? '#f59e0b' : '#06b6d4';
    
    let s=electrodeId*137+41;
    const rand=()=>{s=(s*16807)%2147483647;return(s/2147483647-0.5)*2;};
    const isHot = status === 'Seizure';
    const wave=Array.from({length:120},(_,i)=>{
      const t=i/120;
      return Math.sin(t*Math.PI*6+electrodeId)*0.4
            +Math.sin(t*Math.PI*14+electrodeId*0.7)*0.25
            +rand()*0.18+(isHot?Math.sin(t*Math.PI*28)*0.55:0);
    });
    const mid=height/2,amp=height*0.38;
    ctx.beginPath();
    ctx.strokeStyle=color;
    ctx.lineWidth=1.5;
    ctx.shadowColor=color;
    ctx.shadowBlur=8;
    wave.forEach((v,i)=>{
      const x=(i/119)*width,y=mid-v*amp;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
  },[electrodeId,status,width,height]);
  return <canvas ref={ref} style={{width,height,display:'block',borderRadius:6,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.05)'}}/>;
}

// ─── Apple Vision Pro Style Tooltip (Hover) ───────────────────────────────────
function VisionTooltip({ electrode, status }) {
  const domBand = status === 'Seizure' ? 'Gamma' : status === 'Elevated' ? 'Beta' : 'Alpha';
  const freq    = status === 'Seizure' ? '30+ Hz' : status === 'Elevated' ? '22 Hz' : '10 Hz';
  const amp     = status === 'Seizure' ? '145 µV' : status === 'Elevated' ? '85 µV' : '42 µV';
  
  const col = status === 'Seizure' ? '#ef4444' : status === 'Elevated' ? '#f59e0b' : '#06b6d4';
  const glow = status === 'Seizure' ? 'rgba(239,68,68,0.2)' : status === 'Elevated' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid rgba(255,255,255,0.1)`,
        borderTop: `1px solid rgba(255,255,255,0.2)`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        borderRadius: 16, padding: '12px 16px', minWidth: 180,
        pointerEvents: 'none', color: '#f8fafc',
      }}
    >
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:col,boxShadow:`0 0 10px ${col}`}}/>
        <span style={{fontWeight:600,fontSize:'0.95rem',letterSpacing:'0.02em'}}>{electrode.label}</span>
        <span style={{fontSize:'0.65rem',color:'#94a3b8',background:'rgba(255,255,255,0.1)',padding:'2px 6px',borderRadius:6}}>{electrode.region}</span>
      </div>
      
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem'}}>
          <span style={{color:'#94a3b8'}}>Status</span>
          <span style={{color:col,fontWeight:600}}>{status}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem'}}>
          <span style={{color:'#94a3b8'}}>Frequency</span>
          <span>{freq}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem'}}>
          <span style={{color:'#94a3b8'}}>Amplitude</span>
          <span>{amp}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem'}}>
          <span style={{color:'#94a3b8'}}>Band</span>
          <span>{domBand}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',marginTop:4,paddingTop:4,borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          <span style={{color:'#64748b'}}>Last updated</span>
          <span style={{color:'#94a3b8'}}>Live</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Vision Pro Side Panel (Click) ────────────────────────────────────────────
function VisionSidePanel({ electrode, status, onClose }) {
  const bands=[
    {name:'Delta',hz:'0.5–4',  val:status==='Seizure'?82:status==='Elevated'?30:12,color:'#818cf8'},
    {name:'Theta',hz:'4–8',    val:status==='Seizure'?65:status==='Elevated'?45:24,color:'#c084fc'},
    {name:'Alpha',hz:'8–13',   val:status==='Seizure'?18:status==='Elevated'?50:78,color:'#34d399'},
    {name:'Beta', hz:'13–30',  val:status==='Seizure'?45:status==='Elevated'?75:35,color:'#f59e0b'},
    {name:'Gamma',hz:'30+',    val:status==='Seizure'?91:status==='Elevated'?40:10,color:'#ef4444'},
  ];
  const col = status === 'Seizure' ? '#ef4444' : status === 'Elevated' ? '#f59e0b' : '#06b6d4';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position:'absolute',top:20,right:20,width:280,zIndex:40,
        background:'rgba(15, 23, 42, 0.65)',
        backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.15)',
        borderTop:'1px solid rgba(255,255,255,0.25)',
        borderRadius:24,padding:20,
        boxShadow:'0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        color:'#f8fafc',
      }}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:col,boxShadow:`0 0 12px ${col}`}}/>
            <span style={{fontWeight:700,fontSize:'1.2rem',letterSpacing:'0.02em'}}>{electrode.label}</span>
          </div>
          <div style={{fontSize:'0.75rem',color:'#94a3b8',display:'flex',gap:6}}>
            <span>{electrode.region} Lobe</span>
            <span>•</span>
            <span style={{color:col,fontWeight:600}}>{status}</span>
          </div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:'pointer',backdropFilter:'blur(10px)'}}>
          <X size={14}/>
        </button>
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
          <Activity size={12}/> Live Waveform
        </div>
        <WaveformCanvas electrodeId={electrode.id} status={status} width={238} height={60} />
      </div>

      <div>
        <div style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
          <Radio size={12}/> Power Spectrum
        </div>
        {bands.map(({name,hz,val,color})=>(
          <div key={name} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:'0.75rem',color:'#cbd5e1'}}>{name} <span style={{color:'#64748b',fontSize:'0.65rem'}}>({hz} Hz)</span></span>
              <span style={{fontSize:'0.75rem',fontWeight:600,color}}>{val}%</span>
            </div>
            <div style={{height:4,background:'rgba(0,0,0,0.4)',borderRadius:4,overflow:'hidden',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.5)'}}>
              <motion.div 
                initial={{width:0}} animate={{width:`${val}%`}} transition={{duration:1,delay:0.1,ease:'easeOut'}}
                style={{height:'100%',background:color,borderRadius:4,boxShadow:`0 0 8px ${color}88`}}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Electrode Node ───────────────────────────────────────────────────────────
function ElectrodeNode({ electrode, status, onHover, onHoverOut, onClick }) {
  const mesh=useRef(), glow=useRef();
  const [hov,setHov]=useState(false);
  const pos=electrode.pos.map(v=>v*1.09);
  
  const col = status === 'Seizure' ? '#ef4444' : status === 'Elevated' ? '#f59e0b' : '#06b6d4';
  const emissiveInt = status === 'Seizure' ? 3.5 : status === 'Elevated' ? 2.5 : 1.5;

  useFrame((_,dt)=>{
    if(!mesh.current) return;
    if(status !== 'Normal'){
      const speed = status === 'Seizure' ? 0.008 : 0.004;
      const s=1+Math.sin(Date.now()*speed)*0.20;
      mesh.current.scale.setScalar(s);
      if(glow.current) glow.current.scale.setScalar(s*1.6);
    } else {
      const t=hov?1.5:1.0;
      mesh.current.scale.lerp(new THREE.Vector3(t,t,t),dt*10);
    }
  });

  return (
    <group position={pos}>
      {status !== 'Normal' && (
        <mesh ref={glow}>
          <sphereGeometry args={[0.088,12,12]}/>
          <meshBasicMaterial color={col} transparent opacity={status==='Seizure'?0.25:0.15}/>
        </mesh>
      )}
      <mesh ref={mesh}
        onClick={e=>{e.stopPropagation();onClick(electrode);}}
        onPointerOver={e=>{e.stopPropagation();setHov(true);document.body.style.cursor='pointer';onHover(electrode,e);}}
        onPointerOut={()=>{setHov(false);document.body.style.cursor='';onHoverOut();}}
      >
        <sphereGeometry args={[0.052,16,16]}/>
        <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={hov?emissiveInt+1:emissiveInt} roughness={0.1} metalness={0.8} clearcoat={1.0}/>
      </mesh>
    </group>
  );
}

// ─── Floating Controls UI ─────────────────────────────────────────────────────
function FloatingControls({ onReset, onZoomIn, onZoomOut, onViewChange }) {
  return (
    <div style={{
      position:'absolute', top:20, left:20, zIndex:20,
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{
        background:'rgba(15, 23, 42, 0.5)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:6,
        display:'flex', flexDirection:'column', gap:4, boxShadow:'0 8px 16px rgba(0,0,0,0.3)'
      }}>
        <button onClick={onZoomIn} title="Zoom In" style={ctrlBtnStyle}><ZoomIn size={16}/></button>
        <button onClick={onZoomOut} title="Zoom Out" style={ctrlBtnStyle}><ZoomOut size={16}/></button>
        <button onClick={onReset} title="Reset View" style={ctrlBtnStyle}><RotateCcw size={16}/></button>
      </div>

      <div style={{
        background:'rgba(15, 23, 42, 0.5)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:6,
        display:'flex', flexDirection:'column', gap:4, boxShadow:'0 8px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{color:'#94a3b8', fontSize:10, textAlign:'center', marginBottom:2, fontWeight:600}}><View size={14} style={{margin:'0 auto'}}/></div>
        <button onClick={()=>onViewChange('front')} style={ctrlBtnStyle}><span style={{fontSize:10,fontWeight:700}}>F</span></button>
        <button onClick={()=>onViewChange('left')} style={ctrlBtnStyle}><span style={{fontSize:10,fontWeight:700}}>L</span></button>
        <button onClick={()=>onViewChange('right')} style={ctrlBtnStyle}><span style={{fontSize:10,fontWeight:700}}>R</span></button>
        <button onClick={()=>onViewChange('top')} style={ctrlBtnStyle}><span style={{fontSize:10,fontWeight:700}}>T</span></button>
      </div>
    </div>
  );
}

const ctrlBtnStyle = {
  background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, width:32, height:32,
  display:'flex', alignItems:'center', justifyContent:'center', color:'#f8fafc', cursor:'pointer',
  transition:'background 0.2s'
};

// ─── Scene Assembly ───────────────────────────────────────────────────────────
function BrainScene({ seizureChannels, elevatedChannels, onNodeHover, onNodeHoverOut, onNodeClick }) {
  const groupRef=useRef();

  useFrame((_,dt)=>{if(groupRef.current)groupRef.current.rotation.y+=dt*0.05;});

  return (
    <group ref={groupRef}>
      {/* Translucent Human Head Profile */}
      <mesh geometry={headGeo} position={[0, -0.05, 0]}>
        <meshPhysicalMaterial 
          color="#0f172a" emissive="#0284c7" emissiveIntensity={0.05}
          transparent opacity={0.15} roughness={0.1} transmission={0.9} 
          ior={1.2} thickness={0.5} side={THREE.DoubleSide}
        />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.015}/>
      </mesh>

      {/* RIGHT hemisphere */}
      <group position={[0.045,0,0]}>
        <mesh geometry={hemiGeo}>
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.25}
            transparent opacity={0.65} roughness={0.3} transmission={0.4} metalness={0.2} clearcoat={1.0} side={THREE.FrontSide}/>
        </mesh>
        <mesh geometry={hemiGeo}>
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.03}/>
        </mesh>
      </group>

      {/* LEFT hemisphere (mirrored) */}
      <group position={[-0.045,0,0]} scale={[-1,1,1]}>
        <mesh geometry={hemiGeo}>
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.25}
            transparent opacity={0.65} roughness={0.3} transmission={0.4} metalness={0.2} clearcoat={1.0} side={THREE.FrontSide}/>
        </mesh>
        <mesh geometry={hemiGeo}>
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.03}/>
        </mesh>
      </group>

      {/* Interhemispheric fissure */}
      <mesh position={[0,0.10,0]}>
        <boxGeometry args={[0.02,1.7,1.55]}/>
        <meshBasicMaterial color="#020617" transparent opacity={0.8}/>
      </mesh>

      {/* Cerebellum */}
      <group position={[0,-0.64,-0.76]} scale={[1.12,0.68,0.76]}>
        <mesh geometry={cerebellumGeo}>
          <meshPhysicalMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.2}
            transparent opacity={0.6} roughness={0.4} transmission={0.3} metalness={0.1} side={THREE.FrontSide}/>
        </mesh>
      </group>

      {/* Brainstem */}
      <mesh position={[0,-0.98,-0.32]} rotation={[0.30,0,0]}>
        <cylinderGeometry args={[0.09,0.13,0.46,14]}/>
        <meshPhysicalMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.15}
          transparent opacity={0.5} roughness={0.5}/>
      </mesh>

      {/* Neural lines */}
      {ELECTRODES.slice(0,14).map((el,i)=>{
        const next=ELECTRODES[(i+4)%ELECTRODES.length];
        const pts=[new THREE.Vector3(...el.pos.map(v=>v*1.09)),new THREE.Vector3(...next.pos.map(v=>v*1.09))];
        const lg=new THREE.BufferGeometry().setFromPoints(pts);
        return <line key={i} geometry={lg}><lineBasicMaterial color="#38bdf8" transparent opacity={0.08}/></line>;
      })}

      {/* Electrode nodes */}
      {ELECTRODES.map(el=>{
        let status = 'Normal';
        if (seizureChannels.has(el.id)) status = 'Seizure';
        else if (elevatedChannels.has(el.id)) status = 'Elevated';
        return <ElectrodeNode key={el.id} electrode={el} status={status} onHover={onNodeHover} onHoverOut={onNodeHoverOut} onClick={onNodeClick}/>
      })}
    </group>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Brain3D({ seizureChannels=[] }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const controlsRef = useRef();
  
  const hotSet = useMemo(() => new Set(seizureChannels||[]), [seizureChannels]);
  const elevatedSet = useMemo(() => {
    const s = new Set();
    if (hotSet.size > 0) {
      const firstHot = Array.from(hotSet)[0];
      s.add((firstHot + 1) % ELECTRODES.length);
      s.add((firstHot + 2) % ELECTRODES.length);
    }
    return s;
  }, [hotSet]);

  const handleHover    = useCallback((el)=>setHovered(el),[]);
  const handleHoverOut = useCallback(()=>setHovered(null),[]);
  const handleClick    = useCallback((el)=>setSelected(s=>s?.id===el.id?null:el),[]);
  const handleClear    = useCallback(()=>setSelected(null),[]);

  // Camera Controls
  const handleReset = () => controlsRef.current?.reset();
  const handleZoomIn = () => {
    if(controlsRef.current) {
      const t=controlsRef.current.target, p=controlsRef.current.object.position;
      const dir=p.clone().sub(t).normalize(), dist=p.distanceTo(t);
      controlsRef.current.object.position.copy(t.clone().add(dir.multiplyScalar(Math.max(1.5, dist-0.5))));
    }
  };
  const handleZoomOut = () => {
    if(controlsRef.current) {
      const t=controlsRef.current.target, p=controlsRef.current.object.position;
      const dir=p.clone().sub(t).normalize(), dist=p.distanceTo(t);
      controlsRef.current.object.position.copy(t.clone().add(dir.multiplyScalar(Math.min(6.0, dist+0.5))));
    }
  };
  const handleViewChange = (view) => {
    if(controlsRef.current) {
      const p = controlsRef.current.object.position;
      if(view==='front') p.set(0, 0.2, 3);
      if(view==='left') p.set(-3, 0.2, 0);
      if(view==='right') p.set(3, 0.2, 0);
      if(view==='top') p.set(0, 3, 0.1);
      controlsRef.current.update();
    }
  };

  return (
    <div style={{
      width:'100%', height:500, borderRadius:24, overflow:'hidden', position:'relative',
      background:'linear-gradient(135deg, #020617 0%, #0b1736 100%)',
      boxShadow:'inset 0 0 100px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.4)',
      border:'1px solid rgba(255,255,255,0.05)',
      fontFamily:'Inter, sans-serif'
    }}>
      {/* Title / Legend Bar */}
      <div style={{position:'absolute', bottom:20, left:20, right:20, zIndex:20, display:'flex', justifyContent:'space-between', alignItems:'flex-end', pointerEvents:'none'}}>
        <div style={{color:'#f8fafc', background:'rgba(15,23,42,0.5)', padding:'8px 16px', borderRadius:16, backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontWeight:700, fontSize:'1rem', letterSpacing:'0.02em'}}>3D Neural Activity</div>
          <div style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:2}}>Spatial Analysis Interface</div>
        </div>
        
        <div style={{display:'flex', gap:16, background:'rgba(15,23,42,0.5)', padding:'8px 16px', borderRadius:16, backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#f8fafc', fontWeight:600}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#06b6d4',boxShadow:'0 0 8px #06b6d4'}}/> Normal
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#f8fafc', fontWeight:600}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',boxShadow:'0 0 8px #f59e0b'}}/> Elevated
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#f8fafc', fontWeight:600}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 8px #ef4444'}}/> Seizure
          </div>
        </div>
      </div>

      <FloatingControls onReset={handleReset} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onViewChange={handleViewChange} />

      <Canvas
        camera={{position:[-1.8, 0.5, 2.2], fov:42}}
        gl={{antialias:true, alpha:true, powerPreference:"high-performance"}}
        onPointerMissed={handleClear}
      >
        <ambientLight intensity={0.6}/>
        <pointLight position={[3,5,3]}    intensity={2.5} color="#e0f2fe"/>
        <pointLight position={[-3,-2,-2]} intensity={1.5} color="#0284c7"/>
        <pointLight position={[0,-5,2]}   intensity={0.8} color="#38bdf8"/>
        <pointLight position={[0,4,-3]}   intensity={1.0} color="#bae6fd"/>

        <BrainScene
          seizureChannels={hotSet}
          elevatedChannels={elevatedSet}
          onNodeHover={handleHover}
          onNodeHoverOut={handleHoverOut}
          onNodeClick={handleClick}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.5}
          maxDistance={6.0}
          enableDamping
          dampingFactor={0.05}
          target={[0, 0.1, 0]}
        />
      </Canvas>

      {/* Floating Tooltip via DOM */}
      <AnimatePresence>
        {hovered && !selected && (
          <div style={{position:'absolute', top:20, right:20, zIndex:30}}>
            <VisionTooltip 
              electrode={hovered} 
              status={hotSet.has(hovered.id) ? 'Seizure' : elevatedSet.has(hovered.id) ? 'Elevated' : 'Normal'} 
            />
          </div>
        )}
      </AnimatePresence>

      {/* Side Panel via DOM */}
      <AnimatePresence>
        {selected && (
          <VisionSidePanel 
            electrode={selected} 
            status={hotSet.has(selected.id) ? 'Seizure' : elevatedSet.has(selected.id) ? 'Elevated' : 'Normal'}
            onClose={handleClear}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
