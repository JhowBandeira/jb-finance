import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  List,
  Moon,
  Plus,
  Settings,
  Sun,
  Tags,
  Trash2,
  Pencil,
  Copy,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { financeApi } from "./api";
import type {
  Category,
  Dashboard,
  Transaction,
  TransactionPayload,
  TransactionType,
} from "./types";

type Page = "dashboard" | "transactions" | "categories" | "settings";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const emptyDashboard: Dashboard = {
  income: 0,
  expenses: 0,
  balance: 0,
  result: 0,
};

const today = new Date().toISOString().slice(0, 10);

function App() {
  const now = new Date();
  const [page, setPage] = useState<Page>("dashboard");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dark, setDark] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactionModal, setTransactionModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  async function reload() {
    const [dash, tx, cats] = await Promise.all([
      financeApi.getDashboard(month, year),
      financeApi.getTransactions(month, year),
      financeApi.getCategories(),
    ]);
    setDashboard(dash);
    setTransactions(tx);
    setCategories(cats);
  }

  useEffect(() => {
    reload().catch(console.error);
  }, [month, year]);

  const chartData = useMemo(
    () => [
      { name: "Receitas", valor: dashboard.income },
      { name: "Despesas", valor: dashboard.expenses },
    ],
    [dashboard],
  );

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">JB</div>
          <div>
            <strong>JB Finance</strong>
            <small>Controle pessoal</small>
          </div>
        </div>

        <nav>
          <NavButton
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavButton
            active={page === "transactions"}
            onClick={() => setPage("transactions")}
            icon={<List size={20} />}
            label="Movimentações"
          />
          <NavButton
            active={page === "categories"}
            onClick={() => setPage("categories")}
            icon={<Tags size={20} />}
            label="Categorias"
          />
          <NavButton
            active={page === "settings"}
            onClick={() => setPage("settings")}
            icon={<Settings size={20} />}
            label="Configurações"
          />
        </nav>

        <button className="theme-button" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? "Tema claro" : "Tema escuro"}
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>{pageTitle(page)}</h1>
            <p>Controle simples de entradas e saídas.</p>
          </div>

          <div className="top-actions">
            <input
              type="month"
              value={`${year}-${String(month).padStart(2, "0")}`}
              onChange={(event) => {
                const [newYear, newMonth] = event.target.value
                  .split("-")
                  .map(Number);
                setYear(newYear);
                setMonth(newMonth);
              }}
            />
            <button
              className="primary"
              onClick={() => {
                setEditingTransaction(null);
                setTransactionModal(true);
              }}
            >
              <Plus size={18} /> Nova movimentação
            </button>
          </div>
        </header>

        {page === "dashboard" && (
          <DashboardPage
            dashboard={dashboard}
            chartData={chartData}
            transactions={transactions.slice(0, 6)}
          />
        )}

        {page === "transactions" && (
          <TransactionsPage
            transactions={transactions}
            onEdit={(item) => {
              setEditingTransaction(item);
              setTransactionModal(true);
            }}
            onDuplicate={async (id) => {
              await financeApi.duplicateTransaction(id);
              await reload();
            }}
            onDelete={async (id) => {
              if (confirm("Deseja excluir esta movimentação?")) {
                await financeApi.deleteTransaction(id);
                await reload();
              }
            }}
          />
        )}

        {page === "categories" && (
          <CategoriesPage
            categories={categories}
            onNew={() => {
              setEditingCategory(null);
              setCategoryModal(true);
            }}
            onEdit={(category) => {
              setEditingCategory(category);
              setCategoryModal(true);
            }}
            onDelete={async (id) => {
              if (confirm("Deseja excluir esta categoria?")) {
                try {
                  await financeApi.deleteCategory(id);
                  await reload();
                } catch {
                  alert("Esta categoria possui movimentações e não pode ser excluída.");
                }
              }
            }}
          />
        )}

        {page === "settings" && (
          <section className="panel">
            <h2>Configurações</h2>
            <p>
              O sistema usa banco SQLite local. Para fazer backup, copie o
              arquivo <code>backend/finance.db</code>.
            </p>
          </section>
        )}
      </main>

      {transactionModal && (
        <TransactionModal
          categories={categories}
          transaction={editingTransaction}
          onClose={() => setTransactionModal(false)}
          onSave={async (payload) => {
            if (editingTransaction) {
              await financeApi.updateTransaction(editingTransaction.id, payload);
            } else {
              await financeApi.createTransaction(payload);
            }
            setTransactionModal(false);
            await reload();
          }}
        />
      )}

      {categoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setCategoryModal(false)}
          onSave={async (payload) => {
            if (editingCategory) {
              await financeApi.updateCategory(editingCategory.id, payload);
            } else {
              await financeApi.createCategory(payload);
            }
            setCategoryModal(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function DashboardPage({
  dashboard,
  chartData,
  transactions,
}: {
  dashboard: Dashboard;
  chartData: { name: string; valor: number }[];
  transactions: Transaction[];
}) {
  return (
    <>
      <section className="cards">
        <StatCard label="Saldo atual" value={dashboard.balance} kind="balance" />
        <StatCard label="Receitas do mês" value={dashboard.income} kind="income" />
        <StatCard
          label="Despesas do mês"
          value={dashboard.expenses}
          kind="expense"
        />
        <StatCard label="Resultado mensal" value={dashboard.result} kind="result" />
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <h2>Receitas x Despesas</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Bar dataKey="valor" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-title">
            <h2>Últimas movimentações</h2>
          </div>
          <TransactionList transactions={transactions} compact />
        </div>
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind: "balance" | "income" | "expense" | "result";
}) {
  return (
    <article className={`stat-card ${kind}`}>
      <span>{label}</span>
      <strong>{currency.format(value)}</strong>
      <small>
        {kind === "income" ? (
          <ArrowUpCircle size={16} />
        ) : kind === "expense" ? (
          <ArrowDownCircle size={16} />
        ) : null}
        Atualizado automaticamente
      </small>
    </article>
  );
}

function TransactionsPage({
  transactions,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (item: Transaction) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Movimentações do período</h2>
        <span>{transactions.length} registro(s)</span>
      </div>
      <TransactionList
        transactions={transactions}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </section>
  );
}

function TransactionList({
  transactions,
  compact = false,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  transactions: Transaction[];
  compact?: boolean;
  onEdit?: (item: Transaction) => void;
  onDuplicate?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  if (transactions.length === 0) {
    return <div className="empty">Nenhuma movimentação encontrada.</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((item) => (
        <article className="transaction-item" key={item.id}>
          <div className="transaction-icon">{item.category.icon}</div>
          <div className="transaction-main">
            <strong>{item.description}</strong>
            <span>
              {item.category.name} ·{" "}
              {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="transaction-status">
            <span className={`badge ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
          <strong
            className={item.type === "RECEITA" ? "amount income" : "amount expense"}
          >
            {item.type === "RECEITA" ? "+" : "-"} {currency.format(item.amount)}
          </strong>
          {!compact && (
            <div className="row-actions">
              <button title="Editar" onClick={() => onEdit?.(item)}>
                <Pencil size={17} />
              </button>
              <button title="Duplicar" onClick={() => onDuplicate?.(item.id)}>
                <Copy size={17} />
              </button>
              <button title="Excluir" onClick={() => onDelete?.(item.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function CategoriesPage({
  categories,
  onNew,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  onNew: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Categorias editáveis</h2>
        <button className="secondary" onClick={onNew}>
          <Plus size={17} /> Nova categoria
        </button>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <article className="category-card" key={category.id}>
            <div className="category-icon">{category.icon}</div>
            <div>
              <strong>{category.name}</strong>
              <span>{category.type === "RECEITA" ? "Receita" : "Despesa"}</span>
            </div>
            <div className="row-actions">
              <button onClick={() => onEdit(category)}>
                <Pencil size={17} />
              </button>
              <button onClick={() => onDelete(category.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TransactionModal({
  categories,
  transaction,
  onClose,
  onSave,
}: {
  categories: Category[];
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (payload: TransactionPayload) => Promise<void>;
}) {
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "DESPESA",
  );
  const filteredCategories = categories.filter((item) => item.type === type);
  const [form, setForm] = useState<TransactionPayload>({
    description: transaction?.description ?? "",
    amount: transaction?.amount ?? 0,
    type,
    date: transaction?.date ?? today,
    status: transaction?.status ?? "CONFIRMADO",
    notes: transaction?.notes ?? "",
    category_id:
      transaction?.category_id ??
      filteredCategories[0]?.id ??
      categories.find((item) => item.type === type)?.id ??
      0,
  });

  useEffect(() => {
    const first = categories.find((item) => item.type === type);
    setForm((current) => ({
      ...current,
      type,
      category_id:
        categories.some(
          (item) => item.id === current.category_id && item.type === type,
        )
          ? current.category_id
          : first?.id ?? 0,
    }));
  }, [type, categories]);

  return (
    <Modal title={transaction ? "Editar movimentação" : "Nova movimentação"} onClose={onClose}>
      <div className="type-switch">
        <button
          className={type === "RECEITA" ? "selected income" : ""}
          onClick={() => setType("RECEITA")}
          type="button"
        >
          Receita
        </button>
        <button
          className={type === "DESPESA" ? "selected expense" : ""}
          onClick={() => setType("DESPESA")}
          type="button"
        >
          Despesa
        </button>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave(form);
        }}
      >
        <label>
          Descrição
          <input
            required
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </label>

        <div className="form-row">
          <label>
            Valor
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Data
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Categoria
            <select
              required
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: Number(e.target.value) })
              }
            >
              {filteredCategories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "CONFIRMADO" | "PENDENTE",
                })
              }
            >
              <option value="CONFIRMADO">Confirmado</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </label>
        </div>

        <label>
          Observação
          <textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (payload: Omit<Category, "id">) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<TransactionType>(
    category?.type ?? "DESPESA",
  );
  const [icon, setIcon] = useState(category?.icon ?? "📁");

  return (
    <Modal title={category ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave({ name, type, icon, active: true });
        }}
      >
        <div className="form-row">
          <label>
            Ícone
            <input value={icon} onChange={(e) => setIcon(e.target.value)} />
          </label>
          <label>
            Nome
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        <label>
          Tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function pageTitle(page: Page) {
  return {
    dashboard: "Visão geral",
    transactions: "Movimentações",
    categories: "Categorias",
    settings: "Configurações",
  }[page];
}

export default App;
