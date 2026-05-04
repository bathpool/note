import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import { getDatabase,
         ref,
         push,
         onValue,
         get,
         set,
         remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"
import { getAuth,
         signInWithPopup,
         signOut,
         onAuthStateChanged,
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

const MAX_NOTE_LENGTH = 5000
const MAX_NOTES_COUNT = 50

// DOM elements
const authContainer = document.querySelector('#auth-container')
const appContainer = document.querySelector('#app-container')
const signInBtn = document.querySelector('#signInBtn')
const signOutBtn = document.querySelector('#signOutBtn')
const userEmail = document.querySelector('#user-email')
const addBtn = document.querySelector('#addBtn')
const main = document.querySelector("#main")

let referenceInDB = null

// --- Authentication ---
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
        migrateOldNotes(user.uid).then(() => loadNotes())
    } else {
        authContainer.style.display = "flex"
        appContainer.style.display = "none"
        userEmail.textContent = ""
        referenceInDB = null
        main.innerHTML = ""
    }
})

// --- Notes functionality ---
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

    const notes = document.querySelectorAll(".note textarea")
    const data = []

    notes.forEach((note) => {
        const trimmed = note.value.trim()
        if (trimmed.length > 0) {
            data.push(trimmed.substring(0, MAX_NOTE_LENGTH))
        }
    })

    if (data.length === 0) {
        remove(referenceInDB)
    } else {
        set(referenceInDB, data)
    }
}

// Safe DOM construction — no innerHTML with user content (XSS prevention)
const addNote = (text = "") => {
    const noteCount = document.querySelectorAll(".note").length
    if (noteCount >= MAX_NOTES_COUNT) return

    const note = document.createElement("div")
    note.classList.add("note")

    const toolbar = document.createElement("div")
    toolbar.classList.add("tool")

    const saveIcon = document.createElement("i")
    saveIcon.classList.add("save", "fas", "fa-save")

    const trashIcon = document.createElement("i")
    trashIcon.classList.add("trash", "fas", "fa-trash")

    toolbar.appendChild(saveIcon)
    toolbar.appendChild(trashIcon)

    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.maxLength = MAX_NOTE_LENGTH

    trashIcon.addEventListener("click", () => {
        note.remove()
        saveNotes()
    })

    saveIcon.addEventListener("click", () => {
        saveNotes()
    })

    textarea.addEventListener("focusout", () => {
        saveNotes()
    })

    note.appendChild(toolbar)
    note.appendChild(textarea)
    main.appendChild(note)
}

// One-time migration: copy notes from old shared path to user-specific path
const migrateOldNotes = async (uid) => {
    const oldRef = ref(database, "notes")
    const userRef = ref(database, `notes/${uid}`)

    // Skip if user already has real notes (more than empty data)
    const userSnapshot = await get(userRef)
    if (userSnapshot.exists()) {
        const existing = userSnapshot.val()
        if (Array.isArray(existing) && existing.some(n => n && n.trim().length > 0)) {
            return // user has real notes, skip
        }
    }

    const oldSnapshot = await get(oldRef)
    if (oldSnapshot.exists()) {
        const oldData = oldSnapshot.val()
        let notesArray = []

        if (Array.isArray(oldData)) {
            notesArray = oldData.filter(n => n != null && typeof n === 'string')
        } else if (typeof oldData === 'object') {
            // Firebase may return object with numeric keys if array has gaps
            const values = Object.entries(oldData)
                .filter(([key]) => !isNaN(key)) // only numeric keys (old format)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([, val]) => val)
                .filter(v => typeof v === 'string' && v.trim().length > 0)
            notesArray = values
        }

        if (notesArray.length > 0) {
            await set(userRef, notesArray)
        }
    }
}

const loadNotes = () => {
    main.innerHTML = ""
    if (!referenceInDB) return

    get(referenceInDB).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val()
            if (data && Array.isArray(data)) {
                data.forEach((noteText) => {
                    addNote(noteText)
                })
            } else {
                addNote()
            }
        } else {
            addNote()
        }
    })
}

