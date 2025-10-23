import { useNavigate } from 'react-router-dom';
import FinancialLogin from "../../components/ui/Auth/Login"
import logo from "../../assets/logo.png"
import { useAuth } from "../../hooks/auth/useAuth"

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, checkEmail, setPassword } = useAuth();

  // Función para manejar el login
  const handleLogin = async (email, password) => {
    try {
      const response = await login(email, password);
      
      // Si el login es exitoso, redirigir al dashboard
      if (response.access_token) {
        // El token ya está guardado en localStorage por authService.login()
        // Disparar un evento storage personalizado para que App.jsx lo detecte
        window.dispatchEvent(new Event('storage'));
        
        // Navegar al dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función para manejar el registro (establecer contraseña)
  const handleRegister = async (email, password) => {
    try {
      // Primero verificamos el email para obtener el ID del usuario
      const checkResponse = await checkEmail(email);
      
      if (checkResponse.require_password && checkResponse.id) {
        // Establecer la contraseña
        await setPassword(checkResponse.id, password);
        
        // No hacer login automático, solo retornar éxito
        // El componente Login cambiará a la fase "password"
        return { success: true };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  return (
    <FinancialLogin 
      onLogin={handleLogin}
      onRegister={handleRegister}
      overlayImage={{
        src: logo,
        alt: "Imagen simbolica",
        width: 500,
        height: 500
      }}
    />
  );
}
  