M120 ; Push move/feed state
G91
G1 Z2 F200 ; Move up a bit
G90
G1 Y280 F5000 S1 ; Move as far "up" as possible, track endstop
G1 Y-3 F5000 ; Back off a little bit
G1 Y10 F200 S1 ; Go to endstop again a bit slower
G91
G1 Z-2 F200
M121 ; Pop