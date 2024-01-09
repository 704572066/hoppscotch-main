import { AxiosResponse, AxiosRequestConfig } from "axios"
import { BehaviorSubject, Observable } from "rxjs"
import { cloneDeep } from "lodash-es"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import AxiosStrategy, {
  cancelRunningAxiosRequest,
} from "./strategies/AxiosStrategy"
import ExtensionStrategy, {
  cancelRunningExtensionRequest,
  hasExtensionInstalled,
} from "./strategies/ExtensionStrategy"
import { HoppRESTResponse } from "./types/HoppRESTResponse"
import { EffectiveHoppRESTRequest } from "./utils/EffectiveURL"
import { settingsStore } from "~/newstore/settings"

export type NetworkResponse = AxiosResponse<any> & {
  config?: {
    timeData?: {
      startTime: number
      endTime: number
    }
  }
}

export type NetworkStrategy = (
  req: AxiosRequestConfig
) => TE.TaskEither<any, NetworkResponse>

export const cancelRunningRequest = () => {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    cancelRunningExtensionRequest()
  } else {
    cancelRunningAxiosRequest()
  }
}

const isExtensionsAllowed = () => settingsStore.value.EXTENSIONS_ENABLED

const runAppropriateStrategy = (req: AxiosRequestConfig) => {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    return ExtensionStrategy(req)
  }

  return AxiosStrategy(req)
}

/**
 * Returns an identifier for how a request will be ran
 * if the system is asked to fire a request
 *
 */
export function getCurrentStrategyID() {
  if (isExtensionsAllowed() && hasExtensionInstalled()) {
    return "extension" as const
  } else if (settingsStore.value.PROXY_ENABLED) {
    return "proxy" as const
  } else {
    return "normal" as const
  }
}

export const sendNetworkRequest = (req: any) =>
  pipe(
    runAppropriateStrategy(req),
    TE.getOrElse((e) => {
      throw e
    })
  )()

const processResponse = (
  res: NetworkResponse,
  req: EffectiveHoppRESTRequest,
  backupTimeStart: number,
  backupTimeEnd: number,
  successState: HoppRESTResponse["type"]
) =>
  pipe(
    TE.Do,

    // Calculate the content length
    TE.bind("contentLength", () =>
      TE.of(
        res.headers["content-length"]
          ? parseInt(res.headers["content-length"])
          : (res.data as ArrayBuffer).byteLength
      )
    ),

    // Building the final response object
    TE.map(
      ({ contentLength }) =>
        <HoppRESTResponse>{
          type: successState,
          statusCode: res.status,
          body: res.data,
          headers: Object.keys(res.headers).map((x) => ({
            key: x,
            value: res.headers[x],
          })),
          meta: {
            responseSize: contentLength,
            responseDuration: backupTimeEnd - backupTimeStart,
          },
          req,
        }
    )
  )

export function createRESTNetworkRequestStream(
  request: EffectiveHoppRESTRequest
): Observable<HoppRESTResponse> {
  const response = new BehaviorSubject<HoppRESTResponse>({
    type: "loading",
    req: request,
  })
  // 使用 Do符号:fp-ts公开了一个“do”语法，可以用 chain 缓解过度嵌套。
  // 尤其是当您需要捕获大量稍后在程序流的不同部分中重用的值时。
  pipe(
    TE.Do,

    // Get a deep clone of the request
    TE.bind("req", () => TE.of(cloneDeep(request))),

    // Assembling headers object
    // 在 TypeScript 中，可以使用数组的 reduce 方法将数组中的元素逐个处理，并将处理后的结果累加到一个最终值中
    /*     
    const str: string = "pidancode.com";
    const result: string = str.split("")
      .reduce((acc: string, char: string) => {
        return acc + char.toUpperCase();
      }, "");
    console.log(result);
    // 输出 PIDADNCODE.COM
    在上述代码中，我们首先使用字符串的 split 方法将字符串拆分成一个字符数组，然后使用 reduce 方法将数组中的所有字符转换成大写字母，并将它们拼接成一个新的字符串。 
    */
    TE.bind("headers", ({ req }) =>
      TE.of(
        req.effectiveFinalHeaders.reduce((acc, { key, value }) => {
          return Object.assign(acc, { [key]: value })
        }, {})
      )
    ),

    // Assembling params object
    // URLSearchParams 对象专门用于处理url网址信息中的查询字符串，在网址字符串中通常都是 ? 问号之后的内容(不包含问号)。
    /* 
    const urlSearchParams = new URLSearchParams('wd=中国&city=上海')
    urlSearchParams.get('city') // 输出：'上海' 
    */
    TE.bind("params", ({ req }) => {
      const params = new URLSearchParams()
      req.effectiveFinalParams.forEach((x) => {
        params.append(x.key, x.value)
      })
      return TE.of(params)
    }),

    // Keeping the backup start time
    TE.bind("backupTimeStart", () => TE.of(Date.now())),

    // Running the request and getting the response
    TE.bind("res", ({ req, headers, params }) =>
      runAppropriateStrategy({
        method: req.method as any,
        url: req.effectiveFinalURL.trim(),
        headers,
        params,
        data: req.effectiveFinalBody,
      })
    ),

    // Getting the backup end time
    TE.bind("backupTimeEnd", () => TE.of(Date.now())),

    // Assemble the final response object
    /* 
    What a W suffix means, e.g. chainW or chainEitherKW
    W means Widen. Functions that end with W are able to aggregate errors into a union (for Either based data types) 
    or environments into an intersection (for Reader based data types). 
    */
    TE.chainW(({ req, res, backupTimeEnd, backupTimeStart }) =>
      processResponse(res, req, backupTimeStart, backupTimeEnd, "success")
    ),

    // Writing success state to the stream
    TE.chain((res) => {
      response.next(res)
      response.complete()

      return TE.of(res)
    }),

    // Package the error type
    TE.getOrElseW((e) => {
      const obj: HoppRESTResponse = {
        type: "network_fail",
        error: e,
        req: request,
      }

      response.next(obj)
      response.complete()

      return T.of(obj)
    })
  )()

  return response
}
