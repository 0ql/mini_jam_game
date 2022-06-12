import 'uno.css'

import App from './App.svelte'
import * as PIXI from "pixi.js"

export const app = new PIXI.Application({
  width: X_TILES * TILE_WIDTH,
  height: Y_TILES * TILE_HEIGHT,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1
});

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
PIXI.settings.SORTABLE_CHILDREN = true

import { PLAYER_H, PLAYER_W, PROPS_RADIUS, TILE_HEIGHT, TILE_WIDTH, X_TILES, Y_TILES } from './constants'
import Vec from './util/vec'
import { Player } from './entities/player'
import { get, writable } from 'svelte/store'
import { background_container, createBackground } from './entities/bg'
import { Zombie } from './entities/zombie'
import { generateTextures } from './components/graphics';
import { static_circle_colliders } from './components/circle_collider';

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
  console.log("game function")
  generateTextures()
  createBackground()

  const canvas_wrapper = document.getElementById("canvas")
  canvas_wrapper.innerHTML = ""
  canvas_wrapper.appendChild(app.view)

  // fps counter
  let ticks = 0
  setInterval(() => {
    state.update((s) => {
      s.fps = ticks
      return s
    })
    ticks = 0
  }, 1000)

  // setInterval(() => {
  //   state.update((s) => {
  //     s.debug.player.vel = player.vel
  //     s.debug.player.pos = player.pos
  //     return s
  //   })
  // }, 200)

  const props_circ_container = new PIXI.Container()
  function collision_debug() {
    // debug collisions
    // draw circles
    static_circle_colliders.forEach(vec => {
      const circ = new PIXI.Graphics()
      circ.lineStyle(2, 0xff0000, 1);
      circ.drawCircle(vec.x, vec.y, PROPS_RADIUS);
      circ.endFill();
      props_circ_container.addChild(circ)
    })
  }
  collision_debug()

  const zomb_1 = new Zombie(new Vec(100, 100), new Vec(PLAYER_W, PLAYER_H), new Vec(0, 0))
  await zomb_1.init()

  const player = new Player()
  await player.init()

  app.stage.addChild(background_container)
  app.stage.addChild(zomb_1.zombie_container)
  app.stage.addChild(player.player_container)

  state.subscribe(s => {
    if (s.debug.show && get(state).debug.show) {
      // collision_debug()
      app.stage.addChild(props_circ_container)
    } else if (!s.debug.show && get(state).debug.show) {
      props_circ_container.destroy()
      app.stage.removeChild(props_circ_container)
    }
  })

  app.ticker.add(() => {
    ticks++
    player.update()
    player.draw()

    zomb_1.update()
    zomb_1.draw()

  });
}

game()
