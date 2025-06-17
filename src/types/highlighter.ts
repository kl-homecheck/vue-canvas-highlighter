// Fabric.js 기반 형광펜 컴포넌트 타입 정의
import type { ComputedRef } from 'vue'

export type ToolType = 'highlighter' | 'eraser'

export interface HighlighterCanvas {
  redrawCanvas: () => void
  clearCanvas: () => void
  importData: (data: string) => Promise<void>
  
  
  
  removeBackgroundImage: () => void
  isBackgroundImageLoaded: ComputedRef<boolean>
  loadBackgroundImage: (imageSource: string | File | Blob) => Promise<void>


  showDetectedRectangles: () => void
  hideDetectedRectangles: () => void
  isShowDetectedRectangles: ComputedRef<boolean>



  currentTool: ComputedRef<ToolType>
  currentColor: ComputedRef<string> 
  currentBrushSize: ComputedRef<number>
  currentEraserSize: ComputedRef<number>

  setTool: (tool: ToolType) => void
  setColor: (color: string) => void
  setBrushSize: (size: number) => void
  setEraserSize: (size: number) => void



  canRedo: ComputedRef<boolean>
  canUndo: ComputedRef<boolean>
  undo: () => boolean
  redo: () => boolean

  sizeMode: ComputedRef<'pixel' | 'percent'>
  setSizeMode: (mode: 'pixel' | 'percent') => void

  exportData: () => string
  setCanvasSize: (width: number, height: number) => void
}



export type HighlighterRectangle = {
  x: number
  y: number
  width: number
  height: number
  color: string

  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}


export type HighlighterExportData = {
  version: string
  compressed: boolean
  width: number
  height: number
  regions : HighlighterRegion[]
}

export type HighlighterRegion = {
  color : string
  opacity : number
  bounds : {
    x : number
    y : number
    width : number
    height : number
  }
  pixels? : HighlighterPoint[]
  mask : string
}


export type HighlighterStroke = {
  color : string
  size : number
  points : HighlighterPoint[]
  opacity : number
  isFromRegion? : boolean
  type : ToolType
}



export type HighlighterPoint = {
  x : number
  y : number
}

