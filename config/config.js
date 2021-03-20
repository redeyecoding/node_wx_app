/*
    *Create and export configuration variabes
*/

// Container for all the enviornments
let enviornment = {};

// Create Staging Object  (The default)
enviornment.staging = {
    'httpPort': process.env.HTTP_PORT,
    'httpsPort': process.env.HTTPS_PORT,
    'envName': process.env.DEFAULT_APP_ENV,
    'hashingSecret': process.env.HTTP_HASH,
    'maxChecks': 5,
    'twilio':  {
        'accountSid' : process.env.TWILIO_ACCOUNT_SID,
        'authToken' : process.env.TWILIO_AUTH_TOKEN,
        'fromPhone' : process.env.TWILIO_DID
    }
};


// Create a production object
enviornment.production = {
    'httpPort': process.env.HTTP_PORT,
    'httpsPort': process.env.HTTPS_PORT,
    'envName': process.env.DEFAULT_APP_ENV,
    'hashingSecret': process.env.HTTP_HASH,
    'maxChecks': 5,
    'twilio':  {
        'accountSid' : process.env.TWILIO_ACCOUNT_SID,
        'authToken' : process.env.TWILIO_AUTH_TOKEN,
        'fromPhone' : process.env.TWILIO_DID
    }
};

// Determine which enviorment was passed as a command-line arg
let currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';


// check that the current enviornment is one of the envionment above, if not, then default to the staging envionment
let enviornmentToExport = typeof(enviornment[currentEnviornment]) == 'object' ? enviornment[currentEnviornment] : enviornment.staging;


module.exports = enviornmentToExport;
