import TimeDisplay from "./components/timedisplay/timedisplay.js"

let init = false
let table
let t1, t2
let generate
let audio

let filedrop = (event) => {
	event.preventDefault()
	for (let item of event.dataTransfer.items) {
		if (item.kind !== "file") return
		audio.src = URL.createObjectURL(item.getAsFile())
		audio.classList.remove("hidden")
		t2.classList.remove("hidden")
		t1.classList.add("hidden")
		if (!init) {
			init = true
		}
		return
	}
}

let addRow = _ => {
	if (!init) return;

	t2.classList.add("hidden")
	generate.classList.remove("hidden")

	let i = 1
	for (i; i < table.rows.length; i++) {
		let td = table.rows.item(i).cells.item(0).children[0]
		if (audio.currentTime < td.time) break
	}

	let row = table.insertRow(i)
	let timecell = row.insertCell(0)
	let time = new TimeDisplay(audio.currentTime)
	time.ontimechange = _ => rearrangeRow(row)
	timecell.appendChild(time)

	let namecell = row.insertCell(1)
	let name = document.createElement("input")
	name.type = "text"
	namecell.appendChild(name)

	let controlcell = row.insertCell(2)
	let remove = document.createElement("div")
	remove.classList.add("remove")
	remove.innerHTML = "X"
	remove.onclick = _ => table.deleteRow(row.rowIndex)
	controlcell.appendChild(remove)

	name.onkeydown = event => {
		event.stopPropagation()
		if (event.key === "Enter" || event.key === "ArrowDown") {
			let rowIndex = name.parentElement.parentElement.rowIndex
			if (rowIndex+1 !== table.rows.length) {
				table.rows[rowIndex+1].children[1].children[0].focus()
			} else if (event.key === "Enter") {
				name.blur()
			}
		} else if (event.key === "ArrowUp") {
			let rowIndex = name.parentElement.parentElement.rowIndex
			if (rowIndex-1 !== 0) {
				table.rows[rowIndex-1].children[1].children[0].focus()
			}
		}
	}
}

let rearrangeRow = (row) => {
	table.deleteRow(row.rowIndex)

	let i = 1
	for (i; i < table.rows.length; i++) {
		let td = table.rows.item(i).cells.item(0).children[0]
		if (row.cells.item(0).children[0].time < td.time) break
	}
	
	let newrow = table.insertRow(i)
	let timecell = newrow.insertCell(0)
	timecell.appendChild(row.cells.item(0).children[0])
	timecell.children[0].ontimechange = _ => rearrangeRow(newrow)
	let namecell = newrow.insertCell(1)
	namecell.appendChild(row.cells.item(1).children[0])
	let controlcell = newrow.insertCell(2)
	controlcell.appendChild(row.cells.item(2).children[0])
}

let generateFile = _ => {
	let timecode = ""

	let i = 1
	for (i; i < table.rows.length; i++) {
		let row = table.rows.item(i)
		timecode += row.cells.item(0).children[0].toString()
		timecode += " "
		timecode += row.cells.item(1).children[0].value
		timecode += "\n"
	}

	let blob = new Blob([timecode], {type: "text/plain"})
	let url = URL.createObjectURL(blob)
	let dl = document.createElement("a")
	dl.href = url
	dl.download = "timecode.txt"
	document.body.appendChild(dl)
	dl.click()
	document.body.removeChild(dl)
}

let keydown = event => {
	if (event.code !== "Space" && event.code !== "Enter") return

	addRow()

	event.preventDefault()
}

window.onload = _ => {
	table = document.querySelector("table")
	t1 = document.querySelector("#t1")
	t2 = document.querySelector("#t2")
	audio = document.querySelector("audio")
	generate = document.querySelector("#generate")

	audio.volume = 0.5
	audio.addEventListener("focus", e => e.target.blur())
	document.documentElement.addEventListener("drop", filedrop)
	document.documentElement.addEventListener("dragover", event => event.preventDefault())
	document.documentElement.addEventListener("keydown", keydown)
	generate.addEventListener("click", generateFile)
}