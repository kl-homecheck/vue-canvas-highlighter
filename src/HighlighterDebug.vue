<template>
    <div class="highlighter-demo">
    <h1>@homecheck/highlighter Demo</h1>
    
    <div class="demo-section">

      <div class="fabric-highlighter">
    <!-- 주 캔버스 영역 -->
    <Highlighter 
      ref="highlighterRef"
    
    />
  
      <!-- 도구 모음 -->
      <div class="toolbar" role="radiogroup" aria-label="도구 선택">
        <button 
          v-for="tool in toolsConfig" 
          :key="tool.id"
          @click="setTool(tool.id as ToolType)"
          :class="{ active: highlighterRef?.currentTool === tool.id }"
          :title="`${tool.label} (${tool.shortcut})`"
          :aria-pressed="highlighterRef?.currentTool === tool.id"
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
                @click="toggleSizeMode"
                title="Toggle Size Mode"
            >
                <span class="tool-icon">🔍</span>
                <span class="tool-label">Size Mode :</span>
                <span class="tool-shortcut">{{ highlighterRef?.sizeMode }}</span>
            </button>
        <button 
            class="tool-button"
                :class="{ active: highlighterRef?.isShowDetectedRectangles }"
                @click="toggleRectangles"
                title="Show/Hide Detected Regions"
            >
                <span class="tool-icon">📦</span>
                <span class="tool-label">Show Regions</span>
                <span class="tool-shortcut">{{ highlighterRef?.isShowDetectedRectangles ? '(On)' : '(Off)' }}</span>
            </button>


            <button 
                @click="highlighterRef?.undo()"
                :disabled="!highlighterRef?.canUndo"
                title="Undo (Ctrl+Z)"
                class="tool-button"
            >
                <span class="tool-icon">↶</span>
                <span class="tool-label">Undo</span>
                <span class="tool-shortcut">Ctrl+Z</span>
            </button>
            <button 
                @click="highlighterRef?.redo()"
                :disabled="!highlighterRef?.canRedo"
                title="Redo (Ctrl+Y)"
                class="tool-button"
            >
                <span class="tool-icon">↷</span>
                <span class="tool-label">Redo</span>
                <span class="tool-shortcut">Ctrl+Y</span>
            </button>

            <button 
                @click="highlighterRef?.clearCanvas()"
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
        <div class="color-palette">
            <div class="color-palette-header">
            <h3 class="palette-title">Color Picker</h3>

            </div>
    

            <!-- Color Groups -->
            <div v-for="group in colorGroups" :key="group.name" class="color-section">
            <h4 class="section-title">{{ group.name }}</h4>
            <div class="color-grid">
                <button 
                v-for="color in group.colors" 
                :key="`${group.name}-${color}`"
                @click="setColor(color)"
                :class="{ active: highlighterRef?.currentColor === color }"
                :style="{ backgroundColor: color }"
                :title="color"
                class="color-button"
                />
            </div>
            </div>
    
        </div>
    
        <!-- Size Controls -->
        <div class="size-controls">
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
                🖍️ Highlighter: {{ highlighterRef?.currentBrushSize }} {{ highlighterRef?.sizeMode == 'pixel' ? 'px' : '%' }}
                </label>
                <div class="size-slider-container">
                <input 
                    id="brush-size"
                    type="range" 
                    :value="highlighterRef?.currentBrushSize"
                    @input="setBrushSize"
                    min="1"
                    max="50"
                    step="1"
                    class="size-slider"
                    :disabled="highlighterRef?.currentTool !== 'highlighter'"
                />
                <div class="size-marks">
                    <span class="mark-small">Small</span>
                    <span class="mark-large">Large</span>
                </div>
                </div>
            </div>
    
            <div class="size-control">
                <label for="eraser-size" class="size-label">
                🧽 Eraser: {{ highlighterRef?.currentEraserSize }} {{ highlighterRef?.sizeMode == 'pixel' ? 'px' : '%' }}
                </label>
                <div class="size-slider-container">
                <input 
                    id="eraser-size"
                    type="range" 
                    :value="highlighterRef?.currentEraserSize"
                    @input="setEraserSize"
                    min="5"
                    max="100"
                    step="5"
                    class="size-slider"
                    :disabled="highlighterRef?.currentTool !== 'eraser'"
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
            @click="highlighterRef?.removeBackgroundImage"
            :disabled="!highlighterRef?.isBackgroundImageLoaded"
            class="bg-button remove-btn"
            >
            🗑️ Remove Background
            </button>
        </div>
        <div v-if="highlighterRef?.isBackgroundImageLoaded" class="background-info">
            ✅ Background Image Loaded
        </div>
        </div>

    </div>
  

    </div>
  </div>
    
    <div class="demo-section" v-if="exportedData">
      <h2>Exported Data</h2>
      <textarea 
        v-model="exportedData" 
        rows="6" 
        cols="80"
        readonly
        placeholder="Exported data will be displayed here"
      />
      <div class="data-actions">
        <button @click="copyToClipboard">Copy to Clipboard</button>
      </div>
    </div>

    <div class="demo-section">
      <h2>Import Data</h2>
      <textarea 
        v-model="importDataString" 
        rows="6" 
        cols="80"
        placeholder="Paste the saved data here and click the 'Import' button"
      />
      <div class="data-actions">
        <button @click="importFromText" :disabled="!importDataString.trim()">Import Data</button>
        <button @click="clearImportData">Clear</button>
      </div>

    </div>
    

  </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, defineProps, defineEmits, defineExpose, computed, watch } from 'vue'
  import type { 
    ToolType,
  } from './types/highlighter'
  import Highlighter from './Highlighter.vue'
  


  
  const highlighterRef = ref<InstanceType<typeof Highlighter>>()
  

  

  


  
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
    highlighterRef.value?.setTool(tool)
  }
  
  // Set Color
  function setColor(color: string) {
    highlighterRef.value?.setColor(color)
  }
  
  // Size Controls
  function setBrushSize(event: Event) {
    const target = event.target as HTMLInputElement
    const newSize = parseInt(target.value)
    highlighterRef.value?.setBrushSize(newSize)
  }
  
  function setEraserSize(event: Event) {
    const target = event.target as HTMLInputElement
    const newSize = parseInt(target.value)
    highlighterRef.value?.setEraserSize(newSize)
  }


  function exportData() {
    const data = highlighterRef.value?.exportData()
    if(!data) return;
    exportedData.value = data
  }
  
  function toggleSizeMode() {
    highlighterRef.value?.setSizeMode(highlighterRef.value?.sizeMode === 'pixel' ? 'percent' : 'pixel')
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
    const currentSize = highlighterRef.value?.currentTool === 'highlighter' ? highlighterRef.value?.currentBrushSize : highlighterRef.value?.currentEraserSize
    const maxSize = 50 // 프리뷰 영역의 최대 크기
    const scaledSize = Math.min(currentSize || 0, maxSize)
    
    return {
      width: `${scaledSize}px`,
      height: `${scaledSize}px`,
      borderRadius: '50%',
      backgroundColor: highlighterRef.value?.currentTool === 'highlighter' ? highlighterRef.value?.currentColor : '#666',
      opacity: highlighterRef.value?.currentTool === 'highlighter' ? '0.7' : '1',
      transition: 'all 0.2s ease'
    }
  })
  


  
  




  


  
  


  
  // Toggle Rectangle Display/Hide
  function toggleRectangles() {
    
    if (!highlighterRef.value?.isShowDetectedRectangles) {
      highlighterRef.value?.showDetectedRectangles()
    } else {
      highlighterRef.value?.hideDetectedRectangles()
    }
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
        await highlighterRef.value?.loadBackgroundImage(file)
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
      await highlighterRef.value?.loadBackgroundImage(sampleImageUrl)
      console.log('Sample background image loaded')
    } catch (error) {
      console.error('Sample background image loading failed:', error)
      alert('Sample background image loading failed.')
    }
  }
  


  

  


  //---------------------------------------------------------------------------


  
