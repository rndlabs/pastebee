<script lang="ts">
	import stamper from "../stamper"

	let hasPaste = false;
	let pasteText: string;
	let url: string;
	let metadata: { name: String; size: number } | undefined;

	function clearPasteText() {
		pasteText = '';
	}

	export function reset() {
		pasteText = '';
		hasPaste = false;
		// goto(`/`);
	}

	function createPaste() {

		stamper();
		// 1. take the pasteText and break it into chunks
		// 2. upload each chunk to swarm
		// 3. get the bmt root hash
		console.log('createPaste was triggered');
		console.log(pasteText);
		// an example of a bmt root hash
		const bmtRootHash = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
		hasPaste = true;
		document.getElementById('texteditor')!!.textContent = pasteText;

		// assume HTML 5 browser and set the URL to /p/<bmtRootHash>
		url = `/p/${bmtRootHash}`;

		// set the url using pushState
		window.history.pushState({}, '', url);

		// goto(`/p/${bmtRootHash}`);

		metadata = undefined;
	}

	function copyUrl() {
		console.log('copyUrl was triggered');
	}
</script>

<div>
	{#if hasPaste}
		<input class="copy-input" id="copy-input-1" value={url} readonly />
		<button id="copy" on:click={copyUrl} />
		{#if metadata}
			<div class="metadata">
				<span class="name">{metadata.name}</span>
				<span class="size">{metadata.size}</span>
			</div>
		{/if}
	{/if}
	<div>
		<div
			contenteditable="true"
			id="texteditor"
			placeholder="Paste text here..."
			bind:innerText={pasteText}
		/>
		<button id="paste" on:click={createPaste} />
	</div>
</div>
