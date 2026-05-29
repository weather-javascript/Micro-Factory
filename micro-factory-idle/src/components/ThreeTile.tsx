// ════════════════════════════════════════════════════════════════════
//  components/ThreeTile.tsx — 各マスのリッチな3Dレンダリング
// ════════════════════════════════════════════════════════════════════

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Tile } from "../types";
import { MATERIAL_COLORS, ITEM_3D_COLORS, TILE_SIZE, TILE_HEIGHT, DIRECTION_ARROWS } from "../constants";
import { tileToWorld } from "../utils/gameLogic";

interface MatProps {
  color: string; emissive?: string; emissiveIntensity?: number;
  roughness?: number; metalness?: number; transparent?: boolean; opacity?: number;
}
function Mat(p: MatProps) {
  return (
    <meshStandardMaterial color={p.color} emissive={p.emissive ?? "#000000"}
      emissiveIntensity={p.emissiveIntensity ?? 0} roughness={p.roughness ?? 0.6}
      metalness={p.metalness ?? 0.3} transparent={p.transparent} opacity={p.opacity}/>
  );
}

function BeltItemMesh({ kind, progress, direction }: { kind: string; progress: number; direction: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = ITEM_3D_COLORS[kind] ?? ITEM_3D_COLORS.stone;
  const p   = progress - 0.5;
  let lx = 0, lz = 0;
  switch (direction) {
    case "right": lx =  p * TILE_SIZE * 0.82; break;
    case "left":  lx = -p * TILE_SIZE * 0.82; break;
    case "down":  lz =  p * TILE_SIZE * 0.82; break;
    case "up":    lz = -p * TILE_SIZE * 0.82; break;
  }
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * (kind === "gear" ? 2.5 : 1.2); });
  const posY = TILE_HEIGHT + 0.22;
  return (
    <group position={[lx, posY, lz]}>
      {kind === "gear" ? (
        <mesh ref={ref}><torusGeometry args={[0.22, 0.08, 6, 14]}/><Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0.25} metalness={0.9}/></mesh>
      ) : kind === "fuel_rod" ? (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.55, 8]}/><Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0.15} metalness={0.5}/></mesh>
      ) : kind === "water" ? (
        <mesh ref={ref}><sphereGeometry args={[0.16, 10, 10]}/><Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={0.0} metalness={0.0} transparent opacity={0.72}/></mesh>
      ) : (
        <mesh ref={ref}><icosahedronGeometry args={[0.17, 0]}/><Mat color={mat.color} emissive={mat.emissive} emissiveIntensity={mat.emissiveIntensity} roughness={kind === "iron" || kind === "uranium" ? 0.25 : 0.55} metalness={kind === "iron" ? 0.75 : kind === "uranium" ? 0.5 : 0.1}/></mesh>
      )}
      {(kind === "waste" || kind === "radio_waste" || kind === "fuel_rod") && (
        <pointLight color={kind === "fuel_rod" ? "#60ff40" : "#40ff40"} intensity={0.6} distance={1.8}/>
      )}
    </group>
  );
}

