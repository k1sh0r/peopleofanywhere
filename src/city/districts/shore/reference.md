# The Shore — what's in it, and why

The default district: the city's beach, its front porch. Guests spawn here, and anyone from a district
that isn't built yet visits here. One shard, ±46 m (`shared/net/config.ts` BOUNDS).

If your city has a beach, a riverfront or a big public square, this is the district to turn into it:
keep the layout, rename the pieces, re-paint the signs (`layout.ts`, `props.tsx`).

## Axes

| Feature | Game |
|---|---|
| The beach road | runs along **X**, kerbs at z = 9 and z = 23, median at z = 16 |
| The sea | **−Z**. Waterline at z = −32, the waves wash ±2.2 m |
| The city | **+Z**: heritage row, the portal plaza, far blocks |
| The lighthouse end | **+X**: the lighthouse at x = 38 |

## Compression

- Sand: 31 m from the promenade edge (z = −1) to the waterline. Enough openness to feel the beach, short enough to cross in ~5 s running.
- Road: two carriageways + median in 14 m.
- Lighthouse: a 34 m shaft, visible from everywhere on the sand.

## What's in, and why

| Piece | Reads as | Note |
|---|---|---|
| Lighthouse (cream shaft, red bands, gallery, lantern) | the city's lighthouse | lantern uses the shared lamp material: glows at dusk; two faint beams sweep at night |
| Heritage row (red brick, cream arcade, domes, clock tower) | old civic buildings across the road | stylized, unnamed; no institution's name or crest |
| HELLO letters | the selfie sign on the promenade | painted block letters spelling `HELLO <CITY_NAME>` (src/config/site.ts) |
| Snack row (4 carts) | snack carts on the sand | popcorn, fritters, corn, ice cream; lamps glow at night |
| Fishing boats (3) | boats pulled up the sand | with nets and tipped-up outboards |
| Kite seller + 3 kites | kites over the beach | the sea breeze blows inland, so kites fly downwind over the promenade |
| Ships offshore | vessels waiting for the harbour | far, hazed silhouettes |
| Bus shelter "CITY BEACH" | the bus stop on the inland kerb | |

## Deliberately left out

- Statues: humanoid figures can't be built from primitives (design.md §11). Add them through the hero-prop pipeline (image-to-3D).
- Memorials, an aquarium, rides: noise for a first pass.

## Surfaces and sound

- `sand`: soft, low footsteps (the grass samples slowed down; no new recording).
- Surf: four emitters along the waterline, swelling on the same ~7 s cycle the water runs up the sand (`Sea.tsx` SURF_RATE, `ambience.ts` seaSurf).
- Music radio: a snack cart.
