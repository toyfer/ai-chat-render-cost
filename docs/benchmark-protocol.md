# Benchmark & Measurement Protocol (Draft)

このドキュメントは、「AIチャットのリッチな描画処理が、素のテキスト表示と比べてどれだけブラウザやモバイル端末に負荷をかけているか」を再現性のある形で測るための手順案です。

単一メッセージのMarkdownパース速度ではなく、**会話が積み重なった状態や、モバイル相当の制限下での継続負荷**を見ることを目的としています。

## なぜこの指標を見るのか

[WebKit公式の消費電力解説](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)で説明されている通り、Webコンテンツがバッテリーを消耗させる主な要因は「CPU・GPUが高消費電力状態からアイドル状態へ戻れないこと」「継続的なアニメーションによる再ペイント」「JavaScriptの長時間実行」にあります。

`navigator.getBattery()` のようなBattery Status APIは対応ブラウザが限られており（[MDN Navigator.getBattery()](https://developer.mozilla.org/docs/Web/API/Navigator/getBattery)）、短時間の残量変化も電力計測としては不正確なため、ブラウザおよびOSのプロファイラで「仕事量そのもの」を比較する方針をとります。

## 比較対象（推奨パターン）

同じ入力テキスト・同じチャンク到着間隔を使い、以下の2〜3パターンを比較します。

1. **通常のリッチ表示（Baseline）**: 既存チャットUIまたは既存のストリーミングMarkdownレンダラー（シンタックスハイライト、KaTeX、アニメーション等を有効にした状態）
2. **装飾なし・逐次表示**: Markdownの構造化を最小限にするか、`pre` / テキスト要素中心で更新頻度だけ同じにする
3. **エコ制御あり（Target）**: 装飾をオフにしたうえで、更新を250〜500msまたは段落単位へまとめ、アニメーションを無効化、画面外の過去メッセージに `content-visibility: auto` やノード縮退を適用した状態

## テストシナリオ案

| シナリオ | 条件の例 | 確認したいこと |
| :--- | :--- | :--- |
| 長文ストリーミング | 日本語・コード・表・数式混在で約5,000〜10,000文字、30〜100 chunks/sec | 生成中のCPU占有とフレーム落ち |
| 長期会話の蓄積 | 50〜500往復分の履歴が入った状態で末尾がストリーミング中 | DOM総数、メモリ使用量、上方向スクロールの引っかかり |
| バックグラウンド遷移 | ストリーミング中にタブを非表示または最小化 | 非表示中のタイマーや無駄な描画処理が止まるか |

## 計測したい指標

### 1. ブラウザで手軽に取れる指標

- **DOMノード数**: テスト完了直後のチャットコンテナ配下の `element.querySelectorAll("*").length`
- **Scripting / Rendering 時間**: [Chrome DevToolsのPerformanceパネル](https://developer.chrome.com/docs/devtools/performance/reference?hl=ja)で、モバイル相当の **CPU 4x slowdown** 等を有効にして記録した際の `Scripting`・`Rendering`・`Painting` の合計時間と、CPUがアイドルになっている割合
- **Long Animation Frames (LoAF)**: [PerformanceLongAnimationFrameTiming](https://developer.mozilla.org/docs/Web/API/Performance_API/Long_animation_frame_timing) を `PerformanceObserver` で監視し、50msを超えた描画フレームの発生回数と最長ブロック時間

```js
// ブラウザコンソールで簡易的にLoAFを観測するスニペット例
const loafs = [];
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    loafs.push({
      duration: Math.round(entry.duration),
      blocking: Math.round(entry.blockingDuration),
    });
  }
});
observer.observe({ type: "long-animation-frame", buffered: true });
```

### 2. 実機で取れる場合（任意）

- **Android**: `Perfetto` や `SimplePerf` で採取したトレース（[Firefox Profiler](https://profiler.firefox.com/from-file/) にインポートして可視化・共有可能）
- **iOS / macOS**: Xcode Instruments（Energy Log / Time Profiler）または Safari Web Inspector の CPU Timeline
- **ヒープメモリ**: DevTools Memory パネルでの JS Heap サイズ推移

## 結果の共有方法

手元の環境でいずれか1項目でも計測できた場合は、`Benchmark Report` テンプレートから Issue として投稿していただけると助かります。環境条件（端末・OS・ブラウザ・対象UI/ライブラリ）がわかる形であれば、簡易的なスクリーンショットや数値メモだけでも歓迎です。
