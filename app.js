const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// const { db } = require("./Item");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  // let day = date.getDate();
  let day = "Today";
  const activeLists = await List.find({});

  Item.find({}, async function (err, items) {
    if (items.length === 0) {
      await initializeDefaultDB();
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        items: items,
        activeLists: activeLists,
      });
    }
  });
});

app.post("/", function (req, res) {
  const newItem = new Item({
    name: req.body.newItem,
  });
  const listName = req.body.list;

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/about", async function (req, res) {
  const activeLists = await List.find({});
  res.render("about", { activeLists: activeLists, listTitle: "About" });
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const activeLists = await List.find({});

  List.findOne({ name: customListName }, async function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: [],
        });
        await list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          items: foundList.items,
          activeLists: activeLists,
        });
      }
    }
  });
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err, doc) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.post("/newList", function (req, res) {
  const newList = req.body.newList;
  res.redirect("/" + newList);
});

app.post("/deleteList", async function (req, res) {
  const listToDelete = req.body.listToDelete;

  await List.deleteOne({name: listToDelete});
  res.redirect("/"); 

});

mongoose.set("strictQuery", true);
main().catch((err) => console.log(err));

async function main() {
  mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
  console.log("MongoDB connected");
}

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

async function initializeDefaultDB() {
  const item1 = new Item({
    name: "Buy Food",
  });

  const item2 = new Item({
    name: "Cook Food",
  });

  const item3 = new Item({
    name: "Eat Food",
  });

  const defaultItems = [item1, item2, item3];
  Item.insertMany(defaultItems, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Default items saved to DB");
    }
  });
}