// 상태 관리
const exportedData = ref('')
const importDataString = ref('')
const fileInput = ref()

// 형광펜 색상 설정
const colors = ['#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff']

// 이벤트 핸들러들
function handleDataChanged(data: string) {
  console.log('Data changed:', data.length, 'characters')
}

function handleExportData(data: string) {
  exportedData.value = data
  console.log('Data exported:', data)
}

function handleReady() {
  console.log('Highlighter component ready!')
}

// 클립보드에 복사
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(exportedData.value)
    alert('Copied to clipboard!')
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
    alert('Copy to clipboard failed.')
  }
}

// 텍스트에서 데이터 가져오기
async function importFromText() {
  if (!importDataString.value.trim()) {
    alert('Please enter the data to import.')
    return
  }
  
  try {
    if (highlighterRef.value) {
      await highlighterRef.value.importData(importDataString.value)
      alert('Data imported successfully!')
    }
  } catch (error) {
    console.error('Data import failed:', error)
    alert('Data import failed. Please check if the format is correct.')
  }
}


// Import 데이터 지우기
function clearImportData() {
  importDataString.value = ''
}




  </script>
  
  <style scoped>
  
.highlighter-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}

.demo-section h2 {
  margin-top: 0;
  color: #333;
}

textarea {
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  background-color: #f8f8f8;
}

.data-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 8px 16px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #007bff;
  color: white;
}

ul {
  padding-left: 20px;
}

li {
  margin: 5px 0;
}

    .fabric-highlighter {
    position: relative;
    display: inline-block;
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


  </style>
  
  