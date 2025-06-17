<template>
  <!-- 주 캔버스 영역 -->
  <div class="canvas-container">
    <canvas ref="highlighter" :width="canvasWidth" :height="canvasHeight" class="highlighter-canvas" />
    <div v-if="isShowDetectedRectangles" class="detected-rectangles">
      <div v-for="(rect, i) in detectedRectangles" :key="i" class="detected-rectangle" :style="{
        position: 'absolute',
        pointerEvents: 'none',
        left: Math.round(rect.xPercent ) + '%',
        top: Math.round(rect.yPercent) + '%',
        width: Math.round(rect.widthPercent) + '%',
        height: Math.round(rect.heightPercent) + '%',
        backgroundColor: toRgba(rect.color, 0.1),
        border: '3px dashed ' + toRgba(rect.color, 1),
        zIndex: 1000,
        boxSizing: 'border-box',
      }">
      </div>
    </div>
  </div>

</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { parseCompressedData, extractFinalRegions, drawContextWithParsedData, renderRegion, renderStroke, renderFinalRegion, compressStrokes, splitStrokeByErasers, calculateStrokeLength, renderLoadedRegionOnContext, renderStrokeOnContext, findConnectedRegionsInImageData, dataToRectangles } from './utils'
import { toRgba } from './utils/color'
import * as LZString from 'lz-string'
import type {
  ToolType,
  HighlighterCanvas,
  HighlighterRectangle,
  HighlighterExportData,
  HighlighterRegion,
  HighlighterStroke,
  HighlighterPoint
} from './types/highlighter'


const emit = defineEmits<{
  'tool-change': [tool: ToolType]
  'color-change': [color: string]
  'size-change': [size: number]
  'data-changed': [data: string]
  'export-data': [data: string]
  'ready': []
}>()

const canvasWidth = ref<number>(800)
const canvasHeight = ref<number>(600)

// Canvas
const highlighter = ref<HTMLCanvasElement>()
const canvasContext = ref<CanvasRenderingContext2D | null>(null)

// Highlighter Canvas
const highlighterCanvas = ref<HTMLCanvasElement | null>(null)
const highlighterContext = ref<CanvasRenderingContext2D | null>(null)

// Background Image
const backgroundImage = ref<HTMLImageElement | null>(null)
const backgroundImageLoaded = ref(false)
const backgroundColor = ref<string>('#ffffff')


// Detected Area
const detectedRectangles = ref<HighlighterRectangle[]>([])
const isShowDetectedRectangles = ref(false)



// State Management
const currentTool = ref<ToolType>('highlighter')
const currentColor = ref<string>('#ffff00')


// Size Controls
const currentBrushSize = ref<number>(5)
const currentEraserSize = ref<number>(5);

const computedBrushSize = computed(() => sizeMode.value === 'pixel' ? currentBrushSize.value : currentBrushSize.value * (highlighter.value!.width ?? 1) / 100)
const computedEraserSize = computed(() => sizeMode.value === 'pixel' ? currentEraserSize.value : currentEraserSize.value * (highlighter.value!.width ?? 1) / 100)
const sizeMode = ref<'pixel' | 'percent'>('percent')

// Drawing State
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)


const currentStrokeType = ref<'highlighter' | 'eraser'>('highlighter')





// Undo/Redo State
const canvasHistory = ref<string[]>([])
const historyIndex = ref(-1)
const canUndoAction = computed(() => historyIndex.value > 0)
const canRedoAction = computed(() => historyIndex.value < canvasHistory.value.length - 1)

// Undo
function undo(): boolean {
  if (historyIndex.value > 0) {
    historyIndex.value--
    restoreFromHistory()
    return true
  }
  return false
}

// Redo
function redo(): boolean {
  if (historyIndex.value < canvasHistory.value.length - 1) {
    historyIndex.value++
    restoreFromHistory()
    return true
  }
  return false
}

