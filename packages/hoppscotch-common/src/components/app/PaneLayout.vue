<template>
  <Splitpanes
    class="smart-splitter"
    :rtl="SIDEBAR_ON_LEFT && mdAndLarger"
    :class="{
      '!flex-row-reverse': SIDEBAR_ON_LEFT && mdAndLarger,
    }"
    :horizontal="!mdAndLarger"
    @resize="setPaneEvent($event, 'vertical')"
  >
    <Pane
      :size="PANE_MAIN_SIZE"
      min-size="65"
      class="flex flex-col !overflow-auto"
    >
      <Splitpanes
        class="smart-splitter"
        :horizontal="COLUMN_LAYOUT"
        @resize="setPaneEvent($event, 'horizontal')"
      >
        <Pane :size="PANE_MAIN_TOP_SIZE" class="flex flex-col !overflow-auto">
          <slot name="primary" />
        </Pane>
        <Pane
          :size="PANE_MAIN_BOTTOM_SIZE"
          class="flex flex-col !overflow-auto"
        >
          <slot name="secondary" />
        </Pane>
      </Splitpanes>
    </Pane>
    <Pane
      v-if="SIDEBAR && hasSidebar"
      :size="PANE_SIDEBAR_SIZE"
      min-size="20"
      class="flex flex-col !overflow-auto bg-primaryContrast"
    >
      <slot name="sidebar" />
    </Pane>
  </Splitpanes>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes"

import "splitpanes/dist/splitpanes.css"

import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
import { computed, useSlots, ref } from "vue"
import { useSetting } from "@composables/settings"
import { setLocalConfig, getLocalConfig } from "~/newstore/localpersistence"

const SIDEBAR_ON_LEFT = useSetting("SIDEBAR_ON_LEFT")
// useBreakpoints 根据当前屏幕大小来设置不同的样式
const breakpoints = useBreakpoints(breakpointsTailwind)
const mdAndLarger = breakpoints.greater("md")

const COLUMN_LAYOUT = useSetting("COLUMN_LAYOUT")

const SIDEBAR = useSetting("SIDEBAR")

const slots = useSlots()
// computed属性可以接收一个计算函数，并在计算函数中使用其他响应式数据的值进行计算。
// 当任何一个参与计算的响应式数据发生变化时，computed属性会自动重新计算其值，并触发相应的依赖更新。
const hasSidebar = computed(() => !!slots.sidebar)
// defineProps是Vue3中的一种新的组件数据传递方式，可以用于在子组件中定义接收哪些父组件的props。
// 当父组件的props发生变化时，子组件也会随之响应。
const props = defineProps({
  layoutId: {
    type: String,
    default: null,
  },
})

type PaneEvent = {
  max: number
  min: number
  size: number
}

const PANE_SIDEBAR_SIZE = ref(25)
const PANE_MAIN_SIZE = ref(75)
const PANE_MAIN_TOP_SIZE = ref(45)
const PANE_MAIN_BOTTOM_SIZE = ref(65)

if (!COLUMN_LAYOUT.value) {
  PANE_MAIN_TOP_SIZE.value = 50
  PANE_MAIN_BOTTOM_SIZE.value = 50
}

function setPaneEvent(event: PaneEvent[], type: "vertical" | "horizontal") {
  if (!props.layoutId) return
  const storageKey = `${props.layoutId}-pane-config-${type}`
  setLocalConfig(storageKey, JSON.stringify(event))
}

function populatePaneEvent() {
  if (!props.layoutId) return

  const verticalPaneData = getPaneData("vertical")
  if (verticalPaneData) {
    const [mainPane, sidebarPane] = verticalPaneData
    PANE_MAIN_SIZE.value = mainPane?.size
    PANE_SIDEBAR_SIZE.value = sidebarPane?.size
  }

  const horizontalPaneData = getPaneData("horizontal")
  if (horizontalPaneData) {
    const [mainTopPane, mainBottomPane] = horizontalPaneData
    PANE_MAIN_TOP_SIZE.value = mainTopPane?.size
    PANE_MAIN_BOTTOM_SIZE.value = mainBottomPane?.size
  }
}

function getPaneData(type: "vertical" | "horizontal"): PaneEvent[] | null {
  const storageKey = `${props.layoutId}-pane-config-${type}`
  const paneEvent = getLocalConfig(storageKey)
  if (!paneEvent) return null
  return JSON.parse(paneEvent)
}

populatePaneEvent()
</script>
