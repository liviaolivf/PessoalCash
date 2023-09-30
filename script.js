const addTransactionButton = document.querySelector('.add-transaction');
const modal = document.querySelector('.modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalForm = document.getElementById('modal-form');
const transactionsList = document.getElementById('transactions-list');
const incomeDisplay = document.getElementById('income-display');
const expenseDisplay = document.getElementById('expense-display');
const totalDisplay = document.getElementById('total-display');
const transactionTypeButtons = document.querySelectorAll('.transaction-type-button');
let selectedTransactionType = 'income'; // Padrão para entrada
const closeButton = document.querySelector('.close-button');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');


// Adiciona um event listener para os botões de tipo de transação
transactionTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedTransactionType = button.getAttribute('data-type');
        // Adicione classe de destaque ao botão selecionado para fornecer feedback visual
        transactionTypeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
    });
});

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

modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('text').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value; // Obtém a categoria selecionada

    if (text.trim() === '' || isNaN(amount) || date.trim() === '') {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const transaction = {
        text,
        amount: selectedTransactionType === 'expense' ? -amount : amount, // Ajusta o valor com base no tipo de transação
        date,
        category,
    };

    transactions.push(transaction);

    updateTransactionsList();
    updateSummary();

    modalForm.reset();
    modalOverlay.style.display = "none";
    modal.style.display = 'none';
});

// Função para atualizar a lista de transações
function updateTransactionsList() {
    const transactionsListHTML = transactions.map((transaction, index) => {
        return `
            <li class="transaction ${transaction.amount >= 0 ? 'income' : 'expense'}">
                <span class="transaction-text">${transaction.text}</span>
                <span class="transaction-amount">${transaction.amount >= 0 ? `R$ ${transaction.amount.toFixed(2)}` : `- R$ ${Math.abs(transaction.amount).toFixed(2)}`}</span>
                <span class="transaction-category">${transaction.category}</span>
                <span>${transaction.date}</span>
                <button class="delete-button" data-index="${index}"><i class="ph ph-trash"></i></button>
            </li>
        `;
    });

    transactionsList.innerHTML = transactionsListHTML.join('');

    // Adicionar event listener para os botões de exclusão
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            deleteTransaction(index);
        });
    });
}

// Função para excluir transação
function deleteTransaction(index) {
    transactions.splice(index, 1);
    updateTransactionsList();
    updateSummary();
}

// Função para atualizar os valores de entradas, saídas e saldo total
function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.amount >= 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = transactions
        .filter(transaction => transaction.amount < 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const total = income + expense;

    incomeDisplay.textContent = `R$ ${income.toFixed(2)}`;
    expenseDisplay.textContent = `- R$ ${Math.abs(expense).toFixed(2)}`;
    totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
}

const transactions = [];

updateTransactionsList();
updateSummary();

