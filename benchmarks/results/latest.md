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
| react-markdown | 120.5 KB | 937 | 12.34 | 135 | 1016.3 | 164.8 | 0 | 1 | 141.2 |
| streamdown | 1947.5 KB | 5,742 | 36.91 | 135 | 2255.7 | 181.2 | 4 | 4 | 389.0 |
| ai-markdown | 377 KB | 3,880 | 15.68 | 135 | 2067.6 | 217.0 | 0 | 1 | 343.1 |
| stream-md | 81.4 KB | 3,069 | 8.43 | 135 | 864.7 | 142.1 | 0 | 1 | 278.7 |
| incremark | 2709.5 KB | 8,276 | 32.16 | 135 | 11660.8 | 223.2 | 3 | 7 | 369.7 |
| react-plain | 71.3 KB | 134 | 2.86 | 135 | 561.4 | 327.1 | 0 | 0 | 60.2 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 96.7 | 54.3 | 0 | 0 | 58.3 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 83.0 | 16.8 | 0 | 1 | 58.2 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.30 | 135 | 215.7 | 35.0 | 0 | 0 | 32.7 |
| streamdown | 1947.5 KB | 5,742 | 34.04 | 135 | 592.8 | 56.2 | 1 | 2 | 84.6 |
| ai-markdown | 377 KB | 3,880 | 16.25 | 135 | 335.1 | 40.3 | 0 | 1 | 67.1 |
| stream-md | 81.4 KB | 3,069 | 8.41 | 135 | 161.6 | 34.5 | 0 | 0 | 53.4 |
| incremark | 2709.5 KB | 8,276 | 32.39 | 135 | 2787.9 | 50.6 | 1 | 1 | 87.5 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 146.2 | 79.0 | 0 | 0 | 17.6 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 29.6 | 14.1 | 0 | 0 | 17.5 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 24.8 | 4.6 | 0 | 0 | 17.2 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
