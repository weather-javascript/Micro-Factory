// ════════════════════════════════════════════════════════════════════
//  components/HUDOverlay.tsx — PS5風SF-HUD オーバーレイ
//  工場/研究/統計/宇宙貿易 タブを含む半透明UIを提供。
// ════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { GameState, ShopItem, Upgrades, ProdStats } from "../types";
import {
  COSTS, UPGRADE_COSTS, UPGRADE_LABELS, UPGRADE_DESC,
  SELL_RATES, INITIAL_MILESTONES, PRESTIGE_SKILLS,
  ROCKET_REQUIREMENTS,
} from "../constants";
import { fmt } from "../utils/gameLogic";

// ─── カラー定数 ──────────────────────────────────────────────────────
const C = {
  bg:      "rgba(8,8,18,0.85)",
  surface: "rgba(16,16,30,0.9)",
  border:  "rgba(40,60,120,0.6)",
  accent:  "#4a90e0",
  green:   "#4ade80",
  purple:  "#c084fc",
  gold:    "#f5c842",
  red:     "#fc8181",
  cyan:    "#60d0ff",
  orange:  "#fb923c",
};

// ─── 共通コンポーネント ──────────────────────────────────────────────
const Panel: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = "", style }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      backdropFilter: "blur(12px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel: React.FC<{ text: string; color?: string }> = ({ text, color = "#446" }) => (
  <div className="text-[9px] font-black tracking-[0.25em] uppercase mb-2" style={{ color }}>
    {text}
  </div>
);

// ─── 資源バッジ ──────────────────────────────────────────────────────
const ResBadge: React.FC<{
  icon: string; value: number; label: string; color: string; perSec?: number;
}> = ({ icon, value, label, color, perSec }) => (
  <div
    className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
    style={{ background: `${color}10`, border: `1px solid ${color}30` }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    <div>
      <div className="text-base font-black tabular-nums leading-none" style={{ color, fontFamily: "monospace" }}>
        {fmt(value)}
      </div>
      <div className="flex gap-1 items-center mt-0.5">
        <span className="text-[9px]" style={{ color: `${color}70` }}>{label}</span>
        {perSec !== undefined && perSec > 0 && (
          <span className="text-[9px] tabular-nums" style={{ color: `${color}50` }}>+{perSec}/s</span>
        )}
      </div>
    </div>
  </div>
);

// ─── 電力バー ────────────────────────────────────────────────────────
const PowerMeter: React.FC<{
  used: number; generated: number; battCharge: number; battMax: number; isNight: boolean;
}> = ({ used, generated, battCharge, battMax, isNight }) => {
  const over  = used > generated;
  const ratio = generated <= 0 ? 0 : Math.min(1, used / generated);
  const bRatio = battMax <= 0 ? 0 : Math.min(1, battCharge / battMax);
  const col   = over ? C.red : ratio > 0.85 ? C.orange : C.green;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold tracking-widest" style={{ color: "#555" }}>⚡ POWER</span>
        <span className="text-[10px] font-black tabular-nums" style={{ color: col }}>
          {used}W / {generated}W {over && "⚠ OVERLOAD"}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#252535" }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, ratio * 100)}%`, background: `linear-gradient(90deg, ${col}80, ${col})`, boxShadow: `0 0 6px ${col}60` }}/>
      </div>
      {battMax > 0 && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold tracking-widest" style={{ color: "#555" }}>🔋 BATTERY</span>
            <span className="text-[10px] tabular-nums" style={{ color: "#a78bfa" }}>
              {Math.floor(battCharge)}Wh / {battMax}Wh {isNight ? "（放電）" : "（充電）"}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#252535" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${bRatio * 100}%`, background: "linear-gradient(90deg, #6d28d9, #a78bfa)" }}/>
          </div>
        </>
      )}
    </div>
  );
};

