<template>
  <AppPaneLayout layout-id="http">
    <template #primary>
      <HttpRequest />
      <HttpRequestOptions />
    </template>
    <template #secondary>
      <HttpResponse />
    </template>
    <template #sidebar>
      <HttpSidebar />
    </template>
  </AppPaneLayout>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
} from "vue"
import type { Subscription } from "rxjs"
import {
  HoppRESTRequest,
  HoppRESTAuthOAuth2,
  safelyExtractRESTRequest,
  isEqualHoppRESTRequest,
} from "@hoppscotch/data"
import {
  getRESTRequest,
  setRESTRequest,
  setRESTAuth,
  restAuth$,
  getDefaultRESTRequest,
} from "~/newstore/RESTSession"
import { translateExtURLParams } from "~/helpers/RESTExtURLParams"
import { pluckRef } from "@composables/ref"
import { useI18n } from "@composables/i18n"
import { useStream } from "@composables/stream"
import { useToast } from "@composables/toast"
import { onLoggedIn } from "@composables/auth"
import { loadRequestFromSync, startRequestSync } from "~/helpers/fb/request"
import { oauthRedirect } from "~/helpers/oauth"
import { useRoute } from "vue-router"

function bindRequestToURLParams() {
  const route = useRoute()
  // Get URL parameters and set that as the request
  onMounted(() => {
    const query = route.query
    // If query params are empty, or contains code or error param (these are from Oauth Redirect)
    // We skip URL params parsing
    if (Object.keys(query).length === 0 || query.code || query.error) return
    setRESTRequest(
      safelyExtractRESTRequest(
        translateExtURLParams(query),
        getDefaultRESTRequest()
      )
    )
  })
}

function oAuthURL() {
  const auth = useStream(
    restAuth$,
    { authType: "none", authActive: true },
    setRESTAuth
  )
  // as 类型断言只能够欺骗TypeScript 编译器，无法避免运行时的错误; 类型断言不是类型转换，它不会真的影响到变量的类型
  const oauth2Token = pluckRef(auth as Ref<HoppRESTAuthOAuth2>, "token")

  // 点击Generate token 会重定向url，导致刷新页面，触发onBeforeMount注册的函数，将拿到的access_token更新到页面上
  onBeforeMount(async () => {
    try {
      const tokenInfo = await oauthRedirect()
      // 因为 javascript 没有将hasOwnProperty作为一个敏感词，所以我们很有可能将对象的一个属性命名为hasOwnProperty，这样一来就无法再使用对象原型的 hasOwnProperty 方法来判断属性是否是来自原型链。
      // 需要使用Object.prototype.hasOwnProperty.call
      if (Object.prototype.hasOwnProperty.call(tokenInfo, "access_token")) {
        if (typeof tokenInfo === "object") {
          oauth2Token.value = tokenInfo.access_token
        }
      }

      // eslint-disable-next-line no-empty
    } catch (_) {}
  })
}

function setupRequestSync(
  confirmSync: Ref<boolean>,
  requestForSync: Ref<HoppRESTRequest | null>
) {
  const route = useRoute()

  // Subscription to request sync
  let sub: Subscription | null = null

  // Load request on login resolve and start sync
  onLoggedIn(async () => {
    if (
      Object.keys(route.query).length === 0 &&
      !(route.query.code || route.query.error)
    ) {
      const request = await loadRequestFromSync()
      if (request) {
        // getRESTRequest() 拿到的是url最新的值，输入框中的url地址发生变化会触发#dispatches$发送数据，进一步触发#state$发送数据
        if (!isEqualHoppRESTRequest(request, getRESTRequest())) {
          requestForSync.value = request
          confirmSync.value = true
        }
      }
    }

    sub = startRequestSync()
  })

  // Stop subscription to stop syncing
  onBeforeUnmount(() => {
    sub?.unsubscribe()
  })
}

export default defineComponent({
  // setup 调用时机： 创建组件实例 ，初始化props,紧接着调用setup函数。从生命周期钩子的视角来看，它会在 beforeCreate 钩子之前被调用
  setup() {
    const requestForSync = ref<HoppRESTRequest | null>(null)

    const confirmSync = ref(false)

    const toast = useToast()
    const t = useI18n()

    watch(confirmSync, (newValue) => {
      if (newValue) {
        toast.show(`${t("confirm.sync")}`, {
          duration: 0,
          action: [
            {
              text: `${t("action.yes")}`,
              onClick: (_, toastObject) => {
                syncRequest()
                toastObject.goAway(0)
              },
            },
            {
              text: `${t("action.no")}`,
              onClick: (_, toastObject) => {
                toastObject.goAway(0)
              },
            },
          ],
        })
      }
    })

    const syncRequest = () => {
      setRESTRequest(
        safelyExtractRESTRequest(requestForSync.value!, getDefaultRESTRequest())
      )
    }

    //设置request同步逻辑，如果登录后和登录前的request不同，提示是否restore登录后的request
    setupRequestSync(confirmSync, requestForSync)
    //http://localhost:3000/?url=https://www.baidu.com 如果浏览器地址中有带参数，那么会将参数绑定到request
    bindRequestToURLParams()
    //浏览器地址中有带oauth 重定向的，会更新authorization tab 中的oauth2.0的token值
    oAuthURL()

    return {
      confirmSync,
      syncRequest,
      oAuthURL,
      requestForSync,
    }
  },
})
</script>
