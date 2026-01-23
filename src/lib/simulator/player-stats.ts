/**
 * 打者・投手の個人成績シミュレーション
 * 自然な野球ルールに基づいた打席シミュレーション
 */

import type { TeamMemberWithPokemon } from "@/types/team";
import type {
  AtBat,
  AtBatResult,
  BatterStats,
  PitcherStats,
  InningScore,
  OpponentMember,
} from "@/types/match";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
import { POSITION_NAMES_JA } from "@/types/position";

/**
 * 加重ランダム選択
 */
function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;

  for (const option of options) {
    random -= option.weight;
    if (random <= 0) {
      return option.value;
    }
  }

  return options[options.length - 1].value;
}

/**
 * 打者の能力値に基づいて打席結果の確率分布を計算
 */
function getAtBatResultDistribution(
  batterPower: number,
  pitcherPower: number,
  outs: number,
  runnersOnBase: number
): { value: AtBatResult; weight: number }[] {
  // 打者優位度（0.5〜1.5）
  const advantage = Math.max(
    0.5,
    Math.min(1.5, batterPower / (pitcherPower || 1))
  );

  // 基本確率（打者優位度で調整）
  const hitRate = 0.25 * advantage;
  const homerunRate = 0.03 * advantage;
  const doubleRate = 0.05 * advantage;
  const tripleRate = 0.01 * advantage;
  const walkRate = 0.08 + (advantage - 1) * 0.02;
  const strikeoutRate = 0.2 / advantage;

  // 犠打・犠飛は状況に応じて（2アウト未満かつ走者ありの時のみ）
  const canSacrifice = outs < 2 && runnersOnBase > 0;
  const sacrificeWeight = canSacrifice ? 0.02 : 0;
  const sacrificeFlyWeight = canSacrifice ? 0.02 : 0;

  return [
    {
      value: "single",
      weight: hitRate - homerunRate - doubleRate - tripleRate,
    },
    { value: "double", weight: doubleRate },
    { value: "triple", weight: tripleRate },
    { value: "homerun", weight: homerunRate },
    { value: "strikeout", weight: strikeoutRate },
    { value: "groundout", weight: 0.25 },
    { value: "flyout", weight: 0.2 },
    { value: "walk", weight: walkRate },
    { value: "hitByPitch", weight: 0.01 },
    { value: "sacrifice", weight: sacrificeWeight },
    { value: "sacrificeFly", weight: sacrificeFlyWeight },
    { value: "error", weight: 0.02 },
    { value: "fieldersChoice", weight: 0.02 },
  ];
}

/**
 * 打席結果がヒットかどうか判定
 */
function isHit(result: AtBatResult): boolean {
  return ["single", "double", "triple", "homerun"].includes(result);
}

/**
 * 打席結果が打数にカウントされるか判定
 */
function countsAsAtBat(result: AtBatResult): boolean {
  return !["walk", "hitByPitch", "sacrifice", "sacrificeFly"].includes(result);
}

/**
 * 打席結果がアウトになるか判定
 */
function isOut(result: AtBatResult): boolean {
  return [
    "strikeout",
    "groundout",
    "flyout",
    "fieldersChoice",
    "sacrifice",
    "sacrificeFly",
  ].includes(result);
}

/** イニングシミュレーション結果 */
interface InningSimulationResult {
  runs: number;
  hits: number;
  errors: number;
  atBatsByBatter: AtBat[][];
}

/**
 * 1イニングをシミュレート（自然な野球ルール）
 */
