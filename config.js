/*
    *Create and export configuration variabes
*/

// Container for all the enviornments
let enviornment = {};

// Create Staging Object  (The default)
enviornment.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'LKSJDFjwEIJF2#@%j2faksJD0F8AJ3@^@#$jrfj@fj@',
    'maxChecks': 5,
    'twilio':  {
        'accountSid' : 'AC7c8632a0f02821e220af4066ba58844c',
        'authToken' : 'fb9b64e5f91ecb08db6e44b0d2c8f279',
        'fromPhone' : '+19852758621'
    }
};


// Create a production object
enviornment.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': '54@$@G2EIJF2#@%j2faksJD0F8AJ3@^@#$jrfj@fj@processee3',
    'maxChecks': 5,
    'twilio':  {
        'accountSid' : 'AC7c8632a0f02821e220af4066ba58844c',
        'authToken' : 'fb9b64e5f91ecb08db6e44b0d2c8f279',
        'fromPhone' : '+19852758621'
    }
};

// Determine which enviorment was passed as a command-line arg
let currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';


// check that the current enviornment is one of the envionment above, if not, then default to the staging envionment
let enviornmentToExport = typeof(enviornment[currentEnviornment]) == 'object' ? enviornment[currentEnviornment] : enviornment.staging;


module.exports = enviornmentToExport;