function DrillMesh({ kind, isNight }: { kind: string; isNight: boolean }) {
  const pistonRef = useRef<THREE.Group>(null!);
  const t = useRef(0);
  const speed = kind === "uranium_drill" ? 1.6 : kind === "iron_drill" ? 2.2 : 3.0;
  useFrame((_, dt) => {
    t.current += dt * speed;
    if (pistonRef.current) pistonRef.current.position.y = TILE_HEIGHT + 0.32 + Math.sin(t.current) * 0.12;
  });
  const baseColor   = kind === "uranium_drill" ? "#1a4a1a" : kind === "iron_drill" ? "#1a3a5a" : "#2a4a80";
  const accentColor = kind === "uranium_drill" ? "#40ff40" : kind === "iron_drill" ? "#4090cc" : "#6090e0";
  const emissiveI   = isNight ? 0.6 : 0.1;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, TILE_HEIGHT + 0.12, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.72, 0.24, TILE_SIZE * 0.72]}/>
        <Mat color={baseColor} emissive={accentColor} emissiveIntensity={emissiveI * 0.4} roughness={0.45} metalness={0.7}/>
      </mesh>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.38, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.42, 10]}/>
        <Mat color={baseColor} emissive={accentColor} emissiveIntensity={emissiveI * 0.3} roughness={0.4} metalness={0.75}/>
      </mesh>
      <group ref={pistonRef}>
        <mesh castShadow><cylinderGeometry args={[0.1, 0.12, 0.38, 8]}/><Mat color="#888" emissive={accentColor} emissiveIntensity={emissiveI * 0.5} roughness={0.25} metalness={0.95}/></mesh>
        <mesh position={[0, -0.32, 0]}><coneGeometry args={[0.09, 0.28, 6]}/><Mat color="#aaa" roughness={0.2} metalness={1.0}/></mesh>
      </group>
      {isNight && <pointLight color={accentColor} intensity={0.7} distance={2.2}/>}
    </group>
  );
}

function BeltMesh({ direction, isNight }: { direction: string; isNight: boolean }) {
  const offset = useRef(0);
  useFrame((_, dt) => { offset.current += dt * 0.7; });
  const isVert    = direction === "up" || direction === "down";
  const emissiveI = isNight ? 0.3 : 0.05;
  return (
    <group>
      <mesh receiveShadow position={[0, TILE_HEIGHT + 0.05, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.88, 0.1, TILE_SIZE * 0.52]}/>
        <meshStandardMaterial color="#1a3a22" emissive="#002008" emissiveIntensity={emissiveI} roughness={0.65} metalness={0.25}/>
      </mesh>
      {[-TILE_SIZE * 0.38, TILE_SIZE * 0.38].map((x, i) => (
        <mesh key={i} castShadow
          position={[isVert ? 0 : x, TILE_HEIGHT + 0.05, isVert ? x : 0]}
          rotation={isVert ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, TILE_SIZE * 0.5, 8]}/>
          <Mat color="#333" roughness={0.4} metalness={0.8} emissive={isNight ? "#204030" : undefined} emissiveIntensity={isNight ? 0.3 : 0}/>
        </mesh>
      ))}
    </group>
  );
}

function HubMesh({ upgraded, isNight }: { upgraded: boolean; isNight: boolean }) {
  const ringRef  = useRef<THREE.Mesh>(null!);
  const beamRef  = useRef<THREE.Mesh>(null!);
  const t        = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (ringRef.current) ringRef.current.rotation.y += dt * 0.6;
    if (beamRef.current && upgraded) beamRef.current.scale.y = 1 + Math.sin(t.current * 2.5) * 0.12;
  });
  const accentColor = upgraded ? "#4080ff" : "#e050a0";
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, TILE_HEIGHT * 0.5, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.88, TILE_HEIGHT, TILE_SIZE * 0.88]}/>
        <Mat color="#2a0818" emissive={accentColor} emissiveIntensity={isNight ? 0.4 : 0.15} roughness={0.3} metalness={0.85}/>
      </mesh>
      {[[-0.65, -0.65],[0.65, -0.65],[-0.65, 0.65],[0.65, 0.65]].map(([px, pz], i) => (
        <group key={i}>
          <mesh castShadow position={[px, TILE_HEIGHT + 0.55, pz]}>
            <boxGeometry args={[0.14, 1.1, 0.14]}/>
            <Mat color="#1a0810" emissive={accentColor} emissiveIntensity={isNight ? 0.5 : 0.2} roughness={0.3} metalness={0.9}/>
          </mesh>
          <mesh position={[px, TILE_HEIGHT + 1.15, pz]}>
            <sphereGeometry args={[0.1, 8, 8]}/>
            <Mat color={accentColor} emissive={accentColor} emissiveIntensity={1.5} roughness={0.1} metalness={0.5}/>
          </mesh>
        </group>
      ))}
      <mesh ref={ringRef} position={[0, TILE_HEIGHT + 0.55, 0]}>
        <torusGeometry args={[0.75, 0.06, 8, 28]}/>
        <Mat color={accentColor} emissive={accentColor} emissiveIntensity={1.2}/>
      </mesh>
      {upgraded && (
        <>
          <mesh ref={beamRef} position={[0, TILE_HEIGHT + 5, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 10, 6]}/>
            <Mat color="#60a0ff" emissive="#60a0ff" emissiveIntensity={1.5} transparent opacity={0.6}/>
          </mesh>
          <pointLight color="#4080ff" intensity={3} distance={8} position={[0, TILE_HEIGHT + 2, 0]}/>
        </>
      )}
      <pointLight color={accentColor} intensity={isNight ? 2.5 : 0.8} distance={5} position={[0, TILE_HEIGHT + 0.6, 0]}/>
    </group>
  );
}