// ─── ショップボタン ──────────────────────────────────────────────────
const ShopBtn: React.FC<{
  item: ShopItem; label: string; cost: number | null; icon: string;
  accent: string; selected: boolean; canAfford: boolean;
  onSelect: () => void; sublabel?: string; locked?: boolean;
}> = ({ item, label, cost, icon, accent, selected, canAfford, onSelect, sublabel, locked = false }) => (
  <button
    onClick={onSelect}
    disabled={locked}
    className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 transition-all duration-150 relative"
    style={{
      background:  selected ? `${accent}25` : locked ? "#0a0a14" : canAfford ? "#141420" : "#0e0e18",
      border:     `1px solid ${selected ? accent : locked ? "#1a1a24" : canAfford ? accent + "50" : "#1e1e28"}`,
      color:       selected ? accent : locked ? "#2a2a38" : canAfford ? accent : "#333",
      transform:   selected ? "scale(0.96)" : "scale(1)",
      boxShadow:   selected ? `0 0 10px ${accent}50, inset 0 0 6px ${accent}15` : "none",
      opacity:     locked ? 0.4 : 1,
      flex: "1 1 0",
      minWidth: 0,
    }}
  >
    {locked && <div className="absolute top-0.5 right-0.5 text-[8px]" style={{ color: "#444" }}>🔒</div>}
    <span style={{ fontSize: 14, opacity: locked ? 0.3 : 1 }}>{icon}</span>
    <span className="text-[8px] font-bold leading-none text-center" style={{ opacity: locked ? 0.3 : 1 }}>{label}</span>
    {cost !== null && (
      <span className="text-[8px] tabular-nums" style={{ color: canAfford ? accent + "80" : "#2a2a38" }}>{cost}¥</span>
    )}
    {sublabel && <span className="text-[7px]" style={{ color: "#333" }}>{sublabel}</span>}
  </button>
);

// ─── 研究カード ──────────────────────────────────────────────────────
const UpgradeCard: React.FC<{
  upgradeKey: keyof Upgrades; state: GameState; onBuy: () => void;
  icon: string; accent: string;
}> = ({ upgradeKey, state, onBuy, icon, accent }) => {
  const cost     = UPGRADE_COSTS[upgradeKey];
  const done     = state.upgrades[upgradeKey];
  const locked   = !!(cost.requiresUpgrade && !state.upgrades[cost.requiresUpgrade]);
  const canAfford =
    !locked &&
    state.money >= cost.money &&
    (!cost.stone || state.stone >= cost.stone) &&
    (!cost.iron  || state.iron  >= cost.iron)  &&
    (!cost.gear  || state.totalGearsShipped >= cost.gear) &&
    (!cost.fuel_rod || state.totalFuelShipped >= (cost.fuel_rod ?? 0));

  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: done ? `${accent}12` : locked ? "#0a0a14" : "#141420",
        border: `1px solid ${done ? accent + "50" : locked ? "#1a1a24" : "#252535"}`,
        opacity: locked ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg"
          style={{ background: done ? `${accent}20` : "#101018", border: `1px solid ${done ? accent + "40" : "#1e1e2a"}` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold" style={{ color: done ? accent : locked ? "#333" : "#ccc" }}>
              {UPGRADE_LABELS[upgradeKey]}
            </span>
            {done && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${accent}20`, color: accent }}>✓</span>}
            {locked && cost.requiresUpgrade && (
              <span className="text-[9px]" style={{ color: "#444" }}>🔒 {UPGRADE_LABELS[cost.requiresUpgrade]}が必要</span>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: "#445" }}>{UPGRADE_DESC[upgradeKey]}</p>
          {!done && !locked && (
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: `${cost.money}¥`, met: state.money >= cost.money, col: C.gold },
                cost.stone    && { label: `石×${cost.stone}`,        met: state.stone >= cost.stone, col: "#A0AFBF" },
                cost.iron     && { label: `鉄×${cost.iron}`,          met: state.iron  >= cost.iron,  col: "#63B3ED" },
                cost.gear     && { label: `歯車出荷×${cost.gear}`,    met: state.totalGearsShipped >= cost.gear, col: C.gold },
                cost.fuel_rod && { label: `燃料棒×${cost.fuel_rod}`,  met: state.totalFuelShipped  >= (cost.fuel_rod ?? 0), col: C.green },
              ].filter(Boolean).map((chip: any) => (
                <span key={chip.label} className="text-[9px] px-1 py-0.5 rounded"
                  style={{ background: chip.met ? `${chip.col}15` : "#101018", border: `1px solid ${chip.met ? chip.col + "40" : "#1e1e28"}`, color: chip.met ? chip.col : "#333" }}>
                  {chip.met ? "✓ " : ""}{chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {!done && !locked && (
        <button
          onClick={onBuy}
          disabled={!canAfford}
          className="w-full mt-2 py-1.5 rounded-lg text-xs font-black transition-all"
          style={{
            background: canAfford ? `${accent}20` : "#0e0e18",
            border:    `1px solid ${canAfford ? accent : "#1e1e28"}`,
            color:      canAfford ? accent : "#2a2a38",
            cursor:     canAfford ? "pointer" : "not-allowed",
            boxShadow:  canAfford ? `0 0 8px ${accent}30` : "none",
          }}
        >
          {canAfford ? "▶ 研究する" : "素材不足"}
        </button>
      )}
    </div>
  );
};

// ─── スパークライン ───────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return (
    <svg width={100} height={24}>
      <line x1="0" y1="12" x2="100" y2="12" stroke={color + "30"} strokeWidth="1" strokeDasharray="3 3"/>
    </svg>
  );
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${24 - (v / max) * 20 - 2}`).join(" ");
  const lx  = 100, ly = 24 - (data[data.length - 1] / max) * 20 - 2;
  return (
    <svg width={100} height={24} style={{ overflow: "visible" }}>
      <polyline points={`0,24 ${pts} 100,24`} fill={color + "20"}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}/>
    </svg>
  );
};

// ─── マイルストーンカード ────────────────────────────────────────────
const MilestoneCard: React.FC<{
  milestone: (typeof INITIAL_MILESTONES)[number];
  progress:  Partial<Record<string, number>>;
}> = ({ milestone, progress }) => {
  const pct = Math.min(100, Object.entries(milestone.requires).reduce((acc, [item, need]) => {
    const cur  = progress[item] ?? 0;
    const frac = Math.min(1, cur / (need as number));
    return acc + frac;
  }, 0) / Object.keys(milestone.requires).length * 100);

  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: milestone.completed ? "#0a1a0a" : "#101018",
        border: `1px solid ${milestone.completed ? "#2a6a2a" : "#1e2a3a"}`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color: milestone.completed ? C.green : "#8090b0" }}>
          {milestone.completed ? "✓ " : ""}{milestone.label}
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: milestone.completed ? C.green : "#446" }}>
          {Math.floor(pct)}%
        </span>
      </div>
      <p className="text-[10px] mb-1.5" style={{ color: "#446" }}>{milestone.description}</p>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#111a24" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: milestone.completed ? "linear-gradient(90deg,#2a8a2a,#4ade80)" : "linear-gradient(90deg,#1a4a8a,#4090d0)" }}/>
      </div>
      <div className="mt-1 text-[9px]" style={{ color: "#2a4a6a" }}>
        報酬: <span style={{ color: C.cyan }}>{milestone.rewardLabel}</span>
      </div>
    </div>
  );
};

