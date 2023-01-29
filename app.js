const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
require("dotenv").config();
//const date = require(__dirname + "/date.js");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect to db
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true });


const itemsSchema = mongoose.Schema({
  name: String
});


const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your Todolist !!"
});
const item2 = new Item({
  name: "Hit the '+' button to add new item."
});
const item3 = new Item({
  name: "<-- Click here to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  //const day = date.getDate();
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0){
		Item.insertMany(defaultItems, function(errr){
		  if(errr) console.log(errr);
		//   else console.log("inserted items successfully");
		})
		res.redirect("/");
	}
    else
		res.render("list", { listTitle: "Today", newListItems: foundItems });

  });
});

app.get("/:listName", function (req, res) {
	
	const customListName = _.capitalize(req.params.listName);

	List.findOne({name:customListName}, function(err, foundList){
		if(!err && foundList){
			//show existing list
			res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
		}
		else{
			//create a new list
			const list = new List({
				name:customListName,
				items: defaultItems
			});
			list.save();
			res.redirect("/" + customListName);
		}
	});
});


app.post("/", function (req, res) {

  	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	if(listName === "Today"){
		item.save();
		res.redirect("/");
	}
	else{
		List.findOne({name:listName}, function(err, foundList){
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
	
});

app.post("/delete", function(req, res){

	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if(listName === "Today"){
		Item.findByIdAndRemove(checkedItemId, function(err){
			if(!err) res.redirect("/");
		});
	}
	else{
		List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}}, function(err, foundList){
			if(!err) res.redirect("/" + listName);
		});
	}
});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT, function () {
  console.log("Server started on port 3000");
});