function SolarMesh({ isDay }: { isDay: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.18, 0]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.82, 0.055, TILE_SIZE * 0.72]}/>
        <Mat color="#0a2210" emissive={isDay ? "#002a10" : "#001008"} emissiveIntensity={isDay ? 0.15 : 0.05} roughness={0.18} metalness={0.25}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT + 0.05, 0.1]}>
        <cylinderGeometry args={[0.04, 0.05, 0.22, 6]}/>
        <Mat color="#333" roughness={0.5} metalness={0.7}/>
      </mesh>
      {isDay && <pointLight color="#80ff60" intensity={0.2} distance={2}/>}
    </group>
  );
}

function SteamMesh({ waterFed, isNight }: { waterFed: boolean; isNight: boolean }) {
  const smokeRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (smokeRef.current && waterFed) {
      smokeRef.current.position.y += dt * 0.3;
      if (smokeRef.current.position.y > TILE_HEIGHT + 1.8) smokeRef.current.position.y = TILE_HEIGHT + 0.8;
      (smokeRef.current.material as THREE.MeshStandardMaterial).opacity =
        Math.max(0, 1 - (smokeRef.current.position.y - TILE_HEIGHT - 0.8) / 1.0);
    }
  });
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.28, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.62, 0.56, TILE_SIZE * 0.62]}/>
        <Mat color="#2a0a30" emissive="#1a0020" emissiveIntensity={waterFed ? (isNight ? 0.5 : 0.2) : 0.05} roughness={0.4} metalness={0.65}/>
      </mesh>
      <mesh position={[0.25, TILE_HEIGHT + 0.72, 0.25]}>
        <cylinderGeometry args={[0.07, 0.09, 0.45, 8]}/>
        <Mat color="#1a0820" roughness={0.5} metalness={0.6}/>
      </mesh>
      {waterFed && (
        <mesh ref={smokeRef} position={[0.25, TILE_HEIGHT + 0.95, 0.25]}>
          <sphereGeometry args={[0.12, 6, 6]}/>
          <meshStandardMaterial color="#aaaaaa" transparent opacity={0.5}/>
        </mesh>
      )}
      {waterFed && <pointLight color="#c060e0" intensity={isNight ? 1.2 : 0.4} distance={3}/>}
    </group>
  );
}

function NuclearMesh({ fuelFed, isNight }: { fuelFed: boolean; isNight: boolean }) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(() => {
    if (glowRef.current)
      glowRef.current.emissiveIntensity = fuelFed ? 0.5 + Math.sin(Date.now() * 0.003) * 0.3 : 0.1;
  });
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.45, 0]}>
        <cylinderGeometry args={[0.25, 0.38, 0.9, 10]}/>
        <Mat color="#1a3a1a" emissive="#004000"
          emissiveIntensity={fuelFed ? (isNight ? 0.6 : 0.2) : 0.05} roughness={0.4} metalness={0.6}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT + 0.45, 0]}>
        <sphereGeometry args={[0.18, 10, 10]}/>
        <meshStandardMaterial ref={glowRef} color="#40ff80" emissive="#20ff40"
          emissiveIntensity={0.5} transparent opacity={0.7}/>
      </mesh>
      {fuelFed && <pointLight color="#40ff40" intensity={isNight ? 3 : 1} distance={6}/>}
    </group>
  );
}

