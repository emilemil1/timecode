import CssLoader from "../../utils/cssloader.js"

let css = new CssLoader("components/timedisplay/timedisplay.css")
export default class TimeDisplay extends HTMLElement {
	constructor(time) {
		super()
		this.init(time)

		this.displayHours = time > 216000;
		this.ranges = [1, time > 600 ? 2 : 1, 2, 2]
		this.max = [this.displayHours ? [9] : [0], time > 600 ? [5,9] : [9], [5,9], [9,9]]

		this.construct()
	}

	init(seconds) {
		this.time = seconds

		this.hours = Math.floor(seconds / 3600)
		seconds = seconds % 3600

		this.minutes = Math.floor(seconds / 60)
		seconds = seconds % 60

		this.seconds = Math.floor(seconds)

		this.milliseconds = Math.floor((seconds - this.seconds) * 1000)
	}

	async construct() {
		let resolver
		this.loaded = new Promise(resolve => resolver = resolve)

		const shadow = this.attachShadow({mode: "open"})
		
		shadow.innerHTML = /*html*/`
		<input size=1 type="text" class="hour${this.displayHours ? '' : ' hidden'}" value="${this.getHours()}">
		<span class="noselect">${this.displayHours ? ":" : ""}</span>
		<input size=${this.ranges[1]} type="text" class="minute" style="width: ${this.ranges[1]}ch;" value="${this.getMinutes()}">
		<span class="noselect">:</span>
		<input size=2 type="text" class="second" value="${this.getSeconds()}">
		<span class="noselect">.</span>
		<input size=${this.ranges[3]} type="text" class="millisecond" style="width: ${this.ranges[3]}ch;" value="${this.getMilliseconds()}">
		`.replace(/[\n\t]/g,"")

		css.load(this)
		await css.wait()

		this.hourElement = shadow.children[0]
		this.minuteElement = shadow.children[2]
		this.secondElement = shadow.children[4]
		this.millisecondElement = shadow.children[6]
		this.elements = [this.hourElement, this.minuteElement, this.secondElement, this.millisecondElement]

		this.bind()
		resolver()
	}

	set(time) {
		this.init(time)
		this.elements[0].value = this.getHours()
		this.elements[1].value = this.getMinutes()
		this.elements[2].value = this.getSeconds()
		this.elements[3].value = this.getMilliseconds()
	}

	bind() {
		let index = 0;
		for (let element of this.elements) {
			let i = index;
			element.onmousedown = event => this.click(event, i)
			element.onkeydown = event => this.typeCommand(event, i)
			index++
		}
	}

	getHours() {
		if (this.displayHours) return this.hours.toString()
		else return ""
	}

	getMinutes() {
		return this.minutes.toString().padStart(this.ranges[1], "0")
	}

	getSeconds() {
		return this.seconds.toString().padStart(2, "0")
	}

	getMilliseconds() {
		return this.milliseconds.toString().substring(0,this.ranges[3]).padStart(this.ranges[3], "0")
	}

	setHoursRange(range) {
		this.ranges[1] = range
		this.max[1] = range === 2 ? 59 : 9
		this.minuteElement.size = range
		this.minuteElement.style = "width: ${this.ranges[1]}ch;"
	}

	click(event, index) {
		if (this.elements[index] !== this.shadowRoot.activeElement) {
			this.elements[index].setSelectionRange(0,this.ranges[index])
			event.preventDefault()
		}
		this.elements[index].focus()
	}

	type(event, index) {
		if (this.elements[index].selectionStart === this.ranges[index]) {
			if (index < 3) {
				this.elements[index+1].setSelectionRange(0,0)
				this.elements[index+1].focus()
			}
			else {
				this.elements[index].blur()
				this.timechange()
			}
			return
		}
		let key = event.key
		if (parseInt(event.key) > this.max[index][this.elements[index].selectionStart]) key = this.max[index][this.elements[index].selectionStart]
		this.elements[index].setRangeText(key, this.elements[index].selectionStart, this.elements[index].selectionStart+1, "end")
		this.setTime(index)
		if (this.elements[index].selectionStart === this.ranges[index]) {
			if (index < 3) {
				this.elements[index+1].setSelectionRange(0,0)
				this.elements[index+1].focus()
			}
			else {
				this.elements[index].blur()
				this.timechange()
			}
		}
	}

