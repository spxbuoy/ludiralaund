// Run this script to clean up your database
// Create a file called cleanupServices.js in your project root

const mongoose = require('mongoose');

// Connect to your database
mongoose.connect('your-database-connection-string', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanupServices() {
  try {
    console.log('Starting database cleanup...');
    
    // Get the raw collection (bypassing Mongoose schema validation)
    const db = mongoose.connection.db;
    const servicesCollection = db.collection('services');
    
    // Find all documents
    const allServices = await servicesCollection.find({}).toArray();
    console.log(`Found ${allServices.length} services to check`);
    
    let updatedCount = 0;
    let deletedCount = 0;
    
    for (const service of allServices) {
      try {
        // Check if the document has invalid/corrupted fields
        if (service._id && typeof service._id === 'object') {
          // Try to fix common issues
          const updateDoc = {};
          let needsUpdate = false;
          
          // Ensure provider field exists and is valid
          if (!service.provider) {
            console.log(`Service ${service._id} missing provider field`);
            // You can either set a default provider ID or delete the service
            // Option 1: Set a default provider (replace with actual provider ID)
            // updateDoc.provider = new mongoose.Types.ObjectId('your-default-provider-id');
            // needsUpdate = true;
            
            // Option 2: Delete services without provider
            await servicesCollection.deleteOne({ _id: service._id });
            deletedCount++;
            console.log(`Deleted service ${service._id} (no provider)`);
            continue;
          }
          
          // Ensure required fields have proper types
          if (service.basePrice && typeof service.basePrice !== 'number') {
            updateDoc.basePrice = parseFloat(service.basePrice) || 0;
            needsUpdate = true;
          }
          
          if (service.isActive !== undefined && typeof service.isActive !== 'boolean') {
            updateDoc.isActive = service.isActive === 'true' || service.isActive === true;
            needsUpdate = true;
          }
          
          if (service.isAvailable !== undefined && typeof service.isAvailable !== 'boolean') {
            updateDoc.isAvailable = service.isAvailable === 'true' || service.isAvailable === true;
            needsUpdate = true;
          }
          
          // Apply updates if needed
          if (needsUpdate) {
            await servicesCollection.updateOne(
              { _id: service._id },
              { $set: updateDoc }
            );
            updatedCount++;
            console.log(`Updated service ${service._id}`);
          }
        }
      } catch (docError) {
        console.error(`Error processing service ${service._id}:`, docError.message);
        // Delete corrupted documents
        await servicesCollection.deleteOne({ _id: service._id });
        deletedCount++;
        console.log(`Deleted corrupted service ${service._id}`);
      }
    }
    
    console.log(`Cleanup completed:`);
    console.log(`- Updated: ${updatedCount} services`);
    console.log(`- Deleted: ${deletedCount} services`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the cleanup
cleanupServices();