function AssemblerMesh({ isNight }: { isNight: boolean }) {
  const armRef = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { if (armRef.current) armRef.current.rotation.y += dt * 1.5; });
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.22, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.72, 0.44, TILE_SIZE * 0.72]}/>
        <Mat color="#3a1808" emissive="#200800" emissiveIntensity={isNight ? 0.3 : 0.08} roughness={0.5} metalness={0.7}/>
      </mesh>
      <mesh ref={armRef} position={[0, TILE_HEIGHT + 0.5, 0]}>
        <torusGeometry args={[0.28, 0.04, 6, 16]}/>
        <Mat color="#d09050" emissive="#804020" emissiveIntensity={isNight ? 0.6 : 0.15} roughness={0.3} metalness={0.8}/>
      </mesh>
      {isNight && <pointLight color="#ff8030" intensity={0.5} distance={2}/>}
    </group>
  );
}

function BatteryMesh({ isNight }: { isNight: boolean }) {
  return (
    <group>
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={i} castShadow position={[x, TILE_HEIGHT + 0.32, 0]}>
          <boxGeometry args={[0.44, 0.64, 0.38]}/>
          <Mat color="#240840" emissive="#100028" emissiveIntensity={isNight ? 0.4 : 0.1} roughness={0.4} metalness={0.65}/>
        </mesh>
      ))}
      <mesh position={[0, TILE_HEIGHT + 0.32, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.42]}/>
        <Mat color="#a070ff" emissive="#6040c0" emissiveIntensity={isNight ? 0.8 : 0.2} roughness={0.2} metalness={0.9}/>
      </mesh>
      {isNight && <pointLight color="#a070ff" intensity={0.5} distance={2.2}/>}
    </group>
  );
}

function WaterPumpMesh({ isNight }: { isNight: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.2, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.65, 0.4, TILE_SIZE * 0.55]}/>
        <Mat color="#0a2030" emissive="#002040" emissiveIntensity={isNight ? 0.3 : 0.08} roughness={0.4} metalness={0.6}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT + 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.3, 8]}/>
        <Mat color="#1a4060" emissive="#0060a0" emissiveIntensity={isNight ? 0.5 : 0.12} roughness={0.3} metalness={0.7}/>
      </mesh>
      {isNight && <pointLight color="#60c0ff" intensity={0.5} distance={2}/>}
    </group>
  );
}

function WasteDisposalMesh({ isNight }: { isNight: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.22, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.78, 0.44, TILE_SIZE * 0.78]}/>
        <Mat color="#2a0a0a" emissive="#180000" emissiveIntensity={isNight ? 0.2 : 0.05} roughness={0.65} metalness={0.4}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT + 0.46, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.76, 0.04, TILE_SIZE * 0.76]}/>
        <Mat color="#ff4020" emissive="#ff2000" emissiveIntensity={isNight ? 0.8 : 0.2} roughness={0.3} metalness={0.5}/>
      </mesh>
    </group>
  );
}

