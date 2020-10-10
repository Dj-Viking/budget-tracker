let dbDYN;
console.log(sw);

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = event => {
  //reference to the indexedDB
  console.log("========== ON UPGRADE NEEDED ==========");
  console.log(event.target);
  console.log(event.target.result);
  const db = event.target.result;
  //create object store
  db.createObjectStore('new_transact', { autoIncrement: true });
};

request.onsuccess = event => {
  console.log("==========  INDEXEDDB CREATED SUCCESS ==========");
  //when db is successfully created with the object store
  dbDYN = event.target.result;
  if (navigator.onLine) {
    uploadTransact();
  }
};


request.onerror = event => {
  //log error 
  //console.log("========== ON ERROR ==========");
  console.log(event.target.errorCode);
};


//function for when the post request in index.js fails
//item is saved into indexedDB
saveRecord = record => {
  //open a transaction with the indexedDB with readwrite permission
  const transaction = dbDYN.transaction([ 'new_transact' ], 'readwrite');
  //access object store
  const transactObjectStore = transaction.objectStore('new_transact');
  //save record to object store
  transactObjectStore.add(record);
  //show and hide success message with a microtask
}

//function to prep and release item when back online
const uploadTransact = () => {
  //open transaction with indexedDB with readwrite permissions
  const transaction = dbDYN.transaction([ 'new_transact' ], 'readwrite');
  //access object store
  const transactObjectStore = transaction.objectStore('new_transact');
  //get all records from store
  const allTransact = transactObjectStore.getAll();

  //on success of this .getAll() transaction run this func
  allTransact.onsuccess = () => {
    //console.log("========== BACK ONLINE CONNECTED TO MONGODB ==========");
    //if there was data in the idb's store send it to api server
    if (allTransact.result.length > 0) {
      fetch('/api/transaction/post',
        {
          method: 'POST',
          body: JSON.stringify(allTransact.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        } 
      )
      .then(response => {
        //console.log("========== RESPONSE FROM INDEXEDDB POST REQUEST ==========");
        //console.log(response);
        return response.json();
      })
      .then(json => {
        console.log(json);

        //open one more transaction to clear all items from store since we're back online
        const transaction = dbDYN.transaction([ 'new_transact' ], 'readwrite');
        const transactObjectStore = transaction.objectStore('new_transact');
        transactObjectStore.clear();

        //console.log('========== OBJECT STORE CLEAR ==========');
      })
      .catch(err => console.log(err));
    }
  }
}


//listen for when app comes back online
//when back online send items 
window.addEventListener('online', uploadTransact);