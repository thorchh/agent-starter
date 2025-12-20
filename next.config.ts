import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * Cursor/monorepo environments can confuse Next’s workspace-root inference
   * when multiple lockfiles exist on disk.
   *
   * Setting this keeps file tracing rooted to this project directory.
   */
  outputFileTracingRoot: path.join(process.cwd()),
};

export default nextConfig;
