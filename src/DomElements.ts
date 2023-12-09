'use strict';

export abstract class DomElement {
	tag: string;
	value: string | undefined;
	attributes: Map<string, string> = new Map();
	closed: boolean = true;
	parent: DomElement | undefined;
	childs: Array<DomElement> = [];

	protected constructor(tag: string, re: Partial<DomElement> = {}) {
		Object.assign(this, re);
		this.tag = tag;
	}

	toString(): string {
		return `{"tag"="${this.tag}","value"="${this.value}","closed"="${this.closed}", "attributes":[${Array.from(this.attributes.keys())
			.map(key => {
				return `"${key}":"${this.attributes.get(key)}"`;
			})
			.join(',')}
		]}`;
	}
}

export class Tag extends DomElement {
	public constructor(tag: string, re: Partial<DomElement> = {}) {
		super(tag, re);
	}
}

export class SpanTag extends DomElement {
	public constructor(value?: string) {
		super('span', { value: value });
	}
}

export class ListTag extends DomElement {
	level: number;

	public constructor(tag: string, level: number, re: Partial<DomElement> = {}) {
		super(tag, re);
		this.level = level;
	}
}

export class ListItemTag extends ListTag {
	public constructor(level: number, re: Partial<DomElement> = {}) {
		super('li', level, re);
	}
}

export class DivTag extends DomElement {
	public constructor(re: Partial<DomElement> = {}) {
		super('div', re);
	}
}

export class PageDiv extends DivTag {
	public constructor() {
		super('div');
		this.attributes.set('class', 'page');
	}
}

export class ParagraphDiv extends DivTag {
	public constructor(parent: PageDiv) {
		super('div');
		this.attributes.set('class', 'paragraph');
		this.parent = parent;
	}
}

export class ImgTag extends DomElement {
	public constructor(alt: string, src: string) {
		super('img');
		this.closed = false;
		this.attributes.set('alt', alt);
		this.attributes.set('src', src);
	}
}
