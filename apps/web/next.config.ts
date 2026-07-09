import type { NextConfig } from "next";
import { execSync } from "child_process";
import path from "path";

// Automatically build the shared workspace package on startup/build
try {
  console.log("Building shared dependency package...");
  execSync("npm run build", {
    cwd: path.resolve(process.cwd(), "../../packages/shared"),
    stdio: "inherit",
  });
} catch (error) {
  console.error("Failed to build shared package in next.config.ts:", error);
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
