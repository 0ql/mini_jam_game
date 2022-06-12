import * as PIXI from "pixi.js"
import { static_circle_colliders } from "src/components/circle_collider"
import { footprints_texture, player_shadow_texture } from "src/components/graphics"
import { KEYBOARD_UPDATES_PS, PROPS_RADIUS, TILE_HEIGHT, TILE_WIDTH, X_TILES, Y_TILES, ZOMBIE_ACCELERATION, ZOMBIE_ANIMATION_SPEED_IDLE, ZOMBIE_ANIMATION_SPEED_RUN, ZOMBIE_H, ZOMBIE_RADIUS, ZOMBIE_VELOCITY_CAP, ZOMBIE_W } from "src/constants"
import { loadAnimatedSprite } from "src/util/load"
import { rd } from "src/util/misc"
import Vec from "src/util/vec"
import type Entity from "./entity"

let st: boolean
export class Zombie implements Entity {
  public zombie_container: PIXI.Container
  public footprints_container: PIXI.Container
  public footprints_queue: PIXI.Sprite[]
  public line_container: PIXI.Container
  public pos: Vec
  public size: Vec
  public vel: Vec
  public attacking: false
  public shadow_sprite: PIXI.Sprite
  public idle_sprite: PIXI.AnimatedSprite
  public run_f_sprite: PIXI.AnimatedSprite
  public run_r_sprite: PIXI.AnimatedSprite
  public run_l_sprite: PIXI.AnimatedSprite
  public run_b_sprite: PIXI.AnimatedSprite
  public f_attack_sprite: PIXI.AnimatedSprite
  public active_sprite: PIXI.AnimatedSprite
  constructor(pos: Vec, size: Vec, vel: Vec) {
    this.pos = pos
    this.size = size
    this.vel = vel
    this.zombie_container = new PIXI.Container()
    this.line_container = new PIXI.Container()
    this.footprints_container = new PIXI.Container()
    this.footprints_queue = []
  }
  async init() {
    this.shadow_sprite = new PIXI.Sprite(player_shadow_texture)
    this.zombie_container.addChild(this.shadow_sprite)
    this.idle_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("zombie/", "idle"))
    this.run_f_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("zombie/", "run_f"))
    this.run_r_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("zombie/", "run_r"))
    this.run_l_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("zombie/", "run_l"))
    this.run_b_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("zombie/", "run_b"))
    this.setActiveAnim("idle_sprite", ZOMBIE_ANIMATION_SPEED_IDLE)
    this.draw()
    // st = get(state).debug.show
    st = true
    setInterval(() => {
      this.controller()
    }, 1000 / KEYBOARD_UPDATES_PS)
  }
  controller() {
    // AI
    // if (this.pos.x > player.pos.x) this.moveBy(new Vec(-ZOMBIE_ACCELERATION, 0))
    // if (this.pos.x < player.pos.x) this.moveBy(new Vec(ZOMBIE_ACCELERATION, 0))
    // if (this.pos.y > player.pos.y) this.moveBy(new Vec(0, -ZOMBIE_ACCELERATION))
    // if (this.pos.y < player.pos.y) this.moveBy(new Vec(0, ZOMBIE_ACCELERATION))
    this.moveBy(new Vec(-ZOMBIE_ACCELERATION, 0))
  }
  update() {
    const next_pos = this.pos.add(this.vel)
    let collision_detected = false
    this.line_container.destroy()
    this.zombie_container.removeChild(this.line_container)
    this.line_container = new PIXI.Container()
    if (next_pos.x < 0 || next_pos.x + this.size.x > TILE_WIDTH * X_TILES || next_pos.y < 0 || next_pos.y + this.size.y > TILE_HEIGHT * Y_TILES) {
      collision_detected = true
    } else {
      static_circle_colliders.forEach(vec => {
        let color: number
        // calc dist
        if (vec.dist(next_pos.add(this.size.mul(new Vec(0.5, 0.5)))) < ZOMBIE_RADIUS + PROPS_RADIUS) {
          color = 0xff0000
          collision_detected = true
        }
        else color = 0xffffff
        if (st) {
          let line = new PIXI.Graphics();
          this.line_container.addChild(line);
          line.lineStyle(1, color)
            .moveTo(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2)
            .lineTo(vec.x, vec.y);
        }
      })
    }
    if (st) {
      let zombie_circ = new PIXI.Graphics()
      zombie_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
      zombie_circ.drawCircle(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2, ZOMBIE_RADIUS);
      zombie_circ.endFill();
      this.line_container.addChild(zombie_circ)
      let next_pos_circ = new PIXI.Graphics()
      next_pos_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
      next_pos_circ.drawCircle(next_pos.x + this.size.x / 2, next_pos.y + this.size.y / 2, ZOMBIE_RADIUS);
      next_pos_circ.endFill();
      this.line_container.addChild(next_pos_circ)
    }
    this.zombie_container.addChild(this.line_container)
    if (!collision_detected) this.pos = next_pos

    // apply natural slow down
    if (this.vel.x > 0 && this.vel.x > this.vel.y) {
      if (this.active_sprite !== this.run_l_sprite && !this.attacking) this.setActiveAnim("run_r_sprite", ZOMBIE_ANIMATION_SPEED_RUN)
    }
    if (this.vel.y > 0 && this.vel.y > this.vel.x) {
      if (this.active_sprite !== this.run_f_sprite && !this.attacking) this.setActiveAnim("run_f_sprite", ZOMBIE_ANIMATION_SPEED_RUN)
    }
    if (this.vel.x < 0 && this.vel.x < this.vel.y) {
      if (this.active_sprite !== this.run_r_sprite && !this.attacking) this.setActiveAnim("run_l_sprite", ZOMBIE_ANIMATION_SPEED_RUN)
    }
    if (this.vel.y < 0 && this.vel.y < this.vel.x) {
      if (this.active_sprite !== this.run_b_sprite && !this.attacking) this.setActiveAnim("run_b_sprite", ZOMBIE_ANIMATION_SPEED_RUN)
    }
    if (this.vel.x === 0 && this.vel.y === 0 && this.active_sprite !== this.idle_sprite && !this.attacking) this.setActiveAnim("idle_sprite", ZOMBIE_ANIMATION_SPEED_IDLE)

    this.footprints_container.removeChildren()
    this.zombie_container.removeChild(this.footprints_container)
    if (this.footprints_queue.length > 20) {
      this.footprints_container.removeChild(this.footprints_queue[0])
      this.footprints_queue.shift()
    }
    if (rd() > 0.9 && (this.vel.x !== 0 || this.vel.y !== 0)) {
      const new_footprint = new PIXI.Sprite(footprints_texture)
      new_footprint.x = this.pos.x + this.size.x / 2
      new_footprint.y = this.pos.y + this.size.y / 2
      this.footprints_container.addChild(new_footprint)
      this.footprints_queue.push(new_footprint)
    }
    this.zombie_container.addChild(this.footprints_container)
  }
  moveTo(vec: Vec) {
    this.pos = this.pos.add(vec)
  }
  moveBy(vec: Vec) {
    this.vel = this.vel.add(vec)
    // apply vel cap
    if (this.vel.x > ZOMBIE_VELOCITY_CAP) this.vel.x = ZOMBIE_VELOCITY_CAP
    if (this.vel.y > ZOMBIE_VELOCITY_CAP) this.vel.y = ZOMBIE_VELOCITY_CAP
    if (this.vel.x < -ZOMBIE_VELOCITY_CAP) this.vel.x = -ZOMBIE_VELOCITY_CAP
    if (this.vel.y < -ZOMBIE_VELOCITY_CAP) this.vel.y = -ZOMBIE_VELOCITY_CAP
  }
  setActiveAnim(name: string, animation_speed: number) {
    this.zombie_container.removeChild(this.active_sprite)
    this.active_sprite = this[name]
    this.zombie_container.addChild(this.active_sprite)
    this.active_sprite.animationSpeed = animation_speed
    this.active_sprite.loop = true
    this.active_sprite.play()
  }
  draw() {
    this.shadow_sprite.x = this.pos.x + this.size.x / 4
    this.shadow_sprite.y = this.pos.y + this.size.y * 0.65
    this.active_sprite.x = this.pos.x
    this.active_sprite.y = this.pos.y
    this.active_sprite.width = this.size.x
    this.active_sprite.height = this.size.y
  }
}
