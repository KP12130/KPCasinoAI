import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '../lib/firebase';

export const useAuth = () => {
  const context = useAuthContext();

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return {
    ...context,
    login,
    logout,
  };
};
