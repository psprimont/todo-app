import dotenv from "dotenv";
import express from "express";
import $ from "jquery";
import { getDate } from "./date.js";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
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
function createDueDate (relDate) {
  const today = new Date();
  const dayOfWeekNum = today.getDay();
  let dueDate = new Date(today);

  if (relDate === "today") {
    // do nothing
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

function formatDueDate (absDate) {
  let formattedDueDate;
  if (absDate === "No due date") {
    formattedDueDate = absDate;
  } else {
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    formattedDueDate = absDate.toLocaleDateString('en-US', options);
  };
  return formattedDueDate;
}


app.get("/", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("toDoItems");

    // aggregate by completed status and creation date
    const toDoItems = await col.aggregate([
      { $match: { completed: false } }, // Only select items with completed: false
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
    let dueDateAbsReadable = formatDueDate(dueDateAbs);
    let newItem = {
      taskName: req.body.newToDo,
      description: req.body.description,
      category: req.body.category,
      dueDateRel: req.body.dueDate,
      dueDateAbs: dueDateAbs,
      dueDateAbsReadable: dueDateAbsReadable,
      createdDate: new Date().toLocaleDateString(),
      createdTime: new Date().toLocaleTimeString(),
      completed: false,
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

let lastRemovedTaskId

// update the completed status of a task
app.post("/updateCompletedStatus", async (req, res) => {
  try {

    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("toDoItems");

    const taskIdObj = new ObjectId(req.body.taskId);
    lastRemovedTaskId = taskIdObj;
    const task = await col.findOne({ _id: taskIdObj });
    await col.updateOne({ _id: taskIdObj }, { $set: { completed: !task.completed } });
    console.log(task);


    res.send(task);
  } catch (err) {
    console.log(err.stack);

    res.status(500).send('Error updating completed status');
  } finally {

    await client.close();
  }
});

app.post("/undoCompletedStatus", async (req, res) => {
  try {

    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("toDoItems");


    const taskIdObj = lastRemovedTaskId;
       console.log (`the new taskIdObj is ${taskIdObj}`);
    const task = await col.findOne({ _id: taskIdObj });
    await col.updateOne({ _id: taskIdObj }, { $set: { completed: !task.completed } });


    res.send('Completed status updated successfully');
  } catch (err) {
    console.log(err.stack);

    res.status(500).send('Error updating completed status');
  } finally {

    await client.close();
  }
});



app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
