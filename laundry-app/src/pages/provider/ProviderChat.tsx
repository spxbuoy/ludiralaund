import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Chat from '../../components/Chat';
import { API_BASE_URL } from '../../services/api';

const apiUrl = API_BASE_URL;

const ProviderChat: React.FC = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const userId = useSelector((state: any) => state.auth.user?._id || state.auth.user?.id);
  const userRole = 'service_provider';

  if (!chatRoomId || !userId) return <div>Loading...</div>;

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Chat with Customer</h2>
      <Chat chatRoomId={chatRoomId} userId={userId} userRole={userRole} apiUrl={apiUrl} />
    </div>
  );
};

export default ProviderChat;
