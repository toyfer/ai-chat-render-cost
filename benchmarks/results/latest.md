# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.5`
- OS / CPU: `linux 7.0.0-1020-azure (x64)` (4 vCPU, AMD EPYC 9V74 80-Core Processor)
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
- `streamdown`: `2.8.1`

## CPU 4x Slowdown (Mobile-class Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.34 | 135 | 1489.4 | 221.2 | 0 | 1 | 184.9 |
| streamdown | 1950.3 KB | 5,742 | 37.04 | 135 | 3100.4 | 231.7 | 6 | 6 | 490.2 |
| ai-markdown | 377 KB | 3,880 | 15.76 | 135 | 1954.4 | 216.9 | 0 | 2 | 390.3 |
| stream-md | 81.4 KB | 3,069 | 8.46 | 135 | 887.1 | 148.6 | 0 | 1 | 289.3 |
| incremark | 2709.9 KB | 8,276 | 32.16 | 135 | 15066.3 | 362.6 | 6 | 9 | 518.6 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 757.7 | 426.2 | 0 | 0 | 95.2 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 151.3 | 75.4 | 0 | 0 | 90.5 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 136.2 | 26.5 | 0 | 1 | 89.6 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.30 | 135 | 285.6 | 44.1 | 0 | 0 | 45.6 |
| streamdown | 1950.3 KB | 5,742 | 34.04 | 135 | 739.1 | 60.0 | 1 | 2 | 116.9 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 439.3 | 49.2 | 0 | 1 | 94.7 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 223.8 | 44.2 | 0 | 0 | 70.4 |
| incremark | 2709.9 KB | 8,276 | 32.35 | 135 | 3437.7 | 63.2 | 2 | 1 | 126.4 |
| react-plain | 71.3 KB | 134 | 2.86 | 135 | 198.2 | 103.3 | 0 | 0 | 26.2 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 45.4 | 18.6 | 0 | 0 | 26.1 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 41.5 | 6.8 | 0 | 0 | 26.7 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
