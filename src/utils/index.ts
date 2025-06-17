import { HighlighterExportData, HighlighterPoint, HighlighterRectangle, HighlighterRegion, HighlighterStroke } from "@/types"
import { floodFillRegionInImageData, decompressRegionMask, isPointInEraserPath, simplifyPoints, renderRegionStroke } from "./region"

import * as LZString from 'lz-string'

// Render Stroke on Context
export function renderStrokeOnContext(ctx: CanvasRenderingContext2D, stroke: HighlighterStroke) {
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
export function renderLoadedRegionOnContext(ctx: CanvasRenderingContext2D, region: HighlighterRegion, canvasWidth: number, canvasHeight: number) {
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
export function findConnectedRegionsInImageData(imageData: ImageData, targetColor: string): HighlighterRegion[] {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const regions: HighlighterRegion[] = []
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

        if (region.pixels && region.pixels.length > 10) { // Minimum size filtering
          regions.push(region)
        }
      }
    }
  }

  return regions
}


// Calculate stroke length
export function calculateStrokeLength(points: HighlighterPoint[]): number {
  if (points.length < 2) return 0

  let length = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    length += Math.sqrt(dx * dx + dy * dy)
  }

  return length
}



// Split stroke by erasers
export function splitStrokeByErasers(highlighterStroke: HighlighterStroke, eraserStrokes: HighlighterStroke[]): HighlighterStroke[] {
  if (eraserStrokes.length === 0) return [highlighterStroke]

  const segments: HighlighterStroke[] = []
  let currentSegment: { x: number, y: number }[] = []

  highlighterStroke.points.forEach((point: { x: number, y: number }) => {
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





// Compress Strokes Data
export function compressStrokes(strokesData: HighlighterStroke[]): HighlighterStroke[] {
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

// Render stroke function
export function renderStroke(ctx: CanvasRenderingContext2D, stroke: HighlighterStroke) {

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





// Render region on canvas, highlighterContext is required
export async function renderRegion(ctx: CanvasRenderingContext2D, region: HighlighterRegion, canvasWidth: number, canvasHeight: number) {

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


// Render final region on canvas (pixel coordinates)
export function renderFinalRegion(ctx: CanvasRenderingContext2D, region: HighlighterRegion) {

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




// Import region-based data (optimized, LZ decompression supported)
export async function parseCompressedData(compressedData: string): Promise<HighlighterExportData | undefined> {
  try {
    let parsedData: HighlighterExportData | null = null

    // Check if data is compressed and decompress
    try {
      // First try LZ decompression
      const decompressedData = LZString.decompressFromBase64(compressedData)
      if (decompressedData) {
        parsedData = JSON.parse(decompressedData)
      }
    } catch (e) {
      // If LZ decompression fails, try parsing original JSON
      parsedData = JSON.parse(compressedData)
    }

    if (!parsedData) {
      throw new Error('Invalid data format.')
    }

    // Check new region-based data format
    if (parsedData.regions && Array.isArray(parsedData.regions)) {
      const dataVersion = parsedData.version || '1.0'
      const isCompressed = parsedData.compressed || false

      return parsedData
    }

    throw new Error('Unsupported data format.')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Import new region-based data
export async function drawContextWithParsedData(
  context : CanvasRenderingContext2D,
  renderWidth : number, 
  renderHeight : number, 
  parsedData: HighlighterExportData
): Promise<void> 
  {

  // Clear highlighter layer
  context.clearRect(0, 0, renderWidth, renderHeight)

  // Draw each region on canvas
  for (let i = 0; i < parsedData.regions.length; i++) {
    const region = parsedData.regions[i]
    await renderRegion(context, region, renderWidth, renderHeight)
  }
}



// Extract
export function extractFinalRegions(
  canvas : HTMLCanvasElement,
  ctx : CanvasRenderingContext2D,
  strokes: HighlighterStroke[], 
  loadedRegions: HighlighterRegion[]
): HighlighterRegion[] {
  const regions: HighlighterRegion[] = []

  // Colors used in strokes
  const strokeColors = [...new Set(strokes
    .filter(stroke => stroke.type === 'highlighter')
    .map(stroke => stroke.color))]

  // Colors used in loaded regions
  const loadedColors = [...new Set(loadedRegions.map(region => region.color))]

  // Combine all colors (remove duplicates)
  const allColors = [...new Set([...strokeColors, ...loadedColors])]

  for (const color of allColors) {
    const colorRegions = extractRegionsForColor(canvas, ctx, strokes, loadedRegions, color, undefined, true) // Include loaded regions
    regions.push(...colorRegions)
  }

  return regions
}


// Extract Regions for Color
function extractRegionsForColor(
  canvas : HTMLCanvasElement,
  ctx : CanvasRenderingContext2D,
  strokes : HighlighterStroke[],
  loadedRegions : HighlighterRegion[],
  
  targetColor: string, 
  
  strokesData?: HighlighterStroke[], 
  includeLoadedRegions?: boolean
): HighlighterRegion[] {
  if (!canvas || !ctx) return []



  // Determine which strokes to use (if strokesData is provided, use it, otherwise use all strokes)
  const sourceStrokes = strokesData || strokes
  // Create a temporary canvas to draw only the target color
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')!

  // 1. Render loaded regions (if requested)
  if (includeLoadedRegions) {
    const loadedRegionsForColor = loadedRegions.filter(region => region.color === targetColor)


    loadedRegionsForColor.forEach(region => {
      renderLoadedRegionOnContext(tempCtx, region, canvas.width, canvas.height)
    })
  }

  // 2. Render strokes for the target color
  const colorStrokes = sourceStrokes.filter(stroke =>
    stroke.type === 'highlighter' && stroke.color === targetColor
  )

  tempCtx.globalCompositeOperation = 'source-over'
  tempCtx.globalAlpha = 1.0  // In the temporary canvas, it is completely opaque

  colorStrokes.forEach(stroke => {
    renderStrokeOnContext(tempCtx, stroke)
  })

  // 3. Apply Eraser Effect (all eraser strokes)
  const eraserStrokes = sourceStrokes.filter(stroke => stroke.type === 'eraser')

  eraserStrokes.forEach(eraserStroke => {
    tempCtx.globalCompositeOperation = 'destination-out'
    tempCtx.globalAlpha = 1.0
    renderStrokeOnContext(tempCtx, eraserStroke)
  })

  // 4. Analyze Pixel Data
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
  const regions = findConnectedRegionsInImageData(imageData, targetColor)

  return regions
}








/**
 * Exported Data to Rectangles
 * @param compressedData  Compressed data to be parsed
 * @returns HighlighterRectangle[]
 */
export async function dataToRectangles(compressedData : string) : Promise<HighlighterRectangle[]> {
  let canvas: HTMLCanvasElement | null = document.createElement('canvas')
  let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d')!

  // Set a default size for the temporary canvas for rendering.
  // The exported data uses percentage-based coordinates, so a canvas size is required.

  try {
    const parsedData = await parseCompressedData(compressedData);
    if (!parsedData) {
      throw new Error('Invalid data format.')
    }
    canvas.width = parsedData.width
    canvas.height = parsedData.height
    const strokes : HighlighterStroke[] = [];
    const loadedRegions : HighlighterRegion[] = [...parsedData.regions];

    if (!parsedData) {
      return []
    }
    await drawContextWithParsedData(ctx, canvas.width, canvas.height, parsedData)

    // 1. Extract final rendered regions
    const regions = extractFinalRegions(
      canvas,
      ctx,
      strokes,
      loadedRegions
    )
    // If no regions are extracted, cannot create rectangles
    if (regions.length === 0) {
      return []
    }


    // 2. Convert regions to rectangles 
    
    const detectedRects = regions.map((region, index) => {
      const rect: HighlighterRectangle = {
        x: region.bounds.x , // Already in pixel coordinates in extractFinalRegions
        y: region.bounds.y,
        width: region.bounds.width,
        height: region.bounds.height,
        color: region.color,

        xPercent: region.bounds.x / parsedData.width * 100,
        yPercent: region.bounds.y / parsedData.height * 100,
        widthPercent: region.bounds.width / parsedData.width * 100,
        heightPercent: region.bounds.height / parsedData.height * 100,
      }
      return rect
    })
    
    return detectedRects;
  } catch (error) {
    console.error('Error in dataToRectangles:', error)
    return []
  } finally {
    // Release canvas memory
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
    canvas = null
    ctx = null
  }
}

