import 'uno.css'

import App from './App.svelte'
import * as PIXI from "pixi.js"
import { writable } from 'svelte/store'

class Vec {
  public x: number
  public y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  public add(vec: Vec): Vec {
    return new Vec(this.x + vec.x, this.y + vec.y)
  }
  public sub(vec: Vec): Vec {
    return new Vec(this.x - vec.x, this.y - vec.y)
  }
  public mul(vec: Vec): Vec {
    return new Vec(this.x * vec.x, this.y * vec.y)
  }
  public dist(vec: Vec): number {
    return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2))
  }
}

export const state = writable({
  fps: 0,
  debug: {
    show: false,
    player: {
      vel: new Vec(0, 0),
      pos: new Vec(0, 0)
    }
  }
})

const svelteApp = new App({
  target: document.getElementById('app')
})

export default svelteApp

async function game() {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
  PIXI.settings.SORTABLE_CHILDREN = true

  const X_TILES = 12
  const Y_TILES = 12

  const TILE_WIDTH = 70
  const TILE_HEIGHT = 70

  const ANIMATION_SPEED = 0.03

  // PLAYER
  const PLAYER_W = 70
  const PLAYER_H = 70
  const PLAYER_ANIMATION_SPEED_IDLE = 0.05
  const PLAYER_ANIMATION_SPEED_RUN = 0.2
  const PLAYER_DRAG_CONSTANT = 1.4
  const PLAYER_VELOCITY_CAP = 4
  const PLAYER_ACCELERATION = 2.8
  const PLAYER_ATTACK_ANIMATION_SPEED = 0.3

  // KEYBOARD
  const KEYBOARD_UPDATES_PS = 10

  // TERRAIN
  const RANDOM_LAND_SPOTS_COUNT = 4
  const MAX_TILE_SCORE_TO_BE_LAND = 30

  const app = new PIXI.Application({
    width: X_TILES * TILE_WIDTH,
    height: Y_TILES * TILE_HEIGHT,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1
  });

  const canvas_wrapper = document.getElementById("canvas")
  canvas_wrapper.innerHTML = ""
  canvas_wrapper.appendChild(app.view)

  const static_circle_colliders: Vec[] = []

  type Tile = {
    sprite: PIXI.Sprite,
  }

  const rd = () => Math.random()

  type RandomTextureOpts = {
    bg: number
    w: number
    h: number
    pixels: {
      amount: number
      w: number
      h: number
      colors: number[]
    }
  }

  function createRandTexture(opts: RandomTextureOpts): PIXI.Graphics {
    let res = new PIXI.Graphics()

    res.beginFill(opts.bg)
    res.drawRect(0, 0, opts.w, opts.h)
    res.endFill()
    for (let i = 0; i < opts.pixels.amount; i++) {
      res.beginFill(opts.pixels.colors[Math.floor(rd() * opts.pixels.colors.length)])
      res.drawRect(Math.floor(rd() * opts.w), Math.floor(rd() * opts.h), opts.pixels.w, opts.pixels.h)
      res.endFill()
    }

    return res
  }

  // for non-animated sprites it pickes the first image
  type TextureWrapper = {
    animated: boolean
    imgs: PIXI.Texture[]
  }

  function createRandTextureWrapper(opts: {
    animated: boolean
    amount: number
    random_texture_opts: RandomTextureOpts
  }): TextureWrapper {
    if (opts.animated === false && opts.amount > 1) {
      throw new Error("Non Animated Sprites can only have an amount of one.")
    }
    let res: TextureWrapper = {
      animated: opts.animated,
      imgs: []
    }
    for (let i = 0; i < opts.amount; i++) {
      res.imgs.push(app.renderer.generateTexture(createRandTexture(opts.random_texture_opts)))
    }
    return res
  }

  async function loadAnimatedSprite(path: string, name: string): Promise<PIXI.Texture[]> {
    const texture = PIXI.Texture.from(`../sprites/${path}${name}/${name}.png`)
    const texture_jsn = await (await fetch(`../sprites/${path}${name}/${name}.json`)).json()

    const sprite_sheet = new PIXI.Spritesheet(texture, texture_jsn);
    sprite_sheet.parse(() => console.log("finished parsing " + name))
    const texture_array: PIXI.Texture[] = [];
    const texture_array_names = Object.keys(sprite_sheet.textures);
    for (let i = 0; i < texture_array_names.length; i++) {
      let texture = PIXI.Texture.from(texture_array_names[i]);
      texture_array.push(texture);
    };
    return texture_array
  }

  let water_texture_wrapper = createRandTextureWrapper({
    animated: true,
    amount: 16,
    random_texture_opts: {
      bg: 0x5cbeff,
      w: 16,
      h: 16,
      pixels: {
        amount: 100,
        w: 1,
        h: 1,
        colors: [0x40adf5, 0x4ab2f7, 0x70c6ff, 0x4daff0, 0x5abafa]
      }
    }
  })

  // generate sand textures array
  let sand_texture_wrapper = createRandTextureWrapper({
    animated: false,
    amount: 1,
    random_texture_opts: {
      bg: 0xebda71,
      w: 16,
      h: 16,
      pixels: {
        amount: 100,
        w: 1,
        h: 1,
        colors: [0xf7e67c, 0xe3d36d, 0xe8d664, 0xf7e468]
      }
    }
  })

  // generate footprints texture
  const footprints_container = new PIXI.Container()
  footprints_container.zIndex = -1
  let footprints_graphics: PIXI.Graphics = new PIXI.Graphics()
  footprints_graphics.beginFill(0x000000)
  footprints_graphics.alpha = 0.1
  footprints_graphics.drawRect(0, 0, 10, 10)
  const footprints_texture: PIXI.Texture = app.renderer.generateTexture(footprints_graphics)
  const footprints_queue: PIXI.Sprite[] = []

  const player_shadow_graphic = new PIXI.Graphics()
  player_shadow_graphic.beginFill(0x000000)
  player_shadow_graphic.alpha = 0.1
  player_shadow_graphic.drawCircle(0, 0, PLAYER_W / 4)
  const player_shadow_texture = app.renderer.generateTexture(player_shadow_graphic)

  const beach_chair_texture_array = await loadAnimatedSprite("", "beach_chair")

  // pick random spots on grid and calc dist
  let random_land_spots: {
    x: number
    y: number
  }[] = []
  for (let i = 0; i < RANDOM_LAND_SPOTS_COUNT; i++) {
    random_land_spots.push({
      x: Math.floor(rd() * X_TILES),
      y: Math.floor(rd() * Y_TILES)
    })
  }

  const background_container = new PIXI.Container()
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

        if (rd() > 0.95) {
          let sprite = new PIXI.AnimatedSprite(beach_chair_texture_array)
          sprite.x = x * TILE_WIDTH
          sprite.y = y * TILE_HEIGHT
          sprite.width = TILE_WIDTH
          sprite.height = TILE_HEIGHT
          if (rd() > 0.5) {
            sprite.anchor.x = 1;     /* 0 = top, 0.5 = center, 1 = bottom */
            sprite.scale.x *= -1;    /* flip vertically */
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

  const death_idle_texture_array = await loadAnimatedSprite("death/", "idle")
  const death_run_f_texture_array = await loadAnimatedSprite("death/", "run_f")
  const death_run_b_texture_array = await loadAnimatedSprite("death/", "run_b")
  const death_run_l_texture_array = await loadAnimatedSprite("death/", "run_r")
  const death_run_r_texture_array = await loadAnimatedSprite("death/", "run_l")
  const death_f_attack_texture_array = await loadAnimatedSprite("death/", "f_attack")

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

  let lineContainer = new PIXI.Container()
  const player_container = new PIXI.Container()
  // create player (death)
  const spawnlocation = random_land_spots[Math.floor(rd() * random_land_spots.length)]
  const player = {
    pos: new Vec(spawnlocation.x * PLAYER_W, spawnlocation.y * PLAYER_H),
    size: new Vec(PLAYER_W, PLAYER_H),
    vel: new Vec(0, 0),
    attacking: false,
    shadow_sprite: new PIXI.Sprite(player_shadow_texture),
    idle_sprite: new PIXI.AnimatedSprite(death_idle_texture_array),
    run_f_sprite: new PIXI.AnimatedSprite(death_run_f_texture_array),
    run_r_sprite: new PIXI.AnimatedSprite(death_run_r_texture_array),
    run_l_sprite: new PIXI.AnimatedSprite(death_run_l_texture_array),
    run_b_sprite: new PIXI.AnimatedSprite(death_run_b_texture_array),
    f_attack_sprite: new PIXI.AnimatedSprite(death_f_attack_texture_array),
    active_sprite: null,
    moveTo: (vec: Vec) => {
      player.pos = player.pos.add(vec)
    },
    moveBy: (vec: Vec) => {
      player.vel = player.vel.add(vec)
      // apply vel cap
      if (player.vel.x > PLAYER_VELOCITY_CAP) player.vel.x = PLAYER_VELOCITY_CAP
      if (player.vel.y > PLAYER_VELOCITY_CAP) player.vel.y = PLAYER_VELOCITY_CAP
      if (player.vel.x < -PLAYER_VELOCITY_CAP) player.vel.x = -PLAYER_VELOCITY_CAP
      if (player.vel.y < -PLAYER_VELOCITY_CAP) player.vel.y = -PLAYER_VELOCITY_CAP
    },
    setActiveAnim: (name: string, animation_speed: number) => {
      player_container.removeChild(player.active_sprite)
      player.active_sprite = player[name]
      player_container.addChild(player.active_sprite)
      player.active_sprite.animationSpeed = animation_speed
      player.active_sprite.loop = true
      player.active_sprite.play()
    },
    init: () => {
      player_container.addChild(player.shadow_sprite)
      player.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)
      player.draw()
    },
    draw: () => {
      player.shadow_sprite.x = player.pos.x + player.size.x / 4
      player.shadow_sprite.y = player.pos.y + player.size.y * 0.65
      player.active_sprite.x = player.pos.x
      player.active_sprite.y = player.pos.y
      player.active_sprite.width = player.size.x
      player.active_sprite.height = player.size.y
    },
    keyboardUpdate: () => {
      if (keyboard.w) player.moveBy(new Vec(0, -PLAYER_ACCELERATION))
      if (keyboard.a) player.moveBy(new Vec(-PLAYER_ACCELERATION, 0))
      if (keyboard.s) player.moveBy(new Vec(0, PLAYER_ACCELERATION))
      if (keyboard.d) player.moveBy(new Vec(PLAYER_ACCELERATION, 0))
      if (keyboard[" "]) {
        player.attacking = true
        player_container.removeChild(player.active_sprite)
        player.active_sprite = player.f_attack_sprite
        player.active_sprite.loop = false
        player.active_sprite.animationSpeed = PLAYER_ATTACK_ANIMATION_SPEED
        player.active_sprite.onComplete = () => {
          player_container.removeChild(player.active_sprite)
          player.attacking = false
          player.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)
        }
        player_container.addChild(player.active_sprite)
        player.active_sprite.gotoAndPlay(0)
      }
    },
    update: () => {
      const next_pos = player.pos.add(player.vel)

      collision_debug_container.removeChild(lineContainer)
      lineContainer = new PIXI.Container()
      let collision_detected = false
      // collide with walls
      if (next_pos.x < 0 || next_pos.x + player.size.x > TILE_WIDTH * X_TILES || next_pos.y < 0 || next_pos.y + player.size.y > TILE_HEIGHT * Y_TILES) {
        collision_detected = true
      } else {
        // collide with chairs
        static_circle_colliders.forEach(vec => {
          let color: number
          // calc dist
          if (vec.dist(next_pos.add(player.size.mul(new Vec(0.5, 0.5)))) < 80) {
            color = 0xff0000
            collision_detected = true
          }
          else color = 0xffffff

          if (debug_on) {
            let line = new PIXI.Graphics();
            lineContainer.addChild(line);
            line.lineStyle(1, color)
              .moveTo(player.pos.x + player.size.x / 2, player.pos.y + player.size.y / 2)
              .lineTo(vec.x, vec.y);
          }
        })
      }
      if (debug_on) {
        let player_circ = new PIXI.Graphics()
        player_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
        player_circ.drawCircle(player.pos.x + player.size.x / 2, player.pos.y + player.size.y / 2, 40);
        player_circ.endFill();
        lineContainer.addChild(player_circ)
        let next_pos_circ = new PIXI.Graphics()
        next_pos_circ.lineStyle(2, collision_detected ? 0xff0000 : 0xffffff, 1);
        next_pos_circ.drawCircle(next_pos.x + player.size.x / 2, next_pos.y + player.size.y / 2, 40);
        next_pos_circ.endFill();
        lineContainer.addChild(next_pos_circ)
        collision_debug_container.addChild(lineContainer)
      }

      if (!collision_detected) {
        player_container.removeChild(footprints_container)
        if (footprints_queue.length > 20) {
          footprints_container.removeChild(footprints_queue[0])
          footprints_queue.shift()
        }
        if (rd() > 0.9 && (player.vel.x !== 0 || player.vel.y !== 0)) {
          const new_footprint = new PIXI.Sprite(footprints_texture)
          new_footprint.x = player.pos.x + player.size.x / 2
          new_footprint.y = player.pos.y + player.size.y / 2
          footprints_container.addChild(new_footprint)
          footprints_queue.push(new_footprint)
        }
        player_container.addChild(footprints_container)
        player.pos = player.pos.add(player.vel)
      }
    }
  }

  // fps counter
  let ticks = 0
  setInterval(() => {
    state.update((s) => {
      s.fps = ticks
      return s
    })
    ticks = 0
  }, 1000)

  setInterval(() => {
    state.update((s) => {
      s.debug.player.vel = player.vel
      s.debug.player.pos = player.pos
      return s
    })
  }, 200)

  setInterval(() => {
    // apply natural slow down
    if (player.vel.x > 0) {
      if (player.vel.x < PLAYER_DRAG_CONSTANT) player.vel.x = 0
      else player.vel.x -= PLAYER_DRAG_CONSTANT
      if (player.active_sprite !== player.run_l_sprite && !player.attacking) player.setActiveAnim("run_l_sprite", PLAYER_ANIMATION_SPEED_RUN)
    }
    if (player.vel.y > 0) {
      if (player.vel.y < PLAYER_DRAG_CONSTANT) player.vel.y = 0
      else player.vel.y -= PLAYER_DRAG_CONSTANT
      if (player.active_sprite !== player.run_f_sprite && !player.attacking) player.setActiveAnim("run_f_sprite", PLAYER_ANIMATION_SPEED_RUN)
    }
    if (player.vel.x < 0) {
      if (Math.abs(player.vel.x) < PLAYER_DRAG_CONSTANT) player.vel.x = 0
      else player.vel.x += PLAYER_DRAG_CONSTANT
      if (player.active_sprite !== player.run_r_sprite && !player.attacking) player.setActiveAnim("run_r_sprite", PLAYER_ANIMATION_SPEED_RUN)
    }
    if (player.vel.y < 0) {
      if (Math.abs(player.vel.y) < PLAYER_DRAG_CONSTANT) player.vel.y = 0
      else player.vel.y += PLAYER_DRAG_CONSTANT
      if (player.active_sprite !== player.run_b_sprite && !player.attacking) player.setActiveAnim("run_b_sprite", PLAYER_ANIMATION_SPEED_RUN)
    }
    if (player.vel.x === 0 && player.vel.y === 0 && player.active_sprite !== player.idle_sprite && !player.attacking) player.setActiveAnim("idle_sprite", PLAYER_ANIMATION_SPEED_IDLE)

    if (!player.attacking) player.keyboardUpdate()
  }, 1000 / KEYBOARD_UPDATES_PS)

  const collision_debug_container = new PIXI.Container()
  let debug_on = false
  function collision_debug() {
    // debug collisions
    // draw circles
    static_circle_colliders.forEach(vec => {
      const circ = new PIXI.Graphics()
      circ.lineStyle(2, 0xff0000, 1);
      circ.drawCircle(vec.x, vec.y, 40);
      circ.endFill();
      collision_debug_container.addChild(circ)
    })
  }

  app.stage.addChild(background_container)
  app.stage.addChild(player_container)
  player.init()

  state.subscribe(s => {
    if (s.debug.show && !debug_on) {
      debug_on = true
      collision_debug()
      app.stage.addChild(collision_debug_container)
    } else if (!s.debug.show && debug_on) {
      debug_on = false
      app.stage.removeChild(collision_debug_container)
    }
  })

  app.ticker.add((delta: number) => {
    ticks++

    player.update()
    player.draw()
  });
}

game()
