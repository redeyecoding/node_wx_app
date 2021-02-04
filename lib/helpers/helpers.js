// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('../../config');

// helper container
const helpers = {};

// Creat SHA256 HASH
helpers.hash = password => {
    if (typeof(password) === 'string' && password.length > 0) {
         const hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
         return hash;
    } else {
        return false;
    }
};



// This function will take an randome string and either return false or the 
// JSON object from that string.

// The reason we're doing this is because 
//node AND/OR JS would throw and error if the parse data is not 
// valid json format ( we dn't want it to throw errors):
helpers.parseJsonToObject = string => {
    try {
        const obj = JSON.parse(string);
        return obj
    } catch (err) {
        return {};
    }
};


module.exports = helpers;