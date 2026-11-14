import React from "react";
import AIMarkdown from "@ai-markdown/react";
import { mountReactBenchmark } from "./chat-shell.jsx";

mountReactBenchmark((content, streaming) => (
  <AIMarkdown content={content} streaming={streaming} />
));
