// Theres are the request handlers

// Dependencies



// Setting up handlers
let handlers = {};


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
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
});

// Container for the users submethods
handlers._users = {
    'get': handlers._users.get,
    'post': handlers._users.post,
    'put': handlers._users.put,
    'delete': handlers._users.delete
};

// User -- get
handlers._users.get = (( data, callback) => {

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
    
    const tosAgreement = typeof(data.payload.tosAgreement) === Boolean && 
                                data.payload.tosAgreement.trim().length  === true ? 
                                true : false;

    if (firstName && lastName && phone &&  password && tosAgreement) {
        // Make sure user doesn't already exist

    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
    
});

// User -- put
handlers._users.put = (( data, callback) => {

});

// User -- delete
handlers._users.delete = (( data, callback) => {

});

module.exports = handlers;