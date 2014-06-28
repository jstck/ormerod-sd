M120 ; Push - save the current feedrate and relative/absolute move status

M558 P1 ; Enable IR probe

;X
G91
G1 Z2 F200 ; Move up a bit
G90
G1 X-240 F2000 S1 ; Move as far left as possible, track endstop
G92 X0
G1 X5 F200 ; Back off a little bit
G1 X-10 F200 S1 ; Go to endstop again a bit slower
G92 X0 ; Home!

;Y
G90
G92 Y0 ; Make whatever we are at Y0
G1 Y220 F2000 S1 ; Search for endstop
G92 Y200 ; Endstop = Y200
G1 Y190 ; Back off
G1 Y220 F100 S1 ; Probe again slowly
G92 Y200 ; We're here!

;Z
G90 ; set movements absolute
G1 X50 Y175 F5000 ; Move to the X, Y point at which to probe the bed over the foil
G30 ; Move down until the probe is triggered (i.e. move down until the IR voltage is 656, which automatically sets Z = probe height).
G1 Z2 F200 ; Move up to get out of the way of the bed
M121 ; Pop - restore the feedrate and relative/absolute move status
