const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Database connection
const db = new sqlite3.Database('expenses.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDB();
  }
});

// Initialize database
const initializeDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if table is empty before inserting sample data
    db.get('SELECT COUNT(*) as count FROM expenses', (err, row) => {
      if (err) {
        console.error('Error checking expenses count:', err);
        return;
      }

      if (row.count === 0) {
        // Only insert sample data if table is empty
        const stmt = db.prepare('INSERT INTO expenses (amount, description, category, date) VALUES (?, ?, ?, ?)');
        stmt.run(50.00, 'Lunch at cafe', 'Food', '2025-05-28');
        stmt.run(120.00, 'Grocery shopping', 'Food', '2025-05-28');
        stmt.run(25.00, 'Bus fare', 'Transportation', '2025-05-28');
        stmt.finalize();
        console.log('Inserted sample data');
      }
    });
  });
};

// API Routes
app.get('/api/expenses', (req, res) => {
  const query = req.query;
  const conditions = [];
  const values = [];

  if (query.category) {
    conditions.push('category = ?');
    values.push(query.category);
  }

  if (query.date) {
    conditions.push('date = ?');
    values.push(query.date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.all(
    `SELECT * FROM expenses ${whereClause} ORDER BY date DESC`,
    values,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post('/api/expenses', (req, res) => {
  const { amount, description, category, date } = req.body;

  if (!amount || !description || !category || !date) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  db.run(
    'INSERT INTO expenses (amount, description, category, date) VALUES (?, ?, ?, ?)',
    [amount, description, category, date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/expenses/:id', (req, res) => {
  const { amount, description, category, date } = req.body;
  const id = req.params.id;

  db.run(
    'UPDATE expenses SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?',
    [amount, description, category, date, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      res.json({ id });
    }
  );
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    'DELETE FROM expenses WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      res.json({ message: 'Expense deleted successfully' });
    }
  );
});

app.get('/api/summary', (req, res) => {
  db.all(
    `SELECT 
      SUM(amount) as total,
      category
    FROM expenses
    GROUP BY category`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.get('/api/categories', (req, res) => {
  const categories = [
    'Food',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Bills',
    'Other'
  ];
  res.json(categories);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
