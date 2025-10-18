import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Shield,
  Check,
  DollarSign,
  CreditCard,
  Wallet,
  PieChart,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import authService from "@/services/auth/authService"

const FinancialLogin = ({ onLogin, onRegister, overlayImage }) => {
  const [phase, setPhase] = useState("email")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [particles, setParticles] = useState([])
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false)

  // Generar partículas flotantes
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Validaciones
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 8
  }

  // Manejo de fases
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateEmail(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido")
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.checkEmail(formData.email)
      
      // Si require_password es true, el usuario necesita establecer contraseña
      if (response.require_password) {
        setFormData({ ...formData, userId: response.id })
        setPhase("create-password")
      } else {
        // Si ya tiene contraseña, ir a la fase de login
        setPhase("password")
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError("Usuario no encontrado")
      } else if (error.response?.status === 403) {
        setError("Tu cuenta está inactiva. Contacta al administrador.")
      } else {
        setError("Error al verificar el email. Intenta nuevamente.")
      }
    }
    setIsLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validatePassword(formData.password)) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsLoading(true)
    try {
      await onLogin?.(formData.email, formData.password)
      // Si llegamos aquí, el login fue exitoso
      // No seteamos isLoading a false para mantener el estado de carga
      // mientras se redirige
    } catch (err) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  const handleCreatePasswordSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validatePassword(formData.password)) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      await onRegister?.(formData.email, formData.password)
      
      // Limpiar las contraseñas del formulario
      setFormData({
        ...formData,
        password: "",
        confirmPassword: ""
      })
      
      // Cambiar a la fase de login para que ingrese la contraseña
      setPhase("password")
    } catch (err) {
      setError("Error al crear la cuenta. Inténtalo de nuevo.")
    }
    setIsLoading(false)
  }

  const handleBack = () => {
    setError("")
    if (phase === "password" || phase === "create-password") {
      setPhase("email")
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Columna Izquierda - Área Visual Animada */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Fondo con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 animate-gradient" />

        {/* Overlay con patrón */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Partículas flotantes */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
          {/* Logo/Imagen superpuesta */}
          {overlayImage ? (
            <div className="mb-8 animate-fade-in">
              <img
                src={overlayImage.src || "/placeholder.svg"}
                alt={overlayImage.alt}
                width={overlayImage.width || 200}
                height={overlayImage.height || 200}
                className="drop-shadow-2xl"
              />
            </div>
          ) : (
            <div className="mb-8 animate-bounce-slow">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Wallet className="h-16 w-16 text-white" />
              </div>
            </div>
          )}

          {/* Decoración de iconos flotantes */}
          <div className="absolute top-20 left-20 animate-float">
            <DollarSign className="h-12 w-12 text-white/20" />
          </div>
          <div className="absolute bottom-32 right-24 animate-float" style={{ animationDelay: "1s" }}>
            <CreditCard className="h-10 w-10 text-white/20" />
          </div>
          <div className="absolute top-1/2 right-16 animate-float" style={{ animationDelay: "2s" }}>
            <PieChart className="h-8 w-8 text-white/20" />
          </div>
        </div>

        {/* Brillo en la esquina */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
      </div>

      {/* Columna Derecha - Formulario con Glassmorphism */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Efecto de brillo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />

        <div className="w-full max-w-md relative z-10">
          {/* Card principal con glassmorphism */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-scale-in">
            {/* Header con icono animado */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="h-10 w-10 text-white animate-pulse-slow" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
                </div>
              </div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                {phase === "email" && "Bienvenido"}
                {phase === "password" && "Iniciar Sesión"}
                {phase === "create-password" && "Crear Cuenta"}
              </h1>
              <p className="text-gray-600">
                {phase === "email" && "Accede a tu cuenta de forma segura"}
                {phase === "password" && `Hola, ${formData.email.split("@")[0]}`}
                {phase === "create-password" && "Configura tu acceso seguro"}
              </p>
            </div>

            {/* Barra de progreso elegante */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Paso {phase === "email" ? "1" : phase === "create-password" ? "2" : "3"} de 3
                </span>
                <span className="text-xs font-medium text-blue-600">
                  {phase === "email" ? "33%" : phase === "create-password" ? "66%" : "100%"}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500 ease-out",
                    phase === "email" && "w-1/3",
                    phase === "create-password" && "w-2/3",
                    phase === "password" && "w-full",
                  )}
                />
              </div>
            </div>

            {/* Formularios */}
            <div className="space-y-6">
              {/* Fase 1: Email */}
              {phase === "email" && (
                <form onSubmit={handleEmailSubmit} className="space-y-5 animate-slide-in">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder:text-gray-500"
                          placeholder="tu@empresa.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {isLoading ? (
                      <>
                        <div className="relative h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="relative">Verificando...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative">Continuar</span>
                        <ArrowRight className="relative h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Fase 2: Contraseña */}
              {phase === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-slide-in">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder:text-gray-500"
                          placeholder="Ingresa tu contraseña"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{background:"transparent", border:"none", outline:"none"}}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      onMouseEnter={() => setIsBackButtonHovered(true)}
                      onMouseLeave={() => setIsBackButtonHovered(false)}
                      style={{
                        background: isBackButtonHovered ? "#E5E7EB" : "#F3F4F6",
                        border:"none", 
                        outline:"none"
                      }}
                      className="flex-1 text-gray-700 py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {isLoading ? (
                        <>
                          <div className="relative h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="relative">Ingresando...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative">Ingresar</span>
                          <ArrowRight className="relative h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* <div className="text-center">
                    <button
                      type="button"
                      style={{background:"transparent", border:"none", outline:"none"}}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-all"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div> */}
                </form>
              )}

              {/* Fase 3: Crear contraseña */}
              {phase === "create-password" && (
                <form onSubmit={handleCreatePasswordSubmit} className="space-y-5 animate-slide-in">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          id="new-password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder:text-gray-500"
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{background:"transparent", border:"none", outline:"none"}}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder:text-gray-500"
                          placeholder="Repite tu contraseña"
                          required
                        />
                        <button
                          type="button"
                          style={{background:"transparent", border:"none", outline:"none"}}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores de fortaleza */}
                  {formData.password && (
                    <div className="space-y-2 bg-blue-50 rounded-lg p-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-sm">
                        <Check
                          className={cn(
                            "h-4 w-4 transition-colors",
                            formData.password.length >= 8 ? "text-green-600" : "text-gray-400",
                          )}
                        />
                        <span className={cn(formData.password.length >= 8 ? "text-green-600" : "text-gray-500")}>
                          Mínimo 8 caracteres
                        </span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      onMouseEnter={() => setIsBackButtonHovered(true)}
                      onMouseLeave={() => setIsBackButtonHovered(false)}
                      style={{
                        background: isBackButtonHovered ? "#E5E7EB" : "#F3F4F6",
                        border:"none", 
                        outline:"none"
                      }}
                      className="flex-1 text-gray-700 py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {isLoading ? (
                        <>
                          <div className="relative h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="relative">Guardando...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative">Guardar</span>
                          <Check className="relative h-5 w-5 group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación personalizados */}
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default FinancialLogin
