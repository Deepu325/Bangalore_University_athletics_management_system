import mongoose from 'mongoose';

async function testLocal() {
  try {
    console.log('Testing local MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Local MongoDB connected');
    
    const Athlete = mongoose.model('Athlete', new mongoose.Schema({}, { strict: false }));
    const count = await Athlete.countDocuments();
    console.log('✓ Athletes in local DB:', count);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Local MongoDB not available:', error.message);
    process.exit(1);
  }
}

testLocal();
