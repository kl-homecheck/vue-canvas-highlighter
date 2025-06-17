# Vue Canvas Highlighter

🚀 **Vue.js와 Canvas를 활용한 현대적인 클라이언트-사이드 이미지 분류 및 캔버스 하이라이터 컴포넌트**

Vue 3용 강력하고 직관적인 캔버스 하이라이터 컴포넌트로, 이미지 위에 형광펜으로 표시하고 AI를 활용해 영역을 감지할 수 있습니다.

## ✨ 주요 기능

- 🖍️ **다양한 도구**: 형광펜, 지우개 도구
- 🎨 **풍부한 색상 팔레트**: 사전 정의된 색상 그룹 및 커스텀 색상 지원
- 📏 **크기 조절**: 형광펜과 지우개 크기 실시간 조절
- ↶ **실행 취소/다시 실행**: 완전한 히스토리 관리
- 📱 **터치 지원**: 모바일 및 태블릿 환경 완벽 지원
- 💾 **데이터 내보내기**: 작업 내용을 압축된 형태로 저장/로드
- 🖼️ **배경 이미지**: 이미지 파일을 배경으로 설정 가능
- 📦 **영역 감지**: 하이라이트된 영역을 자동으로 사각형으로 변환
- 🗂️ **LZ 압축**: 데이터 압축으로 효율적인 저장

## 📦 설치

```bash
npm install @homecheck/vue-canvas-highlighter
```

## 🚀 사용법

### 기본 사용법

```vue
<template>
  <div>
    <Highlighter 
      ref="highlighterRef"
      @tool-change="onToolChange"
      @color-change="onColorChange"
      @data-changed="onDataChanged"
      @export-data="onExportData"
      @ready="onReady"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Highlighter } from 'vue-canvas-highlighter'
import type { ToolType } from 'vue-canvas-highlighter'

const highlighterRef = ref<InstanceType<typeof Highlighter>>()

function onToolChange(tool: ToolType) {
  console.log('Tool changed:', tool)
}

function onColorChange(color: string) {
  console.log('Color changed:', color)
}

function onDataChanged(data: string) {
  console.log('Canvas data changed:', data)
}

function onExportData(data: string) {
  console.log('Export data:', data)
}

function onReady() {
  console.log('Highlighter ready!')
}
</script>
```

### TypeScript 지원

```typescript
import type { HighlighterCanvas } from 'vue-canvas-highlighter'
import { ref } from 'vue'

const highlighterRef = ref<HighlighterCanvas>()

// 프로그래매틱 API 사용
highlighterRef.value?.clearCanvas()
highlighterRef.value?.exportData()
highlighterRef.value?.setTool('highlighter')
highlighterRef.value?.setColor('#ffff00')
```

## 🎯 이벤트

| Event | Payload | Description |
|-------|---------|-------------|
| `tool-change` | `ToolType` | 현재 도구가 변경될 때 발생 |
| `color-change` | `string` | 현재 색상이 변경될 때 발생 |
| `size-change` | `number` | 브러시/지우개 크기가 변경될 때 발생 |
| `data-changed` | `string` | 캔버스 데이터가 변경될 때 발생 |
| `export-data` | `string` | 데이터 내보내기 시 발생 |
| `ready` | `void` | 컴포넌트 초기화 완료 시 발생 |

