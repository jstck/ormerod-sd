; RepRapPro Ormerod, fw 1.04b-dc42
M111 S0; Debug off
;M80 ; ATX power on
;M106 S0; fan off

M667 S1                   ; switch to CoreXY mode

M540 PBA:FE:C0:A8:00:0E ;Mac = BAFE+IP
M550 PVoron; Set the machine's name
M551 P; Blank password

M552 P192.168.0.14; Set the IP address
M553 P255.255.255.0; Set netmask
M554 P192.168.0.1; Set the gateway

M555 P2; Emulate Marlin USB output
M92 E297.64; Set extruder steps/mm

G21 ; Work in mm
G90 ; Absolute positioning
M83 ; Extrusions relative

;M558 P1 ; Turn Z Probe on
;G31 Z1.6 P500 ; Set Z probe height and threshold

M906 X1200 Y1200 Z1200 E1200 ; Motor currents (mA)

M203 X10000 Y10000 Z500 E3000 ; movement max speeds

M201 X1000 Y1000 Z15 E1000; acceleration tweaks for improved finish

M208 X260 Y260 Z200 ; max travel - allow some "X overshoot" for probing

M208 X-5 Y-5 S1; axis minima

M563 P0 D0 H1 ; Define tool 0
