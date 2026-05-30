// ════════════════════════════════════════════════════════════════════
//  components/ThreeTile.tsx — リッチ3Dレンダリング 完全刷新版
//  各施設を「本物らしい複合メッシュ」で表現。視認性・個性を最大化。
// ════════════════════════════════════════════════════════════════════

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Tile } from "../types";
import { MATERIAL_COLORS, ITEM_3D_COLORS, TILE_SIZE, TILE_HEIGHT, DIRECTION_ARROWS } from "../constants";
import { tileToWorld } from "../utils/gameLogic";

// ─── 共通マテリアル ──────────────────────────────────────────────────
interface MatProps {
  color: string; emissive?: string; emissiveIntensity?: number;
  roughness?: number; metalness?: number; transparent?: boolean; opacity?: number;
  wireframe?: boolean;
}
function Mat(p: MatProps) {
  return (
    <meshStandardMaterial
      color={p.color} emissive={p.emissive ?? "#000000"}
      emissiveIntensity={p.emissiveIntensity ?? 0}
      roughness={p.roughness ?? 0.6} metalness={p.metalness ?? 0.3}
      transparent={p.transparent} opacity={p.opacity} wireframe={p.wireframe}/>
  );
}

// ─── ベルトアイテム（多面体鉱石） ────────────────────────────────────
function BeltItemMesh({ kind, progress, direction }: { kind: string; progress: number; direction: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = ITEM_3D_COLORS[kind] ?? ITEM_3D_COLORS.stone;
  const p = progress - 0.5;
  let lx = 0, lz = 0;
  switch (direction) {
    case "right": lx =  p * TILE_SIZE * 0.82; break;
    case "left":  lx = -p * TILE_SIZE * 0.82; break;
    case "down":  lz =  p * TILE_SIZE * 0.82; break;
    case "up":    lz = -p * TILE_SIZE * 0.82; break;
  }
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * (kind === "gear" ? 3 : 1.5);
  });
  return (
    <group position={[lx, TILE_HEIGHT + 0.25, lz]}>
      {kind === "gear" ? (
        <mesh ref={ref}>
          <torusGeometry args={[0.22, 0.09, 6, 14]}/>
          <Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0.2} metalness={0.95}/>
        </mesh>
      ) : kind === "fuel_rod" ? (
        <mesh ref={ref} rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.07,0.07,0.6,8]}/>
          <Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0.1} metalness={0.6}/>
        </mesh>
      ) : kind === "water" ? (
        <mesh ref={ref}>
          <sphereGeometry args={[0.15,10,10]}/>
          <Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0} metalness={0} transparent opacity={0.75}/>
        </mesh>
      ) : (
        <mesh ref={ref}>
          <icosahedronGeometry args={[0.18,0]}/>
          <Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity}
            roughness={kind==="iron"||kind==="uranium"?0.2:0.5}
            metalness={kind==="iron"?0.8:kind==="uranium"?0.5:0.1}/>
        </mesh>
      )}
      {(kind==="waste"||kind==="radio_waste"||kind==="fuel_rod") && (
        <pointLight color={kind==="fuel_rod"?"#60ff40":"#40ff40"} intensity={0.8} distance={2}/>
      )}
    </group>
  );
}

// ─── 石ドリル（掘削タワー風） ─────────────────────────────────────────
// 縦長の掘削タワー＋回転ビット＋4本支柱
function StoneDrillMesh({ isNight }: { isNight: boolean }) {
  const bitRef  = useRef<THREE.Group>(null!);
  const t       = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * 3;
    if (bitRef.current) {
      bitRef.current.rotation.y += dt * 4;
      bitRef.current.position.y = TILE_HEIGHT + 0.18 + Math.sin(t.current) * 0.08;
    }
  });
  return (
    <group>
      {/* 4本の支柱フレーム */}
      {[[-0.45,-0.45],[0.45,-0.45],[-0.45,0.45],[0.45,0.45]].map(([x,z],i)=>(
        <mesh key={i} castShadow position={[x, TILE_HEIGHT+0.4, z]}>
          <boxGeometry args={[0.08,0.8,0.08]}/>
          <Mat color="#3a5a8a" emissive="#1a2a4a" emissiveIntensity={isNight?0.5:0.1} roughness={0.4} metalness={0.9}/>
        </mesh>
      ))}
      {/* 上部クロスビーム */}
      <mesh position={[0, TILE_HEIGHT+0.75, 0]}>
        <boxGeometry args={[1.0,0.08,0.08]}/>
        <Mat color="#3a5a8a" emissive="#1a2a4a" emissiveIntensity={isNight?0.5:0.1} roughness={0.4} metalness={0.9}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT+0.75, 0]}>
        <boxGeometry args={[0.08,0.08,1.0]}/>
        <Mat color="#3a5a8a" emissive="#1a2a4a" emissiveIntensity={isNight?0.5:0.1} roughness={0.4} metalness={0.9}/>
      </mesh>
      {/* メインシャフト */}
      <mesh castShadow position={[0, TILE_HEIGHT+0.45, 0]}>
        <cylinderGeometry args={[0.1,0.12,0.9,8]}/>
        <Mat color="#5080c0" emissive="#2040a0" emissiveIntensity={isNight?0.4:0.08} roughness={0.3} metalness={0.85}/>
      </mesh>
      {/* 回転ドリルビット */}
      <group ref={bitRef}>
        <mesh>
          <coneGeometry args={[0.14,0.3,8]}/>
          <Mat color="#88aaff" emissive="#4060d0" emissiveIntensity={isNight?0.7:0.2} roughness={0.15} metalness={1.0}/>
        </mesh>
        {/* ビットの羽 */}
        {[0,1,2,3].map(i=>(
          <mesh key={i} rotation={[0, i*Math.PI/2, 0]} position={[0.1,0,0]}>
            <boxGeometry args={[0.12,0.04,0.04]}/>
            <Mat color="#aabbff" roughness={0.2} metalness={1.0}/>
          </mesh>
        ))}
      </group>
      {/* 土台プレート */}
      <mesh receiveShadow position={[0, TILE_HEIGHT+0.04, 0]}>
        <boxGeometry args={[TILE_SIZE*0.85,0.08,TILE_SIZE*0.85]}/>
        <Mat color="#1a2a40" emissive="#0a1020" emissiveIntensity={0.05} roughness={0.7} metalness={0.6}/>
      </mesh>
      {isNight && <pointLight color="#4060ff" intensity={0.8} distance={3}/>}
    </group>
  );
}

