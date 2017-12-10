M120 ; Push - save the current feedrate and relative/absolute move status

;M558 P1 ; Enable IR probe


G91                       ; relative mode
G1 S1 X280 Y280 F5000     ; coarse home X or Y
G1 S1 X280                ; coarse home X
G1 S1 Y280                ; coarse home Y
G1 X-3 Y-3 F60            ; move away from the endstops
G1 S1 X10 F200            ; fine home X
G1 S1 Y10 F200            ; fine home Y


;Z
;G90 ; set movements absolute
;G1 X125 Y100 F5000 ; Move to the X, Y point at which to probe the bed
;G30 ; Move down until the probe is triggered
;G1 Z3 F200 ; Move up to get out of the way of the bed

M121 ; Pop - restore the feedrate and relative/absolute move status
