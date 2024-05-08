<script lang="ts">
  import { ArrowFatUp } from "phosphor-svelte";

  let count: number = 0
  const increment = () => {
    count += 1
  }
</script>

<div color="green" id="ctr">
  <button on:click={increment}>
    count is {count}
  </button>
  <ArrowFatUp size="32" color="green" weight="fill" />
</div>
