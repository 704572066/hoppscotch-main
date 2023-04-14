import { App } from "vue"
import { pipe } from "fp-ts/function" //fp-ts是typescript下的函数式编程框架
import * as A from "fp-ts/Array"
import { RouteLocationNormalized, Router } from "vue-router"

export type HoppModule = {
  /**
   * Define this function to get access to Vue App instance and augment
   * it (installing components, directives and plugins). Also useful for
   * early generic initializations. This function should be called first
   */
  onVueAppInit?: (app: App) => void

  /**
   * Called when the router is done initializing.
   * Used if a module requires access to the router instance
   */
  onRouterInit?: (app: App, router: Router) => void

  /**
   * Called when the root component (App.vue) is running setup.
   * This function is generally called last in the lifecycle.
   * This function executes with a component setup context, so you can
   * run composables within this and it should just be scoped to the
   * root component
   */
  onRootSetup?: () => void

  /**
   * Called by the router to tell all the modules before a route navigation
   * is made.
   */
  onBeforeRouteChange?: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    router: Router
  ) => void

  /**
   * Called by the router to tell all the modules that a route navigation has completed
   */
  onAfterRouteChange?: (to: RouteLocationNormalized, router: Router) => void
}

/**
 * All the modules Hoppscotch loads into the app
 */
// 对于vue3.0的项目，由于打包工具的变化，我们无法使用webpack提供的require.context了.
// Vite 支持使用特殊的 import.meta.glob 函数从文件系统导入多个模块
export const HOPP_MODULES = pipe(
  import.meta.glob("@modules/*.ts", { eager: true }),
  Object.values,
  A.map(({ default: defaultVal }) => defaultVal as HoppModule)
)