// ─── プレステージスキル選択 ──────────────────────────────────────────
const PrestigePanel: React.FC<{
  tokens:       number;
  selectedSkills: string[];
  onSelect:     (id: string) => void;
  onConfirm:    () => void;
}> = ({ tokens, selectedSkills, onSelect, onConfirm }) => (
  <div className="space-y-3">
    <div className="text-center">
      <div className="text-sm font-black" style={{ color: C.cyan }}>👽 銀河開拓パス</div>
      <div className="text-[10px] mt-0.5" style={{ color: "#446" }}>
        エイリアントークン: <span style={{ color: C.gold }}>{tokens}</span> / 残り選択可能: {tokens}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {PRESTIGE_SKILLS.map(skill => {
        const sel = selectedSkills.includes(skill.id);
        return (
          <button
            key={skill.id}
            onClick={() => onSelect(skill.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
              background: sel ? `${C.cyan}15` : "#101018",
              border: `1px solid ${sel ? C.cyan : "#1e2a3a"}`,
              boxShadow: sel ? `0 0 8px ${C.cyan}30` : "none",
            }}
          >
            <span style={{ fontSize: 20 }}>{skill.icon}</span>
            <div>
              <div className="text-xs font-bold" style={{ color: sel ? C.cyan : "#8090b0" }}>{skill.label}</div>
              <div className="text-[10px]" style={{ color: "#446" }}>{skill.description}</div>
            </div>
            {sel && <div className="ml-auto text-[10px] font-black" style={{ color: C.cyan }}>✓</div>}
          </button>
        );
      })}
    </div>
    {selectedSkills.length > 0 && (
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-xl font-black text-sm"
        style={{
          background: "linear-gradient(135deg, #0a3040, #1a6080)",
          color: C.cyan, border: `1px solid ${C.cyan}50`,
          boxShadow: `0 0 16px ${C.cyan}30`,
        }}
      >
        👽 {selectedSkills.length}個の特権を引き継いで新周回へ
      </button>
    )}
  </div>
);

// ─── メインHUDコンポーネント ─────────────────────────────────────────
interface HUDProps {
  state:          GameState;
  selectedShop:   ShopItem | null;
  prodStats:      ProdStats;
  powerGenerated: number;
  phaseRemain:    number;
  showRocketClear: boolean;
  onToggleShop:   (item: ShopItem) => void;
  onCancelShop:   () => void;
  onTileClick:    (r: number, c: number) => void;
  onMineStone:    () => void;
  onMineIron:     () => void;
  onSellStone:    () => void;
  onSellIron:     () => void;
  onBuyUpgrade:   (key: keyof Upgrades) => void;
  onNewGamePlus:  (skills: string[]) => void;
  onDismissRocket: () => void;
}