// Restore from History
function restoreFromHistory() {
  if (!highlighterCanvas.value || !highlighterContext.value) return

  const strokesData = canvasHistory.value[historyIndex.value]
  if (!strokesData) return

  try {
    // Restore Strokes Data
    strokes.value = JSON.parse(strokesData)

    // Clear Highlighter Layer
    highlighterContext.value.clearRect(0, 0, highlighterCanvas.value.width, highlighterCanvas.value.height)

    // Redraw all strokes
    strokes.value.forEach(stroke => {
      if (highlighterContext.value) {
        renderStroke(highlighterContext.value, stroke)
      }
    })

    // Redraw Main Canvas
    redrawCanvas()
    emit('data-changed', exportData())
  } catch (error) {
    console.error('History restore failed:', error)
  }
}



//-----------------------------------------------------------








// Strokes Data
const strokes = ref<HighlighterStroke[]>([])

const currentStroke = ref<HighlighterPoint[]>([])


// Loaded Regions Data
const loadedRegions = ref<HighlighterRegion[]>([])


// Initialize canvas
function initCanvas() {
  if (highlighter.value) {
    canvasContext.value = highlighter.value.getContext('2d')

    // Create highlighter off-screen canvas
    highlighterCanvas.value = document.createElement('canvas')
    highlighterCanvas.value.width = highlighter.value.width
    highlighterCanvas.value.height = highlighter.value.height
    highlighterContext.value = highlighterCanvas.value.getContext('2d')

    if (canvasContext.value && highlighterContext.value) {
      // Initialize highlighter canvas transparently
      highlighterContext.value.clearRect(0, 0, highlighterCanvas.value.width, highlighterCanvas.value.height)

      // Draw initial background
      redrawCanvas()

      // Save initial state to history
      setTimeout(() => saveToHistory(), 100)

      // Add drawing event listeners
      highlighter.value.addEventListener('mousedown', startDrawing)
      highlighter.value.addEventListener('mousemove', draw)
      highlighter.value.addEventListener('mouseup', stopDrawing)
      highlighter.value.addEventListener('mouseout', stopDrawing)

      // Support touch events (mobile)
      highlighter.value.addEventListener('touchstart', handleTouchStart)
      highlighter.value.addEventListener('touchmove', handleTouchMove)
      highlighter.value.addEventListener('touchend', stopDrawing)
    }
  }
}

// Redraw entire canvas (background image + highlighter layer)
function redrawCanvas(imgElement : HTMLImageElement | null = null) {
  console.log('redrawCanvas : ', imgElement)
  if (!canvasContext.value || !highlighter.value || !highlighterCanvas.value) return

  const img =  imgElement || backgroundImage.value

  const canvas = highlighter.value
  const ctx = canvasContext.value

  // Clear main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Draw background image or background color
  if (img && backgroundImageLoaded.value) {
    // 캔버스 크기를 이미지 크기에 맞춤

    ctx.drawImage(img, 0, 0, img.width, img.height)
  } else {
    // 배경색 설정
    ctx.fillStyle = backgroundColor.value || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // 2. Composite highlighter layer (multiply mode for highlighter effect)
  ctx.globalCompositeOperation = 'multiply'
  console.log('redrawCanvas : ', highlighterCanvas.value)
  ctx.drawImage(highlighterCanvas.value, 0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'source-over'

}


// Optimize Strokes
async function optimizeStrokes() {
  if (!highlighter.value || !highlighterContext.value || !highlighterCanvas.value) return

  // 1. Analyze actual rendering results based on current canvas state
  const canvasWidth = highlighter.value.width
  const canvasHeight = highlighter.value.height

  // 2. Redraw highlighter layer to check actual results
  highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)

  const optimizedStrokes: HighlighterStroke[] = []

  // 3. Process only highlighter strokes (remove eraser strokes)
  const highlighterStrokes = strokes.value.filter(stroke => stroke.type === 'highlighter')
  const eraserStrokes = strokes.value.filter(stroke => stroke.type === 'eraser')

  // 4. Check if each highlighter stroke is affected by eraser
  highlighterStrokes.forEach(highlighterStroke => {
    const segments = splitStrokeByErasers(highlighterStroke, eraserStrokes)


    // 5. Add only valid segments (minimum length check)
    segments.forEach(segment => {
      if (segment.points.length >= 2 && calculateStrokeLength(segment.points) > 10) {
        optimizedStrokes.push(segment)
      }
    })
  })

  // 6. Replace with optimized strokes (preserve eraser strokes)
  strokes.value = [...optimizedStrokes, ...eraserStrokes]

  // 7. Redraw canvas (based on final state with eraser effect applied)
  // Extract final regions and redraw
  const finalRegions = extractFinalRegions(highlighter.value, highlighterContext.value, strokes.value, loadedRegions.value)

  // Clear canvas
  highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)

  // Render final regions in pixel units
  finalRegions.forEach(region => {
    if (highlighterContext.value) {
      renderFinalRegion(highlighterContext.value, region)
    }
  })

  redrawCanvas()
}


