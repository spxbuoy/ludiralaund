import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Chat from '../../components/Chat';
import { API_BASE_URL } from '../../services/api';

const apiUrl = API_BASE_URL;

const CustomerChat: React.FC = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const userId = useSelector((state: any) => state.auth.user?._id || state.auth.user?.id);
  const userRole = 'customer';
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    console.log('CustomerChat debug:', { chatRoomId, userId });
    if (!chatRoomId || !userId) {
      const timer = setTimeout(() => setShowError(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [chatRoomId, userId]);

  if (!chatRoomId || !userId) {
    if (showError) {
      return <div style={{ color: 'red', marginTop: 32 }}>Unable to load chat. Please make sure you are logged in and accessed the chat from the dashboard.</div>;
    }
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Support Chat</h2>
      <Chat chatRoomId={chatRoomId} userId={userId} userRole={userRole} apiUrl={apiUrl} />
    </div>
  );
};

export default CustomerChat;
