/**
 * スタメン編成ページ
 * ポジション配置と打順を同一画面で設定
 * メンバータップで能力値を表示
 */

"use client";

import { useState, useEffect, use, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Team, TeamMemberWithPokemon } from "@/types/team";
import type { Position } from "@/types/position";
import type { FormationState, FormationValidationResult } from "@/types/formation";
import { POSITION_NAMES_JA } from "@/types/position";
import {
  getTeamById,
  getTeamMembers,
  updateTeamMembersBatch,
  updateBattingOrder,
} from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import {
  validateFormation,
  initializeFormation,
  formationToUpdateData,
} from "@/lib/utils/formation-validator";
import { BaseballField } from "@/components/team/formation/BaseballField";
import { BenchSection } from "@/components/team/formation/BenchSection";
import { MemberAssignmentModal } from "@/components/team/formation/MemberAssignmentModal";
import { calculateFielderAbility, FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";
import { calculatePitcherAbility, PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";

// 能力値の表示用（コンパクト版：打順リスト用）
// 打順では全員野手能力（ミート、パワー、走力、肩、守備）を表示
function AbilityBarsCompact({ member }: { member: TeamMemberWithPokemon }) {
  const stats = {
    hp: member.pokemon.stats.hp,
    attack: member.pokemon.stats.attack,
    defense: member.pokemon.stats.defense,
    specialAttack: member.pokemon.stats.specialAttack,
    specialDefense: member.pokemon.stats.specialDefense,
    speed: member.pokemon.stats.speed,
  };

  const fielderAbility = calculateFielderAbility(stats);

  // 打順リストでは全員野手能力5項目を表示（スタミナ除く）
  const abilities = [
    { name: "ミ", value: fielderAbility.meet },
    { name: "パ", value: fielderAbility.power },
    { name: "走", value: fielderAbility.speed },
    { name: "肩", value: fielderAbility.arm },
    { name: "守", value: fielderAbility.defense },
  ];

  return (
    <div className="flex gap-1">
      {abilities.map((ability) => (
        <div key={ability.name} className="flex items-center gap-0.5">
          <span className="text-[9px] text-gray-500">{ability.name}</span>
          <span className="text-[10px] font-semibold text-gray-700">{ability.value}</span>
        </div>
      ))}
    </div>
  );
}

// メンバー詳細モーダル（能力値表示）
// 投手でも野手能力を表示（打順確認用）
function MemberDetailModal({
  member,
  onClose,
}: {
  member: TeamMemberWithPokemon;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isPitcher = member.position === "pitcher";

  const stats = {
    hp: member.pokemon.stats.hp,
    attack: member.pokemon.stats.attack,
    defense: member.pokemon.stats.defense,
    specialAttack: member.pokemon.stats.specialAttack,
    specialDefense: member.pokemon.stats.specialDefense,
    speed: member.pokemon.stats.speed,
  };

  const pitcherAbility = calculatePitcherAbility(stats);
  const fielderAbility = calculateFielderAbility(stats);

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
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
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

        {/* 投手能力（投手のみ） */}
        {isPitcher && (
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">投手能力</h4>
            <div className="space-y-1.5">
              {[
                { name: PITCHER_ABILITY_NAMES_JA.velocity, value: pitcherAbility.velocity },
                { name: PITCHER_ABILITY_NAMES_JA.control, value: pitcherAbility.control },
                { name: PITCHER_ABILITY_NAMES_JA.stamina, value: pitcherAbility.stamina },
                { name: PITCHER_ABILITY_NAMES_JA.breaking, value: pitcherAbility.breaking },
              ].map((ability) => (
                <div key={ability.name} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-12">{ability.name}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${ability.value}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{ability.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 野手能力（全員表示） */}
        <div className={`p-4 ${isPitcher ? "border-t" : ""}`}>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">野手能力</h4>
          <div className="space-y-1.5">
            {[
              { name: FIELDER_ABILITY_NAMES_JA.meet, value: fielderAbility.meet },
              { name: FIELDER_ABILITY_NAMES_JA.power, value: fielderAbility.power },
              { name: FIELDER_ABILITY_NAMES_JA.speed, value: fielderAbility.speed },
              { name: FIELDER_ABILITY_NAMES_JA.arm, value: fielderAbility.arm },
              { name: FIELDER_ABILITY_NAMES_JA.defense, value: fielderAbility.defense },
            ].map((ability) => (
              <div key={ability.name} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-12">{ability.name}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${ability.value}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right">{ability.value}</span>
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

interface FormationPageProps {
  params: Promise<{ teamId: string }>;
}

export default function FormationPage({ params }: FormationPageProps) {
  const { teamId } = use(params);

  const [team, setTeam] = useState<Team | null>(null);
  const [formation, setFormation] = useState<FormationState | null>(null);
  const [battingOrder, setBattingOrder] = useState<(TeamMemberWithPokemon | null)[]>(
    Array(9).fill(null)
  );
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedBattingSlot, setSelectedBattingSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<FormationValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [detailMember, setDetailMember] = useState<TeamMemberWithPokemon | null>(null);

  // チームデータを読み込み
  useEffect(() => {
    async function loadTeamData() {
      try {
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) throw teamError;
        if (!teamData) throw new Error("チームが見つかりません");
        setTeam(teamData);

        const { data: members, error: membersError } = await getTeamMembers(teamId);
        if (membersError) throw membersError;

        const allPokemon = await getAllPokemon();
        const pokemonMap = new Map<number, Pokemon>();
        allPokemon.forEach((p) => pokemonMap.set(p.id, p));

        const membersWithPokemon: TeamMemberWithPokemon[] = [];
        for (const member of members) {
          const pokemon = pokemonMap.get(member.pokemon_id);
          if (pokemon) {
            membersWithPokemon.push({ ...member, pokemon });
          }
        }

        // 編成状態を初期化
        const initialFormation = initializeFormation(membersWithPokemon);
        setFormation(initialFormation);

        // 打順を復元
        const newBattingOrder: (TeamMemberWithPokemon | null)[] = Array(9).fill(null);
        membersWithPokemon.forEach((member) => {
          if (member.batting_order && member.batting_order >= 1 && member.batting_order <= 9) {
            newBattingOrder[member.batting_order - 1] = member;
          }
        });
        setBattingOrder(newBattingOrder);

        const result = validateFormation(initialFormation);
        setValidationResult(result);
      } catch (err) {
        console.error("Failed to load team:", err);
        setError(err instanceof Error ? err.message : "チームの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadTeamData();
  }, [teamId]);

  // スタメンリスト
  const starters = useMemo(() => {
    if (!formation) return [];
    const result: TeamMemberWithPokemon[] = [];
    for (const [, member] of formation.starters) {
      if (member) result.push(member);
    }
    return result;
  }, [formation]);

  // 打順に配置されていないスタメン
  const unassignedForBatting = useMemo(() => {
    const assignedIds = new Set(battingOrder.filter((m) => m).map((m) => m!.id));
    return starters.filter((m) => !assignedIds.has(m.id));
  }, [starters, battingOrder]);

  // ポジションクリック
  const handlePositionClick = useCallback((position: Position) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  }, []);

  // ベンチメンバークリック
  const handleBenchMemberClick = useCallback((member: TeamMemberWithPokemon) => {
    setSelectedPosition(member.position as Position);
    setIsModalOpen(true);
  }, []);

  // メンバーをポジションに配置
  const handleAssign = useCallback(
    (member: TeamMemberWithPokemon) => {
      if (!formation || !selectedPosition) return;

      const newFormation: FormationState = {
        starters: new Map(formation.starters),
        bench: [...formation.bench],
      };

      // 現在のメンバーをベンチに
      const currentMember = newFormation.starters.get(selectedPosition);
      if (currentMember) {
        newFormation.bench.push(currentMember);
        // 打順からも削除
        setBattingOrder((prev) => prev.map((m) => (m?.id === currentMember.id ? null : m)));
      }

      newFormation.starters.set(selectedPosition, member);
      newFormation.bench = newFormation.bench.filter((m) => m.id !== member.id);

      setFormation(newFormation);
      const result = validateFormation(newFormation);
      setValidationResult(result);
    },
    [formation, selectedPosition]
  );

  // メンバーをベンチに戻す
  const handleRemove = useCallback(() => {
    if (!formation || !selectedPosition) return;

    const newFormation: FormationState = {
      starters: new Map(formation.starters),
      bench: [...formation.bench],
    };

    const currentMember = newFormation.starters.get(selectedPosition);
    if (currentMember) {
      newFormation.bench.push(currentMember);
      newFormation.starters.set(selectedPosition, null);
      // 打順からも削除
      setBattingOrder((prev) => prev.map((m) => (m?.id === currentMember.id ? null : m)));
    }

    setFormation(newFormation);
    const result = validateFormation(newFormation);
    setValidationResult(result);
  }, [formation, selectedPosition]);

  // 打順スロットクリック
  const handleBattingSlotClick = useCallback((index: number) => {
    setSelectedBattingSlot(index);
  }, []);

  // 打順に配置
  const handleBattingAssign = useCallback(
    (member: TeamMemberWithPokemon) => {
      if (selectedBattingSlot === null) return;

      const newBattingOrder = [...battingOrder];
      // 既存の位置から削除
      const existingIndex = newBattingOrder.findIndex((m) => m?.id === member.id);
      if (existingIndex !== -1) {
        newBattingOrder[existingIndex] = null;
      }
      newBattingOrder[selectedBattingSlot] = member;
      setBattingOrder(newBattingOrder);
      setSelectedBattingSlot(null);
    },
    [selectedBattingSlot, battingOrder]
  );

  // 打順から削除
  const handleBattingRemove = useCallback(
    (index: number) => {
      const newBattingOrder = [...battingOrder];
      newBattingOrder[index] = null;
      setBattingOrder(newBattingOrder);
    },
    [battingOrder]
  );

  // 打順自動設定（ミート+パワー+走力の合計順）
  const handleAutoAssignBatting = useCallback(() => {
    const sortedStarters = [...starters].sort((a, b) => {
      const statsA = {
        hp: a.pokemon.stats.hp,
        attack: a.pokemon.stats.attack,
        defense: a.pokemon.stats.defense,
        specialAttack: a.pokemon.stats.specialAttack,
        specialDefense: a.pokemon.stats.specialDefense,
        speed: a.pokemon.stats.speed,
      };
      const statsB = {
        hp: b.pokemon.stats.hp,
        attack: b.pokemon.stats.attack,
        defense: b.pokemon.stats.defense,
        specialAttack: b.pokemon.stats.specialAttack,
        specialDefense: b.pokemon.stats.specialDefense,
        speed: b.pokemon.stats.speed,
      };
      const abilityA = calculateFielderAbility(statsA);
      const abilityB = calculateFielderAbility(statsB);
      const totalA = abilityA.meet + abilityA.power + abilityA.speed;
      const totalB = abilityB.meet + abilityB.power + abilityB.speed;
      return totalB - totalA;
    });

    const newBattingOrder: (TeamMemberWithPokemon | null)[] = Array(9).fill(null);
    sortedStarters.slice(0, 9).forEach((member, i) => {
      newBattingOrder[i] = member;
    });
    setBattingOrder(newBattingOrder);
  }, [starters]);

  // 保存
  const handleSave = async () => {
    if (!formation || !validationResult?.isValid) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // ポジション更新
      const positionData = formationToUpdateData(formation);
      const { error: posError } = await updateTeamMembersBatch(positionData);
      if (posError) throw posError;

      // 打順更新
      const battingUpdates: { memberId: string; battingOrder: number | null }[] = [];
      starters.forEach((m) => battingUpdates.push({ memberId: m.id, battingOrder: null }));
      battingOrder.forEach((member, index) => {
        if (member) {
          const existing = battingUpdates.find((u) => u.memberId === member.id);
          if (existing) existing.battingOrder = index + 1;
        }
      });
      const { error: batError } = await updateBattingOrder(battingUpdates);
      if (batError) throw batError;

      setSaveMessage({ type: "success", text: "編成を保存しました" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 利用可能なメンバー（ベンチ）
  const getAvailableMembers = useCallback((): TeamMemberWithPokemon[] => {
    if (!formation) return [];
    return formation.bench;
  }, [formation]);

  // 選択中ポジションのメンバー
  const getCurrentMember = useCallback((): TeamMemberWithPokemon | null => {
    if (!formation || !selectedPosition) return null;
    return formation.starters.get(selectedPosition) ?? null;
  }, [formation, selectedPosition]);

  // 打順バリデーション
  const battingIsValid = useMemo(() => {
    return battingOrder.every((m) => m !== null);
  }, [battingOrder]);

  const emptyBattingSlots = useMemo(() => {
    return battingOrder.filter((m) => m === null).length;
  }, [battingOrder]);

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

  if (!team || !formation) {
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-4">
          <Link
            href={`/team/${teamId}`}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
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
            <h1 className="text-xl font-bold text-gray-800">スタメン編成</h1>
            <p className="text-sm text-gray-500">{team.team_name}</p>
          </div>
        </div>

        {/* ポジション配置セクション */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">ポジション配置</h2>
          <BaseballField
            formation={formation}
            selectedPosition={selectedPosition}
            onPositionClick={handlePositionClick}
          />
        </div>

        {/* ベンチセクション */}
        <div className="mb-4">
          <BenchSection members={formation.bench} onMemberClick={handleBenchMemberClick} />
        </div>

        {/* ポジションバリデーション */}
        {validationResult && validationResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <ul className="text-sm text-red-600 space-y-0.5">
              {validationResult.errors.map((err, index) => (
                <li key={index}>• {err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 打順セクション */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">打順</h2>
            <button
              type="button"
              onClick={handleAutoAssignBatting}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              自動設定
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">長押しで能力を確認</p>
          <div className="space-y-2">
            {battingOrder.map((member, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all ${
                  selectedBattingSlot === index
                    ? "border-blue-500 bg-blue-50"
                    : member
                      ? "border-gray-200"
                      : "border-dashed border-gray-300"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {member ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDetailMember(member)}
                      className="w-10 h-10 relative hover:opacity-80 transition-opacity"
                    >
                      {member.pokemon.sprites.frontDefault && (
                        <Image
                          src={member.pokemon.sprites.frontDefault}
                          alt={member.pokemon.nameJa || member.pokemon.name}
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      )}
                    </button>
                    <div
                      className="flex-grow cursor-pointer"
                      onClick={() => setDetailMember(member)}
                    >
                      <p className="font-medium text-gray-800 text-sm">
                        {member.pokemon.nameJa || member.pokemon.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {POSITION_NAMES_JA[member.position as Position]}
                        </span>
                        <AbilityBarsCompact member={member} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBattingRemove(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
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
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBattingSlotClick(index)}
                    className="flex-grow text-left text-sm text-gray-400 hover:text-gray-600"
                  >
                    タップして選手を選択
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 未配置選手（スロット選択時） */}
        {selectedBattingSlot !== null && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedBattingSlot + 1}番打者を選択
              </h2>
              <button
                type="button"
                onClick={() => setSelectedBattingSlot(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
            {unassignedForBatting.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                未配置の選手がいません
              </p>
            ) : (
              <div className="space-y-2">
                {unassignedForBatting.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleBattingAssign(member)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 relative">
                      {member.pokemon.sprites.frontDefault && (
                        <Image
                          src={member.pokemon.sprites.frontDefault}
                          alt={member.pokemon.nameJa || member.pokemon.name}
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-800">
                        {member.pokemon.nameJa || member.pokemon.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {POSITION_NAMES_JA[member.position as Position]}
                        </span>
                        <AbilityBarsCompact member={member} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailMember(member);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 打順バリデーション */}
        {!battingIsValid && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-700">
              あと{emptyBattingSlots}人の打順を設定してください
            </p>
          </div>
        )}

        {/* 保存メッセージ */}
        {saveMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              saveMessage.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !validationResult?.isValid || !battingIsValid}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
            ${
              validationResult?.isValid && battingIsValid
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }
            ${isSaving ? "opacity-50 cursor-wait" : ""}
          `}
        >
          {isSaving ? "保存中..." : "編成を保存"}
        </button>
      </div>

      {/* メンバー割り当てモーダル */}
      {selectedPosition && (
        <MemberAssignmentModal
          isOpen={isModalOpen}
          position={selectedPosition}
          availableMembers={getAvailableMembers()}
          currentMember={getCurrentMember()}
          onAssign={handleAssign}
          onRemove={handleRemove}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPosition(null);
          }}
        />
      )}

      {/* メンバー詳細モーダル */}
      {detailMember && (
        <MemberDetailModal member={detailMember} onClose={() => setDetailMember(null)} />
      )}
    </div>
  );
}
