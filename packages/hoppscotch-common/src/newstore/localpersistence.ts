/* eslint-disable no-restricted-globals, no-restricted-syntax */

import { clone, cloneDeep, assign, isEmpty } from "lodash-es"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function" // fp-ts是typescript下的函数式编程框架
import {
  safelyExtractRESTRequest,
  translateToNewRequest,
  translateToNewRESTCollection,
  translateToNewGQLCollection,
  Environment,
} from "@hoppscotch/data"
import {
  settingsStore,
  bulkApplySettings,
  defaultSettings,
  applySetting,
  HoppAccentColor,
  HoppBgColor,
} from "./settings"
import {
  restHistoryStore,
  graphqlHistoryStore,
  setRESTHistoryEntries,
  setGraphqlHistoryEntries,
  translateToNewRESTHistory,
  translateToNewGQLHistory,
} from "./history"
import {
  restCollectionStore,
  graphqlCollectionStore,
  setGraphqlCollections,
  setRESTCollections,
} from "./collections"
import {
  replaceEnvironments,
  environments$,
  addGlobalEnvVariable,
  setGlobalEnvVariables,
  globalEnv$,
  setSelectedEnvironmentIndex,
  selectedEnvironmentIndex$,
} from "./environments"
import {
  getDefaultRESTRequest,
  restRequest$,
  setRESTRequest,
} from "./RESTSession"
import { WSRequest$, setWSRequest } from "./WebSocketSession"
import { SIORequest$, setSIORequest } from "./SocketIOSession"
import { SSERequest$, setSSERequest } from "./SSESession"
import { MQTTRequest$, setMQTTRequest } from "./MQTTSession"
import { bulkApplyLocalState, localStateStore } from "./localstate"
import { StorageLike } from "@vueuse/core"

function checkAndMigrateOldSettings() {
  const vuexData = JSON.parse(window.localStorage.getItem("vuex") || "{}")
  if (isEmpty(vuexData)) return
  // 对象解构赋值使用了类似于对象字面量的表示方式。赋值运算符右侧为需要解构的对象，赋值运算符左侧是解构赋值的目标，在解构赋值的同时也支持声明新的变量。
  // 下例中，将对point对象进行解构，然后把属性x和y的值赋值给变量x和y：
  // const point = { x: 0, y: 1 };
  // const { x, y } = point;
  // console.log(x)
  // console.log(y)
  const { postwoman } = vuexData
  // 后缀是!，只是告诉typescript编译器对于null和undefined不做显示的检查，生成的js文件中还是x.toUpperCase()，如果此时x为null，那么就会出现运行时异常
  // 后缀是?，代表是一个空判断，只有非空是，才会执行x.toUpperCase()，生成的js文件中是增加了null或者undefined判断的，生成的js是(x === null || x === void 0 ? void 0 : x.toUpperCase())
  if (!isEmpty(postwoman?.settings)) {
    const settingsData = assign(clone(defaultSettings), postwoman.settings)

    window.localStorage.setItem("settings", JSON.stringify(settingsData))

    delete postwoman.settings
    window.localStorage.setItem("vuex", JSON.stringify(vuexData))
  }

  if (postwoman?.collections) {
    window.localStorage.setItem(
      "collections",
      JSON.stringify(postwoman.collections)
    )

    delete postwoman.collections
    window.localStorage.setItem("vuex", JSON.stringify(vuexData))
  }

  if (postwoman?.collectionsGraphql) {
    window.localStorage.setItem(
      "collectionsGraphql",
      JSON.stringify(postwoman.collectionsGraphql)
    )

    delete postwoman.collectionsGraphql
    window.localStorage.setItem("vuex", JSON.stringify(vuexData))
  }

  if (postwoman?.environments) {
    window.localStorage.setItem(
      "environments",
      JSON.stringify(postwoman.environments)
    )

    delete postwoman.environments
    window.localStorage.setItem("vuex", JSON.stringify(vuexData))
  }

  if (window.localStorage.getItem("THEME_COLOR")) {
    const themeColor = window.localStorage.getItem("THEME_COLOR")
    applySetting("THEME_COLOR", themeColor as HoppAccentColor)

    window.localStorage.removeItem("THEME_COLOR")
  }

  if (window.localStorage.getItem("nuxt-color-mode")) {
    const color = window.localStorage.getItem("nuxt-color-mode") as HoppBgColor
    applySetting("BG_COLOR", color)

    window.localStorage.removeItem("nuxt-color-mode")
  }
}

