const API_BASE_URL = 'https://crepepos.shop/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  role_id?: string;
  user_role: {
    name: string;
    code: string;
  };
}

export interface UserRegister {
  name: string
  email: string
  password: string
  role_id: string
}

export interface UserUpdate{
  name: string
  email: string
  password: string
  role_id: string
  is_active: boolean
}

export interface User_Role {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  is_active: boolean;
  type_id: string;
  branch_id: string;
  type_product?: {
    name: string;
  };
}

export interface ProductRegister {
  id: string;
  name: string;
  price: number;
  image: string;
  type_id: string;
  branch_id: string;
}

export interface ProductUpdate {
  id: string;
  name: string;
  price: number;
  image: string;
  is_active: boolean;
  type_id: string;
}

export interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit_measurement: string;
  cost_unit: number;
  branch_id: string;
}

export interface IngredientAdd {
  name: string;
  current_stock: number;
  min_stock: number;
  unit_measurement: string;
  cost_unit: number;
  branch_id: string;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  branch_id: string;
  combo_day?: string;
}

export interface Sale {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  user_id: string;
  user?: {
    name: string;
  };
  sale_detail?: SaleDetail[];
}

export interface ProductIngredient {
  id: string;
  updated_at: string;
  amount: number;
  is_base: boolean;
  product_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
}

export interface TypeProduct {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  branch_id: string
}

export interface SaleDetail {
  id: string
  created_at: string
  updated_at: string
  amount: number
  subtotal: number
  sale_id: string
  product_id: string
  combo_id: any
  product?: {name: string, price: number}
  combo?: {name: string, description: string, price: number}
}

export interface Branch {
  id: string
  created_at: string
  updated_at: string
  name: string
}

export interface UserBranch {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  branch_id: string
}

export interface ExpenseSubcategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  category_id: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
  expense_subcategory?: ExpenseSubcategory[];
}

export interface Expense {
  id: string;
  created_at: string;
  updated_at: string;
  date: string;
  amount: number;
  description?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  branch_id?: string | null;
  category?: ExpenseCategory | null;
  subcategory?: ExpenseSubcategory | null;
}

export interface ExpenseCreate {
  date: string;
  amount: number;
  description?: string;
  category_id: string;
  subcategory_id: string;
  branch_id: string;
}

export interface ExpenseUpdate {
  id: string;
  date?: string;
  amount?: number;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
}



class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async login(credentials: LoginCredentials) {
    const data = await this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async createProduct(product: Partial<ProductRegister>) {
    return this.request('/product/create', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(product: Partial<ProductUpdate>) {
    return this.request(`/product/update`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/product/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Ingredients
  async getIngredients() {
    return this.request('/ingredients');
  }

  async createIngredient(ingredient: Partial<IngredientAdd>) {
    return this.request('/ingredient/create', {
      method: 'POST',
      body: JSON.stringify(ingredient),
    });
  }

  async updateIngredient(ingredient: Partial<Ingredient>) {
    return this.request(`/ingredient/update`, {
      method: 'PUT',
      body: JSON.stringify(ingredient),
    });
  }

  async deleteIngredient(id: string) {
    return this.request(`/ingredient/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Combos
  async getCombos() {
    return this.request('/combo/all');
  }

  async createCombo(combo: Partial<Combo>) {
    return this.request('/combo/create', {
      method: 'POST',
      body: JSON.stringify(combo),
    });
  }

  async updateCombo(id: string, combo: Partial<Combo>) {
    return this.request(`/combo/update`, {
      method: 'PUT',
      body: JSON.stringify({ ...combo, id }),
    });
  }

  async deleteCombo(id: string) {
    return this.request(`/combo/delete/${id}`, {
      method: 'DELETE',
    });
  }

  // Type Products
  async getTypeProducts() {
    return this.request('/type_products');
  }

  // Sales
  async getSales() {
    return this.request('/sale/all');
  }

  async getDashboardStats(branchId?: string, params?: { period?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (branchId) queryParams.append('branch_id', branchId);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/dashboard/stats${queryString}`);
  }

   async deleteSale(id: string) {
     return this.request(`/sale/delete`, {
      method: 'DELETE',
      body: JSON.stringify({id})
    });
  }

  async getSaleDetail(saleId: string) {
    return this.request(`/sale/detail/${saleId}`);
  }

  async deleteSaleDetail(id: string) {
     return this.request(`/sale/detail/delete`, {
      method: 'DELETE',
      body: JSON.stringify({id})
    });
  }

  // Users
  async getUsers() {
    return this.request('/user/all');
  }

  async getUserRoles() {
    return this.request('/user/roles');
  }

  async getCashier() {
    return this.request(`/user/cashier`);
  }

  async createUser(user: Partial<User> & { password: string }) {
    return this.request('/user/create', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: Partial<User>) {
    return this.request(`/user/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/user/delete/${id}`, {
      method: 'DELETE',
    });
  }

  // Product Ingredients
  async getProductIngredients(productId: string) {
    return this.request(`/product/ingredient/${productId}`);
  }

  async addProductIngredient(productId: string, ingredientId: string, amount: number, is_base: boolean = false) {
    return this.request(`/product/ingredient/create`, {
      method: 'POST',
      body: JSON.stringify({  amount, is_base, ingredient_id: ingredientId, product_id: productId }),
    });
  }

  async deleteProductIngredient(id: string) {
    return this.request(`/product/ingredient/delete`, {
      method: 'DELETE',
      body: JSON.stringify({id})
    });
  }

  // Branches
  async getBranches() {
    return this.request('/branch/all');
  }

  async getUserBranches() {
    return this.request(`/user/branch/all`);
  }

  // Expense Categories
  async getExpenseCategories() {
    return this.request('/expense-categories');
  }

  async createExpenseCategory(data: { name: string; branch_id: string }) {
    return this.request('/expense-category/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpenseCategory(id: string, data: { name: string }) {
    return this.request(`/expense-category/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpenseCategory(id: string) {
    return this.request(`/expense-category/delete/${id}`, {
      method: 'DELETE',
    });
  }

  async createExpenseSubcategory(data: { name: string; category_id: string }) {
    return this.request('/expense-subcategory/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpenseSubcategory(id: string, data: { name: string }) {
    return this.request(`/expense-subcategory/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpenseSubcategory(id: string) {
    return this.request(`/expense-subcategory/delete/${id}`, {
      method: 'DELETE',
    });
  }

  // Expenses
  async getExpenses() {
    return this.request('/expenses');
  }

  async getExpensesSummary(branchId?: string, params?: { period?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (branchId) queryParams.append('branch_id', branchId);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/expenses/summary${queryString}`);
  }

  async createExpense(expense: ExpenseCreate) {
    return this.request('/expense/create', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(expense: ExpenseUpdate) {
    return this.request('/expense/update', {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string) {
    return this.request('/expense/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }
}

export const api = new ApiService();