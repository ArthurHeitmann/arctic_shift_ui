<script lang="ts">
	interface Props {
		author: string;
		isOp?: boolean;
		distinguished?: string | null;
	}

	let { author, isOp = false, distinguished = null }: Props = $props();

	const isModerator = $derived(distinguished === "moderator");
	const isAdmin = $derived(distinguished === "admin");
</script>

<a
	href={`https://www.reddit.com/u/${author}`}
	target="_blank"
	class="author-link"
	class:op={isOp}
	class:mod={isModerator}
	class:admin={isAdmin}
>u/{author}</a>

<style lang="scss">
	.author-link {
		--author-link-text-color: var(--primary);
		--author-link-bg-color: var(--primary-contrast);
		--author-link-contrast-color: var(--text-on-primary);
		display: inline-flex;
		align-items: center;
		border-radius: 0.5rem;
		color: var(--author-link-text-color);

		&.mod {
			--author-link-text-color: var(--user-mod-color);
			--author-link-bg-color: var(--user-mod-bg);
		}

		&.admin {
			--author-link-text-color: var(--user-admin-color);
			--author-link-bg-color: var(--user-admin-bg);
		}

		&.op {
			padding: 0.1rem 0.45rem;
			background: var(--author-link-bg-color);
			color: var(--author-link-contrast-color);
		}
	}
</style>
