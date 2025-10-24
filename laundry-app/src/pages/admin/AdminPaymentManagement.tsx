import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Paper
} from '@mui/material';
import { Payment } from '../../types/order'; // Adjust the import path based on your consolidated types
import PaymentList from '../../components/payment/PaymentList'; // Adjust the import path
import api from '../../services/api'; // Adjust the import