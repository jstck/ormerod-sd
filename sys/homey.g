G91
G1 Z2 F200 ;Raise up Z a bit
G90
G92 Y0 ; Make whatever we are at Y0
G1 Y-220 F3000 S1 ; Search for endstop
G1 Y3 F3000 ; Back off
G1 Y-20 F200 S1 ; Probe again slowly
G91
G1 Z-2 F200 ; Back down again
G90
