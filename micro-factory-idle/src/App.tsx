// ════════════════════════════════════════════════════════════════════
//  App.tsx — エントリーポイント
//  レイアウト・タブ切り替え・トースト通知を管理する。
//  ゲームロジックはすべて useGameState フックに委譲。
// ════════════════════════════════════════════════════════════════════

import { useGameState } from "./hooks/useGameState";
import { COSTS, UPGRADE_COSTS, UPGRADE_LABELS, UPGRADE_DESC, GRID_SIZE } from "./constants";
import { ResourceBadge } from "./components/ResourceBadge";
import { PowerBar }      from "./components/PowerBar";
import { TileCell }      from "./components/TileCell";
import { ShopBtn }       from "./components/ShopBtn";
import { UpgradeCard }   from "./components/UpgradeCard";
import {
  PickaxeIcon, CoinIcon, StoneIcon, IronIcon,
  DrillIcon, BeltIcon, SolarIcon, BatteryIcon,
  TrashIcon, FactoryIcon, ResearchIcon, SunIcon, MoonIcon,
} from "./components/Icons";
import { fmt } from "./utils/gameLogic";

export default function App() {
  const {
    state, activeTab, selectedShop, toasts, clickAnim,
    powerOk, prodStats, phaseRemain,
    setActiveTab, mineStone, mineIron, sellStone, sellIron,
    handleTileClick, toggleShop, cancelShop, buyUpgrade,
  } = useGameState();

  const { money, stone, iron, powerUsed, powerMax, batteryCharge, batteryMax, dayPhase, grid, upgrades } = state;
  const { stoneDrillCnt, ironDrillCnt, beltCnt, solarCnt, batteryCnt, stonePerSec, ironPerSec, efficiency } = prodStats;
  const isDay = dayPhase === "day";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: "#13131a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ════════ ヘッダー ════════ */}
      <header
        className="w-full sticky top-0 z-20"
        style={{ background: "#0e0e14", borderBottom: "1px solid #22222e" }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          {/* ロゴ */}
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
          </div>

          {/* 昼夜インジケーター */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: isDay ? "#FCD34D18" : "#818CF818",
              border:     `1px solid ${isDay ? "#FCD34D40" : "#818CF840"}`,
              color:      isDay ? "#FCD34D"   : "#818CF8",
            }}
          >
            {isDay ? <SunIcon className="w-3.5 h-3.5"/> : <MoonIcon className="w-3.5 h-3.5"/>}
            {isDay ? "昼" : "夜"}
            <span style={{ opacity: 0.6 }}>あと{phaseRemain}s</span>
          </div>

          {/* 所持金 */}
          <div className="flex items-center gap-1.5">
            <CoinIcon className="w-5 h-5"/>
            <span className="text-xl font-bold tabular-nums" style={{ color: "#F5C842" }}>
              {fmt(money)}
            </span>
          </div>
        </div>
      </header>

      {/* ════════ メインコンテンツ ════════ */}
      <main className="w-full max-w-md flex flex-col gap-3 px-3 pb-10 pt-3">

        {/* ── リソース表示 ── */}
        <div className="flex gap-2">
          <ResourceBadge
            icon={<StoneIcon className="w-6 h-6"/>}
            value={stone} label="石" perSec={stonePerSec} color="#A0AFBF"
          />
          <ResourceBadge
            icon={<IronIcon className="w-6 h-6"/>}
            value={iron} label="鉄" perSec={ironPerSec} color="#7BAEC8"
          />
        </div>

        {/* ── 電力バー（電力が関わる施設が1台以上あれば表示） ── */}
        {(solarCnt > 0 || powerUsed > 0 || batteryCnt > 0) && (
          <PowerBar
            used={powerUsed} max={powerMax}
            batteryCharge={batteryCharge} batteryMax={batteryMax}
          />
        )}

        {/* ── 手動採掘 & 売却 ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* 採掘ボタン */}
          {[
            {
              fn: mineStone, active: clickAnim.stone,
              border: "#7C8A99", color: "#A0AFBF",
              icon: <PickaxeIcon className="w-4 h-4"/>, label: "石を採掘",
            },
            {
              fn: mineIron,  active: clickAnim.iron,
              border: "#7B8FA1", color: "#7BAEC8",
              icon: <PickaxeIcon className="w-4 h-4"/>, label: "鉄を採掘",
            },
          ].map(({ fn, active, border, color, icon, label }) => (
            <button key={label} onClick={fn}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-bold text-sm transition-all duration-100 active:scale-95"
              style={{
                background: active ? `${border}28` : "#20202a",
                border:     `1px solid ${border}`,
                color,
                transform:  active ? "scale(0.96)" : "scale(1)",
              }}
            >
              {icon}{label}
              {upgrades.efficientPickaxe && (
                <span className="text-[10px] opacity-60">×2</span>
              )}
            </button>
          ))}

          {/* 売却ボタン */}
          <button onClick={sellStone} disabled={stone <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: "#20202a", border: "1px solid #c8a020", color: "#F5C842" }}>
            <StoneIcon className="w-4 h-4"/>石を売却
          </button>
          <button onClick={sellIron} disabled={iron <= 0}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-bold text-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: "#20202a", border: "1px solid #c8a020", color: "#F5C842" }}>
            <IronIcon className="w-4 h-4"/>鉄を売却
          </button>
        </div>

        {/* ════════ タブメニュー ════════ */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #22222e" }}>
          {([
            { id: "factory",  label: "工場",  icon: <FactoryIcon  className="w-4 h-4"/> },
            { id: "research", label: "研究所", icon: <ResearchIcon className="w-4 h-4"/> },
          ] as const).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all duration-200"
              style={{
                background:   activeTab === id ? "#20202a" : "#13131a",
                color:        activeTab === id ? (id === "factory" ? "#68D391" : "#C084FC") : "#444",
                borderBottom: activeTab === id
                  ? `2px solid ${id === "factory" ? "#68D391" : "#C084FC"}`
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
                  ショップ
                </span>
                {selectedShop && (
                  <button onClick={cancelShop}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "#FC818120", color: "#FC8181", border: "1px solid #FC818150" }}>
                    ✕ キャンセル (ESC)
                  </button>
                )}
              </div>

              {/* 1行目: 施設 */}
              <div className="flex gap-1.5 mb-1.5">
                <ShopBtn item="stone_drill" label="石ドリル" cost={COSTS.stone_drill}
                  icon={<DrillIcon className="w-5 h-5"/>} accent="#A0AFBF"
                  selected={selectedShop === "stone_drill"} canAfford={money >= COSTS.stone_drill}
                  onSelect={() => toggleShop("stone_drill")} sublabel="1W消費"
                />
                <ShopBtn item="iron_drill" label="鉄ドリル" cost={COSTS.iron_drill}
                  icon={<DrillIcon className="w-5 h-5"/>} accent="#63B3ED"
                  selected={selectedShop === "iron_drill"} canAfford={money >= COSTS.iron_drill}
                  onSelect={() => toggleShop("iron_drill")} sublabel="3W消費"
                />
                <ShopBtn item="belt" label="ベルト" cost={COSTS.belt}
                  icon={<BeltIcon className="w-5 h-5"/>} accent="#68D391"
                  selected={selectedShop === "belt"} canAfford={money >= COSTS.belt}
                  onSelect={() => toggleShop("belt")} sublabel="搬送"
                />
              </div>

              {/* 2行目: 電力施設 + 解体 */}
              <div className="flex gap-1.5">
                <ShopBtn item="solar" label="ソーラー" cost={COSTS.solar}
                  icon={<SolarIcon className="w-5 h-5"/>} accent="#4ade80"
                  selected={selectedShop === "solar"} canAfford={money >= COSTS.solar}
                  onSelect={() => toggleShop("solar")} sublabel="+10W(昼)"
                />
                <ShopBtn item="battery" label="蓄電池" cost={COSTS.battery}
                  icon={<BatteryIcon className="w-5 h-5"/>} accent="#a78bfa"
                  selected={selectedShop === "battery"} canAfford={money >= COSTS.battery}
                  onSelect={() => toggleShop("battery")} sublabel="40Wh蓄電"
                />
                <ShopBtn item="demolish" label="解体" cost={null}
                  icon={<TrashIcon className="w-5 h-5"/>} accent="#FC8181"
                  selected={selectedShop === "demolish"} canAfford={true}
                  onSelect={() => toggleShop("demolish")} sublabel="30%返金"
                />
              </div>
            </div>

            {/* ── 配置モードバナー ── */}
            {selectedShop && (
              <div
                className="text-center text-[11px] font-bold py-1.5 rounded-lg"
                style={{
                  background: selectedShop === "demolish" ? "#FC818115" : "#68D39115",
                  color:      selectedShop === "demolish" ? "#FC8181"   : "#68D391",
                  border:     `1px solid ${selectedShop === "demolish" ? "#FC818130" : "#68D39130"}`,
                }}
              >
                {selectedShop === "demolish"
                  ? "✕ 解体モード：施設タイルをタップして撤去（30%返金）"
                  : `✦ 配置モード：マスをタップして設置`
                    + (selectedShop === "stone_drill" ? "（石鉱床のみ）"
                    :  selectedShop === "iron_drill"  ? "（鉄鉱床のみ）"
                    :  "（空きマスのみ）")
                }
              </div>
            )}

            {/* ── グリッド ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
                  工場グリッド 5×5
                </span>
                <span className="text-[10px]" style={{ color: "#333" }}>
                  ベルト→タップで回転
                </span>
              </div>
              <div
                className="grid gap-1.5 w-full"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
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
            {(stoneDrillCnt > 0 || ironDrillCnt > 0 || solarCnt > 0 || batteryCnt > 0 || beltCnt > 0) && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: "#20202a", border: "1px solid #2a2a36" }}>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "#444" }}>
                  稼働状況
                </div>
                <div className="flex flex-col gap-1">
                  {stoneDrillCnt > 0 && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "#A0AFBF" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#A0AFBF" }}/>
                        石ドリル ×{stoneDrillCnt}
                      </span>
                      <span>+{stonePerSec} 石/s {efficiency < 1 && <span style={{ color: "#FC8181" }}>(電力不足)</span>}</span>
                    </div>
                  )}
                  {ironDrillCnt > 0 && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "#63B3ED" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#63B3ED" }}/>
                        鉄ドリル ×{ironDrillCnt}
                      </span>
                      <span>+{ironPerSec} 鉄/s {efficiency < 1 && <span style={{ color: "#FC8181" }}>(電力不足)</span>}</span>
                    </div>
                  )}
                  {solarCnt > 0 && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "#4ade80" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDay ? "#4ade80" : "#444" }}/>
                        ソーラー ×{solarCnt}
                      </span>
                      <span>{isDay ? `+${solarCnt * 10}W` : "発電停止（夜）"}</span>
                    </div>
                  )}
                  {batteryCnt > 0 && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "#a78bfa" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }}/>
                        蓄電池 ×{batteryCnt}
                      </span>
                      <span>{isDay ? "充電中" : "放電中"}</span>
                    </div>
                  )}
                  {beltCnt > 0 && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "#68D391" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#68D391" }}/>
                        ベルト ×{beltCnt}
                      </span>
                      <span>搬送中 → Hub自動売却</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 凡例 ── */}
            <div className="rounded-xl px-3 py-2" style={{ background: "#20202a", border: "1px solid #252530" }}>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "#444" }}>凡例</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { c: "#52596a", t: "石鉱床（ドリル設置可）" },
                  { c: "#2e4d6e", t: "鉄鉱床（ドリル設置可）" },
                  { c: "#2e4d7e", t: "石ドリル (1W消費)" },
                  { c: "#1e5a7e", t: "鉄ドリル (3W消費)" },
                  { c: "#1e4030", t: "ベルト（タップで回転）" },
                  { c: "#3a6020", t: "ソーラー (+10W/昼)" },
                  { c: "#4a3080", t: "蓄電池 (40Wh)" },
                  { c: "#7a4060", t: "Hub（出荷ポート）" },
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

        {/* ════════ 研究タブ ════════ */}
        {activeTab === "research" && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
              永続アップグレード（複合リソース消費）
            </div>

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
              icon={<PickaxeIcon className="w-6 h-6"/>}
              accent="#F6AD55"
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
              icon={<DrillIcon className="w-6 h-6"/>}
              accent="#C084FC"
            />

            {/* 現在の効果サマリ */}
            <div className="rounded-xl px-3 py-2.5 mt-1" style={{ background: "#20202a", border: "1px solid #2a2a36" }}>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#444" }}>
                現在の効果
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  {
                    label: "手動採掘量",
                    value: upgrades.efficientPickaxe ? "×2" : "×1",
                    color: upgrades.efficientPickaxe ? "#F6AD55" : "#444",
                  },
                  {
                    label: "ドリル生産ボーナス",
                    value: upgrades.turbodrillBoost ? "+1 /s" : "+0 /s",
                    color: upgrades.turbodrillBoost ? "#C084FC" : "#444",
                  },
                  {
                    label: "電力効率",
                    value: powerOk ? "100%" : "50% (不足)",
                    color: powerOk ? "#4ade80" : "#FC8181",
                  },
                  {
                    label: "時間帯",
                    value: isDay ? `昼（残${phaseRemain}s）` : `夜（残${phaseRemain}s）`,
                    color: isDay ? "#FCD34D" : "#818CF8",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "#666" }}>{label}</span>
                    <span style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════════ トースト通知 ════════ */}
      <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-50">
        {toasts.map(t => (
          <div key={t.id}
            className="px-4 py-2 rounded-full text-sm font-bold shadow-2xl"
            style={{
              background: "#13131a",
              border:     `1px solid ${t.color}`,
              color:       t.color,
              animation:  "toastIn 0.2s ease",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* ════════ グローバル CSS ════════ */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes beltFlow {
          0%   { opacity: 0; transform: scale(0.4); }
          40%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.7); }
        }
        .-rotate-90 { transform: rotate(-90deg); }
        .rotate-0   { transform: rotate(0deg);   }
        .rotate-90  { transform: rotate(90deg);  }
        .rotate-180 { transform: rotate(180deg); }
      `}</style>
    </div>
  );
}