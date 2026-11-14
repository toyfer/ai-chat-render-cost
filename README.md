# ai-chat-render-cost

AIチャットUIにおける過剰な描画・装飾コストと、モバイル端末での消費電力・負荷について検証し、議論するためのリポジトリです。

ライブラリ本体をゼロから作る前に、まず「問題提起」「先行事例の整理」「実在ライブラリを使った自動比較ベンチマーク」を置くことで、事実ベースで議論できる状態を目指しています。

## このリポジトリの問題提起

AIとやり取りするときの本質は「言葉を通じた思考や情報のやり取り」であり、画面をきれいに飾ることそのものではありません。それにもかかわらず、現在の多くのAIチャットUIはデスクトップ環境を前提としたリッチな描画（高頻度なMarkdown再パース、シンタックスハイライト、数式や図表のリアルタイム生成、アニメーション演出、長大なDOM履歴の保持）を標準としています。

電源供給に限りがあるモバイル端末では、この「気持ちよさのための仕事」がCPU・GPUを長時間稼働させ続け、発熱やバッテリー消費に直結します。

ここで問いたいのは「すべての装飾をなくすべきか」ではなく、**動画の画質設定のように「装飾と描画仕事を極限まで削って、対話とバッテリーを守るエコモード」が最初から選択肢として組み込まれていないのはおかしいのではないか**、という点です。

## 自動ベンチマーク（GitHub Actions）

Headless Chromium（モバイル相当の `390x844` ビューポート、ソフトウェアレンダリング）を使い、**40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後にスクロールしたときの負荷**を複数の実在ライブラリ間で比較計測しています。

- ベンチマーク実装: [`benchmarks/`](./benchmarks/)
- 最新の実測結果: [`benchmarks/results/latest.md`](./benchmarks/results/latest.md)（初回実行完了後に自動生成されます）
- 実行履歴レポート: Issues の `Automated Benchmark Results`

### 比較対象

- `react-markdown` (+ `remark-gfm`)
- `streamdown` (`streamdown` + `@streamdown/math` + `@streamdown/code`)
- `ai-markdown` (`@ai-markdown/react`)
- `stream-md` (`stream-md`)
- `incremark` (`@incremark/react`)
- `react-plain` (React 19、装飾・パーサーなし、トークン毎に更新)
- `react-eco` (React 19、装飾・パーサーなし、300msバッチ更新)
- `vanilla-eco` (フレームワークなし、装飾なし、300msバッチ更新)

なお、ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、ライブDOM要素数、ヒープ使用量、バンドルサイズを同じ土俵で比較しています。

## すでに他プロジェクトで見られる兆候

「会話が長くなると重い」「高頻度なストリーミング描画が負担になる」という現象自体は、すでに多くのプロジェクトやコミュニティで報告されています。

- **Open WebUI ([Issue #23733](https://github.com/open-webui/open-webui/issues/23733) / [PR #23735](https://github.com/open-webui/open-webui/pull/23735))**: 1トークンごとに全文をシリアライズしてフロントで毎フレームMarkdown再パースする構造により、メインスレッドが毎秒600ms以上占有されうる問題が報告されました（フロントの単純さや再接続安全性の都合などから、デルタ化PRは取り込まれずクローズされています）。
- **Open WebUI ([Issue #32728](https://github.com/open-webui/open-webui/issues/32728))**: モバイル相当の4倍CPUスロットリング環境で長文を受信すると、処理落ちによるタイミング競合で8回中7回、自動スクロール追従が壊れる現象が報告されています。
- **Vercel AI SDK ([Issue #20217](https://github.com/vercel/ai/issues/20217))**: 文字を滑らかに流す演出機能 `smoothStream` が、バックグラウンドタブのタイマー間引きに引っかかりストリーム進行全体を止めてしまう不具合が報告されました。
- **assistant-ui ([Issue #3489](https://github.com/assistant-ui/assistant-ui/issues/3489))**: 15往復以上の会話になるとアプリ全体のパフォーマンスが低下する報告が上がっています。
- **ユーザー側の自衛ツール ([chatgpt-lag-fixer](https://github.com/bramvdg/chatgpt-lag-fixer), [chatgpt-lazy-chat-plusplus](https://github.com/AlexSHamilton/chatgpt-lazy-chat-plusplus))**: 本家ChatGPTのDOM肥大によるフリーズを防ぐため、画面外メッセージを隠す・切り離す拡張機能やユーザースクリプトが複数公開されています。

## リポジトリ構成

| パス | 内容 |
| :--- | :--- |
| `benchmarks/` | 各ライブラリを同一条件で測るPlaywrightベンチマークと結果出力 |
| `docs/design-notes.md` | 描画仕事を引き算する方向で整理した初期設計メモ |
| `docs/benchmark-protocol.md` | 測定項目とモバイル実機での追加検証方法のメモ |
| `.github/workflows/benchmark.yml` | 依存ロックファイル生成とベンチマーク自動記録のワークフロー |
| `.github/ISSUE_TEMPLATE/` | 実測レポートや意見・反論を投稿するためのテンプレート |

## フィードバック募集

実機での計測データ、ベンチマーク条件へのツッコミ（「この設定ならこのライブラリの方がずっと軽い」「そもそも通信など別要因の方が大きい」等）、普段使いでの体感など、ぜひ [Issues](../../issues) からお寄せください。

---

※ このリポジトリの文書群およびベンチマーク基盤は、人間の問題意識をもとに先行事例の調査・コード整理をAIと壁打ちしながら作成しています。
