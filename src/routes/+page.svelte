<script>
	import "$lib/default.scss";
	import githubLogo from "$lib/images/github-mark-white.svg";
</script>

<div class="links">
	<a href="https://github.com/ArthurHeitmann/arctic_shift" target="_blank">
		<img src={githubLogo} alt="GitHub logo" />
		<span>Documentation</span>
	</a>
	<a href="/download-tool">Download tool</a>
	<a href="/search">Search</a>
</div>

<style lang="scss">

.links {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3rem;

	* {
	}

	a {
		color: var(--text-color);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 2rem;
		font-size: 3rem;
		transform: translateX(0);
		transition: transform .5s ease;

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
}

</style>
