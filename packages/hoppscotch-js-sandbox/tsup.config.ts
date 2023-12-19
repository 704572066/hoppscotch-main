// tsup 是一个基于 ESBuild 实现在零配置的情况下快速打包 Typescript 模块的库，支持 .ts、.tsx的转换~
// 它基于esbuild，但是同时也选择融合其他的构建工具共同参与，弥补了esbuild的不足。比如tree shaking的功能依赖的是rollup
// Vite 目前主要用于项目打包中，而 Tsup则主要用于typescript库的打包
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "./lib/",
  format: ["esm", "cjs"],
  // 是否生成dts文件
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
})
