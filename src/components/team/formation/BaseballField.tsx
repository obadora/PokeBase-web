/**
 * 野球グラウンド型レイアウトコンポーネント
 * ポジションを野球場のダイヤモンド配置で表示
 */

"use client";

import type { Position } from "@/types/position";
import type { TeamMemberWithPokemon } from "@/types/team";
import type { FormationState } from "@/types/formation";
import { FIELD_POSITION_COORDINATES } from "@/types/formation";
import { FieldPosition } from "./FieldPosition";

interface BaseballFieldProps {
  formation: FormationState;
  selectedPosition: Position | null;
  onPositionClick: (position: Position) => void;
}

export function BaseballField({
  formation,
  selectedPosition,
  onPositionClick,
}: BaseballFieldProps) {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* グラウンド背景 */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {/* 芝生部分 */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-green-600" />

        {/* 内野ダイヤモンド */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 外野のアーチ */}
          <path
            d="M 10 30 Q 50 0 90 30"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />

          {/* ダイヤモンド（内野） */}
          <polygon
            points="50,85 78,52 50,40 22,52"
            fill="rgba(210,180,140,0.4)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />

          {/* マウンド */}
          <circle cx="50" cy="58" r="3" fill="rgba(210,180,140,0.6)" />

          {/* ホームベース */}
          <polygon points="50,85 47,82 47,80 53,80 53,82" fill="white" opacity="0.7" />

          {/* 一塁ベース */}
          <rect x="76" y="50" width="4" height="4" fill="white" opacity="0.7" />

          {/* 二塁ベース */}
          <rect x="48" y="38" width="4" height="4" fill="white" opacity="0.7" />

          {/* 三塁ベース */}
          <rect x="20" y="50" width="4" height="4" fill="white" opacity="0.7" />

          {/* ベースライン */}
          <line x1="50" y1="85" x2="78" y2="52" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1="50" y1="85" x2="22" y2="52" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1="78" y1="52" x2="50" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1="22" y1="52" x2="50" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ポジションスロット */}
      {FIELD_POSITION_COORDINATES.map(({ position, x, y }) => {
        const member = formation.starters.get(position) as TeamMemberWithPokemon | null;
        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <FieldPosition
              position={position}
              member={member}
              isSelected={selectedPosition === position}
              onClick={() => onPositionClick(position)}
            />
          </div>
        );
      })}
    </div>
  );
}
