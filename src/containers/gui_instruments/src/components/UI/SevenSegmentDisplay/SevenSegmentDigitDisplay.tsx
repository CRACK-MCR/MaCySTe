import { useMemo } from "react"

export type SevenSegmentDisplayDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '-' | ' ' | 'E' | '.'
interface ISevenSegmentDigitDisplay {
  char: SevenSegmentDisplayDigit;
  hasDot: boolean;
  backgroundColor: string;
  onColor: string;
  offColor: string;
  sizeMultiplier: number;
}

const digitMap: Map<SevenSegmentDisplayDigit, boolean[]> = new Map([
  ['0', [ true, true, true, true, true, true, false ]],
  ['1', [ false, true, true, false, false, false, false ]],
  ['2', [ true, true, false, true, true, false, true ]],
  ['3', [ true, true, true, true, false, false, true ]],
  ['4', [ false, true, true, false, false, true, true ]],
  ['5', [ true, false, true, true, false, true, true ]],
  ['6', [ true, false, true, true, true, true, true ]],
  ['7', [ true, true, true, false, false, false, false ]],
  ['8', [ true, true, true, true, true, true, true ]],
  ['9', [ true, true, true, true, false, true, true ]],
  ['-', [ false, false, false, false, false, false, true ]],
  [' ', [ false, false, false, false, false, false, false ]],
  ['.', [ false, false, false, false, false, false, false ]],
  ['E', [ true, false, false, true, true, true, true ]],
])
export const isSevenSegmentDisplayDigit = (s: string): s is SevenSegmentDisplayDigit => digitMap.has(s as SevenSegmentDisplayDigit)

export default function SevenSegmentDigitDisplay({ char, hasDot, backgroundColor, onColor, offColor, sizeMultiplier }: ISevenSegmentDigitDisplay) {
  const digit: boolean[] = useMemo(() => digitMap.get(char)!, [ char ])
  const width = useMemo(() => Math.round(12 * sizeMultiplier), [ sizeMultiplier ])
  const height = useMemo(() => Math.round(19 * sizeMultiplier), [ sizeMultiplier ])
  return (
    <svg width={width} height={height} viewBox="0 0 12 19">
      <g style={{
        fillRule: 'evenodd',
        stroke: backgroundColor,
        strokeWidth: 0.25,
        strokeOpacity: 1,
        strokeLinecap: 'butt',
        strokeLinejoin: 'miter'
      }}>
        <polygon points="1, 1  2, 0  8, 0  9, 1  8, 2  2, 2" fill={digit[0] ? onColor : offColor} />
        <polygon points="9, 1 10, 2 10, 8  9, 9  8, 8  8, 2" fill={digit[1] ? onColor : offColor}/>
        <polygon points="9, 9 10,10 10,16  9,17  8,16  8,10" fill={digit[2] ? onColor : offColor}/>
        <polygon points="9,17  8,18  2,18  1,17  2,16  8,16" fill={digit[3] ? onColor : offColor}/>
        <polygon points="1,17  0,16  0,10  1, 9  2,10  2,16" fill={digit[4] ? onColor : offColor}/>
        <polygon points="1, 9  0, 8  0, 2  1, 1  2, 2  2, 8" fill={digit[5] ? onColor : offColor}/>
        <polygon points="1, 9  2, 8  8, 8  9, 9  8,10  2,10" fill={digit[6] ? onColor : offColor}/>
        <circle cx="11" cy="18" r="1" fill={hasDot ? onColor : offColor} />
      </g>
    </svg>
  )
}