// ════════════════════════════════════════════════════════════════════
//  components/ControlPanel.tsx — 右側30%操作パネル
// ════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { GameState, ShopItem, Upgrades, ProdStats } from "../types";
import {
  COSTS, UPGRADE_COSTS, UPGRADE_LABELS, UPGRADE_DESC,
  INITIAL_MILESTONES, PRESTIGE_SKILLS, ROCKET_REQUIREMENTS,
} from "../constants";
import { fmt } from "../utils/gameLogic";

const C = {
  bg: "rgba(6,8,18,0.97)", surface: "rgba(12,14,26,0.98)",
  border: "rgba(30,50,100,0.7)", accent: "#4a90e0",
  green: "#4ade80", purple: "#c084fc", gold: "#f5c842",
  red: "#fc8181", cyan: "#60d0ff", orange: "#fb923c",
};

const ResBadge: React.FC<{ icon: string; value: number; label: string; color: string; perSec?: number }> = ({ icon, value, label, color, perSec }) => (
  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg flex-1" style={{ background: `${color}10`, border: `1px solid ${color}28` }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <div className="min-w-0">
      <div className="text-sm font-black tabular-nums leading-none" style={{ color, fontFamily: "monospace" }}>{fmt(value)}</div>
      <div className="text-[9px] mt-0.5" style={{ color: `${color}70` }}>{label}{perSec !== undefined && perSec > 0 ? ` +${perSec}/s` : ""}</div>
    </div>
  </div>
);

const PowerMeter: React.FC<{ used: number; generated: number; battCharge: number; battMax: number; isNight: boolean }> = ({ used, generated, battCharge, battMax, isNight }) => {
  const over = used > generated;
  const ratio = generated <= 0 ? 0 : Math.min(1, used / generated);
  const col = over ? C.red : ratio > 0.85 ? C.orange : C.green;
  const bRatio = battMax <= 0 ? 0 : Math.min(1, battCharge / battMax);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#445" }}>⚡ POWER</span>
        <span className="text-[10px] font-black tabular-nums" style={{ color: col }}>{used}W / {generated}W{over ? " ⚠ OVERLOAD" : ""}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a2a" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, ratio * 100)}%`, background: `linear-gradient(90deg,${col}80,${col})`, boxShadow: `0 0 6px ${col}60` }}/>
      </div>
      {battMax > 0 && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#445" }}>🔋 BATTERY</span>
            <span className="text-[10px] tabular-nums" style={{ color: "#a78bfa" }}>{Math.floor(battCharge)}Wh/{battMax}Wh {isNight ? "放電中" : "充電中"}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a1a2a" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${bRatio * 100}%`, background: "linear-gradient(90deg,#6d28d9,#a78bfa)" }}/>
          </div>
        </>
      )}
    </div>
  );
};

const ShopBtn: React.FC<{ item: ShopItem; label: string; cost: number | null; icon: string; accent: string; selected: boolean; canAfford: boolean; onSelect: () => void; sublabel?: string; locked?: boolean }> = ({ item, label, cost, icon, accent, selected, canAfford, onSelect, sublabel, locked = false }) => (
  <button onClick={onSelect} disabled={locked}
    className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 transition-all duration-150 relative"
    style={{ background: selected ? `${accent}22` : locked ? "#080810" : canAfford ? "#0e1020" : "#0a0a16", border: `1px solid ${selected ? accent : locked ? "#141420" : canAfford ? accent + "48" : "#181828"}`, color: selected ? accent : locked ? "#282838" : canAfford ? accent : "#2a2a3a", transform: selected ? "scale(0.96)" : "scale(1)", boxShadow: selected ? `0 0 10px ${accent}45` : "none", opacity: locked ? 0.4 : 1, flex: "1 1 0", minWidth: 0 }}>
    {locked && <div className="absolute top-0.5 right-0.5 text-[8px]" style={{ color: "#333" }}>🔒</div>}
    <span style={{ fontSize: 13, opacity: locked ? 0.3 : 1 }}>{icon}</span>
    <span className="text-[8px] font-bold leading-none text-center" style={{ opacity: locked ? 0.3 : 1 }}>{label}</span>
    {cost !== null && <span className="text-[8px] tabular-nums" style={{ color: canAfford && !locked ? accent + "80" : "#222" }}>{cost}¥</span>}
    {sublabel && <span className="text-[7px]" style={{ color: "#2a2a3a" }}>{sublabel}</span>}
  </button>
);

