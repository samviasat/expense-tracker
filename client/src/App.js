import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3001/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to load expenses');
      }
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/summary');
      if (!response.ok) {
        throw new Error('Failed to load summary');
      }
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchSummary()
      ]);
    };
    loadData();
  }, []);

  const handleAddExpense = async (expense) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add expense');
      }
      
      await fetchExpenses();
      await fetchSummary();
      setOpenDialog(false);
      setNewExpense({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateExpense = async (expense) => {
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });
      if (response.ok) {
        fetchExpenses();
        setOpenDialog(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchExpenses();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    return (
      (!selectedCategory || expense.category === selectedCategory) &&
      (!searchTerm || expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const chartData = {
    labels: summaryData.map(item => item.category),
    datasets: [
      {
        label: 'Spending by Category',
        data: summaryData.map(item => item.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Expense Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Summary Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Spending Summary
              </Typography>
              {summaryData.length > 0 ? (
                <Line data={chartData} />
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography color="text.secondary">
                    No expenses to display
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Filters */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Expenses List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Expenses</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewExpense({
                      amount: '',
                      description: '',
                      category: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                    setOpenDialog(true);
                  }}
                >
                  Add Expense
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : expenses.length === 0 ? (
                <Alert severity="info">No expenses found. Add your first expense using the button above.</Alert>
              ) : (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id}>
                          <td>{new Date(expense.date).toLocaleDateString()}</td>
                          <td>{expense.description}</td>
                          <td>{expense.category}</td>
                          <td>${expense.amount.toFixed(2)}</td>
                          <td>
                            <IconButton
                              onClick={() => {
                                setSelectedExpense(expense);
                                setOpenDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setError(null);
        setNewExpense({
          amount: '',
          description: '',
          category: '',
          date: new Date().toISOString().split('T')[0]
        });
      }}>
        <DialogTitle>
          Add New Expense
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({
                ...newExpense,
                amount: e.target.value
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({
                ...newExpense,
                description: e.target.value
              })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newExpense.category}
                onChange={(e) => setNewExpense({
                  ...newExpense,
                  category: e.target.value
                })}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({
                ...newExpense,
                date: e.target.value
              })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setError(null);
            setNewExpense({
              amount: '',
              description: '',
              category: '',
              date: new Date().toISOString().split('T')[0]
            });
          }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleAddExpense(newExpense)}
            color="primary"
            disabled={!newExpense.amount || !newExpense.description || !newExpense.category}
          >
            Add
          </Button>
        </DialogActions>
        {error && (
          <DialogContent>
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}

export default App;
