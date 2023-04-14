import { HoppModule } from "."
/* 由于这里是括号，如果上一行有其他语句但后面未加分号，js就会按同一行来处理，比如
abc
(...)
就相当于abc(...)，括号里的内容就变成abc的参数了。 
而预先在括号的前面加个分号，就可以避免这种情况发生，尤其是当代码是由多人合作编写的时候。
*/
export const showChat = () => {
  ;(window as any).$crisp.push([
    "do",
    "chat:show",
    (window as any).$crisp.push(["do", "chat:open"]),
  ])
}

export default <HoppModule>{
  onVueAppInit() {
    // TODO: Env variable this ?
    ;(window as any).$crisp = []
    ;(window as any).CRISP_WEBSITE_ID = "3ad30257-c192-4773-955d-fb05a4b41af3"

    const d = document
    const s = d.createElement("script")

    s.src = "https://client.crisp.chat/l.js"
    s.async = true
    d.getElementsByTagName("head")[0].appendChild(s)
    ;(window as any).$crisp.push(["do", "chat:hide"])
    ;(window as any).$crisp.push([
      "on",
      "chat:closed",
      () => {
        ;(window as any).$crisp.push(["do", "chat:hide"])
      },
    ])
  },
}
