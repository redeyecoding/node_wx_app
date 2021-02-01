/*
    *Create and export configuration variabes
*/

// Container for all the enviornments
let enviornment = {};

// Create Staging Object  (The default)
enviornment.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging'
};


// Create a production object
enviornment.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production'
};

// Determine which enviorment was passed as a command-line arg
let currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLocaleLowerCase() : '';


// check that the current enviornment is one of the envionment above, if not, then default to the staging envionment
let enviornmentToExport = typeof(enviornment[currentEnviornment]) == 'object' ? enviornment[currentEnviornment] : enviornment.staging;


module.exports = enviornmentToExport;