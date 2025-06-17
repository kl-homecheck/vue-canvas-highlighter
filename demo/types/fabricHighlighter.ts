// Fabric.js 기반 형광펜 컴포넌트 타입 정의

export type ToolType = 'highlighter' | 'eraser' | 'selector'

export interface FabricHighlighterProps {
  width?: number
  height?: number
  backgroundColor?: string
  colors?: string[]
  brushSize?: number
  eraserSize?: number
  defaultTool?: ToolType
  showToolbar?: boolean
  showColorPicker?: boolean
  showSizeControls?: boolean
}

export interface FabricHighlighterEvents {
  'tool-change': (tool: ToolType) => void
  'color-change': (color: string) => void
  'size-change': (size: number) => void
  'data-changed': (data: string) => void
  'export-data': (data: string) => void
  'ready': () => void
}

export interface FabricHighlighterState {
  currentTool: ToolType
  currentColor: string
  brushSize: number
  eraserSize: number
  highlighterSettings: {
    opacity: number
  }
  isLoading: boolean
  isDrawing: boolean
  showRectangles: boolean
  hasUnsavedChanges: boolean
  canvasSize: {
    width: number
    height: number
  }
  backgroundImage?: string
  detectedRectangles: any[]
  history: any[]
  historyIndex: number
}

export interface FabricHighlighterMethods {
  setTool: (tool: ToolType) => void
  getCurrentTool: () => ToolType
  setColor: (color: string) => void
  getCurrentColor: () => string
  setBrushSize: (size: number) => void
  setEraserSize: (size: number) => void
  exportData: () => string
  importData: (data: string) => Promise<void>
  clearAll: () => void
  undo: () => boolean
  redo: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
  generateRectangles: () => Promise<any[]>
  showRectangles: (show: boolean) => void
  getCanvasElement: () => HTMLCanvasElement | null
  takeScreenshot: () => string
  getState: () => FabricHighlighterState
  isReady: () => boolean
  loadBackgroundImage: (imageSource: string | File | Blob) => Promise<void>
  removeBackgroundImage: () => void
  testCompression: () => void
} 