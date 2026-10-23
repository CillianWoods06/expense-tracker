// Student Expense Tracker
// Expenses are saved in the browser's localStorage so they survive a refresh.

const STORAGE_KEY = "expenses";

const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const errorText = document.getElementById("error");
const list = document.getElementById("expense-list");
const categoryList = document.getElementById("category-totals");
const totalText = document.getElementById("total");
const countText = document.getElementById("count");

let expenses = loadExpenses();

function loadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // Storage unavailable (e.g. private mode) - the app still works for this visit.
  }
}

function formatEuro(value) {
  return "€" + value.toFixed(2);
}

// Stop typed text being treated as HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function render() {
  list.innerHTML = "";
  expenses.forEach((expense, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${escapeHtml(expense.description)} <small>(${expense.category})</small></span>
      <span>${formatEuro(expense.amount)}
        <button class="delete" data-index="${index}" aria-label="Delete">✕</button>
      </span>`;
    list.appendChild(item);
  });

  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  categoryList.innerHTML = "";
  Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, amount]) => {
      const item = document.createElement("li");
      item.textContent = `${category}: ${formatEuro(amount)}`;
      categoryList.appendChild(item);
    });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalText.textContent = formatEuro(total);
  countText.textContent = expenses.length;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!description || isNaN(amount) || amount <= 0) {
    errorText.textContent = "Please enter a description and an amount above €0.";
    errorText.hidden = false;
    return;
  }

  errorText.hidden = true;
  expenses.push({ description, amount, category: categoryInput.value });
  saveExpenses();
  render();
  form.reset();
  descriptionInput.focus();
});

list.addEventListener("click", event => {
  if (event.target.classList.contains("delete")) {
    expenses.splice(Number(event.target.dataset.index), 1);
    saveExpenses();
    render();
  }
});

render();
