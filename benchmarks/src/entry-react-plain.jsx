import React from "react";
import { mountReactBenchmark } from "./chat-shell.jsx";

mountReactBenchmark(
  (content) => <pre className="plain-text">{content}</pre>,
  { batchIntervalMs: 0 }
);
