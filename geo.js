/* by Greg Wilson June 2012 - http://gregsramblings.com */
navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, options)
{
    var lastCheckedPosition;

    var checkLocation = function (position) {
        lastCheckedPosition = position;
        if (position.coords.accuracy <= options.desiredAccuracy) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            foundPosition(position);
        }
    }

    var stopTrying = function () {
        navigator.geolocation.clearWatch(watchID);
        foundPosition(lastCheckedPosition);
    }

    var onError = function (error) {
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    }

    var foundPosition = function(position) {
        geolocationSuccess(position);
    }

    if(!options.maxWait)            options.maxWait = 10000; // Default 10 seconds
    if(!options.desiredAccuracy)    options.desiredAccuracy = 20; // Default 20 meters
    if(!options.timeout)            options.timeout = 10000; // Default to maxWait

    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)

    var watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    var timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
}
