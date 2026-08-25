import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({test:{environment:"node",exclude:["tests/e2e/**","node_modules/**"],coverage:{provider:"v8",reporter:["text"],include:["lib/**/*.ts"],thresholds:{statements:93,branches:93,functions:93,lines:93}}},resolve:{alias:{"@":path.resolve(__dirname,".")}}});
