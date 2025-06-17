<template>
      <div class="fabric-highlighter">
    <!-- 주 캔버스 영역 -->
    <div class="canvas-container">
      <canvas 
        ref="fabricCanvas"
        :width="width"
        :height="height"
        class="highlighter-canvas"
      />
    </div>
  
      <!-- 도구 모음 -->
      <div v-if="showToolbar" class="toolbar" role="radiogroup" aria-label="도구 선택">
        <button 
          v-for="tool in toolsConfig" 
          :key="tool.id"
          @click="setTool(tool.id as ToolType)"
          :class="{ active: currentTool === tool.id }"
          :title="`${tool.label} (${tool.shortcut})`"
          :aria-pressed="currentTool === tool.id"
          :aria-label="`${tool.label} Tool Select`"
          class="tool-button"
          role="radio"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.label }}</span>
          <span class="tool-shortcut">{{ tool.shortcut }}</span>
        </button>
        <button 
            class="tool-button"
                :class="{ active: showRectangles }"
                @click="toggleRectangles"
                :disabled="isGenerating"
                title="Show/Hide Detected Regions"
            >
                <span class="tool-icon">📦</span>
                <span class="tool-label">Show Regions</span>
                <span class="tool-shortcut">{{ showRectangles ? '(On)' : '(Off)' }}</span>
            </button>
            <button 
                @click="generateRectangles"
                :disabled="isGenerating"
                title="형광펜으로 그린 영역에서 사각형 생성"
                class="tool-button"
            >
                <span class="tool-icon">🔍</span>
                <span class="tool-label">Create Regions</span>
                <span v-if="rectangleCount > 0" class="tool-shortcut">
                    Detected: {{ rectangleCount }}</span>
            </button>


            <button 
                @click="undo"
                :disabled="!canUndoAction"
                title="Undo (Ctrl+Z)"
                class="tool-button"
            >
                <span class="tool-icon">↶</span>
                <span class="tool-label">Undo</span>
                <span class="tool-shortcut">Ctrl+Z</span>
            </button>
            <button 
                @click="redo"
                :disabled="!canRedoAction"
                title="Redo (Ctrl+Y)"
                class="tool-button"
            >
                <span class="tool-icon">↷</span>
                <span class="tool-label">Redo</span>
                <span class="tool-shortcut">Ctrl+Y</span>
            </button>

            <button 
                @click="clearCanvas"
                class="tool-button"
            >
                <span class="tool-icon">🗑️</span>
                <span class="tool-label">Clear All</span>
                <span class="tool-shortcut">Ctrl+Z</span>
            </button>
            <button @click="exportData"
            class="tool-button"
            >
                <span class="tool-icon">💾</span>
                <span class="tool-label">Export</span>
                <span class="tool-shortcut">Ctrl+S</span>
            </button>
      </div>
  
      <div style="display: flex; gap : 10px; ">
        <!-- Color Picker -->
        <div v-if="showColorPicker" class="color-palette">
            <div class="color-palette-header">
            <h3 class="palette-title">Color Picker</h3>
            <button 
                @click="toggleCustomColorPicker"
                class="custom-color-toggle"
                :class="{ active: showCustomColorPicker }"
                title="Custom Color Picker"
            >
                🎨
            </button>
            </div>
    

            <!-- Color Groups -->
            <div v-for="group in colorGroups" :key="group.name" class="color-section">
            <h4 class="section-title">{{ group.name }}</h4>
            <div class="color-grid">
                <button 
                v-for="color in group.colors" 
                :key="`${group.name}-${color}`"
                @click="setColor(color)"
                :class="{ active: currentColor === color }"
                :style="{ backgroundColor: color }"
                :title="color"
                class="color-button"
                />
            </div>
            </div>
    
            <!-- Custom Color Picker -->
            <div v-if="showCustomColorPicker" class="custom-color-section">
            <h4 class="section-title">Custom Color</h4>
            <div class="custom-color-inputs">
                <input 
                type="color" 
                :value="currentColor"
                @input="onCustomColorChange"
                class="color-input"
                title="Color Picker"
                />
                <input 
                type="text" 
                :value="currentColor"
                @input="onCustomColorChange"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
                class="color-text-input"
                title="HEX Color Code Input"
                />
            </div>
            </div>
        </div>
    
        <!-- Size Controls -->
        <div v-if="showSizeControls" class="size-controls">
            <div class="size-controls-header">
            <h3 class="controls-title">Size Controls</h3>
            <div class="size-preview" :style="sizePreviewStyle">
                <div class="preview-circle" :style="previewCircleStyle"></div>
            </div>
            </div>
    
            <!-- Size Controls by Tool -->
            <div class="size-section">
            <div class="size-control">
                <label for="brush-size" class="size-label">
                🖍️ Highlighter: {{ currentBrushSize }}px
                </label>
                <div class="size-slider-container">
                <input 
                    id="brush-size"
                    type="range" 
                    :value="currentBrushSize"
                    @input="setBrushSize"
                    min="1"
                    max="50"
                    step="1"
                    class="size-slider"
                    :disabled="currentTool !== 'highlighter'"
                />
                <div class="size-marks">
                    <span class="mark-small">Small</span>
                    <span class="mark-large">Large</span>
                </div>
                </div>
            </div>
    
            <div class="size-control">
                <label for="eraser-size" class="size-label">
                🧽 Eraser: {{ currentEraserSize }}px
                </label>
                <div class="size-slider-container">
                <input 
                    id="eraser-size"
                    type="range" 
                    :value="currentEraserSize"
                    @input="setEraserSize"
                    min="5"
                    max="100"
                    step="5"
                    class="size-slider"
                    :disabled="currentTool !== 'eraser'"
                />
                <div class="size-marks">
                    <span class="mark-small">Small</span>
                    <span class="mark-large">Large</span>
                </div>
                </div>
            </div>
            </div>
    
        </div>
            <!-- Background Image Controls -->
        <div class="background-controls">
        <h3>Background Image</h3>
        <div class="background-actions">
            <input 
            type="file" 
            accept="image/*" 
            @change="handleBackgroundImageUpload"
            ref="backgroundFileInput"
            style="display: none;"
            />
            <button @click="selectBackgroundImage" class="bg-button">
            📁 Select Image
            </button>
            <button 
            @click="loadSampleBackground" 
            class="bg-button"
            >
            🖼️ Sample Image
            </button>
            <button 
            @click="removeBackgroundImage"
            :disabled="!backgroundImageLoaded"
            class="bg-button remove-btn"
            >
            🗑️ Remove Background
            </button>
        </div>
        <div v-if="backgroundImageLoaded" class="background-info">
            ✅ Background Image Loaded
        </div>
        </div>

    </div>
  

    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, defineProps, defineEmits, defineExpose, computed, watch } from 'vue'
  import type { 
    FabricHighlighterProps, 
    FabricHighlighterMethods,
    ToolType
  } from './types/fabricHighlighter'
  import { onUnmounted } from 'vue'
  import * as LZString from 'lz-string'
  
  // Props 
  const props = withDefaults(defineProps<FabricHighlighterProps>(), {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    colors: () => ['#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'],
    brushSize: 10,
    eraserSize: 20,
    defaultTool: 'highlighter',
    showToolbar: true,
    showColorPicker: true,
    showSizeControls: true
  })
  
  const emit = defineEmits<{
    'tool-change': [tool: ToolType]
    'color-change': [color: string]
    'size-change': [size: number]
    'data-changed': [data: string]
    'export-data': [data: string]
    'ready': []
  }>()
  
  // Canvas
  const fabricCanvas = ref<HTMLCanvasElement>()
  const canvasContext = ref<CanvasRenderingContext2D | null>(null)
  
  // Highlighter Canvas
  const highlighterCanvas = ref<HTMLCanvasElement | null>(null)
  const highlighterContext = ref<CanvasRenderingContext2D | null>(null)
  
  // Background Image
  const backgroundImage = ref<HTMLImageElement | null>(null)
  const backgroundImageLoaded = ref(false)
  
  // State Management
  const currentTool = ref<ToolType>(props.defaultTool)
  const currentColor = ref<string>(props.colors[0])

  const showCustomColorPicker = ref(false)
  
  // Size Controls
  const currentBrushSize = ref<number>(props.brushSize)
  const currentEraserSize = ref<number>(props.eraserSize)
  
  // Drawing State
  const isDrawing = ref(false)
  const lastX = ref(0)
  const lastY = ref(0)
  
  // Strokes Data
  const strokes = ref<Array<{
    type: 'highlighter' | 'eraser',
    color: string,
    size: number,
    points: Array<{x: number, y: number}>,
    opacity: number,
    isFromRegion?: boolean
  }>>([])
  const currentStroke = ref<{x: number, y: number}[]>([])
  const currentStrokeType = ref<'highlighter' | 'eraser'>('highlighter')
  
  // Loaded Regions Data
  const loadedRegions = ref<any[]>([])
  
  // Rectangle State
  const showRectangles = ref(false)
  const detectedRectangles = ref<HTMLElement[]>([])
  const rectangles = ref<any[]>([])
  const isGenerating = ref(false)
  const rectangleCount = computed(() => detectedRectangles.value.length)
  
  // Undo/Redo State
  const canvasHistory = ref<string[]>([])
  const historyIndex = ref(-1)
  
  
  // Tools Config
  const toolsConfig = [
    {
      id: 'highlighter',
      label: 'Highlighter',
      icon: '🖍️',
      shortcut: 'H'
    },
    {
      id: 'eraser',
      label: 'Eraser',
      icon: '🧽',
      shortcut: 'E'
    }
  ]
  
    // Color
  const colorGroups = [
    {
      name: 'Highlighter',
      colors: ['#ffff00', '#00ffff', '#ff69b4', '#98fb98', '#ffd700']
    },
    {
      name: 'Basic',
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ff8c00', '#9932cc']
    },
    {
      name: 'Pastel',
      colors: ['#ffb6c1', '#add8e6', '#f0e68c', '#dda0dd', '#ffa07a']
    },
    {
      name: 'Dark Colors',
      colors: ['#8b0000', '#006400', '#000080', '#8b4513', '#2f4f4f']
    }
  ]
  
  // Set Tool
  function setTool(tool: ToolType) {
    currentTool.value = tool
    emit('tool-change', tool)
  }
  
  // Set Color
  function setColor(color: string) {
    currentColor.value = color
    emit('color-change', color)
  }
  
  // Size Controls
  function setBrushSize(event: Event) {
    const target = event.target as HTMLInputElement
    const newSize = parseInt(target.value)
    currentBrushSize.value = newSize
    emit('size-change', newSize)
  }
  
  function setEraserSize(event: Event) {
    const target = event.target as HTMLInputElement
    const newSize = parseInt(target.value)
    currentEraserSize.value = newSize
    emit('size-change', newSize)
  }
  
  
  // Computed 속성들
  // Size Preview Style
  const sizePreviewStyle = computed(() => ({
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e0e0e0',
    borderRadius: '50%',
    backgroundColor: '#f9f9f9'
  }))
  
  // Preview Circle Style
  const previewCircleStyle = computed(() => {
    const currentSize = currentTool.value === 'highlighter' ? currentBrushSize.value : currentEraserSize.value
    const maxSize = 50 // 프리뷰 영역의 최대 크기
    const scaledSize = Math.min(currentSize, maxSize)
    
    return {
      width: `${scaledSize}px`,
      height: `${scaledSize}px`,
      borderRadius: '50%',
      backgroundColor: currentTool.value === 'highlighter' ? currentColor.value : '#666',
      opacity: currentTool.value === 'highlighter' ? '0.7' : '1',
      transition: 'all 0.2s ease'
    }
  })
  
  // Custom Color Picker
  function onCustomColorChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.value) {
      setColor(target.value)
      showCustomColorPicker.value = false
    }
  }
  
  // Custom Color Picker Toggle
  function toggleCustomColorPicker() {
    showCustomColorPicker.value = !showCustomColorPicker.value
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
    console.log(`History saved: ${optimizedStrokes.length} strokes, ${(dataSize/1024).toFixed(1)}KB`)
  }
  
  // Compress Strokes Data
  function compressStrokes(strokesData: any[]): any[] {
    return strokesData.map(stroke => {
      if (stroke.type === 'highlighter') {
        // Simplify Highlighter Strokes (Douglas-Peucker algorithm)
        const simplifiedPoints = simplifyPoints(stroke.points, 2.0)
        return {
          ...stroke,
          points: simplifiedPoints
        }
      }
      return stroke // Eraser is already removed in optimization
    }).filter(stroke => {
      // Remove too short strokes
      return stroke.points.length >= 2 && calculateStrokeLength(stroke.points) > 5
    })
  }
  
    // Simplify Points
  function simplifyPoints(points: any[], tolerance: number): any[] {
    if (points.length <= 2) return points
    
    const simplified: any[] = [points[0]]
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = simplified[simplified.length - 1]
      const current = points[i]
      const next = points[i + 1]
      
      // Check if the current point is far enough from the line connecting the previous and next points
      const distance = pointToLineDistance(current, prev, next)
      
      if (distance > tolerance) {
        simplified.push(current)
      }
    }
    
    simplified.push(points[points.length - 1])
    return simplified
  }
  
  // Calculate the distance between a point and a line
  function pointToLineDistance(point: any, lineStart: any, lineEnd: any): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B)
    
    const param = dot / lenSq
    
    let xx, yy
    
    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    
    return Math.sqrt(dx * dx + dy * dy)
  }
  
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
        renderStroke(stroke)
      })
      
      // Redraw Main Canvas
      redrawCanvas()
      emit('data-changed', exportData())
    } catch (error) {
        console.error('History restore failed:', error)
    }
  }
  
  // Computed Properties
  const canUndoAction = computed(() => historyIndex.value > 0)
  const canRedoAction = computed(() => historyIndex.value < canvasHistory.value.length - 1)

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
  
  // Export Data
  function exportData(): string {
    if (!fabricCanvas.value || !highlighterCanvas.value) return ''
    
    const canvasWidth = fabricCanvas.value.width
    const canvasHeight = fabricCanvas.value.height
    
    // Extract Final Regions
    const regions = extractFinalRegions()
    
    // Convert to Percentage
    const optimizedData = {
      version: '2.0', // Compressed version
      compressed: true,
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
    
    console.log(`Export Final Regions: ${regions.length} regions`)
    console.log(`Original Size: ${(originalSize/1024).toFixed(1)}KB`)
    console.log(`Compressed Size: ${(compressedSize/1024).toFixed(1)}KB`)
    console.log(`Compression Ratio: ${compressionRatio}%`)
    
    emit('export-data', compressedData)
    return compressedData
  }
  

  
    // Extract
  function extractFinalRegions(): any[] {
    if (!highlighterCanvas.value || !highlighterContext.value) return []
    
    const regions: any[] = []
    
    // Colors used in strokes
    const strokeColors = [...new Set(strokes.value
      .filter(stroke => stroke.type === 'highlighter')
      .map(stroke => stroke.color))]
    
    // Colors used in loaded regions
    const loadedColors = [...new Set(loadedRegions.value.map(region => region.color))]
    
    // Combine all colors (remove duplicates)
    const allColors = [...new Set([...strokeColors, ...loadedColors])]
    
    console.log('extractFinalRegions: Stroke Colors:', strokeColors)
    console.log('extractFinalRegions: Loaded Colors:', loadedColors)
    console.log('extractFinalRegions: All Colors:', allColors)
    
    for (const color of allColors) {
      const colorRegions = extractRegionsForColor(color, undefined, true) // Include loaded regions
      console.log(`extractFinalRegions: ${color} Color: ${colorRegions.length} regions extracted`)
      regions.push(...colorRegions)
    }
    
    console.log('extractFinalRegions: Total extracted regions:', regions.length)
    return regions
  }
  
    // Extract Regions for Color
  function extractRegionsForColor(targetColor: string, strokesData?: any[], includeLoadedRegions?: boolean): any[] {
    if (!highlighterCanvas.value || !highlighterContext.value) return []
    
    const canvas = highlighterCanvas.value
    const ctx = highlighterContext.value
    
    // Determine which strokes to use (if strokesData is provided, use it, otherwise use all strokes)
    const sourceStrokes = strokesData || strokes.value
    
    console.log(`extractRegionsForColor: ${targetColor} Color analysis started`)
    console.log(`- includeLoadedRegions: ${includeLoadedRegions}`)
    console.log(`- sourceStrokes count: ${sourceStrokes.length}`)
    
    // Create a temporary canvas to draw only the target color
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')!
    
    // 1. Render loaded regions (if requested)
    if (includeLoadedRegions) {
      const loadedRegionsForColor = loadedRegions.value.filter(region => region.color === targetColor)
      console.log(`- Loaded ${targetColor} regions: ${loadedRegionsForColor.length}`)
      loadedRegionsForColor.forEach(region => {
        renderLoadedRegionOnContext(tempCtx, region, canvas.width, canvas.height)
      })
    }
    
    // 2. Render strokes for the target color
    const colorStrokes = sourceStrokes.filter(stroke => 
      stroke.type === 'highlighter' && stroke.color === targetColor
    )
    console.log(`- ${targetColor} Color Strokes: ${colorStrokes.length}`)
    
    tempCtx.globalCompositeOperation = 'source-over'
    tempCtx.globalAlpha = 1.0  // In the temporary canvas, it is completely opaque
    
    colorStrokes.forEach(stroke => {
      renderStrokeOnContext(tempCtx, stroke)
    })
    
    // 3. Apply Eraser Effect (all eraser strokes)
    const eraserStrokes = sourceStrokes.filter(stroke => stroke.type === 'eraser')
    console.log(`- Eraser Strokes: ${eraserStrokes.length}`)
    eraserStrokes.forEach(eraserStroke => {
      tempCtx.globalCompositeOperation = 'destination-out'
      tempCtx.globalAlpha = 1.0
      renderStrokeOnContext(tempCtx, eraserStroke)
    })
    
    // 4. Analyze Pixel Data
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
    const regions = findConnectedRegionsInImageData(imageData, targetColor)
    console.log(`- ${targetColor} Color: ${regions.length} regions extracted`)
    
    return regions
  }
  
  // Render Stroke on Context
  function renderStrokeOnContext(ctx: CanvasRenderingContext2D, stroke: any) {
    if (stroke.points.length < 2) return
    
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    
    ctx.stroke()
  }
  
  // Render Loaded Region on Context
  function renderLoadedRegionOnContext(ctx: CanvasRenderingContext2D, region: any, canvasWidth: number, canvasHeight: number) {
    // Convert Percentage to Pixel
    const bounds = {
      x: Math.round(region.bounds.x * canvasWidth),
      y: Math.round(region.bounds.y * canvasHeight),
      width: Math.round(region.bounds.width * canvasWidth),
      height: Math.round(region.bounds.height * canvasHeight)
    }
    
    // Decompress Mask
    const mask = decompressRegionMask(region.mask, bounds.width, bounds.height)
    
    // Set Color (completely opaque in the temporary canvas)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0  // Completely opaque
    ctx.fillStyle = region.color
    
    // Draw with Mask
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x]) {
          ctx.fillRect(bounds.x + x, bounds.y + y, 1, 1)
        }
      }
    }
  }
  
  // Find Connected Regions in Image Data
  function findConnectedRegionsInImageData(imageData: ImageData, targetColor: string): any[] {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const regions: any[] = []
    const visited = new Set<string>()
    
    // Scan all pixels to find drawn regions
    for (let y = 0; y < height; y += 2) { // Skip 2 pixels for performance
      for (let x = 0; x < width; x += 2) {
        const key = `${x},${y}`
        if (visited.has(key)) continue
        
        const pixelIndex = (y * width + x) * 4
        const alpha = data[pixelIndex + 3]
        
        // Found a non-transparent pixel
        if (alpha > 0) {
          // Find connected regions with flood fill
          const region = floodFillRegionInImageData(imageData, x, y, targetColor, visited)
          
          if (region.pixels.length > 10) { // Minimum size filtering
            regions.push(region)
          }
        }
      }
    }
    
    return regions
  }
  
  // Perform flood fill in image data
  function floodFillRegionInImageData(imageData: ImageData, startX: number, startY: number, targetColor: string, visited: Set<string>): any {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const pixels: {x: number, y: number}[] = []
    const stack: {x: number, y: number}[] = [{x: startX, y: startY}]
    
    let minX = startX, maxX = startX, minY = startY, maxY = startY
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!
      const key = `${x},${y}`
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) continue
      
      const pixelIndex = (y * width + x) * 4
      const alpha = data[pixelIndex + 3]
      
      if (alpha === 0) continue // Transparent pixel
      
      visited.add(key)
      pixels.push({x, y})
      
      // Update boundaries
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      
      // Add adjacent pixels to the stack
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1})
    }
    
    const bounds = {
      x: minX, // Save as pixel coordinates
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
    
    const rawMask = createRegionMask(pixels, minX, minY, bounds.width, bounds.height)
    const compressedMask = compressRegionMask(rawMask, bounds)
    
    return {
      color: targetColor,
      opacity: 0.5, // Highlighter default opacity
      pixels,
      bounds,
      mask: compressedMask
    }
  }
  

  
  // Color Matching (with tolerance)
  function colorsMatch(color1: string, color2: string): boolean {
    // Simple string comparison (exact matching)
    return color1 === color2
  }
  
  // Create Region Mask
  function createRegionMask(pixels: {x: number, y: number}[], offsetX: number, offsetY: number, width: number, height: number): boolean[][] {
    const mask: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false))
    
    pixels.forEach(pixel => {
      const relX = pixel.x - offsetX
      const relY = pixel.y - offsetY
      if (relX >= 0 && relX < width && relY >= 0 && relY < height) {
        mask[relY][relX] = true
      }
    })
    
    return mask
  }
  
  // Compress Region Mask
  function compressRegionMask(mask: boolean[][], bounds: any): string {
    // Simple RLE (Run Length Encoding) compression
    let compressed = ''
    let count = 0
    let lastValue = false
    
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        const currentValue = mask[y][x]
        
        if (currentValue === lastValue) {
          count++
        } else {
          if (count > 0) {
            compressed += `${lastValue ? '1' : '0'}:${count},`
          }
          lastValue = currentValue
          count = 1
        }
      }
    }
    
    // Add last segment
    if (count > 0) {
      compressed += `${lastValue ? '1' : '0'}:${count}`
    }
    
    return compressed
  }
  
  // Create Rectangle Regions (based on final rendering)
  async function generateRectangles(): Promise<any[]> {
    if (!fabricCanvas.value || isGenerating.value) {
      return []
    }

    try {
      isGenerating.value = true
      
      // Remove existing rectangles
      hideDetectedRectangles()

      console.log('Region creation started...')
      console.log(`Current stroke count: ${strokes.value.length}`)
      console.log(`Loaded region count: ${loadedRegions.value.length}`)
      
      // Extract final rendered regions
      const regions = extractFinalRegions()
      console.log(`Extracted region count: ${regions.length}`)
      
      // If no regions are extracted, cannot create rectangles
      if (regions.length === 0) {
        console.log('No regions extracted, cannot create rectangles')
        return []
      }
      
      // Convert regions to rectangles
      console.log('generateRectangles: Input regions:', regions.map(r => ({
        color: r.color,
        bounds: r.bounds
      })))
      
      const detectedRects = regions.map((region, index) => {
        const rect = {
          id: `region_rect_${index}`,
          x: region.bounds.x, // Already in pixel coordinates in extractFinalRegions
          y: region.bounds.y,
          width: region.bounds.width,
          height: region.bounds.height,
          color: region.color,
          pixelCount: region.pixels ? region.pixels.length : 0
        }
        
        console.log(`generateRectangles: Rectangle ${index + 1} created:`, rect)
        return rect
      })
      
      console.log('Converted rectangles:', detectedRects)
      
      // Save to rectangles.value
      rectangles.value = detectedRects
      
      // Display rectangles as DOM elements
      createRectangleElements(detectedRects)
      
      // Redraw canvas
      redrawCanvas()
      
      console.log(`${detectedRects.length} connected regions detected`)
      return detectedRects
    } catch (error) {
      console.error('Rectangle creation failed:', error)
      return []
    } finally {
      isGenerating.value = false
    }
  }
  

  


  
  // Create Rectangle DOM Elements
  function createRectangleElements(rectangles: any[]) {
    if (!fabricCanvas.value) return
    
    console.log('Rectangle DOM element creation started:', rectangles)
    
    // Check canvas container
    const canvasContainer = fabricCanvas.value.parentElement
    if (!canvasContainer) {
      console.error('Canvas container not found')
      return
    }
    
    console.log('Canvas container:', canvasContainer)
    
    // Set container position to relative if it's not already
    const containerStyle = window.getComputedStyle(canvasContainer)
    if (containerStyle.position === 'static') {
      canvasContainer.style.position = 'relative'
      console.log('Set container position to relative')
    }
    
    const newElements: HTMLElement[] = []
    
    rectangles.forEach((rect, index) => {
      console.log(`Rectangle ${index + 1} created:`, rect)
      
      // Validate coordinates and size
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn(`Rectangle ${index + 1} size is invalid:`, rect)
        return
      }
      
      const element = document.createElement('div')
      element.className = 'detected-rectangle'
      element.style.cssText = `
        position: absolute;
        left: ${Math.round(rect.x)}px;
        top: ${Math.round(rect.y)}px;
        width: ${Math.round(rect.width)}px;
        height: ${Math.round(rect.height)}px;
        border: 3px solid #ff0000;
        background: rgba(255, 0, 0, 0.2);
        pointer-events: none;
        z-index: 1000;
        box-sizing: border-box;
      `
      element.title = `Region ${index + 1} (${Math.round(rect.width)}×${Math.round(rect.height)})`
      
      console.log(`Rectangle ${index + 1} style:`, element.style.cssText)
      
      // Add to canvas container
      canvasContainer.appendChild(element)
      newElements.push(element)
      
      console.log(`Rectangle ${index + 1} DOM added`)
    })
    
    detectedRectangles.value = newElements
    console.log(`${rectangles.length} rectangles created`)
    console.log('Created DOM elements:', newElements)
  }
  
  // Toggle Rectangle Display/Hide
  function toggleRectangles() {
    showRectangles.value = !showRectangles.value
    
    if (showRectangles.value) {
      showDetectedRectangles()
    } else {
      hideDetectedRectangles()
    }
  }
  
  // Show Rectangles
  function showDetectedRectangles() {
    detectedRectangles.value.forEach(element => {
      element.style.display = 'block'
    })
  }
  
  // Hide Rectangles
  function hideDetectedRectangles() {
    detectedRectangles.value.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    detectedRectangles.value = []
  }
  
    // Optimize Strokes
  async function optimizeStrokes() {
    if (!fabricCanvas.value || !highlighterContext.value || !highlighterCanvas.value) return
    
    // 1. Analyze actual rendering results based on current canvas state
    const canvasWidth = fabricCanvas.value.width
    const canvasHeight = fabricCanvas.value.height
    
    // 2. Redraw highlighter layer to check actual results
    highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)
    
    const optimizedStrokes: any[] = []
    
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
    const finalRegions = extractFinalRegions()
    
    // Clear canvas
    highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // Render final regions in pixel units
    finalRegions.forEach(region => {
      renderFinalRegion(region, canvasWidth, canvasHeight)
    })
    
    redrawCanvas()
    
    console.log(`Stroke optimization completed: ${highlighterStrokes.length} → ${optimizedStrokes.length}`)
  }
  
  // Split stroke by erasers
  function splitStrokeByErasers(highlighterStroke: any, eraserStrokes: any[]): any[] {
    if (eraserStrokes.length === 0) return [highlighterStroke]
    
    const segments: any[] = []
    let currentSegment: any[] = []
    
    highlighterStroke.points.forEach((point: any) => {
      let isErased = false
      
      // Check if current point is in eraser area
      for (const eraserStroke of eraserStrokes) {
        if (isPointInEraserPath(point, eraserStroke)) {
          isErased = true
          break
        }
      }
      
      if (isErased) {
        // Erased part: complete current segment
        if (currentSegment.length >= 2) {
          segments.push({
            ...highlighterStroke,
            points: [...currentSegment]
          })
        }
        currentSegment = []
      } else {
        // Unerased part: add to segment
        currentSegment.push(point)
      }
    })
    
    // Add last segment
    if (currentSegment.length >= 2) {
      segments.push({
        ...highlighterStroke,
        points: [...currentSegment]
      })
    }
    
    return segments
  }
  
  // Check if point is in eraser path
  function isPointInEraserPath(point: any, eraserStroke: any): boolean {
    const eraserRadius = eraserStroke.size / 2
    
    for (const eraserPoint of eraserStroke.points) {
      const distance = Math.sqrt(
        Math.pow(point.x - eraserPoint.x, 2) + 
        Math.pow(point.y - eraserPoint.y, 2)
      )
      
      if (distance <= eraserRadius) {
        return true
      }
    }
    
    return false
  }
  
  // Calculate stroke length
  function calculateStrokeLength(points: any[]): number {
    if (points.length < 2) return 0
    
    let length = 0
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x
      const dy = points[i].y - points[i-1].y
      length += Math.sqrt(dx * dx + dy * dy)
    }
    
    return length
  }

  // Render stroke function
  function renderStroke(stroke: any) {
    if (!highlighterContext.value) return
    
    const ctx = highlighterContext.value
    
    if (stroke.points.length < 2) return
    
    // Strokes transformed from regions use a special rendering method
    if (stroke.isFromRegion) {
      renderRegionStroke(ctx, stroke)
      return
    }
    
    // Render normal strokes
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    
    if (stroke.type === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.globalAlpha = stroke.opacity
    } else if (stroke.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    }
    
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    
    // Restore state
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  
  // Render region stroke
  function renderRegionStroke(ctx: CanvasRenderingContext2D, stroke: any) {
    if (stroke.points.length === 0) return
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = stroke.color
    ctx.globalAlpha = stroke.opacity
    
    // Draw each point as a circle to create a natural highlighter effect
    stroke.points.forEach((point: any) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw a line connecting the points
    if (stroke.points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    
    // Restore state
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  // Import region-based data (optimized, LZ decompression supported)
  async function importData(data: string): Promise<void> {
    try {
      let parsedData: any
      
      // Check if data is compressed and decompress
      try {
        // First try LZ decompression
        const decompressedData = LZString.decompressFromBase64(data)
        if (decompressedData) {
          parsedData = JSON.parse(decompressedData)
          console.log('Compressed data decompressed successfully.')
        }
      } catch (e) {
        // If LZ decompression fails, try parsing original JSON
        parsedData = JSON.parse(data)
        console.log('Uncompressed data loaded.')
      }
      
      if (!fabricCanvas.value || !highlighterContext.value || !highlighterCanvas.value) {
        throw new Error('Canvas is not initialized.')
      }
      
      // Check new region-based data format
      if (parsedData.regions && Array.isArray(parsedData.regions)) {
        const dataVersion = parsedData.version || '1.0'
        const isCompressed = parsedData.compressed || false
        console.log(`Data version: ${dataVersion}, compressed: ${isCompressed}`)
        
        await importRegionData(parsedData)
        return
      }
      
      // 기존 스트로크 기반 데이터 형식 (하위 호환성)
      if (parsedData.strokes && Array.isArray(parsedData.strokes)) {
        await importLegacyStrokeData(parsedData)
        return
      }
      throw new Error('Unsupported data format.')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Data import failed. Please check if the data is correct.')
    }
  }
  
    // Import new region-based data
  async function importRegionData(parsedData: any): Promise<void> {
    if (!highlighterCanvas.value || !highlighterContext.value || !fabricCanvas.value) return
    
    const canvasWidth = fabricCanvas.value.width
    const canvasHeight = fabricCanvas.value.height
    
    // Clear existing data
    strokes.value = []
    currentStroke.value = []
    
    // Save loaded region data (for hybrid system)
    loadedRegions.value = [...parsedData.regions]
    
    // Clear highlighter layer
    highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // Draw each region on canvas
    for (let i = 0; i < parsedData.regions.length; i++) {
      const region = parsedData.regions[i]
      await renderRegion(region, canvasWidth, canvasHeight)
    }
    
    // Redraw main canvas
    redrawCanvas()
    
    // Initialize history (remove undo/redo functionality)
    canvasHistory.value = []
    historyIndex.value = -1
    
    emit('data-changed', JSON.stringify(parsedData))
  }
  
  // Render final region on canvas (pixel coordinates)
  function renderFinalRegion(region: any, canvasWidth: number, canvasHeight: number) {
    if (!highlighterContext.value) return
    
    const ctx = highlighterContext.value
    const bounds = region.bounds // Already in pixel coordinates
    
    // Decompress mask
    const mask = decompressRegionMask(region.mask, bounds.width, bounds.height)
    
    // Set color and opacity
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = region.opacity || 0.5
    ctx.fillStyle = region.color
    
    // Draw using mask
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x]) {
          ctx.fillRect(bounds.x + x, bounds.y + y, 1, 1)
        }
      }
    }
    
    // Restore settings
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  // Render region on canvas
  async function renderRegion(region: any, canvasWidth: number, canvasHeight: number) {
    if (!highlighterContext.value) return
    
    const ctx = highlighterContext.value
    // Convert percentage coordinates to pixels
    const bounds = {
      x: Math.round(region.bounds.x * canvasWidth),
      y: Math.round(region.bounds.y * canvasHeight),
      width: Math.round(region.bounds.width * canvasWidth),
      height: Math.round(region.bounds.height * canvasHeight)
    }
    
    // Decompress mask
    const mask = decompressRegionMask(region.mask, bounds.width, bounds.height)
    
    // Set color (highlighter effect)
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = region.opacity || 0.5
    ctx.fillStyle = region.color
    
    // Draw using mask
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x]) {
          ctx.fillRect(bounds.x + x, bounds.y + y, 1, 1)
        }
      }
    }
    
    // Restore settings
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }
  

  
  // Decompress mask
  function decompressRegionMask(compressed: string, width: number, height: number): boolean[][] {
    const mask: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false))
    
    if (!compressed) return mask
    
    const segments = compressed.split(',')
    let currentIndex = 0
    
    for (const segment of segments) {
      if (!segment.includes(':')) continue
      
      const [valueStr, countStr] = segment.split(':')
      const value = valueStr === '1'
      const count = parseInt(countStr, 10)
      
      for (let i = 0; i < count && currentIndex < width * height; i++) {
        const y = Math.floor(currentIndex / width)
        const x = currentIndex % width
        if (y < height && x < width) {
          mask[y][x] = value
        }
        currentIndex++
      }
    }
    
    return mask
  }
  
    // Import legacy stroke-based data (backward compatibility)
  async function importLegacyStrokeData(parsedData: any): Promise<void> {
    if (!fabricCanvas.value || !highlighterCanvas.value || !highlighterContext.value) return
    
    const canvasWidth = fabricCanvas.value.width
    const canvasHeight = fabricCanvas.value.height

    // Clear existing data
    strokes.value = []
    currentStroke.value = []
    
    // Clear highlighter layer
    highlighterContext.value.clearRect(0, 0, canvasWidth, canvasHeight)

    // Restore strokes (convert from percentage to pixels)
    parsedData.strokes.forEach((strokeData: any) => {
      const pixelStroke = {
        type: strokeData.type,
        color: strokeData.color,
        size: strokeData.size * Math.min(canvasWidth, canvasHeight),
        opacity: strokeData.opacity,
        points: strokeData.points.map((point: any) => ({
          x: point.x * canvasWidth,
          y: point.y * canvasHeight
        }))
      }
      
      strokes.value.push(pixelStroke)
      renderStroke(pixelStroke)
    })

    // Redraw main canvas
    redrawCanvas()
    
    // Initialize history
    canvasHistory.value = []
    historyIndex.value = -1
    
    emit('data-changed', JSON.stringify(parsedData))
  }
  

  

  // Load background image
  function loadBackgroundImage(imageSource: string | File | Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        backgroundImage.value = img
        backgroundImageLoaded.value = true
        redrawCanvas()
        saveToHistory()
        resolve()
      }
      
      img.onerror = () => {
        console.error('Background image loading failed')
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
  
  // Remove background image
  function removeBackgroundImage() {
    backgroundImage.value = null
    backgroundImageLoaded.value = false
    redrawCanvas()
    saveToHistory()
  }
  
  // Trigger file selection
  const backgroundFileInput = ref<HTMLInputElement>()
  function selectBackgroundImage() {
    backgroundFileInput.value?.click()
  }
  
  // Background image file upload handler
  async function handleBackgroundImageUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      try {
        await loadBackgroundImage(file)
        console.log('Background image loaded')
      } catch (error) {
        console.error('Background image loading failed:', error)
        alert('Background image loading failed.')
      }
    }
  }
  
  // Load sample background image
  async function loadSampleBackground() {
    const sampleImageUrl = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="#f8f9fa"/>
        <rect width="800" height="600" fill="url(#grid)"/>
        <text x="400" y="100" text-anchor="middle" font-family="Arial" font-size="32" fill="#666">
          Sample Document
        </text>
        <text x="400" y="150" text-anchor="middle" font-family="Arial" font-size="18" fill="#888">
          Use highlighter to mark important text areas
        </text>
        <rect x="100" y="200" width="600" height="40" fill="#ffffff" stroke="#ddd"/>
        <text x="120" y="225" font-family="Arial" font-size="16" fill="#333">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </text>
        <rect x="100" y="260" width="600" height="40" fill="#ffffff" stroke="#ddd"/>
        <text x="120" y="285" font-family="Arial" font-size="16" fill="#333">
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </text>
        <rect x="100" y="320" width="600" height="40" fill="#ffffff" stroke="#ddd"/>
        <text x="120" y="345" font-family="Arial" font-size="16" fill="#333">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco.
        </text>
        <rect x="100" y="380" width="600" height="40" fill="#ffffff" stroke="#ddd"/>
        <text x="120" y="405" font-family="Arial" font-size="16" fill="#333">
          Duis aute irure dolor in reprehenderit in voluptate velit esse.
        </text>
      </svg>
    `)
    
    try {
      await loadBackgroundImage(sampleImageUrl)
      console.log('Sample background image loaded')
    } catch (error) {
      console.error('Sample background image loading failed:', error)
      alert('Sample background image loading failed.')
    }
  }
  
  // Redraw entire canvas (background image + highlighter layer)
  function redrawCanvas() {
    if (!canvasContext.value || !fabricCanvas.value || !highlighterCanvas.value) return
    
    const canvas = fabricCanvas.value
    const ctx = canvasContext.value
    
    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 1. Draw background image or background color
    if (backgroundImage.value && backgroundImageLoaded.value) {
      // Resize image to canvas size
      const imgAspect = backgroundImage.value.width / backgroundImage.value.height
      const canvasAspect = canvas.width / canvas.height
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0
      
      if (imgAspect > canvasAspect) {
        // Image is wider - adjust height
        drawHeight = canvas.height
        drawWidth = drawHeight * imgAspect
        offsetX = (canvas.width - drawWidth) / 2
      } else {
        // Image is taller - adjust width
        drawWidth = canvas.width
        drawHeight = drawWidth / imgAspect
        offsetY = (canvas.height - drawHeight) / 2
      }
      
      ctx.drawImage(backgroundImage.value, offsetX, offsetY, drawWidth, drawHeight)
    } else {
      // Set background color
      ctx.fillStyle = props.backgroundColor || '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // 2. Composite highlighter layer (multiply mode for highlighter effect)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(highlighterCanvas.value, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Initialize canvas
  function initCanvas() {
    if (fabricCanvas.value) {
      canvasContext.value = fabricCanvas.value.getContext('2d')
      
      // Create highlighter off-screen canvas
      highlighterCanvas.value = document.createElement('canvas')
      highlighterCanvas.value.width = fabricCanvas.value.width
      highlighterCanvas.value.height = fabricCanvas.value.height
      highlighterContext.value = highlighterCanvas.value.getContext('2d')
      
      if (canvasContext.value && highlighterContext.value) {
        // Initialize highlighter canvas transparently
        highlighterContext.value.clearRect(0, 0, highlighterCanvas.value.width, highlighterCanvas.value.height)
        
        // Draw initial background
        redrawCanvas()
        
        // Save initial state to history
        setTimeout(() => saveToHistory(), 100)
        
        // Add drawing event listeners
        fabricCanvas.value.addEventListener('mousedown', startDrawing)
        fabricCanvas.value.addEventListener('mousemove', draw)
        fabricCanvas.value.addEventListener('mouseup', stopDrawing)
        fabricCanvas.value.addEventListener('mouseout', stopDrawing)
        
        // Support touch events (mobile)
        fabricCanvas.value.addEventListener('touchstart', handleTouchStart)
        fabricCanvas.value.addEventListener('touchmove', handleTouchMove)
        fabricCanvas.value.addEventListener('touchend', stopDrawing)
      }
    }
  }
  
  // Start drawing
  function startDrawing(e: MouseEvent) {
    if (currentTool.value === 'selector') return
    
    isDrawing.value = true
    const rect = fabricCanvas.value?.getBoundingClientRect()
    if (rect) {
      lastX.value = e.clientX - rect.left
      lastY.value = e.clientY - rect.top
      
      // Start new stroke
      currentStroke.value = [{x: lastX.value, y: lastY.value}]
      currentStrokeType.value = currentTool.value as 'highlighter' | 'eraser'
    }
  }
  
  // Drawing in progress
  function draw(e: MouseEvent) {
    if (!isDrawing.value || !highlighterContext.value) return
    
    const rect = fabricCanvas.value?.getBoundingClientRect()
    if (!rect) return
    
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    // Draw on highlighter layer
    highlighterContext.value.beginPath()
    highlighterContext.value.moveTo(lastX.value, lastY.value)
    highlighterContext.value.lineTo(currentX, currentY)
    
    if (currentTool.value === 'highlighter') {
      // Set highlighter settings
      highlighterContext.value.globalCompositeOperation = 'source-over'
      highlighterContext.value.strokeStyle = currentColor.value
      highlighterContext.value.lineWidth = currentBrushSize.value
      highlighterContext.value.lineCap = 'round'
      highlighterContext.value.lineJoin = 'round'
      highlighterContext.value.globalAlpha = 0.5
    } else if (currentTool.value === 'eraser') {
      // Set eraser settings (only on highlighter layer)
      highlighterContext.value.globalCompositeOperation = 'destination-out'
      highlighterContext.value.lineWidth = currentEraserSize.value
      highlighterContext.value.lineCap = 'round'
      highlighterContext.value.lineJoin = 'round'
      highlighterContext.value.globalAlpha = 1
    }
    
    highlighterContext.value.stroke()
    
    // Add point to current stroke
    currentStroke.value.push({x: currentX, y: currentY})
    
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
          size: currentTool.value === 'highlighter' ? currentBrushSize.value : currentEraserSize.value,
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
      
      // If region highlighting is enabled, automatically generate rectangles
      if (showRectangles.value && currentTool.value === 'highlighter') {
        setTimeout(() => {
          generateRectangles()
        }, 100) // Add a small delay to ensure canvas rendering is complete
      }
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
  
  // 캔버스 크기 변경 감지
  watch([() => props.width, () => props.height], () => {
    if (fabricCanvas.value && highlighterCanvas.value) {
      // 형광펜 캔버스 크기 조정
      highlighterCanvas.value.width = fabricCanvas.value.width
      highlighterCanvas.value.height = fabricCanvas.value.height
      redrawCanvas()
    }
  })

  // 라이프사이클
  onMounted(() => {
    // Canvas 초기화를 다음 틱에서 실행
    setTimeout(initCanvas, 100)
    emit('ready')
  })
  
  onUnmounted(() => {
    
    // Canvas 이벤트 리스너 제거
    if (fabricCanvas.value) {
      fabricCanvas.value.removeEventListener('mousedown', startDrawing)
      fabricCanvas.value.removeEventListener('mousemove', draw)
      fabricCanvas.value.removeEventListener('mouseup', stopDrawing)
      fabricCanvas.value.removeEventListener('mouseout', stopDrawing)
      fabricCanvas.value.removeEventListener('touchstart', handleTouchStart)
      fabricCanvas.value.removeEventListener('touchmove', handleTouchMove)
      fabricCanvas.value.removeEventListener('touchend', stopDrawing)
    }
    
    // 사각형 정리
    hideDetectedRectangles()
  })
  
  


  // API 노출
  defineExpose<FabricHighlighterMethods>({
    setTool,
    getCurrentTool: () => currentTool.value,
    setColor,
    getCurrentColor: () => currentColor.value,
    setBrushSize: (size: number) => { currentBrushSize.value = size },
    setEraserSize: (size: number) => { currentEraserSize.value = size },
    exportData,
    importData,
    clearAll: clearCanvas,
    undo,
    redo,
    canUndo: () => canUndoAction.value,
    canRedo: () => canRedoAction.value,
    generateRectangles,
    showRectangles: (show: boolean) => { showRectangles.value = show },
    getCanvasElement: () => fabricCanvas.value || null,
    takeScreenshot: () => fabricCanvas.value?.toDataURL() || '',
    getState: () => ({
      currentTool: currentTool.value,
      currentColor: currentColor.value,
      brushSize: currentBrushSize.value,
      eraserSize: currentEraserSize.value,
      highlighterSettings: { opacity: 1 },
      isLoading: false,
      isDrawing: isDrawing.value,
      showRectangles: showRectangles.value,
      hasUnsavedChanges: false,
      canvasSize: { width: props.width || 800, height: props.height || 600 },
      backgroundImage: backgroundImage.value?.src,
      detectedRectangles: detectedRectangles.value,
      history: [],
      historyIndex: -1
    }),
    loadBackgroundImage,
    removeBackgroundImage,
    isReady: () => true
  })
  
  </script>
  
  <style scoped>
    .fabric-highlighter {
    position: relative;
    display: inline-block;
  }

  .canvas-container {
    position: relative;
    display: inline-block;
  }

  .highlighter-canvas {
    border: 1px solid #ccc;
    display: block;
  }
  
  .toolbar {
    display: flex;
    gap: 8px;
    margin: 8px 0;
  }
  
  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    min-width: 80px;
    position: relative;
  }
  
  .tool-button:hover {
    background: #f5f5f5;
    border-color: #999;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .tool-button.active {
    background: #0066cc;
    color: white;
    border-color: #0052a3;
    box-shadow: 0 2px 8px rgba(0,102,204,0.3);
  }
  
  .tool-icon {
    font-size: 24px;
    line-height: 1;
  }
  
  .tool-label {
    font-weight: 500;
    font-size: 12px;
  }
  
  .tool-shortcut {
    font-size: 10px;
    opacity: 0.6;
    font-weight: 400;
  }
  
  .tool-button.active .tool-shortcut {
    opacity: 0.8;
  }
  
  .color-palette {
    flex: 1;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 320px;
  }
  
  .color-palette-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .palette-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  .custom-color-toggle {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
  }
  
  .custom-color-toggle:hover {
    background: #f0f0f0;
  }
  
  .custom-color-toggle.active {
    background: #0066cc;
    border-color: #0066cc;
  }
  
  .color-section {
    margin-bottom: 16px;
  }
  
  .color-section:last-child {
    margin-bottom: 0;
  }
  
  .section-title {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  
  .color-button {
    width: 40px;
    height: 40px;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .color-button:hover {
    border-color: #999;
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  
  .color-button.active {
    border-color: #0066cc;
    border-width: 3px;
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0,102,204,0.4);
  }
  
  .color-button.active::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    text-shadow: 0 0 3px rgba(0,0,0,0.5);
    font-size: 14px;
  }
  
  .recent-color {
    position: relative;
  }
  
  .recent-color::before {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: #0066cc;
    border-radius: 50%;
    border: 1px solid white;
  }
  
  .custom-color-section {
    border-top: 1px solid #eee;
    padding-top: 12px;
  }
  
  .custom-color-inputs {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .color-input {
    width: 50px;
    height: 40px;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
  }
  
  .color-text-input {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-family: monospace;
    font-size: 14px;
  }
  
  .color-text-input:focus {
    outline: none;
    border-color: #0066cc;
  }
  
  .data-controls {
    display: flex;
    gap: 8px;
    margin: 8px 0;
  }
  
  .data-controls button {
    padding: 8px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .data-controls button:hover {
    background: #e9e9e9;
  }
  
  /* 크기 조절 컨트롤 스타일 */
  .size-controls {
    flex: 1;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .size-controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .controls-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .size-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border: 2px solid #e0e0e0;
    border-radius: 50%;
    background-color: #f9f9f9;
  }
  
  .preview-circle {
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .size-section {
    margin-bottom: 20px;
  }
  
  .size-control {
    margin-bottom: 16px;
  }
  
  .size-label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #555;
  }
  
  .size-slider-container {
    position: relative;
  }
  
  .size-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e0e0e0;
    outline: none;
    opacity: 0.8;
    transition: opacity 0.2s;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .size-slider:hover {
    opacity: 1;
  }
  
  .size-slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .size-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .size-slider::-webkit-slider-thumb:hover {
    background: #0056b3;
    transform: scale(1.1);
  }
  
  .size-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .size-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 11px;
    color: #999;
  }
  
  .mark-small,
  .mark-large {
    font-size: 10px;
    color: #aaa;
  }
  
  .size-presets {
    border-top: 1px solid #eee;
    padding-top: 16px;
  }
  
  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .preset-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
  }
  
  .preset-button:hover {
    background: #f5f5f5;
    border-color: #007bff;
    transform: translateY(-1px);
  }
  
  .preset-button.active {
    background: #007bff;
    border-color: #007bff;
    color: white;
  }
  
  .preset-icon {
    font-size: 16px;
    margin-bottom: 4px;
  }
  
  .preset-name {
    font-weight: 500;
  }

  /* 사각형 컨트롤 스타일 */
  .rectangle-controls {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .rectangle-controls button {
    padding: 8px 16px;
    margin-right: 8px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .rectangle-controls button:hover {
    background: #f5f5f5;
    border-color: #007bff;
  }

  .rectangle-controls button.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .rectangle-controls button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rectangle-info {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }

  /* 히스토리 컨트롤 스타일 */
  .history-controls {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 8px;
  }

  .history-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .history-button:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #007bff;
    transform: translateY(-1px);
  }

  .history-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
  }

  /* 배경 이미지 컨트롤 스타일 */
  .background-controls {
    flex:1;
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .background-controls h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 16px;
  }

  .background-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
  }

  .bg-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .bg-button:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #007bff;
    transform: translateY(-1px);
  }

  .bg-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f8f9fa;
  }

  .bg-button.remove-btn:hover:not(:disabled) {
    background: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
  }

  .background-info {
    margin-top: 8px;
    padding: 6px 12px;
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    font-size: 12px;
  }

  /* 감지된 사각형 스타일 (글로벌 스타일) */
  :global(.detected-rectangle) {
    position: absolute !important;
    border: 3px dashed #ff0000 !important;
    background: rgba(255, 0, 0, 0.15) !important;
    pointer-events: none !important;
    z-index: 9999 !important;
    box-sizing: border-box !important;
    animation: rectangle-pulse 1.5s infinite;
  }

  @keyframes rectangle-pulse {
    0% { 
      border-color: #ff0000;
      background: rgba(255, 0, 0, 0.1);
      opacity: 0.8;
    }
    50% { 
      border-color: #ff4444;
      background: rgba(255, 0, 0, 0.25);
      opacity: 1;
    }
    100% { 
      border-color: #ff0000;
      background: rgba(255, 0, 0, 0.1);
      opacity: 0.8;
    }
  }
  </style>
  
  