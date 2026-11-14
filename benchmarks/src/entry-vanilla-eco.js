import { STREAM_PAYLOAD, buildHistory, chunkString } from "./payload.js";

window.__BENCH__ = {
  async initHistory(turns = 40) {
    const rootEl = document.getElementById("root");
    rootEl.innerHTML = "";
    const chat = document.createElement("main");
    chat.id = "chat";
    rootEl.appendChild(chat);

    const history = buildHistory(turns);
    for (const m of history) {
      const el = document.createElement("article");
      el.className = `msg ${m.role}`;
      if (m.role === "user") {
        el.textContent = m.content;
      } else {
        const pre = document.createElement("pre");
        pre.className = "plain-text";
        pre.textContent = m.content;
        el.appendChild(pre);
      }
      chat.appendChild(el);
    }
    chat.scrollTop = chat.scrollHeight;
  },

  async runStream({ chunkIntervalMs = 20, chunkSize = 15, maxChunks = Infinity } = {}) {
    const chat = document.getElementById("chat");
    const chunks = chunkString(STREAM_PAYLOAD, chunkSize).slice(0, maxChunks);

    const target = document.createElement("article");
    target.className = "msg assistant";
    const pre = document.createElement("pre");
    pre.className = "plain-text";
    const textNode = document.createTextNode("");
    pre.appendChild(textNode);
    target.appendChild(pre);
    chat.appendChild(target);

    let domCommits = 0;
    const frameIntervals = [];
    let rafRunning = true;
    let lastRaf = performance.now();

    function tickRaf(now) {
      if (!rafRunning) return;
      frameIntervals.push(now - lastRaf);
      lastRaf = now;
      requestAnimationFrame(tickRaf);
    }
    requestAnimationFrame(tickRaf);

    let pending = "";
    let lastFlush = performance.now();
    let totalLen = 0;

    for (const chunk of chunks) {
      pending += chunk;
      totalLen += chunk.length;
      const now = performance.now();
      if (now - lastFlush >= 300) {
        textNode.appendData(pending);
        pending = "";
        lastFlush = now;
        domCommits++;
        chat.scrollTop = chat.scrollHeight;
      }
      await new Promise((r) => setTimeout(r, chunkIntervalMs));
    }

    if (pending) {
      textNode.appendData(pending);
      domCommits++;
      chat.scrollTop = chat.scrollHeight;
    }

    await new Promise((r) => setTimeout(r, 80));
    rafRunning = false;

    const sorted = [...frameIntervals].sort((a, b) => a - b);
    return {
      totalChars: totalLen,
      chunkCount: chunks.length,
      domCommits,
      p95FrameMs: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1),
      maxFrameMs: +(sorted[sorted.length - 1] || 0).toFixed(1),
      droppedFrames25: frameIntervals.filter((dt) => dt > 25).length,
      liveDomElements: document.querySelectorAll("*").length,
    };
  },

  async runScrollBack(steps = 30) {
    const chat = document.getElementById("chat");
    const maxScroll = chat.scrollHeight - chat.clientHeight;
    for (let i = 0; i < steps; i++) {
      chat.scrollTop = Math.floor(maxScroll * (1 - i / steps));
      await new Promise((r) => requestAnimationFrame(r));
    }
    for (let i = 0; i <= steps; i++) {
      chat.scrollTop = Math.floor(maxScroll * (i / steps));
      await new Promise((r) => requestAnimationFrame(r));
    }
  },
};
