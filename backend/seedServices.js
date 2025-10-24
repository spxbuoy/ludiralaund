const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/laundry_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedServices = async () => {
  try {
    // First, find a service provider user
    const serviceProvider = await User.findOne({ role: 'service_provider' });
    
    if (!serviceProvider) {
      console.log('No service provider found. Please create a service provider user first.');
      return;
    }

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
        name: 'Stain Removal',
        description: 'Expert stain removal for tough spots and marks.',
        category: 'stain-removal',
        basePrice: 4.99,
        pricePerItem: 0,
        estimatedTime: 'same-day',
        requirements: 'Pre-treatment assessment required',
        isActive: true,
        provider: serviceProvider._id,
        serviceAreas: ['Accra', 'Tema'],
        availableFor: ['customer'],
        minOrderQuantity: 1,
        maxOrderQuantity: 10,
        specialInstructions: 'Advanced stain treatment techniques',
        tags: ['stain-removal', 'cleaning', 'specialized']
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
    console.error('Error seeding services:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedServices(); 