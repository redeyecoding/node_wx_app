// Theres are the request handlers

// Dependencies
const _data = require('../data');
const helpers = require('../helpers/helpers');

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

// Container for the users submethods
handlers._users = {};



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
// @TODO Only let an authenticated user access THEIR data, no one elses
handlers._users.get = (( data, callback) => {
    // check for valid number
    const userPhoneNumber = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? 
            data.queryStringObject.phone.trim() :
            false;
    if (userPhoneNumber) {
        // Look up the user
        _data.read('user', phone, ((err, data) => {
            if (!err && data) {
                // Remove the hash password from the user object before returning it to the requestr
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        }))
    } else {
        callback(400, { 'Error' : 'Missing required field' });
    }
});

// User -- put ( update)
// required data: phone
// optional: firstname , lastname, password ( at least one most be specified 
// @TODO only let authenticated users update their own ..no one elses )
handlers._users.put = (( data, callback) => {
    console.log(data.payload)
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
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            // Look up users
            _data.read('users', userPhoneNumber, (( err, userData) => {
                if( !err && userData ) {
                    // Update the fields
                    if ( firstName ) {
                        userData.firstName = firstName;
                    }
                    if ( lastName ) {
                        userData.firstName = lastName;
                    }
                    if ( password ) {
                        userData.hashedPassword =  helpers.hash(password);
                    }

                    // Store the new updates
                    _data.update('users', data.payload.phone, userData, (err => {
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
        callback(400, { 'Error': 'Missing required field'});
    }

});

// User -- delete
handlers._users.delete = (( data, callback) => {
    const userPhoneNumber = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    if (userPhoneNumber) {
        // Check if number is valid
        _data.read('users', userPhoneNumber, ((err, data) => {
            if (!err && data) {
                // Remove the hash password from the user object before returning it to the requestr
                _data.delete('users', userPhoneNumber, (err => {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Server error, could not completed delete request' });
                    }
                }))
                callback(200, data);
            } else {
                callback(400,  { 'Error': 'Could not find the specified user' });
            }
        }))
    } else {
        callback(400,{ 'Error' : 'Missing required field' });
    }

});

module.exports = handlers;