function RocketSiloMesh({ isNight }: { isNight: boolean }) {
  const rocketRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (rocketRef.current) rocketRef.current.position.y = TILE_HEIGHT + 0.6 + Math.sin(Date.now() * 0.002) * 0.04;
  });
  return (
    <group>
      <mesh castShadow position={[0, TILE_HEIGHT + 0.15, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.3, 12]}/>
        <Mat color="#0a1a2a" emissive="#001020" emissiveIntensity={isNight ? 0.3 : 0.08} roughness={0.35} metalness={0.85}/>
      </mesh>
      <group ref={rocketRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.22, 0.9, 8]}/>
          <Mat color="#c0c8d8" emissive="#4060a0" emissiveIntensity={isNight ? 0.4 : 0.1} roughness={0.2} metalness={0.95}/>
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <coneGeometry args={[0.16, 0.35, 8]}/>
          <Mat color="#e0e8f8" emissive="#6080c0" emissiveIntensity={isNight ? 0.5 : 0.1} roughness={0.15} metalness={1.0}/>
        </mesh>
      </group>
      {isNight && <pointLight color="#60d0ff" intensity={0.8} distance={3}/>}
    </group>
  );
}

function FilterMesh({ isNight }: { isNight: boolean }) {
  return (
    <group>
      <mesh receiveShadow position={[0, TILE_HEIGHT + 0.06, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.88, 0.12, TILE_SIZE * 0.62]}/>
        <Mat color="#280a38" emissive="#180028" emissiveIntensity={isNight ? 0.4 : 0.1} roughness={0.3} metalness={0.75}/>
      </mesh>
      <mesh position={[0, TILE_HEIGHT + 0.16, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.06]}/>
        <Mat color="#a060e0" emissive="#7030b0" emissiveIntensity={isNight ? 0.8 : 0.25} roughness={0.2} metalness={0.8}/>
      </mesh>
      {isNight && <pointLight color="#a060e0" intensity={0.5} distance={2}/>}
    </group>
  );
}

function WaterSourceMesh({ isNight }: { isNight: boolean }) {
  const surfRef = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(() => {
    if (surfRef.current)
      surfRef.current.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.004) * 0.15;
  });
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, TILE_HEIGHT * 0.3, 0]}>
        <planeGeometry args={[TILE_SIZE * 0.9, TILE_SIZE * 0.9]}/>
        <meshStandardMaterial ref={surfRef} color="#1a3060" emissive="#0030a0"
          emissiveIntensity={0.35} roughness={0.0} metalness={0.0} transparent opacity={0.82}/>
      </mesh>
      <pointLight color="#4080ff" intensity={isNight ? 1.2 : 0.4} distance={3}/>
    </group>
  );
}

function DepositMesh({ kind, remaining, isNight }: { kind: string; remaining: number; isNight: boolean }) {
  const maxR    = kind === "stone_deposit" ? 500 : kind === "iron_deposit" ? 300 : 150;
  const ratio   = remaining / maxR;
  const color   = kind === "uranium_deposit" ? "#1a3a1a" : kind === "iron_deposit" ? "#1a2d42" : "#2a2f3a";
  const emissive= kind === "uranium_deposit" ? "#003300" : kind === "iron_deposit" ? "#001020" : "#000000";
  const emissiveI = kind === "uranium_deposit" ? (isNight ? 0.4 : 0.12) : (isNight ? 0.1 : 0);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, TILE_HEIGHT / 2, 0]}>
        <boxGeometry args={[TILE_SIZE - 0.12, TILE_HEIGHT, TILE_SIZE - 0.12]}/>
        <Mat color={color} emissive={emissive} emissiveIntensity={emissiveI} roughness={0.85} metalness={0.1}/>
      </mesh>
      {remaining > 0 && (
        <mesh position={[0, TILE_HEIGHT + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.28 + 0.42 * ratio, 32]}/>
          <meshStandardMaterial
            color={kind === "uranium_deposit" ? "#40ff40" : kind === "iron_deposit" ? "#4090cc" : "#8899aa"}
            emissive={kind === "uranium_deposit" ? "#20aa20" : "#000000"}
            emissiveIntensity={kind === "uranium_deposit" ? 0.4 : 0} transparent opacity={0.65}/>
        </mesh>
      )}
      {kind === "uranium_deposit" && <pointLight color="#40ff40" intensity={isNight ? 0.6 : 0.15} distance={2.5}/>}
    </group>
  );
}