## 🛠️ API 메서드

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `clearCanvas()` | - | `void` | 캔버스 내용 전체 삭제 |
| `undo()` | - | `boolean` | 마지막 작업 취소 |
| `redo()` | - | `boolean` | 취소된 작업 다시 실행 |
| `exportData()` | - | `string` | 현재 캔버스 데이터 문자열로 반환 |
| `importData(data)` | `string` | `Promise<void>` | 데이터 문자열로부터 캔버스 복원 |
| `setTool(tool)` | `ToolType` | `void` | 현재 도구 변경 |
| `setColor(color)` | `string` | `void` | 현재 색상 변경 |
| `setBrushSize(size)` | `number` | `void` | 형광펜 크기 변경 |
| `setEraserSize(size)` | `number` | `void` | 지우개 크기 변경 |
| `setCanvasSize(width, height)` | `number, number` | `void` | 캔버스 크기 변경 |
| `loadBackgroundImage(source)` | `string \| File \| Blob` | `Promise<void>` | 배경 이미지 로드 |
| `removeBackgroundImage()` | - | `void` | 배경 이미지 제거 |
| `showDetectedRectangles()` | - | `void` | 감지된 영역 표시 |
| `hideDetectedRectangles()` | - | `void` | 감지된 영역 숨김 |
| `redrawCanvas()` | - | `void` | 캔버스 다시 그리기 |

## 📊 Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentTool` | `ComputedRef<ToolType>` | 현재 선택된 도구 |
| `currentColor` | `ComputedRef<string>` | 현재 선택된 색상 |
| `currentBrushSize` | `ComputedRef<number>` | 현재 형광펜 크기 |
| `currentEraserSize` | `ComputedRef<number>` | 현재 지우개 크기 |
| `canUndo` | `ComputedRef<boolean>` | 실행 취소 가능 여부 |
| `canRedo` | `ComputedRef<boolean>` | 다시 실행 가능 여부 |
| `isBackgroundImageLoaded` | `ComputedRef<boolean>` | 배경 이미지 로드 여부 |
| `isShowDetectedRectangles` | `ComputedRef<boolean>` | 감지된 영역 표시 여부 |

## 🎨 도구 종류

```typescript
type ToolType = 'highlighter' | 'eraser'
```

- **highlighter**: 형광펜 도구 - 하이라이트 영역 생성
- **eraser**: 지우개 도구 - 하이라이트 영역 제거

## 📝 타입 정의

### HighlighterRectangle
```typescript
type HighlighterRectangle = {
  x: number        // X 좌표
  y: number        // Y 좌표  
  width: number    // 너비
  height: number   // 높이
  color: string    // 색상
}
```

### HighlighterExportData
```typescript
type HighlighterExportData = {
  version: string              // 데이터 버전
  compressed: boolean          // 압축 여부
  width: number               // 캔버스 너비
  height: number              // 캔버스 높이
  regions: HighlighterRegion[] // 영역 데이터 배열
}
```

### HighlighterRegion
```typescript
type HighlighterRegion = {
  color: string     // 영역 색상
  opacity: number   // 투명도
  bounds: {         // 경계 정보
    x: number
    y: number
    width: number
    height: number
  }
  pixels?: HighlighterPoint[] // 픽셀 좌표 (선택적)
  mask: string                // 압축된 마스크 데이터
}
```

### HighlighterStroke
```typescript
type HighlighterStroke = {
  color: string              // 획 색상
  size: number               // 획 크기
  points: HighlighterPoint[] // 점 배열
  opacity: number            // 투명도
  isFromRegion?: boolean     // 영역에서 변환된 획인지 여부
  type: ToolType             // 도구 타입
}
```

### HighlighterPoint
```typescript
type HighlighterPoint = {
  x: number  // X 좌표
  y: number  // Y 좌표
}
```

## ⌨️ 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `H` | 형광펜 선택 |
| `E` | 지우개 선택 |
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
- Data URLs

## 📱 모바일 지원

터치 이벤트를 완벽 지원하며, 모바일 브라우저에서도 원활하게 작동합니다:

- 터치 드래그로 그리기
- 터치 제스처 지원
- 반응형 캔버스

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

- [Vue.js](https://vuejs.org/) - 진보적인 JavaScript 프레임워크
- [LZ-String](https://github.com/pieroxy/lz-string) - 데이터 압축 라이브러리

---

⭐ 이 프로젝트가 도움이 되셨다면 스타를 눌러주세요! 