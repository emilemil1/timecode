import TimeDisplay from "./components/timedisplay/timedisplay.js"

let init = false
let table
let t1, t2, editTip
let generate
let audio
let editing
let editIndicator

let loadTracklist = async file => {
	if (!init) return
	while (table.rows.length > 1) {
		table.deleteRow(1)
	}
	let text = await file.text()
	let rows = text.split("\n")
	audio.currentTime = 0
	for (let i = 0; i < rows.length; i++) {
		let row = rows[i]
		if (row.match(/^\d+\.? /)) {
			rows[i] = row.substring(row.indexOf(" ")+1)
		}
		addRow()
	}

	for (let i = 1; i < table.rows.length; i++) {
		table.rows[i].children[1].children[0].value = rows[i-1]
	}
}

let filedrop = (event) => {
	event.preventDefault()
	for (let item of event.dataTransfer.items) {
		if (item.kind !== "file") return
		if (item.type === "text/plain") {
			loadTracklist(item.getAsFile())
			return
		}
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
	name.onpaste = event => onPaste(event, i)
	namecell.appendChild(name)

	let controlcell = row.insertCell(2)
	let edit = document.createElement("div")
	edit.classList.add("edit")
	edit.innerHTML = "\u270E"
	edit.onclick = _ => editMode(i)
	controlcell.appendChild(edit)
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
	if (event.code === "Escape" && editing !== undefined) {
		editing = undefined
		editIndicator.parentElement.classList.add("hidden")
		editTip.classList.add("hidden")
	}
	if (event.code !== "Space" && event.code !== "Enter") return

	if (editing !== undefined) {
		setRow(audio.currentTime, editing)
		editTip.classList.add("hidden")
		if (editing !== table.rows.length - 1) {
			editing++
			editIndicator.style.setProperty("--editOffset", editing * 34 + "px")
		}
		else {
			editing = undefined
			editIndicator.parentElement.classList.add("hidden")
		}
	} else {
		addRow()
	}

	event.preventDefault()
}

window.onload = _ => {
	table = document.querySelector("table")
	t1 = document.querySelector("#t1")
	t2 = document.querySelector("#t2")
	editTip = document.querySelector("#edit-tip")
	audio = document.querySelector("audio")
	generate = document.querySelector("#generate")
	editIndicator = document.querySelector("#edit-indicator")

	audio.volume = 0.5
	audio.addEventListener("focus", e => e.target.blur())
	document.documentElement.addEventListener("drop", filedrop)
	document.documentElement.addEventListener("dragover", event => event.preventDefault())
	document.documentElement.addEventListener("keydown", keydown)
	generate.addEventListener("click", generateFile)
}

let editMode = index => {
	editing = index
	editTip.classList.remove("hidden")
	editIndicator.style.setProperty("--editOffset", index * 34 + "px")
	editIndicator.parentElement.classList.remove("hidden")

	return
}

let setRow = (value, row) => {
	table.rows[row].children[0].children[0].set(value)
}

let onPaste = (event, index) => {
	let text = event.clipboardData.getData('text');
	let rows = text.split("\n")
	if (rows.length > 1) event.preventDefault()
	else return
	for (let i = 0; i < rows.length; i++) {
		if (index > table.rows.length-1) break
		if (rows[i].match(/^\d+\.? /)) {
			rows[i] = rows[i].substring(rows[i].indexOf(" ")+1)
		}
		table.rows[index].children[1].children[0].value = rows[i]
		index++
	}
}