function SelectRing() {
  const ref = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(() => {
    if (ref.current)
      ref.current.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.008) * 0.4;
  });
  return (
    <mesh position={[0, TILE_HEIGHT + 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[(TILE_SIZE / 2) * 0.88, (TILE_SIZE / 2) * 0.96, 36]}/>
      <meshStandardMaterial ref={ref} color="#ffffff" emissive="#ffffff"
        emissiveIntensity={0.8} transparent opacity={0.85}/>
    </mesh>
  );
}

interface Props {
  tile: Tile; row: number; col: number; gridSize: number;
  dayPhase: string; isSelected: boolean;
  onClick: (row: number, col: number) => void;
}

export function ThreeTile({ tile, row, col, gridSize, dayPhase, isSelected, onClick }: Props) {
  const [wx, , wz] = tileToWorld(row, col, gridSize);
  const { kind, direction, beltItem, depositRemaining } = tile;
  const mat       = MATERIAL_COLORS[kind];
  const isNight   = dayPhase === "night";
  const isDay     = dayPhase === "day";
  const isHubLike = kind === "hub" || kind === "space_elevator";
  const isDeposit = kind === "stone_deposit" || kind === "iron_deposit" || kind === "uranium_deposit";

  return (
    <group position={[wx, 0, wz]} onClick={(e) => { e.stopPropagation(); onClick(row, col); }}>
      {!isHubLike && !isDeposit && kind !== "water_source" && (
        <mesh castShadow receiveShadow position={[0, TILE_HEIGHT / 2, 0]}>
          <boxGeometry args={[TILE_SIZE - 0.1, TILE_HEIGHT, TILE_SIZE - 0.1]}/>
          <Mat color={mat.color} emissive={mat.emissive}
            emissiveIntensity={isNight ? mat.emissiveIntensity * 3.0 : mat.emissiveIntensity}
            roughness={mat.roughness} metalness={mat.metalness}/>
        </mesh>
      )}

      {isHubLike         && <HubMesh upgraded={kind === "space_elevator"} isNight={isNight}/>}
      {isDeposit         && <DepositMesh kind={kind} remaining={depositRemaining} isNight={isNight}/>}
      {kind==="water_source"   && <WaterSourceMesh isNight={isNight}/>}
      {(kind==="stone_drill"||kind==="iron_drill"||kind==="uranium_drill") && <DrillMesh kind={kind} isNight={isNight}/>}
      {kind==="belt"           && <BeltMesh direction={direction} isNight={isNight}/>}
      {kind==="filter"         && <FilterMesh isNight={isNight}/>}
      {kind==="solar"          && <SolarMesh isDay={isDay}/>}
      {kind==="battery"        && <BatteryMesh isNight={isNight}/>}
      {kind==="assembler"      && <AssemblerMesh isNight={isNight}/>}
      {kind==="water_pump"     && <WaterPumpMesh isNight={isNight}/>}
      {kind==="steam_engine"   && <SteamMesh waterFed={tile.waterFed} isNight={isNight}/>}
      {kind==="nuclear_plant"  && <NuclearMesh fuelFed={tile.fuelFed} isNight={isNight}/>}
      {kind==="waste_disposal" && <WasteDisposalMesh isNight={isNight}/>}
      {kind==="rocket_silo"    && <RocketSiloMesh isNight={isNight}/>}

      {(kind==="belt"||kind==="filter") && beltItem && (
        <BeltItemMesh kind={beltItem.kind} progress={beltItem.progress} direction={direction}/>
      )}

      {(kind==="belt"||kind==="stone_drill"||kind==="iron_drill"||
        kind==="uranium_drill"||kind==="assembler"||kind==="water_pump") && (
        <Text position={[0, TILE_HEIGHT + 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3} color={isNight ? "#88ffaa" : "#44aa66"} anchorX="center" anchorY="middle">
          {DIRECTION_ARROWS[direction]}
        </Text>
      )}

      {isSelected && <SelectRing/>}
    </group>
  );
}