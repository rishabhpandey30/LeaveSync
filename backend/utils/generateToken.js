const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a given user ID and role
 * @param {string} id - MongoDB User _id
 * @param {string} role - User role (admin | manager | employee)
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

module.exports = generateToken;
