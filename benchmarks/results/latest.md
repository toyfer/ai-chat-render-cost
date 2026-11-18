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
| react-markdown | 120.5 KB | 937 | 13.31 | 135 | 1993.8 | 297.3 | 0 | 1 | 353.7 |
| streamdown | 1947.1 KB | 5,742 | 25.10 | 135 | 5670.1 | 378.4 | 16 | 13 | 889.7 |
| ai-markdown | 377 KB | 3,880 | 12.71 | 135 | 3219.4 | 309.8 | 2 | 3 | 738.5 |
| stream-md | 81.4 KB | 3,069 | 8.44 | 135 | 1613.3 | 266.3 | 0 | 1 | 470.2 |
| incremark | 2709.4 KB | 8,276 | 29.65 | 135 | 20194.8 | 585.4 | 8 | 10 | 961.9 |
| react-plain | 71.3 KB | 134 | 2.86 | 135 | 1324.1 | 652.8 | 0 | 1 | 192.0 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 246.7 | 102.8 | 0 | 1 | 181.1 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 223.3 | 36.5 | 0 | 1 | 179.6 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.30 | 135 | 492.4 | 73.6 | 0 | 0 | 79.0 |
| streamdown | 1947.1 KB | 5,742 | 33.87 | 135 | 1114.4 | 105.5 | 2 | 2 | 197.2 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 765.9 | 80.2 | 0 | 1 | 171.0 |
| stream-md | 81.4 KB | 3,069 | 8.45 | 135 | 402.0 | 80.0 | 0 | 0 | 115.0 |
| incremark | 2709.4 KB | 8,276 | 32.18 | 135 | 4381.4 | 102.7 | 2 | 3 | 208.0 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 334.7 | 158.8 | 0 | 0 | 50.0 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 72.4 | 25.4 | 0 | 0 | 49.9 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 64.7 | 8.8 | 0 | 0 | 49.5 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
