let dbDYN;
//console.log(sw);
const roundNum = (value, decimalPlaces) => Number(Math.round(value+'e'+decimalPlaces)+'e-'+decimalPlaces);
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
      //once back online make a get after posting the stored stuff in idb to store in the cache after coming back online
      .then(() => {
      return fetch('/api/transaction', {method: 'get'})
      })
      .then(response => response.json())
      .then(
        json => {
          console.log(json);
          // save db json on global variable
          transactions = json;
          //populate areas of the DOM 
          populateTotal();
          populateTable();
          populateChart();
        }
      )
      .catch(err => console.log(err));
    }
  }
}
function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + roundNum(Number(t.value), 2);
  }, 0);
  //add commas to the number string for display, round decimal numbers to nearest hundreds place
  let totalEl = document.querySelector("#total");
  totalEl.textContent = `$${numberWithCommas(total)}`;
}
function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>$${numberWithCommas(roundNum(Number(transaction.value), 2))}</td>
    `;

    tbody.appendChild(tr);
  });
}
function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(transaction => {
    //console.log(transaction);
    let date = new Date(transaction.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += roundNum(Number(t.value), 2)
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");
  myChart = new Chart
  (ctx, 
    {
      type: 'line',
      data: 
      {
        labels,
        datasets: [
          {
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
          }
        ]
      },
      options: {
        legend: {
          labels: {
            fontColor: 'black'
          }
        }
      }
    }
  );
}
Chart.defaults.global.defaultFontColor = 'black';

//listen for when app comes back online
//when back online send items 
window.addEventListener('online', uploadTransact);

/**
 * 
 * @param {Number} num number that needs commas placed in the string
 * @returns string
 */
function numberWithCommas(num) {
  let parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  //console.log(parts);
  //if only a tens place fill in hundredths place with zero and splice off the extra if its not a zero
  if (parts.length === 2) {
    parts.splice(1, 0, parts[1] + "0");
    parts.splice(2);
    if (parts[1].length > 2) {
      //pop last number and manipulate it to take out the stuff after hundreds place
      let decimals = parts.pop().split('');
      //console.log(decimals);
      //splice out anything past second index
      decimals.splice(2);
      //console.log(decimals);
      let joinedDec = decimals.join('');
      //console.log(joinedDec);
      //push joined dec into parts array
      parts.push(joinedDec);
    }
  }
  //console.log(parts);
  return parts.join('.');
}