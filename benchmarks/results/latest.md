# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.4`
- OS / CPU: `linux 7.0.0-1019-azure (x64)` (4 vCPU, AMD EPYC 7763 64-Core Processor)
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
| react-markdown | 120.5 KB | 937 | 13.30 | 135 | 1691.3 | 246.7 | 0 | 1 | 260.5 |
| streamdown | 1940.1 KB | 5,742 | 29.03 | 135 | 4174.8 | 324.2 | 7 | 7 | 705.3 |
| ai-markdown | 377 KB | 3,880 | 13.48 | 135 | 2683.3 | 260.2 | 1 | 2 | 577.4 |
| stream-md | 81.4 KB | 3,069 | 8.44 | 135 | 1230.8 | 210.6 | 0 | 1 | 374.7 |
| incremark | 2709.4 KB | 8,276 | 30.91 | 135 | 19139.9 | 504.2 | 9 | 9 | 685.6 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 1039.7 | 561.7 | 0 | 1 | 126.0 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 190.0 | 94.9 | 0 | 0 | 141.4 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 161.8 | 34.0 | 0 | 1 | 118.4 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.32 | 135 | 440.9 | 64.7 | 0 | 0 | 72.4 |
| streamdown | 1940.1 KB | 5,742 | 34.70 | 135 | 1058.9 | 96.7 | 1 | 2 | 179.4 |
| ai-markdown | 377 KB | 3,880 | 16.25 | 135 | 632.1 | 66.6 | 0 | 1 | 133.1 |
| stream-md | 81.4 KB | 3,069 | 8.43 | 135 | 318.4 | 62.3 | 0 | 0 | 99.0 |
| incremark | 2709.4 KB | 8,276 | 32.20 | 135 | 4290.9 | 92.4 | 2 | 3 | 197.9 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 271.9 | 141.0 | 0 | 0 | 35.3 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 55.6 | 24.7 | 0 | 0 | 36.9 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 51.5 | 8.8 | 0 | 0 | 34.4 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
