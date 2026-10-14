/**
 * GasFlow Client API
 * Thin wrapper around all backend API routes.
 * Falls back gracefully to localStorage / local state on network error.
 */

import type { User, UserRole, StationConfig } from './types';

// ─── Base fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; offline: boolean }> {
  try {
    const res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include', // send HttpOnly cookie
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error ?? 'Unknown error.', offline: false };
    }

    return { data: json as T, error: null, offline: json.offline === true };
  } catch {
    // Network error — treat as offline
    return { data: null, error: 'Network unavailable — using local data.', offline: true };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export async function apiLogin(identifier: string, password: string, deviceId?: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, deviceId }),
  });
}

export async function apiLogout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export async function apiGetMe() {
  return apiFetch<{ authenticated: boolean; session: { userId: string; role: UserRole; name: string }; user: User }>('/auth/me');
}

export async function apiGetSetupStatus() {
  return apiFetch<{ initialized: boolean; userCount: number }>('/auth/setup-status');
}

export interface SetupAdminInput {
  name: string;
  username: string;
  email: string;
  password: string;
  pin?: string;
  phone?: string;
  branch?: string;
}

export async function apiSetupAdmin(data: SetupAdminInput) {
  return apiFetch<{ success: boolean; user: User; token: string }>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  pin?: string;
  role?: UserRole;
  phone?: string;
  branch?: string;
  stationName?: string;
  address?: string;
}

export async function apiRegister(data: RegisterInput) {
  return apiFetch<{ success: boolean; user: User; token?: string; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiGetState() {
  return apiFetch<{ success: boolean; state: any; syncedAt?: string }>('/state');
}

export async function apiUpdateStation(data: Partial<StationConfig> | Record<string, unknown>) {
  return apiFetch<{ success: boolean; station: unknown }>('/state', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiGetUsers() {
  return apiFetch<{ users: User[] }>('/users');
}

export async function apiToggleUserStatus(targetUserId: string, status: 'active' | 'inactive') {
  return apiFetch<{ success: boolean; user: User }>('/users', {
    method: 'PATCH',
    body: JSON.stringify({ targetUserId, status }),
  });
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface SaleInput {
  fuelType: string;
  tankId: string;
  litres: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
}

export async function apiCreateSale(data: SaleInput & { deviceId?: string }) {
  return apiFetch<{ success: boolean; sale: unknown; offline?: boolean }>('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiVoidSale(saleId: string, reason: string) {
  return apiFetch<{ success: boolean; offline?: boolean }>(`/sales/${saleId}/void`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

// ─── Tanks ────────────────────────────────────────────────────────────────────

export async function apiGetTanks() {
  return apiFetch<{ tanks: unknown[] }>('/tanks');
}

export interface DeliveryInput {
  litres: number;
  costPerLitre: number;
  totalCost: number;
  supplier: string;
  invoiceNumber: string;
  dipstickBefore?: number;
  dipstickAfter?: number;
}

export async function apiRecordDelivery(tankId: string, data: DeliveryInput) {
  return apiFetch<{ success: boolean; offline?: boolean }>(`/tanks/${tankId}`, {
    method: 'POST',
    body: JSON.stringify({ action: 'deliver', ...data }),
  });
}

export async function apiCalibrateTank(tankId: string, measuredLevel: number, notes?: string) {
  return apiFetch<{ success: boolean; offline?: boolean }>(`/tanks/${tankId}`, {
    method: 'POST',
    body: JSON.stringify({ action: 'calibrate', measuredLevel, notes }),
  });
}

export async function apiUpdateTankPrice(tankId: string, unitPrice: number) {
  return apiFetch<{ success: boolean; offline?: boolean }>(`/tanks/${tankId}`, {
    method: 'PATCH',
    body: JSON.stringify({ unitPrice }),
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  creditLimit?: number;
}

export async function apiGetCustomers() {
  return apiFetch<{ customers: unknown[] }>('/customers');
}

export async function apiAddCustomer(data: CustomerInput) {
  return apiFetch<{ success: boolean; customer: unknown; offline?: boolean }>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiRecordPayment(
  customerId: string,
  amount: number,
  paymentMethod: string,
  reference?: string
) {
  return apiFetch<{ success: boolean; payment: unknown; offline?: boolean }>(`/customers/${customerId}/payment`, {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethod, reference }),
  });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface ExpenseInput {
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  recipient: string;
  note?: string;
}

export async function apiAddExpense(data: ExpenseInput) {
  return apiFetch<{ success: boolean; expense: unknown; offline?: boolean }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function apiGetReportSummary(period: 'today' | 'week' | 'month' = 'today') {
  return apiFetch<Record<string, unknown>>(`/reports/summary?period=${period}`);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function apiHealthCheck() {
  return apiFetch<{ database: { status: string } }>('/health');
}
