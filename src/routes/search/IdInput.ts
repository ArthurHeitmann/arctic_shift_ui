
export enum IdCategory {
	post = "post",
	comment = "comment",
}

const categoryPrefixes = {
	[IdCategory.post]: "t3_",
	[IdCategory.comment]: "t1_"
};

export class IdInput {
	category: IdCategory|null;
	id: string;

	constructor(category: IdCategory|null, id: string) {
		this.category = category;
		this.id = id;
	}

	copyWithCategory(category: IdCategory): IdInput {
		return new IdInput(category, this.id);
	}

	copyWithId(id: string): IdInput {
		return new IdInput(this.category, id);
	}

	static fromIdStrings(idStrings: string, categoryHint: IdCategory|null = null): (IdInput|null)[] {
		const lines = idStrings
			.split(/[\s,]+/)
			.map(line => line.trim())
			.filter(line => line.length > 0);
		if (lines.length === 0) {
			return [null];
		}
		return lines.map(line => IdInput.fromIdString(line, categoryHint));
	}
	
	static fromIdString(idString: string, categoryHint: IdCategory|null = null): IdInput|null {
		// has prefix
		for (const [category, prefix] of Object.entries(categoryPrefixes)) {
			if (idString.startsWith(prefix)) {
				const id = idString.slice(prefix.length);
				return new IdInput(category as IdCategory, id);
			}
		}
		// comment link
		const commentIdMatch = idString.match(/\/comments\/\w+\/[^/?#]+\/(\w+)/);
		if (commentIdMatch) {
			const id = commentIdMatch[1];
			return new IdInput(IdCategory.comment, id);
		}
		// post link
		const postIdMatch = idString.match(/\/comments\/(\w+)/);
		if (postIdMatch) {
			const id = postIdMatch[1];
			return new IdInput(IdCategory.post, id);
		}
		// just id
		if (categoryHint && /^[a-zA-Z0-9]{1,10}$/.test(idString)) {
			return new IdInput(categoryHint, idString);
		}
		// unknown
		return null;
	}

	static fromIdStringAssert(idString: string, categoryHint: IdCategory|null = null): IdInput {
		const idInput = IdInput.fromIdString(idString, categoryHint);
		if (idInput === null) {
			throw new Error(`Invalid id string: ${idString}`);
		}
		return idInput;
	}

	static fromIdStringsAssert(idStrings: string, categoryHint: IdCategory|null = null): IdInput[] {
		const idInputs = IdInput.fromIdStrings(idStrings, categoryHint);
		if (idInputs.length === 0 || idInputs.some(idInput => idInput === null)) {
			throw new Error(`Invalid id strings: ${idStrings}`);
		}
		return idInputs as IdInput[];
	}

	toIdString(): string {
		if (this.category === null || this.id.length === 0) {
			return "";
		}
		return categoryPrefixes[this.category] + this.id;
	}
}
