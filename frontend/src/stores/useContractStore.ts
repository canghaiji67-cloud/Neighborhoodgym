import { create } from 'zustand';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../utils/contractAddresses';
import FitTokenABI from '../abis/FitToken.json';
import MembershipManagerABI from '../abis/MembershipManager.json';
import CheckInABI from '../abis/CheckIn.json';
import AchievementBadgeABI from '../abis/AchievementBadge.json';

interface ContractState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contracts: {
    fitToken: ethers.Contract | null;
    membershipManager: ethers.Contract | null;
    checkIn: ethers.Contract | null;
    achievementBadge: ethers.Contract | null;
  };

  // Actions
  initProvider: () => Promise<void>;
  getSigner: () => Promise<ethers.JsonRpcSigner>;
  getContract: (name: keyof typeof CONTRACT_ADDRESSES) => ethers.Contract | null;
  reset: () => void;
}

const useContractStore = create<ContractState>((set, get) => ({
  provider: null,
  signer: null,
  contracts: {
    fitToken: null,
    membershipManager: null,
    checkIn: null,
    achievementBadge: null,
  },

  initProvider: async () => {
    if (!window.ethereum) {
      throw new Error('请安装 MetaMask 钱包插件');
    }

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();

    const fitToken = new ethers.Contract(
      CONTRACT_ADDRESSES.FitToken,
      FitTokenABI,
      signer
    );
    const membershipManager = new ethers.Contract(
      CONTRACT_ADDRESSES.MembershipManager,
      MembershipManagerABI,
      signer
    );
    const checkIn = new ethers.Contract(
      CONTRACT_ADDRESSES.CheckIn,
      CheckInABI,
      signer
    );
    const achievementBadge = new ethers.Contract(
      CONTRACT_ADDRESSES.AchievementBadge,
      AchievementBadgeABI,
      signer
    );

    set({
      provider,
      signer,
      contracts: { fitToken, membershipManager, checkIn, achievementBadge },
    });
  },

  getSigner: async () => {
    let { signer, provider } = get();
    if (signer) return signer;

    if (!window.ethereum) throw new Error('请安装 MetaMask 钱包插件');
    provider = new ethers.BrowserProvider(window.ethereum as any);
    signer = await provider.getSigner();
    set({ provider, signer });
    return signer;
  },

  getContract: (name) => {
    const { contracts } = get();
    const map: Record<string, ethers.Contract | null> = {
      FitToken: contracts.fitToken,
      MembershipManager: contracts.membershipManager,
      CheckIn: contracts.checkIn,
      AchievementBadge: contracts.achievementBadge,
    };
    return map[name] || null;
  },

  reset: () => {
    set({
      provider: null,
      signer: null,
      contracts: {
        fitToken: null,
        membershipManager: null,
        checkIn: null,
        achievementBadge: null,
      },
    });
  },
}));

export default useContractStore;
