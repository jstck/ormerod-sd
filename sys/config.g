
; jstck CoreXY Voron config file for dc42 Duet firmware

M111 S0                             ; Debug off
M550 PVoron							; Machine name
M551 Preprap                        ; Machine password (used for FTP connections)
M540 P0xBA:0xFE:0xC0:0xA8:0x00:0x0E	; MAC Address

M552 P192.168.0.14					; Set the IP address
M553 P255.255.255.0					; Set netmask
M554 P192.168.0.1					; Set the gateway

M555 P2                             ; Set output to look like Marlin
M575 P1 B57600 S1					; Comms parameters for PanelDue

; Machine configuration
M667 S1								; set CoreXY mode
M569 P0 S1							; Drive 0 goes forwards (change to S0 to reverse it)
M569 P1 S1							; Drive 1 goes forwards
M569 P2 S1							; Drive 2 goes forwards
M569 P3 S1							; Drive 3 goes forwards
M569 P4 S1							; Drive 4 goes forwards

M574 X2 Y2 Z0 S1					; endstops at X-max and Y-max, normally closed

M92 X80 Y80 Z400					; Set axis steps/mm
M92 E583.4							; Set extruder steps/mm
M906 X800 Y800 Z800 E800            ; Set motor currents (mA)
M201 X800 Y800 Z15 E1000            ; Accelerations (mm/s^2)
M203 X15000 Y15000 Z1200 E3000       ; Maximum speeds (mm/min)
M566 X600 Y600 Z30 E2.0             ; Maximum jerk speeds mm/minute
M208 X265 Y250 Z200					; set axis maxima (adjust to suit your machine)
M208 X-15 Y-20 Z-0.5 S1				; set axis minima (adjust to make X=0 and Y=0 the edges of the bed)
G21                                 ; Work in millimetres
G90                                 ; Send absolute coordinates...
M83                                 ; ...but relative extruder moves


; Thermistors and heaters
M305 P0 T100000 R1000 B4200 H0 L0	; Bed heater ADC settings
M305 P1 T100000 R1000 B4200 H0 L0	; Hotend heater ADC settings

;Set bed and hotend maximum temperatures
M143 H0 S150
M143 H1 S275


;M301 H1 P10 I0.10 D100 T0.50 S1.0	; PID settings for extruder 0

; Tool definition
M563 P0 D0 H1                       ; Define tool 0
G10 P0 S0 R0                        ; Set tool 0 operating and standby temperatures

T0									; select first hot end
