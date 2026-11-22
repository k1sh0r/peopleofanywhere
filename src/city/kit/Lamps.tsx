'use client'

import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lampMat, lights } from '../render/materials'

// Lamp light on the ground: a soft warm disc, added on top of the road (no real lights: dozens of
// point lights would cost more than the whole city). Fades in with the night.
export const poolGeo = new THREE.CircleGeometry(4.2, 40)
const poolTex = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()
export const poolMat = new THREE.MeshBasicMaterial({
  color: '#FFD494',
  map: poolTex,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  fog: false,
})
/** Lamps on with the dusk, off with the dawn. */
export function LampsOn() {
  const was = useRef(-1)
  useFrame(() => {
    const on = lights.value
    if (on === was.current) return
    was.current = on
    lampMat().emissiveIntensity = on * 7
    poolMat.opacity = on * 0.32
    poolMat.visible = on > 0
  })
  return null
}
