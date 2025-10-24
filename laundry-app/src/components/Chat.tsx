import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

interface Message {
  _id: string;
  senderType: 'customer' | 'service_provider' | 'admin';
  senderId: string;
  content: string;
  timestamp: string;
}

interface ChatProps {
  chatRoomId: string;
  userId: string;
  userRole: 'customer' | 'service_provider' | 'admin' | 'supplier';
  apiUrl: string; // e.g., process.env.REACT_APP_API_URL
}

const Chat: React.FC<ChatProps> = ({ chatRoomId, userId, userRole, apiUrl }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch chat history
    axios.get(`${apiUrl}/chats/${chatRoomId}/messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]));
  }, [chatRoomId, apiUrl]);

  useEffect(() => {
    // Connect to Socket.IO
    const socketBaseUrl = apiUrl.replace(/\/api$/, '');
    socketRef.current = io(socketBaseUrl, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket']
    });
    socketRef.current.emit('joinRoom', { chatRoomId });
    socketRef.current.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [chatRoomId, apiUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const normalizedRole = userRole === 'supplier' ? 'service_provider' : userRole;
    const msg = {
      chatRoomId,
      senderType: normalizedRole,
      senderId: userId,
      content: input.trim(),
    };
    socketRef.current.emit('sendMessage', msg);
    setInput('');
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, maxWidth: 500, margin: '0 auto', background: '#fff' }}>
      <div style={{ height: 300, overflowY: 'auto', marginBottom: 8, background: '#f9f9f9', padding: 8 }}>
        {messages.map((msg) => (
          <div key={msg._id} style={{ margin: '8px 0', textAlign: msg.senderId === userId ? 'right' : 'left' }}>
            <span style={{ fontWeight: 'bold', color: msg.senderType === 'customer' ? '#1976d2' : msg.senderType === 'service_provider' ? '#388e3c' : '#d32f2f' }}>
              {userRole === 'customer' && msg.senderType === 'service_provider' ? 'Provider' :
               userRole === 'customer' && msg.senderType === 'admin' ? 'Shop Owner' :
               (userRole === 'supplier' || userRole === 'service_provider') && msg.senderType === 'service_provider' ? 'Me' :
               msg.senderType === 'service_provider' ? 'Provider' :
               msg.senderType.charAt(0).toUpperCase() + msg.senderType.slice(1)}
            </span>
            <div style={{ display: 'inline-block', background: msg.senderId === userId ? '#e3f2fd' : '#eee', borderRadius: 8, padding: '4px 12px', marginLeft: 8 }}>
              {msg.content}
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} style={{ padding: '8px 16px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none' }}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
