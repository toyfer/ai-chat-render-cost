# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.5`
- OS / CPU: `linux 7.0.0-1020-azure (x64)` (4 vCPU, INTEL(R) XEON(R) PLATINUM 8573C)
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
| react-markdown | 120.5 KB | 937 | 12.33 | 135 | 1642.4 | 260.5 | 0 | 1 | 256.0 |
| streamdown | 1948.4 KB | 5,742 | 36.12 | 135 | 3966.7 | 329.4 | 9 | 6 | 636.9 |
| ai-markdown | 377 KB | 3,880 | 13.15 | 135 | 2529.3 | 269.1 | 1 | 2 | 506.1 |
| stream-md | 81.4 KB | 3,069 | 8.39 | 135 | 1265.6 | 230.8 | 0 | 1 | 373.6 |
| incremark | 2709.9 KB | 8,276 | 31.34 | 135 | 19803.9 | 468.7 | 10 | 9 | 664.7 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 1075.2 | 542.9 | 0 | 0 | 149.9 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 188.8 | 91.6 | 0 | 1 | 161.5 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 169.7 | 33.7 | 0 | 1 | 140.9 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.32 | 135 | 409.5 | 65.9 | 0 | 0 | 65.9 |
| streamdown | 1948.4 KB | 5,742 | 33.97 | 135 | 985.4 | 88.4 | 1 | 2 | 167.8 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 701.5 | 76.5 | 0 | 1 | 143.9 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 345.1 | 71.6 | 0 | 0 | 101.2 |
| incremark | 2709.9 KB | 8,276 | 32.30 | 135 | 4686.8 | 93.3 | 2 | 2 | 174.3 |
| react-plain | 71.3 KB | 134 | 2.86 | 135 | 296.5 | 144.5 | 0 | 0 | 44.2 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 57.4 | 25.7 | 0 | 0 | 41.1 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 56.0 | 8.6 | 0 | 0 | 42.4 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
