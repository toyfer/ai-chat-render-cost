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
| react-markdown | 120.5 KB | 937 | 12.34 | 135 | 1797.7 | 273.4 | 0 | 1 | 286.3 |
| streamdown | 1950.3 KB | 5,742 | 36.09 | 135 | 3661.5 | 293.5 | 8 | 6 | 649.5 |
| ai-markdown | 377 KB | 3,880 | 12.17 | 135 | 2819.5 | 269.8 | 1 | 2 | 680.2 |
| stream-md | 81.4 KB | 3,069 | 8.43 | 135 | 1483.3 | 245.7 | 0 | 1 | 407.6 |
| incremark | 2709.9 KB | 8,276 | 31.11 | 135 | 16468.1 | 451.3 | 8 | 9 | 799.3 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 968.4 | 496.4 | 0 | 0 | 145.7 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 167.2 | 76.7 | 0 | 0 | 131.4 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 161.4 | 26.0 | 0 | 1 | 153.9 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 401.5 | 62.9 | 0 | 0 | 67.2 |
| streamdown | 1950.3 KB | 5,742 | 34.04 | 135 | 955.4 | 91.8 | 1 | 2 | 172.4 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 610.9 | 64.7 | 0 | 1 | 124.5 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 318.7 | 59.5 | 0 | 0 | 93.5 |
| incremark | 2709.9 KB | 8,276 | 32.38 | 135 | 3712.9 | 83.5 | 2 | 1 | 182.2 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 254.8 | 122.7 | 0 | 0 | 41.3 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 52.4 | 18.9 | 0 | 0 | 37.3 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 49.7 | 6.8 | 0 | 0 | 36.6 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
