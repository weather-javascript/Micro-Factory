// ════════════════════════════════════════════════════════════════════
//  components/ShopBtn.tsx — ショップボタン
// ════════════════════════════════════════════════════════════════════

import React from "react";

interface ShopBtnProps {
  item: string;
  label: string;
  cost: number | null;
  icon: React.ReactNode;
  accent: string;
  selected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  sublabel?: string;
  locked?: boolean;
}

export const ShopBtn: React.FC<ShopBtnProps> = ({
  label, cost, icon, accent, selected, canAfford, onSelect, sublabel, locked = false,
}) => {
  const isDisabled = !canAfford || locked;

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 transition-all duration-150 relative"
      style={{
        background: selected
          ? `${accent}20`
          : locked
          ? "#111118"
          : isDisabled
          ? "#14141c"
          : "#1a1a24",
        border: `1px solid ${selected ? accent : locked ? "#222" : isDisabled ? "#252530" : accent + "50"}`,
        color: selected ? accent : locked ? "#333" : isDisabled ? "#444" : accent,
        opacity: locked ? 0.5 : 1,
        transform: selected ? "scale(0.97)" : "scale(1)",
        boxShadow: selected ? `0 0 8px ${accent}40` : "none",
      }}
    >
      {locked && (
        <div
          className="absolute top-1 right-1 text-[9px]"
          style={{ color: "#555" }}
        >
          🔒
        </div>
      )}
      <span style={{ opacity: locked ? 0.4 : 1 }}>{icon}</span>
      <span className="text-[9px] font-bold leading-none" style={{ opacity: locked ? 0.4 : 1 }}>
        {label}
      </span>
      {cost !== null ? (
        <span
          className="text-[9px] tabular-nums font-medium"
          style={{
            color: selected ? accent + "cc" : isDisabled ? "#333" : accent + "80",
          }}
        >
          {cost}¥
        </span>
      ) : null}
      {sublabel && (
        <span className="text-[8px]" style={{ color: "#44444e", opacity: locked ? 0.4 : 1 }}>
          {sublabel}
        </span>
      )}
    </button>
  );
};
