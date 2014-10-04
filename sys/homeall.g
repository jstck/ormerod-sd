M120 ; Push - save the current feedrate and relative/absolute move status

M558 P1 ; Enable IR probe

;X
G91
G1 Z4 F200 ; Move up a bit extra to avoid clips
G90
G1 X-240 F3000 S1 ; Move as far left as possible, track endstop
G92 X0
G1 X5 F200 ; Back off a little bit
G1 X-10 F200 S1 ; Go to endstop again a bit slower
G92 X0 ; Home!

;Y
G90
G92 Y0 ; Make whatever we are at Y0
G1 Y-220 F3000 S1 ; Search for endstop
G92 Y0 ; Endstop = Y0
G1 Y3 ; Back off
G1 Y-20 F100 S1 ; Probe again slowly
G92 Y0 ; We're here!

;Z
G90 ; set movements absolute
G1 X125 Y100 F5000 ; Move to the X, Y point at which to probe the bed
G30 ; Move down until the probe is triggered
G1 Z3 F200 ; Move up to get out of the way of the bed
M121 ; Pop - restore the feedrate and relative/absolute move status
