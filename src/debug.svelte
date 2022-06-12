<script lang="ts">
  import { fly } from "svelte/transition";
  import { state } from "./main";
</script>

{#if $state.debug.show}
  <div
    transition:fly={{ duration: 400, x: 300 }}
    class="absolute bg-[#F8EFBA] m-2 border-4 ui-shadow right-0 w-1/5 ui-shadow p-5"
  >
    <div class="text-xl border-b-4 p-2">Debug</div>
    <div class="mt-4 border-b-2">Game</div>
    <div>FPS: {$state.fps}</div>
    <div class="mt-4 border-b-2">Player</div>
    <div>Vel</div>
    <div>X: {$state.debug.player.vel.x.toFixed(2)}</div>
    <div>Y: {$state.debug.player.vel.y.toFixed(2)}</div>
    <div>Pos</div>
    <div>X: {$state.debug.player.pos.x.toFixed(2)}</div>
    <div>Y: {$state.debug.player.pos.y.toFixed(2)}</div>
  </div>
{/if}