// ─── 鉄ドリル（重工業タワー風） ──────────────────────────────────────
function IronDrillMesh({ isNight }: { isNight: boolean }) {
  const pistonRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt*2.5;
    if(pistonRef.current)
      pistonRef.current.position.y = TILE_HEIGHT+0.55+Math.sin(t.current)*0.18;
  });
  return (
    <group>
      {/* 重厚な土台 */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.1,0]}>
        <boxGeometry args={[TILE_SIZE*0.78,0.2,TILE_SIZE*0.78]}/>
        <Mat color="#1a3050" emissive="#0a1828" emissiveIntensity={0.05} roughness={0.5} metalness={0.8}/>
      </mesh>
      {/* メインボディ（太い） */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.44,0]}>
        <cylinderGeometry args={[0.28,0.32,0.68,10]}/>
        <Mat color="#1a3a60" emissive="#0a1a40" emissiveIntensity={isNight?0.4:0.08} roughness={0.4} metalness={0.8}/>
      </mesh>
      {/* アームA */}
      <mesh castShadow position={[-0.35,TILE_HEIGHT+0.55,0]}>
        <boxGeometry args={[0.12,0.9,0.12]}/>
        <Mat color="#2a4a70" roughness={0.4} metalness={0.85}/>
      </mesh>
      <mesh castShadow position={[0.35,TILE_HEIGHT+0.55,0]}>
        <boxGeometry args={[0.12,0.9,0.12]}/>
        <Mat color="#2a4a70" roughness={0.4} metalness={0.85}/>
      </mesh>
      {/* ピストン */}
      <mesh ref={pistonRef} castShadow>
        <cylinderGeometry args={[0.12,0.14,0.45,8]}/>
        <Mat color="#6090e0" emissive="#3060c0" emissiveIntensity={isNight?0.6:0.15} roughness={0.2} metalness={0.95}/>
      </mesh>
      {/* ドリル先端 */}
      <mesh position={[0,TILE_HEIGHT+0.25,0]}>
        <coneGeometry args={[0.1,0.35,6]}/>
        <Mat color="#90b0ff" emissive="#5070d0" emissiveIntensity={isNight?0.7:0.2} roughness={0.15} metalness={1.0}/>
      </mesh>
      {isNight && <pointLight color="#3060ff" intensity={1.0} distance={3.5}/>}
    </group>
  );
}

// ─── ウランドリル（SF採掘機風） ──────────────────────────────────────
function UraniumDrillMesh({ isNight }: { isNight: boolean }) {
  const rotRef = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if(rotRef.current) rotRef.current.rotation.y += dt*2;
  });
  return (
    <group>
      <mesh castShadow position={[0,TILE_HEIGHT+0.12,0]}>
        <boxGeometry args={[TILE_SIZE*0.8,0.24,TILE_SIZE*0.8]}/>
        <Mat color="#0a2a0a" emissive="#003000" emissiveIntensity={0.1} roughness={0.5} metalness={0.7}/>
      </mesh>
      <mesh castShadow position={[0,TILE_HEIGHT+0.55,0]}>
        <cylinderGeometry args={[0.22,0.26,0.7,10]}/>
        <Mat color="#1a4a1a" emissive="#004a00" emissiveIntensity={isNight?0.5:0.15} roughness={0.35} metalness={0.75}/>
      </mesh>
      <group ref={rotRef} position={[0,TILE_HEIGHT+0.82,0]}>
        {[0,1,2].map(i=>(
          <mesh key={i} rotation={[0,i*Math.PI*2/3,0]} position={[0.2,0,0]}>
            <boxGeometry args={[0.28,0.06,0.06]}/>
            <Mat color="#40ff40" emissive="#20cc00" emissiveIntensity={1.0} roughness={0.1} metalness={0.5}/>
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.1,8,8]}/>
          <Mat color="#80ff40" emissive="#40ff00" emissiveIntensity={1.5} roughness={0.1} metalness={0.3}/>
        </mesh>
      </group>
      <pointLight color="#40ff40" intensity={isNight?2:0.6} distance={4}/>
    </group>
  );
}

