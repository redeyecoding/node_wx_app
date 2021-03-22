/*
    These are worker related tasks
*/

//@TODO this worker will not work properly, need to setup api key for Twilio

// Dependencies
const _data = require('../data');
const http = require('http');
const https = require('https');
const helpers = require('../helpers/helpers');
const url = require('url');
const _logs = require('../logs');
const util = require('util');
const debug = util.debuglog('workers');


// Instantiate the worker object
const workers = {};


workers.gatherAllChecks = () => {
    // Get all the checks that exist in the system
    _data.list('checks', (( err, checks ) => {
        if (!err && checks.length > 0) {
            checks.forEach(check => {
                // Read in the check data
                _data.read('checks', check, (( err, originalCheckData ) =>{
                    if (!err && originalCheckData) {
                        // Pass it to the check validator, and let that function continue or log errors as needed.
                        workers.validateCheckData(originalCheckData);
                    } else {
                        debug('Error reading one of teh check\'s data');
                        
                    }
                }))
            });
        } else {
            debug('Error: Couldn not find any checks to process')
        }
    }));
};

// Sanity-check the check-data
workers.validateCheckData = originalCheckData => {
    originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};
    
    originalCheckData.id = typeof(originalCheckData.id) === 'string' && originalCheckData.id.trim().length === helpers.tokenStringRound ?
        originalCheckData.id.trim() :
        false;

    originalCheckData.userPhone = typeof(originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length === 10 ?
        originalCheckData.userPhone.trim() :
        false;
    
    originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ?
        originalCheckData.protocol.trim() :
        false;

    originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ?
        originalCheckData.url.trim() :
        false;

    originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete' ].indexOf(originalCheckData.method) > -1 ?
        originalCheckData.method.trim() :
        false;
    
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) === 'object' && originalCheckData.successCodes.length > 0 && originalCheckData.successCodes instanceof Array ?
        originalCheckData.successCodes :
        false;

    originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) === 'number' && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds <= 5 ?
        originalCheckData.timeOutSeconds :
        false;

    // Set the keys that may not be set if the workers have never seen the check before
    originalCheckData.state = typeof(originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData) > -1 ?
        originalCheckData.state.trim() :
        'down';

    originalCheckData.lastChecked = typeof(originalCheckData.timeOutSeconds) === 'number' && originalCheckData.lastChecked > 0 ?
        originalCheckData.lastChecked :
        false;


    // Perform check, send the originalCheckData
    workers.performCheck = originalCheckData => {
        // Perpare the initial check outcome
        const checkOutcome = {
            'error': false,
            'responseCode': false
        };

        // Mark that the outcome has not been sent yet
        let outcomeSent = false;

        // Parse the hostname and the path out of the original check data
        const parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
        const hostName = parsedUrl.hostname;
        const path = parsedUrl.path; // We're Using path and not "pathname" beause we want the query string

        // Construct the request
        const requestDetails = {
            'protocol': originalCheckData.protocol+':',
            'hostname': hostName,
            'method': originalCheckData.method.toUpperCase(),
            'path': path,
            'timeout': originalCheckData.timeOutSeconds * 1000
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
                workers.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            };            
        });

        // Bind to timeout event
        req.on('timeout', (err) => {
            // Update the checkoutcome and pass the data along
            checkOutcome.error = {
                'error': true,
                'value': 'timeout'
            };
            
            if (!outcomeSent) {
                workers.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            };            
        });

        // End the request
        req.end();
    }

    // If all the checks pass, pass data along to next step in process
    if (originalCheckData.id && 
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.method &&
        originalCheckData.url &&
        originalCheckData.successCodes &&
        originalCheckData.timeOutSeconds) {
            workers.performCheck(originalCheckData)
    } else {
        debug("Error: One of the checks is not properly formatted. Skipping it");
    }
};


// Process the check otucome and update the check data s neded and trigger an alert to the user if needed
// special logic fofr accomodating a dcheck that has never been tested before ( don't alert on that one )
workers.processCheckOutcome = (originalCheckData , checkOutcome) => {
    // Decide if the check is considered up or down
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? "up" : "down";

    // decide if an alert is warranted ( is it worth texting the user? )
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    const timeOfcheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfcheck);

    // Update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfcheck;

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            // Send the new check data to the next phase in the process if needed.
            if (alertWarranted){
                workers.alertUsertoStatusChange(newCheckData);
            } else {
            debug('Check outcome has not change, no alert needed');
        }
        } else {
            debug('Error trying to save updates to one of the checks');
        }
    });

    // Alert the user as to a change in their check status
    workers.alertUsertoStatusChange = (newCheckData => {
        let msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
        
        helpers.sendTwilioSms(newCheckData.userPhone, msg, (resMessage, statusCode) => {
            if (statusCode === 200 || statusCode === 201) {
                debug("Success: User was alerted to a status change in their check via sms: ", msg);
            } else {
                debug("Error: could not send sms to user who had a state change in their check.", resMessage);
            }
        })
    })
};

workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfcheck) => {
    // build log data object
    const logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfcheck
    };

    // convert data to a string
    const logString = JSON.stringify(logData);

    // Determine the name of the log file
    const logFileName = originalCheckData.id;

    _logs.append(logFileName, logString, (err) => {
        if (!err) {
            debug('Logging to file succeeded');
        } else {
            debug('Logging to file failed.');
        }
    }); 
};

// Timer to execute the worker-process onces per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }
    , 1000 * 60)
};

// Rotate ( aka compress) log files
workers.rotateLogs = () => {
    // List all the ( non compressed log files)
       // The boolean for this function gives you the ability to choose whether you want
         // the list of files to include both compressed and unCompressed files
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {
            logs.forEach(logName => {
                
                // compress the data to a differernt file
                const logId = logName.replace('.log', '');
                const newFileId = logId+'-_c_'+Date.now();
                
                _logs.compress(logId, newFileId, (err) => {
                    if (!err){
                        // Truncate the log
                        _logs.truncate(logId, (err) => {
                            if (!err) {
                                debug('Success truncating logFile');
                            } else {
                                debug("Error truncating logFile");
                            }
                        });
                    } else {
                        debug(`Error compressing one of the logFiles: ${err}`);
                    }
                });
            });
        } else {    
            debug("Error: could not find andy logs to rotate");
        }
    });
};

// Timer to execute log-rotation process once a day
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }
    , 1000 * 60 * 60 * 24)// 1000 millsec * 60 secsInAminute * 60 minsInAnHour * 24 HoursInADay
};

// Init scripts
workers.init = () => {
    // Send to console, in yellow
    console.log('\x1b[33m%s\x1b[0m','Background workers are running')
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // call loop so the checks will execute later on
    workers.loop();

    // Compress all the logs immediately.
    workers.rotateLogs();

    // // Call the compression loop so logs will be compressed later on.
    workers.logRotationLoop();
};




// Export the module
module.exports = workers;