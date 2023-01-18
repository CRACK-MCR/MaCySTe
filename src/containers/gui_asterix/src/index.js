'use strict';

import { ConfigASTERIXWebSocketUrl, getConfigAndThen } from "./config";
import { sendToNATS } from "./nats";

// Imports

// Settings
const radarRanges = [ 0.5, 1.0, 1.5, 3.0, 6.0, 12.0, 24.0 ]

// Shared state
let currentGain = 1.0
let maxGainEnabled = true
let currentRadarRange = 3
let radarCanvas = undefined
let statusLabel = undefined

// Radar math helpers
const approxEq = (a, b) => Math.abs(a - b) < 1e-12

const deg2rad = angle => angle * Math.PI / 180.0

const radar2deg = angle => angle - 90.0
const radar2rad = angle => deg2rad(radar2deg(angle))

const getCanvasSize = (canvas) => ({ x: canvas.width, y: canvas.height })
const getCanvasMinorDimensionSize = (canvas) => {
  const { x, y } = getCanvasSize(canvas)
  return x < y ? x : y
}
const getCanvasCenter = (canvas) => {
  const { x, y } = getCanvasSize(canvas)
  return { x: x / 2.0, y: y / 2.0 }
}
const getCanvasRadius = (canvas, percentage = 0.95) => {
  return percentage * (getCanvasMinorDimensionSize(canvas) / 2)
}

// Radar draw helpers
function drawRadarCell(canvas, begAngle, endAngle, begNormalizedDistance, endNormalizedDistance, echoStrength) {
  // Fix arguments
  if (begNormalizedDistance < 0.0) {
    return drawRadarCell(canvas, begAngle, endAngle, 0.0, endNormalizedDistance, echoStrength)
  }
  if (endNormalizedDistance > 1.0) {
    return drawRadarCell(canvas, begAngle, endAngle, begNormalizedDistance, 1.0, echoStrength)
  }
  if (begNormalizedDistance < endNormalizedDistance) {
    return drawRadarCell(canvas, begAngle, endAngle, endNormalizedDistance, begNormalizedDistance, echoStrength)
  }

  // Calculate angles in rads
  const begAngleRad = radar2rad(begAngle)
  const endAngleRad = radar2rad(endAngle)

  // Calculate center
  const { x: centerX, y: centerY } = getCanvasCenter(canvas)

  // Un-normalize distances
  const radarRadius = getCanvasRadius(canvas, 0.90)
  const begPixelDistance = radarRadius * begNormalizedDistance
  const endPixelDistance = radarRadius * endNormalizedDistance

  // Calculate cell corners (CCW)
  const getBRCorner = () => ({
    x: centerX + Math.cos(endAngleRad) * begPixelDistance,
    y: centerY + Math.sin(endAngleRad) * begPixelDistance,
  })
  // const getBLCorner = () => ({
  //   x: centerX + Math.cos(begAngleRad) * begPixelDistance,
  //   y: centerY + Math.sin(begAngleRad) * begPixelDistance,
  // })
  const getTLCorner = () => ({
    x: centerX + Math.cos(begAngleRad) * endPixelDistance,
    y: centerY + Math.sin(begAngleRad) * endPixelDistance,
  })
  // const getTRCorner = () => ({
  //   x: centerX + Math.cos(endAngleRad) * endPixelDistance,
  //   y: centerY + Math.sin(endAngleRad) * endPixelDistance,
  // })

  // Draw
  const ctx = canvas.getContext('2d')
  ctx.save()

  // ARC METHOD
  const BRCorner = getBRCorner()
  const TLCorner = getTLCorner()
  ctx.beginPath()
  ctx.moveTo(BRCorner.x, BRCorner.y)
  ctx.arc(centerX, centerY, begPixelDistance, endAngleRad, begAngleRad, true)
  ctx.lineTo(TLCorner.x, TLCorner.y)
  ctx.arc(centerX, centerY, endPixelDistance, begAngleRad, endAngleRad, false)
  ctx.closePath()

  // LINE METHOD
  /*
  const BRCorner = getBRCorner()
  const BLCorner = getBLCorner()
  const TLCorner = getTLCorner()
  const TRCorner = getTRCorner()
  ctx.beginPath()
  ctx.moveTo(BRCorner.x, BRCorner.y)
  ctx.lineTo(BLCorner.x, BLCorner.y)
  ctx.lineTo(TLCorner.x, TLCorner.y)
  ctx.lineTo(TRCorner.x, TRCorner.y)
  ctx.closePath()
  */

  ctx.fillStyle = `rgba(${(echoStrength*255).toFixed(0)},0,0,255)`
  ctx.fill()

  ctx.restore()
}

