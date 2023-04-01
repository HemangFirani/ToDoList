const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ =require("lodash")
const { Schema } = mongoose;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://HemangF21:Hemang21.@cluster0.4uf3ojc.mongodb.net/todolistDB")

// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser : true});

const itemsSchema = new Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({name:"Welcome to your ToDo List!"});
const item2 = new Item({name:"Hit the + button to add new item."});
const item3 = new Item({name:"<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find()
  .then(function(foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  if (req.params.customListName == "favicon.ico") return;
  List.findOne({name: customListName})
    .then(function(foundList) {
      if (!foundList) {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save().then(function(err){
          res.redirect("/");
        });
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch(function(err) {
      console.log(err);
    });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name: itemName});
  if (listName === "Today") {
    item.save().then(function(err){
      res.redirect("/");
    });
  } else {
    List.findOne({name: listName})
      .then(function(foundList) {
        if (foundList) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" +listName);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName=req.body.listName;
  if (listName === "Today") {
    
    Item.findByIdAndRemove(checkedItemId)
      .then(function(foundItem) {
        Item.deleteOne({_id: checkedItemId})
          .then(function() {
            res.redirect("/");
          })
          .catch(function(err) {
            console.log(err);
          });
      })
      .catch(function(err) {
        console.log(err);
      });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
    .then(function(foundList){
      
        res.redirect("/"+listName)
     
    })
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
