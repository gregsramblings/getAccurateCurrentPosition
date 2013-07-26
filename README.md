getAccurateCurrentPosition
==========================
<a href="https://github.com/gwilson/getAccurateCurrentPosition" target="_blank"><strong>getAccurateCurrentPosition()</strong></a> is a simple enhancement to <a href="http://dev.w3.org/geo/api/spec-source.html" target="_blank">navigator.geolocation</a> that provides a more accurate and predictable result.  It is intended for any geolocation-enabled web browser. This is also usable in PhoneGap applications since PhoneGap uses the underlying HTML geolocation APIs already. I have tested this on desktop Chrome, Safari, Firefox and on iOS and Android devices. I have not tested on IE9+ or Opera or Windows devices.
<h3>Background:</h3>
<a href="http://dev.w3.org/geo/api/spec-source.html" target="_blank">navigator.geolocation</a> provides the method <strong>geolocation.getCurrentPosition()</strong> that will return the current location of the device.  This seems easy enough so most developers simply call this method when they need the location. One of the options for this method is "enableHighAccuracy", which obviously implies that you need an accurate location. However, I soon discovered that if the device's GPS has not been used recently in the current location, it will take a while for it to acquire a decent location. The getCurrentPosition() success callback will trigger before the phone's GPS hardware can provide anything accurate. In other words, you get a quick response, but not necessarily an accurate response.

In my own testing with an iPhone 4s and an HTC Inspire, when I would check getCurrentPosition() on the device, I would sometimes get an accuracy of over 1000 meters. Basically, the first location to be acquired is what is passed to the callback. What if you need more accuracy? You can re-call getCurrentPosition() and likely better accuracy because the GPS has had more time to acquire satellites, but how many times will you need to call it?

A better way to do this is to use <strong>navigator.geolocation.watchPosition()</strong>. This method will do a callback every time the location changes or every time the device improves the accuracy (based on my observations). In my own testing with a freshly booted device, it will take between 2 and 6 callbacks to get to something highly accurate.  This led me to write this very simple JavaScript function that uses watchPosition() in combination with a simple timer.

The option parameters are identical to getCurrentPosition() with the following additions:
<ul>
   <li><strong>desiredAccuracy</strong>: The accuracy in meters that you consider "good enough". Once a location is found that meets this criterion, your callback will be called.</li>
   <li><strong>maxWait</strong>: How long you are willing to wait (in milliseconds) for your desired accuracy. Once the function runs for maxWait milliseconds, it will stop trying and return the last location it was able to acquire. NOTE: If the desired accuracy is not achieved before the timeout, the onSuccess is still called. You will need to check the accuracy to confirm that you got what you expected. I did this because it's a "desired" accuracy, not a "required" accuracy. You can of course change this easily.</li>
</ul>
The following params also exist for getCurrentPosition() but are set for you in getAccurateCurrentPosition():
<ul>
   <li><strong>timeout</strong>: If no timeout is specified, it will be set to the maxWait value</li>
   <li><strong>enableHighAccuracy</strong>: This is forced to true (otherwise, why are you using this function?!)</li>
   <li><strong>maximumAge</strong>: This is forced to zero since we only want current location information</li>
</ul>

<h3>Sample usage:</h3>
<code>navigator.geolocation.getAccurateCurrentPosition(onSuccess, onError, onProgress, 
                                                        {desiredAccuracy:20, maxWait:15000});</code>

Translating the above options into english -- This will attempt to find the device location with an accuracy of at least 20 meters and attempt to achieve this accuracy for 15 seconds

Blogged at <a target="_blank" href="http://gregsramblings.com/2012/06/30/improving-geolocation-getcurrentposition-with-getaccuratecurrentposition/">http://gregsramblings.com/2012/06/30/improving-geolocation-getcurrentposition-with-getaccuratecurrentposition/</a>
