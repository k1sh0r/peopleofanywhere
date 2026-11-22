import { describe, expect, it } from 'vitest'
import {
  WireOp,
  decodeClientMessage,
  decodeServerMessage,
  encodeClientHello,
  encodeClientPose,
  encodeServerCorrect,
  encodeServerCount,
  encodeServerJoin,
  encodeServerLeave,
  encodeServerSnap,
  encodeServerWelcome,
  quantizeMeters,
  quantizeYaw,
} from './protocol'
import { formatRoomId, parseRoomId } from './config'

const uid = '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0'

describe('game → room', () => {
  it('round-trips a position (cm, 1/256 turn)', () => {
    const m = decodeClientMessage(encodeClientPose({ x: 12.345, z: -45.99, yaw: Math.PI / 2, anim: 2 }))
    expect(m).toMatchObject({ op: WireOp.Pos, x: 12.35, z: -45.99, anim: 2 })
    if (m?.op !== WireOp.Pos) throw new Error()
    expect(m.yaw).toBeCloseTo(Math.PI / 2, 1)
  })

  it('round-trips the login token', () => {
    expect(decodeClientMessage(encodeClientHello('eyJ.abc.def'))).toEqual({ op: WireOp.Hello, token: 'eyJ.abc.def' })
  })

  it('rejects junk', () => {
    expect(decodeClientMessage(new ArrayBuffer(0))).toBeNull()
    expect(decodeClientMessage(new Uint8Array([WireOp.Pos, 1, 2]).buffer)).toBeNull()
    expect(decodeClientMessage(new Uint8Array([0x7f]).buffer)).toBeNull()
  })
})

describe('room → game', () => {
  it('round-trips welcome, join, leave, count, correct', () => {
    expect(decodeServerMessage(encodeServerWelcome(7, true, 70001))).toEqual({
      op: WireOp.Welcome,
      slot: 7,
      member: true,
      tick: 70001 & 0xffff,
      tookOver: false,
    })
    expect(decodeServerMessage(encodeServerWelcome(2, true, 5, true))).toMatchObject({ member: true, tookOver: true })
    expect(decodeServerMessage(encodeServerJoin([{ slot: 3, uid }]))).toEqual({ op: WireOp.Join, people: [{ slot: 3, uid }] })
    expect(decodeServerMessage(encodeServerLeave([3, 9]))).toEqual({ op: WireOp.Leave, slots: [3, 9] })
    expect(decodeServerMessage(encodeServerCount(42))).toEqual({ op: WireOp.Count, members: 42 })
    expect(decodeServerMessage(encodeServerCorrect(1.5, -2))).toEqual({ op: WireOp.Correct, x: 1.5, z: -2 })
  })

  it('round-trips a snapshot, including someone leaving the radius', () => {
    const m = decodeServerMessage(
      encodeServerSnap(12, [
        { slot: 1, qx: quantizeMeters(3.21), qz: quantizeMeters(-4), qyaw: quantizeYaw(0), anim: 1, gone: false },
        { slot: 2, qx: 0, qz: 0, qyaw: 0, anim: 0, gone: true },
      ]),
    )
    expect(m).toMatchObject({
      op: WireOp.Snap,
      tick: 12,
      entries: [
        { slot: 1, x: 3.21, z: -4, anim: 1, gone: false },
        { slot: 2, gone: true },
      ],
    })
  })

  it('rejects a truncated snapshot', () => {
    const buf = encodeServerSnap(1, [{ slot: 1, qx: 0, qz: 0, qyaw: 0, anim: 0, gone: false }])
    expect(decodeServerMessage(buf.slice(0, buf.byteLength - 1))).toBeNull()
  })

  it('keeps facing in 0–255 for any angle', () => {
    for (const a of [-10, -Math.PI, 0, 0.001, Math.PI * 2, 50]) {
      const q = quantizeYaw(a)
      expect(q).toBeGreaterThanOrEqual(0)
      expect(q).toBeLessThan(256)
    }
  })
})

describe('room names', () => {
  it('round-trips and refuses unknown districts', () => {
    expect(parseRoomId(formatRoomId('makers', 2))).toEqual({ district: 'makers', shard: 2 })
    expect(parseRoomId('business#1')).toBeNull()
    expect(parseRoomId('quarter#0')).toBeNull()
    expect(parseRoomId('quarter')).toBeNull()
  })
})