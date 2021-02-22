/*
    These are worker related tasks
*/


// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('../data');
const http = require('http');
const https = require('https');
const helpers = require('../helpers/helpers');
const url = require('url');
const { hostname } = require('os');


// Instantiate the worker object
const workers = {};




// Timer to execute the worker-process onces per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }
    , 1000 * 60)
}

workers.gatherAllChecks = () => {
    // Get all the checks that exist in the system
    _data.list('checks', (( err, checks ) => {
        if (!err && check.length > 0) {
            checks.forEach(check => {
                // Read in the check data
                _data.read('checks', check, (( err, originalCheckData ) =>{
                    if (!err && originalCheckData) {
                        // Pass it to the check validator, and let that function continue or log errors as needed.
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of teh check\'s data');
                        
                    }
                }))
            });
        } else {
            console.log('Error: Couldn not find any checks to process')
        }
    }))
};

// Sanity-check the check-data
workers.validateCheckData = originalCheckData => {
    originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};
    
    originalCheckData.id = typeof(originalCheckData.id) === 'string' && typeof(originalCheckData.id).trim().length === helpers.tokenStringRound ?
        originalCheckData.id.trim() :
        false;

    originalCheckData.userPhone = typeof(originalCheckData.userPhone) === 'string' && typeof(originalCheckData.userPhone).trim().length === 10 ?
        originalCheckData.userPhone.trim() :
        false;
    
    originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].indexOf(originalCheckData) > -1 ?
        originalCheckData.protocol.trim() :
        false;

    originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim() > 0 ?
        originalCheckData.url.trim() :
        false;

    originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete' ].indexOf(originalCheckData.method) > -1 ?
        originalCheckData.method.trim() :
        false;
    
    originalCheckData.statusCode = typeof(originalCheckData.statusCode) === 'object' && originalCheckData.statusCode.length > 0 && originalCheckData.statusCodes instanceof Array ?
        originalCheckData.statusCode.trim() :
        false;

    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds <= 5 ?
        originalCheckData.timeoutSeconds :
        false;

    // Set the keys that may not be set if the workers have never seen the check before
    originalCheckData.state = typeof(originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData) > -1 ?
        originalCheckData.state.trim() :
        'down';

    originalCheckData.lastChecked = typeof(originalCheckData.timeoutSeconds) === 'number' && originalCheckData.lastChecked > 0 ?
        originalCheckData.lastChecked :
        false;

    // If all the checks pass, pass data along to next step in process
    if (originalCheckData.id && 
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.method &&
        originalCheckData.url &&
        originalCheckData.statusCode &&
        originalCheckData.timeoutSeconds) {
            workers.performCheck(originalCheckData)
    } else {
        console.log("Error: One of the checks is not properly formatted. Skipping it");
    }

    // Perform check, send the originalCheckData
    workers.performCheck = originalCheckData => {
        // Perpare the initial check outcome
        const checkOutcome = {
            'error': false,
            'responseCode': false
        };

        // Mark that the outcome has not been sent yet
        let outcomeSent = false;

        // Parse the hostnamd and teh path out of the original check data
        const parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
        const hostName = parsedUrl.hostname;
        const path = parsedUrl.path; // Using path and not "pathname" beause we want the query string

        // Construct the request
        const requestDetails = {
            'protocol': originalCheckData.protocol+':',
            'hostname': hostName,
            'method': originalCheckData.method.toUpperCase(),
            'path': path,
            'timeout': originalCheckData.timeoutSeconds * 1000
        };

        // Instantiate the request object ( using either the http or https module )
        const _moduleToUse = originalCheckData.protocol === 'http' ? http : https;


        // Craft the request
        const req = _moduleToUse.request(requestDetails, (res => {
            // Grab the status of the sent request
            const status = res.statusCode;

            // Update the checkOutcome and pass the data along
            checkOutcome.responseCode = status;

            if (!outcomeSent) {
                workers.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            };
        }));

        // Bind to the error even so it doesn't get thrown
        req.on('error', (err) => {
            // Update the checkoutcome and pass the data along
            checkOutcome.error = {
                'error': true,
                'value': err
            };

            if (!outcomeSent) {
                outcomeSent = true;
            }

            
        })
    }
};


// Init scripts
workers.init = () => {
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // call loop so the checks will execute later on
    workers.loop();
}

// Export the module
module.exports = workers;