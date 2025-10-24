import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

interface Message {
  _id: string;
  chatRoomId: string;
  senderType: 'customer' | 'service_provider' | 'admin';
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];
}

const CustomerChat: React.FC = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [providerInfo, setProviderInfo] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user._id || user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        // Fetch chat room info
        const chatRoomResponse = await axios.get(`${API_BASE_URL}/chats/${chatRoomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Get chat room details
        const allChatRooms = await axios.get(`${API_BASE_URL}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const currentChatRoom = allChatRooms.data.find((room: any) => room._id === chatRoomId);
        setChatRoom(currentChatRoom);
        
        // Fetch provider info if we have the chat room and provider ID
        if (currentChatRoom?.supplierId) {
          try {
            const providerResponse = await axios.get(`${API_BASE_URL}/users/${currentChatRoom.supplierId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setProviderInfo(providerResponse.data);
          } catch (err) {
            console.error('Error fetching provider info:', err);
          }
        }

        setMessages(chatRoomResponse.data);

        // Mark messages as read
        if (userId) {
          await axios.patch(
            `${API_BASE_URL}/chats/${chatRoomId}/messages/read`,
            { userId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Fetch chat data error:', errorMessage, error);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    if (userId && chatRoomId) {
      fetchChatData();
    }
  }, [chatRoomId, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chats/${chatRoomId}/message`,
        {
          senderType: 'customer',
          senderId: userId,
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Send message error:', errorMessage, error);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Chat with Support
          </Typography>
          {providerInfo && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={`${providerInfo.firstName} ${providerInfo.lastName}`} 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label={providerInfo.email} 
                variant="outlined" 
                size="small" 
              />
            </Box>
          )}
        </Box>
      </Box>
      <List sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        {messages.map((message) => (
          <ListItem
            key={message._id}
            sx={{
              justifyContent: message.senderId === userId ? 'flex-end' : 'flex-start',
              bgcolor: message.senderId === userId ? 'primary.light' : 'grey.100',
              m: 1,
              borderRadius: 2,
              maxWidth: '70%',
            }}
          >
            <ListItemText
              primary={message.content}
              secondary={format(new Date(message.timestamp), 'MMM dd, yyyy hh:mm a')}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button variant="contained" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default CustomerChat;
