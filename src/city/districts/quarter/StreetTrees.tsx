'use client'

import { QUARTER_TREES } from './layout'
import { BASE } from '../units'
import { RainTree, Gulmohar } from '../../kit/Trees'

export function StreetTrees() {
  return (
    <>
      {QUARTER_TREES.map((t) =>
        t.kind === 'rain' ? (
          <RainTree key={t.seed} p={[t.x, BASE, t.z]} s={t.s} seed={t.seed} />
        ) : (
          <Gulmohar key={t.seed} p={[t.x, BASE, t.z]} s={t.s} seed={t.seed} />
        ),
      )}
    </>
  )
}
