'use client'

import { QUARTER_SHOPS, QUARTER_SHOP_Z } from './layout'
import { ShopUnit } from '../../kit/ShopUnit'

export function ShopRow() {
  return (
    <>
      {QUARTER_SHOPS.map((s) => (
        <ShopUnit key={s.x} {...s} z={QUARTER_SHOP_Z} />
      ))}
    </>
  )
}
