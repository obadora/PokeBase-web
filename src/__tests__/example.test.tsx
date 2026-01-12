/**
 * サンプルテストファイル
 * Jestのセットアップが正しく動作するか確認
 */

import { render, screen } from "@testing-library/react";

// シンプルなテストコンポーネント
function TestComponent() {
  return <div>Hello, Test!</div>;
}

describe("サンプルテスト", () => {
  it("テストコンポーネントが正しくレンダリングされる", () => {
    render(<TestComponent />);
    expect(screen.getByText("Hello, Test!")).toBeInTheDocument();
  });

  it("基本的な計算が正しく動作する", () => {
    expect(1 + 1).toBe(2);
  });
});
