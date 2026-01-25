/**
 * 対戦相手チーム詳細コンポーネント
 * 自チームと同じ形式で対戦相手チームの全メンバーと能力値を表示
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { OpponentTeam, OpponentMember } from "@/types/opponent";
import type { Position } from "@/types/position";
import { TYPE_NAMES_JA, TYPE_COLORS } from "@/types";
import { POSITION_NAMES_JA } from "@/types/position";
import { calculatePitcherAbility, PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";
import { calculateFielderAbility, FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";

// ポジションの表示順序
const POSITION_ORDER: Position[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
];

// 表示モード
type ViewMode = "position" | "batting";

interface OpponentTeamDetailProps {
  team: OpponentTeam;
  onClose?: () => void;
}

// コンパクトなメンバーカード（タップで詳細表示）
function MemberCard({
  member,
  showPosition,
  onClick,
}: {
  member: OpponentMember;
  showPosition: boolean;
  onClick: () => void;
}) {
  const { pokemon, position, battingOrder } = member;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-2 rounded-lg border border-gray-100 hover:border-red-400 hover:bg-red-50 transition-colors cursor-pointer"
    >
      {/* ポケモン画像 */}
      <div className="w-12 h-12 relative">
        {pokemon.sprites.frontDefault && (
          <Image
            src={pokemon.sprites.frontDefault}
            alt={pokemon.nameJa || pokemon.name}
            fill
            sizes="48px"
            className="object-contain"
          />
        )}
      </div>
      {/* ポケモン名 */}
      <span className="text-xs text-gray-800 font-medium truncate w-full text-center">
        {pokemon.nameJa || pokemon.name}
      </span>
      {/* ポジション or 打順 */}
      <span className="text-[10px] text-gray-500">
        {showPosition ? POSITION_NAMES_JA[position] : `${battingOrder}番`}
      </span>
    </button>
  );
}

