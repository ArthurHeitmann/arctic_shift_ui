<script lang="ts">
	import "$lib/default.scss";
	import TextField from "$lib/components/TextField.svelte";
    import OptionSelector from "$lib/components/OptionSelector.svelte";
    import type { RedditCommentData, RedditPostData } from "$lib/redditTypes";
    import RedditPost from "$lib/components/RedditPost.svelte";
    import RedditComment from "$lib/components/RedditComment.svelte";
	import homeSvg from "$lib/images/home.svg";

	enum Function {
		PostIds,
		CommentIds,
		PostsSearch,
		CommentsSearch,
	}

	let fun = Function.PostsSearch;
	// search parameters
	let subreddit = "";
	let author = "";
	let after = "";
	let before = "";
	let limit = "10";
	let sort: "asc"|"desc" = "desc";
	// post search parameters
	let over18: boolean|null = null;
	let spoiler: boolean|null = null;
	let title = ""
	let selftext = ""
	let url = "";
	// comment search parameters
	let linkId = "";
	let parentId = "";
	let body = "";

	let loading = false;
	let error: string|null = null;
	let posts: RedditPostData[]|null = null;
	let comments: RedditCommentData[]|null = null;

	function verifyLimit(limitStr: string): string|null {
		if (limitStr.length == 0)
			return null;
		const limit = Number(limitStr);
		if (isNaN(limit))
			return "Invalid number";
		if (limit < 1 || limit > 100)
			return "Must be between 1 and 100";
		return null;
	}

	async function search() {
		error = null;
		loading = true;
		const params = new URLSearchParams();
		let paramNames: [string, string][] = [];
		let endpoint: string;
		if (fun == Function.PostsSearch) {
			posts = null;
			endpoint = "posts";
			paramNames = [
				["subreddit", subreddit],
				["author", author],
				["after", after],
				["before", before],
				["limit", limit],
				["sort", sort],
				["over_18", over18 != null ? over18.toString() : ""],
				["spoiler", spoiler != null ? spoiler.toString() : ""],
				["title", title],
				["selftext", selftext],
				["url", url],
			];
		}
		else if (fun == Function.CommentsSearch) {
			comments = null;
			endpoint = "comments";
			paramNames = [
				["subreddit", subreddit],
				["author", author],
				["after", after],
				["before", before],
				["limit", limit],
				["sort", sort],
				["link_id", linkId],
				["parent_id", parentId],
				["body", body],
			];
		}
		else {
			error = "Not implemented";
			loading = false;
			return;
		}
		for (const [name, value] of paramNames) {
			if (value.length > 0)
				params.append(name, value);
		}
		params.append("md2html", "true");
		params.append("meta-app", "search-tool");
		
		const requestUrl = `https://arctic-shift.photon-reddit.com/api/${endpoint}/search?${params.toString()}`;
		try {
			const response = await fetch(requestUrl);
			let data;
			try {
				data = await response.json();
			} catch (e) {
				if (!response.ok) {
					error = `Error ${response.status} ${response.statusText}`;
					loading = false;
				}
				else {
					error = (e as Error).message;
					loading = false;
				}
				return;
			}
			if (data.error) {
				error = data.error;
				loading = false;
				return;
			}
			if (!data.data) {
				error = "No data";
				loading = false;
				return;
			}
			if (fun == Function.PostsSearch)
				posts = data.data;
			else if (fun == Function.CommentsSearch)
				comments = data.data;

		}
		catch (e) {
			error = (e as Error).message;
		}
		loading = false;
	}
</script>

