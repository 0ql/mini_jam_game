import * as PIXI from "pixi.js"
import { static_circle_colliders } from "src/components/circle_collider"
import { footprints_texture, player_shadow_texture } from "src/components/graphics"
import { KEYBOARD_UPDATES_PS, PLAYER_ACCELERATION, PLAYER_ANIMATION_SPEED_ATTACK, PLAYER_ANIMATION_SPEED_IDLE, PLAYER_ANIMATION_SPEED_RUN, PLAYER_DRAG_CONSTANT, PLAYER_H, PLAYER_RADIUS, PLAYER_VELOCITY_CAP, PLAYER_W, PROPS_RADIUS, TILE_HEIGHT, TILE_WIDTH, X_TILES, Y_TILES } from "src/constants"
import { state } from "src/main"
import { loadAnimatedSprite } from "src/util/load"
import { rd } from "src/util/misc"
import Vec from "src/util/vec"
import { get } from "svelte/store"
import { random_land_spots } from "./bg"
import type Entity from "./entity"

let lineContainer = new PIXI.Container()

// keyboard events
const keyboard = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
}
document.addEventListener("keydown", e => {
  keyboard[e.key] = true
})
document.addEventListener("keyup", e => {
  keyboard[e.key] = false
})

// generate footprints texture

export class Player implements Entity {
  pos: Vec
  vel: Vec
  size: Vec
  attacking: boolean
  shadow_sprite: PIXI.Sprite
  idle_sprite: PIXI.AnimatedSprite
  run_f_sprite: PIXI.AnimatedSprite
  run_r_sprite: PIXI.AnimatedSprite
  run_l_sprite: PIXI.AnimatedSprite
  run_b_sprite: PIXI.AnimatedSprite
  f_attack_sprite: PIXI.AnimatedSprite
  active_sprite: PIXI.AnimatedSprite
  footprints_container: PIXI.Container
  footprints_queue: PIXI.Sprite[]
  player_container: PIXI.Container
  constructor() {
    const spawnlocation = random_land_spots[Math.floor(rd() * random_land_spots.length)]
    this.pos = new Vec(spawnlocation.x * PLAYER_W, spawnlocation.y * PLAYER_H)
    this.vel = new Vec(0, 0)
    this.size = new Vec(PLAYER_W, PLAYER_H)
    this.attacking = false
    this.active_sprite = this.idle_sprite
    this.footprints_container = new PIXI.Container()
    // this.footprints_container.zIndex = -1
    this.footprints_queue = []

    setInterval(() => {
      if (!this.attacking) this.keyboardUpdate()
    }, 1000 / KEYBOARD_UPDATES_PS)
  }
  async init() {
    this.shadow_sprite = new PIXI.Sprite(player_shadow_texture)
    this.idle_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "idle"))
    this.run_f_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "run_f"))
    this.run_r_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "run_b"))
    this.run_l_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "run_r"))
    this.run_b_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "run_l"))
    this.f_attack_sprite = new PIXI.AnimatedSprite(await loadAnimatedSprite("death/", "f_attack"))
    this.player_container = new PIXI.Container()
    this.player_container.addChild(this.shadow_sprite)
    this.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)
    this.draw()

    setInterval(() => {
      this.keyboardUpdate()
      // apply natural slow down
      if (this.vel.x > 0) {
        if (this.vel.x < PLAYER_DRAG_CONSTANT) this.vel.x = 0
        else this.vel.x -= PLAYER_DRAG_CONSTANT
        if (this.active_sprite !== this.run_l_sprite && !this.attacking) this.setActiveAnim("run_l_sprite", PLAYER_ANIMATION_SPEED_RUN)
      }
      if (this.vel.y > 0) {
        if (this.vel.y < PLAYER_DRAG_CONSTANT) this.vel.y = 0
        else this.vel.y -= PLAYER_DRAG_CONSTANT
        if (this.active_sprite !== this.run_f_sprite && !this.attacking) this.setActiveAnim("run_f_sprite", PLAYER_ANIMATION_SPEED_RUN)
      }
      if (this.vel.x < 0) {
        if (Math.abs(this.vel.x) < PLAYER_DRAG_CONSTANT) this.vel.x = 0
        else this.vel.x += PLAYER_DRAG_CONSTANT
        if (this.active_sprite !== this.run_r_sprite && !this.attacking) this.setActiveAnim("run_r_sprite", PLAYER_ANIMATION_SPEED_RUN)
      }
      if (this.vel.y < 0) {
        if (Math.abs(this.vel.y) < PLAYER_DRAG_CONSTANT) this.vel.y = 0
        else this.vel.y += PLAYER_DRAG_CONSTANT
        if (this.active_sprite !== this.run_b_sprite && !this.attacking) this.setActiveAnim("run_b_sprite", PLAYER_ANIMATION_SPEED_RUN)
      }
      if (this.vel.x === 0 && this.vel.y === 0 && this.active_sprite !== this.idle_sprite && !this.attacking) this.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)
    }, 1000 / KEYBOARD_UPDATES_PS)
  }
  moveTo(vec: Vec) {
    this.pos = this.pos.add(vec)
  }
  moveBy(vec: Vec) {
    this.vel = this.vel.add(vec)
    // apply vel cap
    if (this.vel.x > PLAYER_VELOCITY_CAP) this.vel.x = PLAYER_VELOCITY_CAP
    if (this.vel.y > PLAYER_VELOCITY_CAP) this.vel.y = PLAYER_VELOCITY_CAP
    if (this.vel.x < -PLAYER_VELOCITY_CAP) this.vel.x = -PLAYER_VELOCITY_CAP
    if (this.vel.y < -PLAYER_VELOCITY_CAP) this.vel.y = -PLAYER_VELOCITY_CAP
  }
  setActiveAnim(name: string, animation_speed: number) {
    this.player_container.removeChild(this.active_sprite)
    this.active_sprite = this[name]
    this.player_container.addChild(this.active_sprite)
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
  keyboardUpdate() {
    if (keyboard.w) this.moveBy(new Vec(0, -PLAYER_ACCELERATION))
    if (keyboard.a) this.moveBy(new Vec(-PLAYER_ACCELERATION, 0))
    if (keyboard.s) this.moveBy(new Vec(0, PLAYER_ACCELERATION))
    if (keyboard.d) this.moveBy(new Vec(PLAYER_ACCELERATION, 0))
    if (keyboard[" "]) {
      this.attacking = true
      this.player_container.removeChild(this.active_sprite)
      this.active_sprite = this.f_attack_sprite
      this.active_sprite.loop = false
      this.active_sprite.animationSpeed = PLAYER_ANIMATION_SPEED_ATTACK
      this.active_sprite.onComplete = () => {
        this.player_container.removeChild(this.active_sprite)
        this.attacking = false
        this.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)
      }
      this.player_container.addChild(this.active_sprite)
      this.active_sprite.gotoAndPlay(0)
    }
  }
  update() {
    const next_pos = this.pos.add(this.vel)

    this.player_container.removeChild(lineContainer)
    if (lineContainer) lineContainer.destroy()
    lineContainer = new PIXI.Container()
    let collision_detected = false
    // collide with walls
    if (next_pos.x < 0 || next_pos.x + this.size.x > TILE_WIDTH * X_TILES || next_pos.y < 0 || next_pos.y + this.size.y > TILE_HEIGHT * Y_TILES) {
      collision_detected = true
    } else {
      // collide with chairs
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

    if (get(state).debug.show) {
      let player_circ = new PIXI.Graphics()
      player_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
      player_circ.drawCircle(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2, PLAYER_RADIUS);
      player_circ.endFill();
      lineContainer.addChild(player_circ)
      let next_pos_circ = new PIXI.Graphics()
      next_pos_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
      next_pos_circ.drawCircle(next_pos.x + this.size.x / 2, next_pos.y + this.size.y / 2, PLAYER_RADIUS);
      next_pos_circ.endFill();
      lineContainer.addChild(next_pos_circ)
      this.player_container.addChild(lineContainer)
    }
    if (!collision_detected) {
      this.footprints_container.removeChildren()
      this.player_container.removeChild(this.footprints_container)
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
      this.player_container.addChild(this.footprints_container)
      this.pos = this.pos.add(this.vel)
    }
  }
}
