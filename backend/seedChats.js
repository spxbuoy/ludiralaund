const mongoose = require('mongoose');
const User = require('./models/User');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');

// Connect to MongoDB
mongoose.connect('mongodb+srv://Glitch:PETnvMU8X0414oW2@glitch.u5ylwcm.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedChats = async () => {
  try {
    console.log('Starting chat seeding...');

    // Create test customers
    const customers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        phoneNumber: '1234567891',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        password: 'password123',
        phoneNumber: '1234567892',
        role: 'customer',
        status: 'active',
        emailVerified: true,
      }
    ];

    // Create customers
    const createdCustomers = [];
    for (const customerData of customers) {
      let customer = await User.findOne({ email: customerData.email });
      if (!customer) {
        customer = new User(customerData);
        await customer.save();
        console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
      }
      createdCustomers.push(customer);
    }

    // Create service provider
    let serviceProvider = await User.findOne({ role: 'service_provider' });
    if (!serviceProvider) {
      serviceProvider = new User({
        firstName: 'Service',
        lastName: 'Provider',
        email: 'provider@example.com',
        password: 'password123',
        phoneNumber: '1234567899',
        role: 'service_provider',
        status: 'active',
        emailVerified: true,
        businessDetails: {
          businessName: 'Test Laundry Service',
          serviceAreas: ['Accra', 'Tema'],
          availableServices: ['wash-fold', 'dry-cleaning'],
          operatingHours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' },
          },
        },
      });
      await serviceProvider.save();
      console.log('Created service provider');
    }

    // Create chat rooms
    const chatRooms = [];
    for (const customer of createdCustomers) {
      let chatRoom = await ChatRoom.findOne({ customerId: customer._id });
      if (!chatRoom) {
        chatRoom = new ChatRoom({
          customerId: customer._id,
          supplierId: serviceProvider._id,
        });
        await chatRoom.save();
        console.log(`Created chat room for ${customer.firstName} ${customer.lastName}`);
      }
      chatRooms.push(chatRoom);
    }

    // Create sample messages
    const messages = [
      { content: 'Hello! I need to schedule a pickup for my laundry.', senderType: 'customer' },
      { content: 'Hi! I\'d be happy to help. When would you like the pickup?', senderType: 'service_provider' },
      { content: 'Tomorrow morning around 9 AM would be perfect.', senderType: 'customer' },
      { content: 'Great! I\'ll be there at 9 AM. Please have your laundry ready.', senderType: 'service_provider' },
    ];

    for (let i = 0; i < chatRooms.length; i++) {
      const chatRoom = chatRooms[i];
      const customer = createdCustomers[i];

      // Check if messages already exist
      const existingMessages = await Message.find({ chatRoomId: chatRoom._id });
      if (existingMessages.length === 0) {
        for (let j = 0; j < messages.length; j++) {
          const message = messages[j];
          const newMessage = new Message({
            chatRoomId: chatRoom._id,
            senderType: message.senderType,
            senderId: message.senderType === 'customer' ? customer._id : serviceProvider._id,
            content: message.content,
            timestamp: new Date(Date.now() - (messages.length - j) * 60000), // Space messages 1 minute apart
          });
          await newMessage.save();
        }
        console.log(`Created ${messages.length} messages for chat room ${chatRoom._id}`);
      }
    }

    console.log('Chat seeding completed successfully!');
    console.log(`Created ${createdCustomers.length} customers, ${chatRooms.length} chat rooms, and sample messages`);

  } catch (error) {
    console.error('Error seeding chats:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedChats();