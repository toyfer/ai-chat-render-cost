import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(ROOT, "results");
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split("?")[0];
    let filePath;
    if (urlPath === "/") {
      filePath = path.join(ROOT, "index.html");
    } else if (urlPath === "/vendor/katex.min.css") {
      filePath = path.join(ROOT, "node_modules/katex/dist/katex.min.css");
    } else if (urlPath.startsWith("/vendor/fonts/")) {
      const fontName = path.basename(urlPath);
      filePath = path.join(ROOT, "node_modules/katex/dist/fonts", fontName);
    } else {
      filePath = path.join(ROOT, urlPath);
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function toMetricMap(metricsArray) {
  const m = {};
  for (const item of metricsArray) m[item.name] = item.value;
  return m;
}

function diffMetrics(before, after) {
  return {
    taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
    scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
    layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
    styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
    layoutCount: after.LayoutCount - before.LayoutCount,
    styleCount: after.RecalcStyleCount - before.RecalcStyleCount,
    nodesAfter: after.Nodes,
    heapMB: after.JSHeapUsedSize / (1024 * 1024),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runSingle(browser, baseUrl, mode, cpuRate, turns) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (cpuRate > 1) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  }

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${baseUrl}?entry=${encodeURIComponent(mode)}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__BENCH__), null, { timeout: 15000 });

  await page.evaluate(() => {
    window.__perfLogs = { loafCount: 0, loafTotalMs: 0, loafMaxMs: 0 };
    if ("PerformanceObserver" in window) {
      try {
        const obs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            window.__perfLogs.loafCount++;
            window.__perfLogs.loafTotalMs += e.duration;
            if (e.duration > window.__perfLogs.loafMaxMs) window.__perfLogs.loafMaxMs = e.duration;
          }
        });
        obs.observe({ type: "long-animation-frame", buffered: false });
      } catch {}
    }
  });

  const mInitBefore = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  await page.evaluate((t) => window.__BENCH__.initHistory(t), turns);
  const mInitAfter = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const initDiff = diffMetrics(mInitBefore, mInitAfter);

  await page.evaluate(() => {
    window.__perfLogs = { loafCount: 0, loafTotalMs: 0, loafMaxMs: 0 };
  });

  const mStreamBefore = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const wallStart = Date.now();
  const streamMeta = await page.evaluate(() => window.__BENCH__.runStream({ chunkIntervalMs: 20, chunkSize: 15 }));
  const streamWallMs = Date.now() - wallStart;
  const mStreamAfter = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const streamDiff = diffMetrics(mStreamBefore, mStreamAfter);
  const streamLoaf = await page.evaluate(() => ({ ...window.__perfLogs }));

  await page.evaluate(() => {
    window.__perfLogs = { loafCount: 0, loafTotalMs: 0, loafMaxMs: 0 };
  });
  const mScrollBefore = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  await page.evaluate(() => window.__BENCH__.runScrollBack(30));
  const mScrollAfter = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const scrollDiff = diffMetrics(mScrollBefore, mScrollAfter);
  const scrollLoaf = await page.evaluate(() => ({ ...window.__perfLogs }));

  await context.close();

  return {
    mode,
    cpuRate,
    errors,
    streamMeta,
    streamWallMs,
    init: initDiff,
    stream: { ...streamDiff, ...streamLoaf },
    scroll: { ...scrollDiff, ...scrollLoaf },
  };
}

function buildMarkdownReport({ meta, results }) {
  const lines = [];
  lines.push("# Automated Benchmark Results");
  lines.push("");
  lines.push("Headless Chromium (mobile viewport `390x844`, software rendering) 上で、同じ40往復の会話履歴がある状態から新規ストリーミング応答を受信し、完了後に履歴をスクロールした際の実測値です。各条件3回実行の中央値を記載しています。");
  lines.push("");
  lines.push("## Environment & Versions");
  lines.push("");
  lines.push(`- Node.js: \`${meta.nodeVersion}\``);
  lines.push(`- OS / CPU: \`${meta.platform}\` (${meta.cpuCount} vCPU, ${meta.cpuModel})`);
  lines.push(`- Chromium: \`${meta.browserVersion}\``);
  lines.push(`- Conversation History: ${meta.turns} turns (${meta.turns * 2} messages)`);
  lines.push(`- Streaming Payload: ${meta.totalChars} chars (${meta.chunkCount} chunks, 20ms interval)`);
  lines.push("");
  lines.push("### Installed Package Versions");
  lines.push("");
  for (const [pkg, ver] of Object.entries(meta.packages)) {
    lines.push(`- \`${pkg}\`: \`${ver}\``);
  }
  lines.push("");

  for (const cpuRate of meta.cpuRates) {
    const label = cpuRate === 1 ? "CPU 1x (No Throttling)" : `CPU ${cpuRate}x Slowdown (Mobile-class Throttling)`;
    lines.push(`## ${label}`);
    lines.push("");
    lines.push("| Mode | Bundle (gzip) | Live DOM Elements | Heap (MB) | DOM Commits | Stream Task (ms) | Layout+Style (ms) | Dropped Frames (>25ms) | LoAF Count | Scroll Task (ms) |");
    lines.push("| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const r of results.filter((x) => x.cpuRate === cpuRate)) {
      lines.push(
        `| ${r.mode} | ${r.bundleGzipKB} KB | ${r.liveDomElements.toLocaleString()} | ${r.heapMB.toFixed(2)} | ${r.domCommits} | ${r.streamTaskMs.toFixed(1)} | ${r.streamLayoutStyleMs.toFixed(1)} | ${r.droppedFrames25} | ${r.streamLoafCount} | ${r.scrollTaskMs.toFixed(1)} |`
      );
    }
    lines.push("");
  }

  lines.push("## Notes on Fairness");
  lines.push("");
  lines.push("- 過去履歴の80メッセージは全React方式で `React.memo` により固定しており、親の更新で過去メッセージが再レンダリングされない実装にしています。");
  lines.push("- Bundleサイズは各エントリを `esbuild` で単一IIFEバンドルにした値です（本番アプリでコード分割される動的言語定義などもすべて含むため、実際のアプリでは初期ロードサイズは小さくなります）。");
  lines.push("- ヘッドレス環境のためGPUコンポジットの消費電力自体は測定対象外ですが、バッテリー消費の主要因となるメインスレッド稼働時間（`TaskDuration`）、レイアウト・スタイル再計算コスト、DOM要素数を比較しています。");
  lines.push("");
  return lines.join("\n");
}

