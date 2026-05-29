// ════════════════════════════════════════════════════════════════════
//  components/Dashboard.tsx — 統計ダッシュボード（リアルタイムグラフ）
// ════════════════════════════════════════════════════════════════════
import React, { useMemo } from "react";
import type { GameState, ProdStats } from "../types";
import { fmt } from "../utils/gameLogic";
import { ROCKET_REQUIREMENTS } from "../constants";

interface Props {
  state:     GameState;
  prodStats: ProdStats;
  powerOk:   boolean;
}

// ─── スパークラインSVG ────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string; w?: number; h?: number }> = ({
  data, color, w = 110, h = 28,
}) => {
  if (data.length < 2) {
    return (
      <svg width={w} height={h}>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={color + "30"} strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const lastX = w;
  const lastY = h - (data[data.length - 1] / max) * (h - 4) - 2;

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={color}/>
    </svg>
  );
};

const StatCard: React.FC<{
  label: string; value: string; unit: string; color: string;
  data: number[]; total?: number; totalLabel?: string;
}> = ({ label, value, unit, color, data, total, totalLabel }) => (
  <div className="rounded-xl px-2.5 py-2" style={{ background: "#1a1a24", border: `1px solid ${color}20` }}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold" style={{ color: "#555" }}>{label}</span>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
        {value}<span className="text-[9px] opacity-60 ml-0.5">{unit}</span>
      </span>
    </div>
    <Sparkline data={data} color={color}/>
    {total !== undefined && totalLabel && (
      <div className="mt-1 text-[9px] tabular-nums" style={{ color: "#444" }}>
        {totalLabel}: {fmt(total)}
      </div>
    )}
  </div>
);

export const Dashboard: React.FC<Props> = ({ state, prodStats, powerOk }) => {
  const {
    statsHistory, totalTime, totalGearsShipped, totalStonesShipped,
    totalIronShipped, totalWasteShipped, money,
    ngPlusBuff,
  } = state;

  const stoneData  = useMemo(() => statsHistory.map(s => s.stoneIn),     [statsHistory]);
  const ironData   = useMemo(() => statsHistory.map(s => s.ironIn),      [statsHistory]);
  const gearData   = useMemo(() => statsHistory.map(s => s.gearShipped), [statsHistory]);
  const incomeData = useMemo(() => statsHistory.map(s => s.income),      [statsHistory]);
  const wasteData  = useMemo(() => statsHistory.map(s => s.wasteIn),     [statsHistory]);

  const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

  const fmtT = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = Math.floor(s % 60);
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${ss}s` : `${ss}s`;
  };

  const rGear  = Math.min(100, (totalGearsShipped / ROCKET_REQUIREMENTS.gear) * 100);
  const rIron  = Math.min(100, (totalIronShipped  / ROCKET_REQUIREMENTS.iron) * 100);
  const rMoney = Math.min(100, (money             / ROCKET_REQUIREMENTS.money) * 100);
  const rAll   = (rGear + rIron + rMoney) / 3;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
        リアルタイム生産統計（直近10秒）
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="石 生産/s"   value={avg(stoneData).toFixed(1)}  unit="/s"  color="#A0AFBF" data={stoneData}  total={totalStonesShipped} totalLabel="累計出荷"/>
        <StatCard label="鉄 生産/s"   value={avg(ironData).toFixed(1)}   unit="/s"  color="#63B3ED" data={ironData}   total={totalIronShipped}  totalLabel="累計出荷"/>
        <StatCard label="収入/s"      value={avg(incomeData).toFixed(1)} unit="¥/s" color="#F5C842" data={incomeData}/>
        <StatCard label="歯車 出荷/s" value={avg(gearData).toFixed(2)}   unit="/s"  color="#e0c070" data={gearData}   total={totalGearsShipped} totalLabel="累計"/>
      </div>

      {/* 廃棄物カード */}
      <div className="rounded-xl px-2.5 py-2" style={{ background: "#1a1010", border: "1px solid #40201020" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold" style={{ color: "#555" }}>☣ 廃棄物</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: "#808020" }}>
            {avg(wasteData).toFixed(2)}<span className="text-[9px] opacity-60 ml-0.5">/s</span>
          </span>
        </div>
        <Sparkline data={wasteData} color="#808020"/>
        <div className="mt-1 text-[9px] tabular-nums" style={{ color: "#444" }}>
          累計ハブ送り: {totalWasteShipped}（処分場で処理推奨）
        </div>
      </div>

      {/* 設備カウント */}
      <div className="rounded-xl px-3 py-2.5" style={{ background: "#1a1a24", border: "1px solid #252535" }}>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#444" }}>設備一覧</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { l: "石ドリル",     v: prodStats.stoneDrillCnt,    c: "#A0AFBF" },
            { l: "鉄ドリル",     v: prodStats.ironDrillCnt,     c: "#63B3ED" },
            { l: "ベルト",       v: prodStats.beltCnt,          c: "#68D391" },
            { l: "ソーラー",     v: prodStats.solarCnt,         c: "#4ade80" },
            { l: "蓄電池",       v: prodStats.batteryCnt,       c: "#a78bfa" },
            { l: "組立機",       v: prodStats.assemblerCnt,     c: "#e0a060" },
            { l: "給水ポンプ",   v: prodStats.waterPumpCnt,     c: "#60c0ff" },
            { l: "蒸気機関",     v: prodStats.steamEngineCnt,   c: "#c060e0" },
            { l: "廃棄物処分場", v: prodStats.wasteDisposalCnt, c: "#806040" },
          ].map(({ l, v, c }) => (
            <div key={l} className="flex justify-between text-xs">
              <span style={{ color: "#555" }}>{l}</span>
              <span style={{ color: v > 0 ? c : "#333" }} className="tabular-nums font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop: "1px solid #1e1e2a" }}>
          <span style={{ color: "#555" }}>電力効率</span>
          <span className="font-bold" style={{ color: prodStats.efficiency >= 1 ? "#4ade80" : "#FC8181" }}>
            {Math.round(prodStats.efficiency * 100)}%{prodStats.efficiency < 1 && " ⚠"}
          </span>
        </div>
      </div>

      {/* ロケット進捗 */}
      <div className="rounded-xl px-3 py-2.5" style={{ background: "#0a1420", border: "1px solid #1a4060" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#2a6090" }}>
            🚀 ロケット打ち上げ進捗
          </div>
          <span className="text-xs font-bold" style={{ color: "#4090c0" }}>{Math.floor(rAll)}%</span>
        </div>
        {[
          { l: "歯車出荷", cur: totalGearsShipped, req: ROCKET_REQUIREMENTS.gear,  pct: rGear,  c: "#e0c070" },
          { l: "鉄出荷",   cur: totalIronShipped,  req: ROCKET_REQUIREMENTS.iron,  pct: rIron,  c: "#63B3ED" },
          { l: "資金",     cur: Math.floor(money),  req: ROCKET_REQUIREMENTS.money, pct: rMoney, c: "#F5C842", pre: "¥" },
        ].map(({ l, cur, req, pct, c, pre }) => (
          <div key={l} className="mb-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px]" style={{ color: "#446" }}>{l}</span>
              <span className="text-[10px] tabular-nums" style={{ color: pct >= 100 ? c : "#446" }}>
                {pre ?? ""}{fmt(cur)} / {pre ?? ""}{fmt(req)}{pct >= 100 && " ✓"}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#111a2a" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100
                    ? `linear-gradient(90deg, ${c}, ${c}cc)`
                    : `linear-gradient(90deg, ${c}50, ${c}80)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* NGPバフ表示 */}
      {ngPlusBuff.cycle > 0 && (
        <div className="rounded-xl px-3 py-2.5" style={{ background: "#0a1a10", border: "1px solid #1a6030" }}>
          <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#2a8040" }}>
            👽 エイリアン技術（周回バフ）
          </div>
          <div className="grid grid-cols-2 gap-y-1 text-xs">
            <span style={{ color: "#446" }}>周回数</span>
            <span className="font-bold tabular-nums" style={{ color: "#4ade80" }}>{ngPlusBuff.cycle}周目</span>
            <span style={{ color: "#446" }}>速度ボーナス</span>
            <span className="font-bold" style={{ color: "#4ade80" }}>×{ngPlusBuff.speedMultiplier.toFixed(1)}</span>
            <span style={{ color: "#446" }}>生産ボーナス</span>
            <span className="font-bold" style={{ color: "#4ade80" }}>×{ngPlusBuff.productionMultiplier.toFixed(1)}</span>
            <span style={{ color: "#446" }}>開始資金</span>
            <span className="font-bold tabular-nums" style={{ color: "#4ade80" }}>¥{ngPlusBuff.startMoney}</span>
          </div>
        </div>
      )}

      {/* 稼働時間 */}
      <div className="rounded-xl px-3 py-2 text-center" style={{ background: "#111118", border: "1px solid #1e1e2a" }}>
        <span className="text-[10px]" style={{ color: "#333" }}>稼働時間: {fmtT(totalTime)}</span>
      </div>
    </div>
  );
};
