/*
    Library for storing and editng data
*/
const fs = require('fs');
const path = require('path');

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
        callback(err,data);
    }))
});


//////////// UPDATE DATA IN FROM FILE
lib.update = ((dir, file, callback) => {
    // Open the file for writing
    

}));

module.exports = lib;