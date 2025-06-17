import { HighlighterPoint, HighlighterRegion, HighlighterStroke } from "@/types"



// Create Region Mask
export function createRegionMask(pixels: HighlighterPoint[], offsetX: number, offsetY: number, width: number, height: number): boolean[][] {
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


// Perform flood fill in image data
export function floodFillRegionInImageData(imageData: ImageData, startX: number, startY: number, targetColor: string, visited: Set<string>): HighlighterRegion {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const pixels: { x: number, y: number }[] = []
  const stack: { x: number, y: number }[] = [{ x: startX, y: startY }]

  let minX = startX, maxX = startX, minY = startY, maxY = startY

  while (stack.length > 0) {
    const { x, y } = stack.pop()!
    const key = `${x},${y}`

    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) continue

    const pixelIndex = (y * width + x) * 4
    const alpha = data[pixelIndex + 3]

    if (alpha === 0) continue // Transparent pixel

    visited.add(key)
    pixels.push({ x, y })

    // Update boundaries
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)

    // Add adjacent pixels to the stack
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
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


// Render region stroke
export function renderRegionStroke(ctx: CanvasRenderingContext2D, stroke: HighlighterStroke) {
  if (stroke.points.length === 0) return

  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = stroke.color
  ctx.globalAlpha = stroke.opacity

  // Draw each point as a circle to create a natural highlighter effect
  stroke.points.forEach((point: HighlighterPoint) => {
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


// Compress Region Mask
export function compressRegionMask(mask: boolean[][], bounds: { x: number, y: number, width: number, height: number }): string {
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


// Decompress mask
export function decompressRegionMask(compressed: string, width: number, height: number): boolean[][] {
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


// Check if point is in eraser path
export function isPointInEraserPath(point: { x: number, y: number }, eraserStroke: HighlighterStroke): boolean {
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

// Calculate the distance between a point and a line
export function pointToLineDistance(point: { x: number, y: number }, lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }): number {
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


// Simplify Points
export function simplifyPoints(points: HighlighterPoint[], tolerance: number): HighlighterPoint[] {
  if (points.length <= 2) return points

  const simplified: HighlighterPoint[] = [points[0]]

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
