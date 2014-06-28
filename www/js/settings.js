//Quick command buttons added to the row on the bottom of the control screen
var quickCommands = [
  {
    "title": "Turn on ATX power supply",
    "name": "Power on",
    "gcode": "M80"
  },
  {
    "title": "Turn off ATX power supply",
    "name": "Power off",
    "gcode": "M81"
  }

];

//Presets for bed and head temperatures in dropdowns. These will override whatever
//is stored in cookies
var tempPresets={
  "bed": [100,90,60,0],
  "head": [245,185,111,0]
}

//Values for the feed rates
//var feedRates=[50,150,500];
//var feedLengths=[1,3,12,48,192];

var feedRates=[17];
var feedLengths=[77];
