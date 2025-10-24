import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Card,
  CardContent 
} from '@mui/material';
import { API_BASE_URL } from '../services/api';

interface APITestResult {
  endpoint: string;
  status: number;
  success: boolean;
  data: any;
  error?: string;
}

const TestPaymentAPI: React.FC = () => {
  const [results, setResults] = useState<APITestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, requiresAuth: boolean = true) => {
    const token = localStorage.getItem('token');
    
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
      });
      
      const data = await response.json();
      
      return {
        endpoint,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : null,
        error: !response.ok ? data.error || data.message || 'Unknown error' : undefined,
      };
    } catch (error) {
      return {
        endpoint,
        status: 0,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    const endpoints = [
      { path: '/health', auth: false },
      { path: '/payments/history', auth: true },
      { path: '/payments/history/stats', auth: true },
      { path: '/payments/methods/list', auth: false },
      { path: '/auth/me', auth: true },
    ];
    
    const testResults: APITestResult[] = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.path, endpoint.auth);
      testResults.push(result);
      setResults([...testResults]);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: number, success: boolean) => {
    if (status === 0) return 'error';
    if (success) return 'success';
    if (status === 401 || status === 403) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payment API Test
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Test various payment-related API endpoints to diagnose issues.
        Current token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTests} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} /> : 'Run API Tests'}
      </Button>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {results.map((result, index) => (
          <Card key={index}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  {result.endpoint}
                </Typography>
                <Alert 
                  severity={getStatusColor(result.status, result.success)}
                  variant="outlined"
                  sx={{ py: 0 }}
                >
                  {result.status} {result.success ? 'SUCCESS' : 'FAILED'}
                </Alert>
              </Box>
              
              {result.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {result.error}
                </Alert>
              )}
              
              {result.data && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Response Data:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="pre" 
                    sx={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    {JSON.stringify(result.data, null, 2)}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default TestPaymentAPI;
