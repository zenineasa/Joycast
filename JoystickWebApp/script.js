/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

// Ensuring full-screen mode
document.body.onclick = () => {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
};

// Extract the security key from the URL
const urlSplits = window.location.href.split('/');
const securityKey = urlSplits.pop();
const baseURL = urlSplits.join('/');

// Store touch event ID and corresponding button ID
const touchEventIDVsButtonID = {};

function processKeyEvent(touchID, buttonID, startMoveOrEnd) {
    if (startMoveOrEnd === 'end') {
        sendKeyEvent(touchEventIDVsButtonID[touchID], 'end');
        delete(touchEventIDVsButtonID[touchID]);
    } else if (startMoveOrEnd === 'start') {
        sendKeyEvent(buttonID, 'start');
        touchEventIDVsButtonID[touchID] = buttonID;
        window.navigator.vibrate(100); // Haptic feedback
    } else { // 'move' event
        if (touchEventIDVsButtonID[touchID] !== buttonID) {
            sendKeyEvent(touchEventIDVsButtonID[touchID], 'end');
            sendKeyEvent(buttonID, 'start');
            touchEventIDVsButtonID[touchID] = buttonID;
            window.navigator.vibrate(100); // Haptic feedback
        }
    }
}

// Function to send joystick key press events to the backend
function sendKeyEvent(buttonID, startOrEnd) {
    if (buttonID === ' ') {
        return;
    }
    const data = {
        buttonID: buttonID,
        startOrEnd: startOrEnd
    };
    fetch(`${baseURL}/keyEvent/${securityKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Reponse:', data);
            if (data === false) {
                window.alert('Invalid security code');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// To prevent accidentally invoking refresh
document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1 || event.scale && event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchstart', function (event) {
    event.preventDefault();
    for (let touch of event.touches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target.classList.contains('button')) {
            target.classList.add('active');
            processKeyEvent(touch.identifier, target.id, 'start');
        }
    }
});
document.addEventListener('touchmove', function (event) {
    event.preventDefault();
    for (let touch of event.touches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target.classList.contains('button')) {
            target.classList.add('active');
            processKeyEvent(touch.identifier, target.id, 'move');
        }
    }
});
document.addEventListener('touchend', function (event) {
    for (let touch of event.changedTouches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target.classList.contains('button')) {
            target.classList.remove('active');
            //processKeyEvent(touch.identifier, target.id, 'end');
        }
        processKeyEvent(touch.identifier, '', 'end');
    }
});
