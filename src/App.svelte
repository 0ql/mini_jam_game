<script lang="ts">
  import Debug from "./debug.svelte";

  import Navbar from "./navbar.svelte";
</script>

<main class="fixed h-screen w-screen overflow-hidden">
  <div class="absolute w-full h-full">
    <Navbar />
    <Debug />
  </div>
  <div
    class="flex justify-center items-center w-screen h-screen overflow-hidden"
    id="canvas"
  />
</main>

<style global>
  body {
    font-family: "depixelbold", sans-serif;
    margin: 0;
    padding: 0;
    background-color: #5cbeff;
  }
  .ui-shadow {
    box-shadow: 4px 4px rgba(0, 0, 0, 0.3);
  }
</style>
