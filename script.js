// --- Global Data Store (Simulated Database) ---
let users = [];
let currentUser = null;

// Helper function to generate a simple unique account number
function generateAccountNumber() {
    return 'ACC' + Math.floor(Math.random() * 900000 + 100000);
}

// --- Screen Toggling Functions ---
function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('register-page').classList.add('hidden');
    document.getElementById('login-message').textContent = '';
    document.getElementById('register-message').textContent = '';
}

function showRegister() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('register-page').classList.remove('hidden');
    document.getElementById('login-message').textContent = '';
    document.getElementById('register-message').textContent = '';
}

function showDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('bank-dashboard').classList.remove('hidden');
    updateDashboard(); // Load the user's data
}

function showAuth() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('bank-dashboard').classList.add('hidden');
    showLogin(); // Go back to the login screen
}

// --- Registration Logic ---
function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const initialDeposit = parseFloat(document.getElementById('reg-initial-deposit').value);
    const messageEl = document.getElementById('register-message');

    // Simple Validation
    if (!username || !password) {
        messageEl.textContent = 'Username and password cannot be empty.';
        return;
    }

    if (users.find(u => u.username === username)) {
        messageEl.textContent = 'Username already exists.';
        return;
    }
    
    // Currency updated in message
    if (isNaN(initialDeposit) || initialDeposit < 100) {
        messageEl.textContent = 'Initial deposit must be at least ₹100.';
        return;
    }

    // Create the new user object
    const newUser = {
        username: username,
        password: password,
        balance: initialDeposit,
        accountNumber: generateAccountNumber(),
        transactions: [{ type: 'Deposit', amount: initialDeposit, date: new Date().toLocaleDateString() }]
    };

    users.push(newUser);
    messageEl.textContent = 'Registration successful! You can now login.';
    messageEl.style.color = '#28a745'; // Success color
    
    // Clear the form and switch
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-initial-deposit').value = '';
    
    setTimeout(showLogin, 1500); 
}

// --- Login Logic ---
function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const messageEl = document.getElementById('login-message');
    
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        messageEl.textContent = 'Login successful!';
        messageEl.style.color = '#28a745';
        
        setTimeout(showDashboard, 500);
    } else {
        messageEl.textContent = 'Invalid username or password.';
        messageEl.style.color = '#dc3545';
    }
}

// --- Logout Logic ---
function logout() {
    currentUser = null;
    showAuth();
}
// --- Update Dashboard View (FIXED TEMPLATE LITERALS AND CURRENCY) ---
function updateDashboard() {
    if (!currentUser) return;

    // 1. Update Account Details 
    document.getElementById('welcome-username').textContent = currentUser.username;
    document.getElementById('account-number').textContent = currentUser.accountNumber;
    document.getElementById('current-balance').textContent = currentUser.balance.toFixed(2);

    // 2. Update Transaction History
    const historyList = document.getElementById('transaction-list');
    historyList.innerHTML = ''; 

    currentUser.transactions.slice().reverse().forEach(transaction => {
        const listItem = document.createElement('li');
        let amountDisplay = '';
        let displayText = '';

        if (transaction.type === 'Transfer In' || transaction.type === 'Deposit') {
            // Incoming money is green. Currency added here.
            amountDisplay = `<span class="deposit-item">+₹${transaction.amount.toFixed(2)}</span>`;
            displayText = `${transaction.type}`;
            if(transaction.sender) {
                displayText = `Transfer In from ${transaction.sender}`;
            }
        } else {
            // Outgoing money is red. Currency added here.
            amountDisplay = `<span class="withdraw-item">-₹${transaction.amount.toFixed(2)}</span>`;
            displayText = `${transaction.type}`;
            if(transaction.recipient) {
                displayText = `Transfer Out to ${transaction.recipient}`;
            }
        }

        // CORRECT TEMPLATE LITERAL SYNTAX (using backticks ` and ${...})
        listItem.innerHTML = `
            <span>${displayText} (${transaction.date})</span>
            ${amountDisplay}
        `;
        
        historyList.appendChild(listItem);
    });
}

