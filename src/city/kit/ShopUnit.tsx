'use client'

import type { ReactElement } from 'react'
import { PAL } from '@/config/palette'
import { BASE, FH, type ShopSpec } from '../districts/units'
import { rng } from '../render/textures'
import { Balcony, Box, Parapet, Shutter, Sign, Tank, Win } from './primitives'

const G = 3.6
const W = 6
const D = 8

/** One shophouse on Beacon Road: open shop below, home above. Local +Z faces the road. */
export function ShopUnit({ x, floors, wall, sign, shutter, goods, balcony, seed, z }: ShopSpec & { z: number }) {
  const H = G + (floors - 1) * FH
  const r = rng(seed)
  const front = D / 2
  const shelves: ReactElement[] = []
  let k = 0
  for (const sy of [0.95, 1.65, 2.35]) {
    shelves.push(<Box key={k++} s={[W - 1.6, 0.06, 0.5]} p={[0, sy, 1.27]} c={PAL.WOOD} rough={0.7} grade={false} />)
    let px = -W / 2 + 1.0
    while (px < W / 2 - 1.1) {
      const bw = 0.25 + r() * 0.3
      const bh = 0.2 + r() * 0.3
      shelves.push(
        <Box
          key={k++}
          s={[bw, bh, 0.32]}
          p={[px + bw / 2, sy + 0.03 + bh / 2, 1.3]}
          c={goods[Math.floor(r() * goods.length)]}
          rough={0.6}
          grade={false}
          shadow={false}
        />,
      )
      px += bw + 0.06
    }
  }

  return (
    <group position={[x, BASE, z]}>
      {/* ground: back block, piers, lintel, floor */}
      <Box s={[W, G, 5]} p={[0, G / 2, -1.5]} c={wall} />
      <Box s={[0.6, G, 3]} p={[-W / 2 + 0.3, G / 2, 2.5]} c={wall} />
      <Box s={[0.6, G, 3]} p={[W / 2 - 0.3, G / 2, 2.5]} c={wall} />
      <Box s={[W, 0.8, 3]} p={[0, G - 0.4, 2.5]} c={wall} />
      <Box s={[W - 1.2, 0.05, 3]} p={[0, 0.025, 2.5]} c={PAL.STONE} grade={false} shadow={false} />
      <Box s={[W - 1.2, 2.8, 0.1]} p={[0, 1.4, 1.05]} c={PAL.INTERIOR} rough={0.95} grade={false} />
      {shelves}
      {/* counter */}
      <Box s={[W - 2, 0.95, 0.6]} p={[0, 0.475, 3.3]} c={PAL.WOOD} rough={0.7} />
      <Box s={[W - 1.9, 0.06, 0.7]} p={[0, 0.98, 3.3]} c={PAL.WALL_WHITE} rough={0.4} grade={false} />
      {/* shutter */}
      <Box s={[W - 1.24, 0.26, 0.32]} p={[0, 2.68, front - 0.17]} c="#8E98A3" metal={0.3} rough={0.5} grade={false} />
      {shutter === 'half' && <Shutter p={[0, 2.1, front - 0.05]} w={W - 1.2} h={1.0} />}
      {shutter === 'closed' && <Shutter p={[0, 1.27, front - 0.05]} w={W - 1.2} h={2.54} />}

      {/* upper floors */}
      <Box s={[W, H - G, D]} p={[0, G + (H - G) / 2, 0]} c={wall} />
      <Box s={[W + 0.2, 0.22, D + 0.2]} p={[0, G, 0]} c={PAL.WALL_WHITE} />
      {Array.from({ length: floors - 1 }, (_, f) => {
        const base = G + f * FH
        const bal = balcony && f === 0
        return (
          <group key={f}>
            {bal ? (
              <Balcony p={[-1.3, base, front]} w={2.6} wall={PAL.WALL_WHITE} plant curtain={PAL.TERRACOTTA} />
            ) : (
              <Win p={[-1.4, base + 1.65, front]} w={1.2} grille curtain={r() < 0.6 ? PAL.WALL_BUTTER : null} />
            )}
            <Win p={[1.5, base + 1.65, front]} w={1.2} curtain={r() < 0.5 ? PAL.WALL_POWDER : null} />
            {f > 0 && <Box s={[W + 0.2, 0.22, D + 0.2]} p={[0, base, 0]} c={PAL.WALL_WHITE} />}
          </group>
        )
      })}
      <Parapet w={W} d={D} wall={wall} y={H} />
      {floors > 2 && <Tank p={[1.4, H, -2]} />}

      <Sign p={[0, 3.2, front + 0.2]} w={W - 0.5} h={1.15} spec={sign} />
    </group>
  )
}
