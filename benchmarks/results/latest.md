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
| react-markdown | 120.5 KB | 937 | 12.33 | 135 | 851.5 | 135.7 | 0 | 1 | 120.2 |
| streamdown | 1947.5 KB | 5,742 | 37.43 | 135 | 2217.5 | 185.2 | 4 | 2 | 352.3 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 1277.7 | 145.8 | 0 | 1 | 270.5 |
| stream-md | 81.4 KB | 3,069 | 8.41 | 135 | 529.4 | 100.5 | 0 | 1 | 191.1 |
| incremark | 2709.9 KB | 8,276 | 32.18 | 135 | 10697.8 | 192.0 | 3 | 7 | 335.1 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 507.8 | 296.9 | 0 | 0 | 56.5 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 85.8 | 49.0 | 0 | 0 | 54.7 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 75.2 | 16.4 | 0 | 0 | 53.2 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 199.8 | 31.9 | 0 | 0 | 30.0 |
| streamdown | 1947.5 KB | 5,742 | 43.61 | 135 | 525.7 | 47.4 | 1 | 1 | 79.1 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 314.7 | 37.3 | 0 | 1 | 62.1 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 144.5 | 30.6 | 0 | 0 | 48.8 |
| incremark | 2709.9 KB | 8,276 | 32.35 | 135 | 346.2 | 44.9 | 0 | 1 | 85.4 |
| react-plain | 71.3 KB | 134 | 2.85 | 135 | 136.3 | 74.4 | 0 | 0 | 16.7 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 26.0 | 13.4 | 0 | 0 | 16.5 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 24.9 | 4.3 | 0 | 0 | 16.0 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
