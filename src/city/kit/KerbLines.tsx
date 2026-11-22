'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { PAL } from '@/config/palette'
import { rbox } from '../render/geometry'

/** Black-and-yellow painted kerbs along a list of straight runs. */
export function KerbLines({ runs }: { runs: [number, number, number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const segs = useMemo(() => {
    const out: { x: number; z: number; rot: number; yellow: boolean }[] = []
    for (const [x0, z0, x1, z1] of runs) {
      const len = Math.hypot(x1 - x0, z1 - z0)
      const n = Math.floor(len)
      const rot = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        out.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, rot, yellow: k % 2 === 0 })
      }
    }
    return out
  }, [runs])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 }), [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const yellow = new THREE.Color(PAL.KERB_YELLOW)
    const black = new THREE.Color(PAL.KERB_BLACK)
    segs.forEach((s, i) => {
      m.makeRotationY(s.rot).setPosition(s.x, 0.12, s.z)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, s.yellow ? yellow : black)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [segs])
  // 0.30 deep around a centre 0.13 from the pavement edge: the road face stands 2 cm proud
  // of the slab's edge instead of sharing its plane (which z-fought along every kerb)
  return <instancedMesh ref={ref} args={[rbox(0.96, 0.24, 0.3), material, segs.length]} castShadow receiveShadow />
}