// ─── コンベアベルト（しっかり視認できる） ────────────────────────────
// 矢印が立体的に浮き出た、動きのわかるベルト
function BeltMesh({ direction, isNight, hasItem }: { direction: string; isNight: boolean; hasItem: boolean }) {
  const arrowRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  // 矢印をアニメーションで前後に動かし「動いている感」を表現
  useFrame((_, dt) => {
    t.current += dt * 1.5;
    if(arrowRef.current) {
      const offset = ((t.current % 1) - 0.5) * TILE_SIZE * 0.5;
      switch(direction) {
        case "right": arrowRef.current.position.x =  offset; break;
        case "left":  arrowRef.current.position.x = -offset; break;
        case "down":  arrowRef.current.position.z =  offset; break;
        case "up":    arrowRef.current.position.z = -offset; break;
      }
    }
  });

  const isVert = direction==="up"||direction==="down";
  const rotY = direction==="right"?0:direction==="left"?Math.PI:direction==="down"?Math.PI/2:-Math.PI/2;
  // 稼働中は明るい緑、停止中はくすんだ緑
  const beltColor   = hasItem ? "#2a6a3a" : "#1a3a22";
  const accentColor = hasItem ? "#50ff70" : "#20a040";
  const emissiveI   = hasItem ? (isNight?0.8:0.3) : (isNight?0.3:0.05);

  return (
    <group>
      {/* ベルト本体（幅広） */}
      <mesh receiveShadow position={[0,TILE_HEIGHT+0.06,0]}>
        <boxGeometry args={[TILE_SIZE*0.9,0.12,TILE_SIZE*0.55]}/>
        <meshStandardMaterial color={beltColor} emissive={accentColor}
          emissiveIntensity={emissiveI*0.4} roughness={0.6} metalness={0.2}/>
      </mesh>
      {/* サイドレール（左右） */}
      {[-0.32,0.32].map((z,i)=>(
        <mesh key={i} position={[0,TILE_HEIGHT+0.1,isVert?z*0.6:z]}>
          <boxGeometry args={isVert?[TILE_SIZE*0.88,0.06,0.06]:[0.06,0.06,TILE_SIZE*0.5]}/>
          <Mat color="#2a4a2a" emissive={accentColor} emissiveIntensity={emissiveI*0.6} roughness={0.4} metalness={0.7}/>
        </mesh>
      ))}
      {/* ローラー（前後） */}
      {[-TILE_SIZE*0.38,TILE_SIZE*0.38].map((pos,i)=>(
        <mesh key={i} position={[isVert?pos:0,TILE_HEIGHT+0.1,isVert?0:pos]}
          rotation={isVert?[0,0,Math.PI/2]:[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.08,0.08,TILE_SIZE*0.55,8]}/>
          <Mat color="#1a2a1a" emissive={accentColor} emissiveIntensity={emissiveI*0.5} roughness={0.3} metalness={0.8}/>
        </mesh>
      ))}
      {/* 動く矢印インジケーター */}
      <mesh ref={arrowRef} position={[0,TILE_HEIGHT+0.16,0]} rotation={[0,rotY,0]}>
        <coneGeometry args={[0.1,0.2,4]} />
        <Mat color={accentColor} emissive={accentColor} emissiveIntensity={isNight?1.2:0.6} roughness={0.2} metalness={0.5}/>
      </mesh>
      {/* 稼働中LEDライト */}
      {isNight && <pointLight color={accentColor} intensity={hasItem?1.0:0.4} distance={2.5}/>}
    </group>
  );
}

// ─── ソーラーパネル（本物らしい傾斜パネル複数枚） ───────────────────
function SolarMesh({ isDay, isNight }: { isDay: boolean; isNight: boolean }) {
  const panelColor = isDay ? "#1a5a30" : "#0a2818";
  const emissiveI  = isDay ? 0.2 : (isNight ? 0.05 : 0.02);
  return (
    <group>
      {/* 支柱 */}
      <mesh position={[0,TILE_HEIGHT+0.18,0.1]}>
        <cylinderGeometry args={[0.04,0.05,0.36,6]}/>
        <Mat color="#333" roughness={0.5} metalness={0.8}/>
      </mesh>
      {/* メインパネル（3枚並び） */}
      {[-0.28,0,0.28].map((x,i)=>(
        <mesh key={i} castShadow position={[x,TILE_HEIGHT+0.32,0]} rotation={[-0.35,0,0]}>
          <boxGeometry args={[0.24,0.02,TILE_SIZE*0.62]}/>
          <meshStandardMaterial color={panelColor}
            emissive={isDay?"#002a10":"#000808"}
            emissiveIntensity={emissiveI} roughness={0.12} metalness={0.1}/>
        </mesh>
      ))}
      {/* パネルの枠 */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.32,0]} rotation={[-0.35,0,0]}>
        <boxGeometry args={[TILE_SIZE*0.84,0.04,TILE_SIZE*0.64]}/>
        <Mat color="#1a2a1a" emissive={isDay?"#001008":"#000"} emissiveIntensity={isDay?0.1:0} roughness={0.4} metalness={0.6}/>
      </mesh>
      {/* 昼間は反射光 */}
      {isDay && <pointLight color="#80ffaa" intensity={0.3} distance={2.5} position={[0,TILE_HEIGHT+0.5,0]}/>}
    </group>
  );
}

