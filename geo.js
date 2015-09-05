navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var bestCheckedPosition,
        locationEventCount = 0,
        watchID,
        timerID;

    options = options || {};

    var checkLocation = function (position) {
        geoprogress(position);
        if (!bestCheckedPosition || position.coords.accuracy <= bestCheckedPosition.coords.accuracy) {
          bestCheckedPosition = position;
        }
        locationEventCount = locationEventCount + 1;

        if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > options.countMin)) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            foundPosition(position);
        }
    };

    var stopTrying = function () {
        navigator.geolocation.clearWatch(watchID);
        foundPosition(bestCheckedPosition);
    };

    var onError = function (error) {
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    };

    var foundPosition = function (position) {
        geolocationSuccess(position);
    };

    if (isNaN(options.maxWait))          options.maxWait = 10000; // Default 10 seconds
    if (isNaN(options.desiredAccuracy))  options.desiredAccuracy = 20; // Default 20 meters
    if (isNaN(options.timeout))          options.timeout = options.maxWait; // Default to maxWait
    if (isNaN(options.maximumAge))       options.maximumAge = 0; // Default current locations only
    if (isNaN(options.countMin))         options.countMin = 1; // Default ignore first event because some devices send a cached
                                                           // location even when maxaimumAge is set to zero
    
    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)

    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
};
