import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════
//  ■ 型定義
// ════════════════════════════════════════════════════════════════════

type TileType =
  | "empty"
  | "stone_deposit"
  | "iron_deposit"
  | "stone_drill"
  | "iron_drill"
  | "belt"
  | "solar";

type Direction = "up" | "right" | "down" | "left";

type ShopItem = "stone_drill" | "iron_drill" | "belt" | "solar" | null;

type ActiveTab = "factory" | "research";

interface Tile {
  id: number;
  type: TileType;
  direction?: Direction;
  /** ベルト上を流れる粒子の種類（アニメーション用） */
  beltParticle?: "stone" | "iron" | null;
}

interface Upgrades {
  efficientPickaxe: boolean; // 手動クリック量 +1
  turbodrillBoost:  boolean; // ドリル毎秒 +1
}

interface GameState {
  money:     number;
  stone:     number;
  iron:      number;
  powerUsed: number;
  powerMax:  number;
  grid:      Tile[][];
  upgrades:  Upgrades;
}

interface ToastMsg {
  id: number;
  text: string;
  color: string;
}

// ════════════════════════════════════════════════════════════════════
//  ■ 定数
// ════════════════════════════════════════════════════════════════════

const GRID_SIZE = 5;
const TICK_MS   = 1000;

const COSTS: Record<"stone_drill" | "iron_drill" | "belt" | "solar", number> = {
  stone_drill: 20,
  iron_drill:  100,
  belt:        5,
  solar:       150,
};

const SELL_RATE = { stone: 1, iron: 5 };

const POWER_USE: Record<"stone_drill" | "iron_drill", number> = {
  stone_drill: 1,
  iron_drill:  3,
};

const SOLAR_POWER = 10;

const UPGRADE_COSTS = {
  efficientPickaxe: 50,
  turbodrillBoost:  200,
} as const;

const INITIAL_STONE_DEPOSITS: [number, number][] = [[0,0],[0,1],[1,0]];
const INITIAL_IRON_DEPOSITS:  [number, number][] = [[0,3],[0,4],[1,4]];

const DIR_ORDER: Direction[] = ["up", "right", "down", "left"];

const DIR_ROTATE: Record<Direction, string> = {
  up:    "rotate-0",
  right: "rotate-90",
  down:  "rotate-180",
  left:  "-rotate-90",
};

const TILE_BG: Record<TileType, string> = {
  empty:         "#16161c",
  stone_deposit: "#33363f",
  iron_deposit:  "#1e2e42",
  stone_drill:   "#1a2535",
  iron_drill:    "#132030",
  belt:          "#161e20",
  solar:         "#1a2010",
};

const TILE_BORDER: Record<TileType, string> = {
  empty:         "#252530",
  stone_deposit: "#52596a",
  iron_deposit:  "#2e4d6e",
  stone_drill:   "#2e4d7e",
  iron_drill:    "#1e5a7e",
  belt:          "#1e4030",
  solar:         "#3a6020",
};

const SHOP_LABELS: Record<"stone_drill" | "iron_drill" | "belt" | "solar", string> = {
  stone_drill: "石ドリル",
  iron_drill:  "鉄ドリル",
  belt:        "ベルト",
  solar:       "ソーラー",
};

// ════════════════════════════════════════════════════════════════════
//  ■ ユーティリティ
// ════════════════════════════════════════════════════════════════════

const fmt = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toString();
};

function nextDir(d: Direction): Direction {
  return DIR_ORDER[(DIR_ORDER.indexOf(d) + 1) % 4];
}

function canPlace(tile: Tile, item: ShopItem): boolean {
  if (!item) return false;
  if (item === "stone_drill") return tile.type === "stone_deposit";
  if (item === "iron_drill")  return tile.type === "iron_deposit";
  if (item === "belt")        return tile.type === "empty";
  if (item === "solar")       return tile.type === "empty";
  return false;
}

function makeInitialGrid(): Tile[][] {
  const grid: Tile[][] = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => ({ id: r * GRID_SIZE + c, type: "empty" as TileType }))
  );
  for (const [r, c] of INITIAL_STONE_DEPOSITS) grid[r][c].type = "stone_deposit";
  for (const [r, c] of INITIAL_IRON_DEPOSITS)  grid[r][c].type = "iron_deposit";
  return grid;
}

