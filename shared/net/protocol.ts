// LIVE CITY wire format (CLAUDE.md Phase 8A). Binary, little-endian; byte 0 is the message type.
// Positions are centimetres in an i16 (±327 m, the district is ±46 m), facing is a u8 turn (256 steps).

export const WireOp = {
  // game → room
  Hello: 0x01,
  Pos: 0x02,
  // room → game
  Welcome: 0x10,
  Join: 0x11,
  Leave: 0x12,
  Snap: 0x13,
  Count: 0x14,
  Correct: 0x15,
} as const

export type MemberAnim = 0 | 1 | 2 // idle · walk · run
export const MEMBER_ANIMS = ['idle', 'walk', 'run'] as const
/** flags bit 2 on a snapshot entry: they just left your radius (hold their last pose). */
export const SNAP_FLAG_GONE = 0b100

export type MemberPose = { x: number; z: number; yaw: number; anim: MemberAnim }
export type SnapEntry = MemberPose & { slot: number; gone: boolean }

export type ServerMessage =
  | { op: typeof WireOp.Welcome; slot: number; member: boolean; tick: number; tookOver: boolean }
  | { op: typeof WireOp.Join; people: { slot: number; uid: string }[] }
  | { op: typeof WireOp.Leave; slots: number[] }
  | { op: typeof WireOp.Snap; tick: number; entries: SnapEntry[] }
  | { op: typeof WireOp.Count; members: number }
  | { op: typeof WireOp.Correct; x: number; z: number }

export type ClientMessage = { op: typeof WireOp.Hello; token: string } | ({ op: typeof WireOp.Pos } & MemberPose)

// ---- quantization ----

const TAU = Math.PI * 2
export const quantizeMeters = (m: number) => Math.max(-32768, Math.min(32767, Math.round(m * 100)))
export const dequantizeMeters = (q: number) => q / 100
export const quantizeYaw = (rad: number) => ((Math.round((rad / TAU) * 256) % 256) + 256) % 256
export const dequantizeYaw = (q: number) => (q / 256) * TAU
const flagsOf = (anim: MemberAnim, gone = false) => (anim & 0b11) | (gone ? SNAP_FLAG_GONE : 0)
const animOf = (flags: number) => Math.min(2, flags & 0b11) as MemberAnim

// ---- uuid <-> 16 bytes ----

function writeUuid(v: DataView, at: number, uid: string) {
  const hex = uid.replace(/-/g, '')
  for (let i = 0; i < 16; i++) v.setUint8(at + i, parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0)
}
function readUuid(v: DataView, at: number) {
  let h = ''
  for (let i = 0; i < 16; i++) h += v.getUint8(at + i).toString(16).padStart(2, '0')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// ---- game → room ----

const enc = new TextEncoder()
const dec = new TextDecoder()

export function encodeClientHello(token: string): ArrayBuffer {
  const t = enc.encode(token)
  const out = new Uint8Array(1 + t.length)
  out[0] = WireOp.Hello
  out.set(t, 1)
  return out.buffer
}

export function encodeClientPose(p: MemberPose): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(7))
  v.setUint8(0, WireOp.Pos)
  v.setInt16(1, quantizeMeters(p.x), true)
  v.setInt16(3, quantizeMeters(p.z), true)
  v.setUint8(5, quantizeYaw(p.yaw))
  v.setUint8(6, flagsOf(p.anim))
  return v.buffer
}

/** null = malformed. */
export function decodeClientMessage(buf: ArrayBuffer): ClientMessage | null {
  if (buf.byteLength < 1) return null
  const v = new DataView(buf)
  switch (v.getUint8(0)) {
    case WireOp.Hello:
      return { op: WireOp.Hello, token: dec.decode(new Uint8Array(buf, 1)) }
    case WireOp.Pos:
      if (buf.byteLength !== 7) return null
      return {
        op: WireOp.Pos,
        x: dequantizeMeters(v.getInt16(1, true)),
        z: dequantizeMeters(v.getInt16(3, true)),
        yaw: dequantizeYaw(v.getUint8(5)),
        anim: animOf(v.getUint8(6)),
      }
    default:
      return null
  }
}

// ---- room → game ----

/** tookOver: this connection replaced the same person's other tab or device. */
export function encodeServerWelcome(slot: number, member: boolean, tick: number, tookOver = false): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(6))
  v.setUint8(0, WireOp.Welcome)
  v.setUint16(1, slot, true)
  v.setUint8(3, (member ? 1 : 0) | (tookOver ? 2 : 0))
  v.setUint16(4, tick & 0xffff, true)
  return v.buffer
}

