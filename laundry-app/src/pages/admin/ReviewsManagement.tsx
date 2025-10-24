import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Rating,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface Review {
  id: string;
  orderId: string;
  customerName: string;
  serviceProviderName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

const ReviewsManagement: React.FC = () => {
  const { canModerateReviews } = usePermissions();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  // Fetch real reviews data from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { API_BASE_URL } = await import('../../services/api');
        const response = await fetch(`${API_BASE_URL}/reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        // Ensure reviews is always an array
        const reviewsArray = Array.isArray(data) ? data : (data.reviews || data.data || []);
        setReviews(reviewsArray);
      } catch (error) {
        console.error('Reviews fetch error:', error);
        setError('Failed to load reviews');
        setReviews([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setDialogOpen(true);
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve review');
      }

      const updatedReview = await response.json();
      // Ensure reviews is always an array
      const reviewsArray = Array.isArray(reviews) ? reviews : [];
      setReviews(reviewsArray.map(review => 
        review.id === reviewId ? updatedReview : review
      ));
      setError(null);
    } catch (err) {
      setError('Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject review');
      }

      const updatedReview = await response.json();
      // Ensure reviews is always an array
      const reviewsArray = Array.isArray(reviews) ? reviews : [];
      setReviews(reviewsArray.map(review => 
        review.id === reviewId ? updatedReview : review
      ));
      setError(null);
    } catch (err) {
      setError('Failed to reject review');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const { API_BASE_URL } = await import('../../services/api');
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete review');
        }

        // Ensure reviews is always an array
        const reviewsArray = Array.isArray(reviews) ? reviews : [];
        setReviews(reviewsArray.filter(review => review.id !== reviewId));
        setError(null);
      } catch (err) {
        setError('Failed to delete review');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'flagged': return 'error';
      default: return 'default';
    }
  };

  // Ensure reviews is always an array before filtering
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  const filteredReviews = reviewsArray.filter(review => {
    const statusMatch = filterStatus === 'all' || review.status === filterStatus;
    const ratingMatch = filterRating === 'all' || review.rating.toString() === filterRating;
    return statusMatch && ratingMatch;
  });

  const averageRating = reviewsArray.length > 0 
    ? reviewsArray.reduce((sum, r) => sum + r.rating, 0) / reviewsArray.length 
    : 0;

  const totalReviews = reviewsArray.length;
  const approvedReviews = reviewsArray.filter(r => r.status === 'approved').length;
  const pendingReviews = reviewsArray.filter(r => r.status === 'pending').length;

  if (!canModerateReviews()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to moderate reviews.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reviews Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Reviews
              </Typography>
              <Typography variant="h4">
                {totalReviews}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={averageRating} readOnly precision={0.1} />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {averageRating.toFixed(1)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Reviews
              </Typography>
              <Typography variant="h4" color="success.main">
                {approvedReviews}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Reviews
              </Typography>
              <Typography variant="h4" color="warning.main">
                {pendingReviews}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="flagged">Flagged</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Rating</InputLabel>
          <Select
            value={filterRating}
            label="Filter by Rating"
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="5">5 Stars</MenuItem>
            <MenuItem value="4">4 Stars</MenuItem>
            <MenuItem value="3">3 Stars</MenuItem>
            <MenuItem value="2">2 Stars</MenuItem>
            <MenuItem value="1">1 Star</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredReviews.map((review) => (
          <Box key={review.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    #{review.id}
                  </Typography>
                  <Chip
                    label={review.status}
                    color={getStatusColor(review.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>
                  {review.customerName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {review.serviceProviderName}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={review.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({review.rating}/5)
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  "{review.comment}"
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(review.createdAt).toLocaleDateString()}
                </Typography>
                
                {review.adminNotes && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Shop Owner Note: {review.adminNotes}
                  </Typography>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewReview(review)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {review.status === 'pending' && (
                    <Tooltip title="Approve Review">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApproveReview(review.id)}
                      >
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {review.status === 'pending' && (
                    <Tooltip title="Reject Review">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRejectReview(review.id)}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {review.status === 'flagged' && (
                    <Tooltip title="Flagged for Review">
                      <IconButton
                        size="small"
                        color="warning"
                      >
                        <FlagIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete Review">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Review Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Details #{selectedReview?.id}
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Information
              </Typography>
              <Typography>Order ID: #{selectedReview.orderId}</Typography>
              <Typography>Customer: {selectedReview.customerName}</Typography>
              <Typography>Service Provider: {selectedReview.serviceProviderName}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ mr: 1 }}>Rating:</Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Comment
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedReview.comment}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Chip
                label={selectedReview.status}
                color={getStatusColor(selectedReview.status)}
                sx={{ mb: 2 }}
              />
              
              {selectedReview.adminNotes && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Shop Owner Notes
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedReview.adminNotes}
                  </Typography>
                </>
              )}
              
              <Typography variant="h6" gutterBottom>
                Timestamps
              </Typography>
              <Typography>Created: {new Date(selectedReview.createdAt).toLocaleString()}</Typography>
              <Typography>Updated: {new Date(selectedReview.updatedAt).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewsManagement;
