import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAppDispatch } from '../../app/hooks';
import { deleteAddress } from '../../features/auth/authSlice';
import { Address } from '../../types';

interface AddressListProps {
  addresses: Address[];
}

const AddressList: React.FC<AddressListProps> = ({ addresses }) => {
  const dispatch = useAppDispatch();

  const handleDelete = async (addressId: string | undefined) => {
    if (!addressId) return;
    try {
      await dispatch(deleteAddress(addressId));
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  if (addresses.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="textSecondary">
          No addresses saved yet. Add your first address above.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {addresses.map((address) => (
        <Paper
          key={address.id}
          elevation={0}
          sx={{
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="subtitle1">
                  {address.street ?? ''}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="textSecondary">
                  {`${address.city}, ${address.state} ${address.zipCode}`}
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => {/* TODO: Implement edit functionality */}}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(address.id)}
                disabled={!address.id}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default AddressList; 