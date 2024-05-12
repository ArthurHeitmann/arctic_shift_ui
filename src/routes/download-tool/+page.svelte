<script lang="ts">
	import { apiUrl } from "$lib/const";
	import DatePicker from "$lib/components/DatePicker.svelte";
	import type { DateState } from "$lib/components/datePickerTypes";
	import "./style.scss";
    import { CombinedArchiveStream } from "$lib/combinedArchiveStream";
    import { ArchiveStream } from "$lib/archiveStream";
    import type { RedditCommentData, RedditPostData } from "$lib/redditTypes";
    import { browser } from "$app/environment";
    import ArchiveStreamFeedback from "$lib/components/archiveStreamFeedback.svelte";
    import TextField from "$lib/components/TextField.svelte";
    import OptionSelector from "$lib/components/OptionSelector.svelte";
	import homeSvg from "$lib/images/home.svg";

	enum DownloadType {
		subreddit = "subreddit",
		user = "author",
	}
	const downloadTypeNames = {
		[DownloadType.subreddit]: "Subreddit",
		[DownloadType.user]: "User",
	};
	let isSupported = !browser || typeof showSaveFilePicker === "function";
	let downloadType = DownloadType.subreddit;
	let name = "";
	let isNameValid = false;
	let startDate: Date|null = new Date("2005-01-01T00:00:00.000Z");
	let endDate: Date|null = null;
	let downloadPosts = true;
	let downloadComments = true;
	let archiveStream: CombinedArchiveStream|null = null;
	let isRunning = false;
	let stateIsChanging = false;
	let isDone = false;
	let isCancelling = false;

	let error: string|null = null;
	function onError(e: Error) {
		console.error(e);
		error = e.message;
		throw e;
	}

	function setDownloadType(type: DownloadType) {
		if (downloadType === type)
			return;
		downloadType = type;
		name = "";
	}

	async function loadStartDate() {
		if (name.length < 2)
			onError(new Error("Name must be at least 2 characters long"));
		const response = await fetch(`${apiUrl}/api/utils/min?${downloadType}=${name}`);
		const data = await response.json();
		if (data.error)
			onError(new Error(data.error));
		if (data.data === null)
			onError(new Error("Subreddit or user not found"));
		error = null;
		const newDate = new Date(Date.parse(data.data) - 1);
		newDate.setHours(0, 0, 0, 0);
		startDate = newDate;
		isNameValid = true;
	}

	async function start() {
		if (!downloadPosts && !downloadComments)
			onError(new Error("Please select at least one of posts or comments"));
		let postsStream: ArchiveStream<RedditPostData>|null = null;
		let commentsStream: ArchiveStream<RedditCommentData>|null = null;
		const filePrefix = { [DownloadType.subreddit]: "r_", [DownloadType.user]: "u_", }[downloadType] + name;
		const endDateCondition = endDate ? `&before=${endDate.getTime()}` : "";
		if (downloadPosts) {
			const fileHandle = await window.showSaveFilePicker({
				suggestedName: `${filePrefix}_posts.jsonl`,
				types: [{
					description: "JSON Lines",
					accept: { "application/json": [".jsonl"] },
				}],
				id: "reddit-archive-tool",
			});
			const baseUrl = `${apiUrl}/api/posts/search?${downloadType}=${name}${endDateCondition}`;
			postsStream = new ArchiveStream(baseUrl, startDate!.getTime(), fileHandle);
		}
		if (downloadComments) {
			const fileHandle = await window.showSaveFilePicker({
				suggestedName: `${filePrefix}_comments.jsonl`,
				types: [{
					description: "JSON Lines",
					accept: { "application/json": [".jsonl"] },
				}],
				id: "reddit-archive-tool",
			});
			const baseUrl = `${apiUrl}/api/comments/search?${downloadType}=${name}${endDateCondition}`;
			commentsStream = new ArchiveStream(baseUrl, startDate!.getTime(), fileHandle);
		}
		archiveStream = new CombinedArchiveStream(postsStream, commentsStream);
		archiveStream.onDoneChange.addListener(onDoneChange);
		archiveStream.start();
		isRunning = true;
		isDone = false;
	}

	async function cancel() {
		if (!confirm("Are you sure you want to cancel?"))
			return;
		if (isCancelling)
			return;
		isCancelling = true;
		await archiveStream?.cancel();
		archiveStream?.onDoneChange.removeListener(onDoneChange);
		isCancelling = false;
		archiveStream = null;
		isRunning = false;
		isDone = false;
	}

	async function pause() {
		try {
			stateIsChanging = true;
			await archiveStream?.pause();
			isRunning = false;
		} finally {
			stateIsChanging = false;
		}
	}

	async function resume() {
		try {
			stateIsChanging = true;
			await archiveStream?.resume();
			isRunning = true;
		} finally {
			stateIsChanging = false;
		}
	}

	async function tryAgain() {
		await archiveStream?.tryAgain();
		isRunning = true;
	}

	function reset() {
		archiveStream?.onDoneChange.removeListener(onDoneChange);
		archiveStream = null;
		isRunning = false;
		isDone = false;
	}

	function onDoneChange(newIsDone: boolean) {
		isDone = newIsDone;
	}
