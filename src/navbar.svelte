<script lang="ts">
  import { state } from "./main";
</script>

<nav
  class="fixed top-0 left-0 w-screen bg-white flex justify-between items-center bg-yellow-200"
>
  <div class="text-xl font-bold p-4">Death Stranded</div>
  <div class="p-4">FPS: {$state.fps}</div>
  <div class="flex">
    <div class="p-4">Vel: X: {$state.debug.player.vel.x.toFixed(2)}</div>
    <div class="p-4">Y: {$state.debug.player.vel.y.toFixed(2)}</div>
  </div>
  <div class="flex">
    <div class="p-4">Pos: X: {$state.debug.player.pos.x.toFixed(2)}</div>
    <div class="p-4">Y: {$state.debug.player.pos.y.toFixed(2)}</div>
  </div>
</nav>
