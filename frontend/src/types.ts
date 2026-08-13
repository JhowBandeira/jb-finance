export type TransactionType = "RECEITA" | "DESPESA";
export type TransactionStatus = "CONFIRMADO" | "PENDENTE";

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  icon: string;
  active: boolean;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  status: TransactionStatus;
  notes?: string | null;
  category_id: number;
  category: Category;
}

export interface Dashboard {
  income: number;
  expenses: number;
  balance: number;
  result: number;
}

export interface TransactionPayload {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  status: TransactionStatus;
  notes?: string;
  category_id: number;
}