function simulateInning(
  batterData: { power: number }[],
  pitcherPower: number,
  startBatterIndex: number,
  inningNumber: number
): { result: InningSimulationResult; nextBatterIndex: number } {
  let outs = 0;
  let runs = 0;
  let hits = 0;
  let errors = 0;
  let runnersOnBase = 0; // 簡易的な走者管理（0-3）
  let currentBatterIndex = startBatterIndex;

  const atBatsByBatter: AtBat[][] = batterData.map(() => []);

  // 3アウトになるまで打席を回す
  while (outs < 3) {
    const batterIndex = currentBatterIndex % batterData.length;
    const batter = batterData[batterIndex];

    // 打席結果の確率分布を取得（状況に応じて犠打・犠飛の確率を調整）
    const distribution = getAtBatResultDistribution(
      batter.power,
      pitcherPower,
      outs,
      runnersOnBase
    );

    // 打席結果を生成
    const result = weightedRandom(distribution);

    // アウトカウント更新
    if (isOut(result)) {
      outs++;
    }

    // 打点と得点計算
    let rbi = 0;
    let scoredRun = false;

    if (result === "homerun") {
      // ホームラン：打者＋走者全員得点
      hits++;
      rbi = 1 + runnersOnBase;
      runs += rbi;
      scoredRun = true;
      runnersOnBase = 0;
    } else if (isHit(result)) {
      hits++;
      // ヒット：走者の進塁と得点
      if (result === "triple") {
        // 三塁打：走者全員生還
        rbi = runnersOnBase;
        runs += rbi;
        runnersOnBase = 1;
      } else if (result === "double") {
        // 二塁打：二塁以降の走者生還
        const scoringRunners = Math.min(runnersOnBase, 2);
        if (runnersOnBase > 0 && Math.random() < 0.7) {
          rbi = scoringRunners;
          runs += rbi;
          runnersOnBase = Math.max(0, runnersOnBase - scoringRunners) + 1;
        } else {
          runnersOnBase = Math.min(3, runnersOnBase + 1);
        }
      } else {
        // 単打
        if (runnersOnBase > 0 && Math.random() < 0.35) {
          rbi = 1;
          runs += 1;
          runnersOnBase = Math.min(3, runnersOnBase); // 走者が1人減って打者が出塁
        } else {
          runnersOnBase = Math.min(3, runnersOnBase + 1);
        }
      }
    } else if (result === "walk" || result === "hitByPitch") {
      // 四球・死球：満塁なら押し出し
      if (runnersOnBase >= 3) {
        rbi = 1;
        runs++;
      }
      runnersOnBase = Math.min(3, runnersOnBase + 1);
    } else if (result === "sacrificeFly" && runnersOnBase > 0) {
      // 犠牲フライ：三塁走者が生還
      rbi = 1;
      runs++;
      runnersOnBase = Math.max(0, runnersOnBase - 1);
    } else if (result === "sacrifice" && runnersOnBase > 0) {
      // 犠打：走者進塁（得点なし、走者数は変わらない）
      // 三塁に走者がいれば得点の可能性
      if (runnersOnBase >= 2 && Math.random() < 0.3) {
        rbi = 1;
        runs++;
        runnersOnBase = Math.max(0, runnersOnBase - 1);
      }
    } else if (result === "error") {
      errors++;
      // エラー：出塁（ヒットと同様の扱い）
      if (runnersOnBase > 0 && Math.random() < 0.3) {
        runs++;
      }
      runnersOnBase = Math.min(3, runnersOnBase + 1);
    } else if (result === "fieldersChoice") {
      // フィルダースチョイス：走者アウトで打者出塁
      // 走者数は変わらない（1人アウト、1人出塁）
    }

    atBatsByBatter[batterIndex].push({
      inning: inningNumber,
      result,
      rpiChance: runnersOnBase > 0,
      rbi,
      run: scoredRun,
      stolenBase: false,
      caughtStealing: false,
    });

    currentBatterIndex++;

    // 無限ループ防止
    if (currentBatterIndex - startBatterIndex > 20) break;
  }

  return {
    result: { runs, hits, errors, atBatsByBatter },
    nextBatterIndex: currentBatterIndex,
  };
}

/**
 * 試合全体をシミュレートして打者成績とイニングスコアを生成
 */
export function simulateGame(
  teamABatters: { power: number; member: TeamMemberWithPokemon }[],
  teamBBatters: { power: number; member: OpponentMember }[],
  teamAPitcherPower: number,
  teamBPitcherPower: number,
  inningCount: number = 9
): {
  innings: InningScore[];
  teamAAtBats: AtBat[][];
  teamBAtBats: AtBat[][];
} {
  const innings: InningScore[] = [];
  let teamABatterIndex = 0;
  let teamBBatterIndex = 0;

  // 各打者の打席結果を格納
  const teamAAtBats: AtBat[][] = teamABatters.map(() => []);
  const teamBAtBats: AtBat[][] = teamBBatters.map(() => []);

  // 累積スコア（9回裏の判定用）
  let teamATotal = 0;
  let teamBTotal = 0;

  for (let i = 1; i <= inningCount; i++) {
    // 先攻（teamB）の攻撃（表）
    const teamBResult = simulateInning(
      teamBBatters.map((b) => ({ power: b.power })),
      teamAPitcherPower,
      teamBBatterIndex,
      i
    );
    teamBBatterIndex = teamBResult.nextBatterIndex;

    // teamBの打席結果をマージ
    teamBResult.result.atBatsByBatter.forEach((atBats, idx) => {
      teamBAtBats[idx].push(...atBats);
    });

    teamBTotal += teamBResult.result.runs;

    // 9回裏：後攻（teamA）がリードしていれば攻撃なし
    const isNinthInning = i === inningCount && inningCount >= 9;
    const teamASkipped = isNinthInning && teamATotal > teamBTotal;

    let teamAResult: InningSimulationResult;

    if (teamASkipped) {
      // 9回裏スキップ
      teamAResult = { runs: 0, hits: 0, errors: 0, atBatsByBatter: [] };
    } else {
      // 後攻（teamA）の攻撃（裏）
      const result = simulateInning(
        teamABatters.map((b) => ({ power: b.power })),
        teamBPitcherPower,
        teamABatterIndex,
        i
      );
      teamABatterIndex = result.nextBatterIndex;
      teamAResult = result.result;

      // teamAの打席結果をマージ
      result.result.atBatsByBatter.forEach((atBats, idx) => {
        teamAAtBats[idx].push(...atBats);
      });

      teamATotal += teamAResult.runs;
    }

    innings.push({
      inning: i,
      teamAScore: teamAResult.runs,
      teamBScore: teamBResult.result.runs,
      teamAHits: teamAResult.hits,
      teamBHits: teamBResult.result.hits,
      teamAErrors: teamAResult.errors,
      teamBErrors: teamBResult.result.errors,
      teamASkipped: teamASkipped || undefined,
    });
  }

  return { innings, teamAAtBats, teamBAtBats };
}