// --- Transfer (Send Money) Logic (UPDATED CURRENCY) ---
function transfer() {
    if (!currentUser) return;
    
    const recipientAcc = document.getElementById('transfer-recipient').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const messageEl = document.getElementById('transfer-message');

    messageEl.textContent = '';
    messageEl.style.color = '#dc3545'; 

    // 1. Validation (₹ added here)
    if (isNaN(amount) || amount <= 0) {
        messageEl.textContent = 'Please enter a valid amount greater than ₹0.';
        return;
    }

    if (!recipientAcc) {
        messageEl.textContent = 'Please enter a recipient account number.';
        return;
    }

    if (recipientAcc === currentUser.accountNumber) {
        messageEl.textContent = 'Cannot transfer money to your own account.';
        return;
    }

    // 2. Find Recipient
    const recipient = users.find(u => u.accountNumber === recipientAcc);
    
    if (!recipient) {
        messageEl.textContent = 'Error: Recipient account not found.';
        return;
    }

    // 3. Check for sufficient balance
    if (amount > currentUser.balance) {
        messageEl.textContent = 'Error: Insufficient funds for transfer.';
        return;
    }

    // --- Perform Transfer ---
    currentUser.balance -= amount;
    recipient.balance += amount;

    // Record transactions
    currentUser.transactions.push({
        type: 'Transfer Out',
        amount: amount,
        recipient: recipient.username,
        date: new Date().toLocaleDateString()
    });

    recipient.transactions.push({
        type: 'Transfer In',
        amount: amount,
        sender: currentUser.username,
        date: new Date().toLocaleDateString()
    });

    // 4. Update view and show success (₹ added here)
    updateDashboard();
    messageEl.textContent = `₹${amount.toFixed(2)} transferred successfully to ${recipient.username}!`;
    messageEl.style.color = '#28a745';
    document.getElementById('transfer-recipient').value = '';
    document.getElementById('transfer-amount').value = '';
    
    setTimeout(() => messageEl.textContent = '', 3000);
}

// --- Withdraw Logic (UPDATED CURRENCY) ---
function withdraw() {
    if (!currentUser) return;
    
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const messageEl = document.getElementById('withdraw-message');

    // Validation (₹ added here)
    if (isNaN(amount) || amount <= 0) {
        messageEl.textContent = 'Please enter a valid amount greater than ₹0.';
        messageEl.style.color = '#dc3545';
        return;
    }
    
    if (amount > currentUser.balance) {
        messageEl.textContent = 'Error: Insufficient funds.';
        messageEl.style.color = '#dc3545';
        return;
    }

    currentUser.balance -= amount;

    // Record transaction
    const transaction = {
        type: 'Withdrawal',
        amount: amount,
        date: new Date().toLocaleDateString()
    };
    currentUser.transactions.push(transaction);

    // Show success (₹ added here)
    updateDashboard();
    messageEl.textContent = `₹${amount.toFixed(2)} withdrawn successfully!`;
    messageEl.style.color = '#28a745';
    document.getElementById('withdraw-amount').value = ''; 
    
    setTimeout(() => messageEl.textContent = '', 3000);
}


// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Demo User 1: testuser (ACC123456)
    users.push({
        username: 'poojitha',
        password: '12345',
        balance: 5000.75,
        accountNumber: 'ACC123456',
        transactions: [
            { type: 'Deposit', amount: 5000.75, date: new Date().toLocaleDateString() },
        ]
    });
    
    // Demo User 2: janedoe (ACC654321)
    users.push({
        username: 'maggie',
        password: '54321',
        balance: 1000.00,
        accountNumber: 'ACC654321',
        transactions: [
            { type: 'Deposit', amount: 1000.00, date: new Date().toLocaleDateString() },
        ]
    });
    
    showAuth();
});