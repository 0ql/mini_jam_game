<script lang="ts">
  import { state } from "./main";
</script>

<div class="fixed h-screen right-0 w-1/5 bg-white bg-opacity-40">
  <div class="text-xl">Debug</div>
  <div class="border-y">Game</div>
  <div>FPS: {$state.fps}</div>
  <div class="border-y">Player</div>
  <div>Vel</div>
  <div>X: {$state.debug.player.vel.x.toFixed(2)}</div>
  <div>Y: {$state.debug.player.vel.y.toFixed(2)}</div>
  <div>Pos</div>
  <div>X: {$state.debug.player.pos.x.toFixed(2)}</div>
  <div>Y: {$state.debug.player.pos.y.toFixed(2)}</div>
</div>
