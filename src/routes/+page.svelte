<script lang="ts">
	import { onMount } from 'svelte';
	import {
		configureWagmi,
		connected,
		disconnectWagmi,
		signerAddress,
		connection,
		loading,
		chainId,
		web3Modal,
		wagmiLoaded
	} from '$lib/stores/wagmi';

	import { postageStampAbi } from '$lib/abi';
	import { getContract, sendTransaction } from '@wagmi/core';

	import About from '$lib/components/About.svelte';
	import Terms from '$lib/components/Terms.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Paste from '$lib/components/Paste.svelte';

	import { create, getChunk, numPeers, numRelays, relays, type Session } from '$lib/waku';

	import { parseEther } from 'ethers';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import init, { ChunkInfo, get_chunk, get_chunk_info } from '@rndlabs/swarm-wasm-lib';

	let session: Session | undefined;
	let paste: Paste;

	let chunk: ChunkInfo | undefined;

	onMount(async () => {
		await configureWagmi();

		await init();

		// initialise the session
		session = await create();

		setTimeout(() => {
			document.getElementById('app')!!.classList.remove('loading');
		}, 100);
	});

	// // write a handler for the URL history, when the user browsers to a
	// // page without the /p/ prefix, we should reset the paste
	// function handleUrlChange() {
	// 	const url = window.location.pathname;
	// 	if (url === '/') {
	// 		paste.reset();
	// 	}
	// }

	// // handle the event of changing the URL
	// window.addEventListener('popstate', handleUrlChange);

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

	const retrievalRequest = async () => {
		chunk = await get_chunk(
			'0xc14deb22136c927f19942b2e45de5c25b65be4e95757731200dadd2b8dd0f1c8',
			async (chunk: string) => await getChunk(session?.waku!, chunk)
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
			{#if $numPeers > 0}
				<div id="connected">Connected to {$numPeers} peer(s)</div>
			{:else}
				<div id="disconnected" />
			{/if}
			{#if wagmiLoaded}
				<h1>Svelte Wagmi</h1>
				<p>
					Svelte Wagmi is a package that provides a collection of Svelte stores and functions for
					interacting with the Ethereum network. It utilizes the @wagmi/core library for connecting
					to Ethereum networks and signing transactions.
				</p>
				{#if $loading}
					<div>
						<span class="loader" />Waiting...
					</div>
				{:else if $connected}
					<p>{$signerAddress}</p>
					<p>chain ID: {$chainId}</p>
					<button on:click={disconnectWagmi}>disconnect</button>
				{:else}
					<p>not connected</p>
					<p>Connect With walletconnect</p>
					<button
						on:click={async () => {
							$loading = true;
							await $web3Modal.openModal();
							$loading = false;
						}}
					>
						{#if $loading}
							<span class="loader" />Connecting...
						{:else}
							connect
						{/if}
					</button>

					<p>Connect With InjectedConnector</p>
					<button
						on:click={async () => {
							$loading = true;
							await connection(100);
							$loading = false;

							const contract = getContract({
								address: '0x30d155478eF27Ab32A1D578BE7b84BC5988aF381',
								abi: postageStampAbi,
								chainId: 100
							});

							console.log(
								await contract.read.batches([
									'0x0e8366a6fdac185b6f0327dc89af99e67d9d3b3f2af22432542dc5971065c1df'
								])
							);

							const { hash } = await sendTransaction({
								to: '0x30d155478eF27Ab32A1D578BE7b84BC5988aF381',
								value: parseEther('0.01'),
								chainId: 100
							});

							// const { hash } = await writeContract(request)
						}}
					>
						{#if $loading}
							<span class="loader" />Connecting...
						{:else}
							connect
						{/if}
					</button>
				{/if}
			{:else}
				<h1>Svelte Wagmi Not Configured</h1>
			{/if}
			{#if chunk}
				<ImageViewer imageBytes={chunk.data} />
			{/if}
			{#if $numRelays > 0}
				<div id="connected">Connected to {$numRelays} relay(s)</div>
				<div>{JSON.stringify($relays)}</div>
				<div><button on:click={retrievalRequest}>Get chunk</button></div>
			{:else}
				<div id="disconnected" />
			{/if}
			<Paste bind:this={paste} />
		</div>
		<!-- .container -->
		<Footer showTermsHandler={showTerms} />
	</div>
	<!-- #wrap -->
</main>
