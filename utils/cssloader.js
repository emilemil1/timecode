export default class CssLoader {
	constructor(path) {
		this.path = path
		this.pre = this.prefetch()
	}

	prefetch() {
		let link = document.createElement("link")
		link.rel = "prefetch"
		link.type = "text/css"
		link.href = this.path
		document.head.appendChild(link)
		this.link = link
		return link
	}

	load(caller, tempStyle) {
		if (tempStyle === undefined) {
			tempStyle = /*css*/`
			:host {
				display: none;
			}
			`
		}

		this.tempStyle = document.createElement("style")
		this.tempStyle.innerHTML = tempStyle
		caller.shadowRoot.appendChild(this.tempStyle)

		let link = document.createElement("link")
		link.rel = "stylesheet"
		link.type = "text/css"
		link.href = this.path
		link.onload = _ => this.unlock()
	
		this.promise = new Promise(resolve => {
			this.resolve = resolve
		})
		
		caller.shadowRoot.appendChild(link)
	}

	unlock() {
		this.resolve()
		this.link.remove()
		setTimeout(_ => {
			this.tempStyle.remove()
		}, 500) 
	}

	wait() {
		if (this.promise) {
			return this.promise
		}
		return Promise.resolve()
	}
}