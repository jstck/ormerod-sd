; RepRapPro Ormerod
; Standard configuration G Codes
M111 S0; Debug off
M80 ; ATX power on
M106 S255; fan on
M550 POrmerod; Set the machine's name
M551 P; Blank password
M552 P192.168.0.14; Set the IP address
M553 P255.255.255.0; Set netmask
M554 P192.168.0.1; Set the gateway
M555 P2; Emulate Marlin USB output
M92 E427; Set extruder steps/mm
G21 ; Work in mm
G90 ; Absolute positioning
M83 ; Extrusions relative
M558 P1 ; Turn Z Probe on
G31 Z1.7 P600 ; Set Z probe height and threshold
M906 X800 Y1000 Z800 E1200 ; Motor currents (mA)
M203 X10000 Y10000 Z500 E3000 ; movement max speeds
M201 X1000 Y1000 Z15 E1000; acceleration tweaks for improved finish
M208 X205 Y200 Z180 ; max travel - allow some "X overshoot" for probing
T0 ; Select extruder 0
