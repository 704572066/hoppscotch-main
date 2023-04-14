import { createHead, useHead } from "@vueuse/head" // VueUse为我们提供了一种简单的方法来更新我们应用程序的 head 部分--页面 title、scripts和其他可能放在这里的的东西
import { APP_INFO } from "~/../meta"
import { HoppModule } from "."

export default <HoppModule>{
  onVueAppInit(app) {
    const head = createHead({
      title: `${APP_INFO.name} • ${APP_INFO.shortDescription}`,
      titleTemplate(title) {
        return title === "Hoppscotch" ? title : `${title} • Hoppscotch`
      },
    })

    app.use(head)
  },

  onRootSetup() {
    // Load the defaults into the app
    useHead({})
  },
}