function setupLocalStatePersistence() {
  const localStateData = JSON.parse(
    window.localStorage.getItem("localState") ?? "{}"
  )

  if (localStateData) bulkApplyLocalState(localStateData) // 批量应用本地状态

  localStateStore.subject$.subscribe((state) => {
    window.localStorage.setItem("localState", JSON.stringify(state))
  })
}

function setupSettingsPersistence() {
  const settingsData = JSON.parse(
    window.localStorage.getItem("settings") || "{}"
  )

  if (settingsData) {
    bulkApplySettings(settingsData)
  }

  settingsStore.subject$.subscribe((settings) => {
    window.localStorage.setItem("settings", JSON.stringify(settings))
  })
}

function setupHistoryPersistence() {
  // rest history 记录存储在浏览器本地
  const restHistoryData = JSON.parse(
    window.localStorage.getItem("history") || "[]"
  ).map(translateToNewRESTHistory)

  const graphqlHistoryData = JSON.parse(
    window.localStorage.getItem("graphqlHistory") || "[]"
  ).map(translateToNewGQLHistory)

  setRESTHistoryEntries(restHistoryData)
  setGraphqlHistoryEntries(graphqlHistoryData)

  restHistoryStore.subject$.subscribe(({ state }) => {
    window.localStorage.setItem("history", JSON.stringify(state))
  })

  graphqlHistoryStore.subject$.subscribe(({ state }) => {
    window.localStorage.setItem("graphqlHistory", JSON.stringify(state))
  })
}

function setupCollectionsPersistence() {
  const restCollectionData = JSON.parse(
    window.localStorage.getItem("collections") || "[]"
  ).map(translateToNewRESTCollection)

  const graphqlCollectionData = JSON.parse(
    window.localStorage.getItem("collectionsGraphql") || "[]"
  ).map(translateToNewGQLCollection)

  setRESTCollections(restCollectionData)
  setGraphqlCollections(graphqlCollectionData)

  restCollectionStore.subject$.subscribe(({ state }) => {
    window.localStorage.setItem("collections", JSON.stringify(state))
  })

  graphqlCollectionStore.subject$.subscribe(({ state }) => {
    window.localStorage.setItem("collectionsGraphql", JSON.stringify(state))
  })
}

function setupEnvironmentsPersistence() {
  const environmentsData: Environment[] = JSON.parse(
    window.localStorage.getItem("environments") || "[]"
  )

  // Check if a global env is defined and if so move that to globals
  const globalIndex = environmentsData.findIndex(
    (x) => x.name.toLowerCase() === "globals"
  )

  if (globalIndex !== -1) {
    const globalEnv = environmentsData[globalIndex]
    globalEnv.variables.forEach((variable) => addGlobalEnvVariable(variable))

    // Remove global from environments
    environmentsData.splice(globalIndex, 1)

    // Just sync the changes manually
    window.localStorage.setItem(
      "environments",
      JSON.stringify(environmentsData)
    )
  }

  replaceEnvironments(environmentsData)

  environments$.subscribe((envs) => {
    window.localStorage.setItem("environments", JSON.stringify(envs))
  })
}

function setupSelectedEnvPersistence() {
  const selectedEnvIndex = pipe(
    // Value from local storage can be nullable
    O.fromNullable(window.localStorage.getItem("selectedEnvIndex")),
    O.map(parseInt), // If not null, parse to integer
    O.chain(
      O.fromPredicate(
        Number.isInteger // Check if the number is proper int (not NaN)
      )
    ),
    O.getOrElse(() => -1) // If all the above conditions pass, we are good, else set default value (-1)
  )
  // Check if current environment index is -1 ie. no environment is selected
  if (selectedEnvIndex === -1) {
    setSelectedEnvironmentIndex({
      type: "NO_ENV_SELECTED",
    })
  } else {
    setSelectedEnvironmentIndex({
      type: "MY_ENV",
      index: selectedEnvIndex,
    })
  }

  selectedEnvironmentIndex$.subscribe((envIndex) => {
    if (envIndex.type === "MY_ENV") {
      window.localStorage.setItem("selectedEnvIndex", envIndex.index.toString())
    } else {
      window.localStorage.setItem("selectedEnvIndex", "-1")
    }
  })
}

