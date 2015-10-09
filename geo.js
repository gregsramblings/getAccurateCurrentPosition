/*navigator.geolocation.test = 100;
var global_geo_int = setInterval(function(){
  if (!navigator.geolocation || !navigator.geolocation.test){
    clearInterval(global_geo_int);
    return console.log('geo_stopped');
  }
  console.log(navigator.geolocation.test--);
},10);
console.log(navigator.geolocation.test);
*/
setTimeout(function(){  //navigator.geolocation is OVERWRITTEN on startup. So we load and use it with timeout
console.log('extending navigator.geolocation with getAccurateCurrentPosition');
navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var bestCheckedPosition,
        locationEventCount = 0,
        desiredAccuracyCount = 0,
        watchID,watchID_low,
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
            geolocationSuccess(bestCheckedPosition, 'success');
        }
    };

    var stopTrying = function () {
        navigator.geolocation.clearWatch(watchID);
        navigator.geolocation.clearWatch(watchID_low);
        if (bestCheckedPosition) geolocationSuccess(bestCheckedPosition, 'timeout');
        else geolocationError({code:3, message:'Timeout after trying for '+options.maxWait+' ms!'}); //sniff
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
                                                           
    if (options.enableLowAccuracy) watchID_low = navigator.geolocation.getCurrentPosition(checkLocation, function(e){console.log('getAccuratePostition LowAccuracy Error',e.code);}, options);
       //Optionally start a low Accuracy reading. I expected to find an early result as fallback, if no better results are found
       //however this the enableHighAccuracy flag seems to be bluntly ignored on Chrome 43 and others
       // see http://stackoverflow.com/questions/17804469/html5-geolocation-ignores-enablehighaccuracy-option/32521789
    
    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)
    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
};
},200); //it is overwritten around 10-20ms after load. So 200 ms should be enough?