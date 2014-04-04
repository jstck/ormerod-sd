; RepRapPro Ormerod
; Standard configuration G Codes
M111 S0; Debug off
M550 POrmerod; Set the machine's name
M551 Preprap; Set the password
M552 P192.168.0.14; Set the IP address
M553 P255.255.255.0; Set netmask
M554 P192.168.0.1; Set the gateway
M555 P2; Emulate Marlin USB output
M92 E416; Set extruder steps/mm
G21 ; Work in mm
G90 ; Absolute positioning
M83 ; Extrusions relative
M558 P1 ; Turn Z Probe on
G31 Z3.1 P600 ; Set Z probe height and threshold
M906 X800 Y1000 Z800 E800 ; Motor currents (mA)
T0 ; Select extruder 0
