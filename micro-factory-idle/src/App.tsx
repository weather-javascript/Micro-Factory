// ════════════════════════════════════════════════════════════════════
//  App.tsx — Micro-Factory 3D エントリーポイント
//  GameCanvas（3D）と HUDOverlay（2D UI）を統合する。
// ════════════════════════════════════════════════════════════════════

import { Suspense } from "react";
import { useGameState } from "./hooks/useGameState";
import { GameCanvas }   from "./components/GameCanvas";
import { HUDOverlay }   from "./components/HUDOverlay";

// ─── ローディング画面 ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: "#060610" }}
    >
      <div className="grid grid-cols-2 gap-1 w-12 h-12 mb-6">
        {["#63B3ED","#68D391","#F6AD55","#C084FC"].map((c, i) => (
          <div
            key={i}
            className="rounded-md"
            style={{
              background: c,
              opacity: 0.9,
              animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
      <div className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: "#3a4060" }}>
        MICRO-FACTORY 3D
      </div>
      <div className="text-[9px] mt-2" style={{ color: "#2a2a3a" }}>
        loading 3D environment...
      </div>
    </div>
  );
}

export default function App() {
  const {
    state,
    selectedShop,
    selectedTile,
    toasts,
    powerOk,
    powerGenerated,
    prodStats,
    phaseRemain,
    showRocketClear,
    setShowRocketClear,
    mineStone,
    mineIron,
    sellStone,
    sellIron,
    handleTileClick,
    toggleShop,
    cancelShop,
    buyUpgrade,
    newGamePlus,
  } = useGameState();

  const isNight = state.dayPhase === "night";

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: isNight
          ? "radial-gradient(ellipse at top, #030308, #010105)"
          : "radial-gradient(ellipse at top, #0d1520, #08080f)",
        transition: "background 3s ease",
      }}
    >
      {/* ════════ 3Dキャンバス（背面） ════════ */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingScreen/>}>
          <GameCanvas
            state={state}
            selectedShop={selectedShop}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            rocketLaunched={state.rocketLaunched}
          />
        </Suspense>
      </div>

      {/* ════════ HUDオーバーレイ（前面） ════════ */}
      <HUDOverlay
        state={state}
        selectedShop={selectedShop}
        prodStats={prodStats}
        powerGenerated={powerGenerated}
        phaseRemain={phaseRemain}
        showRocketClear={showRocketClear}
        onToggleShop={toggleShop}
        onCancelShop={cancelShop}
        onTileClick={handleTileClick}
        onMineStone={mineStone}
        onMineIron={mineIron}
        onSellStone={sellStone}
        onSellIron={sellIron}
        onBuyUpgrade={buyUpgrade}
        onNewGamePlus={newGamePlus}
        onDismissRocket={() => setShowRocketClear(false)}
      />

      {/* ════════ トースト通知 ════════ */}
      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black shadow-2xl"
            style={{
              background: "rgba(6,6,14,0.95)",
              border:     `1px solid ${t.color}40`,
              color:       t.color,
              boxShadow:  `0 0 16px ${t.color}25`,
              backdropFilter: "blur(12px)",
              animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.text}
          </div>
        ))}
      </div>

      {/* ════════ グローバルCSS ════════ */}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(10px) scale(0.92); }
          to   { opacity:1; transform:translateY(0)   scale(1); }
        }
        @keyframes rocketUp {
          0%  { transform:translateY(24px) scale(0.7); opacity:0; }
          60% { transform:translateY(-12px) scale(1.2); opacity:1; }
          100%{ transform:translateY(0) scale(1); opacity:1; }
        }
        @keyframes twinkle {
          0%,100% { opacity:0.15; transform:scale(1); }
          50%     { opacity:0.9;  transform:scale(1.5); }
        }
        @keyframes pulse {
          from { opacity:0.4; }
          to   { opacity:1; }
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body,#root { width:100%; height:100%; overflow:hidden; }
        body {
          background:#060610;
          -webkit-tap-highlight-color:transparent;
          -webkit-font-smoothing:antialiased;
          user-select:none;
          font-family:'Courier New',Consolas,monospace;
        }
        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#060610; }
        ::-webkit-scrollbar-thumb { background:#1e1e2a; border-radius:2px; }
        button { cursor:pointer; transition:opacity .15s,transform .1s; }
        button:disabled { cursor:not-allowed; }
        button:not(:disabled):active { transform:scale(0.96); }
      `}</style>
    </div>
  );
}
