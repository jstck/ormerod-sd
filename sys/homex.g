M558 P1 ; enable Z probe
G91
G1 Z4 F200 ; Move up a bit extra to avoid clips
G90
G1 X-240 F3000 S1 ; Move as far left as possible, track endstop
G1 X3 F3000 ; Back off a little bit
G1 X-10 F200 S1 ; Go to endstop again a bit slower
G91
G1 Z-4 F200
G90

