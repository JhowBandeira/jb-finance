import axios from "axios";
import type {
  Category,
  Dashboard,
  Transaction,
  TransactionPayload,
  TransactionType,
} from "./types";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const financeApi = {
  async getCategories(type?: TransactionType) {
    const { data } = await api.get<Category[]>("/categories", {
      params: type ? { type } : {},
    });
    return data;
  },

  async createCategory(payload: Omit<Category, "id">) {
    const { data } = await api.post<Category>("/categories", payload);
    return data;
  },

  async updateCategory(id: number, payload: Omit<Category, "id">) {
    const { data } = await api.put<Category>(`/categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id: number) {
    await api.delete(`/categories/${id}`);
  },

  async getTransactions(month: number, year: number) {
    const { data } = await api.get<Transaction[]>("/transactions", {
      params: { month, year },
    });
    return data;
  },

  async createTransaction(payload: TransactionPayload) {
    const { data } = await api.post<Transaction>("/transactions", payload);
    return data;
  },

  async updateTransaction(id: number, payload: TransactionPayload) {
    const { data } = await api.put<Transaction>(`/transactions/${id}`, payload);
    return data;
  },

  async duplicateTransaction(id: number) {
    const { data } = await api.post<Transaction>(
      `/transactions/${id}/duplicate`,
    );
    return data;
  },

  async deleteTransaction(id: number) {
    await api.delete(`/transactions/${id}`);
  },

  async getDashboard(month: number, year: number) {
    const { data } = await api.get<Dashboard>("/dashboard", {
      params: { month, year },
    });
    return data;
  },
};
