"use client";

import type { BatterStats, AtBat } from "@/types/match";
import { AT_BAT_RESULT_LABELS as LABELS } from "@/types/match";

interface BatterStatsTableProps {
  batters: BatterStats[];
  teamName: string;
  innings: number;
}

/**
 * 打者成績表示コンポーネント
 * 打席結果タイムラインと詳細統計を表示
 */
export function BatterStatsTable({
  batters,
  innings,
}: BatterStatsTableProps) {
  return (
    <div className="space-y-4">
      {/* 打席結果タイムライン */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">打席結果</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px] sticky left-0 bg-gray-100 z-10">
                  打者
                </th>
                {Array.from({ length: innings }, (_, i) => (
                  <th
                    key={i}
                    className="border border-gray-300 px-2 py-1 text-center min-w-[32px]"
                  >
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batters.map((batter) => (
                <tr key={batter.playerId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 font-medium sticky left-0 bg-white z-10">
                    <span className="text-gray-400 mr-1">{batter.battingOrder}</span>
                    {batter.playerName}
                    <span className="text-gray-400 text-xs ml-1">
                      ({batter.position})
                    </span>
                  </td>
                  {Array.from({ length: innings }, (_, inningIndex) => {
                    const atBatsInInning = batter.atBats.filter(
                      (ab) => ab.inning === inningIndex + 1
                    );
                    return (
                      <td
                        key={inningIndex}
                        className="border border-gray-300 px-1 py-1 text-center"
                      >
                        {atBatsInInning.map((ab, abIndex) => (
                          <AtBatResultCell key={abIndex} atBat={ab} />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細統計 */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">打撃成績</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px] sticky left-0 bg-gray-100 z-10">
                  打者
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="打席数">
                  打席
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="打数">
                  打数
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="安打">
                  安
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="二塁打">
                  二
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="三塁打">
                  三
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="本塁打">
                  本
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="打点">
                  打点
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="得点">
                  得点
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="三振">
                  三振
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="四球">
                  四球
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="死球">
                  死球
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="犠打">
                  犠打
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="犠飛">
                  犠飛
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="盗塁">
                  盗塁
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="盗塁死">
                  盗死
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center" title="失策">
                  失策
                </th>
              </tr>
            </thead>
            <tbody>
              {batters.map((batter) => (
                <tr key={batter.playerId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 font-medium sticky left-0 bg-white z-10">
                    <span className="text-gray-400 mr-1">{batter.battingOrder}</span>
                    {batter.playerName}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.plateAppearances}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.atBatCount}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-green-600">
                    {batter.hits}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.doubles}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.triples}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-yellow-600">
                    {batter.homeruns}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold">
                    {batter.rbi}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.runs}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center text-red-500">
                    {batter.strikeouts}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.walks}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.hitByPitch}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.sacrificeHits}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.sacrificeFlies}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.stolenBases}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.caughtStealing}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {batter.errors}
                  </td>
                </tr>
              ))}
              {/* 合計行 */}
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-2 py-1 sticky left-0 bg-gray-100 z-10">
                  合計
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.plateAppearances, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.atBatCount, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center text-green-600">
                  {batters.reduce((sum, b) => sum + b.hits, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.doubles, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.triples, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center text-yellow-600">
                  {batters.reduce((sum, b) => sum + b.homeruns, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.rbi, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.runs, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center text-red-500">
                  {batters.reduce((sum, b) => sum + b.strikeouts, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.walks, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.hitByPitch, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.sacrificeHits, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.sacrificeFlies, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.stolenBases, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.caughtStealing, 0)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {batters.reduce((sum, b) => sum + b.errors, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * 打席結果セル
 */
function AtBatResultCell({ atBat }: { atBat: AtBat }) {
  const label = LABELS[atBat.result];

  // 結果に応じた色分け
  const colorClass = getResultColorClass(atBat.result, atBat.rbi > 0);

  // 打点がある場合は数字を付加（内野ゴロでの打点など）
  const rbiLabel = atBat.rbi > 0 ? formatRbi(atBat.rbi) : "";

  return (
    <span className={`inline-block px-1 ${colorClass}`} title={getResultTitle(atBat)}>
      {label}
      {rbiLabel && <span className="text-[10px] align-super">{rbiLabel}</span>}
    </span>
  );
}

/**
 * 打点を丸数字にフォーマット
 */
function formatRbi(rbi: number): string {
  const circledNumbers = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  return circledNumbers[rbi] ?? `(${rbi})`;
}

/**
 * 打席結果の色クラスを取得
 */
function getResultColorClass(result: AtBat["result"], hasRbi: boolean): string {
  switch (result) {
    case "homerun":
      return "text-yellow-600 font-bold";
    case "triple":
    case "double":
    case "single":
      return "text-green-600 font-bold";
    case "strikeout":
      return "text-red-500";
    case "walk":
    case "hitByPitch":
      return "text-blue-500";
    case "error":
      return "text-orange-500";
    case "groundout":
    case "flyout":
    case "sacrifice":
    case "sacrificeFly":
    case "fieldersChoice":
      // 打点がある場合は強調表示
      return hasRbi ? "text-purple-600 font-bold" : "text-gray-600";
    default:
      return "text-gray-600";
  }
}

/**
 * 打席結果のツールチップテキストを取得
 */
function getResultTitle(atBat: AtBat): string {
  const resultNames: Record<AtBat["result"], string> = {
    single: "単打",
    double: "二塁打",
    triple: "三塁打",
    homerun: "本塁打",
    strikeout: "三振",
    groundout: "ゴロアウト",
    flyout: "フライアウト",
    walk: "四球",
    hitByPitch: "死球",
    sacrifice: "犠打",
    sacrificeFly: "犠飛",
    error: "失策",
    fieldersChoice: "野選",
  };

  let title = resultNames[atBat.result];
  if (atBat.rbi > 0) {
    title += ` (${atBat.rbi}打点)`;
  }
  if (atBat.run) {
    title += " (得点)";
  }
  return title;
}
