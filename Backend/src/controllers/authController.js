const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../models/user');
const { getUserRoles, toSessionUser } = require('../utils/userRoles');

const saveSession = (session) => new Promise((resolve, reject) => {
  session.save((error) => error ? reject(error) : resolve());
});

const migrateLegacyRoles = async (user) => {
  const roles = getUserRoles(user);
  await User.updateOne(
    { _id: user._id },
    { $addToSet: { roles: { $each: roles } } },
  );

  return roles;
};

exports.getLogin = (req, res) => {
  res.json({ message: 'Login API' });
};

exports.getSignup = (req, res) => {
  res.json({ message: 'Signup API' });
};

exports.getSession = (req, res) => {
  const isLoggedIn = Boolean(
    req.session && req.session.isLoggedIn && req.session.user?._id,
  );

  if (isLoggedIn) {
    req.session.user = toSessionUser(req.session.user);
  }

  return res.json({
    success: true,
    isLoggedIn,
    user: isLoggedIn ? req.session.user : null,
  });
};

exports.postSignup = [
  check('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First Name must be at least 2 characters long')
    .matches(/^[A-Za-z]+$/)
    .withMessage('First Name must contain only letters'),

  check('lastName')
    .matches(/^[A-Za-z]*$/)
    .withMessage('Last Name must contain only letters'),

  check('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Password must contain at least one special character'),

  check('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  check('terms')
    .notEmpty()
    .withMessage('You must accept the terms and conditions')
    .custom((value) => {
      if (value !== 'on') {
        throw new Error('You must accept the terms and conditions');
      }
      return true;
    }),

  async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Please correct the highlighted fields.',
        errors: errors.array(),
      });
    }

    try {
      const existingUser = await User.exists({ email });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please sign in.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        roles: ['guest'],
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please sign in.',
        });
      }

      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }
  },
];

exports.postLogin = [
  check('email').trim().normalizeEmail(),

  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || typeof password !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const roles = await migrateLegacyRoles(user);
      req.session.isLoggedIn = true;
      req.session.user = toSessionUser({ ...user.toObject(), roles });
      await saveSession(req.session);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: req.session.user,
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: 'Unable to sign in. Please try again.',
      });
    }
  },
];

exports.postBecomeHost = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your account could not be found. Please sign in again.',
      });
    }

    const currentRoles = getUserRoles(user);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { roles: { $each: [...currentRoles, 'host'] } } },
      { returnDocument: 'after', runValidators: true },
    );

    req.session.user = toSessionUser(updatedUser);
    await saveSession(req.session);

    return res.status(200).json({
      success: true,
      message: 'You can now host homes.',
      user: req.session.user,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Unable to enable hosting. Please try again.',
    });
  }
};

exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: 'Logout successful',
    });
  });
};
