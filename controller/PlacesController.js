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

  const { title, description, location, adress, creator } = req.body;
  const createdPlace = new Place({
    title,
    description,
    image:
      "https://instagram.ftun16-1.fna.fbcdn.net/v/t51.2885-15/323793979_3431821727094338_226536469517154699_n.webp?stp=dst-jpg_e35_p640x640_sh0.08&_nc_ht=instagram.ftun16-1.fna.fbcdn.net&_nc_cat=102&_nc_ohc=CTEXMK1eTLkAX8MQLt0&edm=AJqaXLUBAAAA&ccb=7-5&ig_cache_key=MzAwODU0NDc2NDU2NDc4Nzc2Ng%3D%3D.2-ccb7-5&oh=00_AfBJKbl6npwTSfyMcQgi37mw3Owt3uub2OOxnAn-NACKSA&oe=64E4DCC1&_nc_sid=7b930e",
    location,
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
    return next(new HttpError(" Creating place failed ! ", 500));
  }
  res.status(201).json({ place: createdPlace });
};

exports.updatePlace = async (req, res, next) => {
  const { title, description } = req.body;
  const placeId = req.params.pid;
  let newPlace;
  try {
    newPlace = await Place.findById(placeId);
  } catch (e) {
    return next(new HttpError(" Somthing Went Wrong ! ", 500));
  }
  newPlace.title = title;
  newPlace.description = description;

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
