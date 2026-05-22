// ════════════════════════════════════════════════════════════════════
//  App.tsx — エントリーポイント
//  全体レイアウト・タブ切り替え（工場/研究/統計）・通知を管理。
//  ゲームロジックはすべて useGameState フックに委譲。
// ════════════════════════════════════════════════════════════════════

import { useGameState } from "./hooks/useGameState";
import {
  COSTS, UPGRADE_COSTS, UPGRADE_LABELS, UPGRADE_DESC,
  LEGEND_ITEMS, ROCKET_REQUIREMENTS,
} from "./constants";
import { ResourceBadge } from "./components/ResourceBadge";
import { PowerBar }      from "./components/PowerBar";
import { TileCell }      from "./components/TileCell";
import { ShopBtn }       from "./components/ShopBtn";
import { UpgradeCard }   from "./components/UpgradeCard";
import { Dashboard }     from "./components/Dashboard";
import {
  PickaxeIcon, CoinIcon, StoneIcon, IronIcon, GearIcon,
  DrillIcon, BeltIcon, SolarIcon, BatteryIcon, AssemblerIcon,
  TrashIcon, FactoryIcon, ResearchIcon, StatsIcon,
  SunIcon, MoonIcon, RocketIcon,
} from "./components/Icons";
import { fmt } from "./utils/gameLogic";
import type { Upgrades } from "./types";