/**
 * 打者の成績を集計
 */
function aggregateBatterStats(
  playerId: string,
  playerName: string,
  position: string,
  battingOrder: number,
  atBats: AtBat[]
): BatterStats {
  const plateAppearances = atBats.length;
  const atBatCount = atBats.filter((ab) => countsAsAtBat(ab.result)).length;
  const hitsCount = atBats.filter((ab) => isHit(ab.result)).length;
  const doubles = atBats.filter((ab) => ab.result === "double").length;
  const triples = atBats.filter((ab) => ab.result === "triple").length;
  const homeruns = atBats.filter((ab) => ab.result === "homerun").length;
  const rbi = atBats.reduce((sum, ab) => sum + ab.rbi, 0);
  const runs = atBats.filter((ab) => ab.run).length;
  const strikeouts = atBats.filter((ab) => ab.result === "strikeout").length;
  const walks = atBats.filter((ab) => ab.result === "walk").length;
  const hitByPitch = atBats.filter((ab) => ab.result === "hitByPitch").length;
  const sacrificeHits = atBats.filter((ab) => ab.result === "sacrifice").length;
  const sacrificeFlies = atBats.filter(
    (ab) => ab.result === "sacrificeFly"
  ).length;
  const stolenBases = atBats.filter((ab) => ab.stolenBase).length;
  const caughtStealing = atBats.filter((ab) => ab.caughtStealing).length;
  const errorsCount = atBats.filter((ab) => ab.result === "error").length;

  return {
    playerId,
    playerName,
    position,
    battingOrder,
    atBats,
    plateAppearances,
    atBatCount,
    hits: hitsCount,
    doubles,
    triples,
    homeruns,
    rbi,
    runs,
    strikeouts,
    walks,
    hitByPitch,
    sacrificeHits,
    sacrificeFlies,
    stolenBases,
    caughtStealing,
    errors: errorsCount,
  };
}

/**
 * 自チームの打者成績を生成
 */
export function generateBatterStats(
  members: TeamMemberWithPokemon[],
  atBatsByBatter: AtBat[][]
): BatterStats[] {
  const batters = members
    .filter((m) => m.is_starter)
    .sort((a, b) => (a.batting_order || 99) - (b.batting_order || 99));

  return batters.map((batter, index) => {
    const position =
      POSITION_NAMES_JA[batter.position as keyof typeof POSITION_NAMES_JA] ||
      batter.position;
    return aggregateBatterStats(
      batter.id,
      batter.pokemon.nameJa || batter.pokemon.name,
      position,
      batter.batting_order || index + 1,
      atBatsByBatter[index] || []
    );
  });
}

/**
 * 相手チームの打者成績を生成
 */
export function generateOpponentBatterStats(
  opponentMembers: OpponentMember[],
  atBatsByBatter: AtBat[][]
): BatterStats[] {
  return opponentMembers.map((member, index) => {
    const position = POSITION_NAMES_JA[member.position] || member.position;
    return aggregateBatterStats(
      `opponent-${index}`,
      member.name,
      position,
      index + 1,
      atBatsByBatter[index] || []
    );
  });
}

/**
 * 投手の試合成績を生成（打者成績から導出）
 */
