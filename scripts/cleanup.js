// Cleanup script for database maintenance
const mongoose = require('mongoose');
require('dotenv').config();

const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clean up past events (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pastEvents = await Event.find({
      date: { $lt: thirtyDaysAgo },
      status: { $ne: 'completed' }
    });

    if (pastEvents.length > 0) {
      await Event.updateMany(
        {
          date: { $lt: thirtyDaysAgo },
          status: { $ne: 'completed' }
        },
        { status: 'completed' }
      );
      console.log(`✅ Marked ${pastEvents.length} past events as completed`);
    }

    // Clean up inactive organizers (not logged in for 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const inactiveOrganizers = await Organizer.find({
      lastLoginAt: { $lt: sixMonthsAgo },
      isActive: true
    });

    if (inactiveOrganizers.length > 0) {
      console.log(`⚠️ Found ${inactiveOrganizers.length} inactive organizers (no login for 6+ months)`);
      // Don't auto-deactivate, just report
    }

    // Update organizer statistics
    const organizers = await Organizer.find({ isActive: true });
    
    for (const organizer of organizers) {
      const eventCount = await Event.countDocuments({ 
        organizerId: organizer._id 
      });
      
      if (organizer.totalEvents !== eventCount) {
        organizer.totalEvents = eventCount;
        await organizer.save();
        console.log(`✅ Updated event count for ${organizer.name}: ${eventCount}`);
      }
    }

    // Remove duplicate attendees from events
    const events = await Event.find({});
    let duplicatesRemoved = 0;

    for (const event of events) {
      const uniqueAttendees = [];
      const seenUserIds = new Set();

      for (const attendee of event.attendees) {
        if (!seenUserIds.has(attendee.userId)) {
          seenUserIds.add(attendee.userId);
          uniqueAttendees.push(attendee);
        } else {
          duplicatesRemoved++;
        }
      }

      if (uniqueAttendees.length !== event.attendees.length) {
        event.attendees = uniqueAttendees;
        await event.save();
      }
    }

    if (duplicatesRemoved > 0) {
      console.log(`✅ Removed ${duplicatesRemoved} duplicate attendee records`);
    }

    // Remove duplicate likes from events
    let likeDuplicatesRemoved = 0;

    for (const event of events) {
      const uniqueLikes = [];
      const seenUserIds = new Set();

      for (const like of event.likes) {
        if (!seenUserIds.has(like.userId)) {
          seenUserIds.add(like.userId);
          uniqueLikes.push(like);
        } else {
          likeDuplicatesRemoved++;
        }
      }

      if (uniqueLikes.length !== event.likes.length) {
        event.likes = uniqueLikes;
        await event.save();
      }
    }

    if (likeDuplicatesRemoved > 0) {
      console.log(`✅ Removed ${likeDuplicatesRemoved} duplicate like records`);
    }

    // Generate cleanup report
    const stats = {
      totalOrganizers: await Organizer.countDocuments({ isActive: true }),
      totalEvents: await Event.countDocuments(),
      upcomingEvents: await Event.countDocuments({
        date: { $gte: new Date() },
        status: 'published'
      }),
      pastEvents: await Event.countDocuments({
        date: { $lt: new Date() }
      }),
      featuredEvents: await Event.countDocuments({
        featured: true,
        status: 'published',
        date: { $gte: new Date() }
      })
    };

    console.log('\n📊 Database Statistics:');
    console.log(`- Active Organizers: ${stats.totalOrganizers}`);
    console.log(`- Total Events: ${stats.totalEvents}`);
    console.log(`- Upcoming Events: ${stats.upcomingEvents}`);
    console.log(`- Past Events: ${stats.pastEvents}`);
    console.log(`- Featured Events: ${stats.featuredEvents}`);

    console.log('\n🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup function
if (require.main === module) {
  cleanupDatabase();
}

module.exports = cleanupDatabase;
