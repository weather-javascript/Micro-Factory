// ════════════════════════════════════════════════════════════════════
//  App.tsx — 左右2カラムレイアウト（左70%:3D / 右30%:パネル）
// ════════════════════════════════════════════════════════════════════

import { Suspense } from "react";
import { useGameState } from "./hooks/useGameState";
import { GameCanvas }   from "./components/GameCanvas";
import { ControlPanel } from "./components/ControlPanel";

function LoadingScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: "#040610" }}>
      <div className="grid grid-cols-2 gap-1 w-10 h-10 mb-5">
        {["#63B3ED","#68D391","#F6AD55","#C084FC"].map((c, i) => (
          <div key={i} className="rounded-md"
            style={{ background: c, opacity: 0.9,
              animation: `pulse ${0.7 + i * 0.2}s ease-in-out infinite alternate` }}/>
        ))}
      </div>
      <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: "#2a3050" }}>
        MICRO-FACTORY 3D
      </div>
    </div>
  );
}

export default function App() {
  const {
    state, selectedShop, selectedTile, toasts,
    powerGenerated, prodStats, phaseRemain, showRocketClear,
    setShowRocketClear, mineStone, mineIron, sellStone, sellIron,
    handleTileClick, toggleShop, cancelShop, buyUpgrade, newGamePlus,
  } = useGameState();

  return (
    <div className="fixed inset-0 flex overflow-hidden"
      style={{ fontFamily: "'Courier New', Consolas, monospace" }}>

      {/* ══ 左70%: 3Dキャンバス ══ */}
      <div style={{ flex: "0 0 70%", position: "relative" }}>
        <Suspense fallback={<LoadingScreen/>}>
          <GameCanvas
            state={state}
            selectedShop={selectedShop}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            rocketLaunched={state.rocketLaunched}
          />
        </Suspense>

        {/* 昼夜インジケーター（左上） */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black"
          style={{
            background: "rgba(6,8,18,0.82)",
            border: "1px solid rgba(30,50,100,0.6)",
            backdropFilter: "blur(8px)",
            color: state.dayPhase === "night" ? "#818CF8"
                 : state.dayPhase === "dusk"  ? "#F6AD55" : "#FCD34D",
          }}>
          {state.dayPhase === "day"   ? "☀ 昼"   :
           state.dayPhase === "dusk"  ? "🌅 夕方" :
           state.dayPhase === "night" ? "🌙 夜"   : "🌄 夜明け"}
          <span style={{ color: "#334" }}>{phaseRemain}s</span>
        </div>

        {/* カメラヒント（左下） */}
        <div className="absolute bottom-3 left-3 text-[9px] px-2.5 py-1.5 rounded-lg"
          style={{
            background: "rgba(6,8,18,0.75)",
            border: "1px solid rgba(20,30,60,0.8)",
            backdropFilter: "blur(6px)",
            color: "#1e2840",
          }}>
          🖱 ドラッグ:回転　スクロール:ズーム
        </div>

        {/* トースト通知（左下） */}
        <div className="absolute flex flex-col items-start gap-1.5 pointer-events-none"
          style={{ bottom: 48, left: 12 }}>
          {toasts.map(t => (
            <div key={t.id}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[10px] font-black"
              style={{
                background: "rgba(4,6,16,0.95)",
                border: `1px solid ${t.color}38`,
                color: t.color,
                backdropFilter: "blur(10px)",
                animation: "toastIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
              {t.icon && <span>{t.icon}</span>}
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* ══ 右30%: コントロールパネル ══ */}
      <div style={{ flex: "0 0 30%", minWidth: 260, maxWidth: 380 }}>
        <ControlPanel
          state={state}
          selectedShop={selectedShop}
          prodStats={prodStats}
          powerGenerated={powerGenerated}
          phaseRemain={phaseRemain}
          showRocketClear={showRocketClear}
          onToggleShop={toggleShop}
          onCancelShop={cancelShop}
          onMineStone={mineStone}
          onMineIron={mineIron}
          onSellStone={sellStone}
          onSellIron={sellIron}
          onBuyUpgrade={buyUpgrade}
          onNewGamePlus={newGamePlus}
          onDismissRocket={() => setShowRocketClear(false)}
        />
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(10px) scale(0.92); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes rocketUp {
          0%  { transform:translateY(20px) scale(0.7); opacity:0; }
          60% { transform:translateY(-10px) scale(1.2); opacity:1; }
          100%{ transform:translateY(0) scale(1); opacity:1; }
        }
        @keyframes twinkle {
          0%,100%{ opacity:0.15; transform:scale(1); }
          50%    { opacity:0.85; transform:scale(1.4); }
        }
        @keyframes pulse {
          from { opacity:0.4; }
          to   { opacity:1; }
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body,#root { width:100%; height:100%; overflow:hidden; }
        body {
          background:#040610;
          -webkit-tap-highlight-color:transparent;
          -webkit-font-smoothing:antialiased;
          user-select:none;
          font-family:'Courier New',Consolas,monospace;
        }
        ::-webkit-scrollbar       { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:#040610; }
        ::-webkit-scrollbar-thumb { background:#141428; border-radius:2px; }
        button { cursor:pointer; transition:opacity .12s,transform .1s; }
        button:disabled { cursor:not-allowed; }
        button:not(:disabled):active { transform:scale(0.96); }
      `}</style>
    </div>
  );
}