// Start drawing
function startDrawing(e: MouseEvent) {
  isDrawing.value = true
  const rect = highlighter.value?.getBoundingClientRect()
  
  if (rect) {
    lastX.value = (e.clientX - rect.left) * highlighter.value!.width / rect.width
    lastY.value = (e.clientY - rect.top) * highlighter.value!.height / rect.height

    // Start new stroke
    currentStroke.value = [{ x: lastX.value, y: lastY.value }]
    currentStrokeType.value = currentTool.value as 'highlighter' | 'eraser'
  }
}

// Drawing in progress
function draw(e: MouseEvent) {
  if (!isDrawing.value || !highlighterContext.value) return

  const rect = highlighter.value?.getBoundingClientRect()
  if (!rect) return

  const currentX = (e.clientX - rect.left) * highlighter.value!.width / rect.width
  const currentY = (e.clientY - rect.top) * highlighter.value!.height / rect.height

  // Draw on highlighter layer
  highlighterContext.value.beginPath()
  highlighterContext.value.moveTo(lastX.value, lastY.value)
  highlighterContext.value.lineTo(currentX, currentY)

  if (currentTool.value === 'highlighter') {
    // Set highlighter settings
    highlighterContext.value.globalCompositeOperation = 'source-over'
    highlighterContext.value.strokeStyle = currentColor.value
    highlighterContext.value.lineWidth = computedBrushSize.value
    highlighterContext.value.lineCap = 'round'
    highlighterContext.value.lineJoin = 'round'
    highlighterContext.value.globalAlpha = 0.5
  } else if (currentTool.value === 'eraser') {
    // Set eraser settings (only on highlighter layer)
    highlighterContext.value.globalCompositeOperation = 'destination-out'
    highlighterContext.value.lineWidth = computedEraserSize.value
    highlighterContext.value.lineCap = 'round'
    highlighterContext.value.lineJoin = 'round'
    highlighterContext.value.globalAlpha = 1
  }

  highlighterContext.value.stroke()

  // Add point to current stroke
  currentStroke.value.push({ x: currentX, y: currentY })

  // Redraw main canvas
  redrawCanvas()

  lastX.value = currentX
  lastY.value = currentY
}

// Stop drawing
async function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false
    if (highlighterContext.value) {
      highlighterContext.value.globalAlpha = 1
      highlighterContext.value.globalCompositeOperation = 'source-over'
    }

    // Save completed stroke
    if (currentStroke.value.length > 1) {
      const newStroke = {
        type: currentStrokeType.value,
        color: currentTool.value === 'highlighter' ? currentColor.value : '#000000',
        size: currentTool.value === 'highlighter' ? computedBrushSize.value : computedEraserSize.value,
        points: [...currentStroke.value],
        opacity: currentTool.value === 'highlighter' ? 0.5 : 1.0
      }

      strokes.value.push(newStroke)

      // Optimize strokes after eraser usage
      if (currentTool.value === 'eraser') {
        await optimizeStrokes()
      }
    }

    // Initialize current stroke
    currentStroke.value = []

    // Save to history
    saveToHistory()
    emit('data-changed', exportData())
    if(highlighterCanvas.value){
      console.log('highlighterCanvas.value : ', highlighterCanvas.value.toDataURL())
    }

    // If region highlighting is enabled, automatically generate rectangles
    setTimeout(() => {
      generateRectangles()
    }, 100) // Add a small delay to ensure canvas rendering is complete
  
  }
}

// 터치 이벤트 처리
function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}




// 라이프사이클
onMounted(() => {
  // Canvas 초기화를 다음 틱에서 실행
  setTimeout(initCanvas, 100)
  emit('ready')
})