/** 隣接マス座標（上右下左） */
function neighborOf(r: number, c: number, dir: Direction): [number, number] | null {
  const deltas: Record<Direction, [number, number]> = {
    up:    [-1,  0],
    right: [ 0,  1],
    down:  [ 1,  0],
    left:  [ 0, -1],
  };
  const [dr, dc] = deltas[dir];
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return null;
  return [nr, nc];
}

// ════════════════════════════════════════════════════════════════════
//  ■ SVG アイコン
// ════════════════════════════════════════════════════════════════════

const PickaxeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M3 21L10.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 4L20 10L13 17L7 11L14 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 4L17 2L22 7L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 21L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CoinIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#F5C842" strokeWidth="2" fill="#F5C84218"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="10" fill="#F5C842" fontWeight="bold">¥</text>
  </svg>
);

const StoneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <polygon points="4,18 8,6 16,5 20,12 17,19 7,20" fill="#7C8A99" stroke="#A0AFBF" strokeWidth="1.5" strokeLinejoin="round"/>
    <polygon points="8,6 12,8 10,14 6,13" fill="#9AABB8" opacity="0.6"/>
    <line x1="12" y1="8" x2="16" y2="10" stroke="#A0AFBF" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const IronIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="10" width="18" height="9" rx="2" fill="#7B8FA1" stroke="#A8BBC9" strokeWidth="1.5"/>
    <rect x="6" y="7" width="12" height="5" rx="1.5" fill="#8FA4B5" stroke="#A8BBC9" strokeWidth="1.5"/>
    <rect x="5" y="10" width="3" height="3" rx="0.5" fill="#C0D0DC" opacity="0.5"/>
    <rect x="16" y="10" width="3" height="3" rx="0.5" fill="#C0D0DC" opacity="0.5"/>
  </svg>
);

const DrillIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="10" width="12" height="5" rx="1.5" fill="#4A5568" stroke="#718096" strokeWidth="1.5"/>
    <polygon points="14,9.5 20,12 14,14.5" fill="#63B3ED" stroke="#4299E1" strokeWidth="1"/>
    <rect x="4" y="11.5" width="2" height="2" rx="0.3" fill="#2D3748"/>
    <rect x="8" y="11.5" width="2" height="2" rx="0.3" fill="#2D3748"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="#718096" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>
);

const BeltIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#1e2a20" stroke="#2a4030" strokeWidth="1.5"/>
    <path d="M12 17V7M8 11L12 7L16 11" stroke="#68D391" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LightningIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
      fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const SolarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="8" width="18" height="10" rx="1.5" fill="#1a3010" stroke="#4ade80" strokeWidth="1.5"/>
    <line x1="3" y1="13" x2="21" y2="13" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <line x1="10" y1="8" x2="10" y2="18" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <line x1="17" y1="8" x2="17" y2="18" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <path d="M8 5L9 7M12 4V6M16 5L15 7" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ResearchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M9 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5C19 3.9 18.1 3 17 3H15"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.4"/>
    <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FactoryIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M2 20V10L7 14V10L12 14V10L17 14V6H22V20H2Z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" opacity="0.15"/>
    <rect x="8" y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
    <rect x="13" y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
    <line x1="18" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ════════════════════════════════════════════════════════════════════
//  ■ 小コンポーネント
// ════════════════════════════════════════════════════════════════════

// ─── リソースバッジ ───────────────────────────────────
interface ResourceBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  perSec?: number;
  color: string;
}
const ResourceBadge = ({ icon, value, label, perSec, color }: ResourceBadgeProps) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl p-2 gap-0.5 flex-1 min-w-0"
    style={{ background: "#20202a", border: `1px solid ${color}28` }}
  >
    <div style={{ color }}>{icon}</div>
    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#555" }}>{label}</span>
    <span className="text-lg font-bold tabular-nums leading-none" style={{ color }}>{fmt(value)}</span>
    {perSec !== undefined && perSec > 0 && (
      <span className="text-[10px]" style={{ color: "#444" }}>+{perSec}/s</span>
    )}
  </div>
);