function setupWebsocketPersistence() {
  const request = JSON.parse(
    window.localStorage.getItem("WebsocketRequest") || "null"
  )

  setWSRequest(request)

  WSRequest$.subscribe((req) => {
    window.localStorage.setItem("WebsocketRequest", JSON.stringify(req))
  })
}

function setupSocketIOPersistence() {
  const request = JSON.parse(
    window.localStorage.getItem("SocketIORequest") || "null"
  )

  setSIORequest(request)

  SIORequest$.subscribe((req) => {
    window.localStorage.setItem("SocketIORequest", JSON.stringify(req))
  })
}

function setupSSEPersistence() {
  const request = JSON.parse(
    window.localStorage.getItem("SSERequest") || "null"
  )

  setSSERequest(request)

  SSERequest$.subscribe((req) => {
    window.localStorage.setItem("SSERequest", JSON.stringify(req))
  })
}

function setupMQTTPersistence() {
  const request = JSON.parse(
    window.localStorage.getItem("MQTTRequest") || "null"
  )

  setMQTTRequest(request)

  MQTTRequest$.subscribe((req) => {
    window.localStorage.setItem("MQTTRequest", JSON.stringify(req))
  })
}

function setupGlobalEnvsPersistence() {
  const globals: Environment["variables"] = JSON.parse(
    window.localStorage.getItem("globalEnv") || "[]"
  )

  setGlobalEnvVariables(globals)

  globalEnv$.subscribe((vars) => {
    window.localStorage.setItem("globalEnv", JSON.stringify(vars))
  })
}

function setupRequestPersistence() {
  const localRequest = JSON.parse(
    window.localStorage.getItem("restRequest") || "null"
  )

  if (localRequest) {
    const parsedLocal = translateToNewRequest(localRequest)
    setRESTRequest(
      safelyExtractRESTRequest(parsedLocal, getDefaultRESTRequest())
    )
  }

  restRequest$.subscribe((req) => {
    const reqClone = cloneDeep(req)
    if (reqClone.body.contentType === "multipart/form-data") {
      reqClone.body.body = reqClone.body.body.map((x) => {
        if (x.isFile)
          return {
            ...x,
            isFile: false,
            value: "",
          }
        else return x
      })
    }
    window.localStorage.setItem("restRequest", JSON.stringify(reqClone))
  })
}

export function setupLocalPersistence() {
  checkAndMigrateOldSettings()

  setupLocalStatePersistence()
  setupSettingsPersistence()
  setupRequestPersistence()
  setupHistoryPersistence()
  setupCollectionsPersistence()
  setupGlobalEnvsPersistence()
  setupEnvironmentsPersistence()
  setupSelectedEnvPersistence()
  setupWebsocketPersistence()
  setupSocketIOPersistence()
  setupSSEPersistence()
  setupMQTTPersistence()
}

/**
 * Gets a value in LocalStorage.
 *
 * NOTE: Use LocalStorage to only store non-reactive simple data
 * For more complex data, use stores and connect it to localpersistence
 */
export function getLocalConfig(name: string) {
  return window.localStorage.getItem(name)
}

/**
 * Sets a value in LocalStorage.
 *
 * NOTE: Use LocalStorage to only store non-reactive simple data
 * For more complex data, use stores and connect it to localpersistence
 */
export function setLocalConfig(key: string, value: string) {
  window.localStorage.setItem(key, value)
}

/**
 * Clear config value in LocalStorage.
 * @param key Key to be cleared
 */
export function removeLocalConfig(key: string) {
  window.localStorage.removeItem(key)
}

/**
 * The storage system we are using in the application.
 * NOTE: This is a placeholder for being used in app.
 * This entire redirection of localStorage is to allow for
 * not refactoring the entire app code when we refactor when
 * we are building the native (which may lack localStorage,
 * or use a custom system)
 */
export const hoppLocalConfigStorage: StorageLike = localStorage
