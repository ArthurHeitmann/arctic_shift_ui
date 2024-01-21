<script>
	import "$lib/default.scss";
	import githubLogo from "$lib/images/github-mark-white.svg";
</script>

<svelte:head>
	<title>Arctic Shift</title>
	<meta name="description" content="Documentation and tools for the Arctic Shift project. Search or download archived reddit data.">
</svelte:head>

<div class="links">
	<div></div>
	<div class="center">
		<a href="https://github.com/ArthurHeitmann/arctic_shift" target="_blank">
			<img src={githubLogo} alt="GitHub logo" />
			<span>Documentation</span>
		</a>
		<a href="/download-tool">Download tool</a>
		<a href="/search">Search</a>
	</div>
	<div class="end">
		<a href="https://github.com/ArthurHeitmann/arctic_shift_ui" target="_blank">
			<img src={githubLogo} alt="GitHub logo" />
			<span>Source Code</span>
		</a>
	</div>
</div>

<style lang="scss">

.links {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;

	a {
		color: var(--text-color);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 2rem;
		font-size: 3rem;
		transform: translateX(0);
		transition: transform .5s ease, filter .2s ease;

		img + span {
			font-size: 2rem;
			transform: translateY(.3rem);
		}

		&:hover {
			transform: translateX(.5rem);
		}

		&:active {
			transform: translateX(.75rem);
		}
	}

	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		// justify-content: center;
		// flex-grow: 1;
		gap: 3rem;
		@media (max-height: 500px) {
			gap: 1rem;
		}
	}

	.end {
		margin-bottom: 3rem;
		@media (max-height: 500px) {
			margin-bottom: 0.5rem;
		}

		* {
			font-size: 1.35rem;
		}

		a {
			gap: 0.8rem;
		}

		img {
			width: 1.5rem;

			& + span {
				transform: translateY(0.1rem);
			}
		}
	}

}

</style>
