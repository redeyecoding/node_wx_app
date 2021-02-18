// Theres are the request handlers

// Dependencies
const _data = require('../data');
const helpers = require('../helpers/helpers');
const config = require('../../config')

// Setting up handlers
const handlers = {};


// Not FOUND Handler (404)
handlers.notFound = (( data, callback) => {
    callback(404);    
});


// Verify server is alive
handlers.ping = (( data, callback) => {
    callback(200, { "alive": true });    
});



// Container for the users submethods
handlers._users = {};


// Users
    // Figure out which method the user is requesting, verify
    //that it is an acceptable method only to then
    // pass it along to other subHandlers
handlers.users = ((data, callback) => {
    const acceptableMethods = ['get','put','delete', 'post'];
    
    // check for valid method
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
});



// User -- post
// Required data: firstname, lastname, phone, password, tosAgreement
handlers._users.post = (( data, callback) => {

    const firstName = typeof(data.payload.firstName) === 'string' && 
                             data.payload.firstName.trim().length > 0 ? 
                             data.payload.firstName.trim() : false;
    
    const lastName = typeof(data.payload.lastName) === 'string' && 
                            data.payload.lastName.trim().length > 0 ? 
                            data.payload.lastName.trim() : false;
    
    const phone = typeof(data.payload.phone) === 'string' && 
                         data.payload.phone.trim().length  === 10 ? 
                         data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) === 'string' && 
                            data.payload.password.trim().length  > 0 ? 
                            data.payload.password.trim() : false;
    
    const tosAgreement = data.payload.tosAgreement ? true : false;

         // Validate user Registration                           
    if (firstName && lastName && phone &&  password && tosAgreement) {

        _data.read('users', phone, ((err, data) => {
           // Make sure user doesn't already exist
            if (err) {
                // Hash the password
                const hashPassword = helpers.hash(password);
                // Check for hash
                if (hashPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashPassword': hashPassword,
                        'tosAgreement': true
                    }
    
                    // Store the users information 
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Sorry, could not create new user' });
                        }
                    })
                } else {
                    callback(500, { 'Error': 'Could not hash user password' });
                }

            } else {
                // User already exists
                callback(400, { 'Error': 'User with that phone already exists.' })
            }
        }));
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
    
});



// User -- get
// Required data: phone
// Optional data: None
// @ACCESS private
handlers._users.get = (( data, callback ) => {
    // check for valid number
    const userPhoneNumber = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? 
            data.queryStringObject.phone.trim() :
            false;

    if (userPhoneNumber) {
        // Get the token from the headers
        const token = typeof(data.headers.token) === 'string' ?
        data.headers.token :
        false;

        // Verify that the given token is valid for the phone number
        handlers._token.validateToken(token, userPhoneNumber, (tokenIsValid) => {            
            if (tokenIsValid){                
                // Look up the user
                _data.read('users', userPhoneNumber, ((err, data) => {
                    if (!err && data) {
                        // Remove the hash password from the user object before returning it to the requestr
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                }));
            } else {
                callback(403, { 'Error': 'Missing required token in header or token is invalid.' });
            }
        });
    } else {
        callback(400, { 'Error' : 'Missing required field' });
    }
});



// User -- put ( update)
// required data: phone
// optional: firstname , lastname, password ( at least one most be specified 
// @Acess Private
handlers._users.put = (( data, callback) => {

    // check for the required field
    const userPhoneNumber = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    
    // check for valid fields
    const firstName = typeof(data.payload.firstName) === 'string' && 
        data.payload.firstName.trim().length > 0 ? 
        data.payload.firstName.trim() : false;

    const lastName = typeof(data.payload.lastName) === 'string' && 
        data.payload.lastName.trim().length > 0 ? 
        data.payload.lastName.trim() : false;

    const password = typeof(data.payload.password) === 'string' && 
        data.payload.password.trim().length  > 0 ? 
        data.payload.password.trim() : false;

        // Error if the phone number is invalid
    if (userPhoneNumber) {
        // Get the token from the
        const token = typeof(data.headers.token.trim()) === 'string' && data.headers.token.trim().length === helpers.tokenStringRound ?
        data.headers.token :
        false;
   
        // Verify that the given token is valid for the phone number
        handlers._token.validateToken(token, userPhoneNumber, (tokenIsValid) => {
            if (tokenIsValid) {               
                   // Error if nothing is sent to update
                if (firstName || lastName || password) {

                    // Look up users
                    _data.read('users', userPhoneNumber, (( err, userData ) => {
                        if( !err && userData ) {
                            // Update the fields
                            if ( firstName ) {                                
                                userData.firstName = firstName;
                            }                        

                            if ( lastName ) {
                                userData.lastName = lastName;
                            }
                            if ( password ) {
                                userData.hashedPassword =  helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', userPhoneNumber, userData, (err => {
                                if(!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500,{ 'Error': 'Server Error, Could not update provided fields. '});
                                }
                            }));

                        } else {
                            callback(400, { 'Error': 'The specified user does not exist' });
                        }
                    }));
                } else {
                    callback(400, { 'Error': 'Missing fields to update' });
                }
            } else {
                callback(403, { 'Error': 'Missing required token in header or token is invalid' });
            }
                });
    } else {
        callback(400, { 'Error': 'Missing required field'});
    }
});