const UpgradeCard: React.FC<{ upgradeKey: keyof Upgrades; state: GameState; onBuy: () => void; icon: string; accent: string }> = ({ upgradeKey, state, onBuy, icon, accent }) => {
  const cost = UPGRADE_COSTS[upgradeKey];
  const done = state.upgrades[upgradeKey];
  const locked = !!(cost.requiresUpgrade && !state.upgrades[cost.requiresUpgrade]);
  const canAfford = !locked && state.money >= cost.money && (!cost.stone || state.stone >= cost.stone) && (!cost.iron || state.iron >= cost.iron) && (!cost.gear || state.totalGearsShipped >= cost.gear) && (!cost.fuel_rod || state.totalFuelShipped >= (cost.fuel_rod ?? 0));
  return (
    <div className="rounded-xl px-2.5 py-2.5" style={{ background: done ? `${accent}10` : locked ? "#070710" : "#0d0d1c", border: `1px solid ${done ? accent + "45" : locked ? "#141420" : "#1e2035"}`, opacity: locked ? 0.55 : 1 }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: done ? `${accent}18` : "#0a0a18", border: `1px solid ${done ? accent + "38" : "#181828"}` }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold" style={{ color: done ? accent : locked ? "#2a2a38" : "#bbb" }}>{UPGRADE_LABELS[upgradeKey]}</span>
            {done && <span className="text-[8px] px-1 rounded" style={{ background: `${accent}18`, color: accent }}>✓</span>}
            {locked && cost.requiresUpgrade && <span className="text-[8px]" style={{ color: "#333" }}>🔒{UPGRADE_LABELS[cost.requiresUpgrade]}</span>}
          </div>
          <p className="text-[9px] mt-0.5" style={{ color: "#3a3a50" }}>{UPGRADE_DESC[upgradeKey]}</p>
          {!done && !locked && (
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: `${cost.money}¥`, met: state.money >= cost.money, col: C.gold },
                cost.stone    && { label: `石×${cost.stone}`,    met: state.stone >= cost.stone,                     col: "#A0AFBF" },
                cost.iron     && { label: `鉄×${cost.iron}`,     met: state.iron  >= cost.iron,                      col: "#63B3ED" },
                cost.gear     && { label: `歯×${cost.gear}`,     met: state.totalGearsShipped >= cost.gear,           col: C.gold   },
                cost.fuel_rod && { label: `燃×${cost.fuel_rod}`, met: state.totalFuelShipped  >= (cost.fuel_rod ?? 0), col: C.green  },
              ].filter(Boolean).map((chip: any) => (
                <span key={chip.label} className="text-[8px] px-1 py-0.5 rounded" style={{ background: chip.met ? `${chip.col}12` : "#0a0a16", border: `1px solid ${chip.met ? chip.col + "38" : "#181828"}`, color: chip.met ? chip.col : "#2a2a38" }}>
                  {chip.met ? "✓" : ""}{chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {!done && !locked && (
        <button onClick={onBuy} disabled={!canAfford} className="w-full mt-2 py-1.5 rounded-lg text-[11px] font-black transition-all"
          style={{ background: canAfford ? `${accent}18` : "#080810", border: `1px solid ${canAfford ? accent : "#141420"}`, color: canAfford ? accent : "#222", cursor: canAfford ? "pointer" : "not-allowed" }}>
          {canAfford ? "▶ 研究する" : "素材不足"}
        </button>
      )}
    </div>
  );
};

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return <svg width={90} height={22}><line x1="0" y1="11" x2="90" y2="11" stroke={color + "28"} strokeWidth="1" strokeDasharray="3 3"/></svg>;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 90},${22 - (v / max) * 18 - 2}`).join(" ");
  const lx = 90, ly = 22 - (data[data.length - 1] / max) * 18 - 2;
  return (
    <svg width={90} height={22} style={{ overflow: "visible" }}>
      <polyline points={`0,22 ${pts} 90,22`} fill={color + "18"}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}/>
    </svg>
  );
};

const MilestoneCard: React.FC<{ milestone: typeof INITIAL_MILESTONES[number]; totalGearsShipped: number; totalFuelShipped: number; totalIronShipped: number; totalStonesShipped: number; totalUraniumShipped: number }> = ({ milestone, totalGearsShipped, totalFuelShipped, totalIronShipped, totalStonesShipped, totalUraniumShipped }) => {
  const shipped: Partial<Record<string, number>> = { gear: totalGearsShipped, fuel_rod: totalFuelShipped, iron: totalIronShipped, stone: totalStonesShipped, uranium: totalUraniumShipped };
  const pct = Math.min(100, Object.entries(milestone.requires).reduce((acc, [item, need]) => acc + Math.min(1, (shipped[item] ?? 0) / (need as number)), 0) / Object.keys(milestone.requires).length * 100);
  return (
    <div className="rounded-xl px-2.5 py-2" style={{ background: milestone.completed ? "#0a1a0a" : "#0a0a14", border: `1px solid ${milestone.completed ? "#2a6a2a" : "#141428"}` }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-bold" style={{ color: milestone.completed ? C.green : "#5060a0" }}>{milestone.completed ? "✓ " : ""}{milestone.label}</span>
        <span className="text-[9px] tabular-nums" style={{ color: milestone.completed ? C.green : "#384" }}>{Math.floor(pct)}%</span>
      </div>
      <p className="text-[9px] mb-1" style={{ color: "#334" }}>{milestone.description}</p>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#0e0e20" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: milestone.completed ? "linear-gradient(90deg,#2a8a2a,#4ade80)" : "linear-gradient(90deg,#1a4a8a,#4090d0)" }}/>
      </div>
      <div className="mt-0.5 text-[8px]" style={{ color: "#1a2a4a" }}>報酬: <span style={{ color: C.cyan }}>{milestone.rewardLabel}</span></div>
    </div>
  );
};

const PrestigePanel: React.FC<{ selected: string[]; onSelect: (id: string) => void; onConfirm: () => void }> = ({ selected, onSelect, onConfirm }) => (
  <div className="space-y-2">
    <div className="text-center">
      <div className="text-xs font-black" style={{ color: C.cyan }}>👽 銀河開拓パス</div>
      <div className="text-[9px] mt-0.5" style={{ color: "#334" }}>特権を1つ選んで次の周回へ</div>
    </div>
    {PRESTIGE_SKILLS.map(skill => {
      const sel = selected.includes(skill.id);
      return (
        <button key={skill.id} onClick={() => onSelect(skill.id)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
          style={{ background: sel ? `${C.cyan}12` : "#0a0a16", border: `1px solid ${sel ? C.cyan : "#141428"}`, boxShadow: sel ? `0 0 8px ${C.cyan}28` : "none" }}>
          <span style={{ fontSize: 16 }}>{skill.icon}</span>
          <div>
            <div className="text-[11px] font-bold" style={{ color: sel ? C.cyan : "#5060a0" }}>{skill.label}</div>
            <div className="text-[9px]" style={{ color: "#334" }}>{skill.description}</div>
          </div>
          {sel && <div className="ml-auto text-[9px] font-black" style={{ color: C.cyan }}>✓</div>}
        </button>
      );
    })}
    {selected.length > 0 && (
      <button onClick={onConfirm} className="w-full py-2.5 rounded-xl font-black text-[11px]"
        style={{ background: "linear-gradient(135deg,#0a3040,#1a6080)", color: C.cyan, border: `1px solid ${C.cyan}45`, boxShadow: `0 0 14px ${C.cyan}28` }}>
        👽 特権を引き継いで新周回へ
      </button>
    )}
  </div>
);

const RocketClearModal: React.FC<{ state: GameState; onDismiss: () => void; onNewGamePlus: (skills: string[]) => void }> = ({ state, onDismiss, onNewGamePlus }) => {
  const [skills, setSkills] = useState<string[]>([]);
  const toggle = (id: string) => setSkills(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,10,0.92)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-xs rounded-3xl px-5 py-6 overflow-y-auto max-h-full"
        style={{ background: "linear-gradient(135deg,#040c1c,#060818)", border: "1px solid #2060a0", boxShadow: "0 0 60px #2060a050" }}>
        <div className="text-5xl text-center mb-3" style={{ animation: "rocketUp 0.8s ease-out" }}>🚀</div>
        <h1 className="text-xl font-black text-center mb-1" style={{ color: C.cyan, letterSpacing: "0.08em" }}>MISSION COMPLETE</h1>
        <p className="text-[10px] text-center mb-4" style={{ color: "#334" }}>軌道エレベーター打ち上げ成功</p>
        <div className="rounded-xl px-3 py-2.5 mb-4 space-y-1" style={{ background: "#040c18", border: "1px solid #1a3060" }}>
          {[
            { l: "歯車出荷", v: `${state.totalGearsShipped}`, c: C.gold },
            { l: "燃料棒",   v: `${state.totalFuelShipped}`,  c: C.green },
            { l: "資金",     v: `¥${fmt(state.money)}`,       c: C.gold },
            { l: "周回",     v: `${state.ngPlusBuff.cycle + 1}周目`, c: C.cyan },
          ].map(({ l, v, c }) => (
            <div key={l} className="flex justify-between text-[10px]">
              <span style={{ color: "#334" }}>{l}</span>
              <span className="font-bold tabular-nums" style={{ color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <PrestigePanel selected={skills} onSelect={toggle} onConfirm={() => { onNewGamePlus(skills); setSkills([]); }}/>
        <button onClick={onDismiss} className="w-full mt-3 py-2 rounded-xl font-black text-[11px]"
          style={{ background: "#0e1a2a", color: "#4090c0", border: "1px solid #1a4060" }}>
          ∞ 無限モード継続
        </button>
      </div>
    </div>
  );
};

interface Props {
  state: GameState; selectedShop: ShopItem | null; prodStats: ProdStats;
  powerGenerated: number; phaseRemain: number; showRocketClear: boolean;
  onToggleShop: (item: ShopItem) => void; onCancelShop: () => void;
  onMineStone: () => void; onMineIron: () => void;
  onSellStone: () => void; onSellIron: () => void;
  onBuyUpgrade: (key: keyof Upgrades) => void;
  onNewGamePlus: (skills: string[]) => void; onDismissRocket: () => void;
}

export const ControlPanel: React.FC<Props> = ({
  state, selectedShop, prodStats, powerGenerated, phaseRemain,
  showRocketClear, onToggleShop, onCancelShop, onMineStone, onMineIron,
  onSellStone, onSellIron, onBuyUpgrade, onNewGamePlus, onDismissRocket,
}) => {
  const [tab, setTab] = useState<"shop" | "research" | "stats" | "trade">("shop");
  const { money, stone, iron, uranium, gear, fuel_rod, dayPhase, batteryCharge, batteryMax, upgrades, milestones, statsHistory, totalGearsShipped, totalFuelShipped, totalIronShipped, totalStonesShipped, totalUraniumShipped, moduleInventory, ngPlusBuff, rocketLaunched } = state;
  const isNight = dayPhase === "night";

  const upgradeIcons: Record<keyof Upgrades, string> = { efficientPickaxe:"⛏",turbodrillBoost:"🚀",fastBelt:"⚡",largeBattery:"🔋",assemblerUnlock:"⚙",filterUnlock:"⇌",steamUnlock:"♨",nuclearUnlock:"⚛",moduleUnlock:"🔧",expansion7x7:"🗺",expansion9x9:"🌍",rocketSilo:"🚀",spaceElevator:"🛸" };
  const upgradeAccents: Record<keyof Upgrades, string> = { efficientPickaxe:C.gold,turbodrillBoost:C.purple,fastBelt:C.green,largeBattery:"#a78bfa",assemblerUnlock:"#e0a060",filterUnlock:"#a070e0",steamUnlock:"#c060e0",nuclearUnlock:"#40ff80",moduleUnlock:"#60d0a0",expansion7x7:C.green,expansion9x9:C.orange,rocketSilo:C.cyan,spaceElevator:C.cyan };

  const TABS = [
    { id: "shop",     icon: "🏪", label: "工場" },
    { id: "research", icon: "🔬", label: "研究" },
    { id: "stats",    icon: "📊", label: "統計" },
    { id: "trade",    icon: "🛸", label: "宇宙" },
  ] as const;

  return (
    <div className="relative h-full flex flex-col overflow-hidden" style={{ background: C.bg, borderLeft: `1px solid ${C.border}` }}>
      {showRocketClear && <RocketClearModal state={state} onDismiss={onDismissRocket} onNewGamePlus={onNewGamePlus}/>}

      {/* ヘッダー */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              {["#63B3ED","#68D391","#F6AD55","#C084FC"].map((c, i) => <div key={i} className="rounded-sm" style={{ background: c, opacity: 0.9 }}/>)}
            </div>
            <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "#2a3050" }}>MF-3D</span>
            {rocketLaunched && <span className="text-[8px] px-1 py-0.5 rounded font-black" style={{ background: `${C.cyan}12`, color: C.cyan, border: `1px solid ${C.cyan}38` }}>∞ NG+{ngPlusBuff.cycle}</span>}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black"
            style={{ background: isNight ? "#818CF810" : "#FCD34D10", border: `1px solid ${isNight ? "#818CF828" : "#FCD34D28"}`, color: isNight ? "#818CF8" : dayPhase === "dusk" ? "#F6AD55" : "#FCD34D" }}>
            {dayPhase === "day" ? "☀" : dayPhase === "night" ? "🌙" : dayPhase === "dusk" ? "🌅" : "🌄"} {phaseRemain}s
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ fontSize: 16 }}>💰</span>
          <span className="text-xl font-black tabular-nums" style={{ color: C.gold, fontFamily: "monospace" }}>{fmt(money)}</span>
          <span className="text-[9px] font-bold" style={{ color: C.gold + "60" }}>¥</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          <ResBadge icon="🪨" value={stone}   label="石" color="#A0AFBF" perSec={prodStats.stonePerSec}/>
          <ResBadge icon="🔩" value={iron}    label="鉄" color="#63B3ED" perSec={prodStats.ironPerSec}/>
          {upgrades.nuclearUnlock && <ResBadge icon="☢️" value={uranium} label="U" color="#40cc40"/>}
        </div>
        {upgrades.assemblerUnlock && (
          <div className="flex gap-1 mt-1 flex-wrap">
            <ResBadge icon="⚙" value={gear}     label="歯車"  color={C.gold}/>
            {upgrades.nuclearUnlock && <ResBadge icon="🔋" value={fuel_rod} label="燃料棒" color={C.green}/>}
          </div>
        )}
        <div className="mt-2">
          <PowerMeter used={state.powerUsed} generated={powerGenerated} battCharge={batteryCharge} battMax={batteryMax} isNight={isNight}/>
        </div>
      </div>

      {/* タブバー */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-black transition-all"
            style={{ background: tab === id ? "rgba(30,60,130,0.3)" : "transparent", color: tab === id ? C.cyan : "#2a3060", borderBottom: tab === id ? `2px solid ${C.cyan}` : "2px solid transparent" }}>
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* 工場タブ */}
        {tab === "shop" && (
          <div className="px-3 py-3 space-y-3">
            <div>
              <div className="text-[9px] font-black tracking-[0.2em] uppercase mb-1.5" style={{ color: "#2a3050" }}>手動操作</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { fn: onMineStone, label: "石を採掘", c: "#A0AFBF" },
                  { fn: onMineIron,  label: "鉄を採掘", c: "#63B3ED" },
                  { fn: onSellStone, label: "石を売却", c: C.gold, disabled: stone <= 0 },
                  { fn: onSellIron,  label: "鉄を売却", c: C.gold, disabled: iron  <= 0 },
                ].map(({ fn, label, c, disabled }) => (
                  <button key={label} onClick={fn} disabled={disabled}
                    className="flex items-center justify-center gap-1 rounded-xl py-2 font-bold text-[11px] active:scale-95 disabled:opacity-20"
                    style={{ background: "#0a0a16", border: `1px solid ${c}38`, color: c }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "#2a3050" }}>ショップ</div>
                {selectedShop && <button onClick={onCancelShop} className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${C.red}12`, color: C.red, border: `1px solid ${C.red}28` }}>✕ ESC</button>}
              </div>
              {selectedShop && (
                <div className="mb-2 text-center text-[9px] font-bold py-1 rounded-lg" style={{ background: `${C.green}0c`, color: C.green, border: `1px solid ${C.green}18` }}>
                  {selectedShop === "demolish" ? "✕ 施設タップで解体（50%返金）" : selectedShop === "stone_drill" ? "✦ 石鉱床をタップ" : selectedShop === "iron_drill" ? "✦ 鉄鉱床をタップ" : selectedShop === "uranium_drill" ? "✦ ウラン鉱床をタップ" : "✦ 空きマスをタップして設置"}
                </div>
              )}
              <div className="flex gap-1 mb-1">
                <ShopBtn item="stone_drill"  label="石ドリル" cost={COSTS.stone_drill}  icon="⛏" accent="#A0AFBF" selected={selectedShop==="stone_drill"}  canAfford={money>=COSTS.stone_drill}  onSelect={()=>onToggleShop("stone_drill")}  sublabel="1W"/>
                <ShopBtn item="iron_drill"   label="鉄ドリル" cost={COSTS.iron_drill}   icon="⛏" accent="#63B3ED" selected={selectedShop==="iron_drill"}   canAfford={money>=COSTS.iron_drill}   onSelect={()=>onToggleShop("iron_drill")}   sublabel="3W"/>
                <ShopBtn item="uranium_drill" label="Uドリル" cost={COSTS.uranium_drill} icon="☢️" accent="#40cc40" selected={selectedShop==="uranium_drill"} canAfford={money>=COSTS.uranium_drill} onSelect={()=>onToggleShop("uranium_drill")} sublabel="5W" locked={!upgrades.nuclearUnlock}/>
                <ShopBtn item="belt"         label="ベルト"   cost={COSTS.belt}         icon="➡" accent="#68D391" selected={selectedShop==="belt"}         canAfford={money>=COSTS.belt}         onSelect={()=>onToggleShop("belt")}/>
              </div>
              <div className="flex gap-1 mb-1">
                <ShopBtn item="filter"       label="分配器"  cost={COSTS.filter}        icon="⇌" accent="#a070e0" selected={selectedShop==="filter"}       canAfford={money>=COSTS.filter}       onSelect={()=>onToggleShop("filter")}      locked={!upgrades.filterUnlock}/>
                <ShopBtn item="solar"        label="ソーラー" cost={COSTS.solar}        icon="☀" accent="#4ade80" selected={selectedShop==="solar"}        canAfford={money>=COSTS.solar}        onSelect={()=>onToggleShop("solar")}       sublabel="+10W"/>
                <ShopBtn item="battery"      label="蓄電池"  cost={COSTS.battery}       icon="🔋" accent="#a78bfa" selected={selectedShop==="battery"}      canAfford={money>=COSTS.battery}      onSelect={()=>onToggleShop("battery")}     sublabel="40Wh"/>
                <ShopBtn item="assembler"    label="組立機"  cost={COSTS.assembler}     icon="⚙" accent="#e0a060" selected={selectedShop==="assembler"}    canAfford={money>=COSTS.assembler}    onSelect={()=>onToggleShop("assembler")}   sublabel="5W" locked={!upgrades.assemblerUnlock}/>
              </div>
              <div className="flex gap-1 mb-1">
                <ShopBtn item="water_pump"    label="給水"   cost={COSTS.water_pump}    icon="💧" accent="#60c0ff" selected={selectedShop==="water_pump"}   canAfford={money>=COSTS.water_pump}   onSelect={()=>onToggleShop("water_pump")}  sublabel="2W"   locked={!upgrades.steamUnlock}/>
                <ShopBtn item="steam_engine"  label="蒸気"  cost={COSTS.steam_engine}   icon="♨" accent="#c060e0" selected={selectedShop==="steam_engine"} canAfford={money>=COSTS.steam_engine} onSelect={()=>onToggleShop("steam_engine")} sublabel="+40W" locked={!upgrades.steamUnlock}/>
                <ShopBtn item="nuclear_plant" label="原子力" cost={COSTS.nuclear_plant} icon="⚛" accent="#40ff80" selected={selectedShop==="nuclear_plant"} canAfford={money>=COSTS.nuclear_plant} onSelect={()=>onToggleShop("nuclear_plant")} sublabel="+200W" locked={!upgrades.nuclearUnlock}/>
                <ShopBtn item="waste_disposal" label="処分場" cost={COSTS.waste_disposal} icon="♻" accent="#806040" selected={selectedShop==="waste_disposal"} canAfford={money>=COSTS.waste_disposal} onSelect={()=>onToggleShop("waste_disposal")} sublabel="30W"/>
              </div>
              <div className="flex gap-1">
                <ShopBtn item="rocket_silo" label="サイロ" cost={COSTS.rocket_silo} icon="🚀" accent={C.cyan}  selected={selectedShop==="rocket_silo"}  canAfford={money>=COSTS.rocket_silo}  onSelect={()=>onToggleShop("rocket_silo")}  locked={!upgrades.rocketSilo}/>
                <ShopBtn item="demolish"    label="解体"  cost={null}              icon="🗑" accent={C.red}   selected={selectedShop==="demolish"}     canAfford={true}                      onSelect={()=>onToggleShop("demolish")}    sublabel="50%返"/>
                {upgrades.moduleUnlock && <>
                  <ShopBtn item="module_speed"      label="SPD" cost={COSTS.module_speed}      icon="⚡" accent="#60d0a0" selected={selectedShop==="module_speed"}      canAfford={money>=COSTS.module_speed}      onSelect={()=>onToggleShop("module_speed")}      sublabel={`在${moduleInventory.speed}`}/>
                  <ShopBtn item="module_production" label="PRD" cost={COSTS.module_production} icon="📈" accent="#c060f0" selected={selectedShop==="module_production"} canAfford={money>=COSTS.module_production} onSelect={()=>onToggleShop("module_production")} sublabel={`在${moduleInventory.production}`}/>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* 研究タブ */}
        {tab === "research" && (
          <div className="px-3 py-3 space-y-2">
            {(Object.keys(upgradeIcons) as (keyof Upgrades)[]).map(key => (
              <UpgradeCard key={key} upgradeKey={key} state={state} onBuy={() => onBuyUpgrade(key)} icon={upgradeIcons[key]} accent={upgradeAccents[key]}/>
            ))}
            {ngPlusBuff.cycle > 0 && (
              <div className="rounded-xl px-2.5 py-2" style={{ background: "#0a1610", border: "1px solid #1a5030" }}>
                <div className="text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: "#2a7040" }}>👽 NG+{ngPlusBuff.cycle} バフ</div>
                <div className="grid grid-cols-2 gap-y-1 text-[10px]">
                  <span style={{ color: "#334" }}>速度</span><span className="font-bold" style={{ color: C.green }}>×{ngPlusBuff.speedMultiplier.toFixed(1)}</span>
                  <span style={{ color: "#334" }}>生産量</span><span className="font-bold" style={{ color: C.green }}>×{ngPlusBuff.productionMultiplier.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 統計タブ */}
        {tab === "stats" && (
          <div className="px-3 py-3 space-y-2.5">
            <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "#2a3050" }}>リアルタイム生産（直近10秒）</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label:"石/s",     data:statsHistory.map((s:any)=>s.stoneIn),      color:"#A0AFBF", total:totalStonesShipped },
                { label:"鉄/s",     data:statsHistory.map((s:any)=>s.ironIn),       color:"#63B3ED", total:totalIronShipped   },
                { label:"収入/s",   data:statsHistory.map((s:any)=>s.income),       color:C.gold                              },
                { label:"歯車/s",   data:statsHistory.map((s:any)=>s.gearShipped),  color:C.gold,    total:totalGearsShipped  },
                { label:"燃料棒/s", data:statsHistory.map((s:any)=>s.fuelShipped),  color:C.green,   total:totalFuelShipped   },
                { label:"廃棄物/s", data:statsHistory.map((s:any)=>s.wasteShipped), color:"#80ff40"                           },
              ].map(({ label, data, color, total }) => {
                const avg = data.length ? (data.reduce((a: number, b: number) => a + b, 0) / data.length).toFixed(2) : "0";
                return (
                  <div key={label} className="rounded-xl px-2 py-1.5" style={{ background: "#0a0a16", border: `1px solid ${color}18` }}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px]" style={{ color: "#445" }}>{label}</span>
                      <span className="text-[9px] font-black tabular-nums" style={{ color }}>{avg}</span>
                    </div>
                    <Sparkline data={data} color={color}/>
                    {total !== undefined && <div className="text-[7px] tabular-nums mt-0.5" style={{ color: "#2a2a38" }}>累計: {fmt(total)}</div>}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl px-2.5 py-2" style={{ background: "#0a0a16", border: "1px solid #141428" }}>
              <div className="text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: "#2a3050" }}>設備一覧</div>
              <div className="grid grid-cols-2 gap-y-1">
                {[
                  { l:"石ドリル",v:prodStats.stoneDrillCnt,c:"#A0AFBF"},{l:"鉄ドリル",v:prodStats.ironDrillCnt,c:"#63B3ED"},
                  { l:"Uドリル",v:prodStats.uraniumDrillCnt,c:"#40cc40"},{l:"ベルト",v:prodStats.beltCnt,c:C.green},
                  { l:"組立機",v:prodStats.assemblerCnt,c:"#e0a060"},{l:"蒸気機関",v:prodStats.steamEngineCnt,c:"#c060e0"},
                  { l:"原子力",v:prodStats.nuclearPlantCnt,c:"#40ff80"},{l:"廃棄処分場",v:prodStats.wasteDisposalCnt,c:"#806040"},
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex justify-between text-[10px]">
                    <span style={{ color: "#334" }}>{l}</span>
                    <span className="font-bold tabular-nums" style={{ color: v > 0 ? c : "#1a1a28" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 flex justify-between text-[10px]" style={{ borderTop: "1px solid #141428" }}>
                <span style={{ color: "#334" }}>電力効率</span>
                <span className="font-bold" style={{ color: prodStats.efficiency >= 1 ? C.green : C.red }}>{Math.round(prodStats.efficiency * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 宇宙貿易タブ */}
        {tab === "trade" && (
          <div className="px-3 py-3 space-y-2.5">
            <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "#2a3050" }}>🛸 宇宙貿易マイルストーン</div>
            {milestones.map((m: any) => (
              <MilestoneCard key={m.id} milestone={m} totalGearsShipped={totalGearsShipped} totalFuelShipped={totalFuelShipped} totalIronShipped={totalIronShipped} totalStonesShipped={totalStonesShipped} totalUraniumShipped={totalUraniumShipped}/>
            ))}
            {upgrades.rocketSilo && (
              <div className="rounded-xl px-2.5 py-2.5" style={{ background: "#050c1a", border: "1px solid #1a4060" }}>
                <div className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "#2a6090" }}>🚀 打ち上げ進捗</div>
                {[
                  { l:"資金",     cur:Math.floor(money),  req:ROCKET_REQUIREMENTS.money,    c:C.gold,  pre:"¥" },
                  { l:"歯車出荷", cur:totalGearsShipped,  req:ROCKET_REQUIREMENTS.gear,     c:C.gold              },
                  { l:"燃料棒",   cur:totalFuelShipped,   req:ROCKET_REQUIREMENTS.fuel_rod, c:C.green             },
                ].map(({ l, cur, req, c, pre }) => {
                  const pct = Math.min(100, cur / req * 100);
                  return (
                    <div key={l} className="mb-2">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[9px]" style={{ color: "#334" }}>{l}</span>
                        <span className="text-[9px] tabular-nums" style={{ color: pct >= 100 ? c : "#334" }}>{pre ?? ""}{fmt(cur)}/{pre ?? ""}{fmt(req)}{pct >= 100 ? " ✓" : ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0a1020" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${c}55,${c})` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
