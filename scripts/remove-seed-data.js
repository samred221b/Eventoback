// Script to remove seed/mock data while keeping real organizer-created events
const mongoose = require('mongoose');
require('dotenv').config();

const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

async function removeSeedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Remove seed organizers (they have specific firebaseUids)
    const seedOrganizerUids = [
      'sample-uid-1',
      'sample-uid-2', 
      'sample-uid-3'
    ];

    const seedOrganizers = await Organizer.find({
      firebaseUid: { $in: seedOrganizerUids }
    });

    console.log(`Found ${seedOrganizers.length} seed organizers to remove`);

    // Get their IDs to remove associated events
    const seedOrganizerIds = seedOrganizers.map(org => org._id);

    // Remove events created by seed organizers
    const seedEvents = await Event.find({
      organizerId: { $in: seedOrganizerIds }
    });

    console.log(`Found ${seedEvents.length} seed events to remove`);

    // Also remove events with specific seed titles (in case they exist without organizer reference)
    const seedEventTitles = [
      'Ethiopian Tech Summit 2024',
      'Coffee Culture Festival',
      'Startup Pitch Night',
      'Digital Marketing Workshop',
      'Ethiopian Music Night'
    ];

    const additionalSeedEvents = await Event.find({
      title: { $in: seedEventTitles }
    });

    console.log(`Found ${additionalSeedEvents.length} additional seed events by title`);

    // Remove all seed events
    await Event.deleteMany({
      $or: [
        { organizerId: { $in: seedOrganizerIds } },
        { title: { $in: seedEventTitles } }
      ]
    });

    // Remove seed organizers
    await Organizer.deleteMany({
      firebaseUid: { $in: seedOrganizerUids }
    });

    console.log('✅ Removed all seed data');

    // Show remaining data
    const remainingOrganizers = await Organizer.countDocuments();
    const remainingEvents = await Event.countDocuments();

    console.log('\n📊 Remaining Data:');
    console.log(`- Real Organizers: ${remainingOrganizers}`);
    console.log(`- Real Events: ${remainingEvents}`);

    // List remaining events for verification
    const realEvents = await Event.find({}).select('title organizerName createdAt');
    console.log('\n📋 Remaining Events:');
    realEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (by: ${event.organizerName || 'Unknown'})`);
    });

    console.log('\n🎉 Seed data removal completed successfully!');
    console.log('Your app should now only show real organizer-created events.');

  } catch (error) {
    console.error('❌ Error removing seed data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
if (require.main === module) {
  removeSeedData();
}

module.exports = removeSeedData;
