import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { isValidEmail, sanitizeString, hasXSSPatterns } from '../utils/validation';
import { setToken, setUserData, logSecurityEvent } from '../services/securityService';

function Login({ setIsLoggedIn, setUserRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  // Verificar si está bloqueado por demasiados intentos
  useEffect(() => {
    if (attempts >= 5) {
      setError('Demasiados intentos fallidos. Intenta más tarde.');
      logSecurityEvent('login_blocked_too_many_attempts', { attempts });
    }
  }, [attempts]);

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!email) {
      newErrors.email = 'Email es requerido';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña
    if (!password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'Contraseña debe tener mínimo 6 caracteres';
    }

    // Detectar XSS
    if (hasXSSPatterns(email) || hasXSSPatterns(password)) {
      logSecurityEvent('xss_attempt_detected', { field: 'login' });
      newErrors.security = 'Entrada sospechosa detectada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar formulario
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Bloquear si hay demasiados intentos
    if (attempts >= 5) {
      setError('Demasiados intentos fallidos. Intenta más tarde.');
      setLoading(false);
      return;
    }

    try {
      // Sanitizar inputs
      const sanitizedEmail = sanitizeString(email);
      const sanitizedPassword = password; // No sanitizar contraseña

      const response = await authAPI.login({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      const { token, user } = response.data;

      // Validar token antes de almacenar
      if (!token || typeof token !== 'string') {
        throw new Error('Token inválido recibido del servidor');
      }

      // Almacenar de forma segura
      setToken(token);
      setUserData(user);

      setIsLoggedIn(true);
      setUserRole(user.role);

      logSecurityEvent('login_success', { email: sanitizedEmail });

      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMsg);

      // Incrementar contador de intentos
      setAttempts(prev => prev + 1);

      logSecurityEvent('login_failed', {
        email: sanitizeString(email),
        reason: errorMsg,
        attempts: attempts + 1,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #5B3FA0 0%, #2D1B69 100%)' }}>
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ backgroundColor: '#00B894' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" style={{ backgroundColor: '#5B3FA0' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 animate-slide-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/impulsa-talento-logo.png" alt="IMPULSA TALENTO" className="h-48 w-48 mx-auto" />
            <p className="text-gray-600 text-sm mt-4">Sistema Integral de Evaluación de Talentos</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-slide-in-down">
                <span className="text-lg">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:border-transparent focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  style={
                    !errors.email ? { '--tw-ring-color': '#5B3FA0' } : {}
                  }
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:border-transparent focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  style={
                    !errors.password ? { '--tw-ring-color': '#5B3FA0' } : {}
                  }
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              style={{
                backgroundColor: '#5B3FA0',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4a2f85'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#5B3FA0'}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cargando...
                </>
              ) : (
                <>
                  Ingresar
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Enlace de registro */}
          <p className="text-center text-gray-600 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#5B3FA0' }}>
              Registrarse
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default Login;