// ─── 電力バー ────────────────────────────────────────
interface PowerBarProps {
  used: number;
  max: number;
}
const PowerBar = ({ used, max }: PowerBarProps) => {
  const pct     = max === 0 ? 0 : Math.min(100, (used / max) * 100);
  const overload = used > max;
  const color   = overload ? "#FC8181" : pct > 70 ? "#FBBF24" : "#4ade80";
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ background: "#20202a", border: `1px solid ${overload ? "#FC818144" : "#4ade8022"}` }}
    >
      <LightningIcon className="w-4 h-4 shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-[10px] mb-1" style={{ color: "#666" }}>
          <span className="font-bold tracking-widest uppercase" style={{ color: overload ? "#FC8181" : "#4ade80" }}>
            電力 {overload ? "⚠ 不足" : ""}
          </span>
          <span style={{ color }}>{used} / {max} W</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "#2a2a36" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}88` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── タイルセル ──────────────────────────────────────
interface TileCellProps {
  tile: Tile;
  selectedShop: ShopItem;
  onTileClick: (r: number, c: number) => void;
  row: number;
  col: number;
  powerOk: boolean;
}
const TileCell = ({ tile, selectedShop, onTileClick, row, col, powerOk }: TileCellProps) => {
  const placeable    = canPlace(tile, selectedShop);
  const highlight    = !!selectedShop && placeable;
  const dimDrill     = (tile.type === "stone_drill" || tile.type === "iron_drill") && !powerOk;
  const borderColor  = highlight
    ? "#68D391"
    : selectedShop && !placeable
    ? "#FC818166"
    : TILE_BORDER[tile.type];

  return (
    <div
      onClick={() => onTileClick(row, col)}
      className="relative flex items-center justify-center rounded-lg cursor-pointer select-none transition-all duration-100 active:scale-95"
      style={{
        background:  TILE_BG[tile.type],
        border:      `1.5px solid ${borderColor}`,
        aspectRatio: "1/1",
        boxShadow:   highlight ? `0 0 10px #68D39140` : "none",
        opacity:     dimDrill ? 0.45 : 1,
      }}
    >
      {/* コンテンツ */}
      {tile.type === "stone_deposit" && (
        <div className="flex flex-col items-center gap-0.5">
          <StoneIcon className="w-5 h-5 opacity-75"/>
          <span className="text-[7px] font-bold tracking-wider" style={{ color: "#52596a" }}>STONE</span>
        </div>
      )}
      {tile.type === "iron_deposit" && (
        <div className="flex flex-col items-center gap-0.5">
          <IronIcon className="w-5 h-5 opacity-75"/>
          <span className="text-[7px] font-bold tracking-wider" style={{ color: "#2e4d6e" }}>IRON</span>
        </div>
      )}
      {tile.type === "stone_drill" && (
        <div className="flex flex-col items-center gap-0.5">
          <DrillIcon className="w-5 h-5"/>
          <StoneIcon className="w-3 h-3 opacity-50"/>
        </div>
      )}
      {tile.type === "iron_drill" && (
        <div className="flex flex-col items-center gap-0.5">
          <DrillIcon className="w-5 h-5" style={{ color: "#63B3ED" } as React.CSSProperties}/>
          <IronIcon className="w-3 h-3 opacity-50"/>
        </div>
      )}
      {tile.type === "belt" && (
        <div className={`w-full h-full p-0.5 transition-transform duration-200 ${DIR_ROTATE[tile.direction ?? "up"]}`}>
          <BeltIcon className="w-full h-full"/>
        </div>
      )}
      {tile.type === "solar" && (
        <div className="flex flex-col items-center gap-0.5">
          <SolarIcon className="w-5 h-5"/>
          <span className="text-[7px] font-bold" style={{ color: "#4ade80" }}>+{SOLAR_POWER}W</span>
        </div>
      )}
      {tile.type === "empty" && highlight && (
        <span className="text-lg font-bold" style={{ color: "#68D39150" }}>＋</span>
      )}

      {/* ドリル稼働 LED */}
      {(tile.type === "stone_drill" || tile.type === "iron_drill") && powerOk && (
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: tile.type === "stone_drill" ? "#A0AFBF" : "#63B3ED" }}
        />
      )}
      {/* 電力不足 LED */}
      {(tile.type === "stone_drill" || tile.type === "iron_drill") && !powerOk && (
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: "#FC8181" }}
        />
      )}

      {/* ベルト上の粒子 */}
      {tile.type === "belt" && tile.beltParticle && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: "beltFlow 0.6s ease-in-out" }}
        >
          {tile.beltParticle === "stone"
            ? <StoneIcon className="w-3 h-3 opacity-80"/>
            : <IronIcon  className="w-3 h-3 opacity-80"/>
          }
        </div>
      )}

      {/* ベルト方向ラベル */}
      {tile.type === "belt" && (
        <span className="absolute bottom-0.5 right-0.5 text-[6px] font-bold" style={{ color: "#1e4030" }}>
          {(tile.direction ?? "U")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

// ─── ショップボタン ───────────────────────────────────
interface ShopBtnProps {
  item: "stone_drill" | "iron_drill" | "belt" | "solar";
  label: string;
  cost: number;
  icon: React.ReactNode;
  accent: string;
  selected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  sublabel?: string;
}
const ShopBtn = ({ label, cost, icon, accent, selected, canAfford, onSelect, sublabel }: ShopBtnProps) => (
  <button
    onClick={onSelect}
    className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95"
    style={{
      background: selected ? `${accent}28` : "#20202a",
      border:     `1.5px solid ${selected ? accent : "#2e2e3a"}`,
      color:      canAfford ? accent : "#444",
      boxShadow:  selected ? `0 0 14px ${accent}38` : "none",
    }}
  >
    {icon}
    <span style={{ fontSize: "10px", lineHeight: 1.2 }}>{label}</span>
    {sublabel && <span style={{ fontSize: "9px", color: "#555" }}>{sublabel}</span>}
    <span className="flex items-center gap-0.5" style={{ color: canAfford ? "#F5C842" : "#444" }}>
      <CoinIcon className="w-3 h-3"/>
      {cost}
    </span>
  </button>
);

// ─── アップグレードカード ────────────────────────────
interface UpgradeCardProps {
  title: string;
  description: string;
  cost: number;
  purchased: boolean;
  canAfford: boolean;
  onBuy: () => void;
  icon: React.ReactNode;
  accent: string;
}
const UpgradeCard = ({ title, description, cost, purchased, canAfford, onBuy, icon, accent }: UpgradeCardProps) => (
  <div
    className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200"
    style={{
      background: purchased ? `${accent}12` : "#20202a",
      border:     `1.5px solid ${purchased ? accent + "60" : "#2e2e3a"}`,
    }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
    >
      <div style={{ color: accent }}>{icon}</div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm" style={{ color: purchased ? accent : "#ccc" }}>{title}</div>
      <div className="text-xs mt-0.5" style={{ color: "#555" }}>{description}</div>
    </div>
    {purchased ? (
      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${accent}22`, color: accent }}>
        習得済
      </span>
    ) : (
      <button
        onClick={onBuy}
        disabled={!canAfford}
        className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: canAfford ? `${accent}22` : "#1a1a22",
          border:     `1px solid ${canAfford ? accent : "#333"}`,
          color:      canAfford ? accent : "#444",
        }}
      >
        <CoinIcon className="w-3.5 h-3.5"/>
        {cost}
      </button>
    )}
  </div>
);

// ════════════════════════════════════════════════════════════════════
//  ■ メインコンポーネント
// ════════════════════════════════════════════════════════════════════

export default function App() {
  const [state, setState] = useState<GameState>({
    money:     0,
    stone:     0,
    iron:      0,
    powerUsed: 0,
    powerMax:  0,
    grid:      makeInitialGrid(),
    upgrades:  { efficientPickaxe: false, turbodrillBoost: false },
  });

  const [activeTab,    setActiveTab]    = useState<ActiveTab>("factory");
  const [selectedShop, setSelectedShop] = useState<ShopItem>(null);
  const [toasts,       setToasts]       = useState<ToastMsg[]>([]);
  const [tick,         setTick]         = useState(0);
  const [clickAnim,    setClickAnim]    = useState({ stone: false, iron: false });

  // ── ゲームループ（1秒）
  useEffect(() => {
    const id = setInterval(() => {
      setState(prev => {
        // 電力計算
        let powerUsed = 0;
        let powerMax  = 0;
        for (const row of prev.grid) {
          for (const t of row) {
            if (t.type === "stone_drill") powerUsed += POWER_USE.stone_drill;
            if (t.type === "iron_drill")  powerUsed += POWER_USE.iron_drill;
            if (t.type === "solar")       powerMax  += SOLAR_POWER;
          }
        }
        const powerOk = powerUsed <= powerMax || powerMax === 0;
        const efficiency = powerOk ? 1 : 0.5;
        const drillBonus = prev.upgrades.turbodrillBoost ? 1 : 0;

        // 採掘
        let stonePlus = 0, ironPlus = 0;
        for (const row of prev.grid) {
          for (const t of row) {
            if (t.type === "stone_drill") stonePlus += (1 + drillBonus) * efficiency;
            if (t.type === "iron_drill")  ironPlus  += (1 + drillBonus) * efficiency;
          }
        }

        // ベルト搬送（簡易）
        const newGrid: Tile[][] = prev.grid.map(row => row.map(t => ({ ...t, beltParticle: null as Tile["beltParticle"] })));
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const t = prev.grid[r][c];
            if (t.type !== "belt") continue;
            const nb = neighborOf(r, c, t.direction ?? "up");
            if (!nb) continue;
            const [nr, nc] = nb;
            const neighbor = prev.grid[nr][nc];
            // ドリルの隣にベルトがある場合、粒子を流す（視覚演出のみ）
            const above = neighborOf(r, c, { up: "down", right: "left", down: "up", left: "right" }[t.direction ?? "up"] as Direction);
            if (above) {
              const [ar, ac] = above;
              const src = prev.grid[ar][ac];
              if (src.type === "stone_drill") newGrid[r][c].beltParticle = "stone";
              if (src.type === "iron_drill")  newGrid[r][c].beltParticle = "iron";
            }
          }
        }

        return {
          ...prev,
          stone:     prev.stone + stonePlus,
          iron:      prev.iron  + ironPlus,
          powerUsed,
          powerMax,
          grid:      newGrid,
        };
      });
      setTick(t => t + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ESC でショップキャンセル
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedShop(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── トースト
  const showToast = useCallback((text: string, color: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 1600);
  }, []);

  // ── 手動採掘
  const mineStone = () => {
    const bonus = state.upgrades.efficientPickaxe ? 2 : 1;
    setState(prev => ({ ...prev, stone: prev.stone + bonus }));
    setClickAnim(a => ({ ...a, stone: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, stone: false })), 150);
  };
  const mineIron = () => {
    const bonus = state.upgrades.efficientPickaxe ? 2 : 1;
    setState(prev => ({ ...prev, iron: prev.iron + bonus }));
    setClickAnim(a => ({ ...a, iron: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, iron: false })), 150);
  };

  // ── 売却
  const sellStone = () => {
    setState(prev => {
      if (prev.stone <= 0) return prev;
      const earned = Math.floor(prev.stone) * SELL_RATE.stone;
      showToast(`+${fmt(earned)} コイン`, "#F5C842");
      return { ...prev, money: prev.money + earned, stone: 0 };
    });
  };
  const sellIron = () => {
    setState(prev => {
      if (prev.iron <= 0) return prev;
      const earned = Math.floor(prev.iron) * SELL_RATE.iron;
      showToast(`+${fmt(earned)} コイン`, "#F5C842");
      return { ...prev, money: prev.money + earned, iron: 0 };
    });
  };

  // ── タイルクリック
  const handleTileClick = useCallback((r: number, c: number) => {
    setState(prev => {
      const tile = prev.grid[r][c];

      if (selectedShop) {
        if (!canPlace(tile, selectedShop)) {
          showToast("ここには配置できません", "#FC8181");
          return prev;
        }
        if (prev.money < COSTS[selectedShop]) {
          showToast("コインが足りません", "#FC8181");
          return prev;
        }
        const newGrid = prev.grid.map(row => row.map(t => ({ ...t })));
        newGrid[r][c] = {
          ...newGrid[r][c],
          type:      selectedShop,
          direction: selectedShop === "belt" ? "up" : undefined,
        };
        showToast(`${SHOP_LABELS[selectedShop]} 設置！`, "#68D391");
        return { ...prev, money: prev.money - COSTS[selectedShop], grid: newGrid };
      }

      if (tile.type === "belt") {
        const newGrid = prev.grid.map(row => row.map(t => ({ ...t })));
        newGrid[r][c] = { ...newGrid[r][c], direction: nextDir(newGrid[r][c].direction ?? "up") };
        return { ...prev, grid: newGrid };
      }

      return prev;
    });
  }, [selectedShop, showToast]);

  // ── アップグレード購入
  const buyUpgrade = (key: keyof Upgrades) => {
    setState(prev => {
      if (prev.upgrades[key]) return prev;
      const cost = UPGRADE_COSTS[key];
      if (prev.money < cost) { showToast("コインが足りません", "#FC8181"); return prev; }
      showToast("研究完了！", "#C084FC");
      return {
        ...prev,
        money:    prev.money - cost,
        upgrades: { ...prev.upgrades, [key]: true },
      };
    });
  };

  // ── 派生値
  const { money, stone, iron, powerUsed, powerMax, grid, upgrades } = state;
  const powerOk       = powerUsed <= powerMax || powerMax === 0;
  const stoneDrillCnt = grid.flat().filter(t => t.type === "stone_drill").length;
  const ironDrillCnt  = grid.flat().filter(t => t.type === "iron_drill").length;
  const beltCnt       = grid.flat().filter(t => t.type === "belt").length;
  const solarCnt      = grid.flat().filter(t => t.type === "solar").length;
  const drillBonus    = upgrades.turbodrillBoost ? 1 : 0;
  const efficiency    = powerOk ? 1 : 0.5;
  const stonePerSec   = Math.floor(stoneDrillCnt * (1 + drillBonus) * efficiency);
  const ironPerSec    = Math.floor(ironDrillCnt  * (1 + drillBonus) * efficiency);

  // ════════════════════════════════════════════════════════════════════
  //  レンダリング
  // ════════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: "#13131a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ── ヘッダー ── */}
      <header
        className="w-full flex items-center justify-between px-4 py-2.5 sticky top-0 z-20"
        style={{ background: "#0e0e14", borderBottom: "1px solid #22222e" }}
      >
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="#63B3ED" opacity="0.8"/>
            <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="#68D391" opacity="0.7"/>
            <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="#F6AD55" opacity="0.6"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#C084FC" opacity="0.5"/>
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#888" }}>
            Micro-Factory
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#1e1e2a", color: "#C084FC" }}>
            Ph.3
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CoinIcon className="w-5 h-5"/>
          <span className="text-xl font-bold tabular-nums" style={{ color: "#F5C842" }}>{fmt(money)}</span>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col gap-3 px-3 pb-10 pt-3">

        {/* ── リソース行 ── */}
        <div className="flex gap-2">
          <ResourceBadge icon={<StoneIcon className="w-6 h-6"/>} value={stone} label="石" perSec={stonePerSec} color="#A0AFBF"/>
          <ResourceBadge icon={<IronIcon  className="w-6 h-6"/>} value={iron}  label="鉄" perSec={ironPerSec}  color="#7BAEC8"/>
        </div>

        {/* ── 電力バー（ソーラーが1枚以上あるか電力消費ある場合に表示） */}
        {(solarCnt > 0 || powerUsed > 0) && (
          <PowerBar used={powerUsed} max={powerMax}/>
        )}

        {/* ── 手動採掘 & 売却 ── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { fn: mineStone, active: clickAnim.stone, border: "#7C8A99", color: "#A0AFBF", icon: <PickaxeIcon className="w-4 h-4"/>, label: "石を採掘" },
            { fn: mineIron,  active: clickAnim.iron,  border: "#7B8FA1", color: "#7BAEC8", icon: <PickaxeIcon className="w-4 h-4"/>, label: "鉄を採掘" },
          ].map(({ fn, active, border, color, icon, label }) => (
            <button key={label} onClick={fn}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-bold text-sm transition-all duration-100 active:scale-95"
              style={{ background: active ? `${border}28` : "#20202a", border: `1px solid ${border}`, color, transform: active ? "scale(0.96)" : "scale(1)" }}
            >
              {icon}{label}
              {upgrades.efficientPickaxe && <span className="text-[10px] opacity-60">×2</span>}
            </button>
          ))}
          <button onClick={sellStone} disabled={stone <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: "#20202a", border: "1px solid #c8a020", color: "#F5C842" }}>
            <StoneIcon className="w-4 h-4"/>売却
          </button>
          <button onClick={sellIron} disabled={iron <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: "#20202a", border: "1px solid #c8a020", color: "#F5C842" }}>
            <IronIcon className="w-4 h-4"/>売却
          </button>
        </div>

        {/* ── タブ ── */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #22222e" }}>
          {([
            { id: "factory",  label: "工場",   icon: <FactoryIcon  className="w-4 h-4"/> },
            { id: "research", label: "研究所",  icon: <ResearchIcon className="w-4 h-4"/> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all duration-200"
              style={{
                background: activeTab === id ? "#20202a" : "#13131a",
                color:      activeTab === id
                  ? (id === "factory" ? "#68D391" : "#C084FC")
                  : "#444",
                borderBottom: activeTab === id
                  ? `2px solid ${id === "factory" ? "#68D391" : "#C084FC"}`
                  : "2px solid transparent",
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ══ 工場タブ ══ */}
        {activeTab === "factory" && (
          <>
            {/* ショップ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>ショップ</span>
                {selectedShop && (
                  <button onClick={() => setSelectedShop(null)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "#FC818120", color: "#FC8181", border: "1px solid #FC818150" }}>
                    ✕ キャンセル
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {([
                  { item: "stone_drill", icon: <DrillIcon className="w-5 h-5"/>, accent: "#A0AFBF", sub: "1W消費" },
                  { item: "iron_drill",  icon: <DrillIcon className="w-5 h-5"/>, accent: "#63B3ED", sub: "3W消費" },
                  { item: "belt",        icon: <BeltIcon  className="w-5 h-5"/>, accent: "#68D391", sub: "搬送" },
                  { item: "solar",       icon: <SolarIcon className="w-5 h-5"/>, accent: "#4ade80", sub: "+10W" },
                ] as const).map(({ item, icon, accent, sub }) => (
                  <ShopBtn
                    key={item}
                    item={item}
                    label={SHOP_LABELS[item]}
                    cost={COSTS[item]}
                    icon={icon}
                    accent={accent}
                    selected={selectedShop === item}
                    canAfford={money >= COSTS[item]}
                    onSelect={() => setSelectedShop(prev => prev === item ? null : item)}
                    sublabel={sub}
                  />
                ))}
              </div>
            </div>

            {/* 配置モードバナー */}
            {selectedShop && (
              <div className="text-center text-[11px] font-bold py-1.5 rounded-lg"
                style={{ background: "#68D39115", color: "#68D391", border: "1px solid #68D39130" }}>
                ✦ 配置モード：マスをタップして設置
                {selectedShop === "stone_drill" && "（石鉱床のみ）"}
                {selectedShop === "iron_drill"  && "（鉄鉱床のみ）"}
                {selectedShop === "belt"        && "（空きマスのみ）"}
                {selectedShop === "solar"       && "（空きマスのみ）"}
              </div>
            )}

            {/* グリッド */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
                  工場グリッド 5×5
                </span>
                <span className="text-[10px]" style={{ color: "#333" }}>ベルト→タップで回転</span>
              </div>
              <div className="grid gap-1.5 w-full" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                {grid.map((row, r) =>
                  row.map((tile, c) => (
                    <TileCell
                      key={tile.id}
                      tile={tile}
                      selectedShop={selectedShop}
                      onTileClick={handleTileClick}
                      row={r} col={c}
                      powerOk={powerOk}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 稼働状況 */}
            {(stoneDrillCnt > 0 || ironDrillCnt > 0 || beltCnt > 0 || solarCnt > 0) && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: "#20202a", border: "1px solid #2a2a36" }}>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "#444" }}>稼働状況</div>
                <div className="flex flex-col gap-1">
                  {stoneDrillCnt > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#A0AFBF" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#A0AFBF" }}/>
                      石ドリル ×{stoneDrillCnt} → +{stonePerSec} 石/s
                      {!powerOk && <span style={{ color: "#FC8181" }}>（半減中）</span>}
                    </div>
                  )}
                  {ironDrillCnt > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#63B3ED" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#63B3ED" }}/>
                      鉄ドリル ×{ironDrillCnt} → +{ironPerSec} 鉄/s
                      {!powerOk && <span style={{ color: "#FC8181" }}>（半減中）</span>}
                    </div>
                  )}
                  {solarCnt > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#4ade80" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }}/>
                      ソーラー ×{solarCnt} → +{solarCnt * SOLAR_POWER}W
                    </div>
                  )}
                  {beltCnt > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#68D391" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#68D391" }}/>
                      ベルト ×{beltCnt} 設置済
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 凡例 */}
            <div className="rounded-xl px-3 py-2" style={{ background: "#20202a", border: "1px solid #252530" }}>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "#444" }}>凡例</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { c: "#52596a", t: "石鉱床" },
                  { c: "#2e4d6e", t: "鉄鉱床" },
                  { c: "#2e4d7e", t: "石ドリル (1W)" },
                  { c: "#1e5a7e", t: "鉄ドリル (3W)" },
                  { c: "#1e4030", t: "ベルト（回転可）" },
                  { c: "#3a6020", t: "ソーラー (+10W)" },
                ].map(({ c, t }) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded shrink-0" style={{ background: c, border: `1px solid ${c}cc` }}/>
                    <span className="text-[10px]" style={{ color: "#555" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ 研究タブ ══ */}
        {activeTab === "research" && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
              永続アップグレード
            </div>

            <UpgradeCard
              title="効率的なツルハシ"
              description="手動採掘で獲得できる資源が +1 増える（合計 ×2）"
              cost={UPGRADE_COSTS.efficientPickaxe}
              purchased={upgrades.efficientPickaxe}
              canAfford={money >= UPGRADE_COSTS.efficientPickaxe}
              onBuy={() => buyUpgrade("efficientPickaxe")}
              icon={<PickaxeIcon className="w-6 h-6"/>}
              accent="#F6AD55"
            />

            <UpgradeCard
              title="過給ドリル"
              description="すべてのドリルの毎秒生産量が +1 される"
              cost={UPGRADE_COSTS.turbodrillBoost}
              purchased={upgrades.turbodrillBoost}
              canAfford={money >= UPGRADE_COSTS.turbodrillBoost}
              onBuy={() => buyUpgrade("turbodrillBoost")}
              icon={<DrillIcon className="w-6 h-6"/>}
              accent="#C084FC"
            />

            {/* 研究状況サマリ */}
            <div
              className="rounded-xl px-3 py-2.5 mt-1"
              style={{ background: "#20202a", border: "1px solid #2a2a36" }}
            >
              <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#444" }}>現在の効果</div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: "#666" }}>手動採掘量</span>
                  <span style={{ color: upgrades.efficientPickaxe ? "#F6AD55" : "#444" }}>
                    ×{upgrades.efficientPickaxe ? 2 : 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#666" }}>ドリル生産ボーナス</span>
                  <span style={{ color: upgrades.turbodrillBoost ? "#C084FC" : "#444" }}>
                    +{upgrades.turbodrillBoost ? 1 : 0} /s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#666" }}>電力状態</span>
                  <span style={{ color: powerOk ? "#4ade80" : "#FC8181" }}>
                    {powerMax === 0 ? "電源なし" : powerOk ? "正常" : "⚠ 不足"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-[10px]" style={{ color: "#1e1e28" }}>tick #{tick}</div>
      </main>

      {/* ── トースト通知 ── */}
      <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-50">
        {toasts.map(t => (
          <div key={t.id} className="px-4 py-2 rounded-full text-sm font-bold shadow-2xl"
            style={{ background: "#13131a", border: `1px solid ${t.color}`, color: t.color, animation: "toastIn 0.2s ease" }}>
            {t.text}
          </div>
        ))}
      </div>

      {/* ── グローバル CSS ── */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes beltFlow {
          0%   { opacity: 0; transform: scale(0.5); }
          40%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .-rotate-90 { transform: rotate(-90deg); }
        .rotate-0   { transform: rotate(0deg);   }
        .rotate-90  { transform: rotate(90deg);  }
        .rotate-180 { transform: rotate(180deg); }
      `}</style>
    </div>
  );
}
