import { useState, useEffect } from 'react';
import authService from '../../services/auth/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(authService.isAuthenticated());
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const checkEmail = async (email) => {
    return await authService.checkEmail(email);
  };

  const setPassword = async (userId, password) => {
    return await authService.setPassword(userId, password);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  const getUserRole = () => {
    return authService.getUserRole();
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    checkEmail,
    setPassword,
    logout,
    hasPermission,
    getUserRole,
  };
};
