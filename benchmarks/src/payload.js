export const SAMPLE_TURN_ASSISTANT = `前回の続きとして、モバイル環境で処理落ちが発生しやすい箇所の整理です。

\`\`\`typescript
interface StreamState {
  id: string;
  buffer: string;
  settledCount: number;
  lastPaintAt: number;
}

export function scheduleUpdate(state: StreamState, chunk: string): boolean {
  state.buffer += chunk;
  const now = performance.now();
  return now - state.lastPaintAt >= 300;
}
\`\`\`

1フレームの目標時間 $T_{\\text{frame}} = 16.6\\,\\text{ms}$ を超えないようにするには、計算量 $O(N^2)$ の再解析を避ける必要があります。

| 項目 | 従来方式 | 省電力案 |
| :--- | :--- | :--- |
| 更新頻度 | トークン毎 | 段落・300ms |
| 過去履歴 | 全DOM保持 | 脱水・スキップ |
`;

export const STREAM_PAYLOAD = `モバイル端末でAIチャットの長文を受け取り続けると、なぜ思った以上にバッテリーが減り、画面が引っかかりやすくなるのかを技術的な視点から分解します。

## 1. 逐次再パースが引き起こす計算量の膨張

チャットUIで最もよく見かける実装では、ストリーミングのチャンクが1つ届くたびに、そのメッセージ全体のMarkdown文字列をパーサーへ渡してHTMLや仮想DOMを作り直します。文字数が $N$ に増えていく途中で毎回全体を走査するため、1回の応答全体での解析コストはおよそ次のように膨らみます。

$$
C_{\\text{total}} = \\sum_{k=1}^{M} O\\left(\\frac{k \\cdot N}{M}\\right) = O(M \\cdot N)
$$

数千文字の応答を細かいチャンクに分けて受け取ると、累積の解析文字数は数十万文字分に達します。さらにここに構文ハイライトと数式整形が乗ると、1回の更新ごとに数百個の \`<span>\` 要素が生成・破棄されることになります。

\`\`\`typescript
export class EcoStreamScheduler {
  private pending = "";
  private timer: number | null = null;

  constructor(
    private readonly intervalMs: number,
    private readonly onFlush: (delta: string) => void
  ) {}

  enqueue(chunk: string): void {
    this.pending += chunk;
    if (this.timer !== null || document.hidden) return;
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.flush();
    }, this.intervalMs);
  }

  flush(): void {
    if (!this.pending) return;
    const out = this.pending;
    this.pending = "";
    this.onFlush(out);
  }
}
\`\`\`

## 2. ブロック単位メモ化でも残るコスト

もちろん、すでに確定した過去のブロックを \`memo\` などで固定し、末尾の未確定ブロックだけを再解析するライブラリも増えています。これによりスクリプト側の解析コスト自体は大きく下がります。

しかし、すでに画面上へ展開された過去の会話履歴が **40往復・80メッセージ分** ほど蓄積した状態では、別の問題が表面化します。

- ハイライト済みコードやKaTeX数式が生み出すDOMノード数は、素のテキストの数十倍に膨らむ
- 長いスレッドを上下にスクロールするたび、ブラウザのスタイル再計算とレイアウト計算の走査対象が増える
- 点滅カーソルのような常時アニメーションが存在すると、入力待機中も再合成が止まらない

\`\`\`typescript
export function dehydrateMessage(container: HTMLElement, rawText: string): void {
  const height = container.getBoundingClientRect().height;
  container.style.minHeight = \`\${Math.ceil(height)}px\`;
  container.textContent = rawText;
  container.dataset.dehydrated = "true";
}
\`\`\`

## 3. 「あえて描かない」という設計の比較

| 方針 | DOM負荷 | CPU起床回数 | 見た目 |
| :--- | :--- | :--- | :--- |
| Rich描画 | 高い | トークン毎 | 最初から装飾あり |
| Plainリアルタイム | 極めて低い | トークン毎 | 素のテキスト中心 |
| 引き算のエコ制御 | 極めて低い | 300ms単位に集約 | 必要時のみ装飾 |

重要なのは、すべての場面から装飾を奪うことではなく、電源に余裕がない外出先のモバイル環境では「対話に必要なテキストだけを最小コストで受け取り、必要なコードや数式だけ後から開く」という選択肢を持てるようにすることです。
`;

export function buildHistory(turns) {
  const list = [];
  for (let i = 0; i < turns; i++) {
    list.push({
      id: `u-${i}`,
      role: "user",
      content: `ターン ${i + 1}: この実装の省電力効果とエッジケースについて補足してください。`,
    });
    list.push({
      id: `a-${i}`,
      role: "assistant",
      content: `ターン ${i + 1} の回答:\n\n` + SAMPLE_TURN_ASSISTANT,
    });
  }
  return list;
}

export function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}
