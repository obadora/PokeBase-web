export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">PokeBase</h1>
        <p className="text-xl text-center">ポケモンの基地アプリへようこそ</p>
        <div className="flex gap-4">
          <div className="rounded-lg border border-gray-300 p-6">
            <h2 className="text-2xl font-semibold mb-2">開発中</h2>
            <p className="text-gray-600">現在、環境構築が完了しました</p>
          </div>
        </div>
      </main>
    </div>
  );
}
