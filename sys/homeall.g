M120 ; Push - save the current feedrate and relative/absolute move status

M558 P1 ; Enable IR probe

;X&Y
G91
G1 Z4 F200 ; Move up a bit extra to avoid clips
G90
G1 X-240 Y-220 F3000 S1 ; Move as far left as possible, track endstop
G1 X3 Y3 F3000 ; Back off a little bit
G1 X-10 Y-20 F200 S1 ; Go to endstop again a bit slower

;Z
G90 ; set movements absolute
G1 X125 Y100 F5000 ; Move to the X, Y point at which to probe the bed
G30 ; Move down until the probe is triggered
G1 Z3 F200 ; Move up to get out of the way of the bed
M121 ; Pop - restore the feedrate and relative/absolute move status
