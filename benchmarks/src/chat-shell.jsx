import React, { memo, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { STREAM_PAYLOAD, buildHistory, chunkString } from "./payload.js";

export function mountReactBenchmark(renderAssistant, { batchIntervalMs = 0 } = {}) {
  const MessageView = memo(function MessageView({ role, content, streaming }) {
    if (role === "user") {
      return <article className="msg user">{content}</article>;
    }
    return <article className="msg assistant">{renderAssistant(content, streaming)}</article>;
  });

  let reactRoot = null;
  let setAppState = null;

  function ChatApp({ initialTurns }) {
    const [state, setState] = useState(() => ({
      history: buildHistory(initialTurns),
      activeText: "",
      hasActive: false,
      streaming: false,
    }));
    const chatRef = useRef(null);

    useEffect(() => {
      setAppState = setState;
      return () => {
        setAppState = null;
      };
    }, []);

    useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [state.history.length, state.activeText, state.streaming]);

    return (
      <main id="chat" ref={chatRef}>
        {state.history.map((m) => (
          <MessageView key={m.id} role={m.role} content={m.content} streaming={false} />
        ))}
        {state.hasActive && (
          <MessageView role="assistant" content={state.activeText} streaming={state.streaming} />
        )}
      </main>
    );
  }

  window.__BENCH__ = {
    async initHistory(turns = 40) {
      const rootEl = document.getElementById("root");
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }
      rootEl.innerHTML = "";
      reactRoot = createRoot(rootEl);
      reactRoot.render(<ChatApp initialTurns={turns} />);
      await new Promise((r) => setTimeout(r, 120));
    },

    async runStream({ chunkIntervalMs = 20, chunkSize = 15, maxChunks = Infinity } = {}) {
      const chunks = chunkString(STREAM_PAYLOAD, chunkSize).slice(0, maxChunks);
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

      let accumulated = "";
      let lastFlush = performance.now();

      for (const chunk of chunks) {
        accumulated += chunk;
        const now = performance.now();
        if (batchIntervalMs === 0 || now - lastFlush >= batchIntervalMs) {
          const snap = accumulated;
          lastFlush = now;
          domCommits++;
          setAppState((prev) => ({
            ...prev,
            hasActive: true,
            activeText: snap,
            streaming: true,
          }));
        }
        await new Promise((r) => setTimeout(r, chunkIntervalMs));
      }

      domCommits++;
      setAppState((prev) => ({
        ...prev,
        hasActive: true,
        activeText: accumulated,
        streaming: false,
      }));
      await new Promise((r) => setTimeout(r, 120));
      rafRunning = false;

      const sorted = [...frameIntervals].sort((a, b) => a - b);
      return {
        totalChars: accumulated.length,
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
}
