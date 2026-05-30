// ════════════════════════════════════════════════════════════════════
//  components/GameCanvas.tsx — 左側70%の3Dキャンバス
// ════════════════════════════════════════════════════════════════════

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Stars, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { GameState, ShopItem } from "../types";
import { ThreeTile } from "./ThreeTile";
import { TILE_SIZE } from "../constants";
import { tileToWorld } from "../utils/gameLogic";

function SceneLighting({ phase }: { phase: string }) {
  const sunRef  = useRef<THREE.DirectionalLight>(null!);
  const fillRef = useRef<THREE.DirectionalLight>(null!);

  useFrame(() => {
    if (phase === "day") {
      if (sunRef.current) { sunRef.current.position.set(15, 20, 10); sunRef.current.color.setHex(0xfff8f0); sunRef.current.intensity = 3.5; }
      if (fillRef.current) { fillRef.current.color.setHex(0xc8e0ff); fillRef.current.intensity = 1.2; }
    } else if (phase === "dusk") {
      if (sunRef.current) { sunRef.current.position.set(20, 5, -8); sunRef.current.color.setHex(0xff6020); sunRef.current.intensity = 2.5; }
      if (fillRef.current) { fillRef.current.color.setHex(0x4040a0); fillRef.current.intensity = 0.6; }
    } else if (phase === "night") {
      // 夜間: 強度を大幅アップして視認性確保
      if (sunRef.current) { sunRef.current.position.set(-10, 15, -10); sunRef.current.color.setHex(0x4060c0); sunRef.current.intensity = 1.5; }
      if (fillRef.current) { fillRef.current.color.setHex(0x2050a0); fillRef.current.intensity = 1.0; }
    } else {
      if (sunRef.current) { sunRef.current.position.set(-15, 8, 10); sunRef.current.color.setHex(0xff8060); sunRef.current.intensity = 1.5; }
      if (fillRef.current) { fillRef.current.color.setHex(0x6060a0); fillRef.current.intensity = 0.7; }
    }
  });

  const ambientIntensity =
    phase === "day"   ? 0.9 :
    phase === "dusk"  ? 0.7 :
    phase === "night" ? 1.2 :  // 0.65 → 1.2
    0.7;

  const ambientColor =
    phase === "night" ? "#2a3a6a" :  // 明るめの青
    phase === "dusk"  ? "#2a1810" : "#202030";

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity}/>
      <directionalLight ref={sunRef} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={80}
        shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25} shadow-bias={-0.0005}/>
      <directionalLight ref={fillRef} position={[-8, 10, -8]} castShadow={false}/>
      <pointLight position={[0, -1, 0]} color="#304060" intensity={0.4} distance={30}/>
    </>
  );
}

function GroundPlane({ gridSize, isNight }: { gridSize: number; isNight: boolean }) {
  const size = gridSize * TILE_SIZE + 6;
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size * 2, size * 2]}/>
        <meshStandardMaterial color={isNight ? "#0a0e18" : "#0e1020"} roughness={0.95} metalness={0.05}/>
      </mesh>
      <Grid args={[size, size]} position={[0, 0.01, 0]}
        cellSize={TILE_SIZE} cellThickness={0.4}
        cellColor={isNight ? "#1a3a6a" : "#1a2030"}
        sectionSize={TILE_SIZE * gridSize} sectionThickness={1.2}
        sectionColor={isNight ? "#2a5aaa" : "#2a3050"}
        fadeDistance={80} fadeStrength={1.2} infiniteGrid={false}/>
    </>
  );
}

function LaunchParticles({ active }: { active: boolean }) {
  const count   = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const time    = useRef(0);
  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 5, y: Math.random() * 3, z: (Math.random() - 0.5) * 5,
      speed: 3 + Math.random() * 8, spread: (Math.random() - 0.5) * 0.6,
    })), []);

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return;
    time.current += delta;
    const dummy = new THREE.Object3D();
    particles.forEach((p, i) => {
      const t = (time.current * p.speed + i * 0.12) % 25;
      dummy.position.set(p.x + p.spread * t, p.y + t * 2.5, p.z + p.spread * t);
      dummy.scale.setScalar(Math.max(0, 1 - t / 25) * 0.2);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[1, 6, 6]}/>
      <meshStandardMaterial color="#ffaa20" emissive="#ff6000" emissiveIntensity={2.5} transparent opacity={0.85}/>
    </instancedMesh>
  );
}

