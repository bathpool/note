import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import { getDatabase,
         ref,
         push,
         onValue,
         remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

const firebaseConfig = {
    databaseURL: "https://leads-tracker-app-b400c-default-rtdb.firebaseio.com/"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const referenceInDB = ref(database, "notes")




const addBtn = document.querySelector('#addBtn');
const main = document.querySelector("#main");
addBtn.addEventListener(
    "click", function(){
        addNote()
    }
)


const saveNotes = () => {
    //select all textareas inside elements with class "note"
    //notes is an object of nodeList
    //nodelist is similar to array, but created by document.querySelectorAll
    const notes = document.querySelectorAll(".note textarea");

    const data = [];
    //console.log(notes);
    notes.forEach(
        //it is callback function, and node will be passed as argument to it
        (note) => { 
            data.push(note.value)
        }
    )
        if(data.length === 0){
            //localStorage.removeItem("notes")
            remove(referenceInDB)
        }else{
            //localStorage.setItem("notes",JSON.stringify(data))
            push(referenceInDB, data)
        }
    
}
//  <div class="note">
// <div class="tool">
//     <i class="fas fa-save" ></i>
//     <i class="fas fa-trash" ></i>
// </div>
// <textarea></textarea>
// </div>  

//(text = "") => {}  => default argument for parameter text is ""
//arrow function
const addNote = (text = "") => {
    const note = document.createElement("div");
    //inheriting class "note" to div
    note.classList.add("note")
    note.innerHTML = `
    
    <div class="tool">
        <i class="save fas fa-save" ></i>
         <i class="trash fas fa-trash" ></i>
     </div>
     <textarea>${text}</textarea> 
    
    `;
    note.querySelector(".trash").addEventListener("click",function(){
        note.remove()
        saveNotes()
    }
 )
    note.querySelector(".save").addEventListener("click",function(){
        saveNotes()
    })
    note.querySelector("textarea").addEventListener(
        "focusout",
        function() {
            saveNotes()
        }
    )
    main.appendChild(note);
    saveNotes()
}

//self invoking function
(
    function(){
    
    //load notes as an array from local storage  
    //const lsNotes =JSON.parse(localStorage.getItem("notes"));
    const lsNotes = onValue(referenceInDB, function(snapshot) {
        const snapshotDoesExist = snapshot.exists()
        if (snapshotDoesExist) {
            const snapshotValues = snapshot.val()
            console.log(snapshotValues)
            console.log(Object.values(snapshotValues))
            return Object.values(snapshotValues)
 
        }
    })

    if(lsNotes === null){
        addNote()
    }else
       { lsNotes.forEach(
            (lsNote) => {
                addNote(lsNote[0].value)
            }
        )
    }
        }
)()

