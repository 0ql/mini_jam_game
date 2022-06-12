import type Entity from "src/entities/entity"
import type Vec from "src/util/vec"
import type Component from "./component"

export const static_circle_colliders: Vec[] = []

export default class CircleCollider implements Component {
  update: () => void
}

const dyn_entities: Entity[] = []
const sta_entities: Entity[] = []

export const circleCollider = (a_pos: Vec, a_radius, b_pos: Vec, b_radius) => {
  // if (a_pos.x < 0 || next_pos.x + this.size.x > TILE_WIDTH * X_TILES || next_pos.y < 0 || next_pos.y + this.size.y > TILE_HEIGHT * Y_TILES) {
  //   collision_detected = true

  static_circle_colliders.forEach(vec => {
    let color: number
    // calc dist
    if (vec.dist(next_pos.add(this.size.mul(new Vec(0.5, 0.5)))) < PLAYER_RADIUS + PROPS_RADIUS) {
      color = 0xff0000
      collision_detected = true
    }
    else color = 0xffffff
    if (get(state).debug.show) {
      let line = new PIXI.Graphics();
      lineContainer.addChild(line);
      line.lineStyle(1, color)
        .moveTo(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2)
        .lineTo(vec.x, vec.y);
    }
  })
}
