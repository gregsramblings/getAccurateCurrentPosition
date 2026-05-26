navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var lastCheckedPosition,
        locationEventCount = 0,
        watchID,
        timerID;

    options = options || {};

    var done = false;

    var checkLocation = function (position) {
        if (done) return;
        lastCheckedPosition = position;
        locationEventCount = locationEventCount + 1;
        // We ignore the first event unless it's the only one received because some devices seem to send a cached
        // location even when maximumAge is set to zero
        if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > 1)) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            foundPosition(position);
        } else if (geoprogress) {
            geoprogress(position);
        }
    };

    var stopTrying = function () {
        if (done) return;
        navigator.geolocation.clearWatch(watchID);
        if (lastCheckedPosition) {
            foundPosition(lastCheckedPosition);
        } else {
            geolocationError({ code: 3, message: "Timeout expired before any position was acquired." });
        }
    };

    var onError = function (error) {
        if (done) return;
        done = true;
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    };

    var foundPosition = function (position) {
        if (done) return;
        done = true;
        geolocationSuccess(position);
    };

    if (options.maxWait == null)         options.maxWait = 10000; // Default 10 seconds
    if (options.desiredAccuracy == null) options.desiredAccuracy = 20; // Default 20 meters
    if (options.timeout == null)         options.timeout = options.maxWait; // Default to maxWait

    options.maximumAge = 0; // Force current locations only
    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)

    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
};
