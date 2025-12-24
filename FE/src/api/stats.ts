// src/api/stats.ts
import axios from "@/utils/axios.customize";
import { Balance, PaymentStat, PersonalExpenseStat } from "@/types/stats.types";

export const getGroupPaymentStats = (
  groupId: string
): Promise<PaymentStat[]> => {
  return axios.get(`/api/expenses/group/${groupId}/stats`);
};

export const getGroupBalances = (groupId: string): Promise<Balance[]> => {
  return axios.get(`/api/debts/group/${groupId}/net-balances`);
};

export const getPersonalStatistics = (
  type: "day" | "week" | "month",
  date: string // yyyy-MM-dd
): Promise<PersonalExpenseStat> => {
  return axios.get(`/api/expenses/me/statistics`, {
    params: { type, date },
  });
};