(async () => {
  const args = process.argv.slice(2);
  const cpuArg = args.find((a) => a.startsWith("--cpu="));
  const runsArg = args.find((a) => a.startsWith("--runs="));
  const turnsArg = args.find((a) => a.startsWith("--turns="));
  const cpuRates = cpuArg ? cpuArg.split("=")[1].split(",").map(Number) : [4, 1];
  const runsPerMode = runsArg ? Number(runsArg.split("=")[1]) : 3;
  const turns = turnsArg ? Number(turnsArg.split("=")[1]) : 40;

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const lockPath = path.join(ROOT, "package-lock.json");
  const lock = fs.existsSync(lockPath) ? JSON.parse(fs.readFileSync(lockPath, "utf8")) : null;
  const bundleSizes = JSON.parse(fs.readFileSync(path.join(ROOT, "dist/bundle-sizes.json"), "utf8"));

  const installedPackages = {};
  for (const name of Object.keys(pkg.devDependencies)) {
    const modPkgPath = path.join(ROOT, "node_modules", name, "package.json");
    if (fs.existsSync(modPkgPath)) {
      installedPackages[name] = JSON.parse(fs.readFileSync(modPkgPath, "utf8")).version;
    } else if (lock?.packages?.[`node_modules/${name}`]?.version) {
      installedPackages[name] = lock.packages[`node_modules/${name}`].version;
    }
  }

  const modes = [
    "react-markdown",
    "streamdown",
    "ai-markdown",
    "stream-md",
    "incremark",
    "react-plain",
    "react-eco",
    "vanilla-eco",
  ];

  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch({ headless: true });

  const results = [];
  let totalChars = 0;
  let chunkCount = 0;

  try {
    for (const cpuRate of cpuRates) {
      for (const mode of modes) {
        const runs = [];
        for (let r = 0; r < runsPerMode; r++) {
          runs.push(await runSingle(browser, baseUrl, mode, cpuRate, turns));
        }
        totalChars = runs[0].streamMeta.totalChars;
        chunkCount = runs[0].streamMeta.chunkCount;

        results.push({
          cpuRate,
          mode,
          bundleRawKB: bundleSizes[mode].rawKB,
          bundleGzipKB: bundleSizes[mode].gzipKB,
          domCommits: runs[0].streamMeta.domCommits,
          liveDomElements: runs[0].streamMeta.liveDomElements,
          cdpNodes: Math.round(median(runs.map((x) => x.stream.nodesAfter))),
          heapMB: +median(runs.map((x) => x.stream.heapMB)).toFixed(2),
          initTaskMs: +median(runs.map((x) => x.init.taskMs)).toFixed(1),
          streamWallMs: Math.round(median(runs.map((x) => x.streamWallMs))),
          streamTaskMs: +median(runs.map((x) => x.stream.taskMs)).toFixed(1),
          streamLayoutStyleMs: +median(runs.map((x) => x.stream.layoutMs + x.stream.styleMs)).toFixed(1),
          streamLayoutCount: Math.round(median(runs.map((x) => x.stream.layoutCount))),
          streamStyleCount: Math.round(median(runs.map((x) => x.stream.styleCount))),
          p95FrameMs: +median(runs.map((x) => x.streamMeta.p95FrameMs)).toFixed(1),
          maxFrameMs: +median(runs.map((x) => x.streamMeta.maxFrameMs)).toFixed(1),
          droppedFrames25: Math.round(median(runs.map((x) => x.streamMeta.droppedFrames25))),
          streamLoafCount: Math.round(median(runs.map((x) => x.stream.loafCount))),
          streamLoafMaxMs: +median(runs.map((x) => x.stream.loafMaxMs)).toFixed(1),
          scrollTaskMs: +median(runs.map((x) => x.scroll.taskMs)).toFixed(1),
          scrollLayoutStyleMs: +median(runs.map((x) => x.scroll.layoutMs + x.scroll.styleMs)).toFixed(1),
          errors: runs.flatMap((x) => x.errors),
        });
      }
    }

    const meta = {
      nodeVersion: process.version,
      platform: `${os.platform()} ${os.release()} (${os.arch()})`,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || "unknown",
      browserVersion: browser.version(),
      turns,
      totalChars,
      chunkCount,
      cpuRates,
      runsPerMode,
      packages: installedPackages,
    };

    const md = buildMarkdownReport({ meta, results });
    fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), JSON.stringify({ meta, results }, null, 2));
    fs.writeFileSync(path.join(RESULTS_DIR, "latest.md"), md);
    console.log(md);
  } finally {
    await browser.close();
    server.close();
  }
})();
