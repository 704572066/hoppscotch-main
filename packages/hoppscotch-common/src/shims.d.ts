/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />
/// <reference types="unplugin-icons/types/vue" />
// 将 shims.d.ts 文件变成模块
// 使用 export {} 行将其标记为外部模块。 
// 模块是一个包含至少 1 个导入或导出语句的文件，因此我们需要这样做才能扩大全局范围。
export {}
// // Hoppscotch Browser Extension
interface PWExtensionHook {
  getVersion: () => { major: number; minor: number }
  sendRequest: (
    req: AxiosRequestConfig & { wantsBinary: boolean }
  ) => Promise<NetworkResponse>
  cancelRunningRequest: () => void
}

type HoppExtensionStatusHook = {
  status: ExtensionStatus
  _subscribers: {
    status?: ((...args: any[]) => any)[] | undefined
  }
  subscribe(prop: "status", func: (...args: any[]) => any): void
}
declare global {
  interface Window {
    __POSTWOMAN_EXTENSION_HOOK__: PWExtensionHook | undefined
    __HOPP_EXTENSION_STATUS_PROXY__: HoppExtensionStatusHook | undefined
  }
}

// Vue builtins
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 在 TypeScript 中导入 JavaScript 包，解决声明文件报错问题
declare module '~/helpers/oauth'