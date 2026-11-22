'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PAL } from '@/config/palette'
import { lights } from '../../render/materials'
import { KITES, LIGHTHOUSE, SAND_Y, SHORE, WASH } from './layout'

// The Bay of Bengal, painted: a muted blue-green sea (never cyan, design.md §3.2) that deepens
// toward the horizon, sun glints from rippled normals, and a surf line that washes up and back
// every ~7 s with lacy foam. Lit like everything else (MeshStandardMaterial), so day/night and
// fog apply for free. Nothing here glows.

/** One wash cycle, in radians per second (≈ 7 s). Ambience uses the same rhythm (ambience.ts). */
export const SURF_RATE = 0.9

function seaMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: PAL.SEA_DEEP, roughness: 0.24, metalness: 0 })
  const uniforms = {
    uTime: { value: 0 },
    uShore: { value: SHORE },
    uWash: { value: WASH },
    uShallow: { value: new THREE.Color(PAL.SEA_SHALLOW) },
    uDeep: { value: new THREE.Color(PAL.SEA_DEEP) },
    uFoam: { value: new THREE.Color(PAL.FOAM) },
    uWet: { value: new THREE.Color(PAL.SAND_WET) },
  }
  m.userData.uniforms = uniforms
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSeaPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSeaPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vSeaPos;
        uniform float uTime; uniform float uShore; uniform float uWash;
        uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uFoam; uniform vec3 uWet;
        float sHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float sNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(sHash(i), sHash(i + vec2(1, 0)), f.x), mix(sHash(i + vec2(0, 1)), sHash(i + vec2(1, 1)), f.x), f.y);
        }
        float ripples(vec2 q, float t) {
          return sNoise(q * 0.35 + vec2(t * 0.12, t * 0.2)) * 0.6 + sNoise(q * 0.9 - vec2(t * 0.25, -t * 0.1)) * 0.4;
        }
        // where the water reaches right now: the wash cycle plus a slow wobble along the beach
        float waterEdge(vec2 q, float t) {
          return uShore + uWash * sin(t * ${SURF_RATE.toFixed(2)}) + 0.7 * sin(q.x * 0.11 + t * 0.35) + (sNoise(vec2(q.x * 0.35, t * 0.2)) - 0.5) * 0.8;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        float dist = waterEdge(vSeaPos.xz, uTime) - vSeaPos.z; // > 0 in the water (the sea is −Z)
        if (dist < 0.0) discard;
        vec3 sea = mix(uShallow, uDeep, smoothstep(2.0, 70.0, dist));
        // the thin sheet running up the sand shows the wet sand through it
        sea = mix(mix(uWet, uShallow, 0.45), sea, smoothstep(0.0, 4.0, dist));
        float lace = sNoise(vSeaPos.xz * 1.4 + vec2(0.0, uTime * 0.6));
        // foam: a frothy fringe at the edge…
        float foam = 1.0 - smoothstep(0.1, 0.7 + lace * 0.6, dist);
        // …and breakers rolling in toward it, fading as they reach deeper water
        float roll = fract((dist + uTime * 1.6) / 8.0);
        float breaker = smoothstep(0.1, 0.0, abs(roll - 0.06)) * (1.0 - smoothstep(3.0, 20.0, dist)) * smoothstep(1.2, 3.0, dist);
        foam = max(foam, breaker * smoothstep(0.35, 0.75, lace));
        diffuseColor.rgb = mix(sea, uFoam, clamp(foam, 0.0, 1.0) * 0.92);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        {
          // rippled normals catch the sun; calmer with distance so the horizon doesn't shimmer
          vec2 q = vSeaPos.xz;
          float e = 0.25;
          float h0 = ripples(q, uTime);
          vec2 g = vec2(ripples(q + vec2(e, 0.0), uTime) - h0, ripples(q + vec2(0.0, e), uTime) - h0) / e;
          float amp = 0.55 * (1.0 - smoothstep(25.0, 160.0, length(vSeaPos - cameraPosition)));
          normal = normalize(normal + (viewMatrix * vec4(-g.x * amp, 0.0, -g.y * amp, 0.0)).xyz);
        }`,
      )
  }
  m.customProgramCacheKey = () => 'shore-sea'
  return m
}

/** Darker sand where the waves keep reaching: a soft band under the surf line. */
function wetSandMaterial() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.75)')
  grad.addColorStop(1, 'rgba(255,255,255,0.85)')
  g.fillStyle = grad
  g.fillRect(0, 0, 4, 128)
  const t = new THREE.CanvasTexture(c)
  return new THREE.MeshStandardMaterial({ color: PAL.SAND_WET, alphaMap: t, transparent: true, depthWrite: false, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 })
}

export function Sea() {
  const sea = useMemo(seaMaterial, [])
  const wet = useMemo(wetSandMaterial, [])
  useFrame((s) => {
    sea.userData.uniforms.uTime.value = s.clock.elapsedTime
  })
  const near = SHORE + WASH + 2 // the sea plane's landward edge (the shader cuts the real edge)
  const FAR = 900
  const wetFrom = SHORE - 2
  const wetTo = SHORE + WASH + 1.4
  return (
    <>
      <mesh material={sea} position={[0, SAND_Y + 0.025, (near - FAR) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ noMerge: true }}>
        <planeGeometry args={[FAR * 2, near + FAR]} />
      </mesh>
      <mesh material={wet} position={[0, SAND_Y + 0.01, (wetFrom + wetTo) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ noMerge: true }}>
        <planeGeometry args={[240, wetTo - wetFrom]} />
      </mesh>
    </>
  )
}

/** At night the lantern sweeps two soft beams over the bay. Off by day (nothing glows without a reason). */
export function LighthouseBeam() {
  const group = useRef<THREE.Group>(null!)
  const beam = useMemo(() => {
    const g = new THREE.ConeGeometry(4.5, 70, 24, 1, true)
    g.translate(0, -35, 0) // apex at the lamp
    g.rotateZ(Math.PI / 2) // point along +X
    // fades out along its length (uv.v = 1 at the lamp), so it reads as light in the haze, not a solid
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 128
    const g2 = c.getContext('2d')!
    const grad = g2.createLinearGradient(0, 0, 0, 128)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.35, '#555555')
    grad.addColorStop(1, '#000000')
    g2.fillStyle = grad
    g2.fillRect(0, 0, 4, 128)
    const m = new THREE.MeshBasicMaterial({ color: '#FFE2A8', alphaMap: new THREE.CanvasTexture(c), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    return { g, m }
  }, [])
  useFrame((s) => {
    const on = lights.value
    beam.m.opacity = on * 0.05
    group.current.visible = on > 0.02
    group.current.rotation.y = s.clock.elapsedTime * 0.45
  })
  return (
    <group ref={group} position={[LIGHTHOUSE.x, SAND_Y + 0.9 + LIGHTHOUSE.h + 1.8, LIGHTHOUSE.z]}>
      <mesh geometry={beam.g} material={beam.m} rotation={[0, 0, -0.04]} />
      <mesh geometry={beam.g} material={beam.m} rotation={[0, Math.PI, -0.04]} />
    </group>
  )
}

// --- kites over the sand, flown from the kite seller's stake ---------------------------------

const KITE_SET = [
  { c: PAL.FLAME, tail: PAL.KERB_YELLOW, off: [-4, 17, 9], s: 1.1 },
  { c: PAL.BUS_BLUE, tail: PAL.WALL_WHITE, off: [3, 21, 13], s: 0.95 },
  { c: PAL.KERB_YELLOW, tail: PAL.FLAME, off: [8, 14, 7], s: 0.85 },
] as const

export function Kites() {
  const anchor = useMemo(() => new THREE.Vector3(KITES.x + 0.6, SAND_Y + 1.3, KITES.z + 0.6), [])
  const kites = useRef<(THREE.Group | null)[]>([])
  const tails = useRef<(THREE.Group | null)[]>([])
  const strings = useMemo(
    () =>
      KITE_SET.map(() => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3))
        return new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#3A3D46' }))
      }),
    [],
  )
  const p = useMemo(() => new THREE.Vector3(), [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    KITE_SET.forEach((k, i) => {
      const kg = kites.current[i]
      if (!kg) return
      // the sea breeze blows inland (+Z): kites ride downwind of the stake, swaying and bobbing
      p.set(anchor.x + k.off[0] + Math.sin(t * 0.5 + i * 2) * 1.6, anchor.y + k.off[1] + Math.sin(t * 0.9 + i) * 0.7, anchor.z + k.off[2] + Math.sin(t * 0.33 + i) * 0.8)
      kg.position.copy(p)
      kg.rotation.set(-0.55, Math.sin(t * 0.5 + i * 2) * 0.25, Math.sin(t * 0.8 + i) * 0.35)
      const tg = tails.current[i]
      if (tg) tg.children.forEach((b, j) => (b.position.x = Math.sin(t * 3 - j * 0.8 + i) * 0.12 * j))
      // the string sags a little between stake and kite
      const pos = strings[i].geometry.getAttribute('position') as THREE.BufferAttribute
      for (let j = 0; j < 16; j++) {
        const f = j / 15
        pos.setXYZ(j, anchor.x + (p.x - anchor.x) * f, anchor.y + (p.y - anchor.y) * f - Math.sin(f * Math.PI) * 1.4, anchor.z + (p.z - anchor.z) * f)
      }
      pos.needsUpdate = true
      strings[i].geometry.computeBoundingSphere()
    })
  })
  return (
    <>
      {KITE_SET.map((k, i) => (
        <group key={i}>
          <primitive object={strings[i]} />
          <group ref={(g) => void (kites.current[i] = g)} scale={k.s}>
            {/* a diamond kite with its cross sticks */}
            <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
              <boxGeometry args={[0.95, 0.95, 0.03]} />
              <meshStandardMaterial color={k.c} roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[0.04, 1.36, 0.03]} />
              <meshStandardMaterial color={PAL.WOOD} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.12, 0.03]}>
              <boxGeometry args={[1.2, 0.04, 0.03]} />
              <meshStandardMaterial color={PAL.WOOD} roughness={0.8} />
            </mesh>
            <group ref={(g) => void (tails.current[i] = g)} position={[0, -0.7, 0]}>
              {[0, 1, 2, 3, 4].map((j) => (
                <mesh key={j} position={[0, -j * 0.36, 0]}>
                  <boxGeometry args={[0.26, 0.12, 0.02]} />
                  <meshStandardMaterial color={j % 2 ? k.c : k.tail} roughness={0.7} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      ))}
    </>
  )
}
