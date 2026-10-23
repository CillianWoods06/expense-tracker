// Student Budget Tracker
// All data is stored in the browser (localStorage). The app works on one
// selected month at a time: totals, budget, chart and table all follow it.

const STORAGE_KEYS = { expenses: "expenses", budget: "monthlyBudget" };
const CATEGORY_COLOURS = {
  Food: "#2563eb", Transport: "#16a34a", Rent: "#d97706",
  College: "#9333ea", Social: "#db2777", Other: "#64748b",
};

// ---------- State ----------

let expenses = load(STORAGE_KEYS.expenses, []);
let budget = load(STORAGE_KEYS.budget, 0);
let chart = null;

// ---------- Elements ----------

const $ = id => document.getElementById(id);
const monthInput = $("month");
const form = $("expense-form");
const errorText = $("error");

// ---------- Storage helpers ----------

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (e.g. private mode): the app still works until the page closes.
  }
}

// ---------- Helpers ----------

const euro = value => "€" + value.toFixed(2);
const today = () => new Date().toISOString().slice(0, 10);

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Expenses for the month currently selected (YYYY-MM), newest first
function expensesForMonth() {
  return expenses
    .filter(e => e.date.startsWith(monthInput.value))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function totalsByCategory(list) {
  const totals = {};
  list.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  return totals;
}

// ---------- Rendering ----------

function render() {
  const list = expensesForMonth();
  const spent = list.reduce((sum, e) => sum + e.amount, 0);
  const totals = totalsByCategory(list);

  renderCards(spent, totals);
  renderBudget(spent);
  renderTable(list);
  renderChart(totals);
}

function renderCards(spent, totals) {
  $("spent").textContent = euro(spent);
  $("remaining").textContent = budget > 0 ? euro(budget - spent) : "No budget set";

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  $("top-category").textContent = top ? `${top[0]} (${euro(top[1])})` : "–";
}

function renderBudget(spent) {
  const fill = $("bar-fill");
  const message = $("budget-message");

  if (budget <= 0) {
    fill.style.width = "0";
    message.textContent = "Set a monthly budget to track your progress.";
    return;
  }

  const percent = (spent / budget) * 100;
  fill.style.width = Math.min(percent, 100) + "%";
  fill.style.background = percent >= 100 ? "var(--danger)" : percent >= 80 ? "var(--warn)" : "var(--ok)";
  message.textContent = percent >= 100
    ? `Over budget by ${euro(spent - budget)}.`
    : `${percent.toFixed(0)}% of your ${euro(budget)} budget used.`;
}

function renderTable(list) {
  const body = $("expense-rows");
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="muted">No expenses for this month.</td></tr>`;
    return;
  }
  body.innerHTML = list.map(e => `
    <tr>
      <td>${e.date}</td>
      <td>${escapeHtml(e.description)}</td>
      <td>${e.category}</td>
      <td class="num">${euro(e.amount)}</td>
      <td><button class="delete" data-id="${e.id}" aria-label="Delete">✕</button></td>
    </tr>`).join("");
}

function renderChart(totals) {
  const labels = Object.keys(totals);
  $("chart-empty").hidden = labels.length > 0;
  $("chart").hidden = labels.length === 0;

  if (typeof Chart === "undefined") {
    // Chart library failed to load (e.g. offline) - say so instead of showing an empty box
    if (labels.length > 0) {
      $("chart").hidden = true;
      $("chart-empty").hidden = false;
      $("chart-empty").textContent = "Chart unavailable offline.";
    }
    return;
  }

  const data = {
    labels,
    datasets: [{
      data: labels.map(l => totals[l]),
      backgroundColor: labels.map(l => CATEGORY_COLOURS[l]),
    }],
  };

  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart($("chart"), {
      type: "doughnut",
      data,
      options: { plugins: { legend: { position: "bottom" } } },
    });
  }
}

// ---------- Events ----------

form.addEventListener("submit", event => {
  event.preventDefault();
  const description = $("description").value.trim();
  const amount = parseFloat($("amount").value);
  const date = $("date").value;

  if (!description || isNaN(amount) || amount <= 0 || !date) {
    errorText.textContent = "Please fill in a description, an amount above €0 and a date.";
    errorText.hidden = false;
    return;
  }

  errorText.hidden = true;
  expenses.push({ id: Date.now(), description, amount, date, category: $("category").value });
  save(STORAGE_KEYS.expenses, expenses);

  monthInput.value = date.slice(0, 7); // jump to the month of the new expense
  form.reset();
  $("date").value = today();
  render();
});

$("expense-rows").addEventListener("click", event => {
  const id = Number(event.target.dataset.id);
  if (!id) return;
  expenses = expenses.filter(e => e.id !== id);
  save(STORAGE_KEYS.expenses, expenses);
  render();
});

$("budget-form").addEventListener("submit", event => {
  event.preventDefault();
  budget = Math.max(0, parseFloat($("budget").value) || 0);
  save(STORAGE_KEYS.budget, budget);
  render();
});

monthInput.addEventListener("change", render);

// Download the selected month as a CSV file (opens in Excel)
$("export").addEventListener("click", () => {
  const rows = expensesForMonth();
  const quote = text => `"${String(text).replace(/"/g, '""')}"`;
  const csv = ["Date,Description,Category,Amount"]
    .concat(rows.map(e => [e.date, quote(e.description), e.category, e.amount.toFixed(2)].join(",")))
    .join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `expenses-${monthInput.value}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---------- Start ----------

monthInput.value = today().slice(0, 7);
$("date").value = today();
$("budget").value = budget || "";
render();
