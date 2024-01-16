<template>
  <div class="flex flex-col flex-1">
    <div
      class="sticky z-10 flex items-center justify-between flex-shrink-0 pl-4 overflow-x-auto border-b bg-primary border-dividerLight top-upperMobileStickyFold sm:top-upperMobileTertiaryStickyFold"
    >
      <label class="font-semibold truncate text-secondaryLight">
        {{ t("request.raw_body") }}
      </label>
      <div class="flex">
        <ButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          to="https://docs.hoppscotch.io/features/body"
          blank
          :title="t('app.wiki')"
          :icon="IconHelpCircle"
        />
        <ButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="t('action.clear')"
          :icon="IconTrash2"
          @click="clearContent"
        />
        <ButtonSecondary
          v-tippy="{ theme: 'tooltip' }"
          :title="t('state.linewrap')"
          :class="{ '!text-accent': linewrapEnabled }"
          :icon="IconWrapText"
          @click.prevent="linewrapEnabled = !linewrapEnabled"
        />
        <ButtonSecondary
          v-if="contentType && contentType.endsWith('json')"
          v-tippy="{ theme: 'tooltip' }"
          :title="t('action.prettify')"
          :icon="prettifyIcon"
          @click="prettifyRequestBody"
        />
        <label for="payload">
          <ButtonSecondary
            v-tippy="{ theme: 'tooltip' }"
            :title="t('import.title')"
            :icon="IconFilePlus"
            @click="$refs.payload.click()"
          />
        </label>
        <!-- 建议不要通过click绑定事件，对待input标签最好通过change来触发，change绑定的事件是一定要等到input框的value值改变之后才会被触发。
        click执行的时间要早于change执行的时间，因为v-modal的时间是一个异步的。
        当点击之后，v-modal可能还没有来得及将绑定在data里面的数据改变，click绑定的事件就执行了，这会导致click绑定事件里面拿到的data数据不是最新的。-->
        <input
          ref="payload"
          class="input"
          name="payload"
          type="file"
          @change="uploadPayload"
        />
      </div>
    </div>
    <div ref="rawBodyParameters" class="flex flex-col flex-1"></div>
  </div>
</template>

<script setup lang="ts">
import IconHelpCircle from "~icons/lucide/help-circle"
import IconWrapText from "~icons/lucide/wrap-text"
import IconTrash2 from "~icons/lucide/trash-2"
import IconFilePlus from "~icons/lucide/file-plus"
import IconWand2 from "~icons/lucide/wand-2"
import IconCheck from "~icons/lucide/check"
import IconInfo from "~icons/lucide/info"
import { computed, reactive, Ref, ref, watch } from "vue"
import * as TO from "fp-ts/TaskOption"
import { pipe } from "fp-ts/function"
import { ValidContentTypes } from "@hoppscotch/data"
import { refAutoReset } from "@vueuse/core"
import { useCodemirror } from "@composables/codemirror"
import { getEditorLangForMimeType } from "@helpers/editorutils"
import { pluckRef } from "@composables/ref"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { isJSONContentType } from "~/helpers/utils/contenttypes"
import { useRESTRequestBody } from "~/newstore/RESTSession"

import jsonLinter from "~/helpers/editor/linting/json"
import { readFileAsText } from "~/helpers/functional/files"

type PossibleContentTypes = Exclude<
  ValidContentTypes,
  "multipart/form-data" | "application/x-www-form-urlencoded"
>

const t = useI18n()

const props = defineProps<{
  contentType: PossibleContentTypes
}>()

const toast = useToast()

const rawParamsBody = pluckRef(useRESTRequestBody(), "body")

const prettifyIcon = refAutoReset<
  typeof IconWand2 | typeof IconCheck | typeof IconInfo
>(IconWand2, 1000)

const rawInputEditorLang = computed(() =>
  getEditorLangForMimeType(props.contentType)
)
const langLinter = computed(() =>
  isJSONContentType(props.contentType) ? jsonLinter : null
)

const linewrapEnabled = ref(true)
const rawBodyParameters = ref<any | null>(null)

const codemirrorValue: Ref<string | undefined> =
  typeof rawParamsBody.value == "string"
    ? ref(rawParamsBody.value)
    : ref(undefined)

watch(rawParamsBody, (newVal) => {
  typeof newVal == "string"
    ? (codemirrorValue.value = newVal)
    : (codemirrorValue.value = undefined)
})

// propagate the edits from codemirror back to the body
watch(codemirrorValue, (updatedValue) => {
  if (updatedValue && updatedValue != rawParamsBody.value) {
    rawParamsBody.value = updatedValue
  }
})

useCodemirror(
  rawBodyParameters,
  codemirrorValue,
  reactive({
    extendedEditorConfig: {
      lineWrapping: linewrapEnabled,
      mode: rawInputEditorLang,
      placeholder: t("request.raw_body").toString(),
    },
    linter: langLinter,
    completer: null,
    environmentHighlights: true,
  })
)

const clearContent = () => {
  rawParamsBody.value = ""
}
// TaskOption<A> represents an asynchronous computation that, when run, will produce a value of type Option<A>. 
// In simpler terms, it's an operation that, once completed, might give you a result (some(value)) or might tell you that there's no result (none), and this entire process is asynchronous.
// export interface TaskOption<A> extends Task<Option<A>> {}
const uploadPayload = async (e: InputEvent) => {
  await pipe(
    // 如果我们使用可选链接 ?，files变量不存在它将返回 undefined 作为输出。
    (e.target as HTMLInputElement).files?.[0],
    TO.of,
    // When calling predicate with value returns true, then running TaskOption returns Some(value). Otherwise return None.
    /* 。
       在 TypeScript 中，is是一个 类型谓词，用来帮助 ts 编译器 收窄 变量的类型。
       具体场景是，我们需要通过if来判断某个变量的类型，从而针对特定的类型执行一些特定的操作。
       当然对于一些内置的判断方式，例如typeof v === 'number'，ts 已经默认支持了类型的自动收窄：
       function test(v: number | undefined | null) {
          if (typeof v === 'number') {
              console.log(Math.round(v))
          }
       }
       上述代码 ts 不会报错，并且能观察到变量的类型被收窄了

       function isString(s:unknown):s is string
       {
          return typeof s === 'string'
       }
       // 判断参数是否为字符串,是在调用转大写方法
       function ifUpperCase(str:unknown)
       {
          if(isstring(str)){
            str.toUpperCase()
            // (parameter) str: string 
          }
       }

       平常对某value的用as断言为某种类型，但是as会出现不安全的问题，如果使用is对类型进行收窄，对代码的安全性更高
    */
    TO.chain(TO.fromPredicate((f): f is File => f !== undefined)),
    TO.chain(readFileAsText),
    // export declare const matchW: <B, A, C>(onNone: () => B, onSome: (a: A) => C) => (ma: TaskOption<A>) => T.Task<B | C>
    TO.matchW(
      () => toast.error(`${t("action.choose_file")}`),
      (result) => {
        rawParamsBody.value = result
        toast.success(`${t("state.file_imported")}`)
      }
    )
  )()
}
const prettifyRequestBody = () => {
  try {
    const jsonObj = JSON.parse(rawParamsBody.value)
    rawParamsBody.value = JSON.stringify(jsonObj, null, 2)
    prettifyIcon.value = IconCheck
  } catch (e) {
    console.error(e)
    prettifyIcon.value = IconInfo
    toast.error(`${t("error.json_prettify_invalid_body")}`)
  }
}
</script>
