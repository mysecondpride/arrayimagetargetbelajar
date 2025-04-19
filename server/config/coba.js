// let cachedClient = null;
// let cachedDb = null;

// async function connectToDB() {
//   if (cachedDb && cachedClient) {
//     return { db: cachedDb, client: cachedClient };
//   }

//   const cl = await MongoClient.connect('mongodb://localhost:27017');
//   const dbs = client.db('myDB');

//   cachedClient = cl;
//   cachedDb = dbs;

//   return { dbs, cl };
// }
