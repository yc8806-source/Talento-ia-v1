import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';
import { onMessage, sendPrivateMessage } from '../services/notificationService';

function RealTimeChat({ recipientId, recipientName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Suscribirse a mensajes
    const unsubscribe = onMessage((message) => {
      // Solo mostrar mensajes de este destinatario
      if (
        (message.senderId === recipientId && message.recipientId === currentUser.id) ||
        (message.senderId === currentUser.id && message.recipientId === recipientId)
      ) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return unsubscribe;
  }, [recipientId, currentUser.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Enviar mensaje
    sendPrivateMessage(recipientId, inputValue);

    // Agregar a la lista local
    setMessages(prev => [...prev, {
      senderId: currentUser.id,
      senderName: currentUser.firstName,
      content: inputValue,
      timestamp: new Date(),
    }]);

    setInputValue('');
    scrollToBottom();
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-40 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">{recipientName}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">Sin mensajes aún</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === currentUser.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default RealTimeChat;
