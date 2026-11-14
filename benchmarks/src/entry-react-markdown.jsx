import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { mountReactBenchmark } from "./chat-shell.jsx";

const plugins = [remarkGfm];
mountReactBenchmark((content) => (
  <ReactMarkdown remarkPlugins={plugins}>{content}</ReactMarkdown>
));