</script>

<svelte:head>
	<title>Download subreddit or user data</title>
	<meta name="description" content="Download all reddit posts and comments from a subreddit or user." />
</svelte:head>

<div class="download-tool">
	<div class="controls pane">
		<div class="row title-row">
			<h1>Download tool</h1>
			<a href="/" class="home-button">
				<img src={homeSvg} alt="home" />
			</a>
		</div>
		<p>
			Download posts and comments from a subreddit or user. Very large subreddits can take a long time to download.
			In that case, you can maybe narrow down the time range. Alternatively, you can download 
			<a href="https://academictorrents.com/details/56aa49f9653ba545f48df2e33679f014d2829c10" target="_blank">subreddit dumps through Academic Torrents</a>
			or <a href="https://github.com/ArthurHeitmann/arctic_shift" target="_blank">monthly dumps</a>.
		</p>
		{#if !isSupported}
			<div class="error big">
				Please use a new version of Chrome, Edge or Opera to use this tool.
				<a href="https://caniuse.com/?search=showOpenFilePicker%20" target="_blank">(See browser support)</a>
			</div>
		{/if}
		<div class="row">
			<OptionSelector
				options={[
					{ value: DownloadType.subreddit, label: "r/" },
					{ value: DownloadType.user, label: "u/" },
				]}
				bind:selected={downloadType}
			/>
			<TextField
				bind:text={name}
				onChange={loadStartDate}
				on:input={() => isNameValid = false}
				placeholder={`${downloadTypeNames[downloadType]} name`}
			/>
		</div>

		<div class="row">
			<DatePicker
				label="Start date"
				onChange={(state) => (startDate = state)}
				date={startDate}
				allowNow={false}
			/>
			<div class="spacer"></div>
			<DatePicker
				label="End date"
				onChange={(state) => (endDate = state)}
				date={endDate}
				allowNow={true}
			/>
		</div>

		<div class="row">
			<input
				type="checkbox"
				id="download-posts"
				bind:checked={downloadPosts}
			/>
			<label for="download-posts"></label>
			<label for="download-posts">
				Download posts
			</label>
			<div class="spacer"></div>
			<input
				type="checkbox"
				id="download-comments"
				bind:checked={downloadComments}
			/>
			<label for="download-comments"></label>
			<label for="download-comments">
				Download comments
			</label>
		</div>

		<div class="spacer"></div>

		<div class="row">
			{#if archiveStream === null}
				<button
					class="main-action primary"
					on:click={start}
					disabled={!isSupported || !isNameValid}
				>Start</button>
			{:else if isDone}
				{#if archiveStream.posts?.hasError || archiveStream.comments?.hasError}
					<button
						class="main-action primary"
						on:click={tryAgain}
						disabled={isCancelling || stateIsChanging}
					>Try again</button>
				{/if}
				<button
					class="main-action primary"
					on:click={reset}
				>New download</button>
			{:else}
				{#if isRunning}
					<button
						class="main-action primary"
						on:click={pause}
						disabled={isCancelling || stateIsChanging}
					>Pause</button>
				{:else}
					<button
						class="main-action primary"
						on:click={resume}
						disabled={isCancelling || stateIsChanging}
					>Resume</button>
				{/if}
				<button
					class="main-action secondary"
					on:click={cancel}
					disabled={isCancelling || stateIsChanging}
				>Cancel</button>
				{/if}
			</div>

		{#if error}
			<div class="error">
				{error}
			</div>
		{/if}
	</div>

	<div class="feedback">
		{#if archiveStream?.posts}
			<ArchiveStreamFeedback
				name="Post"
				archiveStream={archiveStream.posts}
				endDate={endDate}
			/>
		{/if}
		{#if archiveStream?.comments}
			<ArchiveStreamFeedback
				name="Comment"
				archiveStream={archiveStream.comments}
				endDate={endDate}
			/>
		{/if}
	</div>
</div>
