/**
 * チーム詳細ページ
 * チーム情報とメンバー一覧を表示
 */

"use client";

import { useState, useEffect, use, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Team, TeamMemberWithPokemon, Grade } from "@/types/team";
import type { Position } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";
import { GRADE_NAMES_JA } from "@/types/team";
import { getReputationRank, getMemberLimit, getReputationStars, getPointsToNextRank } from "@/types/reputation";
import { getTeamById, getTeamMembers } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { calculateFielderAbility, FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";
import { calculatePitcherAbility, PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";

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
type ViewMode = "grade" | "position";

// コンパクトなメンバーカード
function MemberCard({
  member,
  showGrade,
  onClick,
}: {
  member: TeamMemberWithPokemon;
  showGrade: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-2 rounded-lg border border-gray-100 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
    >
      {/* ポケモン画像 */}
      <div className="w-12 h-12 relative">
        {member.pokemon.sprites.frontDefault && (
          <Image
            src={member.pokemon.sprites.frontDefault}
            alt={member.pokemon.nameJa || member.pokemon.name}
            fill
            sizes="48px"
            className="object-contain"
          />
        )}
      </div>
      {/* ポケモン名 */}
      <span className="text-xs text-gray-800 font-medium truncate w-full text-center">
        {member.pokemon.nameJa || member.pokemon.name}
      </span>
      {/* ポジション or 学年 */}
      <span className="text-[10px] text-gray-500">
        {showGrade
          ? GRADE_NAMES_JA[member.grade]
          : POSITION_NAMES_JA[member.position as Position]}
      </span>
    </button>
  );
}

// メンバー詳細モーダル
function MemberDetailModal({
  member,
  onClose,
}: {
  member: TeamMemberWithPokemon;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isPitcher = member.position === "pitcher";

  // 能力値を計算
  const stats = {
    hp: member.pokemon.stats.hp,
    attack: member.pokemon.stats.attack,
    defense: member.pokemon.stats.defense,
    specialAttack: member.pokemon.stats.specialAttack,
    specialDefense: member.pokemon.stats.specialDefense,
    speed: member.pokemon.stats.speed,
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
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative">
              {member.pokemon.sprites.frontDefault && (
                <Image
                  src={member.pokemon.sprites.frontDefault}
                  alt={member.pokemon.nameJa || member.pokemon.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {member.pokemon.nameJa || member.pokemon.name}
              </h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {POSITION_NAMES_JA[member.position as Position]}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    member.grade === 3
                      ? "bg-red-100 text-red-700"
                      : member.grade === 2
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {GRADE_NAMES_JA[member.grade]}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    className="h-full bg-green-500 rounded-full transition-all"
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
              <div className="font-bold">{member.pokemon.stats.hp}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">攻撃</div>
              <div className="font-bold">{member.pokemon.stats.attack}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">防御</div>
              <div className="font-bold">{member.pokemon.stats.defense}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">特攻</div>
              <div className="font-bold">{member.pokemon.stats.specialAttack}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">特防</div>
              <div className="font-bold">{member.pokemon.stats.specialDefense}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-500">素早</div>
              <div className="font-bold">{member.pokemon.stats.speed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [membersWithPokemon, setMembersWithPokemon] = useState<TeamMemberWithPokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grade");
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithPokemon | null>(null);

  useEffect(() => {
    async function loadTeamData() {
      try {
        // チーム情報を取得
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) {
          throw teamError;
        }
        if (!teamData) {
          throw new Error("チームが見つかりません");
        }
        setTeam(teamData);

        // メンバー情報を取得
        const { data: members, error: membersError } = await getTeamMembers(teamId);
        if (membersError) {
          throw membersError;
        }

        // ポケモンデータを取得してメンバーに紐付け
        const allPokemon = await getAllPokemon();
        const pokemonMap = new Map<number, Pokemon>();
        allPokemon.forEach((p) => pokemonMap.set(p.id, p));

        const membersWithPokemonData: TeamMemberWithPokemon[] = [];
        for (const member of members) {
          const pokemon = pokemonMap.get(member.pokemon_id);
          if (pokemon) {
            membersWithPokemonData.push({
              ...member,
              pokemon,
            });
          }
        }

        setMembersWithPokemon(membersWithPokemonData);
      } catch (err) {
        console.error("Failed to load team:", err);
        setError(err instanceof Error ? err.message : "チームの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadTeamData();
  }, [teamId]);

  // 学年別にグループ化
  const membersByGrade = useMemo(() => {
    const grouped: Record<Grade, TeamMemberWithPokemon[]> = { 3: [], 2: [], 1: [] };
    membersWithPokemon.forEach((member) => {
      grouped[member.grade].push(member);
    });
    // 各学年内でポジション順にソート
    ([3, 2, 1] as Grade[]).forEach((grade) => {
      grouped[grade].sort((a, b) => {
        const orderA = POSITION_ORDER.indexOf(a.position as Position);
        const orderB = POSITION_ORDER.indexOf(b.position as Position);
        return orderA - orderB;
      });
    });
    return grouped;
  }, [membersWithPokemon]);

  // ポジション別にグループ化
  const membersByPosition = useMemo(() => {
    const grouped: Record<Position, TeamMemberWithPokemon[]> = {
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
    membersWithPokemon.forEach((member) => {
      const pos = member.position as Position;
      if (grouped[pos]) {
        grouped[pos].push(member);
      }
    });
    // 各ポジション内で学年順（3年→2年→1年）にソート
    POSITION_ORDER.forEach((pos) => {
      grouped[pos].sort((a, b) => b.grade - a.grade);
    });
    return grouped;
  }, [membersWithPokemon]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">チームが見つかりません</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-800">{team.team_name}</h1>
            <p className="text-sm text-gray-500">
              作成日: {new Date(team.created_at).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>

        {/* 評判・部員数ステータス */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">評判</p>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(getReputationStars(team.reputation))}
                  {"☆".repeat(5 - getReputationStars(team.reputation))}
                </span>
                <span className="font-bold text-gray-800">{team.reputation}pt</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                {getReputationRank(team.reputation)}
              </span>
              {getPointsToNextRank(team.reputation) !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  次のランクまで: {getPointsToNextRank(team.reputation)}pt
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t">
            <div>
              <p className="text-sm text-gray-500">1年生部員数上限</p>
              <p className="font-bold text-gray-800">
                {membersWithPokemon.filter((m) => m.grade === 1).length}/{getMemberLimit(team.reputation)}人
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link
            href={`/team/${teamId}/formation`}
            className="py-3 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            編成
          </Link>
          <Link
            href={`/team/${teamId}/scout`}
            className="py-3 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            スカウト
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href={`/team/${teamId}/match`}
            className="py-3 px-4 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            練習試合
          </Link>
          <Link
            href={`/team/${teamId}/tournament`}
            className="py-3 px-4 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors text-center"
          >
            大会
          </Link>
        </div>

        {/* メンバー一覧 */}
        <div className="space-y-4">
          {/* ヘッダーと切り替えボタン */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              メンバー一覧（{membersWithPokemon.length}人）
            </h2>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode("grade")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "grade"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                学年別
              </button>
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
            </div>
          </div>

          <p className="text-xs text-gray-500">タップして能力を確認</p>

          {membersWithPokemon.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">メンバーがいません</p>
            </div>
          ) : viewMode === "grade" ? (
            // 学年別表示
            <div className="space-y-4">
              {([3, 2, 1] as Grade[]).map((grade) => {
                const members = membersByGrade[grade];
                if (members.length === 0) return null;
                return (
                  <div key={grade} className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          grade === 3
                            ? "bg-red-100 text-red-700"
                            : grade === 2
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {GRADE_NAMES_JA[grade]}
                      </span>
                      <span className="text-gray-400">({members.length}人)</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {members.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          showGrade={false}
                          onClick={() => setSelectedMember(member)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ポジション別表示
            <div className="space-y-4">
              {POSITION_ORDER.map((position) => {
                const members = membersByPosition[position];
                if (members.length === 0) return null;
                return (
                  <div key={position} className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        {POSITION_NAMES_JA[position]}
                      </span>
                      <span className="text-gray-400">({members.length}人)</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {members.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          showGrade={true}
                          onClick={() => setSelectedMember(member)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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