const drawRadarIndicators = (canvas) => {
  const ctx = canvas.getContext('2d')
  ctx.save()

  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'white'
  ctx.font = '10px monospace'
  for (let i = 0; i < 360; i++) {
    const { x: centerX, y: centerY } = getCanvasCenter(canvas)
    const angleRad = radar2rad(i)
    const begRange = getCanvasRadius(canvas, 0.91)
    const endRange = getCanvasRadius(canvas, i % 5 === 0 ? 0.95 : 0.925)
    ctx.beginPath()
    ctx.moveTo(centerX + Math.cos(angleRad) * begRange, centerY + Math.sin(angleRad) * begRange)
    ctx.lineTo(centerX + Math.cos(angleRad) * endRange, centerY + Math.sin(angleRad) * endRange)
    ctx.stroke()

    if (i % 5 === 0) {
      const textRange = endRange + 10
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(i.toFixed(0), centerX + Math.cos(angleRad) * textRange, centerY + Math.sin(angleRad) * textRange)
    }
  }

  ctx.restore()
}

const drawRadarBase = (canvas) => {
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false
  drawRadarCell(canvas, 0.0, 360.0, 0.0, 1.0, 0.0)
  drawRadarIndicators(canvas)
  console.debug('Redrawn radar base')
}

// Gain
function syncGainLabel() {
  const gainLabel = document.getElementById('gain-label')
  if (maxGainEnabled) {
    gainLabel.textContent = "Gain MAX"
  } else {
    const gainString = 'Gain ' + currentGain.toFixed(2)
    gainLabel.textContent = gainString
  }
}
function maxGain() {
  currentGain = 1.0
  maxGainEnabled = !maxGainEnabled
  syncGainLabel()
}
function decreaseGain() {
  if (maxGainEnabled) {
    maxGainEnabled = false
    currentGain = 1.0
  } else {
    currentGain -= 0.1
  }
  syncGainLabel()
}
function increaseGain() {
  if (maxGainEnabled) {
    maxGainEnabled = false
    currentGain = 1.0
  } else {
    currentGain += 0.1
  }
  syncGainLabel()
}

// Range
function syncRangeLabel() {
  const rangeLabel = document.getElementById('range-label')
  const rangeValue = radarRanges[currentRadarRange]
  const rangeString = 'Range ' + rangeValue.toFixed(1) + ' NM'
  rangeLabel.textContent = rangeString

  const rangeNM = radarRanges[currentRadarRange]
  const rangeM = rangeNM * 1852
  const topic = 'radar.ZOOM'
  const message = rangeM.toFixed(0)
  sendToNATS(topic, message)
}
function decreaseRange() {
  if (currentRadarRange === 0) return
  currentRadarRange--
  syncRangeLabel()
  if (radarCanvas) radarCanvas.dispatchEvent(new Event('canvas-resize'))
}
function increaseRange() {
  if (currentRadarRange === radarRanges.length - 1) return
  currentRadarRange++
  syncRangeLabel()
  if (radarCanvas) radarCanvas.dispatchEvent(new Event('canvas-resize'))
}

