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

const uid = '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0'

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Fixed wire bytes — must not change across renames; legacy and new stacks talk during cutover. */
describe('wire golden bytes', () => {
  it('game → room', () => {
    const hello = encodeClientHello('eyJ.test.token')
    expect(hex(hello)).toBe('0165794a2e746573742e746f6b656e')
    expect(decodeClientMessage(hello)).toEqual({ op: WireOp.Hello, token: 'eyJ.test.token' })

    const pos = encodeClientPose({ x: 12.345, z: -45.99, yaw: Math.PI / 2, anim: 2 })
    expect(hex(pos)).toBe('02d30409ee4002')
    expect(decodeClientMessage(pos)).toMatchObject({ op: WireOp.Pos, x: 12.35, z: -45.99, anim: 2 })
  })

  it('room → game', () => {
    const welcome = encodeServerWelcome(7, true, 70001)
    expect(hex(welcome)).toBe('100700017111')
    expect(decodeServerMessage(welcome)).toEqual({
      op: WireOp.Welcome,
      slot: 7,
      member: true,
      tick: 70001 & 0xffff,
      tookOver: false,
    })

    const welcomeOver = encodeServerWelcome(2, true, 5, true)
    expect(hex(welcomeOver)).toBe('100200030500')
    expect(decodeServerMessage(welcomeOver)).toMatchObject({ member: true, tookOver: true })

    const join = encodeServerJoin([{ slot: 3, uid }])
    expect(hex(join)).toBe('11010003000b1c2d3e4f5061728394a5b6c7d8e9f0')
    expect(decodeServerMessage(join)).toEqual({ op: WireOp.Join, people: [{ slot: 3, uid }] })

    const leave = encodeServerLeave([3, 9])
    expect(hex(leave)).toBe('12020003000900')
    expect(decodeServerMessage(leave)).toEqual({ op: WireOp.Leave, slots: [3, 9] })

    const snap = encodeServerSnap(12, [
      { slot: 1, qx: quantizeMeters(3.21), qz: quantizeMeters(-4), qyaw: quantizeYaw(0), anim: 1, gone: false },
      { slot: 2, qx: 0, qz: 0, qyaw: 0, anim: 0, gone: true },
    ])
    expect(hex(snap)).toBe('130c0002000100410170fe00010200000000000004')
    expect(decodeServerMessage(snap)).toMatchObject({
      op: WireOp.Snap,
      tick: 12,
      entries: [
        { slot: 1, x: 3.21, z: -4, anim: 1, gone: false },
        { slot: 2, gone: true },
      ],
    })

    const count = encodeServerCount(42)
    expect(hex(count)).toBe('142a00')
    expect(decodeServerMessage(count)).toEqual({ op: WireOp.Count, members: 42 })

    const correct = encodeServerCorrect(1.5, -2)
    expect(hex(correct)).toBe('15960038ff')
    expect(decodeServerMessage(correct)).toEqual({ op: WireOp.Correct, x: 1.5, z: -2 })
  })
})