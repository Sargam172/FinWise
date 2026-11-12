
import { createContext, useContext, useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  ChartNoAxesCombined,
  Sparkles,
  Target,
  Settings,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Menu,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./App.css";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Transactions", icon: ArrowLeftRight },
  { name: "Budgets", icon: PiggyBank },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "AI Financial Advisor", icon: Sparkles },
  { name: "Savings Goals", icon: Target },
];

const colors = ["#16865B", "#77B99B", "#B5DCC8", "#D5EBDD", "#A0B8AA"];

const initialTransactions = [
  {
    id: 1,
    title: "Part-time Salary",
    category: "Salary",
    date: "2026-11-10",
    amount: 1500,
    type: "Income",
  },
  {
    id: 2,
    title: "Grocery Shopping",
    category: "Food",
    date: "2026-11-09",
    amount: 125.5,
    type: "Expense",
  },
  {
    id: 3,
    title: "Freelance Project",
    category: "Freelance",
    date: "2026-11-08",
    amount: 500,
    type: "Income",
  },
  {
    id: 4,
    title: "Monthly Transport",
    category: "Transport",
    date: "2026-11-07",
    amount: 85,
    type: "Expense",
  },
  {
    id: 5,
    title: "Online Shopping",
    category: "Shopping",
    date: "2026-11-06",
    amount: 90,
    type: "Expense",
  },
];

const CURRENCIES = [
  ["CAD", "Canadian dollar"],
  ["USD", "US dollar"],
  ["EUR", "Euro"],
  ["GBP", "British pound"],
  ["INR", "Indian rupee"],
  ["AED", "UAE dirham"],
  ["SAR", "Saudi riyal"],
  ["AUD", "Australian dollar"],
  ["NZD", "New Zealand dollar"],
  ["SGD", "Singapore dollar"],
  ["MYR", "Malaysian ringgit"],
  ["JPY", "Japanese yen"],
  ["CNY", "Chinese yuan"],
  ["KRW", "South Korean won"],
  ["CHF", "Swiss franc"],
  ["MXN", "Mexican peso"],
  ["ZAR", "South African rand"],
];

// Exchange rates are fetched from free services that need no account.
// Each one returns "units of currency per 1 CAD". If the first fails, the next is tried.
const RATE_SOURCES = [
  { name: "ExchangeRate-API", home: "https://www.exchangerate-api.com", url: "https://open.er-api.com/v6/latest/CAD" },
  { name: "AllRatesToday", home: "https://allratestoday.com", url: "https://allratestoday.com/api/open/latest/CAD" },
];
const RATES_KEY = "finwise_rates";
const CURRENCY_KEY = "finwise_currency";
const RATES_MAX_AGE = 6 * 60 * 60 * 1000;

const money = (amount, currency) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(amount);

const compactMoney = (value, currency) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const loadRates = () => {
  try {
    return JSON.parse(localStorage.getItem(RATES_KEY));
  } catch {
    return null;
  }
};

// Amounts are stored in the currency they were entered in. rates[code] = units of that currency per 1 CAD.
const convertAmount = (amount, from, to, rates) => {
  if (from === to) return amount;
  if (!rates || !rates[from] || !rates[to]) return NaN;
  return (amount / rates[from]) * rates[to];
};

const CurrencyContext = createContext({
  currency: "CAD",
  currencies: [["CAD", "Canadian dollar"]],
  convert: (amount) => amount,
  format: (amount) => money(amount, "CAD"),
});
const useCurrency = () => useContext(CurrencyContext);

const incomeCategories = ["Salary", "Part-time job", "Freelance", "Scholarship", "Gift", "Other"];
const expenseCategories = ["Housing", "Food", "Transport", "Shopping", "Bills", "Education", "Entertainment", "Healthcare", "Other"];

const isISO = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const toTime = (value) =>
  (isISO(value) ? new Date(value + "T00:00:00") : new Date(value)).getTime() || 0;
const toISO = (value) => (isISO(value) ? value : new Date(value).toLocaleDateString("en-CA"));
const formatDate = (value) =>
  isISO(value)
    ? new Date(value + "T00:00:00").toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : value;
const todayISO = () => new Date().toLocaleDateString("en-CA");
const blankTransaction = () => ({
  id: Date.now(),
  title: "",
  type: "Expense",
  category: expenseCategories[0],
  amount: "",
  date: todayISO(),
});

const monthKey = (value) => {
  const d = new Date(toTime(value));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const shiftMonth = (key, delta) => {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key) =>
  new Date(key + "-01T00:00:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" });
