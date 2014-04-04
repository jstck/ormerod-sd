M561 ; Reset bed compensation
M120 ; Push - save the current feedrate and relative/absolute move status
G91 ; set movements relative
G1 Z5 F200 ; move upwards 5mm at 200 mm/min to make sure we don't hit anything
G90 ; set movements absolute
G1 X215 Y175 F5000 ; Move to the X, Y point at which to probe the bed over the foil
G30 ; Move down until the probe is triggered (i.e. move down until the IR voltage is 656, which automatically sets Z = probe height).
G1 Z5 ; Move up to get out of the way of the bed
M121 ; Pop - restore the feedrate and relative/absolute move status
G30 P0 X100 Y20 Z-0.2
G30 P1 X100 Y180 Z0.2
G30 P2 X180 Y100 Z0.4 S