// Status helpers
function setStatus(text) {
  if (statusLabel) statusLabel.textContent = text
}

// Resize handlers
function handleCanvasResize(resizeEvents) {
  for (const resizeEvent of resizeEvents) {
    resizeEvent.target.width = resizeEvent.contentRect.width
    resizeEvent.target.height = resizeEvent.contentRect.height
    console.debug('Resized canvas to ', resizeEvent.target.width, resizeEvent.target.height)
    resizeEvent.target.dispatchEvent(new Event('canvas-resize'))
  }
}

// ASTERIX handlers
async function onASTERIX(data) {
  // Grab data
  const buffer = await data.arrayBuffer()
  const view = new DataView(buffer)
  let offset = 0
  // Parse CAT
  const CAT = view.getUint8(offset)
  offset += 1
  if (CAT !== 240) {
    throw new Error(`CAT ${CAT} != 240`)
  }
  // Parse LEN
  const LEN = view.getUint16(offset)
  offset += 2
  // Parse FSPEC
  const isBitSet = (value, bitIndex) => (value & (1 << bitIndex)) === 0 ? false : true
  const fspec1 = view.getUint8(offset)
  offset++
  const hasDataSourceIdentifier = isBitSet(fspec1, 7)
  const hasMessageType = isBitSet(fspec1, 6)
  const hasVideoRecordHeader = isBitSet(fspec1, 5)
  const hasVideoSummary = isBitSet(fspec1, 4)
  const hasVideoHeaderNano = isBitSet(fspec1, 3)
  const hasVideoHeaderFemto = isBitSet(fspec1, 2)
  const hasVideoCellsResolutionAndDataCompressionIndicator = isBitSet(fspec1, 1)
  const fspec1FX = isBitSet(fspec1, 0)
  if (!fspec1FX) {
    throw new Error(`FSPEC first octet does not have the FX bit set`)
  }
  const fspec2 = view.getUint8(offset)
  offset++
  const hasVideoOctetsAndVideoCellCounters = isBitSet(fspec2, 7)
  const hasVideoBlockLowDataVolume = isBitSet(fspec2, 6)
  const hasVideoBlockMediumDataVolume = isBitSet(fspec2, 5)
  const hasVideoBlockHighDataVolume = isBitSet(fspec2, 4)
  const hasTimeOfDay = isBitSet(fspec2, 3)
  const fspec2RE = isBitSet(fspec2, 2)
  const fspec2SP = isBitSet(fspec2, 1)
  const fspec2FX = isBitSet(fspec2, 0)
  if (!fspec1FX) {
    throw new Error(`FSPEC second octet has the FX bit set`)
  }
  // Data source identifier
  let sac = undefined
  let sic = undefined
  if (hasDataSourceIdentifier) {
    sac = view.getUint8(offset)
    offset++
    sic = view.getUint8(offset)
    offset++
  }
  // Message Type
  let messageType = undefined
  if (hasMessageType) {
    messageType = view.getUint8(offset)
    offset++
  }
  // Video Record Header
  let messageIndex = undefined
  if (hasVideoRecordHeader) {
    messageIndex = view.getUint32(offset)
    offset += 4
  }
  // Video Summary
  let videoSummary = undefined
  if (hasVideoSummary) {
    const rep = view.getUint8(offset)
    offset++
    videoSummary = ''
    for (let i = 0; i < rep; i++) {
      const charCode = view.getUint8(offset)
      offset++
      const char = String.fromCharCode(charCode)
      videoSummary += char
    }
  }
  // Video headers
  let begAzimuth = undefined
  let endAzimuth = undefined
  let startRange = undefined
  let cellDuration = undefined
  let cellLength = undefined

  if (hasVideoHeaderNano) {
    const begAzimuthRaw = view.getUint16(offset)
    offset += 2
    const endAzimuthRaw = view.getUint16(offset)
    offset += 2
    startRange = view.getUint32(offset)
    offset += 4
    const cellDurationRaw = view.getUint32(offset)
    offset += 4
    // Calculate values
    begAzimuth = begAzimuthRaw * 360.0 / 65536.0
    endAzimuth = endAzimuthRaw * 360.0 / 65536.0
    cellDuration = cellDurationRaw * 1e-9
    cellLength = cellDuration * 299792458 / 2.0
  }
  if (hasVideoHeaderFemto) {
    const begAzimuthRaw = view.getUint16(offset)
    offset += 2
    const endAzimuthRaw = view.getUint16(offset)
    offset += 2
    startRange = view.getUint32(offset)
    offset += 4
    const cellDurationRaw = view.getUint32(offset)
    offset += 4
    // Calculate values
    begAzimuth = begAzimuthRaw * 360.0 / 65536.0
    endAzimuth = endAzimuthRaw * 360.0 / 65536.0
    cellDuration = cellDurationRaw * 1e-15
    cellLength = cellDuration * 299792458 / 2.0
  }
  // Video Cells Resolution & Data Compression Indicator
  let compressionApplied = undefined
  let resolutionBits = undefined
  if (hasVideoCellsResolutionAndDataCompressionIndicator) {
    compressionApplied = (view.getUint8(offset) << 7) & 1 > 0
    offset++

    switch (view.getUint8(offset)) {
      case 1:
        resolutionBits = 1;
        break;
      case 2:
        resolutionBits = 2;
        break;
      case 3:
        resolutionBits = 4;
        break;
      case 4:
        resolutionBits = 8;
        break;
      case 5:
        resolutionBits = 16;
        break;
      case 6:
        resolutionBits = 32;
        break;
      default:
        throw new Error(`Unknown bit resolution`)
    }
    offset++
  }
  // Video Octets & Video Cells Counters
  let videoOctetsCount = undefined
  let videoCellsCount = undefined
  if (hasVideoOctetsAndVideoCellCounters) {
    videoOctetsCount = view.getUint16(offset)
    offset += 2
    videoCellsCount = view.getUint16(offset) << 8 + view.getUint8(offset + 2)
    offset += 3
  }
  // Video Blocks
  let videoCells = []

  if (hasVideoBlockLowDataVolume || hasVideoBlockMediumDataVolume || hasVideoBlockHighDataVolume) {

    if (compressionApplied) {
      throw new Error("Cannot parse video cells with compression")
    } else if (!resolutionBits) {
      throw new Error("Cannot parse video cells with unknown video bit resolution")
    }

    if (resolutionBits !== 8) {
      throw new Error("Resolutions other than 8 bits are not supported")
    }

  }

  if (hasVideoBlockLowDataVolume) {
    videoCells = []
    const rep = view.getUint8(offset)
    offset++
    for (let i = 0; i < rep; i++) {
      switch (resolutionBits) {
        case 8:
          for (let j = 0; j < 4; j++) {
            const value = view.getUint8(offset)
            offset++
            videoCells.push(value / 255.0)
          }
          break;
      }
    }
  }

  if (hasVideoBlockMediumDataVolume) {
    videoCells = []
    const rep = view.getUint8(offset)
    offset++
    for (let i = 0; i < rep; i++) {
      switch (resolutionBits) {
        case 8:
          for (let j = 0; j < 64; j++) {
            const value = view.getUint8(offset)
            offset++
            videoCells.push(value / 255.0)
          }
          break;
      }
    }
  }

  if (hasVideoBlockHighDataVolume) {
    videoCells = []
    const rep = view.getUint8(offset)
    offset++
    for (let i = 0; i < rep; i++) {
      switch (resolutionBits) {
        case 8:
          for (let j = 0; j < 256; j++) {
            const value = view.getUint8(offset)
            offset++
            videoCells.push(value / 255.0)
          }
          break;
      }
    }
  }

  // Rectify video cell length
  if (videoCellsCount) {
    while (videoCells.length > videoCellsCount) {
      videoCells.pop()
    }
  }

  // Apply gain
  for (let i = 0; i < videoCells.length; i++) {
    if (maxGainEnabled) {
      videoCells[i] = videoCells[i] > 0.0 ? 1.0 : 0.0
    } else {
      videoCells[i] *= currentGain
      if (videoCells[i] > 1.0) {
        videoCells[i] = 1.0
      }
    }
  }

  // Time of Day
  let timeOfDay = undefined
  if (hasTimeOfDay) {
    timeOfDay = view.getUint16(offset) << 8 + view.getUint8(offset + 2)
    offset += 3
  }

  // Zero out radar
  drawRadarCell(radarCanvas, begAzimuth, endAzimuth, 0.0, 1.0, 0.0)

  // Calculate cells to draw
  const rangeMeters = radarRanges[currentRadarRange] * 1852

  const cellsToDraw = []
  for (let i = 0; i < videoCells.length; i++) {

    const echoStrength = videoCells[i]

    if (approxEq(echoStrength, 0.0)) continue

    let begDistance = (startRange + i) * cellLength
    if (begDistance > rangeMeters) break
    let endDistance = (startRange + i + 1) * cellLength

    let didLookAhead = false
    let lookahead = 1
    while (i + lookahead < videoCells.length && approxEq(echoStrength, videoCells[i+lookahead])) {
      lookahead++
      didLookAhead = true
    }
    if (didLookAhead) {
      endDistance = (startRange + i + lookahead + 1) * cellLength
      i += lookahead
    }

    const begNormalizedDistance = begDistance / rangeMeters
    const endNormalizedDistance = endDistance / rangeMeters

    cellsToDraw.push({ begAzimuth, endAzimuth, begNormalizedDistance, endNormalizedDistance, echoStrength })
  }

  // Draw radar cells
  for (const cellToDraw of cellsToDraw) {
    drawRadarCell(radarCanvas, cellToDraw.begAzimuth, cellToDraw.endAzimuth, cellToDraw.begNormalizedDistance, cellToDraw.endNormalizedDistance, cellToDraw.echoStrength)
  }
}

