<script lang="ts">
	import { onMount } from 'svelte';

	import About from './lib/About.svelte';
	import Terms from './lib/Terms.svelte';
	import Footer from './lib/Footer.svelte';
	import Paste from './lib/Paste.svelte';

	let paste: Paste;

	onMount(() => {
		setTimeout(() => {
			document.getElementById('app').classList.remove('loading');
		}, 100);
	});

	// write a handler for the URL history, when the user browsers to a
	// page without the /p/ prefix, we should reset the paste
	function handleUrlChange() {
		const url = window.location.pathname;
		if (url === '/') {
			paste.reset();
		}
	}

	// handle the event of changing the URL
	window.addEventListener('popstate', handleUrlChange);

	const hideAnimation = (
		contentEl: HTMLElement,
		pageEl: HTMLElement,
		timeout: number,
		callback: () => void
	) => {
		if (!contentEl || !pageEl) {
			return;
		}

		contentEl.classList.add('rotate-out-center');
		pageEl.classList.add('fade-out');

		setTimeout(() => {
			if (!contentEl || !pageEl) {
				return;
			}
			callback();
			contentEl.classList.remove('rotate-out-center');
			pageEl.classList.remove('fade-out');
		}, timeout);
	};

	let showingAbout = false;
	let showingTerms = false;

	// --- about show / hide
	function showAbout() {
		showingAbout = true;
	}

	const hideAbout = () => {
		hideAnimation(
			document.getElementById('about-content')!!,
			document.getElementById('about-page')!!,
			1000,
			() => {
				showingAbout = false;
			}
		);
	};

	// --- terms show / hide
	function showTerms() {
		showingTerms = true;
	}

	const hideTerms = () => {
		hideAnimation(
			document.getElementById('terms-content')!!,
			document.getElementById('terms-page')!!,
			1000,
			() => {
				showingTerms = false;
			}
		);
	};
</script>

<main>
	<div id="wrap">
		<div class="container">
			<div id="header">
				<button on:click={paste.reset} id="new" />
				<div id="about" on:click={showAbout} />
				<a href="/"><img alt="logo" id="logo" src="images/logo.svg" /></a>
				<a
					class="desktop-only"
					id="powered-by-swarm"
					href="https://www.ethswarm.org/"
					target="_blank"
				/>
			</div>

			{#if showingTerms}<Terms hideHandler={hideTerms} />{/if}
			{#if showingAbout}<About hideHandler={hideAbout} />{/if}

			<Paste bind:this={paste} />
		</div>
		<!-- .container -->
		<Footer showTermsHandler={showTerms} />
	</div>
	<!-- #wrap -->
</main>
