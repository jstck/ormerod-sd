M558 P1 ; enable Z probe
G91
G1 Z5 F200 ; Move up a bit
G90
G1 X-240 F2000 S1 ; Move as far left as possible, track endstop
G92 X0
G1 X5 F200 ; Back off a little bit
G1 X-10 F200 S1 ; Go to endstop again a bit slower
G92 X0 ; Home!
G91
G1 Z-5 F200
G90

