import { useMemo } from "react"
import SevenSegmentDigitDisplay, { isSevenSegmentDisplayDigit, SevenSegmentDisplayDigit } from "./SevenSegmentDigitDisplay"

type TextPosition = 'left' | 'middle' | 'right'
interface ISevenSegmentDisplay {
  content: string;
  textPosition?: TextPosition,
  size?: number;
  backgroundColor?: string;
  onColor?: string;
  offColor?: string;
  sizeMultiplier?: number;
}

const countDots = (content: string): number => {
  let count = 0
  for (let i = 0; i < content.length; i++) {
    if (content.charAt(i) === '.') count += 1
  }
  return count
}

const shortenString = (content: string, size: number): string => content.slice(0, size)

const lAlign = (content: string, size: number): string => content.padEnd(size, ' ')
const mAlign = (content: string, size: number): string => {
  // Skip if even
  if (size % 2 === 0) return rAlign(content, size)
  const sizeDelta = size - content.length
  const sideSize = Math.floor(sizeDelta / 2)
  return content.padEnd(content.length + sideSize, ' ').padStart(size, ' ')
}
const rAlign = (content: string, size: number): string => content.padStart(size, ' ')

const align = (content: string, size: number, position: TextPosition): string => {
  const shortenedContent = shortenString(content, size)
  switch (position) {
    case 'left': return lAlign(shortenedContent, size)
    case 'middle': return mAlign(shortenedContent, size)
    case 'right': return rAlign(shortenedContent, size)
  }
}

const convertToSevenDigit = (content: string): SevenSegmentDisplayDigit[] => {
  const result: SevenSegmentDisplayDigit[] = []
  for (let i = 0; i < content.length; i++) {
    const c = content.charAt(i)
    if (isSevenSegmentDisplayDigit(c)) {
      result.push(c as SevenSegmentDisplayDigit)
    } else {
      result.push(' ')
    }
  }
  return result
}

export default function SevenSegmentDisplay({ content, size = content.length, textPosition = 'middle', backgroundColor = '#FFFFFF', onColor = '#FF0000', offColor = '#000000', sizeMultiplier = 1 }: ISevenSegmentDisplay) {
  const dotCount = useMemo(() => countDots(content), [ content ])
  const hasSingleDot = useMemo(() => dotCount === 1, [ dotCount ])
  const singleDotIndex = useMemo(() => {
    if (!hasSingleDot) return -1
    for (let i = 0; i < content.length; i++)
      if (content.charAt(i) === '.') return i
  }, [ hasSingleDot, content ])
  const displayedContent = useMemo(() => {
    if (hasSingleDot) return content.replace('.', '')
    return content
  }, [ hasSingleDot, content ])
  const alignedContent = useMemo(() => align(displayedContent, size, textPosition), [ displayedContent, size, textPosition ])
  const digits = useMemo(() => convertToSevenDigit(alignedContent), [ alignedContent ])
  return (
    <div style={{
      backgroundColor: backgroundColor,
      padding: '5px',
      borderRadius: '3px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {digits.map((d, i) => (
        <SevenSegmentDigitDisplay key={i} char={d} hasDot={hasSingleDot && i === singleDotIndex} onColor={onColor} offColor={offColor} backgroundColor={backgroundColor} sizeMultiplier={sizeMultiplier}/>
      ))}
    </div>
  )
}