// ─── ハブ（4本柱の巨大レシーバー） ──────────────────────────────────
function HubMesh({ upgraded, isNight }: { upgraded: boolean; isNight: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const beamRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if(ringRef.current)  ringRef.current.rotation.y  += dt*0.7;
    if(ring2Ref.current) ring2Ref.current.rotation.y -= dt*0.4;
    if(beamRef.current && upgraded)
      beamRef.current.scale.y = 1+Math.sin(t.current*2)*0.15;
  });
  const accent = upgraded?"#4080ff":"#e050a0";
  return (
    <group>
      {/* 土台プラットフォーム */}
      <mesh castShadow receiveShadow position={[0,TILE_HEIGHT*0.5,0]}>
        <cylinderGeometry args={[0.85,0.95,TILE_HEIGHT,12]}/>
        <Mat color="#2a0818" emissive={accent} emissiveIntensity={isNight?0.35:0.12} roughness={0.3} metalness={0.88}/>
      </mesh>
      {/* 4本柱 */}
      {[[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]].map(([px,pz],i)=>(
        <group key={i}>
          <mesh castShadow position={[px,TILE_HEIGHT+0.65,pz]}>
            <boxGeometry args={[0.12,1.3,0.12]}/>
            <Mat color="#180810" emissive={accent} emissiveIntensity={isNight?0.55:0.18} roughness={0.25} metalness={0.92}/>
          </mesh>
          {/* 柱頂のビーコン */}
          <mesh position={[px,TILE_HEIGHT+1.38,pz]}>
            <sphereGeometry args={[0.09,8,8]}/>
            <Mat color={accent} emissive={accent} emissiveIntensity={2.0} roughness={0.05} metalness={0.4}/>
          </mesh>
          <pointLight position={[px,TILE_HEIGHT+1.38,pz]} color={accent} intensity={isNight?1.2:0.3} distance={2}/>
        </group>
      ))}
      {/* 二重回転リング */}
      <mesh ref={ringRef} position={[0,TILE_HEIGHT+0.7,0]}>
        <torusGeometry args={[0.72,0.065,8,30]}/>
        <Mat color={accent} emissive={accent} emissiveIntensity={1.4}/>
      </mesh>
      <mesh ref={ring2Ref} position={[0,TILE_HEIGHT+0.7,0]} rotation={[Math.PI/4,0,0]}>
        <torusGeometry args={[0.55,0.04,6,24]}/>
        <Mat color={accent} emissive={accent} emissiveIntensity={0.9}/>
      </mesh>
      {/* コア */}
      <mesh position={[0,TILE_HEIGHT+0.7,0]}>
        <octahedronGeometry args={[0.18,0]}/>
        <Mat color={accent} emissive={accent} emissiveIntensity={2.5} roughness={0.1} metalness={0.5}/>
      </mesh>
      {/* 軌道エレベータービーム */}
      {upgraded && (
        <>
          <mesh ref={beamRef} position={[0,TILE_HEIGHT+5,0]}>
            <cylinderGeometry args={[0.045,0.045,10,6]}/>
            <Mat color="#60a0ff" emissive="#60a0ff" emissiveIntensity={1.5} transparent opacity={0.55}/>
          </mesh>
          <pointLight color="#4080ff" intensity={4} distance={10} position={[0,TILE_HEIGHT+2,0]}/>
        </>
      )}
      <pointLight color={accent} intensity={isNight?3:1} distance={6} position={[0,TILE_HEIGHT+0.7,0]}/>
    </group>
  );
}

// ─── 蓄電池（SF電池パック） ──────────────────────────────────────────
function BatteryMesh({ isNight }: { isNight: boolean }) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(()=>{
    if(glowRef.current)
      glowRef.current.emissiveIntensity = 0.6+Math.sin(Date.now()*0.003)*0.3;
  });
  return (
    <group>
      {/* 2本の電池セル */}
      {[-0.27,0.27].map((x,i)=>(
        <group key={i}>
          <mesh castShadow position={[x,TILE_HEIGHT+0.32,0]}>
            <boxGeometry args={[0.42,0.64,0.4]}/>
            <Mat color="#1a0638" emissive="#0a0020" emissiveIntensity={isNight?0.3:0.08} roughness={0.35} metalness={0.7}/>
          </mesh>
          {/* 電池上端の発光キャップ */}
          <mesh position={[x,TILE_HEIGHT+0.66,0]}>
            <cylinderGeometry args={[0.08,0.08,0.08,8]}/>
            <meshStandardMaterial ref={i===0?glowRef:undefined}
              color="#a070ff" emissive="#7040e0" emissiveIntensity={isNight?1.0:0.3}
              roughness={0.1} metalness={0.6}/>
          </mesh>
          {/* 充電レベルインジケーター */}
          {[0,1,2].map(j=>(
            <mesh key={j} position={[x,TILE_HEIGHT+0.18+j*0.18,0.22]}>
              <boxGeometry args={[0.28,0.04,0.02]}/>
              <Mat color="#a070ff" emissive="#6040c0" emissiveIntensity={isNight?(j===2?1.2:0.5):0.15} roughness={0.2} metalness={0.8}/>
            </mesh>
          ))}
        </group>
      ))}
      {/* 接続ケーブル */}
      <mesh position={[0,TILE_HEIGHT+0.35,0]}>
        <boxGeometry args={[0.06,0.1,0.38]}/>
        <Mat color="#8050ff" emissive="#5030c0" emissiveIntensity={isNight?0.8:0.2} roughness={0.2} metalness={0.9}/>
      </mesh>
      {isNight && <pointLight color="#a070ff" intensity={0.8} distance={2.5}/>}
    </group>
  );
}

