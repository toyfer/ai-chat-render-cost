import React from "react";
import { IncremarkContent } from "@incremark/react";
import { mountReactBenchmark } from "./chat-shell.jsx";

mountReactBenchmark((content, streaming) => (
  <IncremarkContent content={content} isFinished={!streaming} />
));
