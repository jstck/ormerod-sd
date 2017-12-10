M120 ; Push move/feed state
G91
G1 Z2 F200 ; Move up a bit extra to avoid clips
G90
G1 X280 F5000 S1 ; Move as far right as possible, track endstop
G1 X-3 F5000 ; Back off a little bit
G1 X10 F200 S1 ; Go to endstop again a bit slower
G91
G1 Z-2 F200
M121 ; Pop