// ─── 組立機（産業ロボットアーム風） ─────────────────────────────────
function AssemblerMesh({ isNight }: { isNight: boolean }) {
  const arm1Ref = useRef<THREE.Group>(null!);
  const arm2Ref = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt*1.2;
    if(arm1Ref.current) arm1Ref.current.rotation.y =  Math.sin(t.current)*0.8;
    if(arm2Ref.current) arm2Ref.current.rotation.y = -Math.sin(t.current)*0.8+Math.PI;
  });
  return (
    <group>
      {/* ベースプレート */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.08,0]}>
        <boxGeometry args={[TILE_SIZE*0.8,0.16,TILE_SIZE*0.8]}/>
        <Mat color="#2a1008" emissive="#150500" emissiveIntensity={0.05} roughness={0.5} metalness={0.75}/>
      </mesh>
      {/* 中央ハブ */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.32,0]}>
        <cylinderGeometry args={[0.2,0.22,0.32,10]}/>
        <Mat color="#3a1808" emissive="#200800" emissiveIntensity={isNight?0.4:0.1} roughness={0.4} metalness={0.8}/>
      </mesh>
      {/* ロボットアーム1 */}
      <group ref={arm1Ref} position={[0,TILE_HEIGHT+0.48,0]}>
        <mesh position={[0.28,0,0]}>
          <boxGeometry args={[0.44,0.07,0.07]}/>
          <Mat color="#d08040" emissive="#804020" emissiveIntensity={isNight?0.6:0.15} roughness={0.25} metalness={0.85}/>
        </mesh>
        <mesh position={[0.52,0,0]}>
          <sphereGeometry args={[0.07,8,8]}/>
          <Mat color="#ffaa40" emissive="#cc6010" emissiveIntensity={isNight?1.0:0.3} roughness={0.1} metalness={0.7}/>
        </mesh>
      </group>
      {/* ロボットアーム2 */}
      <group ref={arm2Ref} position={[0,TILE_HEIGHT+0.36,0]}>
        <mesh position={[0.22,0,0]}>
          <boxGeometry args={[0.36,0.06,0.06]}/>
          <Mat color="#c07030" emissive="#703010" emissiveIntensity={isNight?0.5:0.12} roughness={0.3} metalness={0.8}/>
        </mesh>
      </group>
      {isNight && <pointLight color="#ff8030" intensity={0.7} distance={2.5}/>}
    </group>
  );
}

// ─── 蒸気機関（ボイラー風） ──────────────────────────────────────────
function SteamMesh({ waterFed, isNight }: { waterFed: boolean; isNight: boolean }) {
  const smokeRef = useRef<THREE.Group>(null!);
  const gaugeRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if(smokeRef.current && waterFed) {
      smokeRef.current.children.forEach((c, i) => {
        c.position.y += dt*0.4;
        const prog = ((t.current*0.5+i*0.3)%1);
        (c as THREE.Mesh).scale.setScalar(0.5+prog*1.2);
        (c as THREE.Mesh).material && ((c as THREE.Mesh).material as THREE.MeshStandardMaterial) &&
          (((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.6-prog*0.7));
        if(c.position.y > TILE_HEIGHT+2.2) c.position.y = TILE_HEIGHT+0.9;
      });
    }
    if(gaugeRef.current) gaugeRef.current.rotation.z = waterFed ? Math.sin(t.current*2)*0.3+0.5 : -0.5;
  });
  return (
    <group>
      {/* ボイラー本体（横長円柱） */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.32,0]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.3,0.3,TILE_SIZE*0.7,12]}/>
        <Mat color="#2a0a28" emissive="#180015" emissiveIntensity={waterFed?(isNight?0.5:0.15):0.04} roughness={0.4} metalness={0.7}/>
      </mesh>
      {/* 煙突2本 */}
      {[-0.2,0.2].map((x,i)=>(
        <mesh key={i} castShadow position={[x,TILE_HEIGHT+0.7,0.1]}>
          <cylinderGeometry args={[0.07,0.09,0.55,8]}/>
          <Mat color="#1a0818" roughness={0.5} metalness={0.6}/>
        </mesh>
      ))}
      {/* 煙エフェクト */}
      {waterFed && (
        <group ref={smokeRef}>
          {[-0.2,0.2].map((x,i)=>(
            <mesh key={i} position={[x,TILE_HEIGHT+1.0,0.1]}>
              <sphereGeometry args={[0.12,6,6]}/>
              <meshStandardMaterial color="#cccccc" transparent opacity={0.4}/>
            </mesh>
          ))}
        </group>
      )}
      {/* 圧力計 */}
      <mesh position={[0,TILE_HEIGHT+0.4,0.3]}>
        <cylinderGeometry args={[0.12,0.12,0.04,12]}/>
        <Mat color="#333" roughness={0.3} metalness={0.9}/>
      </mesh>
      <mesh ref={gaugeRef} position={[0,TILE_HEIGHT+0.4,0.33]}>
        <boxGeometry args={[0.02,0.1,0.01]}/>
        <Mat color={waterFed?"#ff4040":"#404040"} emissive={waterFed?"#ff0000":"#000"} emissiveIntensity={waterFed?0.8:0}/>
      </mesh>
      {waterFed && <pointLight color="#c060e0" intensity={isNight?1.5:0.5} distance={3.5}/>}
    </group>
  );
}

// ─── 原子力発電所（冷却塔＋コア） ────────────────────────────────────
function NuclearMesh({ fuelFed, isNight }: { fuelFed: boolean; isNight: boolean }) {
  const coreRef = useRef<THREE.MeshStandardMaterial>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if(coreRef.current)
      coreRef.current.emissiveIntensity = fuelFed ? 0.8+Math.sin(Date.now()*0.003)*0.4 : 0.1;
    if(ringRef.current) ringRef.current.rotation.y += dt*(fuelFed?1.5:0.2);
  });
  return (
    <group>
      {/* 冷却塔（2本） */}
      {[-0.32,0.32].map((x,i)=>(
        <mesh key={i} castShadow position={[x,TILE_HEIGHT+0.5,0]}>
          <cylinderGeometry args={[0.18,0.28,1.0,10]}/>
          <Mat color="#1a3a1a" emissive="#003800" emissiveIntensity={fuelFed?(isNight?0.4:0.12):0.04} roughness={0.4} metalness={0.5}/>
        </mesh>
      ))}
      {/* 反応炉コア */}
      <mesh position={[0,TILE_HEIGHT+0.3,0]}>
        <sphereGeometry args={[0.22,12,12]}/>
        <meshStandardMaterial ref={coreRef} color="#60ff80" emissive="#20ff40"
          emissiveIntensity={0.5} transparent opacity={0.82}/>
      </mesh>
      {/* 回転リング */}
      <mesh ref={ringRef} position={[0,TILE_HEIGHT+0.3,0]}>
        <torusGeometry args={[0.3,0.03,6,20]}/>
        <Mat color="#40ff40" emissive="#20cc00" emissiveIntensity={fuelFed?1.5:0.3}/>
      </mesh>
      {/* 冷却水パイプ */}
      <mesh position={[0,TILE_HEIGHT+0.25,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.04,0.04,0.7,6]}/>
        <Mat color="#1a5a1a" emissive="#004000" emissiveIntensity={0.2} roughness={0.3} metalness={0.8}/>
      </mesh>
      {fuelFed && <pointLight color="#40ff40" intensity={isNight?3.5:1.2} distance={7}/>}
    </group>
  );
}

