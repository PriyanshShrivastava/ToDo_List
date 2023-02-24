const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });
let day = require(`${__dirname}/date`);
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
  useNewUrlParser: true,
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const listSchema = new mongoose.Schema({
  listName: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemSchema);

app.use(express.static(`${__dirname}/public`));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  Item.find({}, function (err, items) {
    res.render(`list`, {
      listTitle: `${day}'s  Task List`,
      newItems: items,
    });
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  if (customListName === "Home") {
    res.redirect("/");
  } else {
    List.findOne({ listName: customListName }, function (err, foundList) {
      if (!err) {
        if (!foundList) {
          const newList = new List({
            listName: customListName,
            items: [],
          });

          newList.save();
          res.redirect(`/${customListName}`);
        } else {
          res.render("list", {
            listTitle: foundList.listName,
            newItems: foundList.items,
          });
        }
      }
    });
  }
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  if (!itemName) {
    res.redirect("/");
  } else {
    const item = new Item({
      name: itemName,
    });
    if (listTitle === `${day}'s`) {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({ listName: listTitle }, function (err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listTitle}`);
      });
    }
  }
});

app.post("/delete", (req, res) => {
  const checkedItem = req.body.tasks;
  const listName = req.body.listname;

  if (listName === `${day}'s`) {
    Item.findByIdAndRemove({ _id: checkedItem }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { listName: listName },
      { $pull: { items: { _id: checkedItem } } },
      function (err, foundList) {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("server is running on port 3000");
});
