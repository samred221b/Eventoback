// Seed script to populate the database with sample data
const mongoose = require('mongoose');
require('dotenv').config();

const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

// Sample data
const sampleOrganizers = [
  {
    firebaseUid: 'sample-uid-1',
    name: 'Tech Events Ethiopia',
    email: 'tech@eventopia.com',
    bio: 'Leading technology event organizer in Ethiopia, specializing in conferences and workshops.',
    phone: '+251911234567',
    location: {
      address: 'Bole Road, Addis Ababa',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0320,
        lng: 38.7469
      }
    },
    isVerified: true,
    totalEvents: 5
  },
  {
    firebaseUid: 'sample-uid-2',
    name: 'Cultural Events Addis',
    email: 'culture@eventopia.com',
    bio: 'Promoting Ethiopian culture through amazing events and festivals.',
    phone: '+251922345678',
    location: {
      address: 'Piazza, Addis Ababa',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0365,
        lng: 38.7578
      }
    },
    isVerified: true,
    totalEvents: 3
  },
  {
    firebaseUid: 'sample-uid-3',
    name: 'Business Network Hub',
    email: 'business@eventopia.com',
    bio: 'Connecting entrepreneurs and business professionals across East Africa.',
    phone: '+251933456789',
    location: {
      address: 'CMC Road, Addis Ababa',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0084,
        lng: 38.7575
      }
    },
    isVerified: false,
    totalEvents: 2
  }
];

const sampleEvents = [
  {
    title: 'Ethiopian Tech Summit 2024',
    description: 'The largest technology conference in Ethiopia featuring international speakers, startup pitches, and networking opportunities. Join us for two days of innovation and inspiration.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    category: 'technology',
    location: {
      address: 'Skylight Hotel, Bole Road',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0192,
        lng: 38.7525
      }
    },
    date: new Date('2025-12-15'),
    time: '09:00',
    capacity: 500,
    price: 1500,
    currency: 'ETB',
    featured: true,
    tags: ['technology', 'startup', 'innovation', 'networking']
  },
  {
    title: 'Coffee Culture Festival',
    description: 'Celebrate Ethiopia\'s rich coffee heritage with tastings, cultural performances, and traditional ceremonies. Experience the birthplace of coffee.',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop',
    category: 'food',
    location: {
      address: 'Meskel Square',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0120,
        lng: 38.7634
      }
    },
    date: new Date('2025-11-30'),
    time: '10:00',
    capacity: 1000,
    price: 0,
    featured: true,
    tags: ['coffee', 'culture', 'festival', 'traditional']
  },
  {
    title: 'Startup Pitch Night',
    description: 'Monthly startup pitch competition where entrepreneurs present their ideas to investors and mentors. Great networking opportunity for the startup ecosystem.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
    category: 'networking',
    location: {
      address: 'IceAddis, Kazanchis',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0320,
        lng: 38.7469
      }
    },
    date: new Date('2025-11-25'),
    time: '18:30',
    capacity: 150,
    price: 200,
    currency: 'ETB',
    featured: false,
    tags: ['startup', 'pitch', 'investment', 'networking']
  },
  {
    title: 'Digital Marketing Workshop',
    description: 'Learn the latest digital marketing strategies and tools. Hands-on workshop covering social media marketing, SEO, and content creation.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    category: 'workshop',
    location: {
      address: 'British Council, Churchill Road',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0320,
        lng: 38.7469
      }
    },
    date: new Date('2025-12-05'),
    time: '14:00',
    capacity: 50,
    price: 800,
    currency: 'ETB',
    featured: false,
    tags: ['marketing', 'digital', 'workshop', 'social media']
  },
  {
    title: 'Ethiopian Music Night',
    description: 'An evening of traditional and contemporary Ethiopian music featuring local artists and cultural performances.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    category: 'music',
    location: {
      address: 'Alliance Ethio-Française',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      coordinates: {
        lat: 9.0365,
        lng: 38.7578
      }
    },
    date: new Date('2025-12-01'),
    time: '19:00',
    capacity: 200,
    price: 300,
    currency: 'ETB',
    featured: false,
    tags: ['music', 'culture', 'entertainment', 'traditional']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Organizer.deleteMany({});
    await Event.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create organizers
    const createdOrganizers = await Organizer.insertMany(sampleOrganizers);
    console.log(`✅ Created ${createdOrganizers.length} organizers`);

    // Create events with organizer references
    const eventsWithOrganizers = sampleEvents.map((event, index) => {
      const organizer = createdOrganizers[index % createdOrganizers.length];
      return {
        ...event,
        organizerId: organizer._id,
        organizerName: organizer.name
      };
    });

    const createdEvents = await Event.insertMany(eventsWithOrganizers);
    console.log(`✅ Created ${createdEvents.length} events`);

    // Add some sample attendees and likes
    for (let i = 0; i < createdEvents.length; i++) {
      const event = createdEvents[i];
      
      // Add sample attendees
      const attendeeCount = Math.floor(Math.random() * 20) + 5;
      for (let j = 0; j < attendeeCount; j++) {
        event.attendees.push({
          userId: `sample-user-${j}`,
          registeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      // Add sample likes
      const likeCount = Math.floor(Math.random() * 50) + 10;
      for (let j = 0; j < likeCount; j++) {
        event.likes.push({
          userId: `sample-user-${j}`,
          likedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }

      // Add random views
      event.views = Math.floor(Math.random() * 500) + 100;

      await event.save();
    }

    console.log('✅ Added sample attendees, likes, and views');

    console.log('🎉 Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdOrganizers.length} organizers`);
    console.log(`- ${createdEvents.length} events`);
    console.log('\nYou can now test your API with this sample data.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
