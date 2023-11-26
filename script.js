const addTransactionButton = document.querySelector('.add-transaction');
const modal = document.querySelector('.modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalForm = document.getElementById('modal-form');
const transactionsList = document.getElementById('transactions-list');
const incomeDisplay = document.getElementById('income-display');
const expenseDisplay = document.getElementById('expense-display');
const totalDisplay = document.getElementById('total-display');
const transactionTypeButtons = document.querySelectorAll('.transaction-type-button');
let selectedTransactionType = null;
const closeButton = document.querySelector('.close-button');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const dateInput = document.getElementById('date');


const storedTransactions = JSON.parse(localStorage.getItem('transactions'));
const transactions = storedTransactions || [];

function saveTransactionsToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Botões do tipo de transação (Entrada ou Saída)
transactionTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedTransactionType = button.getAttribute('data-type');
        // Adicione classe de destaque ao botão selecionado para fornecer feedback visual
        transactionTypeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
    });
});


// Função para formatar a data no padrão brasileiro
function formatDateToBR(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// fn para conveter o número corretamente

function formatCurrency(number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number);
}

async function listarTransacoes() {
    const response = await fetch('http://localhost:3000/transactions');
    const data = await response.json();
    return data;
}

// Função para cadastrar uma transação no banco de dados (chamar back-end)
async function cadastrar(transaction) {
    await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
    })
}

async function deletar(id) {
    try {
        await fetch(`http://localhost:3000/transactions/${id}`, {
            method: 'DELETE',
        })
    } catch (error) {
        alert('Erro ao deletar transação');
    }
}


// Formata o ano corretamente no input de data
dateInput.addEventListener('input', (e) => {
    let value = e.target.value;
    let parts = value.split('-');
    if (parts[0].length > 4) {
        parts[0] = parts[0].substring(0, 4);
        value = parts.join('-');
        e.target.value = value;
    }
});


// Botão para adicionar uma transação 
addTransactionButton.addEventListener('click', () => {
    document.querySelector("html").dataset.isModalOpen = true;
    modalOverlay.style.display = "block";
    modal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
    document.querySelector("html").dataset.isModalOpen = false;
    modalOverlay.style.display = "none";
    modal.style.display = 'none';
});


// Adiciona uma transação através do formulário
modalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = document.getElementById('text').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;

    if (category === "0" || !category) {
        return alert('Por favor, selecione uma categoria.');
    }
    
    if (!selectedTransactionType) {
        return alert('Por favor, selecione "Entrada" ou "Saída" antes de submeter.');
    }
    
    if (text.trim() === '' || isNaN(amount) || date.trim() === '' || !selectedTransactionType) {
        return alert('Por favor, preencha todos os campos corretamente.');
    }

    const transaction = {
        id: Date.now(),
        text,
        amount: selectedTransactionType === 'expense' ? -amount : amount,
        date,
        category,
    };

    cadastrar(transaction);

    transactions.push(transaction);

    saveTransactionsToLocalStorage();
    
    updateTransactionsList();
    updateSummary();
    modalForm.reset();
    modalOverlay.style.display = "none";
    modal.style.display = 'none';

    // Redefinir o tipo de transação selecionado
    selectedTransactionType = null;

    // Remover a classe 'selected' de ambos os botões
    transactionTypeButtons.forEach(btn => btn.classList.remove('selected'));
});


// Atualiza a lista de transações na UI
function updateTransactionsList() {
    const transactionsListHTML = transactions.map((transaction) => {
        return `
            <li class="transaction ${transaction.amount >= 0 ? 'income' : 'expense'}">
                <span class="transaction-text">${transaction.text}</span>
                <span class="transaction-amount">${transaction.amount >= 0 ? `${formatCurrency(transaction.amount.toFixed(2))}` : `-${formatCurrency(Math.abs(transaction.amount).toFixed(2))}`}</span>
                <span class="transaction-category">${transaction.category}</span>
                <span class="transaction-data">${formatDateToBR(transaction.date)}</span>
                <button class="delete-button" data-id="${transaction.id}"><i class="ph ph-trash"></i></button>
            </li>
        `;
    });
    transactionsList.innerHTML = transactionsListHTML.join('');
    attachDeleteListeners(); // Botões de excluir
}


// Botões de excluir
function attachDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.delete-button').getAttribute('data-id'));
            deleteTransactionById(id);
        });
    });
}


// Deleta uma transação pelo ID
function deleteTransactionById(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions.splice(index, 1);
    }

    saveTransactionsToLocalStorage();

    updateTransactionsList();
    updateSummary();
}


// Atualiza o resumo financeiro (Entradas, Saídas e Total)
function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.amount >= 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expense = transactions
        .filter(transaction => transaction.amount < 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const total = income + expense;

    incomeDisplay.textContent = `${formatCurrency(income.toFixed(2))}`;
    expenseDisplay.textContent = `-${formatCurrency(Math.abs(expense).toFixed(2))}`;
    totalDisplay.textContent = `${formatCurrency(total.toFixed(2))}`;
}


// Filtra as transações baseado no input de busca
function filterTransactions() {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        displayTransactions(transactions);
        return;
    }
    const filteredTransactions = transactions.filter(transaction => {
        return transaction.text.toLowerCase().includes(query);
    });
    displayTransactions(filteredTransactions);
}


// Exibe as transações filtradas na UI
function displayTransactions(transactionsToDisplay) {
    const transactionsListHTML = transactionsToDisplay.map((transaction) => {
        return `
            <li class="transaction ${transaction.amount >= 0 ? 'income' : 'expense'}">
                <span class="transaction-text">${transaction.text}</span>
                <span class="transaction-amount">${transaction.amount >= 0 ? `${formatCurrency(transaction.amount.toFixed(2))}` : `-${formatCurrency(Math.abs(transaction.amount).toFixed(2))}`}</span>
                <span class="transaction-category">${transaction.category}</span>
                <span class="transaction-data">${formatDateToBR(transaction.date)}</span>
                <button class="delete-button" data-id="${transaction.id}"><i class="ph ph-trash"></i></button>
            </li>
        `;
    });
    transactionsList.innerHTML = transactionsListHTML.join('');
    attachDeleteListeners(); // Adiciona listeners aos botões de excluir
}

// Pesquisa
searchButton.addEventListener('click', filterTransactions);
searchInput.addEventListener('input', function() {
    if (!searchInput.value.trim()) {
        displayTransactions(transactions);
    }
});

searchInput.addEventListener('keyup', function(event) {
    // Pra funcionar o Enter na busca
    if (event.key === "Enter") {
        filterTransactions();
    }
});

updateTransactionsList();
updateSummary();