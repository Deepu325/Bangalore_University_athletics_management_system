import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://AthleticsMeet:AthleticsMeet@athleticsmeet.2wye07c.mongodb.net/';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // List databases
    const admin = mongoose.connection.getClient().db('admin');
    const result = await admin.command({ listDatabases: true });
    console.log('Available databases:', result.databases.map(d => d.name).join(', '));
    
    await mongoose.disconnect();
    console.log('✓ Disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
