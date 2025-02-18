import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [sveltekit(), wasm()],
	optimizeDeps: {
        exclude: ['@rndlabs/swarm-wasm-lib']
    },
});
