import * as PIXI from "pixi.js"
import { PLAYER_W } from "src/constants"
import { app } from "src/main"
import { rd } from "src/util/misc"

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

export const createRandTextureWrapper = (opts: {
  animated: boolean
  amount: number
  random_texture_opts: RandomTextureOpts
}): TextureWrapper => {
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

let footprints_graphics: PIXI.Graphics = new PIXI.Graphics()
footprints_graphics.beginFill(0x000000)
footprints_graphics.alpha = 0.1
footprints_graphics.drawRect(0, 0, 10, 10)

const player_shadow_graphic = new PIXI.Graphics()
player_shadow_graphic.beginFill(0x000000)
player_shadow_graphic.alpha = 0.1
player_shadow_graphic.drawCircle(0, 0, PLAYER_W / 4)

export let footprints_texture: PIXI.Texture
export let player_shadow_texture: PIXI.Texture
export let water_texture_wrapper
export let sand_texture_wrapper

export const generateTextures = () => {
  app.renderer.generateTexture(footprints_graphics)
  app.renderer.generateTexture(player_shadow_graphic)
  water_texture_wrapper = createRandTextureWrapper({
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
  sand_texture_wrapper = createRandTextureWrapper({
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
}

