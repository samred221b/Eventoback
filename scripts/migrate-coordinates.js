const mongoose = require('mongoose');
const Event = require('./models/Event');

async function migrateCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all events that have coordinates but no geo field
    const events = await Event.find({
      'location.coordinates': { $exists: true },
      'location.geo': { $exists: false }
    });

    console.log(`Found ${events.length} events to migrate`);

    for (const event of events) {
      event.location.geo = {
        type: 'Point',
        coordinates: [event.location.coordinates.lng, event.location.coordinates.lat]
      };
      await event.save();
      console.log(`Migrated event: ${event.title}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCoordinates();
}

module.exports = migrateCoordinates;
