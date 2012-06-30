getAccurateCurrentPosition
==========================

Simple function to complements <a target="_blank" href="http://dev.w3.org/geo/api/spec-source.html">navigator.geolocation</a> - spends more time fine tuning the location before replying

navigator.geolocation provides the method <b>geolocation.getCurrentPosition()</b> that will return the current location of the device.  
This seems easy enough so most developers simply call this method when they need the location.  One of the options for this
method is "enableHighAccuracy" which obviously implies that we are needing an accurate location.  However, I soon
discovered that if the device's GPS has not been used recently in the current location, it will take a while for it to acquire
a decent location.  The getCurrentPosition() success callback will trigger before the phone's GPS hardware can provide
anything accurate.  In other words, we get a quick response, but not necessarily an accurate response.

In my own testing with an iPhone 4s and an HTC Inspire, when I would check getCurrentPosition() on the device, I would sometimes
get an accuracy of over 1000 meters.  Basically, the first location to be acquired is what is passed to the callback.  What if you 
need more accuracy?  You can re-call getCurrentPosition() and likely better accuracy because the GPS has had more time to acquire 
satellites, but how many times will you need to call it?

A better way to do this is to use navigator.geolocation.watchPosition().  This method will do a callback every time it improves
the accuracy.  In my own testing with a freshly booted device, it will take between 2 and 6 callbacks to get to something highly accurate.
This led me to write this very simple JavaScript function.

The option parameters are identical to getCurrentPosition() with the following additions:

- <b>desiredAccuracy</b>: The accuracy in meters that you consider "good enough". Once a location is found that meets this criteria, your callback will be called.
- <b>maxWait</b>: How long you are willing to wait (in milliseconds) for your desired accuracy.  Once the function runs for
maxWait milliseconds, it will stop trying and return the last location it was able to acquire. NOTE: If the desired accuracy is not achived before
the timeout, the onSuccess is still called.  You will need to check the accuracy to confirm that you got what you expected.  I did this because it's a 
"desired" accuracy, not a "required" accuracy.  You can of course change this easily.

The following params also exist for getCurrentPosition() but are set for you in getAccurateCurrentPosition():
- <b>NOTE: timeout</b>: If not timeout is specified, it will be set to the maxWait value
- <b>NOTE: enableHighAccuracy</b>: This is forced to true (otherwise, why are you using this function?!)


Sample usage:  
<pre>
navigator.geolocation.getAccurateCurrentPosition(onSuccess, onError, {maximumAge:10000, desiredAccuracy:20, maxWait:15000});
</pre>

Translating the above options into english -- This will attempt to find the device location with an accuracy of at least 20 meters (ignoring any location that was cached by the device more than 10 seconds ago) and it will work for 15 seconds to achieve this accuracy. 


