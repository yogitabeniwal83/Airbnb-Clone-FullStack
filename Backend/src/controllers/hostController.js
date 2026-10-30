const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const Home = require('../models/home');

const uploadDir = path.join(__dirname, '../../uploads');
const legacyUploadDir = path.join(__dirname, '../uploads');

const getPhotoFilename = (photo) => {
  if (!photo) return '';
  return path.posix.basename(String(photo).replace(/\\/g, '/'));
};

const deleteStoredPhoto = (photo) => {
  const filename = getPhotoFilename(photo);
  if (!filename) return;

  const possiblePaths = [
    path.join(uploadDir, filename),
    path.join(legacyUploadDir, filename),
  ];

  const existingPath = possiblePaths.find((filePath) => fs.existsSync(filePath));
  if (!existingPath) return;

  fs.unlink(existingPath, (error) => {
    if (error) {
      console.error('Error while deleting image:', error);
    }
  });
};

const deleteRequestUpload = (file) => {
  if (file?.filename) {
    deleteStoredPhoto(`/uploads/${file.filename}`);
  }
};

const isOwnedBy = (home, userId) => (
  Boolean(home?.hostId) && home.hostId.toString() === userId.toString()
);

const invalidHomeIdResponse = (res) => res.status(400).json({
  success: false,
  message: 'Invalid home ID',
});

exports.getAddHome = (req, res) => {
  res.json({ message: 'Add Home API' });
};

exports.getEditHome = async (req, res) => {
  const { homeId } = req.params;

  if (!mongoose.isValidObjectId(homeId)) {
    return invalidHomeIdResponse(res);
  }

  try {
    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).json({ success: false, message: 'Home not found' });
    }

    if (!isOwnedBy(home, req.session.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to manage this home',
      });
    }

    return res.json(home);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load this home',
    });
  }
};

exports.getHostHomes = async (req, res) => {
  try {
    const homes = await Home.find({ hostId: req.session.user._id });
    return res.json({ success: true, homes });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load hosted homes',
    });
  }
};

exports.postAddHome = async (req, res) => {
  const { houseName, price, location, rating, description } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No valid image provided',
    });
  }

  try {
    const home = await Home.create({
      hostId: req.session.user._id,
      houseName,
      price,
      location,
      rating,
      photo: `/uploads/${req.file.filename}`,
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Home added successfully',
      home,
    });
  } catch (error) {
    deleteRequestUpload(req.file);
    return res.status(500).json({
      success: false,
      message: 'Unable to add home',
    });
  }
};

exports.postEditHome = async (req, res) => {
  const { id, houseName, price, location, rating, description } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    deleteRequestUpload(req.file);
    return invalidHomeIdResponse(res);
  }

  try {
    const home = await Home.findById(id);

    if (!home) {
      deleteRequestUpload(req.file);
      return res.status(404).json({ success: false, message: 'Home not found' });
    }

    if (!isOwnedBy(home, req.session.user._id)) {
      deleteRequestUpload(req.file);
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to manage this home',
      });
    }

    const previousPhoto = home.photo;
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if (req.file) {
      home.photo = `/uploads/${req.file.filename}`;
    }

    await home.save();

    if (req.file) {
      deleteStoredPhoto(previousPhoto);
    }

    return res.json({
      success: true,
      message: 'Home updated successfully',
      home,
    });
  } catch (error) {
    deleteRequestUpload(req.file);
    return res.status(500).json({
      success: false,
      message: 'Unable to update home',
    });
  }
};

exports.postDeleteHome = async (req, res) => {
  const { homeId } = req.params;

  if (!mongoose.isValidObjectId(homeId)) {
    return invalidHomeIdResponse(res);
  }

  try {
    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).json({ success: false, message: 'Home not found' });
    }

    if (!isOwnedBy(home, req.session.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to manage this home',
      });
    }

    await Home.deleteOne({ _id: home._id, hostId: req.session.user._id });
    deleteStoredPhoto(home.photo);

    return res.json({
      success: true,
      message: 'Home deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to delete home',
    });
  }
};
