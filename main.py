def on_received_string(receivedString):
    global inChar
    inChar = receivedString
    if inChar == "a":
        ContinuousServo.spin_one_way(AnalogPin.P15)
    if inChar == "b":
        ContinuousServo.spin_other_way(AnalogPin.P15)
    if inChar == "c":
        ContinuousServo.turn_off_motor(DigitalPin.P15)
    if inChar == "d":
        radio.send_string(packet)
radio.on_received_string(on_received_string)

loop = 0
RawGPS = ""
press = 0
temp = 0
packet = ""
inChar = ""
radio.set_group(2)
serial.redirect(SerialPin.P13, SerialPin.P1, BaudRate.BAUD_RATE9600)
serial.set_rx_buffer_size(64)
latch = 1

def on_forever():
    global temp, press, RawGPS, loop, latch, packet
    temp = BMP280.temperature()
    press = BMP280.pressure() / 1000
    led.plot(4, 0)
    RawGPS = serial.read_until(serial.delimiters(Delimiters.NEW_LINE))
    while not (RawGPS.includes("GPGGA")):
        if latch == 0:
            led.plot(loop % 5, 2)
        elif latch == 1:
            led.unplot(loop % 5, 2)
        RawGPS = serial.read_until(serial.delimiters(Delimiters.NEW_LINE))
        loop += 1
        if loop == 5:
            loop = 0
            if latch == 1:
                latch = 0
            elif latch == 0:
                latch = 1
    loop = 0
    led.unplot(0, 2)
    led.unplot(1, 2)
    led.unplot(2, 2)
    led.unplot(3, 2)
    led.unplot(4, 2)
    basic.pause(200)
    packet = "" + RawGPS + " Temp: " + str(temp) + "°C, Pressure: " + str(press) + "kPa"
    serial.write_line(packet)
    led.unplot(4, 0)
    basic.pause(200)
    led.plot(0, 0)
basic.forever(on_forever)
