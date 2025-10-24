
const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { STATIC_SERVICES } = require('../config/staticServices');

// Get static services
router.get('/static', async (req, res) => {
  try {
    console.log('Fetching static services...');
    
    // Return static services with proper structure
    const services = STATIC_SERVICES.map(service => ({
      ...service,
      id: service._id, // Ensure both _id and id are available
    }));
    
    res.json({
      success: true,
      data: services,
      message: 'Static services retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching static services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch static services'
    });
  }
});

// Get all services (dynamic ones from database)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const services = await Service.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Service.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        docs: services,
        totalDocs: total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// Get service categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'wash-fold',
      'dry-cleaning', 
      'ironing',
      'stain-removal',
      'specialty'
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
    });
  }
});

// Create new service (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, category, basePrice, estimatedTime, requirements, imageUrl } = req.body;

    const service = new Service({
      name,
      description,
      category,
      basePrice,
      estimatedTime,
      requirements,
      imageUrl,
      isActive: true,
      isAvailable: true
    });

    await service.save();

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create service'
    });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service'
    });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service'
    });
  }
});

module.exports = router;
