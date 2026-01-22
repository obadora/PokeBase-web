/**
 * 対戦相手チーム生成ロジック
 * 自チームの戦力に応じた対戦相手を生成
 */

import type { Position } from "@/types/position";
import type { OpponentTeam, OpponentMember } from "@/types/match";
import { OPPONENT_TEAM_NAMES } from "@/types/match";
import { POSITION_NAMES_JA } from "@/types/position";

/**
 * ランダムな整数を生成
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 配列からランダムに要素を取得
 */
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * 対戦相手の名前を生成
 */
function generateOpponentName(position: Position): string {
  const prefixes = [
    "山田",
    "田中",
    "佐藤",
    "鈴木",
    "高橋",
    "渡辺",
    "伊藤",
    "中村",
    "小林",
    "加藤",
    "吉田",
    "松本",
    "井上",
    "木村",
    "林",
    "斎藤",
    "清水",
    "山本",
    "阿部",
    "森",
    "池田",
    "橋本",
    "石川",
    "前田",
    "後藤",
    "岡田",
    "藤田",
    "青木",
    "石井",
    "近藤",
  ];
  return `${randomElement(prefixes)}（${POSITION_NAMES_JA[position]}）`;
}

/**
 * 対戦相手チームを生成
 * @param teamPower 自チームの戦力（これを基準に相手の強さを決定）
 * @param difficulty 難易度調整（0.5 = 弱い, 1.0 = 同等, 1.5 = 強い）
 */
export function generateOpponentTeam(
  teamPower: number,
  difficulty: number = 1.0
): OpponentTeam {
  const teamName = randomElement(OPPONENT_TEAM_NAMES);

  // 相手チームの戦力を計算（自チーム戦力 × 難易度 × ランダム係数）
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8〜1.2
  const opponentPower = Math.round(teamPower * difficulty * randomFactor);

  // 9人のメンバーを生成
  const positions: Position[] = [
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

  const members: OpponentMember[] = positions.map((position) => {
    // 各メンバーの能力はチーム平均からばらつきを持たせる
    const memberPower = Math.round(
      opponentPower * (0.7 + Math.random() * 0.6) // 70%〜130%のばらつき
    );

    return {
      name: generateOpponentName(position),
      position,
      power: Math.max(10, Math.min(100, memberPower)), // 10〜100の範囲に収める
    };
  });

  return {
    name: teamName,
    power: opponentPower,
    members,
  };
}

/**
 * 大会ラウンドに応じた難易度を取得
 * @param round 大会のラウンド（1回戦、2回戦...）
 * @param tournamentType 大会タイプ
 */
export function getDifficultyByRound(
  round: number,
  tournamentType: "district" | "regional" | "national"
): number {
  // 大会タイプによる基本難易度
  const baseDifficulty =
    tournamentType === "national"
      ? 1.2
      : tournamentType === "regional"
        ? 1.0
        : 0.8;

  // ラウンドが進むごとに難易度上昇
  const roundBonus = (round - 1) * 0.1;

  return baseDifficulty + roundBonus;
}

/**
 * ランダムマッチ（練習試合）用の対戦相手を生成
 */
export function generateRandomOpponent(teamPower: number): OpponentTeam {
  // 練習試合は難易度にばらつきを持たせる
  const difficulty = 0.6 + Math.random() * 0.8; // 0.6〜1.4
  return generateOpponentTeam(teamPower, difficulty);
}
