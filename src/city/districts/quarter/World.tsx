'use client'

import { QUARTER_FILLERS } from './layout'
import { QUARTER_PORTAL } from './index'
import { Portal } from '../../portal/Portal'
import { Apartment } from './Apartment'
import { Background } from '../../kit/Background'
import { Building } from '../../kit/Building'
import { BusStop } from './BusStop'
import { Cafe } from './Cafe'
import { Mess } from './Mess'
import { Ground, Kerbs } from './Ground'
import { Park } from './Park'
import { StreetLife } from './StreetLife'
import { ShopRow } from './ShopRow'
import { StartupHouse } from './StartupHouse'
import { StaticMerge } from '../../kit/StaticMerge'
import { StreetPoles } from './StreetPoles'
import { StreetTrees } from './StreetTrees'

export function World() {
  return (
    <>
      <StaticMerge>
        <Ground />
        <Mess />
        <ShopRow />
        <Apartment />
        <StartupHouse />
        <Park />
        <BusStop />
        <Cafe />
        {QUARTER_FILLERS.map((b) => (
          <Building key={b.seed} {...b} />
        ))}
        <StreetPoles />
        <StreetTrees />
        <StreetLife />
        <Background />
      </StaticMerge>
      <Kerbs />
      <Portal pose={QUARTER_PORTAL} />
    </>
  )
}
