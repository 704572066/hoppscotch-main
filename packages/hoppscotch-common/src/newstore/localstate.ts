import { Ref } from "vue"
import { distinctUntilChanged, pluck } from "rxjs"
import DispatchingStore, { defineDispatchers } from "./DispatchingStore"
import { useStream } from "@composables/stream"

type LocalState = {
  REMEMBERED_TEAM_ID: string | undefined
}

const defaultLocalState: LocalState = {
  REMEMBERED_TEAM_ID: undefined,
}

const dispatchers = defineDispatchers({
  bulkApplyState(_currentState: LocalState, payload: Partial<LocalState>) {
    return payload
  },
  applyState<K extends keyof LocalState>(
    _currentState: LocalState,
    { key, value }: { key: K; value: LocalState[K] }
  ) {
    const result: Partial<LocalState> = {
      [key]: value,
    }

    return result
  },
})

export const localStateStore = new DispatchingStore(
  defaultLocalState,
  dispatchers
)
// 通过 next () 方法使得 Subject 是数据生产者（可观察对象），通过 asObservable () 使得 Subject 是数据消费者（Observers）
export const localState$ = localStateStore.subject$.asObservable()

export function bulkApplyLocalState(obj: Partial<LocalState>) {
  localStateStore.dispatch({
    dispatcher: "bulkApplyState",
    payload: obj,
  })
}

export function applyLocalState<K extends keyof LocalState>(
  key: K,
  value: LocalState[K]
) {
  localStateStore.dispatch({
    dispatcher: "applyState",
    payload: { key, value },
  })
}

export function useLocalState<K extends keyof LocalState>(
  key: K
): Ref<LocalState[K]> {
  return useStream(
    localStateStore.subject$.pipe(pluck(key), distinctUntilChanged()),
    localStateStore.value[key],
    (value: LocalState[K]) => {
      localStateStore.dispatch({
        dispatcher: "applyState",
        payload: { key, value },
      })
    }
  )
}