// メンバー詳細モーダル
function MemberDetailModal({ member, onClose }: { member: OpponentMember; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { pokemon, position, battingOrder } = member;
  const isPitcher = position === "pitcher";

  // 能力値を計算
  const stats = {
    hp: pokemon.stats.hp,
    attack: pokemon.stats.attack,
    defense: pokemon.stats.defense,
    specialAttack: pokemon.stats.specialAttack,
    specialDefense: pokemon.stats.specialDefense,
    speed: pokemon.stats.speed,
  };

  const abilities = isPitcher
    ? (() => {
        const pitcherAbility = calculatePitcherAbility(stats);
        return [
          { name: PITCHER_ABILITY_NAMES_JA.velocity, value: pitcherAbility.velocity },
          { name: PITCHER_ABILITY_NAMES_JA.control, value: pitcherAbility.control },
          { name: PITCHER_ABILITY_NAMES_JA.stamina, value: pitcherAbility.stamina },
          { name: PITCHER_ABILITY_NAMES_JA.breaking, value: pitcherAbility.breaking },
        ];
      })()
    : (() => {
        const fielderAbility = calculateFielderAbility(stats);
        return [
          { name: FIELDER_ABILITY_NAMES_JA.meet, value: fielderAbility.meet },
          { name: FIELDER_ABILITY_NAMES_JA.power, value: fielderAbility.power },
          { name: FIELDER_ABILITY_NAMES_JA.speed, value: fielderAbility.speed },
          { name: FIELDER_ABILITY_NAMES_JA.arm, value: fielderAbility.arm },
          { name: FIELDER_ABILITY_NAMES_JA.defense, value: fielderAbility.defense },
          { name: FIELDER_ABILITY_NAMES_JA.stamina, value: fielderAbility.stamina },
        ];
      })();

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative">
              {pokemon.sprites.frontDefault && (
                <Image
                  src={pokemon.sprites.frontDefault}
                  alt={pokemon.nameJa || pokemon.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{pokemon.nameJa || pokemon.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {POSITION_NAMES_JA[position]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {battingOrder}番打者
                </span>
              </div>
              {/* タイプ */}
              <div className="flex gap-1 mt-1">
                {pokemon.types.map((t) => (
                  <span
                    key={t.slot}
                    className="px-2 py-0.5 text-white rounded text-xs"
                    style={{ backgroundColor: TYPE_COLORS[t.typeName] || "#9CA3AF" }}
                  >
                    {TYPE_NAMES_JA[t.typeName] || t.typeName}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 能力値 */}
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {isPitcher ? "投手能力" : "野手能力"}
          </h4>
          <div className="space-y-2">
            {abilities.map((ability) => (
              <div key={ability.name} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-16">{ability.name}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${ability.value}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                  {ability.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 種族値 */}
        <div className="p-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">種族値</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">HP</div>
              <div className="font-bold">{pokemon.stats.hp}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">攻撃</div>
              <div className="font-bold">{pokemon.stats.attack}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">防御</div>
              <div className="font-bold">{pokemon.stats.defense}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">特攻</div>
              <div className="font-bold">{pokemon.stats.specialAttack}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">特防</div>
              <div className="font-bold">{pokemon.stats.specialDefense}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">素早</div>
              <div className="font-bold">{pokemon.stats.speed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpponentTeamDetail({ team, onClose }: OpponentTeamDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("position");
  const [selectedMember, setSelectedMember] = useState<OpponentMember | null>(null);

  // ポジション別にグループ化
  const membersByPosition: Record<Position, OpponentMember[]> = {
    pitcher: [],
    catcher: [],
    first: [],
    second: [],
    third: [],
    short: [],
    left: [],
    center: [],
    right: [],
  };

  team.members.forEach((member) => {
    if (membersByPosition[member.position]) {
      membersByPosition[member.position].push(member);
    }
  });

  // 打順でソート
  const membersByBattingOrder = [...team.members].sort((a, b) => a.battingOrder - b.battingOrder);

  return (
    <div className="bg-white rounded-xl shadow-xl">
      {/* ヘッダー */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{team.name}</h2>
            {team.type && (
              <span
                className="inline-block mt-2 px-3 py-1 text-white rounded-full text-sm font-semibold"
                style={{ backgroundColor: TYPE_COLORS[team.type] || "#9CA3AF" }}
              >
                {TYPE_NAMES_JA[team.type] || team.type}タイプ統一
              </span>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* チーム統計 */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">チーム平均能力値</p>
            <p className="text-2xl font-bold text-gray-800">{team.averageStats}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">シード</p>
            <p className="text-2xl font-bold text-gray-800">#{team.seed}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">選手数</p>
            <p className="text-2xl font-bold text-gray-800">{team.members.length}人</p>
          </div>
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="p-6">
        {/* ヘッダーと切り替えボタン */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">メンバー一覧</h3>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode("position")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "position"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ポジション別
            </button>
            <button
              type="button"
              onClick={() => setViewMode("batting")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "batting"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              打順
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">タップして能力を確認</p>

        <div className="max-h-[50vh] overflow-y-auto space-y-4">
          {viewMode === "position" ? (
            // ポジション別表示
            <>
              {POSITION_ORDER.map((position) => {
                const members = membersByPosition[position];
                if (members.length === 0) return null;
                return (
                  <div key={position} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        {POSITION_NAMES_JA[position]}
                      </span>
                      <span className="text-gray-400">({members.length}人)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {members.map((member, index) => (
                        <MemberCard
                          key={index}
                          member={member}
                          showPosition={false}
                          onClick={() => setSelectedMember(member)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            // 打順表示
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">打順</h4>
              <div className="grid grid-cols-3 gap-2">
                {membersByBattingOrder.map((member, index) => (
                  <MemberCard
                    key={index}
                    member={member}
                    showPosition={true}
                    onClick={() => setSelectedMember(member)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* メンバー詳細モーダル */}
      {selectedMember && (
        <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}
