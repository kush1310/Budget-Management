let totalBudget = 0;

// FUNCTION TO FETCH THE TOTAL BUDGET FROM LOCAL STORAGE IF IT EXISTS
function fetchTotalBudget() {
    const storedBudget = localStorage.getItem('totalBudget');
    if (storedBudget) {
        totalBudget = parseFloat(storedBudget);
    }
}

// FUNCTION TO UPDATE TOTAL BUDGET AND STORE IT IN LOCAL STORAGE
function updateTotalBudget() {
    document.getElementById('total-budget').textContent = `${totalBudget.toFixed(2)}`;
    localStorage.setItem('totalBudget', totalBudget.toFixed(2));
}

// FUNCTION TO FORMAT DATE AS DD-MM-YYYY
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

// FUNCTION TO ADD AMOUNT
function addAmount() {
    const addInput = document.getElementById('add-amount');
    const amountToAdd = parseFloat(addInput.value);
    const addReason = document.getElementById('add-reason');
    const addDateInput = document.getElementById('add-date');
    const date = formatDate(addDateInput.value);
    const reason = addReason.value.trim();

    if (!isNaN(amountToAdd) && amountToAdd > 0 && reason && date) {
        totalBudget += amountToAdd;
        updateTotalBudget();
        addRecord(amountToAdd, reason, date, true);
        addInput.value = '';
        addDateInput.value = '';
        Swal.fire({
            icon: 'success',
            title: 'Amount Added',
            text: `Added ₹${amountToAdd.toFixed(2)} to funds.`,
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Input',
            text: 'Please enter a valid amount, date, and reason.',
        });
    }
}

// FUNCTION TO DEDUCT AMOUNT
function deductAmount() {
    const deductInput = document.getElementById('deduct-amount');
    const amountToDeduct = parseFloat(deductInput.value);
    const deductReasonInput = document.getElementById('deduct-reason');
    const deductDateInput = document.getElementById('deduct-date');
    const date = formatDate(deductDateInput.value);
    const reason = deductReasonInput.value.trim();

    if (!isNaN(amountToDeduct) && amountToDeduct > 0 && reason && date) {
        if (amountToDeduct <= totalBudget) {
            totalBudget -= amountToDeduct;
            updateTotalBudget();
            addRecord(amountToDeduct, reason, date, false);
            deductInput.value = '';
            deductDateInput.value = '';
            Swal.fire({
                icon: 'success',
                title: 'Amount Deducted',
                text: `Deducted ₹${amountToDeduct.toFixed(2)} from available funds.`,
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Insufficient Budget',
                text: 'You do not have enough funds to deduct this amount.',
            });
        }
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Input',
            text: 'Please enter a valid amount, date, and reason for deduction.',
        });
    }
}

// FUNCTION TO ADD NEW RECORD(S)
function addRecord(amount, reason, date, isAddition) {
    const record = { amount, reason, date, isAddition };
    const records = JSON.parse(localStorage.getItem('expenseRecords')) || [];
    records.push(record);

    records.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    localStorage.setItem('expenseRecords', JSON.stringify(records));
    loadRecords();
}

// FUNCTION TO DISPLAY RECORD(S) IN THE DOM
function addRecordToDOM(amount, reason, date, isAddition) {
    const recordList = document.getElementById('record-list');
    const recordItem = document.createElement('li');

    if (isAddition) {
        recordItem.innerHTML = `<span style="color: green; font-weight: bold;">${date} - Added Amount: ₹${amount.toFixed(2)}</span><br><span>Reason: ${reason}</span>`;
    } else {
        recordItem.innerHTML = `<span style="color: red;">${date} - Deducted Amount: ₹${amount.toFixed(2)}</span><br><span>Reason: ${reason}</span>`;
    }
    recordList.appendChild(recordItem);
}

// FUNCTION TO FETCH AND LOAD RECORDS FROM LOCAL STORAGE
function loadRecords() {
    const records = JSON.parse(localStorage.getItem('expenseRecords')) || [];
    document.getElementById('record-list').innerHTML = '';
    records.forEach(record => {
        addRecordToDOM(record.amount, record.reason, record.date, record.isAddition);
    });
}

// FUNCTION TO EXPORT THE RECORDS IN PDF FORMAT
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('FINANCIAL RECORDS', 105, 22, { align: 'center' });
    doc.setFontSize(16);
    doc.text("THIS IS AN AUTO-GENERATED COPY OF THE FLAT's FINANCIAL RECORDS...", 105, 32, { align: 'center' });

    const records = JSON.parse(localStorage.getItem('expenseRecords')) || [];
    if (records.length > 0) {
        const addedRecords = records.filter(record => record.isAddition);
        const deductedRecords = records.filter(record => !record.isAddition);

        if (addedRecords.length > 0) {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('Added Funds', 105, 40, { align: 'center' });
            const addedTableData = addedRecords.map(record => [
                record.date,
                `${record.amount.toFixed(2)} Rupees`,
                record.reason
            ]);

            doc.autoTable({
                head: [['Date', 'Amount', 'Reason']],
                body: addedTableData,
                startY: 45,
                theme: 'grid',
                styles: { halign: 'center', fontSize: 12 },
                columnStyles: {
                    0: { halign: 'center', fontSize: 12 },
                    1: { halign: 'center', fontSize: 12 },
                    2: { halign: 'center', fontSize: 12 }
                }
            });

            const totalAdded = addedRecords.reduce((sum, record) => sum + record.amount, 0);
            doc.text(`Total Added: ${totalAdded.toFixed(2)} Rupees`, 105, doc.autoTable.previous.finalY + 10, { align: 'center' });
        } else {
            doc.text('No Added Records Available.', 105, 40, { align: 'center' });
        }

        if (deductedRecords.length > 0) {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('Deducted Funds', 105, doc.autoTable.previous.finalY + 20, { align: 'center' });
            const deductedTableData = deductedRecords.map(record => [
                record.date,
                `${record.amount.toFixed(2)} Rupees`,
                record.reason
            ]);

            doc.autoTable({
                head: [['Date', 'Amount', 'Reason']],
                body: deductedTableData,
                startY: doc.autoTable.previous.finalY + 25,
                theme: 'grid',
                styles: { halign: 'center', fontSize: 12 },
                columnStyles: {
                    0: { halign: 'center', fontSize: 12 },
                    1: { halign: 'center', fontSize: 12 },
                    2: { halign: 'center', fontSize: 12 }
                }
            });

            const totalDeducted = deductedRecords.reduce((sum, record) => sum + record.amount, 0);
            doc.text(`Total Deducted: ${totalDeducted.toFixed(2)} Rupees`, 105, doc.autoTable.previous.finalY + 10, { align: 'center' });
        } else {
            doc.text('No Deducted Records Available.', 105, doc.autoTable.previous.finalY + 20, { align: 'center' });
        }
    } else {
        doc.text('No Records Available.', 105, 40, { align: 'center' });
    }
    doc.save('Financial-Records.pdf');
}

// INITIALIZATION FUNCTION
function init() {
    fetchTotalBudget();
    loadRecords();
    updateTotalBudget();
}

window.onload = init;