<div class="search">
	<div class="parameters pane">
		<div class="row title-row">
			<h1>Search</h1>
			<a href="/" class="home-button">
				<img src={homeSvg} alt="home" />
			</a>
		</div>
		<p>
			Search for posts or comments. All filter parameters are optional.
		</p>
		<div class="gap"></div>
		<OptionSelector
			options={[
				{ value: Function.PostsSearch, label: "Posts Search" },
				{ value: Function.CommentsSearch, label: "Comments Search" },
				// { value: Function.PostIds, label: "Post IDs" },
				// { value: Function.CommentIds, label: "Comment IDs" },
			]}
			bind:selected={fun}
			expand={true}
		/>
		<div class="row">
			<TextField
				bind:text={subreddit}
				label="Subreddit"
				transform={(text) => text.replace(/^\/?r\//g, "")}
				getError={(text) => text.length == 0 || text.length >= 2 && text.match(/^[a-zA-Z0-9_\-]+$/) ? null : "Invalid subreddit"}
			/>
			<TextField
				bind:text={author}
				label="Author"
				transform={(text) => text.replace(/^\/?u(ser)?\//g, "")}
				getError={(text) => text.length == 0 || text.length >= 2 && text.match(/^[a-zA-Z0-9_\-]+$/) ? null : "Invalid author"}
			/>
		</div>
		<div class="row">
			<TextField
				bind:text={after}
				label="After (UTC)"
				type="datetime-local"
			/>
			<TextField
				bind:text={before}
				label="Before (UTC)"
				type="datetime-local"
			/>
		</div>
		<div class="row">
			<TextField
				bind:text={limit}
				label="Limit"
				type="number"
				min="1"
				max="100"
				getError={verifyLimit}
			/>
			<OptionSelector
				label="Date Sort"
				options={[
					{ value: "asc", label: "Ascending" },
					{ value: "desc", label: "Descending" },
				]}
				bind:selected={sort}
			/>
		</div>
		{#if fun === Function.PostsSearch}
			<div
				class="row"
				class:disabled-row={author.length == 0}
			>
				<TextField
					bind:text={title}
					label="Title (only with 'Author')"
				/>
				<TextField
					bind:text={selftext}
					label="Selftext (only with 'Author')"
				/>
			</div>
			<TextField
				bind:text={url}
				label="URL"
				transform={(text) => text.replace(/^\/?u(ser)?\//g, "")}
				getError={(text) => text.length == 0 || text.length > 2 && !text.match(/^[a-zA-Z0-9_]+$/) ? null : "Invalid URL"}
			/>
			<div class="row">
				<OptionSelector
					label="NSFW"
					options={[
						{ value: true, label: "Yes" },
						{ value: false, label: "No" },
					]}
					bind:selected={over18}
					canDeselect={true}
				/>
				<OptionSelector
					label="Spoiler"
					options={[
						{ value: true, label: "Yes" },
						{ value: false, label: "No" },
					]}
					bind:selected={spoiler}
					canDeselect={true}
				/>
			</div>
		{:else if fun === Function.CommentsSearch}
			<div class="row">
				<TextField
					bind:text={linkId}
					label="Link ID"
					transform={(text) => text.replace(/^t3_/, "")}
					getError={(text) => text.length == 0 || text.match(/^[a-z0-9]+$/) ? null : "Invalid Base36 ID"}
				/>
				<TextField
					bind:text={parentId}
					label="Parent Comment ID"
					transform={(text) => text.replace(/^t1_/, "")}
					getError={(text) => text.length == 0 || text.match(/^[a-z0-9]+$/) ? null : "Invalid Base36 ID"}
				/>
			</div>
			<div
				class="row"
				class:disabled-row={linkId.length == 0 && parentId.length == 0 && author.length == 0}
			>
				<TextField
					bind:text={body}
					label="Body (only with 'Author', 'Link ID' or 'Parent Comment ID')"
				/>
			</div>
		{/if}

		<div class="gap"></div>
	
		<div class="row">
			<div class="error">{error || ""}</div>
			<button
				class="search-button"
				disabled={loading}
				on:click={search}
			>Search</button>
		</div>
	</div>

	<div class="gap"></div>

	<div class="results">
		{#if fun === Function.PostsSearch && posts !== null}
			{#if posts.length == 0}
				<p>Nothing found o_O</p>
			{/if}
			{#each posts as post}
				<RedditPost data={post} />
			{/each}
		{:else if fun === Function.CommentsSearch && comments !== null}
			{#if comments.length == 0}
				<p>Nothing found o_O</p>
			{/if}
			{#each comments as comment}
				<RedditComment data={comment} />
			{/each}
		{/if}
	</div>
</div>

<style lang="scss">
	.search {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: min(100%, 50rem);
		margin: 1rem auto;
		padding: 1rem;
		font-size: 1.2rem;
	}

	.parameters {
		display: flex;
		flex-direction: column;
		// gap: .5rem;
	}

	.row {
		display: flex;
		flex-direction: row;
		@media (max-width: 600px) {
			flex-direction: column;
		}
		gap: .5rem;
		width: 100%;
	
		> :global(*) {
			flex: 1;
		}
	}

	.title-row {
		justify-content: space-between;
		
		> :global(*) {
			flex: initial;
		}
	}

	.disabled-row {
		opacity: .5;
		pointer-events: none;
	}

	.gap {
		height: 1rem;
	}

	.search-button {
		flex: 0;
		height: 2.5rem;
		line-height: 2.5rem;
		padding: 0 1rem;
		background: var(--bg-el2-color);
		border: 1px solid var(--border-color);
		border-radius: 2rem;
		font-size: 1.2rem;
		transition: background 0.25s ease;

		&:disabled {
			opacity: .5;
			pointer-events: none;
		}

		&:hover {
			background: var(--switcher-bg-hover);
		}

		&:active {
			background: var(--switcher-bg-active);
		}
	}

	.error {
		color: var(--error);
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
