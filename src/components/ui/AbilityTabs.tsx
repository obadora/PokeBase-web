/**
 * 野手/投手タブコンポーネント
 * 野手能力と投手能力を切り替え表示
 */

"use client";

import { useState } from "react";

interface AbilityTabsProps {
  fielderContent: React.ReactNode;
  pitcherContent: React.ReactNode;
}

export function AbilityTabs({ fielderContent, pitcherContent }: AbilityTabsProps) {
  const [activeTab, setActiveTab] = useState<"fielder" | "pitcher">("fielder");

  return (
    <div>
      {/* タブヘッダー */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab("fielder")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "fielder"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          野手能力
        </button>
        <button
          onClick={() => setActiveTab("pitcher")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "pitcher"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          投手能力
        </button>
      </div>

      {/* タブコンテンツ */}
      <div>{activeTab === "fielder" ? fielderContent : pitcherContent}</div>
    </div>
  );
}
