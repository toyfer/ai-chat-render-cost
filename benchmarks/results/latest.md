# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.4`
- OS / CPU: `linux 7.0.0-1019-azure (x64)` (4 vCPU, AMD EPYC 9V74 80-Core Processor)
- Chromium: `159.0.8154.6`
- Conversation History: 40 turns (80 messages)
- Streaming Payload: 2000 chars (134 chunks, 20ms interval)

### Installed Package Versions

- `@ai-markdown/react`: `3.5.1`
- `@incremark/react`: `1.0.2`
- `@streamdown/code`: `2.0.0`
- `@streamdown/math`: `1.0.3`
- `esbuild`: `0.25.12`
- `katex`: `0.16.47`
- `playwright`: `1.65.1`
- `react`: `19.3.1`
- `react-dom`: `19.3.1`
- `react-markdown`: `10.1.0`
- `remark-gfm`: `4.0.1`
- `stream-md`: `0.2.0`
- `streamdown`: `2.7.1`

## CPU 4x Slowdown (Mobile-class Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 13.32 | 135 | 1686.7 | 242.9 | 0 | 1 | 265.8 |
| streamdown | 1939.6 KB | 5,742 | 30.78 | 135 | 3407.8 | 281.4 | 7 | 6 | 645.3 |
| ai-markdown | 377 KB | 3,880 | 13.48 | 135 | 2658.3 | 266.9 | 1 | 2 | 599.4 |
| stream-md | 81.4 KB | 3,069 | 8.44 | 135 | 1364.9 | 222.8 | 0 | 1 | 391.6 |
| incremark | 2709.5 KB | 8,276 | 31.57 | 135 | 16252.7 | 440.4 | 8 | 10 | 740.9 |
| react-plain | 71.3 KB | 134 | 2.89 | 135 | 1089.4 | 539.1 | 0 | 0 | 178.0 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 182.3 | 78.8 | 0 | 0 | 162.3 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 156.0 | 28.3 | 0 | 1 | 136.8 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 409.1 | 63.6 | 0 | 0 | 70.7 |
| streamdown | 1939.6 KB | 5,742 | 34.22 | 135 | 952.6 | 91.6 | 1 | 2 | 180.3 |
| ai-markdown | 377 KB | 3,880 | 16.25 | 135 | 651.1 | 68.7 | 0 | 1 | 140.3 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 318.1 | 57.8 | 0 | 0 | 94.6 |
| incremark | 2709.5 KB | 8,276 | 32.35 | 135 | 3605.4 | 77.4 | 2 | 1 | 172.2 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 218.2 | 110.7 | 0 | 0 | 32.5 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 51.8 | 19.0 | 0 | 0 | 37.0 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 46.3 | 6.8 | 0 | 0 | 31.7 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