export function encodeServerJoin(people: { slot: number; uid: string }[]): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(3 + people.length * 18))
  v.setUint8(0, WireOp.Join)
  v.setUint16(1, people.length, true)
  people.forEach((p, i) => {
    v.setUint16(3 + i * 18, p.slot, true)
    writeUuid(v, 5 + i * 18, p.uid)
  })
  return v.buffer
}

export function encodeServerLeave(slots: number[]): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(3 + slots.length * 2))
  v.setUint8(0, WireOp.Leave)
  v.setUint16(1, slots.length, true)
  slots.forEach((s, i) => v.setUint16(3 + i * 2, s, true))
  return v.buffer
}

/** Entries are already quantized (the room keeps poses quantized): x/z in cm, yaw 0–255. */
export type QuantizedSnapEntry = { slot: number; qx: number; qz: number; qyaw: number; anim: MemberAnim; gone: boolean }

export function encodeServerSnap(tick: number, entries: QuantizedSnapEntry[]): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(5 + entries.length * 8))
  v.setUint8(0, WireOp.Snap)
  v.setUint16(1, tick & 0xffff, true)
  v.setUint16(3, entries.length, true)
  entries.forEach((e, i) => {
    const o = 5 + i * 8
    v.setUint16(o, e.slot, true)
    v.setInt16(o + 2, e.qx, true)
    v.setInt16(o + 4, e.qz, true)
    v.setUint8(o + 6, e.qyaw)
    v.setUint8(o + 7, flagsOf(e.anim, e.gone))
  })
  return v.buffer
}

export function encodeServerCount(members: number): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(3))
  v.setUint8(0, WireOp.Count)
  v.setUint16(1, members, true)
  return v.buffer
}

export function encodeServerCorrect(x: number, z: number): ArrayBuffer {
  const v = new DataView(new ArrayBuffer(5))
  v.setUint8(0, WireOp.Correct)
  v.setInt16(1, quantizeMeters(x), true)
  v.setInt16(3, quantizeMeters(z), true)
  return v.buffer
}

/** null = malformed or unknown. */
export function decodeServerMessage(buf: ArrayBuffer): ServerMessage | null {
  if (buf.byteLength < 1) return null
  const v = new DataView(buf)
  const len = buf.byteLength
  switch (v.getUint8(0)) {
    case WireOp.Welcome:
      if (len !== 6) return null
      return {
        op: WireOp.Welcome,
        slot: v.getUint16(1, true),
        member: (v.getUint8(3) & 1) === 1,
        tick: v.getUint16(4, true),
        tookOver: (v.getUint8(3) & 2) === 2,
      }
    case WireOp.Join: {
      if (len < 3) return null
      const n = v.getUint16(1, true)
      if (len !== 3 + n * 18) return null
      const people = []
      for (let i = 0; i < n; i++) people.push({ slot: v.getUint16(3 + i * 18, true), uid: readUuid(v, 5 + i * 18) })
      return { op: WireOp.Join, people }
    }
    case WireOp.Leave: {
      if (len < 3) return null
      const n = v.getUint16(1, true)
      if (len !== 3 + n * 2) return null
      const slots = []
      for (let i = 0; i < n; i++) slots.push(v.getUint16(3 + i * 2, true))
      return { op: WireOp.Leave, slots }
    }
    case WireOp.Snap: {
      if (len < 5) return null
      const n = v.getUint16(3, true)
      if (len !== 5 + n * 8) return null
      const entries: SnapEntry[] = []
      for (let i = 0; i < n; i++) {
        const o = 5 + i * 8
        const flags = v.getUint8(o + 7)
        entries.push({
          slot: v.getUint16(o, true),
          x: dequantizeMeters(v.getInt16(o + 2, true)),
          z: dequantizeMeters(v.getInt16(o + 4, true)),
          yaw: dequantizeYaw(v.getUint8(o + 6)),
          anim: animOf(flags),
          gone: (flags & SNAP_FLAG_GONE) !== 0,
        })
      }
      return { op: WireOp.Snap, tick: v.getUint16(1, true), entries }
    }
    case WireOp.Count:
      if (len !== 3) return null
      return { op: WireOp.Count, members: v.getUint16(1, true) }
    case WireOp.Correct:
      if (len !== 5) return null
      return { op: WireOp.Correct, x: dequantizeMeters(v.getInt16(1, true)), z: dequantizeMeters(v.getInt16(3, true)) }
    default:
      return null
  }
}