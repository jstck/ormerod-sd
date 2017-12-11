M120 ; Push - save the current feedrate and relative/absolute move status

;M558 P1 ; Enable IR probe


G91                       ; relative mode
G1 Z2 F200                ; Move bed down a bit
G1 S1 X280 Y280 F5000     ; coarse home X or Y
G1 S1 X280 F5000          ; coarse home X
G1 S1 Y280 F5000          ; coarse home Y
G1 X-5 Y-5 F5000            ; move away from the endstops
G1 S1 X10 F500            ; fine home X
G1 S1 Y10 F500            ; fine home Y

G1 Z-2 F200				  ; MOve bed back for now (no z probing)

;Z
;G90 ; set movements absolute
;G1 X125 Y100 F5000 ; Move to the X, Y point at which to probe the bed
;G30 ; Move down until the probe is triggered
;G1 Z3 F200 ; Move up to get out of the way of the bed

M121 ; Pop - restore the feedrate and relative/absolute move status