export default function App() {
  const {
    state, activeTab, selectedShop, toasts, clickAnim,
    powerOk, prodStats, phaseRemain, showRocketClear,
    setActiveTab, setShowRocketClear,
    mineStone, mineIron, sellStone, sellIron,
    handleTileClick, toggleShop, cancelShop, buyUpgrade,
  } = useGameState();

  const {
    money, stone, iron, gear,
    powerUsed, powerMax, batteryCharge, batteryMax,
    dayPhase, grid, gridSize, upgrades,
    totalGearsShipped, totalStonesShipped, totalIronShipped,
    rocketLaunched,
  } = state;

  const {
    stoneDrillCnt, ironDrillCnt, beltCnt, solarCnt, batteryCnt, assemblerCnt,
    stonePerSec, ironPerSec, efficiency,
  } = prodStats;

  const isDay = dayPhase === "day";

  // 背景グラデーション（昼夜で変化）
  const bgGradient = isDay
    ? "radial-gradient(ellipse at 20% 0%, #0d1520 0%, #13131a 60%)"
    : "radial-gradient(ellipse at 80% 0%, #0a0a18 0%, #0d0d12 60%)";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background: bgGradient,
        fontFamily: "'Courier New', 'Consolas', 'Menlo', monospace",
        transition: "background 3s ease",
      }}
    >
      {/* ════════ ロケットクリア画面 ════════ */}
      {showRocketClear && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, #001040cc, #000010ee)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* 星の演出 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: "#ffffff",
                  opacity: Math.random() * 0.8 + 0.2,
                  animation: `starTwinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div
            className="relative text-center px-8 py-10 rounded-3xl max-w-sm mx-4"
            style={{
              background: "linear-gradient(135deg, #0a1830, #0a0a20)",
              border: "1px solid #2060a0",
              boxShadow: "0 0 60px #2060a060, 0 0 120px #2060a020",
            }}
          >
            <div
              className="text-6xl mb-4"
              style={{ animation: "rocketLaunch 1s ease-out forwards" }}
            >
              🚀
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: "#60d0ff", letterSpacing: "0.1em" }}>
              LAUNCH SUCCESS!
            </h1>
            <p className="text-sm mb-1" style={{ color: "#4090c0" }}>
              ロケット打ち上げ成功！
            </p>
            <p className="text-xs mb-6" style={{ color: "#446" }}>
              このまま無限モードとして工場の拡大を続けましょう
            </p>

            {/* 達成記録 */}
            <div
              className="rounded-xl px-4 py-3 mb-6 text-left"
              style={{ background: "#060e20", border: "1px solid #1a3a60" }}
            >
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "#2a6090" }}>
                MISSION LOG
              </div>
              {[
                { label: "資金", value: `¥${fmt(money)}`, color: "#F5C842" },
                { label: "歯車出荷", value: `${totalGearsShipped}個`, color: "#e0c070" },
                { label: "鉄出荷", value: `${totalIronShipped}個`, color: "#63B3ED" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#446" }}>{label}</span>
                  <span style={{ color }} className="font-bold tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRocketClear(false)}
              className="w-full py-3 rounded-xl font-black text-sm tracking-widest"
              style={{
                background: "linear-gradient(135deg, #1060c0, #2080e0)",
                color: "#fff",
                border: "none",
                boxShadow: "0 0 20px #2060a050",
              }}
            >
              ∞ 無限モード開始
            </button>
          </div>
        </div>
      )}

      {/* ════════ ヘッダー ════════ */}
      <header
        className="w-full sticky top-0 z-20"
        style={{
          background: isDay ? "#0d1218cc" : "#08080fcc",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${isDay ? "#1a2530" : "#111120"}`,
          transition: "background 3s ease",
        }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          {/* ロゴ */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              {["#63B3ED", "#68D391", "#F6AD55", "#C084FC"].map((c, i) => (
                <div key={i} className="rounded-sm" style={{ background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span
              className="text-[11px] font-black tracking-[0.2em] uppercase"
              style={{ color: "#445", letterSpacing: "0.25em" }}
            >
              MICRO-FACTORY
            </span>
            {rocketLaunched && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider"
                style={{ background: "#2060a020", color: "#4090c0", border: "1px solid #2060a040" }}
              >
                ∞ INFINITE
              </span>
            )}
          </div>

          {/* 昼夜インジケーター */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: isDay ? "#FCD34D12" : "#818CF812",
              border: `1px solid ${isDay ? "#FCD34D30" : "#818CF830"}`,
              color: isDay ? "#FCD34D" : "#818CF8",
            }}
          >
            {isDay
              ? <SunIcon className="w-3 h-3"/>
              : <MoonIcon className="w-3 h-3"/>
            }
            {phaseRemain}s
          </button>

          {/* 所持金 */}
          <div className="flex items-center gap-1">
            <CoinIcon className="w-4 h-4"/>
            <span
              className="text-lg font-black tabular-nums"
              style={{ color: "#F5C842", textShadow: "0 0 8px #F5C84240" }}
            >
              {fmt(money)}
            </span>
          </div>
        </div>
      </header>

      {/* ════════ メインコンテンツ ════════ */}
      <main className="w-full max-w-md flex flex-col gap-2.5 px-3 pb-12 pt-2.5">

        {/* ── リソース表示 ── */}
        <div className="flex gap-2">
          <ResourceBadge
            icon={<StoneIcon className="w-5 h-5"/>}
            value={stone} label="石" perSec={stonePerSec} color="#A0AFBF"
          />
          <ResourceBadge
            icon={<IronIcon className="w-5 h-5"/>}
            value={iron} label="鉄" perSec={ironPerSec} color="#7BAEC8"
          />
          {prodStats.assemblerCnt > 0 && (
            <ResourceBadge
              icon={<GearIcon className="w-5 h-5"/>}
              value={gear} label="歯車" color="#e0c070"
            />
          )}
        </div>

        {/* ── 電力バー ── */}
        {(solarCnt > 0 || powerUsed > 0 || batteryCnt > 0) && (
          <PowerBar
            used={powerUsed} max={powerMax}
            batteryCharge={batteryCharge} batteryMax={batteryMax}
            isNight={!isDay}
          />
        )}

        {/* ── 手動採掘 & 売却 ── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              fn: mineStone, active: clickAnim.stone,
              border: "#8899aa", color: "#A0AFBF",
              icon: <PickaxeIcon className="w-4 h-4"/>, label: "石を採掘",
            },
            {
              fn: mineIron, active: clickAnim.iron,
              border: "#5a8ab0", color: "#7BAEC8",
              icon: <PickaxeIcon className="w-4 h-4"/>, label: "鉄を採掘",
            },
          ].map(({ fn, active, border, color, icon, label }) => (
            <button
              key={label}
              onClick={fn}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-bold text-sm transition-all duration-100 active:scale-95"
              style={{
                background: active ? `${border}20` : "#1a1a24",
                border: `1px solid ${active ? border : border + "50"}`,
                color,
                transform: active ? "scale(0.95)" : "scale(1)",
                boxShadow: active ? `0 0 8px ${border}40` : "none",
              }}
            >
              {icon}{label}
              {upgrades.efficientPickaxe && (
                <span className="text-[10px] opacity-50">×2</span>
              )}
            </button>
          ))}

          <button
            onClick={sellStone}
            disabled={stone <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: "#1a1a24",
              border: "1px solid #c8a02050",
              color: "#F5C842",
            }}
          >
            <StoneIcon className="w-4 h-4"/>石を売却
          </button>
          <button
            onClick={sellIron}
            disabled={iron <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: "#1a1a24",
              border: "1px solid #c8a02050",
              color: "#F5C842",
            }}
          >
            <IronIcon className="w-4 h-4"/>鉄を売却
          </button>
        </div>

        {/* ════════ タブメニュー ════════ */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid #1e1e2a" }}
        >
          {([
            { id: "factory",  label: "工場",   icon: <FactoryIcon  className="w-3.5 h-3.5"/>, color: "#68D391" },
            { id: "research", label: "研究所",  icon: <ResearchIcon className="w-3.5 h-3.5"/>, color: "#C084FC" },
            { id: "stats",    label: "統計",   icon: <StatsIcon    className="w-3.5 h-3.5"/>, color: "#63B3ED" },
          ] as const).map(({ id, label, icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all duration-200"
              style={{
                background:   activeTab === id ? "#1a1a24" : "#111118",
                color:        activeTab === id ? color : "#333",
                borderBottom: activeTab === id
                  ? `2px solid ${color}`
                  : "2px solid transparent",
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ════════ 工場タブ ════════ */}
        {activeTab === "factory" && (
          <>
            {/* ── ショップ ── */}
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: "#111118", border: "1px solid #1e1e2a" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "#333" }}
                >
                  SHOP
                </span>
                {selectedShop && (
                  <button
                    onClick={cancelShop}
                    className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: "#FC818115",
                      color: "#FC8181",
                      border: "1px solid #FC818130",
                    }}
                  >
                    ✕ ESC
                  </button>
                )}
              </div>

              {/* 1行目: ドリル・ベルト */}
              <div className="flex gap-1.5 mb-1.5">
                <ShopBtn
                  item="stone_drill" label="石ドリル" cost={COSTS.stone_drill}
                  icon={<DrillIcon className="w-4 h-4"/>} accent="#A0AFBF"
                  selected={selectedShop === "stone_drill"}
                  canAfford={money >= COSTS.stone_drill}
                  onSelect={() => toggleShop("stone_drill")} sublabel="1W消費"
                />
                <ShopBtn
                  item="iron_drill" label="鉄ドリル" cost={COSTS.iron_drill}
                  icon={<DrillIcon className="w-4 h-4"/>} accent="#63B3ED"
                  selected={selectedShop === "iron_drill"}
                  canAfford={money >= COSTS.iron_drill}
                  onSelect={() => toggleShop("iron_drill")} sublabel="3W消費"
                />
                <ShopBtn
                  item="belt" label="ベルト" cost={COSTS.belt}
                  icon={<BeltIcon className="w-4 h-4"/>} accent="#68D391"
                  selected={selectedShop === "belt"}
                  canAfford={money >= COSTS.belt}
                  onSelect={() => toggleShop("belt")} sublabel="搬送"
                />
              </div>

              {/* 2行目: 電力・解体 */}
              <div className="flex gap-1.5 mb-1.5">
                <ShopBtn
                  item="solar" label="ソーラー" cost={COSTS.solar}
                  icon={<SolarIcon className="w-4 h-4"/>} accent="#4ade80"
                  selected={selectedShop === "solar"}
                  canAfford={money >= COSTS.solar}
                  onSelect={() => toggleShop("solar")} sublabel="+10W昼"
                />
                <ShopBtn
                  item="battery" label="蓄電池" cost={COSTS.battery}
                  icon={<BatteryIcon className="w-4 h-4"/>} accent="#a78bfa"
                  selected={selectedShop === "battery"}
                  canAfford={money >= COSTS.battery}
                  onSelect={() => toggleShop("battery")} sublabel="40Wh"
                />
                <ShopBtn
                  item="demolish" label="解体" cost={null}
                  icon={<TrashIcon className="w-4 h-4"/>} accent="#FC8181"
                  selected={selectedShop === "demolish"}
                  canAfford={true}
                  onSelect={() => toggleShop("demolish")} sublabel="50%返金"
                />
              </div>

              {/* 3行目: 高度施設（アンロック後） */}
              <div className="flex gap-1.5">
                <ShopBtn
                  item="assembler" label="組立機" cost={COSTS.assembler}
                  icon={<AssemblerIcon className="w-4 h-4"/>} accent="#e0a060"
                  selected={selectedShop === "assembler"}
                  canAfford={money >= COSTS.assembler}
                  onSelect={() => toggleShop("assembler")}
                  sublabel="5W / 歯車"
                  locked={!upgrades.assemblerUnlock}
                />
                <ShopBtn
                  item="rocket_silo" label="サイロ" cost={COSTS.rocket_silo}
                  icon={<RocketIcon className="w-4 h-4"/>} accent="#60d0ff"
                  selected={selectedShop === "rocket_silo"}
                  canAfford={money >= COSTS.rocket_silo}
                  onSelect={() => toggleShop("rocket_silo")}
                  sublabel="最終目標"
                  locked={!upgrades.rocketSilo}
                />
                {/* 空白スペーサー */}
                <div className="flex-1" />
              </div>
            </div>

            {/* ── 配置モードバナー ── */}
            {selectedShop && (
              <div
                className="text-center text-[10px] font-bold py-1.5 rounded-lg"
                style={{
                  background: selectedShop === "demolish" ? "#FC818110" : "#68D39110",
                  color: selectedShop === "demolish" ? "#FC8181" : "#68D391",
                  border: `1px solid ${selectedShop === "demolish" ? "#FC818125" : "#68D39125"}`,
                }}
              >
                {selectedShop === "demolish"
                  ? "✕ 解体モード：施設タイルをタップ（50%返金）"
                  : `✦ 配置モード：${
                      selectedShop === "stone_drill" ? "石鉱床をタップ" :
                      selectedShop === "iron_drill" ? "鉄鉱床をタップ" :
                      "空きマスをタップ"
                    }して設置`
                }
              </div>
            )}

            {/* ── グリッド ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase"
                  style={{ color: "#333" }}
                >
                  FACTORY GRID {gridSize}×{gridSize}
                </span>
                <span className="text-[9px]" style={{ color: "#2a2a38" }}>
                  tap to rotate
                </span>
              </div>

              <div
                className="grid gap-1 w-full"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              >
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

            {/* ── 稼働状況サマリ ── */}
            {(stoneDrillCnt > 0 || ironDrillCnt > 0 || solarCnt > 0 || batteryCnt > 0 || beltCnt > 0 || assemblerCnt > 0) && (
              <div
                className="rounded-xl px-3 py-2.5"
                style={{ background: "#111118", border: "1px solid #1e1e2a" }}
              >
                <div
                  className="text-[9px] font-black tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: "#333" }}
                >
                  STATUS
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    stoneDrillCnt > 0 && {
                      dot: "#A0AFBF", label: `石ドリル ×${stoneDrillCnt}`,
                      value: `+${stonePerSec} 石/s`,
                      color: "#A0AFBF", pulse: true,
                    },
                    ironDrillCnt > 0 && {
                      dot: "#63B3ED", label: `鉄ドリル ×${ironDrillCnt}`,
                      value: `+${ironPerSec} 鉄/s`,
                      color: "#63B3ED", pulse: true,
                    },
                    solarCnt > 0 && {
                      dot: isDay ? "#4ade80" : "#333", label: `ソーラー ×${solarCnt}`,
                      value: isDay ? `+${solarCnt * 10}W` : "停止（夜）",
                      color: isDay ? "#4ade80" : "#555", pulse: false,
                    },
                    batteryCnt > 0 && {
                      dot: "#a78bfa", label: `蓄電池 ×${batteryCnt}`,
                      value: isDay ? "充電中" : "放電中",
                      color: "#a78bfa", pulse: false,
                    },
                    beltCnt > 0 && {
                      dot: "#68D391", label: `ベルト ×${beltCnt}`,
                      value: "搬送中",
                      color: "#68D391", pulse: true,
                    },
                    assemblerCnt > 0 && {
                      dot: "#e0a060", label: `組立機 ×${assemblerCnt}`,
                      value: "歯車生産中",
                      color: "#e0a060", pulse: true,
                    },
                  ].filter(Boolean).map((item: any) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-[11px]"
                      style={{ color: item.color }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.pulse ? "animate-pulse" : ""}`}
                          style={{ background: item.dot }}
                        />
                        {item.label}
                      </span>
                      <span>
                        {item.value}
                        {efficiency < 1 && (item.label.includes("ドリル") || item.label.includes("組立")) && (
                          <span style={{ color: "#FC8181" }}> (電力不足)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 凡例 ── */}
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "#0d0d14", border: "1px solid #18181f" }}
            >
              <div
                className="text-[9px] font-black tracking-[0.2em] uppercase mb-1.5"
                style={{ color: "#2a2a38" }}
              >
                LEGEND
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {LEGEND_ITEMS.map(({ color, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded shrink-0"
                      style={{ background: color, border: `1px solid ${color}cc` }}
                    />
                    <span className="text-[9px]" style={{ color: "#2e2e3e" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════ 研究タブ ════════ */}
        {activeTab === "research" && (
          <div className="flex flex-col gap-2.5">
            <div
              className="text-[9px] font-black tracking-[0.2em] uppercase"
              style={{ color: "#333" }}
            >
              RESEARCH TREE
            </div>

            {/* Tier1 */}
            <ResearchTier label="TIER 1" color="#F6AD55">
              <UpgradeCard
                title={UPGRADE_LABELS.efficientPickaxe}
                description={UPGRADE_DESC.efficientPickaxe}
                cost={UPGRADE_COSTS.efficientPickaxe}
                purchased={upgrades.efficientPickaxe}
                canAfford={
                  money >= UPGRADE_COSTS.efficientPickaxe.money &&
                  stone >= (UPGRADE_COSTS.efficientPickaxe.stone ?? 0)
                }
                onBuy={() => buyUpgrade("efficientPickaxe")}
                icon={<PickaxeIcon className="w-5 h-5"/>}
                accent="#F6AD55"
                currentMoney={money} currentStone={stone} currentIron={iron}
              />
              <UpgradeCard
                title={UPGRADE_LABELS.turbodrillBoost}
                description={UPGRADE_DESC.turbodrillBoost}
                cost={UPGRADE_COSTS.turbodrillBoost}
                purchased={upgrades.turbodrillBoost}
                canAfford={
                  money >= UPGRADE_COSTS.turbodrillBoost.money &&
                  iron >= (UPGRADE_COSTS.turbodrillBoost.iron ?? 0)
                }
                onBuy={() => buyUpgrade("turbodrillBoost")}
                icon={<DrillIcon className="w-5 h-5"/>}
                accent="#C084FC"
                currentMoney={money} currentIron={iron}
              />
              <UpgradeCard
                title={UPGRADE_LABELS.assemblerUnlock}
                description={UPGRADE_DESC.assemblerUnlock}
                cost={UPGRADE_COSTS.assemblerUnlock}
                purchased={upgrades.assemblerUnlock}
                canAfford={
                  money >= UPGRADE_COSTS.assemblerUnlock.money &&
                  iron >= (UPGRADE_COSTS.assemblerUnlock.iron ?? 0)
                }
                onBuy={() => buyUpgrade("assemblerUnlock")}
                icon={<AssemblerIcon className="w-5 h-5"/>}
                accent="#e0a060"
                currentMoney={money} currentIron={iron}
              />
            </ResearchTier>

            {/* Tier2 */}
            <ResearchTier label="TIER 2" color="#63B3ED">
              {(
                [
                  {
                    key: "fastBelt" as keyof Upgrades,
                    title: UPGRADE_LABELS.fastBelt,
                    desc: UPGRADE_DESC.fastBelt,
                    cost: UPGRADE_COSTS.fastBelt,
                    icon: <BeltIcon className="w-5 h-5"/>,
                    accent: "#68D391",
                    canAfford: money >= UPGRADE_COSTS.fastBelt.money &&
                               totalGearsShipped >= (UPGRADE_COSTS.fastBelt.gear ?? 0),
                  },
                  {
                    key: "largeBattery" as keyof Upgrades,
                    title: UPGRADE_LABELS.largeBattery,
                    desc: UPGRADE_DESC.largeBattery,
                    cost: UPGRADE_COSTS.largeBattery,
                    icon: <BatteryIcon className="w-5 h-5"/>,
                    accent: "#a78bfa",
                    canAfford: money >= UPGRADE_COSTS.largeBattery.money &&
                               totalGearsShipped >= (UPGRADE_COSTS.largeBattery.gear ?? 0),
                  },
                  {
                    key: "expansion7x7" as keyof Upgrades,
                    title: UPGRADE_LABELS.expansion7x7,
                    desc: UPGRADE_DESC.expansion7x7,
                    cost: UPGRADE_COSTS.expansion7x7,
                    icon: <FactoryIcon className="w-5 h-5"/>,
                    accent: "#68D391",
                    canAfford: money >= UPGRADE_COSTS.expansion7x7.money &&
                               totalGearsShipped >= (UPGRADE_COSTS.expansion7x7.gear ?? 0),
                  },
                ] as const
              ).map(({ key, title, desc, cost, icon, accent, canAfford }) => (
                <UpgradeCard
                  key={key}
                  title={title}
                  description={desc}
                  cost={cost}
                  purchased={upgrades[key]}
                  canAfford={canAfford}
                  onBuy={() => buyUpgrade(key)}
                  icon={icon}
                  accent={accent}
                  locked={!upgrades.assemblerUnlock}
                  lockReason="組立機解放が必要"
                  currentMoney={money}
                  currentGear={totalGearsShipped}
                />
              ))}
            </ResearchTier>

            {/* Tier3 */}
            <ResearchTier label="TIER 3" color="#FC8181">
              <UpgradeCard
                title={UPGRADE_LABELS.expansion9x9}
                description={UPGRADE_DESC.expansion9x9}
                cost={UPGRADE_COSTS.expansion9x9}
                purchased={upgrades.expansion9x9}
                canAfford={
                  money >= UPGRADE_COSTS.expansion9x9.money &&
                  totalGearsShipped >= (UPGRADE_COSTS.expansion9x9.gear ?? 0)
                }
                onBuy={() => buyUpgrade("expansion9x9")}
                icon={<FactoryIcon className="w-5 h-5"/>}
                accent="#F6AD55"
                locked={!upgrades.expansion7x7}
                lockReason="7×7拡張が必要"
                currentMoney={money} currentGear={totalGearsShipped}
              />
              <UpgradeCard
                title={UPGRADE_LABELS.rocketSilo}
                description={UPGRADE_DESC.rocketSilo}
                cost={UPGRADE_COSTS.rocketSilo}
                purchased={upgrades.rocketSilo}
                canAfford={
                  money >= UPGRADE_COSTS.rocketSilo.money &&
                  totalGearsShipped >= (UPGRADE_COSTS.rocketSilo.gear ?? 0)
                }
                onBuy={() => buyUpgrade("rocketSilo")}
                icon={<RocketIcon className="w-5 h-5"/>}
                accent="#60d0ff"
                locked={!upgrades.expansion9x9}
                lockReason="9×9拡張が必要"
                currentMoney={money} currentGear={totalGearsShipped}
              />
            </ResearchTier>

            {/* ── 現在の効果サマリ ── */}
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: "#111118", border: "1px solid #1e1e2a" }}
            >
              <div
                className="text-[9px] font-black tracking-[0.2em] uppercase mb-2"
                style={{ color: "#333" }}
              >
                ACTIVE EFFECTS
              </div>
              <div className="flex flex-col gap-1.5 text-[11px]">
                {[
                  {
                    label: "手動採掘量",
                    value: upgrades.efficientPickaxe ? "×2" : "×1",
                    color: upgrades.efficientPickaxe ? "#F6AD55" : "#333",
                  },
                  {
                    label: "ドリルBonus",
                    value: upgrades.turbodrillBoost ? "+1/s" : "+0/s",
                    color: upgrades.turbodrillBoost ? "#C084FC" : "#333",
                  },
                  {
                    label: "ベルト速度",
                    value: upgrades.fastBelt ? "×2" : "×1",
                    color: upgrades.fastBelt ? "#68D391" : "#333",
                  },
                  {
                    label: "蓄電容量",
                    value: upgrades.largeBattery ? "×2" : "×1",
                    color: upgrades.largeBattery ? "#a78bfa" : "#333",
                  },
                  {
                    label: "電力効率",
                    value: powerOk ? "100%" : "20% (不足！)",
                    color: powerOk ? "#4ade80" : "#FC8181",
                  },
                  {
                    label: "グリッドサイズ",
                    value: `${gridSize}×${gridSize}`,
                    color: gridSize > 5 ? "#F6AD55" : "#555",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "#444" }}>{label}</span>
                    <span className="font-bold tabular-nums" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ロケット進捗プレビュー */}
            {upgrades.rocketSilo && (
              <div
                className="rounded-xl px-3 py-2.5"
                style={{
                  background: "#0a1420",
                  border: "1px solid #1a4060",
                }}
              >
                <div
                  className="text-[9px] font-black tracking-[0.2em] uppercase mb-2"
                  style={{ color: "#2a6090" }}
                >
                  🚀 ROCKET REQUIREMENTS
                </div>
                {[
                  { label: "歯車出荷累計", current: totalGearsShipped, required: ROCKET_REQUIREMENTS.gear, color: "#e0c070" },
                  { label: "鉄出荷累計", current: totalIronShipped, required: ROCKET_REQUIREMENTS.iron, color: "#63B3ED" },
                  { label: "資金", current: Math.floor(money), required: ROCKET_REQUIREMENTS.money, color: "#F5C842", prefix: "¥" },
                ].map(({ label, current, required, color, prefix }) => (
                  <div key={label} className="flex justify-between text-[11px] mb-0.5">
                    <span style={{ color: "#446" }}>{label}</span>
                    <span
                      style={{ color: current >= required ? color : "#333" }}
                      className="tabular-nums font-bold"
                    >
                      {current >= required ? "✓ " : ""}
                      {prefix ?? ""}{fmt(current)}/{prefix ?? ""}{fmt(required)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ 統計タブ ════════ */}
        {activeTab === "stats" && (
          <Dashboard state={state} prodStats={prodStats} powerOk={powerOk} />
        )}
      </main>

      {/* ════════ トースト通知 ════════ */}
      <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-2 rounded-full text-[11px] font-black shadow-2xl tracking-wide"
            style={{
              background: "#0d0d14",
              border: `1px solid ${t.color}40`,
              color: t.color,
              boxShadow: `0 0 12px ${t.color}20`,
              animation: "toastIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* ════════ グローバル CSS ════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        * { box-sizing: border-box; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hubPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.04); }
        }
        @keyframes targetPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.4); }
        }
        @keyframes rocketLaunch {
          0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
          50%  { transform: translateY(-10px) scale(1.2); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* スクロールバー */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d14; }
        ::-webkit-scrollbar-thumb { background: #1e1e2a; border-radius: 2px; }
      `}</style>
    </div>
  );
}

/** 研究ティアセクション */
const ResearchTier: React.FC<{
  label: string;
  color: string;
  children: React.ReactNode;
}> = ({ label, color, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px flex-1" style={{ background: `${color}20` }} />
      <span
        className="text-[9px] font-black tracking-[0.25em]"
        style={{ color: `${color}60` }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: `${color}20` }} />
    </div>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);
