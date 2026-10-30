const mongoose = require("mongoose");

const homeSchema = mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  houseName: {type: String, required: true},
  price: {type: Number, required: true},
  location: {type: String, required: true},
  rating: {type: Number, required: true},
  photo: String,
  description: String,
});

// homeSchema.pre('findOneAndDelete', async function() {
//   const query = this.getQuery(); // We get the query object from the delete operation to identify the home and perform related cleanup.
//   const homeId = query._id; // We get the homeId from the query to identify the deleted home and remove its related favourites.
//   await favourites.deleteMany({houseId: homeId});  // We use deleteMany to remove all favourites with the same houseId as the deleted home, keeping data clean and avoiding invalid entries.
// });


module.exports = mongoose.model("Home", homeSchema);