export const HUDOverlay: React.FC<HUDProps> = ({
  state, selectedShop, prodStats, powerGenerated, phaseRemain,
  showRocketClear,
  onToggleShop, onCancelShop, onMineStone, onMineIron,
  onSellStone, onSellIron, onBuyUpgrade, onNewGamePlus, onDismissRocket,
}) => {
  const [tab, setTab]                 = useState<"factory" | "research" | "stats" | "trade">("factory");
  const [prestigeSkills, setPrestige] = useState<string[]>([]);

  const {
    money, stone, iron, uranium, gear, fuel_rod, water,
    dayPhase, batteryCharge, batteryMax,
    upgrades, milestones, statsHistory,
    totalGearsShipped, totalFuelShipped, totalIronShipped, totalStonesShipped,
    moduleInventory, ngPlusBuff,
    rocketLaunched,
  } = state;

  const isDay   = dayPhase === "day";
  const isNight = dayPhase === "night";

  const TABS = [
    { id: "factory",  label: "工場",     icon: "🏭" },
    { id: "research", label: "研究所",   icon: "🔬" },
    { id: "stats",    label: "統計",     icon: "📊" },
    { id: "trade",    label: "宇宙貿易", icon: "🛸" },
  ] as const;

  const togglePrestige = (id: string) => {
    setPrestige(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col">

      {/* ════════ ロケットクリア画面 ════════ */}
      {showRocketClear && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
          style={{ background: "radial-gradient(ellipse at center, #001040cc, #000010f0)", backdropFilter: "blur(16px)" }}
        >
          {/* 星パーティクル */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
                  background: "#fff", opacity: Math.random(),
                  animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative text-center px-8 py-10 rounded-3xl max-w-sm mx-4 pointer-events-auto"
            style={{ background: "linear-gradient(135deg, #060e20, #080820)", border: "1px solid #2060a0", boxShadow: "0 0 80px #2060a060" }}>
            <div className="text-7xl mb-4" style={{ animation: "rocketUp 0.8s ease-out forwards" }}>🚀</div>
            <h1 className="text-3xl font-black mb-2" style={{ color: C.cyan, letterSpacing: "0.1em" }}>MISSION<br/>COMPLETE</h1>
            <p className="text-sm mb-6" style={{ color: "#446" }}>軌道エレベーター経由で宇宙へ！</p>

            <div className="rounded-xl px-4 py-3 mb-4 text-left space-y-1"
              style={{ background: "#060e1a", border: "1px solid #1a3060" }}>
              {[
                { l: "歯車出荷", v: `${totalGearsShipped}`, c: C.gold },
                { l: "燃料棒出荷", v: `${totalFuelShipped}`, c: C.green },
                { l: "資金", v: `¥${fmt(money)}`, c: C.gold },
                { l: "周回", v: `${ngPlusBuff.cycle + 1}周目`, c: C.cyan },
              ].map(({ l, v, c }) => (
                <div key={l} className="flex justify-between text-xs">
                  <span style={{ color: "#446" }}>{l}</span>
                  <span className="font-bold tabular-nums" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>

            <PrestigePanel
              tokens={1}
              selectedSkills={prestigeSkills}
              onSelect={togglePrestige}
              onConfirm={() => { onNewGamePlus(prestigeSkills); setPrestige([]); }}
            />

            <button
              onClick={onDismissRocket}
              className="w-full mt-3 py-2.5 rounded-xl font-black text-sm"
              style={{ background: "#1a2a3a", color: "#4090c0", border: "1px solid #2060a0" }}
            >
              ∞ 無限モード継続
            </button>
          </div>
        </div>
      )}

      {/* ════════ ヘッダー ════════ */}
      <div
        className="pointer-events-auto w-full px-4 py-2.5 flex items-center justify-between gap-3"
        style={{ background: "rgba(6,6,14,0.92)", borderBottom: "1px solid rgba(40,60,120,0.5)", backdropFilter: "blur(16px)" }}
      >
        {/* ロゴ */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
            {["#63B3ED","#68D391","#F6AD55","#C084FC"].map((c, i) => (
              <div key={i} className="rounded-sm" style={{ background: c, opacity: 0.9 }}/>
            ))}
          </div>
          <span className="text-[11px] font-black tracking-[0.25em] uppercase hidden sm:block" style={{ color: "#3a4060" }}>
            MICRO-FACTORY 3D
          </span>
          {rocketLaunched && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-black" style={{ background: `${C.cyan}15`, color: C.cyan, border: `1px solid ${C.cyan}40` }}>
              ∞ NG+{ngPlusBuff.cycle}
            </span>
          )}
        </div>

        {/* 資源バッジ */}
        <div className="flex gap-1.5 overflow-x-auto">
          <ResBadge icon="💰" value={money}    label="¥"    color={C.gold}   />
          <ResBadge icon="🪨" value={stone}    label="石"   color="#A0AFBF" perSec={prodStats.stonePerSec}/>
          <ResBadge icon="🔩" value={iron}     label="鉄"   color="#63B3ED" perSec={prodStats.ironPerSec}/>
          {upgrades.nuclearUnlock && <ResBadge icon="☢️" value={uranium} label="U" color="#40cc40"/>}
          {upgrades.assemblerUnlock && <ResBadge icon="⚙" value={gear}    label="歯車" color={C.gold}/>}
          {upgrades.nuclearUnlock   && <ResBadge icon="🔋" value={fuel_rod} label="燃料棒" color={C.green}/>}
        </div>

        {/* 昼夜 */}
        <div
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black"
          style={{
            background: isDay ? "#FCD34D10" : "#818CF810",
            border: `1px solid ${isDay ? "#FCD34D30" : "#818CF830"}`,
            color: isDay ? "#FCD34D" : dayPhase === "night" ? "#818CF8" : "#F6AD55",
          }}
        >
          {isDay ? "☀" : dayPhase === "night" ? "🌙" : dayPhase === "dusk" ? "🌅" : "🌄"}
          {phaseRemain}s
        </div>
      </div>

      {/* ════════ タブナビゲーション（下部） ════════ */}
      <div className="flex-1 flex flex-col justify-end">
        {/* ── タブコンテンツ ── */}
        <div
          className="pointer-events-auto mx-3 mb-2 rounded-2xl overflow-hidden"
          style={{ background: C.bg, border: `1px solid ${C.border}`, backdropFilter: "blur(16px)", maxHeight: "55vh", overflowY: "auto" }}
        >
          {/* 電力バー（常に表示） */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(40,60,120,0.3)" }}>
            <PowerMeter
              used={state.powerUsed} generated={powerGenerated}
              battCharge={batteryCharge} battMax={batteryMax} isNight={isNight}
            />
          </div>

          {/* ══ 工場タブ ══ */}
          {tab === "factory" && (
            <div className="px-4 py-3 space-y-3">
              {/* 手動採掘 */}
              <div>
                <SectionLabel text="手動操作"/>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { fn: onMineStone, label: "石を採掘", color: "#A0AFBF", icon: "⛏" },
                    { fn: onMineIron,  label: "鉄を採掘", color: "#63B3ED", icon: "⛏" },
                    { fn: onSellStone, label: "石を売却", color: C.gold,    icon: "💰", disabled: stone <= 0 },
                    { fn: onSellIron,  label: "鉄を売却", color: C.gold,    icon: "💰", disabled: iron  <= 0 },
                  ].map(({ fn, label, color, icon, disabled }) => (
                    <button key={label} onClick={fn} disabled={disabled}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold text-sm active:scale-95 disabled:opacity-20"
                      style={{ background: "#141420", border: `1px solid ${color}40`, color }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ショップ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel text="ショップ"/>
                  {selectedShop && (
                    <button onClick={onCancelShop} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${C.red}15`, color: C.red, border: `1px solid ${C.red}30` }}>
                      ✕ ESC
                    </button>
                  )}
                </div>

                {selectedShop && (
                  <div className="mb-2 text-center text-[10px] font-bold py-1.5 rounded-lg"
                    style={{ background: `${C.green}10`, color: C.green, border: `1px solid ${C.green}20` }}>
                    ✦ 配置モード：
                    {selectedShop === "stone_drill" ? "石鉱床をタップ" :
                     selectedShop === "iron_drill"  ? "鉄鉱床をタップ" :
                     selectedShop === "uranium_drill" ? "ウラン鉱床をタップ" :
                     selectedShop === "demolish"     ? "施設をタップ（50%返金）" :
                     "空きマスをタップ"}
                  </div>
                )}

                <div className="flex gap-1 mb-1">
                  <ShopBtn item="stone_drill"  label="石ドリル"  cost={COSTS.stone_drill}   icon="⛏" accent="#A0AFBF" selected={selectedShop==="stone_drill"}  canAfford={money>=COSTS.stone_drill}  onSelect={()=>onToggleShop("stone_drill")}  sublabel="1W"/>
                  <ShopBtn item="iron_drill"   label="鉄ドリル"  cost={COSTS.iron_drill}    icon="⛏" accent="#63B3ED" selected={selectedShop==="iron_drill"}   canAfford={money>=COSTS.iron_drill}   onSelect={()=>onToggleShop("iron_drill")}   sublabel="3W"/>
                  <ShopBtn item="uranium_drill" label="U-ドリル" cost={COSTS.uranium_drill}  icon="☢️" accent="#40cc40" selected={selectedShop==="uranium_drill"} canAfford={money>=COSTS.uranium_drill} onSelect={()=>onToggleShop("uranium_drill")} sublabel="5W" locked={!upgrades.nuclearUnlock}/>
                  <ShopBtn item="belt"         label="ベルト"    cost={COSTS.belt}          icon="➡" accent="#68D391" selected={selectedShop==="belt"}         canAfford={money>=COSTS.belt}         onSelect={()=>onToggleShop("belt")}/>
                </div>
                <div className="flex gap-1 mb-1">
                  <ShopBtn item="filter"       label="フィルター" cost={COSTS.filter}       icon="⇌" accent="#a070e0" selected={selectedShop==="filter"}       canAfford={money>=COSTS.filter}       onSelect={()=>onToggleShop("filter")}      locked={!upgrades.filterUnlock}/>
                  <ShopBtn item="solar"        label="ソーラー"  cost={COSTS.solar}         icon="☀" accent="#4ade80" selected={selectedShop==="solar"}        canAfford={money>=COSTS.solar}        onSelect={()=>onToggleShop("solar")}       sublabel="+10W"/>
                  <ShopBtn item="battery"      label="蓄電池"   cost={COSTS.battery}        icon="🔋" accent="#a78bfa" selected={selectedShop==="battery"}      canAfford={money>=COSTS.battery}      onSelect={()=>onToggleShop("battery")}     sublabel="40Wh"/>
                  <ShopBtn item="assembler"    label="組立機"   cost={COSTS.assembler}      icon="⚙" accent="#e0a060" selected={selectedShop==="assembler"}    canAfford={money>=COSTS.assembler}    onSelect={()=>onToggleShop("assembler")}   sublabel="5W" locked={!upgrades.assemblerUnlock}/>
                </div>
                <div className="flex gap-1 mb-1">
                  <ShopBtn item="water_pump"   label="給水"     cost={COSTS.water_pump}     icon="💧" accent="#60c0ff" selected={selectedShop==="water_pump"}   canAfford={money>=COSTS.water_pump}   onSelect={()=>onToggleShop("water_pump")}  sublabel="2W"  locked={!upgrades.steamUnlock}/>
                  <ShopBtn item="steam_engine" label="蒸気"     cost={COSTS.steam_engine}   icon="♨" accent="#c060e0" selected={selectedShop==="steam_engine"} canAfford={money>=COSTS.steam_engine} onSelect={()=>onToggleShop("steam_engine")} sublabel="+40W" locked={!upgrades.steamUnlock}/>
                  <ShopBtn item="nuclear_plant" label="原子力"  cost={COSTS.nuclear_plant}  icon="⚛" accent="#40ff80" selected={selectedShop==="nuclear_plant"} canAfford={money>=COSTS.nuclear_plant} onSelect={()=>onToggleShop("nuclear_plant")} sublabel="+200W" locked={!upgrades.nuclearUnlock}/>
                  <ShopBtn item="waste_disposal" label="処分場" cost={COSTS.waste_disposal} icon="♻" accent="#806040" selected={selectedShop==="waste_disposal"} canAfford={money>=COSTS.waste_disposal} onSelect={()=>onToggleShop("waste_disposal")} sublabel="30W"/>
                </div>
                <div className="flex gap-1">
                  <ShopBtn item="rocket_silo"  label="サイロ"   cost={COSTS.rocket_silo}    icon="🚀" accent={C.cyan}   selected={selectedShop==="rocket_silo"}  canAfford={money>=COSTS.rocket_silo}  onSelect={()=>onToggleShop("rocket_silo")}  locked={!upgrades.rocketSilo}/>
                  <ShopBtn item="demolish"     label="解体"     cost={null}                 icon="🗑" accent={C.red}    selected={selectedShop==="demolish"}     canAfford={true}                      onSelect={()=>onToggleShop("demolish")}    sublabel="50%返"/>
                  {upgrades.moduleUnlock && <>
                    <ShopBtn item="module_speed" label="SPD" cost={COSTS.module_speed} icon="⚡" accent="#60d0a0" selected={selectedShop==="module_speed"} canAfford={money>=COSTS.module_speed} onSelect={()=>onToggleShop("module_speed")} sublabel={`在庫${moduleInventory.speed}`}/>
                    <ShopBtn item="module_production" label="PRD" cost={COSTS.module_production} icon="📈" accent="#c060f0" selected={selectedShop==="module_production"} canAfford={money>=COSTS.module_production} onSelect={()=>onToggleShop("module_production")} sublabel={`在庫${moduleInventory.production}`}/>
                  </>}
                </div>
              </div>
            </div>
          )}

          {/* ══ 研究タブ ══ */}
          {tab === "research" && (
            <div className="px-4 py-3 space-y-2">
              {(Object.keys(UPGRADE_LABELS) as (keyof Upgrades)[]).map(key => {
                const icons: Record<string, string> = {
                  efficientPickaxe:"⛏",turbodrillBoost:"🚀",fastBelt:"⚡",largeBattery:"🔋",
                  assemblerUnlock:"⚙",filterUnlock:"⇌",steamUnlock:"♨",nuclearUnlock:"⚛",
                  moduleUnlock:"🔧",expansion7x7:"🗺",expansion9x9:"🌍",rocketSilo:"🚀",spaceElevator:"🛸",
                };
                const accents: Record<string, string> = {
                  efficientPickaxe:C.gold,turbodrillBoost:C.purple,fastBelt:C.green,
                  largeBattery:"#a78bfa",assemblerUnlock:"#e0a060",filterUnlock:"#a070e0",
                  steamUnlock:"#c060e0",nuclearUnlock:"#40ff80",moduleUnlock:"#60d0a0",
                  expansion7x7:C.green,expansion9x9:C.orange,rocketSilo:C.cyan,spaceElevator:C.cyan,
                };
                return (
                  <UpgradeCard
                    key={key}
                    upgradeKey={key}
                    state={state}
                    onBuy={() => onBuyUpgrade(key)}
                    icon={icons[key] ?? "🔬"}
                    accent={accents[key] ?? C.accent}
                  />
                );
              })}
            </div>
          )}

          {/* ══ 統計タブ ══ */}
          {tab === "stats" && (
            <div className="px-4 py-3 space-y-3">
              <SectionLabel text="リアルタイム生産（直近10秒）"/>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:"石 生産/s",    data:statsHistory.map(s=>s.stoneIn),     color:"#A0AFBF", total:totalStonesShipped },
                  { label:"鉄 生産/s",    data:statsHistory.map(s=>s.ironIn),      color:"#63B3ED", total:totalIronShipped },
                  { label:"収入/s",       data:statsHistory.map(s=>s.income),      color:C.gold },
                  { label:"歯車出荷/s",   data:statsHistory.map(s=>s.gearShipped), color:C.gold,    total:totalGearsShipped },
                  { label:"燃料棒出荷/s", data:statsHistory.map(s=>s.fuelShipped), color:C.green,   total:totalFuelShipped },
                  { label:"廃棄物/s",     data:statsHistory.map(s=>s.wasteShipped),color:"#80ff40" },
                ].map(({ label, data, color, total }) => {
                  const avg = data.length ? (data.reduce((a,b)=>a+b,0)/data.length).toFixed(2) : "0";
                  return (
                    <div key={label} className="rounded-xl px-2.5 py-2"
                      style={{ background: "#101018", border: `1px solid ${color}20` }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px]" style={{ color:"#555" }}>{label}</span>
                        <span className="text-[10px] font-black tabular-nums" style={{ color }}>{avg}/s</span>
                      </div>
                      <Sparkline data={data} color={color}/>
                      {total !== undefined && (
                        <div className="text-[8px] tabular-nums mt-1" style={{ color:"#333" }}>累計: {fmt(total)}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 設備カウント */}
              <div className="rounded-xl px-3 py-2.5" style={{ background:"#101018", border:"1px solid #1e2a3a" }}>
                <SectionLabel text="設備一覧"/>
                <div className="grid grid-cols-2 gap-y-1.5">
                  {[
                    { l:"石ドリル",    v:prodStats.stoneDrillCnt,   c:"#A0AFBF" },
                    { l:"鉄ドリル",    v:prodStats.ironDrillCnt,    c:"#63B3ED" },
                    { l:"Uドリル",     v:prodStats.uraniumDrillCnt, c:"#40cc40" },
                    { l:"ベルト",      v:prodStats.beltCnt,         c:C.green   },
                    { l:"組立機",      v:prodStats.assemblerCnt,    c:"#e0a060" },
                    { l:"ソーラー",    v:prodStats.solarCnt,        c:"#4ade80" },
                    { l:"蓄電池",      v:prodStats.batteryCnt,      c:"#a78bfa" },
                    { l:"蒸気機関",    v:prodStats.steamEngineCnt,  c:"#c060e0" },
                    { l:"原子力",      v:prodStats.nuclearPlantCnt, c:"#40ff80" },
                    { l:"廃棄物処分場",v:prodStats.wasteDisposalCnt,c:"#806040" },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span style={{ color:"#445" }}>{l}</span>
                      <span className="font-bold tabular-nums" style={{ color: v>0?c:"#2a2a38" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop:"1px solid #1e2a3a" }}>
                  <span style={{ color:"#445" }}>電力効率</span>
                  <span className="font-bold" style={{ color: prodStats.efficiency>=1?C.green:C.red }}>
                    {Math.round(prodStats.efficiency*100)}%
                  </span>
                </div>
              </div>

              {/* NGPバフ */}
              {ngPlusBuff.cycle > 0 && (
                <div className="rounded-xl px-3 py-2.5" style={{ background:"#0a1a10", border:"1px solid #1a5030" }}>
                  <SectionLabel text={`👽 エイリアン技術（${ngPlusBuff.cycle}周目）`} color="#2a8040"/>
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <span style={{ color:"#446" }}>速度</span>
                    <span className="font-bold" style={{ color:C.green }}>×{ngPlusBuff.speedMultiplier.toFixed(1)}</span>
                    <span style={{ color:"#446" }}>生産量</span>
                    <span className="font-bold" style={{ color:C.green }}>×{ngPlusBuff.productionMultiplier.toFixed(2)}</span>
                    <span style={{ color:"#446" }}>廃棄物軽減</span>
                    <span className="font-bold" style={{ color:C.green }}>-{Math.round(ngPlusBuff.wasteReduction*100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ 宇宙貿易タブ ══ */}
          {tab === "trade" && (
            <div className="px-4 py-3 space-y-3">
              <SectionLabel text="🛸 宇宙貿易マイルストーン"/>
              {milestones.map(m => (
                <MilestoneCard
                  key={m.id}
                  milestone={m}
                  progress={{
                    gear:     totalGearsShipped,
                    fuel_rod: totalFuelShipped,
                    iron:     totalIronShipped,
                    stone:    totalStonesShipped,
                    uranium:  state.totalUraniumShipped,
                  }}
                />
              ))}

              {/* ロケット進捗 */}
              {upgrades.rocketSilo && (
                <div className="rounded-xl px-3 py-2.5" style={{ background:"#0a1420", border:"1px solid #1a4060" }}>
                  <SectionLabel text="🚀 ロケット打ち上げ進捗"/>
                  {[
                    { l:"資金",     cur:Math.floor(money),  req:ROCKET_REQUIREMENTS.money,    c:C.gold,  pre:"¥" },
                    { l:"歯車出荷", cur:totalGearsShipped,  req:ROCKET_REQUIREMENTS.gear,     c:C.gold },
                    { l:"燃料棒出荷",cur:totalFuelShipped,  req:ROCKET_REQUIREMENTS.fuel_rod, c:C.green },
                  ].map(({ l, cur, req, c, pre }) => {
                    const pct = Math.min(100, cur/req*100);
                    return (
                      <div key={l} className="mb-2">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px]" style={{ color:"#446" }}>{l}</span>
                          <span className="text-[10px] tabular-nums" style={{ color: pct>=100?c:"#446" }}>
                            {pre??""}{fmt(cur)}/{pre??""}{fmt(req)}{pct>=100&&" ✓"}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"#111a2a" }}>
                          <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${c}60,${c})` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── タブバー ── */}
        <div
          className="pointer-events-auto mx-3 mb-3 flex rounded-2xl overflow-hidden"
          style={{ background: C.bg, border: `1px solid ${C.border}`, backdropFilter: "blur(16px)" }}
        >
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-black transition-all duration-200"
              style={{
                background:   tab === id ? "rgba(40,80,160,0.3)" : "transparent",
                color:        tab === id ? C.cyan : "#2a3a5a",
                borderBottom: tab === id ? `2px solid ${C.cyan}` : "2px solid transparent",
                boxShadow:    tab === id ? `inset 0 -1px 8px ${C.cyan}20` : "none",
              }}
            >
              <span>{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
