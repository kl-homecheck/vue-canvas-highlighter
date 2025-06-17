# Vue Canvas Highlighter

🚀 **Vue.js와 TensorFlow.js를 활용한 현대적인 클라이언트-사이드 이미지 분류 및 캔버스 하이라이터 컴포넌트**

Vue 3용 강력하고 직관적인 캔버스 하이라이터 컴포넌트로, 이미지 위에 형광펜으로 표시하고 AI를 활용해 영역을 감지할 수 있습니다.

## ✨ 주요 기능

- 🖍️ **다양한 도구**: 형광펜, 지우개, 선택, 이동 도구
- 🎨 **풍부한 색상 팔레트**: 사전 정의된 색상 그룹 및 커스텀 색상 지원
- 📏 **크기 조절**: 형광펜과 지우개 크기 실시간 조절
- 🔍 **AI 영역 감지**: TensorFlow.js를 활용한 자동 영역 생성
- ↶ **실행 취소/다시 실행**: 완전한 히스토리 관리
- 📱 **터치 지원**: 모바일 및 태블릿 환경 완벽 지원
- 🎛️ **사전 설정**: 빠른 작업을 위한 도구 및 색상 프리셋
- 💾 **데이터 내보내기**: 작업 내용을 압축된 형태로 저장/로드
- 🖼️ **배경 이미지**: 이미지 파일을 배경으로 설정 가능

## 📦 설치

```bash
npm install vue-canvas-highlighter
```

## 🚀 사용법

### 기본 사용법

```vue
<template>
  <div>
    <CanvasElement 
      :width="800"
      :height="600"
      :show-toolbar="true"
      :show-color-picker="true"
      :show-size-controls="true"
      @data-changed="onDataChanged"
      @export-data="onExportData"
    />
  </div>
</template>

<script setup lang="ts">
import { CanvasElement } from 'vue-canvas-highlighter'

function onDataChanged(data: string) {
  console.log('Canvas data changed:', data)
}

function onExportData(data: string) {
  console.log('Export data:', data)
}
</script>
```

### TypeScript 지원

```typescript
import type { CanvasElementInstance } from 'vue-canvas-highlighter'
import { ref } from 'vue'

const canvasRef = ref<CanvasElementInstance>()

// 프로그래매틱 API 사용
canvasRef.value?.clearCanvas()
canvasRef.value?.exportData()
```

## 🎛️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `800` | 캔버스 너비 |
| `height` | `number` | `600` | 캔버스 높이 |
| `showToolbar` | `boolean` | `true` | 도구 모음 표시 여부 |
| `showColorPicker` | `boolean` | `true` | 색상 선택기 표시 여부 |
| `showSizeControls` | `boolean` | `true` | 크기 조절 컨트롤 표시 여부 |
| `enableTouch` | `boolean` | `true` | 터치 입력 지원 여부 |
| `enableKeyboardShortcuts` | `boolean` | `true` | 키보드 단축키 지원 여부 |

## 🎯 이벤트

| Event | Payload | Description |
|-------|---------|-------------|
| `data-changed` | `string` | 캔버스 데이터가 변경될 때 발생 |
| `export-data` | `string` | 데이터 내보내기 시 발생 |
| `tool-changed` | `ToolType` | 현재 도구가 변경될 때 발생 |
| `color-changed` | `string` | 현재 색상이 변경될 때 발생 |

## 🛠️ API 메서드

| Method | Description |
|--------|-------------|
| `clearCanvas()` | 캔버스 내용 전체 삭제 |
| `undo()` | 마지막 작업 취소 |
| `redo()` | 취소된 작업 다시 실행 |
| `exportData()` | 현재 캔버스 데이터 문자열로 반환 |
| `loadData(data: string)` | 데이터 문자열로부터 캔버스 복원 |
| `generateRectangles()` | AI를 활용해 하이라이트된 영역에서 사각형 생성 |
| `setTool(tool: ToolType)` | 현재 도구 변경 |
| `setColor(color: string)` | 현재 색상 변경 |

## 🎨 도구 종류

- **highlighter**: 형광펜 도구
- **eraser**: 지우개 도구
- **select**: 선택 도구
- **move**: 이동 도구

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `1` | 형광펜 선택 |
| `2` | 지우개 선택 |
| `3` | 선택 도구 |
| `4` | 이동 도구 |
| `Ctrl+Z` | 실행 취소 |
| `Ctrl+Y` | 다시 실행 |
| `Ctrl+S` | 데이터 내보내기 |
| `Delete` | 전체 삭제 |

## 🖼️ 지원 이미지 형식

- JPG/JPEG
- PNG
- GIF
- WebP
- SVG

## 📱 모바일 지원

터치 이벤트를 완벽 지원하며, 모바일 브라우저에서도 원활하게 작동합니다:

- 터치 드래그로 그리기
- 핀치 줌 (계획 중)
- 터치 제스처 지원

## 🔧 개발 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd vue-canvas-highlighter

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데모 확인
npm run demo
```

## 📖 데모

온라인 데모는 [여기에서](https://your-demo-url.com) 확인할 수 있습니다.

로컬에서 데모를 실행하려면:

```bash
npm run demo
```

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 저장소를 Fork 합니다
2. 새 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🙋‍♂️ 지원

문제가 발생했거나 질문이 있으시면:

- [GitHub Issues](https://github.com/your-username/vue-canvas-highlighter/issues)에서 이슈를 생성해주세요
- [Discussion](https://github.com/your-username/vue-canvas-highlighter/discussions)에서 토론에 참여해보세요

## 🔗 관련 프로젝트

- [Fabric.js](http://fabricjs.com/) - 캔버스 라이브러리
- [TensorFlow.js](https://www.tensorflow.org/js) - 클라이언트 사이드 머신러닝
- [Vue.js](https://vuejs.org/) - 진보적인 JavaScript 프레임워크

---

⭐ 이 프로젝트가 도움이 되셨다면 스타를 눌러주세요! 