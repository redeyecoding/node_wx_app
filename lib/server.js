/* Server related tasks */


// Dependencies
const config = require('../config');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const handlers = require('./handlers/handlers');
const helpers = require('./helpers/helpers');
const path = require('path');

// Instantiate the server module object
const server = {};


// // @TODO GET RIDE OF THIS
// helpers.sendTwilioSms('3475782956', 'Hello from jeff\'s api!!', (err) => {
//     console.log('this was the error: -->  ', err);
// });

// Instantiating the HTTP server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});



// Instantiating the HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};


server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});





// ****************************************************************************************************
//                BEGIN --  Logic for handling both HTTP and HTTPS requests
// ****************************************************************************************************


server.unifiedServer = (( req, res) => {
    // Get URL and parse it
    const parseUrl = url.parse(req.url, true)
    // console.log('**[PARSEDURL]**', parseUrl);


    // Get the path
    let path = parseUrl.pathname;
    // console.log('**[PATH]**',path);


    // Remove any trailing slashes in the url EXAMPLE redeyecoding.com/foo  ( "food" is the path! )
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');


    // Get the query string as an object EXAMPLE redeyecoding.com/foo?food=chicken ( { food: chicken } )
    let queryStringObject = parseUrl.query;


    // Get the HTTP Method
    let method = req.method.toLowerCase();


    // Get headers as an object
    let headers = req.headers;

    // ****************************************************************************************************
    //            THE BELOW-- THIS IS HOW WE HANDLE STREAMS IN NODE JS
    // ****************************************************************************************************

    // If there is a payload, get it and place it into a buffer
        // The incomign data will be decoded from binary UNreadable format
        // to Human readable fomart using utf-8 encoding

        // creating a decoder to decode the stream coming inbound to the service
    let decoder = new StringDecoder('utf-8');

        // We're appending the decoded information int our buffer
    let buffer = '';

        // On recievig ne data, we're turning that code into a simple Human readable string
            // by dcoding it using utf-8 and then appending it to the buffer
    req.on('data', data => {
        buffer += decoder.write(data);
    });


        // Once completed we will end it and respond accordingly.
        // the below "req.on" will run regardless if the inbound request has a payload or not.
    req.on('end', () => {
        buffer += decoder.end();

        // Choose which handler this goes to.
        /*
            **** REFER TO COMMENT BELOW (THE ROUTER SECTION ) ON HOW THIS SECTION HANDLES INBOUND REQUESTS*****
        */
        
        // Verify that the route exists
        let choosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // contruct the data object to send to the handler
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method' : method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // route request to handler
        choosenHandler(data, (statusCode, payload) =>{
            // Use the status code called back by the handler or default it to status code of 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload callback by the handler or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};
            // Now we can't send an Object back to the user so we need to convert it to a String
            let payloadString = JSON.stringify(payload);
            
            // Return a Response
                // we need to sent the User some JSON as a response:
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // res.end('Hello World\n');            
            
            // console.log(`**[RETURNING THIS RESPONSE TO USER:]**`, 'STATUSCODE--> ',statusCode, '     PAYLOAD-STRINGIFIED-->', payloadString);
        });

        // // send response
        // res.end('Hello World\n');

        // Log the request path
        // console.log('[PAYLOAD FROM REQ]', typeof(data.payload))

        // console.log('[DATA BEFORE DECODING]', data)
        // console.log('[DATA AFTER DECODING]', buffer)
        // console.log(`**[REQUEST-OBJECT-INTO-SERVER]**`, req);
        // console.log(`Request is recieved on this path: ${trimmedPath} with this method: "${method}"`);
        // console.log(`**[QUERYSTING PARAMS SENT]**`, queryStringObject);
        // console.log(`**[REQUEST HEADERS RECIEVED]**`, headers);
        // console.log(`**[HERE IS YOUR UN-TRIMMED PATH]**`, path);
        // console.log(`**[HERE IS YOUR TRIMMED PATH]**`, trimmedPath);
        // console.log(`**[CURRENT INFO IN BUFFER]**`, buffer);

    });
 // ****************************************************************************************************
     //            THE ABOVE-- THIS IS HOW WE HANDLE STREAMS IN NODE JS
// ****************************************************************************************************
});


// ****************************************************************************************************
//                BEGIN --  Logic for handling both HTTP and HTTPS requests
// ****************************************************************************************************




 // ****************************************************************************************************
     //            THE BELOW-- THIS IS HOW WE SETUP ROUTES AND HANDLERS FOR INBOUND REQUESTS
// ****************************************************************************************************


/*
     Note: everything we parsed in the code above will be in the data
            we hand over to our handlers below.

*/




// Define a request router

        /*
            BASICALLY WHAT WILL HAPPEN IS THIS:... IF THE USR
                SENDS IN A REQUEST WITH <URL>/foo, THEN NODE WILL LOOK FOR THIS 
                PATH WITHIN THE ROUTER **BELOW** TO DETERMINE IF THAT ROUTE ACTUALLY 
                EXISTS....IF IT DOESN'T THE DEFAULT "NOT-FOUND" HANDLER WILL BE INVOKED
                
        */
server.router = {
    'users': handlers.users,
    'ping': handlers.ping,
    'token': handlers.token,
    'checks': handlers.checks
};

server.init = () => {
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, () => {
        console.log(`Server is listening on HTTP port ${config.httpPort} in "${config.envName.toUpperCase()}" mode`);
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log(`Server is listening on HTTPS port ${config.httpsPort} in "${config.envName.toUpperCase()}" mode`);
    });    
};

// Export server
module.exports = server;


 // ****************************************************************************************************
     //            THE ABOVE-- THIS IS HOW WE SETUP ROUTES AND HANDLERS FOR INBOUND REQUESTS
// ****************************************************************************************************
