import type { ArchiveStream } from "./archiveStream";
import { Notifier } from "./notifier";
import type { RedditCommentData, RedditPostData } from "./redditTypes";

export class CombinedArchiveStream {
	posts: ArchiveStream<RedditPostData>|null;
	comments: ArchiveStream<RedditCommentData>|null;
	onDoneChange: Notifier<boolean>;
	private lastIsDone: boolean = false;

	constructor(posts: ArchiveStream<RedditPostData>|null, comments: ArchiveStream<RedditCommentData>|null) {
		this.posts = posts;
		this.comments = comments;
		this.onDoneChange = new Notifier();
	}

	start() {
		this.posts?.onStateChange.addListener(this.onStreamStateChanged.bind(this));
		this.comments?.onStateChange.addListener(this.onStreamStateChanged.bind(this));
		return Promise.all([
			this.posts?.start(),
			this.comments?.start(),
		]);
	}

	tryAgain() {
		return Promise.all([
			this.posts?.tryAgain(),
			this.comments?.tryAgain(),
		]);
	}

	resume() {
		this.posts?.resume();
		this.comments?.resume();
	}

	pause() {
		this.posts?.pause();
		this.comments?.pause();
	}

	cancel() {
		return Promise.all([
			this.posts?.cancel(),
			this.comments?.cancel(),
		]);
	}

	private onStreamStateChanged() {
		let isDone: boolean;
		if (this.posts && this.comments)
			isDone = this.posts.isDone && this.comments.isDone;
		else if (this.posts)
			isDone = this.posts.isDone;
		else if (this.comments)
			isDone = this.comments.isDone;
		else
			isDone = false;
		
		if (isDone !== this.lastIsDone) {
			this.lastIsDone = isDone;
			this.onDoneChange.notify(isDone);
		}
	}
}
