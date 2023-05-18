//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =  require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://abhijit:abhijit@cluster0.jmqqnng.mongodb.net/todolistDB", {useNewUrlParser : true});

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your do do list."
});
const item2 = new Item({
  name : "Hit the + button to aff a new line."
});
const item3 = new Item({
  name : "<-- Hit this to delete an item."
});
async function getItems(){

  const Items = await Item.find({});
  return Items;

}
const defaultItems = [item1,item2,item3];

const listSchema = {
  name : String,
  items: [itemsSchema]

};

const List = mongoose.model("List",listSchema);


app.get("/", function(req, res) {

  // Item.find({},function(err,foundItems){
  //   console.log(foundItems);
  // });
  getItems().then(function(foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
            .then(function () {
              console.log("Successfully saved defult items to DB");
            })
            .catch(function (err) {
              console.log(err);
            });
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});

    }
  });



});

app.post("/",async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    try{
      const found = await List.findOne({name : listName}).exec();
      if(!found){
        // console.log("not found");
        // const list = new List({
        //   name : customListName,
        //   items: defaultItems
        // });
        // list.save();
        // res.redirect("/"  + customListName);
      }else{
        found.items.push(item);
        found.save();
        res.redirect("/" + listName);
          // console.log("found");
      }
    }catch (err){
      console.log(err);
    };
  }


  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .exec()
      .then(() => {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error deleting item");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .exec()
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {  // caht gpt also catch the error
        console.log(err);
        res.status(500).send("Error deleting item from the list");
      });
  }
});



app.get("/:customListName",async function(req,res){

  const customListName = _.capitalize(req.params.customListName);
  try{
    const found = await List.findOne({name : customListName}).exec();
    if(!found){
      // console.log("not found");
      const list = new List({
        name : customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"  + customListName);
    }else{
      res.render("list", {listTitle: found.name, newListItems: found.items});
      console.log("found");
    }
  }catch (err){
    console.log(err);
  };


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
