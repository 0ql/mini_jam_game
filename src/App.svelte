<script lang="ts">
  import Navbar from "./navbar.svelte";
</script>

<main>
  <Navbar />
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
</style>