onUnmounted(() => {

  // Canvas 이벤트 리스너 제거
  if (highlighter.value) {
    highlighter.value.removeEventListener('mousedown', startDrawing)
    highlighter.value.removeEventListener('mousemove', draw)
    highlighter.value.removeEventListener('mouseup', stopDrawing)
    highlighter.value.removeEventListener('mouseout', stopDrawing)
    highlighter.value.removeEventListener('touchstart', handleTouchStart)
    highlighter.value.removeEventListener('touchmove', handleTouchMove)
    highlighter.value.removeEventListener('touchend', stopDrawing)
  }

})




// Export Data
function exportData(): string {
  if (!highlighter.value || !highlighterCanvas.value) return ''

  const canvasWidth = highlighter.value.width
  const canvasHeight = highlighter.value.height
  if (!highlighterCanvas.value || !highlighterContext.value) {
    return ''
  }

  // Extract Final Regions
  const regions = extractFinalRegions(highlighterCanvas.value, highlighterContext.value, strokes.value, loadedRegions.value)

  // Convert to Percentage
  const optimizedData: HighlighterExportData = {
    version: '2.0', // Compressed version
    compressed: true,
    width: canvasWidth,
    height: canvasHeight,
    regions: regions.map(region => {
      // Convert to Percentage
      const percentBounds = {
        x: Math.round((region.bounds.x / canvasWidth) * 10000) / 10000,
        y: Math.round((region.bounds.y / canvasHeight) * 10000) / 10000,
        width: Math.round((region.bounds.width / canvasWidth) * 10000) / 10000,
        height: Math.round((region.bounds.height / canvasHeight) * 10000) / 10000
      }

      return {
        color: region.color,
        opacity: region.opacity,
        bounds: percentBounds,
        mask: region.mask // Already compressed in extractFinalRegions
      }
    })
  }

  const jsonData = JSON.stringify(optimizedData)
  const compressedData = LZString.compressToBase64(jsonData)

  const originalSize = jsonData.length
  const compressedSize = compressedData.length
  const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)


  emit('export-data', compressedData)
  return compressedData
}







// History Management
function saveToHistory() {
  // Data Compression
  const optimizedStrokes = compressStrokes(strokes.value)
  const strokesData = JSON.stringify(optimizedStrokes)

  // Remove History after current index (new changes)
  if (historyIndex.value < canvasHistory.value.length - 1) {
    canvasHistory.value = canvasHistory.value.slice(0, historyIndex.value + 1)
  }

  // Add new state
  canvasHistory.value.push(strokesData)
  historyIndex.value = canvasHistory.value.length - 1

  // Maximum size limit (15)
  const maxSize = 15
  if (canvasHistory.value.length > maxSize) {
    canvasHistory.value.shift()
    historyIndex.value--
  }

  // Memory usage logging
  const dataSize = strokesData.length
}

// Remove background image
function removeBackgroundImage() {
  backgroundImage.value = null
  backgroundImageLoaded.value = false
  redrawCanvas()
  saveToHistory()
}

// Clear Canvas
function clearCanvas() {
  if (highlighterContext.value && highlighterCanvas.value) {
    // Clear Strokes Data
    strokes.value = []
    currentStroke.value = []

    // Clear Loaded Regions Data
    loadedRegions.value = []

    // Clear Highlighter Layer
    highlighterContext.value.clearRect(0, 0, highlighterCanvas.value.width, highlighterCanvas.value.height)
    // Redraw Main Canvas
    redrawCanvas()
    saveToHistory() // Save to History
    emit('data-changed', '')
  }
}


// Load background image
function loadBackgroundImage(imageSource: string | File | Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    
    img.onload = () => {
      backgroundImage.value = img
      backgroundImageLoaded.value = true
      highlighter.value!.width = img.width
      highlighter.value!.height = img.height
      canvasWidth.value = img.width
      canvasHeight.value = img.height
      if(highlighterCanvas.value){
          highlighterCanvas.value.width = img.width
          highlighterCanvas.value.height = img.height
          highlighterContext.value!.clearRect(0, 0, highlighterCanvas.value.width, highlighterCanvas.value.height)
          
      }
      nextTick(()=>{
        redrawCanvas()
      })
    
      
      saveToHistory()
      resolve()
    }

    img.onerror = () => {
      reject(new Error('Background image loading failed'))
    }

    if (typeof imageSource === 'string') {
      img.src = imageSource
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(imageSource)
    }
  })
}







