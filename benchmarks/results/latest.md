# Automated Benchmark Results

Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。

## Environment & Versions

- Node.js: `v22.23.4`
- OS / CPU: `linux 7.0.0-1019-azure (x64)` (4 vCPU, INTEL(R) XEON(R) PLATINUM 8573C)
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
| react-markdown | 120.5 KB | 937 | 12.32 | 135 | 1940.4 | 299.3 | 0 | 1 | 277.7 |
| streamdown | 1939.6 KB | 5,742 | 35.07 | 135 | 3901.0 | 339.5 | 7 | 6 | 693.9 |
| ai-markdown | 377 KB | 3,880 | 13.03 | 135 | 2831.9 | 294.8 | 1 | 2 | 572.6 |
| stream-md | 81.4 KB | 3,069 | 8.38 | 135 | 1387.9 | 250.5 | 0 | 1 | 392.7 |
| incremark | 2709.4 KB | 8,276 | 30.97 | 135 | 19737.3 | 485.0 | 8 | 9 | 732.4 |
| react-plain | 71.3 KB | 134 | 2.88 | 135 | 1150.0 | 569.2 | 0 | 0 | 168.9 |
| react-eco | 71.3 KB | 134 | 2.93 | 9 | 188.8 | 92.3 | 0 | 1 | 163.0 |
| vanilla-eco | 3.5 KB | 134 | 1.83 | 9 | 168.5 | 35.7 | 0 | 1 | 153.1 |

## CPU 1x (No Throttling)

| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react-markdown | 120.5 KB | 937 | 12.31 | 135 | 428.7 | 69.6 | 0 | 0 | 70.2 |
| streamdown | 1939.6 KB | 5,742 | 34.68 | 135 | 1002.8 | 103.0 | 1 | 2 | 176.7 |
| ai-markdown | 377 KB | 3,880 | 16.08 | 135 | 692.1 | 77.0 | 0 | 1 | 144.2 |
| stream-md | 81.4 KB | 3,069 | 8.44 | 135 | 351.0 | 71.4 | 0 | 0 | 99.2 |
| incremark | 2709.4 KB | 8,276 | 32.21 | 135 | 4619.4 | 96.9 | 2 | 2 | 187.0 |
| react-plain | 71.3 KB | 134 | 2.87 | 135 | 298.1 | 143.5 | 0 | 0 | 46.6 |
| react-eco | 71.3 KB | 134 | 2.92 | 9 | 61.1 | 25.8 | 0 | 0 | 46.7 |
| vanilla-eco | 3.5 KB | 134 | 1.82 | 9 | 53.4 | 8.9 | 0 | 0 | 42.7 |

## Notes on Fairness

- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。
- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。
- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。
