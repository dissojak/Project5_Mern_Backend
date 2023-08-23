const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");

exports.getUsers = async (req, res, next) => {
  const users = await User.find({}, "-pw");
  res.status(200).json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

exports.signupUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid Inputs ! check your data ", 422));
  }
  const { name, pw, email } = req.body;
  const createdUser = new User({
    name: name.toLowerCase(),
    pw,
    email,
    places:[]
  });
  try {
    await createdUser.save();
  } catch (e) {
    return next(new HttpError(" Creating User failed ! ", 500));
  }
  res.status(201).json({
    message: "User has been added succsessfully !",
    user: createdUser.toObject({ getters: true }),
  });
};

exports.loginUser = async (req, res, next) => {
  const { email, pw } = req.body;
  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError(" Somthing Went Wrong ! ", 500));
  }
  if (!user) {
    return next(new HttpError("Invalid Account !", 404));
  }
  if (user.pw !== pw) {
    return next(new HttpError("Incorrect Password !", 401));
  }
  res.json({ message: ` welcome Mr/Ms ${email} ` });
};
