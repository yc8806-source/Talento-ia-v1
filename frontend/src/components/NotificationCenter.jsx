import React, { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { onNotification } from '../services/notificationService';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Suscribirse a notificaciones
    const unsubscribe = onNotification((notification) => {
      const id = Date.now();
      const notifWithId = { ...notification, id };

      setNotifications(prev => [notifWithId, ...prev]);

      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`${getBgColor(notification.severity)} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-down`}
        >
          {getIcon(notification.severity)}

          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          </div>

          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;
