import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Chat from '../../components/Chat';
import { API_BASE_URL } from '../../services/api';

const apiUrl = API_BASE_URL;

const AdminChat: React.FC = () => {
  const navigate = useNavigate();
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const userId = useSelector((state: any) => state.auth.user?._id || state.auth.user?.id);
  const userRole = 'admin';

  if (!chatRoomId || !userId) return <div>Loading...</div>;

  const handleBackClick = () => {
    navigate('/chats');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          sx={{ mr: 2, textTransform: 'none' }}
        >
          Back to Chats
        </Button>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Chat (Shop Owner View)
        </Typography>
      </Box>
      <Chat chatRoomId={chatRoomId} userId={userId} userRole={userRole} apiUrl={apiUrl} />
    </Box>
  );
};

export default AdminChat;
