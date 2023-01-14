import DuoToneBarForDoublePercentage from "./ForDoublePercentage"
import DuoToneBarForSinglePercentage from "./ForSinglePercentage"

export type DuoToneBarSinglePercentage = number
export type DuoToneBarDoublePercentage = {
  leftPercentage: number,
  rightPercentage: number,
}
type DuoTonePercentage = DuoToneBarSinglePercentage | DuoToneBarDoublePercentage

interface IDuoToneBar {
  percentage: DuoTonePercentage
  labels?: string[]
}

function isSinglePercentage(percentage: DuoTonePercentage): percentage is DuoToneBarSinglePercentage {
  return typeof percentage === 'number'
}

const DuoToneBar = ({ percentage, labels = [] }: IDuoToneBar) => {
  if (isSinglePercentage(percentage)) {
    return (
      <DuoToneBarForSinglePercentage percentage={percentage} labels={labels} />
    )
  } else {
    return (
      <DuoToneBarForDoublePercentage  percentage={percentage} labels={labels} />
    )
  }
}

export default DuoToneBar