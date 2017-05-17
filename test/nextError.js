module.exports = function(callback){
    var handle = function(){
        process.removeListener('uncaughtException', handle);
        process.removeListener('unhandledRejection', handle);
        callback();
    };

    process.on('uncaughtException', handle);
    process.on('unhandledRejection', handle);
};