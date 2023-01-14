import { useMemo } from "react"

import { DuoToneBarDoublePercentage } from "./DuoToneBar"
import DuoToneBarForSinglePercentage from "./ForSinglePercentage"

const DuoToneBarForDoublePercentage = ({ percentage, labels }: { percentage: DuoToneBarDoublePercentage, labels: string[] }) => {
  const singlePercentage = useMemo(() => percentage.leftPercentage * -1 + percentage.rightPercentage, [ percentage ])
  return (
    <DuoToneBarForSinglePercentage percentage={singlePercentage} labels={labels}/>
  )
}

export default DuoToneBarForDoublePercentage