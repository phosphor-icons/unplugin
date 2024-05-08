<script lang="ts">
	import { Horse, Heart } from "phosphor-svelte"

	let count = 0;

	function add() {
		count += 1;
	}

	function subtract() {
		count -= 1;
	}
</script>

<div class="counter">
	<button on:click={subtract}><Horse size="{32}" /></button>
	<pre>{count}</pre>
	<button on:click={add}><Heart color="#AE2984" weight="fill" size="{32}" /></button>
</div>
<div class="message">
	<slot />
	<Heart color="red" weight="duotone" size="{24}" />
</div>

<style>
	.counter {
		display: grid;
		font-size: 2em;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: 2em;
		place-items: center;
	}

	.message {
		text-align: center;
	}
</style>
