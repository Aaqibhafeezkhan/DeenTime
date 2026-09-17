function setQiblaStatus(message, tone) {
    const status = document.getElementById('qiblaStatus');
    if (!status) return;
    status.textContent = message;
    status.className = tone === 'error'
        ? 'text-center text-sm text-red-600 dark:text-red-400 mt-3'
        : 'text-center text-sm text-gray-500 dark:text-gray-400 mt-3';
}

function stopDeviceCompass() {
    if (window.__deenTimeCompassHandler) {
        window.removeEventListener('deviceorientation', window.__deenTimeCompassHandler, true);
        window.removeEventListener('deviceorientationabsolute', window.__deenTimeCompassHandler, true);
        window.__deenTimeCompassHandler = null;
    }
}

function handleDeviceOrientation(event) {
    let heading = null;

    if (typeof event.webkitCompassHeading === 'number') {
        heading = event.webkitCompassHeading;
    } else if (typeof event.alpha === 'number') {
        heading = 360 - event.alpha;
    }

    if (!Number.isFinite(heading)) {
        setQiblaStatus('Compass data is unavailable on this device.', 'error');
        return;
    }

    const normalizedHeading = (heading + 360) % 360;
    const rotation = (qiblaAngle - normalizedHeading + 360) % 360;
    const compass = document.getElementById('compass');
    const arrow = document.getElementById('qiblaArrow');

    if (compass) compass.style.transform = `rotate(${-normalizedHeading}deg)`;
    if (arrow) arrow.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
    setQiblaStatus('Device compass is active. Hold the phone flat for the best reading.', 'ok');
}

function startDeviceCompass() {
    stopDeviceCompass();

    if (!('DeviceOrientationEvent' in window)) {
        setQiblaStatus('Device orientation is not supported in this browser.', 'error');
        return;
    }

    const requestPermission = DeviceOrientationEvent.requestPermission;
    if (typeof requestPermission === 'function') {
        requestPermission.call(DeviceOrientationEvent)
            .then(permission => {
                if (permission !== 'granted') {
                    setQiblaStatus('Compass permission was not granted. You can still use the fixed Qibla direction.', 'error');
                    return;
                }
                attachCompassListeners();
            })
            .catch(() => {
                setQiblaStatus('Compass permission could not be requested. You can still use the fixed Qibla direction.', 'error');
            });
        return;
    }

    attachCompassListeners();
}

function attachCompassListeners() {
    window.__deenTimeCompassHandler = handleDeviceOrientation;
    window.addEventListener('deviceorientation', window.__deenTimeCompassHandler, true);
    window.addEventListener('deviceorientationabsolute', window.__deenTimeCompassHandler, true);
    setQiblaStatus('Waiting for device orientation data...', 'ok');
}

function enableDeviceCompass() {
    const button = document.getElementById('enableCompass');
    if (button) {
        button.disabled = true;
        button.textContent = 'Starting Device Compass...';
    }

    startDeviceCompass();

    if (button) {
        window.setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Enable Device Compass';
        }, 1000);
    }
}

function setupQiblaCapabilityState() {
    const button = document.getElementById('enableCompass');
    if (!button) return;

    let status = document.getElementById('qiblaStatus');
    if (!status) {
        status = document.createElement('p');
        status.id = 'qiblaStatus';
        button.insertAdjacentElement('afterend', status);
    }

    if (!('DeviceOrientationEvent' in window)) {
        button.disabled = true;
        button.textContent = 'Device Compass Unavailable';
        setQiblaStatus('This browser does not expose device orientation. The fixed Qibla direction remains available.', 'error');
        return;
    }

    setQiblaStatus('Use the fixed direction above, or enable the device compass when orientation access is available.', 'ok');
}

document.addEventListener('DOMContentLoaded', setupQiblaCapabilityState);
