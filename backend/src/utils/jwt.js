const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });

exports.signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });

exports.verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
exports.verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);
