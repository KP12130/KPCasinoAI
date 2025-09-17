import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, createUserDocument } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userData: any;
  setUserData: (data: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userData: null,
  setUserData: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await createUserDocument(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    userData,
    setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