document.addEventListener('DOMContentLoaded', _ => {
  // Assign elements
  radarCanvas = document.getElementById('radar-canvas')
  statusLabel = document.getElementById('status')

  // Bind event observers
  document.getElementById('decrease-range').addEventListener('click', () => decreaseRange())
  document.getElementById('increase-range').addEventListener('click', () => increaseRange())
  document.getElementById('decrease-gain').addEventListener('click', () => decreaseGain())
  document.getElementById('increase-gain').addEventListener('click', () => increaseGain())
  document.getElementById('max-gain').addEventListener('click', () => maxGain())
  radarCanvas.addEventListener('canvas-resize', _ => {
    drawRadarBase(radarCanvas)
  })

  // Initial canvas resize
  radarCanvas.width = radarCanvas.clientWidth
  radarCanvas.height = radarCanvas.clientHeight
  radarCanvas.dispatchEvent(new Event('canvas-resize'))

  // Observe resizes
  new ResizeObserver(handleCanvasResize).observe(radarCanvas)

  // Perform initial sync
  syncGainLabel()
  syncRangeLabel()

  // Connect to WebSocket
  let ws = undefined
  function setupWS(wsUrl) {
    setStatus('WS Connecting')
    ws = new WebSocket(wsUrl)
    ws.onopen = _ => {
      setStatus('WS Open')
    }
    ws.onclose = _ => {
      setStatus('WS Closed')
      setTimeout(setupWS, 1000)
    }
    ws.onerror = _ => {
      setStatus('WS Error')
    }
    ws.onmessage = m => {
      onASTERIX(m.data)
    }
  }
  getConfigAndThen(ConfigASTERIXWebSocketUrl, setupWS)
})