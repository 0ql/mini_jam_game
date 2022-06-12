import * as PIXI from "pixi.js"
import { static_circle_colliders } from "src/components/circle_collider"
import { sand_texture_wrapper, water_texture_wrapper } from "src/components/graphics"
import { ANIMATION_SPEED, MAX_TILE_SCORE_TO_BE_LAND, RANDOM_LAND_SPOTS_COUNT, TILE_HEIGHT, TILE_WIDTH, X_TILES, Y_TILES } from "src/constants"
import { loadAnimatedSprite } from "src/util/load"
import { rd } from "src/util/misc"
import Vec from "src/util/vec"

export const background_container = new PIXI.Container()
export let random_land_spots: {
  x: number
  y: number
}[]
export const createBackground = async () => {
  const beach_chair_texture_array = await loadAnimatedSprite("", "beach_chair")
  const ring_texture_array = await loadAnimatedSprite("", "ring")
  const sand_castle_texture_array = await loadAnimatedSprite("", "sand_castle")
  const schirm_texture_array = await loadAnimatedSprite("", "schirm")

  function collision_debug() {
    // debug collisions
    // draw circles
    static_circle_colliders.forEach(vec => {
      const circ = new PIXI.Graphics()
      circ.lineStyle(2, 0xff0000, 1);
      circ.drawCircle(vec.x, vec.y, PROPS_RADIUS);
      circ.endFill();
      // collision_debug_container.addChild(circ)
    })
  }

  // pick random spots on grid and calc dist
  random_land_spots = []
  for (let i = 0; i < RANDOM_LAND_SPOTS_COUNT; i++) {
    random_land_spots.push({
      x: Math.floor(rd() * X_TILES),
      y: Math.floor(rd() * Y_TILES)
    })
  }

  type Tile = {
    sprite: PIXI.Sprite,
  }

  // create terrain grid 
  const grid: Tile[][] = []
  for (let y = 0; y < Y_TILES; y++) {
    const row: Tile[] = []
    for (let x = 0; x < X_TILES; x++) {
      let score = 0
      // calcule how close to random land spot
      random_land_spots.forEach(spot => {
        score += Math.abs(spot.x - x) + Math.abs(spot.y - y)
      })
      if (score > MAX_TILE_SCORE_TO_BE_LAND) {
        let sprite = new PIXI.Sprite(sand_texture_wrapper.imgs[0])
        sprite.x = x * TILE_WIDTH
        sprite.y = y * TILE_HEIGHT
        sprite.width = TILE_WIDTH
        sprite.height = TILE_HEIGHT
        row.push({
          sprite: sprite
        })
        background_container.addChild(sprite);

        if (rd() > 0.9) {
          let num = rd()
          let sprite: PIXI.AnimatedSprite
          if (num > 0.6) sprite = new PIXI.AnimatedSprite(beach_chair_texture_array)
          else if (num > 0.4) sprite = new PIXI.AnimatedSprite(sand_castle_texture_array)
          else if (num > 0.2) {
            sprite = new PIXI.AnimatedSprite(schirm_texture_array)
            sprite.anchor.x = 0.5;     /* 0 = top, 0.5 = center, 1 = bottom */
            sprite.angle = 2
          }
          else if (num > 0) sprite = new PIXI.AnimatedSprite(ring_texture_array)
          sprite.x = x * TILE_WIDTH
          sprite.y = y * TILE_HEIGHT
          sprite.width = TILE_WIDTH
          sprite.height = TILE_HEIGHT
          if (rd() > 0.5) {
            sprite.anchor.x = 1;     /* 0 = top, 0.5 = center, 1 = bottom */
            sprite.scale.x *= -1;
          }
          sprite.animationSpeed = ANIMATION_SPEED
          sprite.play()
          row.push({
            sprite: sprite
          })
          background_container.addChild(sprite);
          static_circle_colliders.push(new Vec(sprite.x + sprite.width / 2, sprite.y + sprite.height / 2))
        }
      } else {
        let sprite = new PIXI.AnimatedSprite(water_texture_wrapper.imgs)
        sprite.x = x * TILE_WIDTH
        sprite.y = y * TILE_HEIGHT
        sprite.width = TILE_WIDTH
        sprite.height = TILE_HEIGHT
        sprite.animationSpeed = ANIMATION_SPEED
        sprite.play()
        row.push({
          sprite: sprite
        })
        background_container.addChild(sprite);
      }
    }
    grid.push(row)
  }
}