// Required data : phone
// User -- delete
handlers._users.delete = (( data, callback) => {
    const userPhoneNumber = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
   
    if (userPhoneNumber) {
        // Get the token from the headers
        const token = typeof(data.headers.token.trim()) === 'string' && data.headers.token.trim().length === helpers.tokenStringRound ?
        data.headers.token :
        false;

        // Verify that the given token is valid for the phone number
        handlers._token.validateToken(token, userPhoneNumber, (tokenIsValid) => {
            if (tokenIsValid){
                // Look up the user
                _data.read('users', userPhoneNumber, ((err, userData) => {
                    if (!err && data) {
                        // Delete user
                        _data.delete('users', userPhoneNumber, (response => {

                            // Delete each of the checks associated with the user
                            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                            let checksToDelete = userChecks.length;

                            if (checksToDelete > 0) {
                                let checksDeleted = 0;
                                let deletionErrors = false;

                                // Loop throurh the checks
                                userChecks.forEach(checkId => {
                                    //Delete the check
                                    _data.delete('checks', checkId, response => {
                                        if (response === null) {
                                            deletionErrors = true;
                                        }
                                        checksToDelete++;

                                        if (checksDeleted === checksToDelete) {
                                            if (!deletionErrors) {
                                                callback(200)
                                            } else {
                                                callback(500, { 'Error': 'Errors encountered while attempting to delete the user\'s check -- All checks may have not been deleted from the system succesfully.' });
                                            }
                                        }
                                    });
                                });
                            } else {
                                callback(200);
                            }
                            if(response === null) {
                                callback(500, { 'Error': 'Server error, could not completed delete request' });
                                
                            } else {
                                callback(200);
                            }
                        }))
                    } else {
                        callback(400,  { 'Error': 'Could not find the specified user' });
                    }
                }));
            } else {
                callback(403, { 'Error': 'Missing required token in header or token is invalid' });
            }
        });

    } else {
        callback(400,{ 'Error' : 'Missing required field' });
    }
});



// token Handlers
handlers.tokens = (( data, callback ) => {

});

// Below is code for protected routes

// Container for the users submethods
handlers._token = {};


// Validate That a token belongs to an actual user
handlers._token.validateToken = (( userId, phone, callback ) => {
    // Look up the userId
    _data.read('tokens', userId, (err, userData) => {        
        if (!err && userData) {            
                // Check that the token is valid
            if (userData.phone === phone && userData.expires > Date.now()){                
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
});


handlers.token = ((data, callback) => {
    const acceptableMethods = ['get','put','delete', 'post'];    
    // check for valid method
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._token[data.method](data,callback);
    } else {
        callback(405);
    }
});



// Tokens - post
// Required data: phone ,password
// optional data: none
handlers._token.post = ((data, callback) => {
    const phone = typeof(data.payload.phone) === 'string' && 
        data.payload.phone.trim().length  === 10 ? 
        data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) === 'string' && 
        data.payload.password.trim().length  > 0 ? 
        data.payload.password.trim() : false;
       
    if (phone && password) {
        // Look up the user who matches phone number
        _data.read('users', phone, ((err, userData) => {
            if (!err && userData) {
                // Hash the sent password anc compare to pwd stored in user object
                const hashPassword = helpers.hash(password);

                if ( hashPassword === userData.hashPassword ) {
                    // Create new token for user if valid
                        // Token expires in 1-hour
                    const tokenId = helpers.createTokenString();

                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone' :phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (err => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create he new token' });
                        }
                    }));
                } else {
                    callback(400, { 'Error': 'Password did not match the specified user\'s stored password'});
                }
            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        }));
    } else {
        callback(400, { 'Error': 'Missing required field(s)' });
    }
});




// Tokens - get
// The required data is just the ID
// optional data is: none
handlers._token.get = ((data, callback) => {
    // check that the Id the user sent is valid
    const userId = typeof(data.queryStringObject.id) === 'string' && 
        data.queryStringObject.id.trim().length  === helpers.tokenStringRound  ? 
        data.queryStringObject.id.trim() : false;

        _data.read('tokens', userId, ((err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        }));
});


