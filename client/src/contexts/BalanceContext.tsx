import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserData, updateUserBalance } from '../lib/firebase';

interface BalanceContextType {
  balance: number;
  updateBalance: (newBalance: number, wagered: number, won: number) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType>({
  balance: 0,
  updateBalance: async () => {},
});

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, setUserData } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      setUserData(data);
    });

    return unsubscribe;
  }, [user, setUserData]);

  const updateBalance = async (newBalance: number, wagered: number, won: number) => {
    if (!user) return;
    
    const totalWagered = (userData?.totalWagered || 0) + wagered;
    const totalWon = (userData?.totalWon || 0) + won;
    
    await updateUserBalance(user.uid, newBalance, totalWagered, totalWon);
  };

  const value = {
    balance: userData?.balance || 0,
    updateBalance,
  };

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
};
