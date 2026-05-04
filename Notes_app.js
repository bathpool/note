import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import { getDatabase,
         ref,
         get,
         set,
         remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"
import { getAuth,
         signInWithPopup,
         signOut,
         onAuthStateChanged,
         browserLocalPersistence,
         setPersistence,
         GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"

const firebaseConfig = {
    apiKey: "AIzaSyBPHMJrq0NBbykKUYapyjdT8ku8mipu9uo",
    authDomain: "leads-tracker-app-b400c.firebaseapp.com",
    databaseURL: "https://leads-tracker-app-b400c-default-rtdb.firebaseio.com/",
    projectId: "leads-tracker-app-b400c"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

setPersistence(auth, browserLocalPersistence)

const MAX_NOTE_LENGTH = 50000
const MAX_NOTES_COUNT = 50
const MAX_IMAGES_PER_NOTE = 5
const MAX_IMAGE_WIDTH = 800
const MAX_NOTE_SIZE_BYTES = 3 * 1024 * 1024

const authContainer = document.querySelector('#auth-container')
const appContainer = document.querySelector('#app-container')
const signInBtn = document.querySelector('#signInBtn')
const signOutBtn = document.querySelector('#signOutBtn')
const userEmail = document.querySelector('#user-email')
const addBtn = document.querySelector('#addBtn')
const main = document.querySelector("#main")

let referenceInDB = null

signInBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Sign-in error:", error.message)
    })
})

signOutBtn.addEventListener("click", () => {
    signOut(auth).catch((error) => {
        console.error("Sign-out error:", error.message)
    })
})

onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = "none"
        appContainer.style.display = "block"
        userEmail.textContent = user.email
        referenceInDB = ref(database, `notes/${user.uid}`)
        loadNotes()
    } else {
        authContainer.style.display = "flex"
        appContainer.style.display = "none"
        userEmail.textContent = ""
        referenceInDB = null
        main.innerHTML = ""
    }
})

addBtn.addEventListener("click", () => {
    const noteCount = document.querySelectorAll(".note").length
    if (noteCount >= MAX_NOTES_COUNT) {
        alert(`Maximum of ${MAX_NOTES_COUNT} notes reached.`)
        return
    }
    addNote()
})

const saveNotes = () => {
    if (!referenceInDB) return

    const editors = document.querySelectorAll(".note .note-content")
    const data = []

    editors.forEach((editor) => {
        const html = editor.innerHTML.trim()
        if (html.length > 0 && html !== "<br>") {
            data.push(html)
        }
    })

    if (data.length === 0) {
        remove(referenceInDB)
    } else {
        const totalSize = new Blob(data).size
        if (totalSize > MAX_NOTE_SIZE_BYTES) {
            alert("Notes are too large. Try removing some images.")
            return
        }
        set(referenceInDB, data)
    }
}

// Compress image to max width and return base64 data URL
const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let width = img.width
                let height = img.height

                if (width > MAX_IMAGE_WIDTH) {
                    height = (height * MAX_IMAGE_WIDTH) / width
                    width = MAX_IMAGE_WIDTH
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL("image/jpeg", 0.7))
            }
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })
}

// Sanitize HTML — only allow safe tags
const sanitizeHTML = (html) => {
    const div = document.createElement("div")
    div.innerHTML = html

    const clean = (node) => {
        const children = Array.from(node.childNodes)
        children.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) return
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase()
                if (tag === "img") {
                    // Only allow data: URLs and https: URLs for src
                    const src = child.getAttribute("src") || ""
                    if (!src.startsWith("data:image/") && !src.startsWith("https://")) {
                        child.remove()
                        return
                    }
                    // Remove all attributes except src
                    const safeSrc = child.getAttribute("src")
                    Array.from(child.attributes).forEach(attr => child.removeAttribute(attr.name))
                    child.setAttribute("src", safeSrc)
                } else if (tag === "br" || tag === "div") {
                    clean(child)
                } else {
                    // Replace unsafe element with its text content
                    const text = document.createTextNode(child.textContent)
                    node.replaceChild(text, child)
                    return
                }
            } else {
                child.remove()
            }
        })
    }

    clean(div)
    return div.innerHTML
}

const addNote = (content = "") => {
    const noteCount = document.querySelectorAll(".note").length
    if (noteCount >= MAX_NOTES_COUNT) return

    const note = document.createElement("div")
    note.classList.add("note")

    const toolbar = document.createElement("div")
    toolbar.classList.add("tool")

    const imageBtn = document.createElement("i")
    imageBtn.classList.add("image-btn", "fas", "fa-image")
    imageBtn.title = "Add image"

    const saveIcon = document.createElement("i")
    saveIcon.classList.add("save", "fas", "fa-save")

    const trashIcon = document.createElement("i")
    trashIcon.classList.add("trash", "fas", "fa-trash")

    toolbar.appendChild(imageBtn)
    toolbar.appendChild(saveIcon)
    toolbar.appendChild(trashIcon)

    const editor = document.createElement("div")
    editor.classList.add("note-content")
    editor.contentEditable = "true"

    // Set content — handle both old plain text and new HTML format
    if (content.includes("<") && (content.includes("<img") || content.includes("<div") || content.includes("<br"))) {
        editor.innerHTML = sanitizeHTML(content)
    } else {
        editor.textContent = content
    }

    // Hidden file input for image picker
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.style.display = "none"

    // Image button click — open file picker
    imageBtn.addEventListener("click", () => {
        const imgCount = editor.querySelectorAll("img").length
        if (imgCount >= MAX_IMAGES_PER_NOTE) {
            alert(`Maximum of ${MAX_IMAGES_PER_NOTE} images per note.`)
            return
        }
        fileInput.click()
    })

    // File picker change
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0]
        if (!file || !file.type.startsWith("image/")) return
        const dataUrl = await compressImage(file)
        const img = document.createElement("img")
        img.src = dataUrl
        editor.appendChild(img)
        saveNotes()
        fileInput.value = ""
    })

    // Paste handler for images
    editor.addEventListener("paste", async (e) => {
        const items = e.clipboardData?.items
        if (!items) return

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault()
                const imgCount = editor.querySelectorAll("img").length
                if (imgCount >= MAX_IMAGES_PER_NOTE) {
                    alert(`Maximum of ${MAX_IMAGES_PER_NOTE} images per note.`)
                    return
                }
                const file = item.getAsFile()
                const dataUrl = await compressImage(file)
                const img = document.createElement("img")
                img.src = dataUrl
                editor.appendChild(img)
                saveNotes()
                return
            }
        }
    })

    trashIcon.addEventListener("click", () => {
        note.remove()
        saveNotes()
    })

    saveIcon.addEventListener("click", () => {
        saveNotes()
    })

    editor.addEventListener("blur", () => {
        saveNotes()
    })

    note.appendChild(toolbar)
    note.appendChild(editor)
    note.appendChild(fileInput)
    main.appendChild(note)
}

const loadNotes = () => {
    main.innerHTML = ""
    if (!referenceInDB) return

    get(referenceInDB).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val()
            if (data && Array.isArray(data)) {
                data.forEach((noteContent) => {
                    addNote(noteContent)
                })
            } else {
                addNote()
            }
        } else {
            addNote()
        }
    })
}