// Create Rectangle Regions (based on final rendering)
async function generateRectangles(): Promise<HighlighterRectangle[]> {
  if (!highlighter.value) {
    return []
  }
  try {
    if (!highlighterCanvas.value || !highlighterContext.value) {
      return []
    }

    // 1. Extract final rendered regions
    const regions = extractFinalRegions(highlighterCanvas.value, highlighterContext.value, strokes.value, loadedRegions.value)
    // If no regions are extracted, cannot create rectangles
    if (regions.length === 0) {
      return []
    }


    // 2. Convert regions to rectangles
    const detectedRects = regions.map((region, index) => {
      const rect: HighlighterRectangle = {
        x: region.bounds.x, // Already in pixel coordinates in extractFinalRegions
        y: region.bounds.y,
        width: region.bounds.width,
        height: region.bounds.height,
        color: region.color,

        xPercent: region.bounds.x / canvasWidth.value * 100,
        yPercent: region.bounds.y / canvasHeight.value * 100,
        widthPercent: region.bounds.width / canvasWidth.value * 100,
        heightPercent: region.bounds.height / canvasHeight.value * 100,
      }
      return rect
    })

    // Save to rectangles.value
    detectedRectangles.value = detectedRects
    console.log('detectedRectangles', detectedRects)



    // Redraw canvas
    redrawCanvas()
    return detectedRects
  } catch (error) {
    console.error('Rectangle creation failed:', error)
    return []
  }
}













function showDetectedRectangles() {
  isShowDetectedRectangles.value = true
}
function hideDetectedRectangles() {
  isShowDetectedRectangles.value = false
}





// Import region-based data (optimized, LZ decompression supported)
async function importDataFromCompressedString(compressedData: string): Promise<void> {
  try {
    const parsedData = await parseCompressedData(compressedData);
    if (!parsedData) {
      throw new Error('Invalid data format.')
    }
    if (!highlighterCanvas.value || !highlighterContext.value) return;

    // Clear existing data
    strokes.value = []
    currentStroke.value = []

    // Save loaded region data (for hybrid system)
    loadedRegions.value = [...parsedData.regions]




    await drawContextWithParsedData(
      highlighterContext.value, 
      parsedData.width, 
      parsedData.height, 
      parsedData
    )
    redrawCanvas()

    // Initialize history (remove undo/redo functionality)
    canvasHistory.value = []
    historyIndex.value = -1
    
    emit('data-changed', JSON.stringify(parsedData))
    generateRectangles();
  } catch (error) {
    console.error('Import failed:', error)
    alert('Data import failed. Please check if the data is correct.')
  }
}







defineExpose<HighlighterCanvas>({
  redrawCanvas,
  clearCanvas,
  importData : importDataFromCompressedString,


  removeBackgroundImage,
  isBackgroundImageLoaded: computed(() => backgroundImageLoaded.value),
  loadBackgroundImage,



  showDetectedRectangles,
  hideDetectedRectangles,
  isShowDetectedRectangles: computed(() => isShowDetectedRectangles.value),



  currentTool: computed(() => currentTool.value),
  currentColor: computed(() => currentColor.value),
  currentBrushSize: computed(() => currentBrushSize.value),
  currentEraserSize: computed(() => currentEraserSize.value),

  setTool: (tool: ToolType) => { currentTool.value = tool },
  setColor: (color: string) => { currentColor.value = color },
  setBrushSize: (size: number) => { currentBrushSize.value = size },
  setEraserSize: (size: number) => { currentEraserSize.value = size },



  canRedo: computed(() => canRedoAction.value),
  canUndo: computed(() => canUndoAction.value),
  undo: undo,
  redo: redo,

  sizeMode: computed(() => sizeMode.value),
  setSizeMode: (mode: 'pixel' | 'percent') => { sizeMode.value = mode },


  exportData: exportData,

  setCanvasSize: (width: number, height: number) => {
    canvasWidth.value = width
    canvasHeight.value = height
  }
})



</script>
<style scoped>
.canvas-container {
  position: relative;
  display: inline-block;
}

.highlighter-canvas {
  border: 1px solid #ccc;
  display: block;
  width: 100%;
  height: 100%;
}
</style>