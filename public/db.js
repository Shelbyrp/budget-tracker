let db;

//Creates a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (e) {
    const db = e.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upload a transaction if request is successful
request.onsuccess = function (e) {
    db = e.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

//send error if request has issues
request.onerror = function (event) {
    console.log("There was an error:", event.target.errorCode);
};

//Execute the below if there is an attempt to submit a new transaction with no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
};

//Creates a new transaction, gets all transactions which are assigned to getAll and sends it to the api 
function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    budgetObjectStore.clear();
                    alert('All saved transactions have been recorded');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
};

//When there is internet, all offline transactions will be uploaded
window.addEventListener('online', uploadTransaction);