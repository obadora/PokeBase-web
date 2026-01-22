/**
 * 試合シミュレーションロジック
 * チーム戦力に基づいた試合結果を生成
 */

import type { TeamMemberWithPokemon } from "@/types/team";
import type {
  MatchResult,
  InningScore,
  MatchHighlight,
  OpponentTeam,
  TeamPower,
  MatchConfig,
} from "@/types/match";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";

/**
 * ランダムな整数を生成
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * チームの総合戦力を計算
 */
export function calculateTeamPower(
  members: TeamMemberWithPokemon[]
): TeamPower {
  // スターティングメンバーのみを対象
  const starters = members.filter((m) => m.is_starter);

  if (starters.length === 0) {
    return { total: 0, offense: 0, defense: 0, pitching: 0 };
  }

  // 攻撃力（野手の打撃系能力の平均）
  const offenseScores = starters
    .filter((m) => m.position !== "pitcher")
    .map((m) => {
      const ability = calculateFielderAbility(m.pokemon.stats);
      return (ability.meet + ability.power + ability.speed) / 3;
    });
  const offense =
    offenseScores.length > 0
      ? offenseScores.reduce((a, b) => a + b, 0) / offenseScores.length
      : 0;

  // 守備力（野手の守備系能力の平均）
  const defenseScores = starters
    .filter((m) => m.position !== "pitcher")
    .map((m) => {
      const ability = calculateFielderAbility(m.pokemon.stats);
      return (ability.defense + ability.arm + ability.speed) / 3;
    });
  const defense =
    defenseScores.length > 0
      ? defenseScores.reduce((a, b) => a + b, 0) / defenseScores.length
      : 0;

  // 投手力
  const pitcher = starters.find((m) => m.position === "pitcher");
  const pitching = pitcher
    ? (() => {
        const ability = calculatePitcherAbility(pitcher.pokemon.stats);
        return (
          (ability.velocity + ability.control + ability.breaking + ability.stamina) /
          4
        );
      })()
    : 0;

  // 総合戦力（攻撃30% + 守備30% + 投手40%）
  const total = offense * 0.3 + defense * 0.3 + pitching * 0.4;

  return {
    total: Math.round(total),
    offense: Math.round(offense),
    defense: Math.round(defense),
    pitching: Math.round(pitching),
  };
}

/**
 * イニング別スコアを生成
 */
export function generateInnings(
  teamATotal: number,
  teamBTotal: number,
  inningCount: number = 9
): InningScore[] {
  const innings: InningScore[] = [];
  let remainingA = teamATotal;
  let remainingB = teamBTotal;

  for (let i = 1; i <= inningCount; i++) {
    // 残りイニング数
    const remaining = inningCount - i + 1;

    // 各イニングで取る点数を確率的に分配
    // 後半になるほど得点が入りやすい傾向（疲労による）
    const factor = i <= 3 ? 0.8 : i <= 6 ? 1.0 : 1.2;

    // 期待得点（残り点数を残りイニングで均等分配 + ランダム要素）
    const expectedA = Math.ceil(remainingA / remaining);
    const expectedB = Math.ceil(remainingB / remaining);

    // このイニングの得点（0 から 期待得点*factor の範囲でランダム）
    const inningScoreA = Math.min(
      randomInt(0, Math.ceil(expectedA * factor)),
      remainingA
    );
    const inningScoreB = Math.min(
      randomInt(0, Math.ceil(expectedB * factor)),
      remainingB
    );

    innings.push({
      inning: i,
      teamAScore: inningScoreA,
      teamBScore: inningScoreB,
    });

    remainingA -= inningScoreA;
    remainingB -= inningScoreB;
  }

  // 残りの点数を最終イニングに追加
  if (remainingA > 0 || remainingB > 0) {
    const lastInning = innings[innings.length - 1];
    lastInning.teamAScore += remainingA;
    lastInning.teamBScore += remainingB;
  }

  return innings;
}

/**
 * 試合ハイライトを生成
 */
function generateHighlights(
  innings: InningScore[],
  teamAName: string,
  teamBName: string
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const highlightTypes: MatchHighlight["type"][] = [
    "hit",
    "homerun",
    "strikeout",
    "defense",
  ];

  for (const inning of innings) {
    // 得点があったイニングでハイライトを生成
    if (inning.teamAScore > 0) {
      const type =
        inning.teamAScore >= 3
          ? "homerun"
          : highlightTypes[randomInt(0, highlightTypes.length - 1)];
      highlights.push({
        inning: inning.inning,
        description: generateHighlightDescription(
          type,
          teamAName,
          inning.teamAScore
        ),
        type,
      });
    }

    if (inning.teamBScore > 0) {
      const type =
        inning.teamBScore >= 3
          ? "homerun"
          : highlightTypes[randomInt(0, highlightTypes.length - 1)];
      highlights.push({
        inning: inning.inning,
        description: generateHighlightDescription(
          type,
          teamBName,
          inning.teamBScore
        ),
        type,
      });
    }

    // 無得点のイニングでも時々ハイライトを追加
    if (inning.teamAScore === 0 && inning.teamBScore === 0 && Math.random() < 0.3) {
      const defenseTeam = Math.random() < 0.5 ? teamAName : teamBName;
      highlights.push({
        inning: inning.inning,
        description: `${defenseTeam}のファインプレー！ピンチを脱出`,
        type: "defense",
      });
    }
  }

  return highlights;
}

/**
 * ハイライトの説明文を生成
 */
function generateHighlightDescription(
  type: MatchHighlight["type"],
  teamName: string,
  score: number
): string {
  switch (type) {
    case "homerun":
      return `${teamName}の豪快なホームラン！${score}点追加`;
    case "hit":
      return `${teamName}がタイムリーヒット！${score}点を奪取`;
    case "strikeout":
      return `${teamName}の投手が三振を奪う好投！`;
    case "defense":
      return `${teamName}のファインプレーでピンチを脱出`;
    default:
      return `${teamName}が${score}点を追加`;
  }
}

/**
 * 試合をシミュレート
 */
export function simulateMatch(
  teamAMembers: TeamMemberWithPokemon[],
  teamAName: string,
  opponentTeam: OpponentTeam,
  config: MatchConfig = { innings: 9, randomFactor: 5 }
): MatchResult {
  // チーム戦力を計算
  const teamAPower = calculateTeamPower(teamAMembers);
  const teamBPower = opponentTeam.power;

  // 基礎得点（戦力 / 20）+ ランダム要素（0〜randomFactor）
  const baseScoreA = Math.floor(teamAPower.total / 20);
  const baseScoreB = Math.floor(teamBPower / 20);

  const scoreA = baseScoreA + randomInt(0, config.randomFactor);
  const scoreB = baseScoreB + randomInt(0, config.randomFactor);

  // イニング別スコアを生成
  const innings = generateInnings(scoreA, scoreB, config.innings);

  // ハイライトを生成
  const highlights = generateHighlights(innings, teamAName, opponentTeam.name);

  // 最終スコアを集計
  const finalScoreA = innings.reduce((sum, i) => sum + i.teamAScore, 0);
  const finalScoreB = innings.reduce((sum, i) => sum + i.teamBScore, 0);

  return {
    teamAScore: finalScoreA,
    teamBScore: finalScoreB,
    winner: finalScoreA > finalScoreB ? "A" : "B",
    innings,
    highlights,
  };
}
