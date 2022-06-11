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
  public add(vec: Vec) {
    this.x += vec.x
    this.y += vec.y
  }
  public sub(vec: Vec) {
    this.x -= vec.x
    this.y -= vec.y
  }
  public mul(vec: Vec) {
    this.x *= vec.x
    this.y *= vec.y
  }
}

export const state = writable({
  fps: 0,
  debug: {
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

  const X_TILES = 30
  const Y_TILES = 20

  const TILE_WIDTH = 40
  const TILE_HEIGHT = 40

  const ANIMATION_SPEED = 0.03

  // PLAYER
  const PLAYER_W = 40
  const PLAYER_H = 40
  const PLAYER_ANIMATION_SPEED = 0.05
  const PLAYER_DRAG_CONSTANT = 0.05
  const PLAYER_VELOCITY_CAP = 4

  // TERRAIN
  const RANDOM_LAND_SPOTS_COUNT = 4
  const MAX_TILE_SCORE_TO_BE_LAND = 60

  const app = new PIXI.Application({
    width: X_TILES * TILE_WIDTH,
    height: Y_TILES * TILE_HEIGHT,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1
  });

  const canvas_wrapper = document.getElementById("canvas")
  canvas_wrapper.innerHTML = ""
  canvas_wrapper.appendChild(app.view)

  type Tile = {
    sprite: PIXI.Sprite,
  }

  let texture = PIXI.Texture.from("../assets/sprites/death/death idle.png")
  const jsn = await (await fetch("../assets/sprites/death/death idle.json")).json()

  // let sheet = PIXI.Loader.shared.resources["../DeathIdle/death idle.json"].spritesheet;
  const dude_sheet = new PIXI.Spritesheet(texture, jsn);
  dude_sheet.parse(() => console.log('Spritesheet ready to use!'));

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

  let water_texture_wrapper = createRandTextureWrapper({
    animated: true,
    amount: 16,
    random_texture_opts: {
      bg: 0x5cbeff,
      w: 16,
      h: 16,
      pixels: {
        amount: 20,
        w: 1,
        h: 1,
        colors: [0x40adf5, 0x4ab2f7, 0x70c6ff]
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
        amount: 32,
        w: 1,
        h: 1,
        colors: [0xf7e67c]
      }
    }
  })

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
        app.stage.addChild(sprite);
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
        app.stage.addChild(sprite);
      }
    }

    grid.push(row)
  }

  // make death idle texture array
  let death_idle_texture_array = [];
  let death_idle_texture_array_names = Object.keys(dude_sheet.textures);
  for (let i = 0; i < death_idle_texture_array_names.length; i++) {
    let texture = PIXI.Texture.from(death_idle_texture_array_names[i]);
    death_idle_texture_array.push(texture);
  };

  // keyboard events
  const keyboard = {
    w: false,
    a: false,
    s: false,
    d: false,
  }
  document.addEventListener("keydown", e => {
    keyboard[e.key] = true
  })
  document.addEventListener("keyup", e => {
    keyboard[e.key] = false
  })

  // create player (death)
  const spawnlocation = random_land_spots[Math.floor(rd() * random_land_spots.length)]
  const player = {
    pos: new Vec(spawnlocation.x * PLAYER_W, spawnlocation.y * PLAYER_H),
    size: new Vec(PLAYER_W, PLAYER_H),
    vel: new Vec(0, 0),
    idle_sprite: new PIXI.AnimatedSprite(death_idle_texture_array),
    moveTo: (vec: Vec) => {
      player.pos.add(vec)
    },
    moveBy: (vec: Vec) => {
      player.vel.add(vec)

      // apply vel cap
      if (player.vel.x > PLAYER_VELOCITY_CAP) player.vel.x = PLAYER_VELOCITY_CAP
      if (player.vel.y > PLAYER_VELOCITY_CAP) player.vel.y = PLAYER_VELOCITY_CAP
      if (player.vel.x < -PLAYER_VELOCITY_CAP) player.vel.x = -PLAYER_VELOCITY_CAP
      if (player.vel.y < -PLAYER_VELOCITY_CAP) player.vel.y = -PLAYER_VELOCITY_CAP
    },
    init: () => {
      player.draw()

      player.idle_sprite.animationSpeed = PLAYER_ANIMATION_SPEED
      player.idle_sprite.play()

      app.stage.addChild(player.idle_sprite)
    },
    draw: () => {
      player.idle_sprite.x = player.pos.x
      player.idle_sprite.y = player.pos.y
      player.idle_sprite.width = player.size.x
      player.idle_sprite.height = player.size.y
    },
    keyboardUpdate: () => {
      if (keyboard.w) player.moveBy(new Vec(0, -1))
      if (keyboard.a) player.moveBy(new Vec(-1, 0))
      if (keyboard.s) player.moveBy(new Vec(0, 1))
      if (keyboard.d) player.moveBy(new Vec(1, 0))
    },
    update: () => {
      // apply natural slow down
      if (player.vel.x > 0) {
        if (player.vel.x < PLAYER_DRAG_CONSTANT) player.vel.x = 0
        else player.vel.x -= PLAYER_DRAG_CONSTANT
      }
      if (player.vel.y > 0) {
        if (player.vel.y < PLAYER_DRAG_CONSTANT) player.vel.y = 0
        else player.vel.y -= PLAYER_DRAG_CONSTANT
      }
      if (player.vel.x < 0) {
        if (Math.abs(player.vel.x) < PLAYER_DRAG_CONSTANT) player.vel.x = 0
        else player.vel.x += PLAYER_DRAG_CONSTANT
      }
      if (player.vel.y < 0) {
        if (Math.abs(player.vel.y) < PLAYER_DRAG_CONSTANT) player.vel.y = 0
        else player.vel.y += PLAYER_DRAG_CONSTANT
      }

      player.pos.add(player.vel)
    }
  }

  // fps counter
  let ticks = 0
  setInterval(() => {
    state.update((s) => {
      s.fps = ticks
      s.debug.player.vel = player.vel
      s.debug.player.pos = player.pos
      return s
    })
    ticks = 0
  }, 1000)

  setInterval(() => {
    player.keyboardUpdate()
  }, 1000 / 5)

  player.init()

  app.ticker.add((delta: number) => {
    ticks++

    player.update()
    player.draw()
  });
}

game()
