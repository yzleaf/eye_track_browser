window.saveDataAcrossSessions = true

const LOOK_DELAY = 1000 // 1 second

const LEFT_CUTOFF = window.innerWidth / 8
const RIGHT_CUTOFF = window.innerWidth - window.innerWidth / 8

const UP_CUTOFF = window.innerHeight / 8
const DOWN_CUTOFF = window.innerHeight - window.innerHeight / 8

let startLookTime = Number.POSITIVE_INFINITY
let lookDirection = null
let flag = null

webgazer
    .setGazeListener((data, timestamp) => {
        console.log(data, timestamp)
        
        if (data == null || lookDirection === "STOP") return

        if (data.x < LEFT_CUTOFF &&
            lookDirection !== "LEFT" &&
            lookDirection !== "RESET" )
        {
            startLookTime = timestamp
            lookDirection = "LEFT"
            flag = "L"
        } else if (data.x > RIGHT_CUTOFF &&
                  lookDirection !== "RIGHT" &&
                  lookDirection !== "RESET")
        {
            startLookTime = timestamp
            lookDirection = "RIGHT"
            flag = "R"
        }if (data.y < UP_CUTOFF &&
                  lookDirection != "UP" &&
                  lookDirection != "RESET")
        {
            startLookTime = timestamp
            lookDirection = "UP"
            flag = "U"
        } else if (data.y > DOWN_CUTOFF &&
                  lookDirection != "DOWN" &&
                  lookDirection != "RESET")
        {
            startLookTime = timestamp
            lookDirection = "DOWN"
            flag = "D"
        } else if (data.x >= LEFT_CUTOFF &&
                   data.x <= RIGHT_CUTOFF &&
                   data.y >= UP_CUTOFF &&
                   data.y <= DOWN_CUTOFF)
        {
            startLookTime = Number.POSITIVE_INFINITY
            lookDirection = null
        }


        if (startLookTime + LOOK_DELAY < timestamp) {
            startLookTime = Number.POSITIVE_INFINITY
            lookDirection = "STOP"
            setTimeout(() => {
                alert("Pay attention to your eyes！ " + flag);
                lookDirection = "RESET"
            }, 200)
        }
    })
    .begin()

// webgazer.showVideoPreview(false).showPredictionPoints(false)