// Tokens - put
// Required data: id, extendUserSesion
// optional data : none
handlers._token.put = ((data, callback) => {
    const userID = typeof(data.payload.id) === 'string' && 
        data.payload.id.trim().length  === helpers.tokenStringRound ? 
        data.payload.id.trim() : false;

    const extendUserSession = typeof(data.payload.extendUserSession) === 'boolean' && 
        data.payload.extendUserSession === true ? 
        true : 
        false;

    if (userID && extendUserSession) {        
        // Lookup the token 
        _data.read('tokens', userID,(err, tokenData) => {
            if (!err && tokenData) {
                // Check and make sure the token isn't expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Store the new updates
                    _data.update('tokens', userID, tokenData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, { 'Error': 'Could not update the token\'s expiration' });
                        }
                    })

                } else {
                    callback(400, { 'Error': 'The token has already expired, and cannot be extended' });
                }
            }
        } )
            } else {
                callback(400, {'Error': 'Missing required fild(s) or fields(s) are invalid' })
            }
});

// Tokens - delete
// required data: id
// optional data: none
handlers._token.delete = ((data, callback) => {
    // Check for valid id
    const userID = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === helpers.tokenStringRound ? data.payload.id.trim() : false;
    
    if (userID) {
        // Check if number is valid
        _data.read('tokens', userID, ((err, userData) => {
            if (!err && userData) {
                // Remove the hash password from the user object before returning it to the requestr
                _data.delete('tokens', userID, (response => {
                    if(response === null) {
                        callback(500, { 'Error': 'Server error, could not completed delete request' });
                        
                    } else {
                        callback(200);
                    }
                }));
            } else {
                callback(400,  { 'Error': 'Could not find the specified token' });
            }
        }));
    } else {
        callback(400,{ 'Error' : 'Missing required field' });
    }
});





// Checks
handlers.checks = ((data, callback) => {
    const acceptableMethods = ['get','put','delete', 'post'];    
    // check for valid method
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data,callback);
    } else {
        callback(405);
    }
});


// Container for all the checks methods
handlers._checks = {};

// checks - POST
// Require data: protocol , url , method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = (( data, callback) => {
    // Validate all the inputs
    const validProtocols = ['http', 'https'];
    const methods = ['get','put','delete', 'post'];  
    
    const protocol = typeof(data.payload.protocol) === 'string' && 
        validProtocols.indexOf(data.payload.protocol) > -1 ? 
        data.payload.protocol : false;

    const url = typeof(data.payload.url) === 'string' && 
        data.payload.url.trim().length > 0 ? 
        data.payload.url.trim() : false;

    const method = typeof(data.payload.method) === 'string' && methods.indexOf(data.payload.method) > -1 ?
        data.payload.method :
        false;
    
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? 
        data.payload.successCodes : false;

    const timeOutSeconds = typeof(data.payload.timeOutSeconds) === 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? 
        data.payload.timeOutSeconds :
        false;


    if (protocol && method && url && timeOutSeconds && successCodes) {
        // Only logged in users can run checks
            // Get token from headers
        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, ((err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;

                // Lookup the user data
                _data.read('users', userPhone, ((err, userData) => {
                    if (!err && userData) {
                        // Store 
                        const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Verify that user has less than number of max-checks per user
                        if (userChecks.length < config.maxChecks) {
                            // create a random id for the check
                            const checkId = helpers.createTokenString(helpers.tokenStringRound);

                            // Create the check object , and include the user's phone
                            const checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeOutSeconds': timeOutSeconds
                            };

                            // Save the Object
                            _data.create('checks', checkId, checkObject, (err => {
                                if (!err) {
                                    // Add the check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, (err => {
                                        if (!err) {
                                            // Return the data about the new check
                                            callback(200, checkObject);
                                        }else {
                                            callback(500, { 'Error': 'Could not update the user with the new check' });
                                        }
                                    }))
                                } else {
                                    callback(500,  { 'Error': 'Could not create the new check' });
                                }
                            }))
                        } else {
                            callback(400, { 'Error': 'the user already hs the maxium number of checks ('+config.maxChecks+')' });
                        }
                    } else {
                        callback(403);
                    }
                }))
            }
        }));
    } else {
        callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
    };
});


// checks - get
// Required data: id
// optional data: none
handlers._checks.get = (( data, callback ) => {
    // check for valid id
    const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === helpers.tokenStringRound ? 
            data.queryStringObject.id.trim() :
            false;

    if (id) {
                // Lookup the check
        _data.read('checks', id, ((err, checkData) => {
            if(!err && checkData) {
                  // Get the token from the headers
                const token = typeof(data.headers.token) === 'string' ?
                data.headers.token :
                false;

                // Verify that the given token is valid and belongs
                    // to the user who created the check
                handlers._token.validateToken(token, checkData.userPhone, (tokenIsValid) => {            
                    if (tokenIsValid){                
                        // Return the checkData to the user
                        callback(200, checkData);
                    } else {
                        callback(403, { 'Error': 'Missing required token in header or token is invalid.' });
                    }
                });      
                    } else {
                        callback(404)
                    }
                }));
    } else {
        callback(400, { 'Error' : 'Missing required field' });
    }
});

