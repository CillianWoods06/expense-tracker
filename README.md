# Student Budget Tracker

A monthly budgeting web app built with plain HTML, CSS and JavaScript, with Chart.js for the chart. No build step and no backend.

**Live demo:** https://cillianwoods06.github.io/expense-tracker/ *(enable GitHub Pages to activate)*

## Features
- Add expenses with a description, amount, date and category
- **Month view**: totals, chart and table all follow the selected month
- **Monthly budget** with a progress bar that turns amber at 80% and red when you go over
- **Summary cards**: amount spent, budget left, biggest category
- **Doughnut chart** of spending by category
- **Export to CSV** for the selected month, so you can carry on the analysis in Excel or Power BI
- Input validation and safe handling of user text
- Data saved in the browser, so nothing leaves your device

## How it works
| Part | Responsibility |
|---|---|
| State | `expenses` (array of objects) and `budget`, loaded from and saved to `localStorage` |
| Helpers | Filtering by month and totalling by category; these are pure functions with no side effects |
| Rendering | `render()` redraws the cards, budget bar, table and chart from state |
| Events | Form submit, delete, budget change, month change and export update state and then call `render()` |

Keeping a single `render()` function that is driven by the data makes the UI predictable: every change goes through the same path.

Each expense is stored like this:
```json
{ "id": 1761216000000, "description": "Lunch", "amount": 7.5, "date": "2026-10-23", "category": "Food" }
```

## Run it
Open `index.html` in a browser, or deploy it with GitHub Pages (Settings → Pages → deploy from `main`).

## What I'd add next
- Recurring expenses (rent, subscriptions)
- Editing an existing expense
- Charts comparing spending across months
- A small backend (e.g. Flask + SQLite) so data syncs between devices
