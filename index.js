const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.crkhnnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const subscriberCollection = client.db("gymDB").collection("subscriber");
    const userCollection = client.db("gymDB").collection("users");
    const trainerInfoCollection = client.db("gymDB").collection("trainerInfo");

    // subscriber api
    app.post("/subscriber", async (req, res) => {
      const newSubscriber = req.body;
      const query = { email: newSubscriber.email };
      const existingSubscriber = await subscriberCollection.findOne(query);
      if (existingSubscriber) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await subscriberCollection.insertOne(newSubscriber);
      res.send(result);
    });

    // user related api

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user does not exist
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // trainer info api
    app.post("/trainerInfo", async (req, res) => {
      const trainerInfo = req.body;
      const result = await trainerInfoCollection.insertOne(trainerInfo);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gym is running");
});

app.listen(port, () => {
  console.log(`Gym is running on port ${port}`);
});
