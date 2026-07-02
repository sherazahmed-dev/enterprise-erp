const db = require('../config/db');

// --- Analytics Aggregation (Charts Data) ---
const getAnalyticsSummary = (req, res) => {
    const data = {
        finance: { income: 0, expense: 0 },
        inventory: { lowStock: 0, healthyStock: 0 },
        hr: [], // Employees per department
        sales: { pending: 0, completed: 0 }
    };

    db.serialize(() => {
        // Finance Summary
        db.all(`SELECT type, SUM(amount) as total FROM transactions GROUP BY type`, [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(r => {
                    if (r.type === 'Income') data.finance.income = r.total;
                    if (r.type === 'Expense') data.finance.expense = r.total;
                });
            }
        });

        // Inventory Health
        db.all(`SELECT 
                    SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as lowStock,
                    SUM(CASE WHEN current_stock > min_stock THEN 1 ELSE 0 END) as healthyStock
                FROM products`, [], (err, row) => {
            if (!err && row && row.length > 0) {
                data.inventory.lowStock = row[0].lowStock || 0;
                data.inventory.healthyStock = row[0].healthyStock || 0;
            }
        });

        // HR Department Distribution
        db.all(`SELECT d.name, COUNT(e.id) as count 
                FROM departments d 
                LEFT JOIN employees e ON d.id = e.department_id 
                GROUP BY d.id`, [], (err, rows) => {
            if (!err && rows) data.hr = rows;
        });

        // Sales Status
        db.all(`SELECT status, COUNT(*) as count FROM sales_orders GROUP BY status`, [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(r => {
                    if (r.status === 'Pending') data.sales.pending = r.count;
                    else data.sales.completed += r.count; // Group other statuses into completed for simple chart
                });
            }
            
            // Final query callback sends the aggregated response
            res.json(data);
        });
    });
};

// --- Export Engine (Excel/CSV Generator) ---
const exportReport = (req, res) => {
    const { module } = req.params;
    let query = '';
    let filename = '';

    switch (module) {
        case 'finance':
            query = `SELECT t.id as Transaction_ID, t.date as Date, a.account_name as Account, t.type as Type, t.amount as Amount, t.description as Description 
                     FROM transactions t LEFT JOIN accounts a ON t.account_id = a.id ORDER BY t.id DESC`;
            filename = 'finance_report.csv';
            break;
        case 'sales':
            query = `SELECT so.id as Order_ID, c.name as Customer, so.order_date as Date, so.total_amount as Amount, so.status as Status 
                     FROM sales_orders so LEFT JOIN customers c ON so.customer_id = c.id ORDER BY so.id DESC`;
            filename = 'sales_report.csv';
            break;
        case 'inventory':
            query = `SELECT p.sku as SKU, p.name as Product, c.name as Category, p.price as Price, p.current_stock as Stock, p.min_stock as Min_Stock 
                     FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC`;
            filename = 'inventory_report.csv';
            break;
        case 'hr':
            query = `SELECT e.id as Emp_ID, u.name as Name, u.email as Email, d.name as Department, e.status as Status 
                     FROM employees e LEFT JOIN users u ON e.user_id = u.id LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.id DESC`;
            filename = 'hr_report.csv';
            break;
        default:
            return res.status(400).json({ error: 'Invalid module for export.' });
    }

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to generate report data.' });

        if (rows.length === 0) {
            return res.status(404).send('No data available to export.');
        }

        // Generate CSV String
        const headers = Object.keys(rows[0]);
        const csvRows = [headers.join(',')]; // Header row

        rows.forEach(row => {
            const values = headers.map(header => {
                const val = row[header] === null ? '' : row[header].toString();
                return `"${val.replace(/"/g, '""')}"`; // Escape quotes to prevent CSV injection
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');

        // Set Headers for Excel/CSV Download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csvString);
    });
};

module.exports = {
    getAnalyticsSummary,
    exportReport
};