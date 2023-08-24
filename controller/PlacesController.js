const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Place = require("../models/place");
const User = require("../models/user");

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    return next(new HttpError(" Somthing Went Wrong ! ", 500));
  }
  if (!place) {
    return next(
      new HttpError("couldn't find place for the provided place id", 404)
    );
  }
  res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let PLACES;
  try {
    PLACES = await Place.find({ creator: userId });
  } catch (err) {
    return next(new HttpError(" Somthing Went Wrong HERE ! ", 500));
  }
  if (!PLACES || PLACES.length === 0) {
    next(new HttpError("couldn't find places for the provided user id", 404));
  } else {
    res.json({
      PLACES: PLACES.map((place) => place.toObject({ getters: true })),
    });
  }
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid Inputs , check your data ", 422));
  }

  const { title, description, adress, image, creator } = req.body;
  const createdPlace = new Place({
    title,
    description,
    image,
    location: { lat: 265986.15, lng: -758648.35 },
    adress,
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (e) {
    return next(new HttpError(" Creating place failed ! ", 500));
  }

  if (!user) {
    return next(
      new HttpError(" we could not find user for provided id ! ", 404)
    );
  }

  try {
    // await createdPlace.save();
    const SESSION = await mongoose.startSession();
    SESSION.startTransaction();
    await createdPlace.save({ SESSION });
    user.places.push(createdPlace);
    await user.save({ SESSION });
    await SESSION.commitTransaction();
  } catch (e) {
    return next(new HttpError(" Creating place failed saiving ! ", 500));
  }
  res.status(201).json({ place: createdPlace });
};

exports.updatePlace = async (req, res, next) => {
  const { title, description ,image} = req.body;
  const placeId = req.params.pid;
  let newPlace;
  try {
    newPlace = await Place.findById(placeId);
  } catch (e) {
    return next(new HttpError(" Somthing Went Wrong ! ", 500));
  }
  newPlace.title = title;
  newPlace.description = description;
  newPlace.image = image;

  try {
    await newPlace.save();
  } catch (e) {
    return next(new HttpError(" Updating place failed ! ", 500));
  }

  res.status(200).json({ newPlace: newPlace.toObject({ getters: true }) });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(
      new HttpError(" Somthing Went Wrong finding the place ! ", 500)
    );
  }
  if (!place) {
    return next(new HttpError("Place with this Id is not found ", 404));
  }
  try {
    // await place.remove();

    // await Place.deleteOne(placeId);
    const SESSION = await mongoose.startSession();
    SESSION.startTransaction();
    await place.deleteOne({ SESSION });
    place.creator.places.pull(place);
    await place.creator.save({ SESSION });
    await SESSION.commitTransaction();

    await place.deleteOne();
  } catch (err) {
    return next(
      new HttpError(" Somthing Went Wrong removing the place ! ", 500)
    );
  }
  res.status(200).json({ message: "Place deleted successfully" });
};
