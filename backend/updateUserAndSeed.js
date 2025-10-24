const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/laundry-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateUserAndSeed = async () => {
  try {
    console.log('Checking for service provider users...');
    
    // Find the specific user by email
    const serviceProvider = await User.findOne({ email: 'jojo@mail.com' });
    
    if (!serviceProvider) {
      console.log('User jojo@mail.com not found');
      return;
    }
    
    console.log('Found user:', serviceProvider.firstName, serviceProvider.lastName);
    console.log('User ID:', serviceProvider._id);
    console.log('User role:', serviceProvider.role);
    
    // Update the user role to ensure it's correct
    await User.findByIdAndUpdate(serviceProvider._id, { role: 'service_provider' });
    console.log('Updated user role to service_provider');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Create sample services
    const services = [
      {
        name: 'Wash & Fold',
        description: 'Professional washing, drying, and folding service for your everyday clothes.',
        category: 'wash-fold',
        basePrice: 2.50,
        pricePerItem: 0,
        estimatedTime: 'next-day',
        requirements: 'Separate by color and fabric type',
        isActive: true,
        provider: serviceProvider._id,
        serviceAreas: ['Accra', 'Tema'],
        availableFor: ['customer'],
        minOrderQuantity: 1,
        maxOrderQuantity: 50,
        specialInstructions: 'Eco-friendly detergents used',
        tags: ['laundry', 'wash', 'fold']
      },
      {
        name: 'Dry Cleaning',
        description: 'Expert dry cleaning for delicate fabrics and special garments.',
        category: 'dry-cleaning',
        basePrice: 5.99,
        pricePerItem: 0,
        estimatedTime: 'same-day',
        requirements: 'Handle with care for delicate fabrics',
        isActive: true,
        provider: serviceProvider._id,
        serviceAreas: ['Accra', 'Tema'],
        availableFor: ['customer'],
        minOrderQuantity: 1,
        maxOrderQuantity: 20,
        specialInstructions: 'Professional stain treatment available',
        tags: ['dry-clean', 'delicate', 'formal']
      },
      {
        name: 'Ironing & Pressing',
        description: 'Professional ironing and pressing service for crisp, clean clothes.',
        category: 'ironing',
        basePrice: 3.99,
        pricePerItem: 0,
        estimatedTime: 'next-day',
        requirements: 'Proper temperature control for different fabrics',
        isActive: true,
        provider: serviceProvider._id,
        serviceAreas: ['Accra', 'Tema'],
        availableFor: ['customer'],
        minOrderQuantity: 1,
        maxOrderQuantity: 30,
        specialInstructions: 'Professional pressing equipment used',
        tags: ['ironing', 'pressing', 'crisp']
      },
      {
        name: 'Express Service',
        description: 'Fast and efficient service for urgent laundry needs.',
        category: 'express',
        basePrice: 8.99,
        pricePerItem: 0,
        estimatedTime: 'same-day',
        requirements: 'Priority handling for urgent orders',
        isActive: true,
        provider: serviceProvider._id,
        serviceAreas: ['Accra', 'Tema'],
        availableFor: ['customer'],
        minOrderQuantity: 1,
        maxOrderQuantity: 15,
        specialInstructions: 'Express service with priority handling',
        tags: ['express', 'urgent', 'fast']
      }
    ];

    // Insert services
    const createdServices = await Service.insertMany(services);
    console.log(`Created ${createdServices.length} services:`);
    
    createdServices.forEach(service => {
      console.log(`- ${service.name} (ID: ${service._id})`);
    });

    console.log('Services seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateUserAndSeed(); 