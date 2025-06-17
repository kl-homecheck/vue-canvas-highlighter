import Highlighter from './Highlighter.vue'
import HighlighterDebug from './HighlighterDebug.vue'
import type { App } from 'vue'
export { dataToRectangles } from './utils'

// 타입 정의 export
export * from './types'

// 컴포넌트 export
export { Highlighter, HighlighterDebug }

// Vue 플러그인으로 사용할 수 있도록 install 함수 제공
export default {
  install(app: App) {
    app.component('Highlighter', Highlighter)
    app.component('HighlighterDebug', HighlighterDebug)
  }
}
