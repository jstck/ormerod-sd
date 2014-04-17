M558 P1 ; enable Z probe
G91
G1 Z5 F200 ; Move up a bit
G90
G1 X-240 F2000 S1 ; Move as far left as possible, track endstop
G92 X-10
G1 X0 F200 ; Back off a little bit
G1 X-30 F200 S1 ; Go to endstop again a bit slower
G92 X0 ; Set this as -10, to make 0-200 match bed and 220 reach height probe field
G91
G1 Z-5 F200
G90

