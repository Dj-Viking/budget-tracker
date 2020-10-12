let transactions = [];
let myChart;
const successEl = document.querySelector('#success-msg');
const offlineEl = document.querySelector('#offline-msg');
//const roundNum = (value, decimalPlaces) => Number(Math.round(value+'e'+decimalPlaces)+'e-'+decimalPlaces);
//on document load fetch transactions
fetch("/api/transaction", {method: 'GET'})
.then(response => response.json())
.then(data => {
  console.log(data);
  // save db data on global variable
  transactions = data;
  //populate areas of the DOM 
  populateTotal();
  populateTable();
  populateChart();
});
  
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

/**
 * 1. validates if the form is filled and sends DOM error message to user who must enter something in the text fields to submit.
 * 
 * 2. creates transaction object from the transaction name, value, and date of creation
 * 
 * 3. if transaction is subtracting convert to negative number before unshifting on the beginning of the transactions array, else unshift the positive number on the beginning of the array
 * 
 * 4. update the UI with new data
 * 
 * 5. JSON stringify the transaction object to either the online mongoDB or if app is offline, save the transaction into the indexedDB storage in the browser
 * @param {Boolean} isAdding Boolean
 * @returns Void
 */
function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    nameEl.value = '';
    amountEl.value = '';
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch
  ("/api/transaction/post", 
    {
      method: "POST",
      body: JSON.stringify(transaction),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }
  )
  .then(response => {
    if (response.ok) {
      //show successful transaction notification in the DOM
      //console.log("showing success message");
      successEl.classList.remove('hide-before-success');
      successEl.classList.add('show-after-success');

    }
    return response.json()
  })
  .then(
    () => {
      //clear text fields
      nameEl.value = '';
      amountEl.value = '';
      //hide DOM notification after some time
      setTimeout(
        () => {
          //console.log("hiding success message");
          successEl.classList.remove('show-after-success');
          successEl.classList.add('hide-before-success');
        }, 3000
      );
    }
    //fetch again to update the cache after posting
  )
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
  .catch(err => {
    console.log(err);
    // fetch failed, so save in indexed db
    //console.log("fetch failed so storing in indexedDB");
    saveRecord(transaction);
    // clear form
    nameEl.value = "";
    amountEl.value = "";
    //still show success notification when saving to indexed db and hide after some time
    Promise.resolve()
    .then(//show offline message
      () => {
        offlineEl.classList.remove('hide-before-success');
        offlineEl.classList.add('show-after-success');
      }
    )
    .then(//hide offline msg after some time
      () => {
        setTimeout(
          () => {
            offlineEl.classList.remove('show-after-success');
            offlineEl.classList.add('hide-before-success');
          }, 5000
        );
      }
    )
    .catch(e => console.log(e));
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};


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