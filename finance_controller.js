const db = require('../config/db');

// --- Accounts ---
const getAccounts = (req, res) => {
    db.all(`SELECT * FROM accounts ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching accounts.' });
        res.json(rows);
    });
};

const createAccount = (req, res) => {
    const { account_name, account_type, balance } = req.body;
    if (!account_name || !account_type) return res.status(400).json({ error: 'Account name and type are required.' });

    db.run(`INSERT INTO accounts (account_name, account_type, balance) VALUES (?, ?, ?)`,
        [account_name, account_type, balance || 0],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create financial account.' });
            res.status(201).json({ id: this.lastID, message: 'Account created successfully.' });
        }
    );
};

// --- Transactions ---
const getTransactions = (req, res) => {
    const query = `
        SELECT t.*, a.account_name 
        FROM transactions t 
        LEFT JOIN accounts a ON t.account_id = a.id 
        ORDER BY t.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching transactions.' });
        res.json(rows);
    });
};

const createTransaction = (req, res) => {
    const { account_id, type, amount, description } = req.body;
    
    if (!account_id || !type || !amount) {
        return res.status(400).json({ error: 'Account ID, Type (Income/Expense), and Amount are required.' });
    }

    if (type !== 'Income' && type !== 'Expense') {
        return res.status(400).json({ error: 'Transaction type must be Income or Expense.' });
    }

    // ACID Transaction logic for updating account balance safely
    db.serialize(() => {
        db.run(`BEGIN TRANSACTION`);

        db.run(`INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)`,
            [account_id, type, amount, description],
            function(err) {
                if (err) {
                    db.run(`ROLLBACK`);
                    return res.status(400).json({ error: 'Failed to record transaction.' });
                }

                // Update the running balance of the target account
                const balanceAdjustment = type === 'Income' ? amount : -amount;
                db.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [balanceAdjustment, account_id], function(err2) {
                    if (err2) {
                        db.run(`ROLLBACK`);
                        return res.status(500).json({ error: 'Failed to update account balance.' });
                    }
                    
                    db.run(`COMMIT`);
                    res.status(201).json({ message: 'Transaction posted successfully.' });
                });
            }
        );
    });
};

module.exports = {
    getAccounts,
    createAccount,
    getTransactions,
    createTransaction
};