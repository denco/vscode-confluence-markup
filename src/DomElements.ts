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
		return `{"tag"="${this.tag}","value"="${this.value}","closed"="${this.closed}", "attributes":[${Array.from(this.attributes.keys()).map((key) => { return `"${key}":"${this.attributes.get(key)}"` }).join(",")}
		]}`;
	}
}

export class Tag extends DomElement {
	public constructor(tag: string, re: Partial<DomElement> = {}) {
		super(tag, re);
	}
}

export class SpanTag extends DomElement {
	public constructor(re: Partial<DomElement> = {}) {
		super('span', re);
	}
}

export class DivTag extends DomElement {
	public constructor(re: Partial<DomElement> = {}) {
		super('div', re);
	}
}

export class ImgTag extends DomElement {
	public constructor(re: Partial<DomElement> = {}) {
		super('img', re);
		this.closed = false;
	}
}
