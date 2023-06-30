<script lang="ts">
	export let showTermsHandler: () => void;
</script>

<div id="footer">
	<a class="mobile-only" id="powered-by-swarm" href="https://www.ethswarm.org/" target="_blank" />
</div>
<div id="terms" on:click={showTermsHandler}>Terms &amp; Conditions</div>
