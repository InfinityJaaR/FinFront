import axios from 'axios';
import url from '../utils/url';

class AuthService {
  // Login - Paso 1: Verificar email
  async checkEmail(email) {
    try {
      const response = await axios.post(`${url}login`, { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Login - Paso 2: Login con contraseña
  async login(email, password) {
    try {
      const response = await axios.post(`${url}login`, { email, password });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('permissions', JSON.stringify(response.data.permissions || []));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Establecer contraseña
  async setPassword(userId, password) {
    try {
      const response = await axios.post(`${url}set-password`, {
        id: userId,
        password: password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${url}logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    } catch (error) {
      // Limpiar localStorage incluso si falla la petición
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      throw error;
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obtener token
  getToken() {
    return localStorage.getItem('token');
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }

  // Obtener permisos del usuario
  getPermissions() {
    const permissionsStr = localStorage.getItem('permissions');
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  }

  // Verificar si tiene un permiso específico
  hasPermission(permission) {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  // Obtener rol del usuario
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.roles?.[0]?.name || null;
  }
}

export default new AuthService();

// Función auxiliar para headers de autenticación
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};
