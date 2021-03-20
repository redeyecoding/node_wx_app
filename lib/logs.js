/*
Library for storing and rotating logs.
*/

// Dependecies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../lib/.logs/');



// Append a string to a file. Create the file if it does not exist
lib.append = (file, str, callback) => {
    // OPen file for appending
    fs.open(lib.baseDir+file+'.log','a', (err, fileDescriptor) => {
        if (!err && fileDescriptor){
            // Append to the file and close it
            fs.appendFile(fileDescriptor, str+'\n', (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing file that was being appended');
                        }
                    });
                } else {
                    callback('Error appending file');
                }
            });
        } else {
            callback('Could not open file for appending.')
        }
    });
}



module.exports = lib