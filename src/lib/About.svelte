<script lang="ts">
	export let hideHandler: () => void;
</script>

<div id="about-page" class="overlay bounce-in-top">
	<button id="close" on:click={hideHandler}>X</button>
	<div class="va-outer">
		<div class="va-inner">
			<div class="container">
				<div id="about-content">
					<!-- svelte-ignore a11y-missing-content -->
					<a id="about-1up" href="https://1up.digital" target="_blank" />
					<!-- svelte-ignore a11y-missing-content -->
					<a id="about-swarm" href="https://www.ethswarm.org/" target="_blank" />
				</div>
			</div>
		</div>
	</div>
</div>
