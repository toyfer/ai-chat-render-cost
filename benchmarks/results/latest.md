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
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 1141.8 | 167.7 | 0 | 1 | 180.4 |
| streamdown | 1947.1 KB | 5,742 | 35.82 | 135 | 3102.9 | 236.7 | 6 | 6 | 538.8 |
| ai-markdown | 377 KB | 3,880 | 14.88 | 135 | 2040.9 | 213.8 | 0 | 2 | 420.7 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 1116.1 | 172.1 | 0 | 1 | 336.9 |
| incremark | 2709.5 KB | 8,276 | 31.91 | 135 | 15976.7 | 424.1 | 7 | 10 | 699.4 |
| react-plain | 71.3 KB | 134 | 2.89 | 135 | 916.3 | 480.4 | 0 | 0 | 124.8 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 179.2 | 80.6 | 0 | 0 | 154.0 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 167.0 | 29.7 | 0 | 1 | 147.1 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.30 | 135 | 401.4 | 62.8 | 0 | 0 | 66.6 |
| streamdown | 1947.1 KB | 5,742 | 34.06 | 135 | 935.0 | 88.0 | 1 | 2 | 173.1 |
| ai-markdown | 377 KB | 3,880 | 17.25 | 135 | 667.2 | 71.3 | 0 | 1 | 150.1 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 320.9 | 59.0 | 0 | 0 | 94.1 |
| incremark | 2709.5 KB | 8,276 | 32.33 | 135 | 3620.1 | 80.7 | 1 | 1 | 161.1 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 234.1 | 115.1 | 0 | 0 | 31.6 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 48.9 | 19.4 | 0 | 0 | 31.3 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 45.1 | 6.8 | 0 | 0 | 30.2 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