// Checks - PUY
// Required ata : id
// OPtional data : protocol, url, method, successcode, timeoutSeconds, (one must be set
handlers._checks.put = (( data, callback) => {
    // Validate all the inputs
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === helpers.tokenStringRound ? 
            data.payload.id.trim() :
            false;

         
    const validProtocols = ['http', 'https'];
    const methods = ['get','put','delete', 'post'];  
    
    const protocol = typeof(data.payload.protocol) === 'string' && 
        validProtocols.indexOf(data.payload.protocol) > -1 ? 
        data.payload.protocol : false;

    const url = typeof(data.payload.url) === 'string' && 
        data.payload.url.trim().length > 0 ? 
        data.payload.url.trim() : false;

    const method = typeof(data.payload.method) === 'string' && methods.indexOf(data.payload.method) > -1 ?
        data.payload.method :
        false;
    
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? 
        data.payload.successCodes : false;

    const timeOutSeconds = typeof(data.payload.timeOutSeconds) === 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? 
        data.payload.timeOutSeconds :
        false;

    // check to make sure id is valid
    if (id) {

        // check to make sure one or more optional fields has been sent
        if (protocol || url || successCodes || timeOutSeconds || method) {
            _data.read('checks', id, ((err, checkData) => {
                if (!err && checkData) {
                    //  Get the token from the headers then validate it
                    const token = typeof(data.headers.token) === 'string' ?
                    data.headers.token :
                    false;

                    // Verify that the given token is valid and belongs to the user who created the check
                    handlers._token.validateToken(token, checkData.userPhone, (tokenIsValid) => {            
                        if (tokenIsValid){                
                            // Update the Check
                            checkData.protocol = protocol ? protocol : checkData.protocol;
                            checkData.method = method ? method : checkData.method;
                            checkData.successCodes = successCodes ? successCodes : checkData.successCodes;
                            checkData.url = url ? url : checkData.url;
                            checkData.timeOutSeconds = timeOutSeconds ? timeOutSeconds : checkData.timeOutSeconds;
                        
                        // Store the updates
                        _data.update('checks', id, checkData, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not update the check data' });
                            }
                        })
                        } else {
                            callback(403, { 'Error': 'Missing required token in header or token is invalid.' });
                        }
                    }); 
                } else {
                    callback(403);
                }
           }));
        } else {
            callback(400, { 'Error': 'Check ID did not exist' });
        }
        

    } else {
        callback(400, { 'Error': 'Missing required field(s)' })
    }
});

// Checks -DELETE
// REquired data: id
// Optional data: none
handlers._checks.delete = (( data, callback) => {
    const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === helpers.tokenStringRound ? data.queryStringObject.id.trim() : false;
    
    if (id) {
        // Look up the check
        _data.read('checks', id, ((err, checkData) => {
            if (!err && checkData) {

                //  Get the token from the headers then validate it
                const token = typeof(data.headers.token) === 'string' ?
                    data.headers.token :
                    false;

                // Verify that the given token is valid and belongs to the user who created the check
                handlers._token.validateToken(token, checkData.userPhone, (tokenIsValid) => {            
                    if (tokenIsValid){ 
                        
                        // Delete the check data
                        _data.delete('checks', id, err => {
                            // err will return either null or valid data.
                            if (err) {
                                // Look up the user
                                _data.read('users', checkData.userPhone, ((err, userData) => {
                                    if (!err && userData) {
                                        // Get user checks
                                        const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        
                                        // Removed delete check from their list of checks
                                        const checkPosition = userChecks.indexOf(id);
                                        
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                        
                                            // Re-save user's data
                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'Error': 'Could not update the users data '});
                                                }
                                            });
                                        } else {
                                            callback(500, { 'Error': 'Could not find check on user\'s object -- no checks delete' });
                                        }
                                    } else {
                                        callback(500, { 'Error': 'Could not find the user who created the check -- no checks deleted.' });
                                    }
                                }));         
                            } else {
                                callback(500 , { 'Error': 'Could not delete the check' });
                            }
                        });
                    } else {
                        callback(403, { 'Error': 'Missing required token in header or token is invalid.' });
                    }
                }); 
            } else {
                callback(400, { 'Error': 'The specified check ID does not exist' });
            }
        }));
    } else {
        callback(400,{ 'Error' : 'Missing required field' });
    }
});

module.exports = handlers;