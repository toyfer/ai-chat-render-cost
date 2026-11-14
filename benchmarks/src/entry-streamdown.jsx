import React from "react";
import { Streamdown } from "streamdown";
import { math } from "@streamdown/math";
import { code } from "@streamdown/code";
import { mountReactBenchmark } from "./chat-shell.jsx";

const plugins = { math, code };
mountReactBenchmark((content, streaming) => (
  <Streamdown plugins={plugins} isAnimating={streaming}>
    {content}
  </Streamdown>
));
