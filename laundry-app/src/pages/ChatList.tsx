import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { format } from 'date-fns';

interface ChatRoom {
  _id: string;
  customerId: string;
  orderId?: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatItem {
  chatRoomId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Fetch chat rooms
      const chatRoomsResponse = await axios.get(`${API_BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chatRoomsResponse.data) {
        const chatRooms: ChatRoom[] = chatRoomsResponse.data;

        // Process each chat room to get additional data
        const processedChats: ChatItem[] = await Promise.all(
          chatRooms.map(async (room) => {
            try {
              console.log('Processing chat room:', room._id, 'Customer ID:', room.customerId);

              // Fetch customer details
              const customerResponse = await axios.get(
                `${API_BASE_URL}/users/${room.customerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const customer = customerResponse.data;
              console.log('Customer data:', customer);

              // Fetch last message
              const messagesResponse = await axios.get(
                `${API_BASE_URL}/chats/${room._id}/messages`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const messages = messagesResponse.data || [];
              console.log('Messages for chat room:', messages.length, 'messages');
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

              // Calculate unread count based on user role
              let unreadCount = 0;
              if (user?.role === 'admin' || user?.role === 'service_provider') {
                // For admin/service_provider: count messages sent by customers that they haven't read
                unreadCount = messages.filter(
                  (msg: any) => msg.senderType === 'customer' &&
                                (!msg.readBy || !msg.readBy.includes(user?.id))
                ).length;
              } else if (user?.role === 'customer') {
                // For customers: count messages sent by admin/service_provider that they haven't read
                unreadCount = messages.filter(
                  (msg: any) => (msg.senderType === 'admin' || msg.senderType === 'service_provider') &&
                                (!msg.readBy || !msg.readBy.includes(user?.id))
                ).length;
              }

              return {
                chatRoomId: room._id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerAvatar: customer.avatar,
                lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
                lastMessageTime: lastMessage ? lastMessage.timestamp : room.createdAt,
                unreadCount,
              };
            } catch (err) {
              const error = err as any;
              console.error('Error processing chat room:', room._id, error.response?.status, error.response?.data || error.message);
              return {
                chatRoomId: room._id,
                customerName: `Customer ${room.customerId?.slice(-4) || 'Unknown'}`,
                customerAvatar: undefined,
                lastMessage: error.response?.status === 404 ? 'No messages' : `API Error: ${error.response?.status || 'Unknown'}`,
                lastMessageTime: room.createdAt,
                unreadCount: 0,
              };
            }
          })
        );

        // Filter out chats with only error messages (but keep chats with no messages)
        const validChats = processedChats.filter(chat =>
          !chat.lastMessage.startsWith('API Error:') &&
          !chat.lastMessage.startsWith('Error loading messages')
        );

        // Sort by last message time (most recent first)
        validChats.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setChats(validChats);
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(err.response?.data?.error || 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = async (chatRoomId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Mark messages as read for the current user
        await axios.patch(
          `${API_BASE_URL}/chats/${chatRoomId}/messages/read`,
          { userId: user?.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Refresh the chat list to update unread counts
        fetchChats();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    // Navigate to the appropriate chat route based on user role
    if (user?.role === 'admin') {
      navigate(`/chat/admin/${chatRoomId}`);
    } else if (user?.role === 'service_provider') {
      navigate(`/chat/supplier/${chatRoomId}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'MM/dd');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Chats
      </Typography>

      {chats.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No chats available
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {chats.map((chat) => (
            <ListItem
              key={chat.chatRoomId}
              onClick={() => handleChatClick(chat.chatRoomId)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={chat.unreadCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: '18px',
                      minWidth: '18px',
                    },
                  }}
                >
                  <Avatar
                    src={chat.customerAvatar}
                    sx={{ width: 50, height: 50 }}
                  >
                    {getInitials(chat.customerName)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {chat.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(chat.lastMessageTime)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chat.lastMessage}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ChatList;