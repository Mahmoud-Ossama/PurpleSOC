import { MongoClient, type Db } from "mongodb";

// Lazily validated — do NOT throw at module load time (breaks next build)
function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing environment variable: "MONGODB_URI"');
  return uri;
}

function getDbName(): string {
  const db = process.env.MONGODB_DB;
  if (!db) throw new Error('Missing environment variable: "MONGODB_DB"');
  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(getUri(), {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
    }
    return global._mongoClient;
  }
  return new MongoClient(getUri(), {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });
}

let _connectedClient: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!_connectedClient) {
    const client = getClient();
    await client.connect();
    _connectedClient = client;
  }
  return _connectedClient.db(getDbName());
}

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await db.collection("logs").createIndex({ received_at: -1, source_ip: 1 });
  await db.collection("logs").createIndex({ source_ip: 1 });
  await db.collection("logs").createIndex({ analyzed: 1 });

  await db.collection("traffic_logs").createIndex({ timestamp: -1, src_ip: 1, protocol: 1, label: 1 });
  await db.collection("traffic_logs").createIndex({ src_ip: 1 });
  await db.collection("traffic_logs").createIndex({ dst_ip: 1 });
  await db.collection("traffic_logs").createIndex({ label: 1 });

  await db.collection("reports").createIndex({ created_at: -1, risk_score: -1, threat_category: 1 });
  await db.collection("reports").createIndex({ source_ip: 1 });
  await db.collection("reports").createIndex({ is_true_positive: 1 });

  await db.collection("geo_cache").createIndex({ ip: 1 }, { unique: true });
  await db.collection("geo_cache").createIndex(
    { cached_at: 1 },
    { expireAfterSeconds: 604800 }
  );
}

export default { getDb, ensureIndexes };
