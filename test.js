import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import { getDatabase,
         ref,
         push,
         set,
         get,
         remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

const firebaseConfig = {
    databaseURL: "https://leads-tracker-app-b400c-default-rtdb.firebaseio.com/"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const referenceInDB = ref(database, "notes")

let data = ["hello", "hello2", "hello3"]

//remove(referenceInDB)
set(referenceInDB, data)

let temp = null

get(referenceInDB).then(
    (snapshot) => {
        if(snapshot.exists()){
            //console.log(snapshot.val())
            temp = snapshot.val()
            log(temp)
                }
          
        }
    )

function log(){
    console.log(temp)
}