getAccurateCurrentPosition
==========================
<a href="https://github.com/gwilson/getAccurateCurrentPosition" target="_blank"><strong>getAccurateCurrentPosition()</strong></a> is a simple enhancement to <a href="http://dev.w3.org/geo/api/spec-source.html" target="_blank">navigator.geolocation</a> that provides a more accurate and predictable result.  It is intended for any geolocation-enabled web browser. This is also usable in PhoneGap applications since PhoneGap uses the underlying HTML geolocation APIs already. I have tested this on desktop Chrome, Safari, Firefox and on iOS and Android devices. I have not tested on IE9+ or Opera or Windows devices.
<h3>Background:</h3>
<a href="http://dev.w3.org/geo/api/spec-source.html" target="_blank">navigator.geolocation</a> provides the method <strong>geolocation.getCurrentPosition()</strong> that will return the current location of the device.  This seems easy enough so most developers simply call this method when they need the location. One of the options for this method is "enableHighAccuracy", which obviously implies that you need an accurate location. However, I soon discovered that if the device's GPS has not been used recently in the current location, it will take a while for it to acquire a decent location. The getCurrentPosition() success callback will trigger before the phone's GPS hardware can provide anything accurate. In other words, you get a quick response, but not necessarily an accurate response.

In my own testing with an iPhone 4s and an HTC Inspire, when I would check getCurrentPosition() on the device, I would sometimes get an accuracy of over 1000 meters. Basically, the first location to be acquired is what is passed to the callback. What if you need more accuracy? You can re-call getCurrentPosition() and likely better accuracy because the GPS has had more time to acquire satellites, but how many times will you need to call it?

A better way to do this is to use <strong>navigator.geolocation.watchPosition()</strong>. This method will do a callback every time the location changes or every time the device improves the accuracy (based on my observations). In my own testing with a freshly booted device, it will take between 2 and 6 callbacks to get to something highly accurate.  This led me to write this very simple JavaScript function that uses watchPosition() in combination with a simple timer.

<h3>Options:</h3>
The option parameters are identical to getCurrentPosition() with the following additions:
<ul>
   <li><strong>desiredAccuracy=20</strong>: The accuracy in meters that you consider "good enough". Once a location is found that meets this criterion, your callback will be called.</li>
   <li><strong>maxWait=10000</strong>: How long you are willing to wait (in milliseconds) for your desired accuracy. Once the function runs for maxWait milliseconds, it will stop trying and return the best location it was able to acquire. NOTE: If the desired accuracy is not achieved before the timeout, the onSuccess is still called. You will need to check the accuracy to confirm that you got what you expected. I did this because it's a "desired" accuracy, not a "required" accuracy. You can of course change this easily.</li>
   <li><strong>countMin=2</strong>: First event may be cached (even on maximumAge=0).
   <li><strong>desiredAccuracyCountMin=1</strong>: You may wait and allow for more (accurate) positions. MaxWait is unaffected by this.
   <li><strong>enableLowAccuracy=false</strong>: Simultaneously a low accuracy result is searched (seems to be ignored on Chrome 43).  
</ul>
The following params also exist for getCurrentPosition() but are set for you in getAccurateCurrentPosition():
<ul>
   <li><strong>timeout</strong>: Is set to maxWait value. It is not recommended to change this value.</li>
   <li><strong>enableHighAccuracy=true</strong>: This is forced to true (otherwise, why are you using this function?!)</li>
   <li><strong>maximumAge=0</strong>: You may allow a cached position (as a starter).</li>
</ul>

<h3>Callbacks:</h3>
<ul>
   <li><strong>onProgress(Position)</strong>: Standard geolocation <a href="https://developer.mozilla.org/en-US/docs/Web/API/Position">Position</a>
   <li><strong>onError(PositionError)</strong>: Standard geolocation  <a href="https://developer.mozilla.org/en-US/docs/Web/API/PositionError">PositionError</a>
   <li><strong>onSuccess(Position, resultString)</strong>: resultString is 'success' if desired accuracy is met or 'timeout'
</ul>


<h3>Sample usage:</h3>
<code>navigator.geolocation.getAccurateCurrentPosition(onSuccess, onError, onProgress, 
                                                        {desiredAccuracy:20, maxWait:15000});</code>

Translating the above options into english -- This will attempt for 15 seconds to find the device location and will return as soon the accuracy is at least 20 meters. Otherwise the best result found is returned.


<h3>Recommendation:</h3>
You should call this function inititally with <code>{maxWait:120000}</code> in the background, so a fix can be aquired.
Thus, subsequent calls are much quicker. For example <code>{desiredAccuracy:20, desiredAccuracyCountMin:5, maxWait:20000, enableLowAccuracyOnTimeout:true}</code> to allow for the best location out of 5 with an accuracy of at least 20m, if this is possible in the 20s given. If there is no gps position, it will return the best it has.

Blogged at <a target="_blank" href="http://gregsramblings.com/2012/06/30/improving-geolocation-getcurrentposition-with-getaccuratecurrentposition/">http://gregsramblings.com/2012/06/30/improving-geolocation-getcurrentposition-with-getaccuratecurrentposition/</a>
