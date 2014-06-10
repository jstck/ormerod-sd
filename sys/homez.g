M558 P1 ; Enable z probe
M120 ; Push - save the current feedrate and relative/absolute move status
G91 ; set movements relative
G1 Z2 F200 ; move upwards 5mm at 200 mm/min to make sure we don't hit anything
G90 ; set movements absolute
G1 X37 Y190 F5000 ; Move to the X, Y point at which to probe the bed over the foil
G30 ; Move down until the probe is triggered (i.e. move down until the IR voltage is 656, which automatically sets Z = probe height).
G1 Z2 F200 ; Move up to get out of the way of the bed
M121 ; Pop - restore the feedrate and relative/absolute move status
