/*
    Library for storing and editng data
*/
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers/helpers');

// Container for th module ( to be exported )
const lib = {};
// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');



//////////// WRITE DATA TO FILE
lib.create = (( dir, file, data, callback ) => {
    // Open the file for writing
   
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', ((err, fileDescriptor) => {
        // console.log('[FILE DESCRIPTOR]',fileDescriptor)
        if (!err && fileDescriptor) {
            // Convert inbound data from user to a string
            let stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err){
                    fs.close(fileDescriptor, (err) => {
                        if(!err){
                            callback(false)
                        }else {
                            callback('Error closing new file')
                        }
                    });
                } else {
                    callback('Error writing to new file')
                }
            });
        } else {
            callback('Could not create new file , it may already exist!');
        };
    }));

    // console.log('[CURRENT-DIRECTORY]',__dirname)
    // console.log('[BASE-LIB-DIRECTORY]',lib.baseDir)
});


//////////// READ DATA FROM FILE
lib.read = ((dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', ((err, data) =>{
        if (!err && data) {
            const pasredJSON = helpers.parseJsonToObject(data);
            callback(false, pasredJSON);
        } else {
            callback(err, data);
        }
    }));
});



//////////// UPDATE DATA IN FROM FILE
lib.update = ((dir, file, data, callback) => {
    // Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', ((err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data infile to string
            let stringyfiedData = JSON.stringify(data);

            // Truncate contents of file
            fs.ftruncate(fileDescriptor, (err => {
                if (!err) {
                        // Write to file then close it
                    fs.writeFile(fileDescriptor, stringyfiedData, (err => {
                        if (!err) {
                                // Close the file
                            fs.close(fileDescriptor, (err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing exiting file')
                                }
                            }));
                        } else {
                            callback('Error Writing to exiting file');
                        }
                    }));
                } else {
                    callback('Error truncating file')
                }
            }))
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    }));
});


//////////// DETELE  FILE
lib.delete = (( dir, file, callback) => {
    // Unlinking ( removing file from filesystem)
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
        if (err) callback('Error deleting file. It probably does not exist, yet.');
        callback(`Succesfully deleted file: ${file}.`);
    });
});


// List all the items in a directory
lib.list = (( dir, callback ) => {
    fs.readdir(lib.baseDir+'dir'+'/', (( err, data) => {
        if(!err && data && data.length > 0) {
            const trimmedFileNames = [];
            data.forEach(fileName => {
                trimmedFileNames.push(fileName.replace('.json', ''));
            })
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    }))
});

module.exports = lib;