export function generatePitcherStats(
  pitcher: TeamMemberWithPokemon,
  innings: InningScore[],
  opponentBatterStats: BatterStats[]
): PitcherStats {
  // 投球回数（9回裏スキップの場合も9回投げたとカウント）
  const inningsPitched = innings.length;
  const inningsPitchedDisplay = `${inningsPitched}.0`;

  // 打者成績から投手成績を集計
  const battersFaced = opponentBatterStats.reduce(
    (sum, b) => sum + b.plateAppearances,
    0
  );
  const hits = opponentBatterStats.reduce((sum, b) => sum + b.hits, 0);
  const homeruns = opponentBatterStats.reduce((sum, b) => sum + b.homeruns, 0);
  const strikeouts = opponentBatterStats.reduce(
    (sum, b) => sum + b.strikeouts,
    0
  );
  const walks = opponentBatterStats.reduce((sum, b) => sum + b.walks, 0);
  const hitByPitch = opponentBatterStats.reduce(
    (sum, b) => sum + b.hitByPitch,
    0
  );

  // 失点はイニングスコアから集計（相手チームの得点）
  const runs = innings.reduce((sum, i) => sum + i.teamBScore, 0);

  // 自責点（失点の70-100%）
  const earnedRunRate = 0.7 + Math.random() * 0.3;
  const earnedRuns = Math.floor(runs * earnedRunRate);

  // 球数（対戦打者数 × 約3.5〜4.5球）
  const pitchCount = Math.floor(battersFaced * (3.5 + Math.random()));

  // 暴投（ランダム）
  const wildPitches = Math.random() < 0.2 ? 1 : 0;

  return {
    playerId: pitcher.id,
    playerName: pitcher.pokemon.nameJa || pitcher.pokemon.name,
    inningsPitched,
    inningsPitchedDisplay,
    battersFaced,
    pitchCount,
    hits,
    homeruns,
    strikeouts,
    walks,
    hitByPitch,
    wildPitches,
    runs,
    earnedRuns,
  };
}

/**
 * 相手チームの投手成績を生成（打者成績から導出）
 */
export function generateOpponentPitcherStats(
  opponentPitcher: OpponentMember,
  innings: InningScore[],
  teamABatterStats: BatterStats[]
): PitcherStats {
  // 投球回数（9回裏スキップの場合は実際に投げた回数）
  const inningsPitched = innings.filter((i) => !i.teamASkipped).length;

  // 打者成績から投手成績を集計
  const battersFaced = teamABatterStats.reduce(
    (sum, b) => sum + b.plateAppearances,
    0
  );
  const hits = teamABatterStats.reduce((sum, b) => sum + b.hits, 0);
  const homeruns = teamABatterStats.reduce((sum, b) => sum + b.homeruns, 0);
  const strikeouts = teamABatterStats.reduce((sum, b) => sum + b.strikeouts, 0);
  const walks = teamABatterStats.reduce((sum, b) => sum + b.walks, 0);
  const hitByPitch = teamABatterStats.reduce((sum, b) => sum + b.hitByPitch, 0);

  // 失点はイニングスコアから集計（自チームの得点）
  const runs = innings.reduce((sum, i) => sum + i.teamAScore, 0);

  // 自責点（失点の70-100%）
  const earnedRunRate = 0.7 + Math.random() * 0.3;
  const earnedRuns = Math.floor(runs * earnedRunRate);

  // 球数（対戦打者数 × 約3.5〜4.5球）
  const pitchCount = Math.floor(battersFaced * (3.5 + Math.random()));

  // 暴投（ランダム）
  const wildPitches = Math.random() < 0.2 ? 1 : 0;

  return {
    playerId: "opponent-pitcher",
    playerName: opponentPitcher.name,
    inningsPitched,
    inningsPitchedDisplay: `${inningsPitched}.0`,
    battersFaced,
    pitchCount,
    hits,
    homeruns,
    strikeouts,
    walks,
    hitByPitch,
    wildPitches,
    runs,
    earnedRuns,
  };
}

/**
 * 打者の能力値を計算
 */
export function getBatterPower(member: TeamMemberWithPokemon): number {
  if (member.position === "pitcher") {
    const ability = calculatePitcherAbility(member.pokemon.stats);
    return ability.velocity * 0.3;
  } else {
    const ability = calculateFielderAbility(member.pokemon.stats);
    return (ability.meet + ability.power) / 2;
  }
}

/**
 * 投手の能力値を計算
 */
export function getPitcherPower(member: TeamMemberWithPokemon): number {
  const ability = calculatePitcherAbility(member.pokemon.stats);
  return (ability.velocity + ability.control + ability.breaking) / 3;
}
