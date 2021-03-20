// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('../../config/config');
const queryString = require('querystring');
const https = require('https');


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

// Create a string of alphanumeric charcters of a given length

helpers.tokenStringRound = 38;
helpers.createTokenString = () => {    
    const strLength = helpers.tokenStringRound;
    if (strLength) {
        // Define all possible characters that could go into a string
        const possibleChars = 'abcdefghijklmnopqrstuvwxyz1234567890';

        // Start the final string
        let str = '';

        for (let i=0; i < strLength ; i++) {
            // build token
            const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randomChar;            
        }; 
        return str;       
    }    
};


// Send SMS to Users Via Twilio
helpers.sendTwilioSms = (( phone, msg, callback) => {
    // Validate parameters
    phone = typeof(phone) === 'string' && phone.trim().length == 10 ? 
        phone.trim(): 
        false;
    msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? 
        msg.trim() : 
        false;
    
    if (phone && msg) {
        // Configure the request payload
        let payload = {
            'from': config.twilio.fromPhone,
            'to': '+1'+phone,
            'body': msg
        };
        
        // Stringy the payload
            // We're not JSON stringfying it because the request sent to twilio will accept 'normal' 
        const stringPayload = queryString.stringify(payload);

        
        // Configure te request details
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method' : 'POST',
            'path': '/2010-04-01/Accounts/'+config.twilio.accountSid,
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };


        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback('Request to Twilio was a success!', status);
            } else {
                callback(`Status code returned was: `+status+res.statusMessage, status );
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', (err) => {
            callback(err);
        });

        // Add payload to request
        req.write(stringPayload);

        // End the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
});



module.exports = helpers;