# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.5`
- OS / CPU: `linux 7.0.0-1020-azure (x64)` (4 vCPU, AMD EPYC 7763 64-Core Processor)
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
| react-markdown | 120.5 KB | 937 | 12.34 | 135 | 1559.9 | 227.8 | 0 | 1 | 219.3 |
| streamdown | 1950.3 KB | 5,742 | 36.62 | 135 | 3818.4 | 287.3 | 7 | 7 | 576.6 |
| ai-markdown | 377 KB | 3,880 | 14.02 | 135 | 2156.2 | 230.5 | 1 | 2 | 433.4 |
| stream-md | 81.4 KB | 3,069 | 8.40 | 135 | 995.8 | 176.8 | 0 | 1 | 343.9 |
| incremark | 2709.9 KB | 8,276 | 31.91 | 135 | 18720.0 | 483.5 | 8 | 9 | 645.6 |
| react-plain | 71.3 KB | 134 | 2.89 | 135 | 933.8 | 530.2 | 0 | 1 | 102.8 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 189.4 | 92.7 | 0 | 1 | 133.6 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 159.6 | 33.2 | 0 | 1 | 109.3 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.30 | 135 | 377.3 | 55.2 | 0 | 0 | 57.7 |
| streamdown | 1950.3 KB | 5,742 | 34.05 | 135 | 930.1 | 81.1 | 1 | 2 | 148.3 |
| ai-markdown | 377 KB | 3,880 | 16.09 | 135 | 577.3 | 60.4 | 0 | 1 | 125.6 |
| stream-md | 81.4 KB | 3,069 | 8.42 | 135 | 329.4 | 64.7 | 0 | 0 | 98.0 |
| incremark | 2709.9 KB | 8,276 | 32.36 | 135 | 4177.1 | 91.3 | 2 | 1 | 166.3 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 268.8 | 139.9 | 0 | 0 | 34.3 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 52.8 | 23.7 | 0 | 0 | 30.7 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 46.2 | 7.8 | 0 | 0 | 29.4 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
