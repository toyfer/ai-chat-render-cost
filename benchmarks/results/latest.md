# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.5`
- OS / CPU: `linux 7.0.0-1020-azure (x64)` (4 vCPU, AMD EPYC 9V45 96-Core Processor)
- Chromium: `159.0.8154.6`
- Conversation History: 40 turns (80 messages)
- Streaming Payload: 2000 chars (134 chunks, 20ms interval)

### Installed Package Versions

- `@ai-markdown/react`: `3.5.1`
- `@incremark/react`: `1.0.2`
- `@streamdown/code`: `2.0.1`
- `@streamdown/math`: `1.0.4`
- `esbuild`: `0.25.12`
- `katex`: `0.16.47`
- `playwright`: `1.65.1`
- `react`: `19.3.1`
- `react-dom`: `19.3.1`
- `react-markdown`: `10.1.0`
- `remark-gfm`: `4.0.1`
- `stream-md`: `0.2.0`
- `streamdown`: `2.8.0`

## CPU 4x Slowdown (Mobile-class Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 805.5 | 129.5 | 0 | 1 | 119.9 |
| streamdown | 1947.5 KB | 5,742 | 37.95 | 135 | 2037.0 | 161.5 | 3 | 3 | 319.2 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 1247.5 | 149.6 | 0 | 1 | 247.0 |
| stream-md | 81.4 KB | 3,069 | 8.43 | 135 | 542.9 | 102.8 | 0 | 1 | 197.8 |
| incremark | 2709.4 KB | 8,276 | 32.16 | 135 | 10792.0 | 201.2 | 3 | 7 | 341.4 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 544.6 | 318.8 | 0 | 0 | 56.8 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 89.6 | 52.2 | 0 | 0 | 55.9 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 75.1 | 16.4 | 0 | 0 | 50.0 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 197.1 | 31.8 | 0 | 0 | 30.4 |
| streamdown | 1947.5 KB | 5,742 | 34.09 | 135 | 543.8 | 48.4 | 1 | 2 | 77.8 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 320.7 | 37.3 | 0 | 1 | 62.1 |
| stream-md | 81.4 KB | 3,069 | 8.44 | 135 | 145.7 | 31.1 | 0 | 0 | 53.6 |
| incremark | 2709.4 KB | 8,276 | 32.39 | 135 | 2636.7 | 56.2 | 1 | 2 | 96.9 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 138.7 | 74.4 | 0 | 0 | 17.6 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 30.5 | 14.5 | 0 | 0 | 17.0 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 25.1 | 4.5 | 0 | 0 | 17.5 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
