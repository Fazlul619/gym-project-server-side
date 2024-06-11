const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const paymentInfoCollection = client.db("gymDB").collection("paymentInfo");
    const forumPostCollection = client.db("gymDB").collection("forumPost");
    const allClassCollection = client.db("gymDB").collection("allClass");
    const reviewCollection = client.db("gymDB").collection("review");

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
      const query = { email: trainerInfo.email };
      const existTrainerInfo = await trainerInfoCollection.findOne(query);
      if (existTrainerInfo) {
        return res.send({
          message: "You already applied for become a trainer",
          insertedId: null,
        });
      }
      const result = await trainerInfoCollection.insertOne(trainerInfo);
      res.send(result);
    });

    // payment api
    app.post("/paymentInfo", async (req, res) => {
      const paymentInfo = req.body;
      const query = { userEmail: paymentInfo.userEmail };
      // const existPaymentInfo = await paymentInfoCollection.findOne(query);
      const existPaymentInfo = await paymentInfoCollection
        .find(query)
        .toArray();
      const existingPackage = existPaymentInfo.find(
        (info) => info.packageName === paymentInfo.packageName
      );
      // Check if the user already has the package
      if (existingPackage && existPaymentInfo.length >= 3) {
        return res.send({
          message: "You already payment successfully",
          insertedId: null,
        });
      }
      const result = await paymentInfoCollection.insertOne(paymentInfo);
      res.send(result);
    });

    // forum post api
    app.post("/forumPost", async (req, res) => {
      const forumPost = req.body;
      const result = await forumPostCollection.insertOne(forumPost);
      res.send(result);
    });
    // Class api
    app.post("/allClass", async (req, res) => {
      const classInfo = req.body;
      const result = await allClassCollection.insertOne(classInfo);
      res.send(result);
    });

    // review api
    app.post("/review", async (req, res) => {
      const reviewPost = req.body;
      const result = await reviewCollection.insertOne(reviewPost);
      res.send(result);
    });

    // get all subscriber api
    app.get("/subscriber", async (req, res) => {
      const result = await subscriberCollection.find().toArray();
      res.send(result);
    });

    // get all payment info api

    app.get("/paymentInfo", async (req, res) => {
      const result = await paymentInfoCollection.find().toArray();
      res.send(result);
    });

    // all trainers api
    app.get("/allTrainers", async (req, res) => {
      const result = await trainerInfoCollection.find().toArray();
      res.send(result);
    });
    // get one trainer data api
    app.get("/allTrainers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await trainerInfoCollection.findOne(query);
      res.send(result);
    });

    // user api for get user from database
    app.get("/allUsers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //all forum post api
    app.get("/allForumPost", async (req, res) => {
      const result = await forumPostCollection.find().toArray();
      res.send(result);
    });

    app.get("/allClasses", async (req, res) => {
      const result = await allClassCollection.find().toArray();
      res.send(result);
    });
    app.get("/allReview", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    // Update Trainer to member
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "member",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // update profile info
    app.patch("/user/:email", async (req, res) => {
      const userInfo = req.body;
      const email = req.params.email;
      const userInfoFilter = { email: email };
      console.log(userInfo);
      // console.log(userInfoFilter);

      const updateDoc = {
        $set: {
          name: userInfo.name,
          photoURL: userInfo.photoURL,
          lastLogin: userInfo.lastLogin,
        },
      };

      const result = await userCollection.updateOne(userInfoFilter, updateDoc);
      res.send(result);
    });

    //update the trainerInfo collection status and role of the users collection's user.

    app.patch("/trainerInfoByEmail/:email", async (req, res) => {
      const email = req.params.email;

      const trainerInfoFilter = { email: email };
      const updatedUserInfo = {
        $set: {
          status: "accepted",
        },
      };
      const userInfoFilter = { email: email };
      const updatedTrainerInfo = {
        $set: {
          role: "trainer",
        },
      };

      const session = client.startSession();

      try {
        session.startTransaction();

        const trainerInfoUpdateResult = await trainerInfoCollection.updateOne(
          trainerInfoFilter,
          updatedUserInfo,
          { session }
        );
        const userUpdateResult = await userCollection.updateOne(
          userInfoFilter,
          updatedTrainerInfo,
          { session }
        );

        if (trainerInfoUpdateResult.matchedCount === 0) {
          throw new Error("Trainer info not found");
        }

        if (userUpdateResult.matchedCount === 0) {
          throw new Error("User not found");
        }

        await session.commitTransaction();
        session.endSession();

        res.send({
          userUpdate: userUpdateResult,
          trainerInfoUpdate: trainerInfoUpdateResult,
        });
      } catch (error) {
        console.error("Error during transaction:", error); // Log the error
        await session.abortTransaction();
        session.endSession();
        res.status(500).send({ message: error.message });
      }
    });

    // update the trainerInfo collection if status will rejected
    app.patch("/trainerInfoByEmailWithRejected/:email", async (req, res) => {
      const email = req.params.email;

      const trainerInfoFilter = { email: email };
      const updatedUserInfo = {
        $set: {
          status: "rejected",
        },
      };
      const userInfoFilter = { email: email };
      const messageInfo = req.body;
      const updatedTrainerInfo = {
        $set: {
          message: messageInfo.rejectionMessage,
        },
      };

      const session = client.startSession();

      try {
        session.startTransaction();

        const trainerInfoUpdateResult = await trainerInfoCollection.updateOne(
          trainerInfoFilter,
          updatedUserInfo,

          { session }
        );
        const userUpdateResult = await userCollection.updateOne(
          userInfoFilter,
          updatedTrainerInfo,

          { session }
        );

        if (trainerInfoUpdateResult.matchedCount === 0) {
          throw new Error("Trainer info not found");
        }

        if (userUpdateResult.matchedCount === 0) {
          throw new Error("User not found");
        }

        await session.commitTransaction();
        session.endSession();

        res.send({
          userUpdate: userUpdateResult,
          trainerInfoUpdate: trainerInfoUpdateResult,
        });
      } catch (error) {
        console.error("Error during transaction:", error); // Log the error
        await session.abortTransaction();
        session.endSession();
        res.status(500).send({ message: error.message });
      }
    });

    // delete slot api
    app.delete("/paymentInfo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await paymentInfoCollection.deleteOne(query);
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