// ─── 給水ポンプ ──────────────────────────────────────────────────────
function WaterPumpMesh({ isNight }: { isNight: boolean }) {
  const wheelRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { if(wheelRef.current) wheelRef.current.rotation.z += dt*2; });
  return (
    <group>
      <mesh castShadow position={[0,TILE_HEIGHT+0.18,0]}>
        <boxGeometry args={[TILE_SIZE*0.65,0.36,TILE_SIZE*0.55]}/>
        <Mat color="#082030" emissive="#001828" emissiveIntensity={isNight?0.2:0.05} roughness={0.4} metalness={0.65}/>
      </mesh>
      {/* 回転羽根車 */}
      <mesh ref={wheelRef} position={[0.1,TILE_HEIGHT+0.45,0.28]}>
        <torusGeometry args={[0.16,0.04,4,8]}/>
        <Mat color="#1a5080" emissive="#0060c0" emissiveIntensity={isNight?0.7:0.2} roughness={0.2} metalness={0.8}/>
      </mesh>
      {/* 出力パイプ */}
      <mesh position={[0,TILE_HEIGHT+0.45,-0.28]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.07,0.07,0.35,8]}/>
        <Mat color="#1a4060" emissive="#004080" emissiveIntensity={isNight?0.5:0.1} roughness={0.3} metalness={0.75}/>
      </mesh>
      {isNight && <pointLight color="#40a0ff" intensity={0.6} distance={2.5}/>}
    </group>
  );
}

// ─── 廃棄物処分場 ────────────────────────────────────────────────────
function WasteDisposalMesh({ isNight }: { isNight: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0,TILE_HEIGHT+0.22,0]}>
        <boxGeometry args={[TILE_SIZE*0.8,0.44,TILE_SIZE*0.8]}/>
        <Mat color="#280a0a" emissive="#180000" emissiveIntensity={isNight?0.2:0.05} roughness={0.6} metalness={0.4}/>
      </mesh>
      {/* 警告ストライプ（黄黒） */}
      {[-0.3,0,0.3].map((x,i)=>(
        <mesh key={i} position={[x,TILE_HEIGHT+0.46,0]}>
          <boxGeometry args={[0.14,0.04,TILE_SIZE*0.78]}/>
          <Mat color={i%2===0?"#ffcc00":"#1a1a1a"} emissive={i%2===0?"#ff8800":"#000"}
            emissiveIntensity={isNight?(i%2===0?0.8:0):0.2} roughness={0.3} metalness={0.5}/>
        </mesh>
      ))}
      {/* 放射能マーク風装飾 */}
      <mesh position={[0,TILE_HEIGHT+0.5,0]} rotation={[-Math.PI/2,0,0]}>
        <torusGeometry args={[0.18,0.04,6,12]}/>
        <Mat color="#ff4020" emissive="#ff2000" emissiveIntensity={isNight?1.0:0.3} roughness={0.2} metalness={0.6}/>
      </mesh>
    </group>
  );
}

// ─── ロケットサイロ ──────────────────────────────────────────────────
function RocketSiloMesh({ isNight }: { isNight: boolean }) {
  const rocketRef = useRef<THREE.Group>(null!);
  const exhaustRef= useRef<THREE.PointLight>(null!);
  useFrame((_, dt) => {
    if(rocketRef.current)
      rocketRef.current.position.y = TILE_HEIGHT+0.55+Math.sin(Date.now()*0.002)*0.05;
    if(exhaustRef.current)
      exhaustRef.current.intensity = isNight ? 0.5+Math.sin(Date.now()*0.01)*0.3 : 0.1;
  });
  return (
    <group>
      {/* サイロ外壁 */}
      <mesh castShadow position={[0,TILE_HEIGHT+0.2,0]}>
        <cylinderGeometry args={[0.5,0.55,0.4,12]}/>
        <Mat color="#0a1828" emissive="#001020" emissiveIntensity={isNight?0.25:0.06} roughness={0.35} metalness={0.88}/>
      </mesh>
      {/* ロケット */}
      <group ref={rocketRef}>
        {/* 胴体 */}
        <mesh castShadow>
          <cylinderGeometry args={[0.15,0.2,0.95,10]}/>
          <Mat color="#d0d8e8" emissive="#4060a0" emissiveIntensity={isNight?0.4:0.08} roughness={0.18} metalness={0.96}/>
        </mesh>
        {/* ノーズコーン */}
        <mesh position={[0,0.62,0]}>
          <coneGeometry args={[0.15,0.38,10]}/>
          <Mat color="#e8f0ff" emissive="#5080c0" emissiveIntensity={isNight?0.5:0.1} roughness={0.12} metalness={1.0}/>
        </mesh>
        {/* フィン4枚 */}
        {[0,1,2,3].map(i=>(
          <mesh key={i} rotation={[0,i*Math.PI/2,0]} position={[0.2,-0.45,0]}>
            <boxGeometry args={[0.18,0.28,0.04]}/>
            <Mat color="#c0c8d8" roughness={0.2} metalness={0.95}/>
          </mesh>
        ))}
        {/* エンジン排気グロー */}
        <pointLight ref={exhaustRef} position={[0,-0.6,0]} color="#ff6020" intensity={0.5} distance={2}/>
      </group>
      {isNight && <pointLight color="#6090ff" intensity={0.8} distance={3.5}/>}
    </group>
  );
}

