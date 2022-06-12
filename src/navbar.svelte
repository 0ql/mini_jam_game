<script lang="ts">
  import { state } from "./main";
</script>

<nav class="w-full">
  <div
    class="bg-[#F8EFBA] m-2 border-4 ui-shadow p-3 flex justify-between items-center"
  >
    <div class="text-xl font-bold">Death Stranded</div>
    <div
      on:click={() => ($state.debug.show = !$state.debug.show)}
      class="border-4 cursor-pointer translate-[-0.1rem] ui-shadow hover:shadow-none hover:translate-[0.1rem] p-1"
    >
      Toggle Debug
    </div>
  </div>
</nav>
