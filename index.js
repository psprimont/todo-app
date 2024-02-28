import dotenv from "dotenv";
import express from "express";
import { getDate } from "./date.js";
import { MongoClient, ServerApiVersion } from "mongodb";
// import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = process.env.port || 3000;
const mongoDate = MongoClient.Date; //obsolete??

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const dbUser = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.6dgiqo7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect/ping MongoDB deployment
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    await client.close();
  }
}
run().catch(console.log);

const dbName = "toDoApp";
const todaysDate = getDate();

// set due date
// ** create no due date text/option
function createDueDate (relDate) {
  const today = new Date();
  const dayOfWeekNum = today.getDay();
  let dueDate = new Date(today);

  if (relDate === "today") {
    return dueDate;
  } else if (relDate === "tomorrow") {
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (relDate === "later this week") {
    if (dayOfWeekNum === 0) {
      dueDate.setDate(dueDate.getDate() + 3);
    } else if (dayOfWeekNum >= 1 && dayOfWeekNum <= 3) {
      dueDate.setDate(dueDate.getDate() + 2);
    };
  } else if (relDate === "this weekend") {
    dueDate.setDate(dueDate.getDate() + (7 - dayOfWeekNum));
  } else if (relDate === "next week") {
    dueDate.setDate(dueDate.getDate() + (8 - dayOfWeekNum));
  } else {
    dueDate = "No due date"
  };
  return dueDate;
};

// if today is any day of the week...
//  if dueDateRel is today, pass today's date into dueDateAbs
//  if dueDateRel is tomorrow, add 1 to today's date and pass to dueDateAbs
//  if dueDateRel is next week, set due date to following Mon
// if today is 1-6, show option for "this weekend"
//  if today is 1-5, add 5-1 to today's date and pass to dueDateAbs
//  if today is 6, add 1 to today's date and pass to dueDateAbs

// if today is 0-3, show option "later this week"
//  if today is 0 or 1, set due date to Wed (add 3 or 2 to date) and pass to dueDateAbs
//  if today is 2, set due date to Thur (add 2 to date) and pass to dueDateAbs
//  if today is 3, set due date to Fri (add 2 to date) and pass to dueDateAbs 


app.get("/", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("toDoItems");

    // aggregate by creation date
    const toDoItems = await col.aggregate([
      { $sort: { createdDate: 1 } } // Sort by creation date in ascending order
    ]).toArray();

    // // aggregate by category
    // const toDoItems = await col.aggregate([
    //     {
    //         $group: { 
    //             _id: "$category", 
    //             items: {$push: "$$ROOT" },
    //         },
    //     },
    // ]).toArray();


    console.log(toDoItems);
    res.render("index", { toDoItems: toDoItems, date: todaysDate });
  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
});

app.post("/", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("toDoItems");
    let dueDateRel = req.body.dueDate;
    let dueDateAbs = createDueDate(dueDateRel);
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    let dueDateAbsReadable = dueDateAbs.toLocaleDateString('en-US', options);
    let newItem = {
      description: req.body.newToDo,
      category: req.body.category,
      dueDateRel: req.body.dueDate,
      dueDateAbs: dueDateAbs,
      dueDateAbsReadable: dueDateAbsReadable,
      createdDate: new Date().toLocaleDateString(),
      createdTime: new Date().toLocaleTimeString(),
    };
    console.log(newItem);
    createDueDate();
    await col.insertOne(newItem);
  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
