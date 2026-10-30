const mongoose = require('mongoose');

const Home = require('../models/home');
const User = require('../models/user');

const FAVOURITE_HOME_FIELDS = 'houseName photo location price rating';

exports.getIndex = async (req, res) => {
  try {
    const registeredHomes = await Home.find();
    res.json(registeredHomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getHomes = async (req, res) => {
  try {
    const registeredHomes = await Home.find();
    res.json(registeredHomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getBookings = (req, res, next) => { 
    res.render('store/bookings', {
      pageTitle: 'My Bookings', 
      currentPage: 'bookings',
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    })
};

exports.getFavouriteList = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate({
      path: 'favourites',
      select: FAVOURITE_HOME_FIELDS,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your account could not be found. Please login again.',
      });
    }

    return res.json({
      success: true,
      favourites: user.favourites,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load favourites. Please try again.',
    });
  }
};

exports.postAddToFavourite = async (req, res) => {
  try {
    const { homeId } = req.params;

    if (!mongoose.isValidObjectId(homeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid home ID.',
      });
    }

    const home = await Home.findById(homeId, FAVOURITE_HOME_FIELDS);
    if (!home) {
      return res.status(404).json({
        success: false,
        message: 'Home not found.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { $addToSet: { favourites: home._id } },
      { new: true },
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your account could not be found. Please login again.',
      });
    }

    return res.json({
      success: true,
      message: 'Home added to favourites.',
      isFavourite: true,
      home,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to add this home to favourites. Please try again.',
    });
  }
};

exports.postRemoveFromFavourite = async (req, res) => {
  try {
    const { homeId } = req.params;

    if (!mongoose.isValidObjectId(homeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid home ID.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { $pull: { favourites: homeId } },
      { new: true },
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your account could not be found. Please login again.',
      });
    }

    return res.json({
      success: true,
      message: 'Home removed from favourites.',
      isFavourite: false,
      homeId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to remove this home from favourites. Please try again.',
    });
  }
};


exports.getHomeDetails = async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home) {
      return res.status(404).json({
        message: "Home not found"
      });
    }

    res.json(home);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
