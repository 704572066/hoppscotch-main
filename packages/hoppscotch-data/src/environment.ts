import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"

export type Environment = {
  name: string
  variables: {
    key: string
    value: string
  }[]
}

const REGEX_ENV_VAR = /<<([^>]*)>>/g // "<<myVariable>>"

/**
 * How much times can we expand environment variables
 */
const ENV_MAX_EXPAND_LIMIT = 10

/**
 * Error state when there is a suspected loop while
 * recursively expanding variables
 */
const ENV_EXPAND_LOOP = "ENV_EXPAND_LOOP" as const

export function parseBodyEnvVariablesE(
  body: string,
  env: Environment["variables"]
) {
  let result = body
  let depth = 0

  while (result.match(REGEX_ENV_VAR) != null && depth <= ENV_MAX_EXPAND_LIMIT) {
    result = result.replace(REGEX_ENV_VAR, (key) => {
      const found = env.find(
        (envVar) => envVar.key === key.replace(/[<>]/g, "")
      )
      return found ? found.value : key
    })

    depth++
  }

  return depth > ENV_MAX_EXPAND_LIMIT
    ? E.left(ENV_EXPAND_LOOP)
    : E.right(result)
}

/**
 * @deprecated Use `parseBodyEnvVariablesE` instead.
 */
export const parseBodyEnvVariables = (
  body: string,
  env: Environment["variables"]
) =>
  pipe(
    parseBodyEnvVariablesE(body, env),
    E.getOrElse(() => body)
  )

export function parseTemplateStringE(
  str: string,
  variables: Environment["variables"]
) {
  if (!variables || !str) {
    return E.right(str)
  }

  let result = str
  let depth = 0

  while (result.match(REGEX_ENV_VAR) != null && depth <= ENV_MAX_EXPAND_LIMIT) {
    // ECMAScript v3 规定，replace() 方法的参数 replacement 可以是函数而不是字符串。
    // 在这种情况下，每个匹配都调用该函数，它返回的字符串将作为替换文本使用。该函数的第一个参数是匹配模式的字符串。
    // 接下来的参数是与模式中的子表达式匹配的字符串，可以有 0 个或多个这样的参数。https://www.jb51.net/article/22614.htm
    result = decodeURI(encodeURI(result)).replace(
      REGEX_ENV_VAR,
      (_, p1) => variables.find((x) => x.key === p1)?.value || ""
    )
    depth++
  }

  return depth > ENV_MAX_EXPAND_LIMIT
    ? E.left(ENV_EXPAND_LOOP)
    : E.right(result)
}

/**
 * @deprecated Use `parseTemplateStringE` instead
 */
export const parseTemplateString = (
  str: string,
  variables: Environment["variables"]
) =>
  pipe(
    parseTemplateStringE(str, variables),
    E.getOrElse(() => str)
  )