// ─── フィルター分配器 ─────────────────────────────────────────────────
function FilterMesh({ direction, isNight }: { direction: string; isNight: boolean }) {
  const arrowRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt*2;
    if(arrowRef.current)
      arrowRef.current.rotation.y += dt*1.5;
  });
  return (
    <group>
      <mesh receiveShadow position={[0,TILE_HEIGHT+0.07,0]}>
        <boxGeometry args={[TILE_SIZE*0.88,0.14,TILE_SIZE*0.65]}/>
        <Mat color="#240830" emissive="#160020" emissiveIntensity={isNight?0.35:0.08} roughness={0.3} metalness={0.78}/>
      </mesh>
      {/* センサードーム */}
      <mesh position={[0,TILE_HEIGHT+0.2,0]}>
        <sphereGeometry args={[0.16,10,10]}/>
        <Mat color="#8040c0" emissive="#5020a0" emissiveIntensity={isNight?0.9:0.25} roughness={0.1} metalness={0.7} transparent opacity={0.8}/>
      </mesh>
      {/* 回転仕分けアーム */}
      <mesh ref={arrowRef} position={[0,TILE_HEIGHT+0.28,0]}>
        <boxGeometry args={[0.55,0.06,0.06]}/>
        <Mat color="#c080ff" emissive="#8040e0" emissiveIntensity={isNight?1.0:0.3} roughness={0.2} metalness={0.8}/>
      </mesh>
      {isNight && <pointLight color="#a060ff" intensity={0.6} distance={2.5}/>}
    </group>
  );
}

// ─── 水源 ────────────────────────────────────────────────────────────
function WaterSourceMesh({ isNight }: { isNight: boolean }) {
  const surfRef = useRef<THREE.MeshStandardMaterial>(null!);
  const rippleRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if(surfRef.current)
      surfRef.current.emissiveIntensity = 0.35+Math.sin(t.current*3)*0.15;
    if(rippleRef.current) {
      rippleRef.current.scale.x = 1+Math.sin(t.current*2)*0.1;
      rippleRef.current.scale.z = 1+Math.sin(t.current*2+1)*0.1;
    }
  });
  return (
    <group>
      {/* 水面 */}
      <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,TILE_HEIGHT*0.35,0]}>
        <planeGeometry args={[TILE_SIZE*0.9,TILE_SIZE*0.9,4,4]}/>
        <meshStandardMaterial ref={surfRef} color="#1a3060" emissive="#0030a0"
          emissiveIntensity={0.38} roughness={0} metalness={0} transparent opacity={0.85}/>
      </mesh>
      {/* 波紋 */}
      <mesh ref={rippleRef} rotation={[-Math.PI/2,0,0]} position={[0,TILE_HEIGHT*0.36,0]}>
        <ringGeometry args={[0.2,0.6,24]}/>
        <meshStandardMaterial color="#60a0ff" emissive="#2060e0"
          emissiveIntensity={0.5} transparent opacity={0.4}/>
      </mesh>
      <pointLight color="#4080ff" intensity={isNight?1.5:0.45} distance={3.5}/>
    </group>
  );
}

// ─── 鉱床タイル（結晶突き出し） ──────────────────────────────────────
function DepositMesh({ kind, remaining, isNight }: { kind: string; remaining: number; isNight: boolean }) {
  const maxR  = kind==="stone_deposit"?500:kind==="iron_deposit"?300:150;
  const ratio = Math.max(0.05, remaining/maxR);
  const baseColor   = kind==="uranium_deposit"?"#1a3a1a":kind==="iron_deposit"?"#1a2d42":"#2a2f3a";
  const crystalColor= kind==="uranium_deposit"?"#60ff60":kind==="iron_deposit"?"#5090e0":"#9aafbf";
  const emissiveC   = kind==="uranium_deposit"?"#20aa00":kind==="iron_deposit"?"#102060":"#000";
  const emissiveI   = kind==="uranium_deposit"?(isNight?0.6:0.2):(isNight?0.1:0);
  const crystalCount= Math.max(1, Math.floor(ratio*5));

  return (
    <group>
      {/* ベース地面 */}
      <mesh castShadow receiveShadow position={[0,TILE_HEIGHT/2,0]}>
        <boxGeometry args={[TILE_SIZE-0.12,TILE_HEIGHT,TILE_SIZE-0.12]}/>
        <Mat color={baseColor} emissive={emissiveC} emissiveIntensity={emissiveI*0.4} roughness={0.85} metalness={0.1}/>
      </mesh>
      {/* 結晶群（埋蔵量に応じて数・サイズが変化） */}
      {Array.from({length:crystalCount}).map((_,i)=>{
        const angle = (i/crystalCount)*Math.PI*2+i*0.5;
        const r     = 0.15+i*0.12;
        const h     = 0.12+ratio*0.35+i*0.05;
        return (
          <mesh key={i} castShadow
            position={[Math.cos(angle)*r*0.7, TILE_HEIGHT+h*0.5, Math.sin(angle)*r*0.7]}
            rotation={[Math.sin(i)*0.2,angle,Math.cos(i)*0.15]}>
            <coneGeometry args={[0.06+ratio*0.04,h,6]}/>
            <Mat color={crystalColor} emissive={emissiveC} emissiveIntensity={emissiveI}
              roughness={kind==="iron_deposit"?0.2:0.45} metalness={kind==="iron_deposit"?0.7:0.1}/>
          </mesh>
        );
      })}
      {/* 埋蔵量リング */}
      {remaining>0 && (
        <mesh position={[0,TILE_HEIGHT+0.015,0]} rotation={[-Math.PI/2,0,0]}>
          <ringGeometry args={[0.3,0.3+0.38*ratio,32]}/>
          <meshStandardMaterial color={crystalColor} emissive={emissiveC}
            emissiveIntensity={emissiveI*0.8} transparent opacity={0.55}/>
        </mesh>
      )}
      {kind==="uranium_deposit" && (
        <pointLight color="#40ff40" intensity={isNight?0.8:0.2} distance={3}/>
      )}
    </group>
  );
}

