navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var bestCheckedPosition,
        locationEventCount = 0,
        desiredAccuracyCount = 0,
        watchID,
        timerID;

    options = options || {};

    var checkLocation = function (position) {
        geoprogress(position);
        if (!bestCheckedPosition || position.coords.accuracy <= bestCheckedPosition.coords.accuracy) {
          bestCheckedPosition = position;
        }
        locationEventCount = locationEventCount + 1;

        if ((position.coords.accuracy <= options.desiredAccuracy) && 
            (++desiredAccuracyCount >= options.desiredAccuracyCountMin) &&
            (locationEventCount >= options.countMin)) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            geolocationSuccess(bestCheckedPosition);
        }
    };

    var stopTrying = function () {
        navigator.geolocation.clearWatch(watchID);
        if (bestCheckedPosition) geolocationSuccess(bestCheckedPosition);
        else geolocationError({code:3, message:'Timeout after trying for waitMax ms!'}); //sniff
    };

    var onError = function (error) {
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    };

            
    if (isNaN(options.maxWait))                 options.maxWait = 10000; // Default 10 seconds
    if (isNaN(options.desiredAccuracy))         options.desiredAccuracy = 20; // Default 20 meters
    if (isNaN(options.desiredAccuracyCountMin)) options.desiredAccuracyCountMin = 1; // Default get first position of desiredAccuracy
    
    if (isNaN(options.timeout))      options.timeout = options.maxWait; // Default to maxWait
    if (isNaN(options.maximumAge))   options.maximumAge = 0; // Default current locations only
    if (isNaN(options.countMin))     options.countMin = 2; // Default ignore first event because some devices send a cached
                                                           // location even when maxaimumAge is set to zero    
                                                           
    if (options.enableLowAccuracy) navigator.geolocation.getCurrentPosition(checkLocation, function(){}, options);
       //Optionally start a low Accuracy reading. I expected to find an early result as fallback, if no better results are found
       //however this the enableHighAccuracy flag seems to be bluntly ignored on Chrome 43 and others
       // see http://stackoverflow.com/questions/17804469/html5-geolocation-ignores-enablehighaccuracy-option/32521789
    
    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)
    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
};
