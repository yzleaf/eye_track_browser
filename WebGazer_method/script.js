window.saveDataAcrossSessions = true

var positionX = document.getElementById('positionX')
var positionY = document.getElementById('positionY')


const LOOK_DELAY = 3000 // 3 second

// set the left and right area as limit area, beyond this area will be reported
const LEFT_CUTOFF = window.innerWidth / 8
const RIGHT_CUTOFF = window.innerWidth - window.innerWidth / 8

// set the up and down area as limit area, beyond this area will be reported
const UP_CUTOFF = window.innerHeight / 8
const DOWN_CUTOFF = window.innerHeight - window.innerHeight / 8

let startLookTime = Number.POSITIVE_INFINITY
let lookDirection = null
let flag = null

webgazer
    .setGazeListener((data, timestamp) => {
      
        if (data == null || lookDirection === "STOP") return

        // console.log(data, timestamp)
        positionX.innerHTML = "Position: X: " + data.x
        positionY.innerHTML = "Position: Y: " + data.y

        // direction limit area
        // when we first detect the gaze point out the area, record time and direction
        if (data.x < LEFT_CUTOFF &&
            lookDirection !== "LEFT" &&
            lookDirection !== "RESET" )
        {
            startLookTime = timestamp
            lookDirection = "LEFT"
            flag = "L" // used to show the direction when alert
        } else if (data.x > RIGHT_CUTOFF &&
                  lookDirection !== "RIGHT" &&
                  lookDirection !== "RESET")
        {
            startLookTime = timestamp
            lookDirection = "RIGHT"
            flag = "R" // used to show the direction when alert
        } else if (data.y < UP_CUTOFF &&
                  lookDirection != "UP" &&
                  lookDirection != "RESET")
        {
            startLookTime = timestamp
            lookDirection = "UP"
            flag = "U" // used to show the direction when alert
        } else if (data.y > DOWN_CUTOFF &&
                  lookDirection != "DOWN" &&
                  lookDirection != "RESET")
        {
            startLookTime = timestamp
            lookDirection = "DOWN"
            flag = "D" // used to show the direction when alert
        } else if (data.x >= LEFT_CUTOFF &&
                   data.x <= RIGHT_CUTOFF &&
                   data.y >= UP_CUTOFF &&
                   data.y <= DOWN_CUTOFF)
        {
            startLookTime = Number.POSITIVE_INFINITY
            lookDirection = null
        }

        // time last period
        if (startLookTime + LOOK_DELAY < timestamp) {
            startLookTime = Number.POSITIVE_INFINITY
            lookDirection = "STOP"
            setTimeout(() => {
                alert("Pay attention to your eyes！ " + flag);
                lookDirection = "RESET" // avoid conflict with the previous operation
            }, 200)
        }
    })
    .begin()

// this command is to hide the video and pupil gaze point
// webgazer.showVideoPreview(false).showPredictionPoints(false)