function CameraShake({ active }: { active: boolean }) {
  const { camera } = useThree();
  const t          = useRef(0);
  const origin     = useRef<THREE.Vector3 | null>(null);
  useFrame((_, delta) => {
    if (!active) return;
    if (!origin.current) origin.current = camera.position.clone();
    t.current += delta * 25;
    camera.position.x = origin.current.x + Math.sin(t.current * 1.3) * 0.08;
    camera.position.y = origin.current.y + Math.sin(t.current * 1.8) * 0.05;
  });
  return null;
}

interface Props {
  state: GameState; selectedShop: ShopItem | null;
  selectedTile: [number, number] | null;
  onTileClick: (row: number, col: number) => void;
  rocketLaunched: boolean;
}

export function GameCanvas({ state, selectedShop, selectedTile, onTileClick, rocketLaunched }: Props) {
  const { grid, gridSize, dayPhase, lightNorm, hubUpgraded } = state;
  const isNight = dayPhase === "night";
  const isDusk  = dayPhase === "dusk";
  const isDay   = dayPhase === "day";
  const camDist = gridSize * TILE_SIZE * 0.55 + 5;

  return (
    <Canvas shadows
      camera={{ position: [camDist * 0.7, camDist * 0.85, camDist * 0.7], fov: 50, near: 0.1, far: 300 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: isNight ? 1.4 : 1.1 }}
      style={{ background: "transparent" }}
    >
      {isDay && (
        <Sky distance={450000}
          sunPosition={[Math.cos(lightNorm * Math.PI * 2) * 12, Math.sin(lightNorm * Math.PI * 2) * 12, 6]}
          inclination={0.58} azimuth={0.25} turbidity={2} rayleigh={0.4}/>
      )}
      {isDusk && (
        <>
          <Sky distance={450000} sunPosition={[18, 2, -6]} turbidity={18} rayleigh={5} inclination={0.52} azimuth={0.3}/>
          <fog attach="fog" args={["#1a0808", 25, 100]}/>
        </>
      )}
      {isNight && (
        <>
          <Stars radius={80} depth={50} count={4000} factor={4} saturation={0.4} fade speed={0.4}/>
          {/* 夜でも見えるよう環境光を強化 */}
          <ambientLight color="#3050a0" intensity={1.2}/>
          <hemisphereLight color="#4060c0" groundColor="#1a2040" intensity={1.0}/>
         {/* グリッド全体を照らすエリアライト */}
          <pointLight position={[0, 12, 0]} color="#6080ff" intensity={2.0} distance={60}/>
        </>
      )}
      {dayPhase === "dawn" && (
        <Sky distance={450000} sunPosition={[-14, 4, 8]} turbidity={12} rayleigh={3.5} inclination={0.53}/>
      )}

      <SceneLighting phase={dayPhase}/>
      <OrbitControls target={[0, 0, 0]} minDistance={5} maxDistance={70}
        minPolarAngle={Math.PI / 10} maxPolarAngle={Math.PI / 2.1}
        enablePan panSpeed={0.9} rotateSpeed={0.65} zoomSpeed={0.9}
        dampingFactor={0.07} enableDamping/>
      <CameraShake active={rocketLaunched}/>
      <GroundPlane gridSize={gridSize} isNight={isNight}/>

      {grid.map((row, r) =>
        row.map((tile, c) => (
          <ThreeTile key={tile.id} tile={tile} row={r} col={c}
            gridSize={gridSize} dayPhase={dayPhase}
            isSelected={selectedTile?.[0] === r && selectedTile?.[1] === c}
            onClick={onTileClick}/>
        ))
      )}

      <LaunchParticles active={rocketLaunched}/>
      {isNight && (
        <pointLight position={[0, 4, 0]}
          color={hubUpgraded ? "#4080ff" : "#e050a0"}
          intensity={hubUpgraded ? 4 : 2}
          distance={gridSize * TILE_SIZE * 0.7}/>
      )}
    </Canvas>
  );
}