// ─── 選択ハイライト ──────────────────────────────────────────────────
function SelectRing() {
  const ref = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(()=>{
    if(ref.current) ref.current.emissiveIntensity = 0.7+Math.sin(Date.now()*0.008)*0.4;
  });
  return (
    <mesh position={[0,TILE_HEIGHT+0.025,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[(TILE_SIZE/2)*0.88,(TILE_SIZE/2)*0.97,36]}/>
      <meshStandardMaterial ref={ref} color="#fff" emissive="#fff" emissiveIntensity={0.8} transparent opacity={0.9}/>
    </mesh>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────
interface Props {
  tile: Tile; row: number; col: number; gridSize: number;
  dayPhase: string; isSelected: boolean;
  onClick: (row: number, col: number) => void;
}

export function ThreeTile({ tile, row, col, gridSize, dayPhase, isSelected, onClick }: Props) {
  const [wx,,wz]  = tileToWorld(row, col, gridSize);
  const { kind, direction, beltItem, depositRemaining } = tile;
  const mat       = MATERIAL_COLORS[kind];
  const isNight   = dayPhase==="night";
  const isDay     = dayPhase==="day";
  const isHubLike = kind==="hub"||kind==="space_elevator";
  const isDeposit = kind==="stone_deposit"||kind==="iron_deposit"||kind==="uranium_deposit";

  return (
    <group position={[wx,0,wz]} onClick={e=>{e.stopPropagation();onClick(row,col);}}>
      {/* 地面タイル（施設の下敷き） */}
      {!isHubLike && !isDeposit && kind!=="water_source" && (
        <mesh castShadow receiveShadow position={[0,TILE_HEIGHT/2,0]}>
          <boxGeometry args={[TILE_SIZE-0.1,TILE_HEIGHT,TILE_SIZE-0.1]}/>
          <Mat color={mat.color} emissive={mat.emissive}
            emissiveIntensity={isNight?mat.emissiveIntensity*3.5:mat.emissiveIntensity}
            roughness={mat.roughness} metalness={mat.metalness}/>
        </mesh>
      )}

      {/* 施設メッシュ */}
      {isHubLike            && <HubMesh upgraded={kind==="space_elevator"} isNight={isNight}/>}
      {isDeposit            && <DepositMesh kind={kind} remaining={depositRemaining} isNight={isNight}/>}
      {kind==="water_source" && <WaterSourceMesh isNight={isNight}/>}
      {kind==="stone_drill"  && <StoneDrillMesh isNight={isNight}/>}
      {kind==="iron_drill"   && <IronDrillMesh isNight={isNight}/>}
      {kind==="uranium_drill"&& <UraniumDrillMesh isNight={isNight}/>}
      {kind==="belt"         && <BeltMesh direction={direction} isNight={isNight} hasItem={!!beltItem}/>}
      {kind==="filter"       && <FilterMesh direction={direction} isNight={isNight}/>}
      {kind==="solar"        && <SolarMesh isDay={isDay} isNight={isNight}/>}
      {kind==="battery"      && <BatteryMesh isNight={isNight}/>}
      {kind==="assembler"    && <AssemblerMesh isNight={isNight}/>}
      {kind==="water_pump"   && <WaterPumpMesh isNight={isNight}/>}
      {kind==="steam_engine" && <SteamMesh waterFed={tile.waterFed} isNight={isNight}/>}
      {kind==="nuclear_plant"&& <NuclearMesh fuelFed={tile.fuelFed} isNight={isNight}/>}
      {kind==="waste_disposal"&&<WasteDisposalMesh isNight={isNight}/>}
      {kind==="rocket_silo"  && <RocketSiloMesh isNight={isNight}/>}

      {/* ベルト上のアイテム */}
      {(kind==="belt"||kind==="filter") && beltItem && (
        <BeltItemMesh kind={beltItem.kind} progress={beltItem.progress} direction={direction}/>
      )}

      {/* 向き矢印（ベルト以外の可動施設） */}
      {(kind==="stone_drill"||kind==="iron_drill"||kind==="uranium_drill"||
        kind==="assembler"||kind==="water_pump") && (
        <Text position={[0,TILE_HEIGHT+0.45,0]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.32} color={isNight?"#88ffaa":"#44cc66"} anchorX="center" anchorY="middle">
          {DIRECTION_ARROWS[direction]}
        </Text>
      )}

      {isSelected && <SelectRing/>}
    </group>
  );
}