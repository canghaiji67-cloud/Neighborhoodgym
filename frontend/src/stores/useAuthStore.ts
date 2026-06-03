import { create } from 'zustand';
import api from '../services/api';

interface UserInfo {
  id: number;
  walletAddress: string;
  nickname: string;
  avatar: string | null;
  phone: string | null;
  role: 'member' | 'admin';
  memberLevel: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isConnected: boolean;
  walletAddress: string | null;
  loading: boolean;

  // Actions
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  getNonce: (walletAddress: string) => Promise<string>;
  login: (walletAddress: string, signature: string) => Promise<{ needRegister: boolean }>;
  register: (data: { walletAddress: string; nickname: string; phone?: string; txHash?: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: UserInfo) => void;
  loadFromStorage: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isConnected: false,
  walletAddress: null,
  loading: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isConnected: true, walletAddress: user.walletAddress });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  connectWallet: async () => {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask 钱包插件');
    }

    set({ loading: true });
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('未获取到钱包地址');
      }

      const address = accounts[0].toLowerCase();
      set({ walletAddress: address, isConnected: true, loading: false });
      return address;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      walletAddress: null,
      token: null,
      user: null,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getNonce: async (walletAddress: string) => {
    const res = await api.get('/auth/nonce', { params: { walletAddress } });
    return res.data.data.nonce;
  },

  login: async (walletAddress: string, signature: string) => {
    const res = await api.post('/auth/login', { walletAddress, signature });
    const { token, user, needRegister } = res.data.data;

    if (!needRegister && token && user) {
      set({ token, user, isConnected: true, walletAddress: user.walletAddress });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { needRegister };
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data.data;

    set({ token, user, isConnected: true, walletAddress: user.walletAddress });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: () => {
    set({
      token: null,
      user: null,
      isConnected: false,
      walletAddress: null,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  setUser: (user: UserInfo) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },
}));

export default useAuthStore;
