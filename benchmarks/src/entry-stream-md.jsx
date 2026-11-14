import React from "react";
import { StreamMD } from "stream-md";
import { mountReactBenchmark } from "./chat-shell.jsx";

mountReactBenchmark((content, streaming) => (
  <StreamMD text={content} theme="dark" showCursor={streaming} />
));
