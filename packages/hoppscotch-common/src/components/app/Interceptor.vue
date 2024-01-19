<template>
  <div class="flex flex-col space-y-2">
    <div class="flex flex-col px-4 pt-2">
      <h2 class="inline-flex pb-1 font-semibold text-secondaryDark">
        {{ t("settings.interceptor") }}
      </h2>
      <p class="inline-flex text-tiny">
        {{ t("settings.interceptor_description") }}
      </p>
    </div>
    <SmartRadioGroup v-model="interceptorSelection" :radios="interceptors" />
    <div
      v-if="interceptorSelection == 'EXTENSIONS_ENABLED' && !extensionVersion"
      class="flex space-x-2"
    >
      <ButtonSecondary
        to="https://chrome.google.com/webstore/detail/hoppscotch-browser-extens/amknoiejhlmhancpahfcfcfhllgkpbld"
        blank
        :icon="IconChrome"
        label="Chrome"
        outline
        class="!flex-1"
      />
      <ButtonSecondary
        to="https://addons.mozilla.org/en-US/firefox/addon/hoppscotch"
        blank
        :icon="IconFirefox"
        label="Firefox"
        outline
        class="!flex-1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import IconChrome from "~icons/brands/chrome"
import IconFirefox from "~icons/brands/firefox"
import { computed } from "vue"
import { applySetting, toggleSetting } from "~/newstore/settings"
import { useSetting } from "@composables/settings"
import { useI18n } from "@composables/i18n"
import { useReadonlyStream } from "@composables/stream"
import { extensionStatus$ } from "~/newstore/HoppExtension"

const t = useI18n()

const PROXY_ENABLED = useSetting("PROXY_ENABLED")
const EXTENSIONS_ENABLED = useSetting("EXTENSIONS_ENABLED")

const currentExtensionStatus = useReadonlyStream(extensionStatus$, null)
// "?." ：可选链，在遇到null或undefined时可以立即停止某些表达式的执行
// "??" ：空值合并运算符，当左侧操作数为 null 或 undefined 时，其返回右侧的操作数，否则返回左侧的操作数
// 例：console.log(null ?? "str")，输出str
const extensionVersion = computed(() => {
  return currentExtensionStatus.value === "available"
    ? window.__POSTWOMAN_EXTENSION_HOOK__?.getVersion() ?? null
    : null
})
/* 
s const是TypeScript中的一个用于修饰符，它可以被用来修改类型推断的行为。当as cons修饰符用在变量声明或表达式的类型上时，它会强制TypeScript将变量或表达式的类型视为不可变的（immutable）。这意味着：

•  变量或表达式的值不能被修改，否则会报错。例如，const foo = 1 as const; foo = 2;会报错，因为foo是不可变的。

•  变量或表达式的类型不能被扩展（widening），而是被缩小（narrowing）到最精确的类型。例如，const foo = 1 as const;的类型不是number，而是字面量类型1。这样可以避免一些潜在的错误，比如在switch语句中遗漏某些情况。

•  如果变量或表达式是一个对象或数组，那么它的所有属性和元素也都会被视为不可变的，并且它们的类型也会被缩小到最精确的类型。例如，const foo = { bar: 1, baz: "hello" } as const;的类型不是{ bar: number, baz: string }，而是{ readonly bar: 1, readonly baz: "hello" }。

as cons修饰符通常用于以下几种场景：

•  定义一些常量，比如枚举值、配置项等，这样可以保证它们不会被修改，并且可以提供更精确的类型提示。

•  定义一些字面量类型，比如联合类型、元组类型等，这样可以避免类型扩展，并且可以进行網羅性检查（exhaustiveness check）。

•  定义一些不可变的对象或数组，比如React中的props、state等，这样可以提高性能，并且可以避免一些副作用。
 */
const interceptors = computed(() => [
  { value: "BROWSER_ENABLED" as const, label: t("state.none") },
  { value: "PROXY_ENABLED" as const, label: t("settings.proxy") },
  {
    value: "EXTENSIONS_ENABLED" as const,
    label:
      `${t("settings.extensions")}: ` +
      (extensionVersion.value !== null
        ? `v${extensionVersion.value.major}.${extensionVersion.value.minor}`
        : t("settings.extension_ver_not_reported")),
  },
])
/* 
元组是特有的数据类型，数组内的成员可以是各个类型的，但是每个成员要声明其类型。越界会报错

在方括号里面写各个成员的类型。

const s:[string, string, boolean] = ['a', 'b', true];

元组和数组最大的区别：元组的成员类型写在方括号里面，数组的成员类型写在方括号外部。

// 数组
let a:number[] = [1];

// 元组
let t:[number] = [1];

1. 不写成员类型，ts自动推断可能会出错
如果不给出成员的数据类型，ts会根据其值推断，可能会造成不同。

这里变量a本来是只读数组类型，结果没有显式声明，ts结果推断为了联合类型的数组。

// a 的类型被推断为 (number | boolean)[]
let a = [1, true];

元组的成员可以添加成员名，这个成员名是说明性的，可以任意取名，没有实际作用。

type Color = [
  red: number,
  green: number,
  blue: number
];
const c:Color = [255, 255, 255];

上面示例中，类型Color是一个元组，它有三个成员。每个成员都有一个名字，写在具体类型的前面，使用冒号分隔。这几个名字可以随便取，没有实际作用，只是用来说明每个成员的含义。

元组可以通过方括号，读取成员类型。

type Tuple = [string, number];
type Age = Tuple[1]; // number

上面示例中，Tuple[1]返回1号位置的成员类型。

由于元组的成员都是数值索引，即索引类型都是number，所以可以像下面这样读取。

type Tuple = [string, number, Date];
type TupleEl = Tuple[number];  // string|number|Date

上面示例中，Tuple[number]表示元组Tuple的所有数值索引的成员类型，所以返回string|number|Date，即这个类型是三种值的联合类型。
 */
type InterceptorMode = typeof interceptors["value"][number]["value"]
// get set可直接修改interceptorSelection
const interceptorSelection = computed<InterceptorMode>({
  get() {
    if (PROXY_ENABLED.value) return "PROXY_ENABLED"
    if (EXTENSIONS_ENABLED.value) return "EXTENSIONS_ENABLED"
    return "BROWSER_ENABLED"
  },
  set(val) {
    if (val === "EXTENSIONS_ENABLED") {
      applySetting("EXTENSIONS_ENABLED", true)
      if (PROXY_ENABLED.value) toggleSetting("PROXY_ENABLED")
    }
    if (val === "PROXY_ENABLED") {
      applySetting("PROXY_ENABLED", true)
      if (EXTENSIONS_ENABLED.value) toggleSetting("EXTENSIONS_ENABLED")
    }
    if (val === "BROWSER_ENABLED") {
      applySetting("PROXY_ENABLED", false)
      applySetting("EXTENSIONS_ENABLED", false)
    }
  },
})
</script>
