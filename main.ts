function gpsRead () {
    for (let index = 0; index <= 7; index++) {
        inString = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (inString.includes("$GPGGA")) {
            RawGPS = inString
        }
        index += 1
    }
    index = 0
    GPS_Array = RawGPS.split(",")
}
let packet = ""
let long = ""
let lat = ""
let time = ""
let Altitude = 0
let press = 0
let temp = 0
let GPS_Array: string[] = []
let index = 0
let RawGPS = ""
let inString = ""
radio.setTransmitPower(7)
radio.setGroup(2)
serial.redirect(
SerialPin.P13,
SerialPin.P1,
BaudRate.BaudRate9600
)
serial.setRxBufferSize(64)
serial.setTxBufferSize(64)
let targetAlt = 2000
let wireLatch = 0
let arm = 0
pins.digitalWritePin(DigitalPin.P15, 0)
basic.forever(function () {
    // Start
    led.plot(0, 0)
    music.playTone(262, music.beat(BeatFraction.Whole))
    basic.pause(100)
    temp = BMP280.temperature()
    press = BMP280.pressure() / 1000
    // BMP work
    led.plot(1, 0)
    music.playTone(262, music.beat(BeatFraction.Whole))
    gpsRead()
    basic.pause(100)
    music.playTone(262, music.beat(BeatFraction.Whole))
    // Create array
    led.plot(2, 0)
    basic.pause(100)
    music.playTone(262, music.beat(BeatFraction.Whole))
    // Set to packet
    led.plot(3, 0)
    if (GPS_Array[3] == "N" && GPS_Array[5] == "W") {
        Altitude = parseFloat(GPS_Array[9])
        time = GPS_Array[1]
        lat = "" + GPS_Array[2] + GPS_Array[3]
        long = "" + GPS_Array[4] + GPS_Array[5]
        basic.pause(100)
        packet = "" + time + " GMT, " + lat + ", " + long + ", " + Altitude + "M, " + temp + " °C, " + press + " kPa, " + RawGPS
    } else {
        packet = "Invalid packet: " + RawGPS
    }
    serial.writeLine(packet)
    basic.pause(100)
    radio.sendString(packet)
    basic.pause(100)
    led.plot(4, 0)
    music.playTone(262, music.beat(BeatFraction.Whole))
    basic.pause(100)
    led.unplot(0, 0)
    led.unplot(1, 0)
    led.unplot(2, 0)
    led.unplot(3, 0)
    led.unplot(4, 0)
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
        time = GPS_Array[1]
        serial.writeLine("" + time + "Target ALT:" + targetAlt + "M")
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
        time = GPS_Array[1]
        serial.writeLine("" + time + "Armed")
    }
    if (targetAlt < Altitude && arm == 1) {
        if (wireLatch == 0) {
            pins.digitalWritePin(DigitalPin.P15, 1)
            gpsRead()
            time = GPS_Array[1]
            serial.writeLine("" + time + "Hotwire triggered")
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
