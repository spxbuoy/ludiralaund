import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, CircularProgress, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [unreadChats, setUnreadChats] = useState<{ [orderId: string]: boolean }>({});
  const [supplierId, setSupplierId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/orders/provider`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.data || []);
      } catch (err: any) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    // Get supplier user ID from local storage or context (adjust as needed)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setSupplierId(user._id || user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!supplierId) return;
      const badgeMap: { [orderId: string]: boolean } = {};
      for (const order of orders) {
        try {
          const token = localStorage.getItem('token');
          // Get or create chat room for this order
          const chatRoomRes = await axios.post(
            `${API_BASE_URL}/chats/room`,
            { customerId: order.customerId, orderId: order._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const chatRoomId = chatRoomRes.data._id;
          // Fetch messages
          const messagesRes = await axios.get(
            `${API_BASE_URL}/chats/${chatRoomId}/messages`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const messages = messagesRes.data;
          // If any message is not read by this supplier, show badge
          badgeMap[order._id] = messages.some((msg: any) => !msg.readBy || !msg.readBy.includes(supplierId));
        } catch {
          badgeMap[order._id] = false;
        }
      }
      setUnreadChats(badgeMap);
    };
    fetchUnread();
    // eslint-disable-next-line
  }, [orders, supplierId]);

  const handleChat = async (order: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chats/room`,
        { customerId: order.customerId, orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatRoomId = res.data._id;
      navigate(`/chat/supplier/${chatRoomId}`);
    } catch (err) {
      alert('Failed to start chat.');
    }
  };

  return (
    <Box>
      <Typography variant="h6">Order List</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <List>
          {orders.map((order) => (
            <ListItem key={order._id} divider>
              <ListItemText
                primary={`Order #${order._id}`}
                secondary={`Customer: ${order.customerId}`}
              />
              <Badge color="error" variant="dot" invisible={!unreadChats[order._id]}> 
                <Button variant="outlined" onClick={() => handleChat(order)}>
                  Chat with Customer
                </Button>
              </Badge>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default OrderList;
