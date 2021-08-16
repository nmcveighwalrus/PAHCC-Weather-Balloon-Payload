function getTime () {
    basic.showLeds(`
        . # # # .
        # . . # #
        # . # . #
        # . . . #
        . # # # .
        `)
    gpsRead()
    rawTime = parseFloat(GPS_Array[1])
    time = rawTime + timeDif
    if (time < 0) {
        time += 240000
    }
}
function gpsRead () {
    basic.showLeds(`
        . # # # .
        . . # . .
        # . . . #
        . # . # .
        . # # # .
        `)
    for (let index = 0; index <= 7; index++) {
        inString = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (inString.includes("$GPGGA")) {
            RawGPS = inString
        }
        index += 1
    }
    index2 = 0
    GPS_Array = RawGPS.split(",")
}
let wireLatch = 0
let arm = 0
let packet = ""
let long = ""
let lat = ""
let Altitude = 0
let press = 0
let temp = 0
let index2 = 0
let RawGPS = ""
let inString = ""
let time = 0
let GPS_Array: string[] = []
let rawTime = 0
let timeDif = 0
radio.setTransmitPower(7)
radio.setGroup(2)
serial.redirect(
SerialPin.P15,
SerialPin.P1,
BaudRate.BaudRate9600
)
serial.setRxBufferSize(64)
serial.setTxBufferSize(64)
let targetAlt = 2000
timeDif = -50000
let timeZone = "EST, "
pins.digitalWritePin(DigitalPin.P15, 0)
basic.forever(function () {
    temp = BMP280.temperature()
    press = BMP280.pressure() / 1000
    gpsRead()
    basic.pause(100)
    if (GPS_Array[3] == "N" && GPS_Array[5] == "W") {
        Altitude = parseFloat(GPS_Array[9])
        getTime()
        lat = "" + GPS_Array[2] + GPS_Array[3]
        long = "" + GPS_Array[4] + GPS_Array[5]
        basic.pause(100)
        packet = "" + time + timeZone + lat + ", " + long + ", " + Altitude + "M, " + temp + " °C, " + press + " kPa, " + RawGPS
        basic.pause(100)
        radio.sendNumber(0)
        basic.pause(100)
        radio.sendString("" + (time))
        basic.pause(100)
        radio.sendNumber(1)
        basic.pause(100)
        radio.sendString(lat)
        basic.pause(100)
        radio.sendNumber(2)
        basic.pause(100)
        radio.sendString(long)
        basic.pause(100)
        radio.sendNumber(3)
        basic.pause(100)
        radio.sendString("" + (Altitude))
        basic.pause(100)
        radio.sendNumber(4)
        basic.pause(100)
        radio.sendString("" + (temp))
        basic.pause(100)
        radio.sendNumber(5)
        basic.pause(100)
        radio.sendString("" + (press))
        basic.pause(100)
    } else {
        basic.showLeds(`
            . . . . .
            . # . # .
            . . . . .
            . # # # .
            # . . . #
            `)
        packet = "Invalid packet: " + RawGPS
        radio.sendNumber(6)
    }
    serial.writeLine(packet)
    if (input.buttonIsPressed(Button.B)) {
        pins.digitalWritePin(DigitalPin.P15, 1)
        basic.showLeds(`
            # . . . .
            . . # . .
            . # . # .
            . . # . .
            . . . . #
            `)
    } else {
        pins.digitalWritePin(DigitalPin.P15, 0)
        basic.clearScreen()
    }
    if (input.buttonIsPressed(Button.A)) {
        targetAlt = Altitude + 1
        basic.showLeds(`
            . # # # .
            # . . . #
            # . . . #
            # . . . #
            . # # # .
            `)
        gpsRead()
        getTime()
        serial.writeLine("" + time + timeZone + "Target ALT: " + targetAlt + "M")
        basic.showNumber(targetAlt)
    }
    if (input.buttonIsPressed(Button.AB)) {
        arm = 1
        basic.showLeds(`
            # . . . #
            . # # # .
            . # . # .
            . # # # .
            # . . . #
            `)
        gpsRead()
        getTime()
        serial.writeLine("" + time + timeZone + "ARMED")
    }
    if (targetAlt < Altitude && arm == 1) {
        if (wireLatch == 0) {
            pins.digitalWritePin(DigitalPin.P15, 1)
            gpsRead()
            getTime()
            serial.writeLine("" + time + timeZone + "HOTWIRE TRIGGERED")
            basic.showLeds(`
                # . . . .
                . . # . .
                . # . # .
                . . # . .
                . . . . #
                `)
            basic.pause(45000)
            wireLatch = 1
        } else {
            pins.digitalWritePin(DigitalPin.P15, 0)
        }
    }
})