const currentMonth = () => monthKey(todayISO());

// Everything on the dashboard is calculated from the transaction list.
function buildDashboard(transactions, month, convert) {
  const inMonth = (key) => transactions.filter((item) => monthKey(item.date) === key);
  const total = (rows, type) =>
    rows
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + convert(item.amount, item.currency), 0);

  const rows = inMonth(month);
  const income = total(rows, "Income");
  const expenses = total(rows, "Expense");

  const byCategory = {};
  rows
    .filter((item) => item.type === "Expense")
    .forEach((item) => {
      byCategory[item.category] =
        (byCategory[item.category] || 0) + convert(item.amount, item.currency);
    });

  return {
    income,
    expenses,
    savings: income - expenses,
    allTimeNet: total(transactions, "Income") - total(transactions, "Expense"),
    chartMonthly: Array.from({ length: 6 }, (_, i) => {
      const key = shiftMonth(month, i - 5);
      const monthRows = inMonth(key);
      return {
        month: new Date(key + "-01T00:00:00").toLocaleDateString("en-CA", { month: "short" }),
        income: total(monthRows, "Income"),
        expenses: total(monthRows, "Expense"),
      };
    }),
    chartExpense: Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [transactions, setTransactions] = useState(() => {
    try {
      const savedTransactions = localStorage.getItem("finwise_transactions");

      return savedTransactions
        ? JSON.parse(savedTransactions)
        : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [formTx, setFormTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem(CURRENCY_KEY) || "CAD";
    } catch {
      return "CAD";
    }
  });
  const [ratesInfo, setRatesInfo] = useState(loadRates);
  const [ratesStatus, setRatesStatus] = useState(() => (loadRates() ? "cached" : "loading"));

  useEffect(() => {
    let cancelled = false;
    const cached = loadRates();
    if (cached && Date.now() - cached.savedAt < RATES_MAX_AGE) {
      setRatesStatus("live");
      return undefined;
    }
    (async () => {
      for (const source of RATE_SOURCES) {
        try {
          const response = await fetch(source.url);
          const data = await response.json();
          if (data.rates && Number(data.rates.CAD) === 1) {
            const info = {
              rates: data.rates,
              asOf: data.time_last_update_utc || data.date || "",
              source: source.name,
              savedAt: Date.now(),
            };
            if (!cancelled) {
              setRatesInfo(info);
              setRatesStatus("live");
              try {
                localStorage.setItem(RATES_KEY, JSON.stringify(info));
              } catch {
                /* storage unavailable */
              }
            }
            return;
          }
        } catch {
          /* try the next source */
        }
      }
      if (!cancelled) setRatesStatus(cached ? "cached" : "unavailable");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCurrencies = CURRENCIES.filter(
    ([code]) => code === "CAD" || Boolean(ratesInfo?.rates?.[code])
  );
  const activeCurrency = availableCurrencies.some(([code]) => code === currency)
    ? currency
    : "CAD";

  const currencyValue = {
    currency: activeCurrency,
    currencies: availableCurrencies,
    convert: (amount, from = "CAD") =>
      convertAmount(amount, from, activeCurrency, ratesInfo?.rates),
    format: (amount, code = activeCurrency) =>
      Number.isFinite(amount) ? money(amount, code) : "-",
  };
  const { format, convert } = currencyValue;

  const changeCurrency = (code) => {
    setCurrency(code);
    try {
      localStorage.setItem(CURRENCY_KEY, code);
    } catch {
      /* storage unavailable */
    }
  };

  const ratesDate =
    ratesInfo?.asOf && !Number.isNaN(new Date(ratesInfo.asOf).getTime())
      ? new Date(ratesInfo.asOf).toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
  const ratesNote = {
    loading: "Loading exchange rates...",
    live: `Rates as of ${ratesDate || "today"}`,
    cached: `Saved rates from ${ratesDate || "an earlier visit"} (offline)`,
    unavailable: "Live rates unavailable, showing CAD only",
  }[ratesStatus];

  useEffect(() => {
    localStorage.setItem(
      "finwise_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const [month, setMonth] = useState(currentMonth);
  const months = [
    ...new Set([currentMonth(), month, ...transactions.map((item) => monthKey(item.date))]),
  ]
    .sort()
    .reverse();
  const { income, expenses, savings, allTimeNet, chartMonthly, chartExpense } =
    buildDashboard(transactions, month, convert);

  
  const summaryCards = [
    {
      title: "Total balance",
      value: format(convert(27051.72) + allTimeNet),
      subtitle: "Demo balance plus all recorded activity",
      icon: Wallet,
      style: "green",
    },
    {
      title: "Monthly income",
      value: format(income),
      subtitle: monthLabel(month),
      icon: TrendingDown,
    },
    {
      title: "Monthly expenses",
      value: format(expenses),
      subtitle: monthLabel(month),
      icon: TrendingUp,
    },
    {
      title: "Monthly savings",
      value: format(savings),
      subtitle: income > 0
        ? `${((savings / income) * 100).toFixed(1)}% of income saved`
        : "Add income to calculate savings",
      icon: PiggyBank,
    },
  ];

  const handleAddTransaction = () =>
    setFormTx({ ...blankTransaction(), currency: activeCurrency });

  const saveTransaction = (transaction) => {
    setTransactions((previous) =>
      previous.some((item) => item.id === transaction.id)
        ? previous.map((item) => (item.id === transaction.id ? transaction : item))
        : [transaction, ...previous]
    );
    setFormTx(null);
  };

  const deleteTransaction = (transaction) => setDeleteTx(transaction);

  const confirmDelete = () => {
    setTransactions((previous) =>
      previous.filter((item) => item.id !== deleteTx.id)
    );
    setDeleteTx(null);
  };

  return (
    <CurrencyContext.Provider value={currencyValue}>
    <div className="app-container">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">F.</div>
          <span>FinWise</span>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <p className="menu-label">MENU</p>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => {
                setActivePage(name);
                setMenuOpen(false);
              }}
            >
              <Icon size={20} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <button
          className={`nav-item settings-link ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => setActivePage("Settings")}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>

        <div className="demo-notice">
          <strong>Demo workspace</strong>
          <p>Sample data is currently stored in this session.</p>
          <p>
            Exchange rates by{" "}
            <a
              href={(RATE_SOURCES.find((source) => source.name === ratesInfo?.source) || RATE_SOURCES[0]).home}
              target="_blank"
              rel="noreferrer"
            >
              {ratesInfo?.source || RATE_SOURCES[0].name}
            </a>
          </p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={23} />
          </button>

          <div className="welcome">
            <h2>Welcome back</h2>
            <p>
              {new Date().toLocaleDateString("en-CA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="topbar-right">
            <select
              className="currency-select"
              aria-label="Month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              {months.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key)}
                </option>
              ))}
            </select>
            <div className="currency-picker">
              <select
                className="currency-select"
                aria-label="Display currency"
                value={activeCurrency}
                onChange={(event) => changeCurrency(event.target.value)}
              >
                {availableCurrencies.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name}
                  </option>
                ))}
              </select>
              <span className="rates-note">{ratesNote}</span>
            </div>
            <button className="notification-button" aria-label="Notifications">
              <Bell size={21} />
            </button>
            <div className="profile-avatar">DU</div>
            <div className="profile-info">
              <strong>Demo user</strong>
              <span>Sample data</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <h1>{activePage}</h1>
              <p>Your finances at a glance.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setActivePage("Transactions");
                handleAddTransaction();
              }}
            >
              <Plus size={19} />
              Add transaction
            </button>
          </div>

          {activePage === "Dashboard" ? (
            <>
              <section className="summary-grid">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      className={`summary-card ${card.style || ""}`}
                      key={card.title}
                    >
                      <div className="card-top">
                        <span>{card.title}</span>
                        <div className="card-icon">
                          <Icon size={21} />
                        </div>
                      </div>
                      <h2>{card.value}</h2>
                      <p>{card.subtitle}</p>
                    </div>
                  );
                })}
              </section>

              <section className="chart-grid">
                <div className="panel income-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Income vs expenses</h3>
                      <p>Last six months</p>
                    </div>
                    <div className="chart-legend">
                      <span><i className="dot income-dot" />Income</span>
                      <span><i className="dot expense-dot" />Expenses</span>
                    </div>
                  </div>

                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMonthly}>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="#E8EFEA"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis width={72}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => compactMoney(value, activeCurrency)}
                        />
                        <Tooltip formatter={(value) => format(value)} />
                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#16865B"
                          radius={[5, 5, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#B5DCC8"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel expense-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Spending breakdown</h3>
                      <p>{monthLabel(month)}</p>
                    </div>
                  </div>

                  <div className="pie-container">
                    {chartExpense.length === 0 && (
                      <p className="empty-message">No expenses in this month.</p>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartExpense}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {chartExpense.map((entry, index) => (
                            <Cell key={entry.name} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => format(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="panel transactions-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent transactions</h3>
                    <p>Your latest financial activity</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all
                  </button>
                </div>

                <TransactionTable
                  transactions={[...transactions]
                    .sort((a, b) => toTime(b.date) - toTime(a.date))
                    .slice(0, 5)}
                />
              </section>
            </>
          ) : activePage === "Transactions" ? (
          <TransactionsPage
            transactions={transactions}
            onAdd={handleAddTransaction}
            onEdit={(item) => setFormTx(item)}
            onDelete={deleteTransaction}
          />
        ) : (
          <section className="panel page-placeholder">
              <div className="placeholder-icon">
                <Sparkles size={30} />
              </div>
              <h2>{activePage}</h2>
              <p>
                This section is planned for the next development stages.
                Your dashboard and transaction data are ready to build on.
              </p>
              
            </section>
          )}
        </div>
      </main>

      {formTx && (
        <TransactionForm
          key={formTx.id}
          initial={formTx}
          onSave={saveTransaction}
          onClose={() => setFormTx(null)}
        />
      )}

      {deleteTx && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`"${deleteTx.title}" (${money(deleteTx.amount, deleteTx.currency || "CAD")}) will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTx(null)}
        />
      )}
    </div>
    </CurrencyContext.Provider>
  );
}

function TransactionTable({ transactions, onEdit, onDelete }) {
  const { currency, format, convert } = useCurrency();

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            {onEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="transaction-name">
                  <div className={`transaction-icon ${item.type.toLowerCase()}`}>
                    {item.type === "Income" ? (
                      <ArrowDownLeft size={17} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </div>
                  <strong>{item.title}</strong>
                </div>
              </td>
              <td>{item.category}</td>
              <td>{formatDate(item.date)}</td>
              <td>
                <span className={`type-label ${item.type.toLowerCase()}`}>
                  {item.type}
                </span>
              </td>
              <td className={`amount ${item.type.toLowerCase()}`}>
                {item.type === "Income" ? "+" : "-"}
                {format(convert(item.amount, item.currency))}
                {(item.currency || "CAD") !== currency && (
                  <small className="original-amount">
                    {money(item.amount, item.currency || "CAD")}
                  </small>
                )}
              </td>
              {onEdit && (
                <td className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <p className="empty-message">No transactions yet.</p>
      )}
    </div>
  );
}

function TransactionsPage({ transactions, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = [
    ...new Set([
      ...incomeCategories,
      ...expenseCategories,
      ...transactions.map((item) => item.category),
    ]),
  ];

  const visible = transactions
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => typeFilter === "All" || item.type === typeFilter)
    .filter((item) => categoryFilter === "All" || item.category === categoryFilter)
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  return (
    <section className="panel">
      <div className="filters-row">
        <input
          className="field"
          placeholder="Search by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="field"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="All">All types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <select
          className="field"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="All">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} /> Add transaction
        </button>
      </div>
      <p className="result-count">
        Showing {visible.length} of {transactions.length} transactions
      </p>
      <TransactionTable transactions={visible} onEdit={onEdit} onDelete={onDelete} />
    </section>
  );
}

function TransactionForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    ...initial,
    amount: String(initial.amount),
    date: toISO(initial.date),
  });
  const [error, setError] = useState("");
  const isEditing = Boolean(initial.title);

  const baseCategories = form.type === "Income" ? incomeCategories : expenseCategories;
  const categories = baseCategories.includes(form.category)
    ? baseCategories
    : [form.category, ...baseCategories];

  const update = (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const changeType = (type) =>
    setForm((previous) => ({
      ...previous,
      type,
      category: (type === "Income" ? incomeCategories : expenseCategories)[0],
    }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) return setError("Please enter a transaction name.");
    if (!Number.isFinite(amount) || amount <= 0)
      return setError("Amount must be greater than zero.");
    if (!form.date) return setError("Please choose a date.");
    onSave({ ...form, title: form.title.trim(), amount });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{isEditing ? "Edit transaction" : "Add transaction"}</h3>

        <label>
          Type
          <select
            className="field"
            value={form.type}
            onChange={(event) => changeType(event.target.value)}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </label>

        <label>
          Name
          <input
            className="field"
            value={form.title}
            maxLength={60}
            onChange={(event) => update("title", event.target.value)}
          />
        </label>

        <label>
          Amount (CAD)
          <input
            className="field"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
          />
        </label>

        <label>
          Category
          <select
            className="field"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            className="field"
            type="date"
            value={form.date}
            onChange={(event) => update("date", event.target.value)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