	typeCommand(event, index) {
		event.preventDefault()
		event.stopPropagation()
		if (!isNaN(parseInt(event.key))) {
			this.type(event, index)
			return
		}
		
		if (event.key === "ArrowLeft") {
			if (this.elements[index].selectionStart !== 0) {
				this.elements[index].setSelectionRange(this.elements[index].selectionStart-1,this.elements[index].selectionStart)
			} else if (index !== 0) {
				this.elements[index-1].setSelectionRange(this.ranges[index-1]-1,this.ranges[index-1])
				this.elements[index-1].focus()
			} 
		} else if (event.key === "ArrowRight") {
			if (this.elements[index].selectionStart !== this.ranges[index]-1) {
				this.elements[index].setSelectionRange(this.elements[index].selectionStart+1,this.elements[index].selectionStart+2)
			} else if (index !== 3) {
				this.elements[index+1].setSelectionRange(0,1)
				this.elements[index+1].focus()
			} 
		} else if (event.key === "ArrowUp") {
			let selectionStart = this.elements[index].selectionStart
			let selectionEnd = this.elements[index].selectionEnd
			let val = parseInt(this.elements[index].value.substring(0, this.elements[index].selectionEnd)) + 1
			val = val * Math.pow(10,(this.ranges[index] - selectionEnd))
			let total = val + parseInt("0" + this.elements[index].value.substring(this.elements[index].selectionEnd))
			this.setValue(total, index)
			this.elements[index].setSelectionRange(selectionStart, selectionEnd)
		} else if (event.key === "ArrowDown") {
			let selectionStart = this.elements[index].selectionStart
			let selectionEnd = this.elements[index].selectionEnd
			let val = parseInt(this.elements[index].value.substring(0, this.elements[index].selectionEnd)) - 1
			val = val * Math.pow(10,(this.ranges[index] - selectionEnd))
			let total = val + parseInt("0" + this.elements[index].value.substring(this.elements[index].selectionEnd))
			this.setValue(total, index)
			this.elements[index].setSelectionRange(selectionStart, selectionEnd)
		} else if (event.key === "Enter") {
			if (index === 3) {
				this.elements[index].blur()
				this.timechange()
			}
			else {
				this.elements[index+1].select()
				this.elements[index+1].focus()
			}
		}
	}

	setValue(value, index) {
		if (isNaN(value)) return false
		if (value > parseInt(this.max[index].join(""))) {
			if (index === 0) return false
			if (this.setValue(parseInt(this.elements[index-1].value)+1, index-1)) this.elements[index].value = (value - parseInt(this.max[index].join("")) - 1).toString().padStart(this.ranges[index], "0")
			else return false
		} else if (value < 0) {
			if (index === 0) return false
			if (this.setValue(parseInt(this.elements[index-1].value)-1, index-1)) this.elements[index].value = ((parseInt(this.max[index].join(""))+1) + value).toString().padStart(this.ranges[index], "0")
			else return false
		} else {
			this.elements[index].value = value.toString().padStart(this.ranges[index], "0")
		}
		
		this.setTime(index)

		return true
	}

	setTime(index) {
		if (index === 0) {
			this.hours = parseInt(this.elements[index].value)
		} else if (index === 1) {
			this.minutes = parseInt(this.elements[index].value)
		} else if (index === 2) {
			this.seconds = parseInt(this.elements[index].value)
		} else if (index === 3) {
			this.milliseconds = parseInt(this.elements[index].value + "0")
		}
	}

	timechange() {
		let newtime = this.hours * 3600 + this.minutes * 60 + this.seconds + this.milliseconds * 0.001
		if (newtime !== this.time) {
			this.time = newtime
			if (this.ontimechange) this.ontimechange()
		}
	}

	toString() {
		let string = ""
		string += this.hours
		string += ":"
		string += this.minutes.toString().padStart(2, "0")
		string += ":"
		string += this.seconds.toString().padStart(2, "0")
		string += "."
		string += this.milliseconds.toString().padStart(3, "0")

		return string
	}
}
customElements.define("time-display", TimeDisplay)