import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import certifi from 'certifi';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'toilet_launch';

if (!MONGO_URL) {
  console.error('FATAL: MONGO_URL environment variable is not set!');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

let db, villagesColl, clustersColl;

MongoClient.connect(MONGO_URL, {
  serverSelectionTimeoutMS: 5000,
  tlsCAFile: certifi,
})
  .then(client => {
    db = client.db(DB_NAME);
    villagesColl = db.collection('villages');
    clustersColl = db.collection('clusters');
    // Ensure compound index for fast filtering on both fields
    villagesColl.createIndex({
      toilet_suitability_score: 1,
      total_hhd_not_having_sanitary_la: 1
    });
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log('✅ Successfully connected to MongoDB using certifi for TLS.');
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Save a user session
app.post('/api/sessions', async (req, res) => {
  try {
    const session = req.body;
    const result = await db.collection('sessions').insertOne(session);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Load a user session by ID
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await db.collection('sessions').findOne({ _id: new ObjectId(req.params.id) });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// Save dataset metadata
app.post('/api/datasets', async (req, res) => {
  try {
    const metadata = req.body;
    const result = await db.collection('datasets').insertOne(metadata);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save dataset metadata' });
  }
});

// List all datasets
app.get('/api/datasets', async (req, res) => {
  try {
    const datasets = await db.collection('datasets').find({}).toArray();
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Fetch all villages from the 'villages' collection
app.get('/villages', async (req, res) => {
  try {
    const villages = await villagesColl.find({}).toArray();
    res.json(villages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch villages' });
  }
}); 