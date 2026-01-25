/**
 * 試合シミュレーションロジック
 * 自然な野球ルールに基づいた打席シミュレーション
 */

import type { TeamMemberWithPokemon } from "@/types/team";
import type {
  MatchResult,
  InningScore,
  MatchHighlight,
  OpponentTeam,
  TeamPower,
  MatchConfig,
  TeamStats,
} from "@/types/match";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
import {
  simulateGame,
  generateBatterStats,
  generatePitcherStats,
  generateOpponentBatterStats,
  generateOpponentPitcherStats,
  getBatterPower,
  getPitcherPower,
} from "./player-stats";

/**
 * ランダムな整数を生成
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * チームの総合戦力を計算
 */
export function calculateTeamPower(members: TeamMemberWithPokemon[]): TeamPower {
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
    offenseScores.length > 0 ? offenseScores.reduce((a, b) => a + b, 0) / offenseScores.length : 0;

  // 守備力（野手の守備系能力の平均）
  const defenseScores = starters
    .filter((m) => m.position !== "pitcher")
    .map((m) => {
      const ability = calculateFielderAbility(m.pokemon.stats);
      return (ability.defense + ability.arm + ability.speed) / 3;
    });
  const defense =
    defenseScores.length > 0 ? defenseScores.reduce((a, b) => a + b, 0) / defenseScores.length : 0;

  // 投手力
  const pitcher = starters.find((m) => m.position === "pitcher");
  const pitching = pitcher
    ? (() => {
        const ability = calculatePitcherAbility(pitcher.pokemon.stats);
        return (ability.velocity + ability.control + ability.breaking + ability.stamina) / 4;
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
 * 試合ハイライトを生成
 */
function generateHighlights(
  innings: InningScore[],
  teamAName: string,
  teamBName: string
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const highlightTypes: MatchHighlight["type"][] = ["hit", "homerun", "strikeout", "defense"];

  for (const inning of innings) {
    // スキップされたイニングは処理しない
    if (inning.teamASkipped) continue;

    // 得点があったイニングでハイライトを生成
    if (inning.teamAScore > 0) {
      const type =
        inning.teamAScore >= 3
          ? "homerun"
          : highlightTypes[randomInt(0, highlightTypes.length - 1)];
      highlights.push({
        inning: inning.inning,
        description: generateHighlightDescription(type, teamAName, inning.teamAScore),
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
        description: generateHighlightDescription(type, teamBName, inning.teamBScore),
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
 * イニングデータからチームの統計情報を集計
 */
function calculateTeamStatsFromInnings(innings: InningScore[], team: "A" | "B"): TeamStats {
  const runs = innings.reduce((sum, i) => sum + (team === "A" ? i.teamAScore : i.teamBScore), 0);
  const hits = innings.reduce((sum, i) => sum + (team === "A" ? i.teamAHits : i.teamBHits), 0);
  const errors = innings.reduce(
    (sum, i) => sum + (team === "A" ? i.teamAErrors : i.teamBErrors),
    0
  );

  return { runs, hits, errors };
}

/**
 * 試合をシミュレート
 * 自然な野球ルールに基づいた打席シミュレーション
 */
export function simulateMatch(
  teamAMembers: TeamMemberWithPokemon[],
  teamAName: string,
  opponentTeam: OpponentTeam,
  config: MatchConfig = { innings: 9, randomFactor: 5 }
): MatchResult {
  // スターティングメンバーを打順順に取得
  const teamAStarters = teamAMembers
    .filter((m) => m.is_starter)
    .sort((a, b) => (a.batting_order || 99) - (b.batting_order || 99));

  // 投手を取得
  const teamAPitcherMember = teamAStarters.find((m) => m.position === "pitcher");
  const opponentPitcher = opponentTeam.members.find((m) => m.position === "pitcher");

  // 投手の能力値を計算
  const teamAPitcherPower = teamAPitcherMember ? getPitcherPower(teamAPitcherMember) : 50;
  const teamBPitcherPower = opponentPitcher ? opponentPitcher.power : 50;

  // 打者データを準備
  const teamABatterData = teamAStarters.map((member) => ({
    power: getBatterPower(member),
    member,
  }));

  const teamBBatterData = opponentTeam.members.map((member) => ({
    power: member.power,
    member,
  }));

  // 試合をシミュレート（自然な野球ルール）
  const { innings, teamAAtBats, teamBAtBats } = simulateGame(
    teamABatterData,
    teamBBatterData,
    teamAPitcherPower,
    teamBPitcherPower,
    config.innings
  );

  // ハイライトを生成
  const highlights = generateHighlights(innings, teamAName, opponentTeam.name);

  // 最終スコアを集計
  const finalScoreA = innings.reduce((sum, i) => sum + i.teamAScore, 0);
  const finalScoreB = innings.reduce((sum, i) => sum + i.teamBScore, 0);

  // イニングデータからチーム統計を集計
  const teamAStats = calculateTeamStatsFromInnings(innings, "A");
  const teamBStats = calculateTeamStatsFromInnings(innings, "B");

  // 打者成績を生成
  const teamABatters = generateBatterStats(teamAMembers, teamAAtBats);
  const teamBBatters = generateOpponentBatterStats(opponentTeam.members, teamBAtBats);

  // 投手成績を生成（打者成績から導出して整合性を保つ）
  const teamAPitcher = teamAPitcherMember
    ? generatePitcherStats(teamAPitcherMember, innings, teamBBatters)
    : undefined;
  const teamBPitcher = opponentPitcher
    ? generateOpponentPitcherStats(opponentPitcher, innings, teamABatters)
    : undefined;

  // 勝者を判定（引き分けも考慮）
  let winner: "A" | "B" | "draw";
  if (finalScoreA > finalScoreB) {
    winner = "A";
  } else if (finalScoreA < finalScoreB) {
    winner = "B";
  } else {
    winner = "draw";
  }

  return {
    teamAScore: finalScoreA,
    teamBScore: finalScoreB,
    winner,
    innings,
    highlights,
    teamAStats,
    teamBStats,
    teamABatters,
    teamBBatters,
    teamAPitcher,
    teamBPitcher,
  };
}
