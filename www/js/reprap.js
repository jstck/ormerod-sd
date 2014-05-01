/*! Reprap Ormerod Web Control | by Matt Burnett <matt@burny.co.uk>. | open license
 */
var ver = 0.74; //App version
var polling = false; 
var webPrinting = false;
var printing = false;
var paused = false;
var chart,chart2,ormerodIP,layerCount,currentLayer,objHeight,objTotalFilament,startingFilamentPos,objUsedFilament,printStartTime,gFileLength,gFilename,buffer,currentFilamentPos,timerStart,storage,layerHeight,lastUpdatedTime;
var maxUploadBuffer = 800;
var maxUploadCommands = 20;
var messageSeqId = 0;

//Temp/Layer Chart settings
var maxDataPoints = 200;
var chartData = [[], []];
var maxLayerBars = 100;
var layerData = [];
var bedColour = "#454BFF"; //blue
var headColour = "#FC2D2D"; //red

var gFile = [];
var macroGs = ['setbed.g'];
var chevLeft = "<span class='glyphicon glyphicon-chevron-left'></span>";
var chevRight = "<span class='glyphicon glyphicon-chevron-right'></span>";

jQuery.extend({
    askElle: function(reqType, code) {
        var result;
        var query = "";
        switch(reqType) {
            case 'gcode':
                code = code.replace(/\n/g, '%0A').replace('+', '%2B').replace('-', '%2D').replace(/\s/g, '+');
                query = "?gcode="+code;
                break;
            case 'htm':
                query = "?gcode="+encodeURIComponent(code);
                reqType = "gcode";
                break;
			case 'fileinfo':
				query = "?name="+encodeURIComponent(code);
				break;
        }
        var url = '//' + ormerodIP + '/rr_'+reqType+query;
        $.ajax(url, {async:false,dataType:"json",success:function(data){result = data;}});
        return result;
    }
});

$(document).ready(function() {
    storage=$.localStorage;
    getCookies();
    loadSettings();
    
    moveVals(['X','Y','Z']);

    ormerodIP = location.host;
    $('#hostLocation').text(ormerodIP);

    if ($.support.fileDrop) {
        fileDrop();
    } else {
        alert('Your browser does not support file drag-n-drop :( \nYou have to Click and select a file instead');
    }

    //fill chart with dummy data
    for (var i = 0; i < maxDataPoints; i++) {
        chartData[0].push([i, 20]);
        chartData[1].push([i, 10]);
    }

    //chart line colours
    $('#bedTxt').css("color", bedColour);
    $('#headTxt').css("color", headColour);

    chart = $.plot("#tempchart", chartData, {
        series: {shadowSize: 0},
        colors: [bedColour, headColour],
        yaxis: {min: -20, max: 250},
        xaxis: {show: false},
        grid: {
            borderWidth: 0
        }
    });

    chart2 = $.plot("#layerChart", [{
            data: layerData,
            bars: {show: true}
        }], {
        series: {shadowSize: 0},
        xaxis: {minTickSize: 1, tickDecimals: 0, panRange: [0, null], zoomRange: [20, 50]},
        yaxis: {minTickSize: 1, min: 0, tickDecimals: 0, panRange: false},
        grid: {borderWidth: 0},
        pan: {interactive: true}
    });

    message('success', 'Page Load Complete');
    $('button#connect, button#printing').removeClass('disabled');
    
    var htmVer = getHTMLver();
    $('p#htmVer').text(htmVer);
    $('p#jsVer').text(ver);
    if (htmVer < ver) {
        //pop message
        modalMessage("Update! v"+ver+" is Available", "The version of reprap.htm on you Duet SD card is "+getHTMLver()+", the latest version is "+ver+", to ensure compatibility and with the latest javascript code, new features, and correct functionality it is highly recommended that you upgrade. The newest reprap.htm can be found at <a href='https://github.com/iamburny/OrmerodWebControl'>https://github.com/iamburny/OrmerodWebControl</a>", true);
    }
    
});

$('#connect').on('click', function() {
    if (polling) {
        polling = false;
        updatePage();
    } else {
        polling = true;
        updatePage();        
        listGFiles();
        $.askElle("gcode", "M115"); //get firmware
        poll();
    }
});

//temp controls
$('div#bedTemperature button#setBedTemp').on('click', function() { 
    $.askElle('gcode', "M140 S" + $('input#bedTempInput').val());
});
$('div#bedTemperature').on('click', 'a#bedTempLink', function() {
    $('input#bedTempInput').val($(this).text());
    $.askElle('gcode', "M140 S" + $(this).text());
});
$('div#headTemperature button#setHeadTemp').on('click', function() {
        $.askElle('gcode', "G10 P0 S" + $('input#headTempInput').val() + "\nT0");
});
$('div#headTemperature').on('click', 'a#headTempLink', function() {
    $('input#headTempInput').val($(this).text());
    $.askElle('gcode', "G10 P0 S" + $(this).text() + "\nT0");
});
$('input#bedTempInput').keydown(function(event) {
    if (event.which === 13) {
        event.preventDefault();
        $.askElle('gcode', "M140 S" + $(this).val());
    }
});
$('input#headTempInput').keydown(function(event) {
    if (event.which === 13) {
        event.preventDefault();
        $.askElle('gcode', "G10 P0 S" + $(this).val() + "\nT0");
    }
});
$('div#bedTemperature ul').on('click', 'a#addBedTemp', function() {
    var tempVal = $('input#bedTempInput').val();
    if (tempVal != "") {
        var temps = storage.get('temps', 'bed');
        temps.unshift(parseInt(tempVal));
        storage.set('temps.bed', temps);
        loadSettings();
    }else{
        modalMessage("Error Adding Bed Temp!", "You must enter a Temperature to add it to the dropdown list", close);
    }
});
$('div#headTemperature ul').on('click', 'a#addHeadTemp', function() {
    var tempVal = $('input#headTempInput').val();
    if (tempVal != "") {
        var temps = storage.get('temps', 'head');
        temps.unshift(parseInt(tempVal));
        storage.set('temps.head', temps);
        loadSettings();
    }else{
        modalMessage("Error Adding Head Temp!", "You must enter a Temperature to add it to the dropdown list", close);
    }
});

//feed controls
$('div#feed button#feed').on('click', function() {
    var amount = $(this).val();
    var dir = "";
    if ($('input[name="feeddir"]:checked').attr('id') == "reverse") {
        dir = "-";
    }
    var feedRate = " F" + $('input[name="speed"]:checked').val();
    var code = "M120\nM83\nG1 E" + dir + amount + feedRate + "\nM121";
    $.askElle('gcode', code);
});

//gcodes
$('div#sendG button#txtinput, div#sendG a').on('click', function() {    
    var code;
    if (this.nodeName === 'BUTTON') {
        code = $('input#gInput').val().toUpperCase();
    } else {
        code = $(this).text();
    }
    $.askElle('gcode', code); //send gcode
});
$('div#quicks').on('click', 'a', function() {
    var code;
    if (this.attributes.itemprop) {
        code = this.attributes.itemprop.value;
    } else {
        code = $(this).text();
    }
   $.askElle('gcode', code);
});
$('input#gInput').keydown(function(event) {
    if (event.which === 13) {
        event.preventDefault();
        $.askElle('gcode', $(this).val().toUpperCase());
    }
});

//move controls
$('table#moveHead').on('click', 'button', function() {
    var btnVal = $(this).attr('value');
    if (btnVal) {
        $.askElle('gcode', btnVal);
    } else {
        var value = $(this).text();

        var feedRate = " F2000";
        if (value.indexOf("Z") >= 0)
            feedRate = " F200";

        var movePreCode = "M120\nG91\nG1 ";
        var movePostCode = "\nM121";
        $.askElle('gcode', movePreCode + value + feedRate + movePostCode);
    }
});

//panic buttons
$('div#panicBtn button').on('click', function() {
    var btnVal = $(this).attr('value');
    switch (btnVal) {
        case "M112":
            //panic stop
            window.stop();
            webPrinting = false;
            paused = false;
            break;
        case "reset":
            //reset printing after pause
            gFile = [];
            printing = false;
            paused = false;
            btnVal = "M1";
            //switch off heaters
            $.askElle('gcode', "M140 S0"); //bed off
            $.askElle('gcode', "G10 P0 S0\nT0"); //head 0 off
            resetLayerData(0, 0);
        case "M24":
            //resume
            paused = false;
            $('button#pause').removeClass('active').text('Pause').attr('value', 'M25');
            $('button#printing').text("Ready :)");
            $('button#reset').addClass('hidden');
            break;
        case "M25":
            //pause
            paused = true;
            $(this).addClass('active').text('Resume').attr('value', 'M24');
            $('button#printing').text("Paused");
            $('button#reset').removeClass('hidden');
            break;
    }
    $.askElle('gcode', btnVal);
});

//g files
$("div#gFileList, div#gFileList2, div#gFileList3").on('click', 'button#gFileLink', function() {
    var danger = this.className.indexOf("btn-danger");
    if (danger < 0) {
		clearSlic3rSettings();
		printSDfile($(this).text());
    }
}).on('mouseover', 'span#fileDelete', function() {
    $(this).parent().addClass('btn-danger');
}).on('mouseout', 'span#fileDelete', function() {
    $(this).parent().removeClass('btn-danger');
}).on('click', 'span#fileDelete', function() {
    var filename = $(this).parent().text();
    $.askElle('gcode', "M30 " + filename);
    message('success', "G files [" + filename + "] Deleted from the SD card");
    listGFiles();
});
$("button#filereload").on('click', function() {
    $('span#ulTitle').text("File Upload Status");
    setProgress(0, "ul", 0,0);
    listGFiles();
});
$('#printGfile').on('click', function(){
    $('input#printGselect').click();
});
$('#uploadPrintGfile').on('click', function(){
    $('input#uploadPrintGselect').click();
});
$('#uploadGfile').on('click', function(){
    $('input#uploadGselect').click();
});
$('#ulConfigG').on('click', function(){
    $('input#ulConfigGselect').click();
});
$('#ulReprapHTM').on('click', function(){
    $('input#ulReprapHTMselect').click();
});
$("input#printGselect:file").change(function (e){
    var file = this.files[0];
    readFile(this.files[0], function(e) {
        handleFileDrop(e.target.result, file.name, 'print');
    });
    $(this).val('');
});
$("input#uploadPrintGselect:file").change(function (e){
    var file = this.files[0];
    readFile(this.files[0], function(e) {
        handleFileDrop(e.target.result, file.name, 'uploadandprint');
    });
    $(this).val('');
});
$("input#uploadGselect:file").change(function (e){
    var file = this.files[0];
    readFile(this.files[0], function(e) {
        handleFileDrop(e.target.result, file.name, 'upload');
    });
    $(this).val('');
});
$("input#ulConfigGselect:file").change(function (e){
    var file = this.files[0];
    readFile(this.files[0], function(e) {
        handleFileDrop(e.target.result, file.name, 'config');
    });
    $(this).val('');
});
$("input#ulReprapHTMselect:file").change(function (e){
    var file = this.files[0];
    readFile(this.files[0], function(e) {
        handleFileDrop(e.target.result, file.name, 'htm');
    });
    $(this).val('');
});

//Settings/cookie buttons
$("div#settings button#saveSettings").on('click', function(){
    saveSettings();
});
$("div#settings button#delSettings").on('click', function(){
    delSettings();
});

$('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
    if (e.target.hash == "#settings") {
        $.askElle("gcode", "M503"); //get config.g on setting view
    }
});

//Messages 
$("div#messages button#clearLog").on('click', function(){
    message('clear', '');
});

function getCookies() {
    //if none use defaults here, probably move them elsewhere at some point!
    if (!storage.get('settings')) {
        storage.set('settings', { pollDelay : 1000, layerHeight : 0.24, halfz : 0, noOK : 0 });
    }
    if (!storage.get('temps')) {
        storage.set('temps', {'bed' : [120,65,0], 'head' : [240,185,0]});
    }
}

function loadSettings() {
    $('div#settings input#pollDelay').val(storage.get('settings', 'pollDelay').toString());
    $('div#settings input#layerHeight').val(storage.get('settings', 'layerHeight').toString().toString())
    storage.get('settings', 'halfz')==1?$('div#settings input#halfz').prop('checked', true):$('div#settings input#halfz').prop('checked', false);
    storage.get('settings', 'noOK')==1?$('div#messages input#noOK').prop('checked', true):$('div#messages input#noOK').prop('checked', false);
    
    $('div#bedTemperature ul').html('<li class="divider"></li><li><a href="#" id="addBedTemp">Add Temp</a></li>');
    $('div#headTemperature ul').html('<li class="divider"></li><li><a href="#" id="addHeadTemp">Add Temp</a></li>');
    storage.get('temps', 'bed').forEach(function(item){
        $('div#bedTemperature ul').prepend('<li><a href="#" id="bedTempLink">'+item+'</a></li>');
    });
    storage.get('temps', 'head').forEach(function(item){
        $('div#headTemperature ul').prepend('<li><a href="#" id="headTempLink">'+item+'</a></li>');
    });
}

function delSettings() {
    storage.removeAll();
    getCookies();
    loadSettings();
}

function saveSettings() {
    var zwas = storage.get('settings', 'halfz');
    storage.set('settings.pollDelay', parseInt($('div#settings input#pollDelay').val()));
    storage.set('settings.layerHeight', parseFloat($('div#settings input#layerHeight').val()));
    $('div#settings input#halfz').is(':checked')?storage.set('settings.halfz','1'):storage.set('settings.halfz','0');  
    $('div#settings input#noOK').is(':checked')?storage.set('settings.noOk','1'):storage.set('settings.noOK','0');
    if (zwas !== storage.get('settings', 'halfz')) {
        $('div#Zminus, div#Zplus').text('');
        moveVals(['Z']);
    } 
}

function moveVals(axis) {
    axis.forEach(function(value) {
        storage.get('settings','halfz')==1&&value=='Z'?i=50:i=100;
        var button = 0;
        for (i; i >= 0.05; i=i/10) {
            $('div#'+value+'minus').append('<button type="button" class="btn btn-default disabled">'+chevLeft+value+'-'+i.toString()+'</button>');
            $('div#'+value+'plus').prepend('<button type="button" class="btn btn-default disabled">'+value+'+'+i.toString()+chevRight+'</button>');
            button++;
        }
    });

}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function fileDrop() {
    $('#uploadGfile').fileDrop({
        decodeBase64: true,
        removeDataUriScheme: true,
        overClass: 'btn-success',
        onFileRead: function(file) {
                handleFileDrop(file[0].data, file[0].name, "upload");
        }
    });

    $('#uploadPrintGfile').fileDrop({
        decodeBase64: true,
        removeDataUriScheme: true,
        overClass: 'btn-success',
        onFileRead: function(file) {
                handleFileDrop(file[0].data, file[0].name, "uploadandprint");
        }
    });

    $('#printGfile').fileDrop({
        decodeBase64: true,
        removeDataUriScheme: true,
        overClass: 'btn-success',
        onFileRead: function(file) {
                handleFileDrop(file[0].data, file[0].name, "print");
        }
    });
    
    $('#ulConfigG').fileDrop({
        decodeBase64: true,
        removeDataUriScheme: true,
        overClass: 'btn-success',
        onFileRead: function(file) {
                handleFileDrop(file[0].data, file[0].name, "config");
        }
    });
    
    $('#ulReprapHTM').fileDrop({
        decodeBase64: true,
        removeDataUriScheme: true,
        overClass: 'btn-success',
        onFileRead: function(file) {
                handleFileDrop(file[0].data, file[0].name, "htm");
        }
    });
}

function handleFileDrop(data, fName, action) {
    var ext = getFileExt(fName).toLowerCase();
    var fname = getFileName(fName).toLowerCase();
    if (ext === "g" || ext === "gco" || ext === "gcode" || (action === "htm" && ext === "htm")) {
        if (fname.length > 8) { fname = fname.substr(0, 8); }
        gFile = data.split(/\r\n|\r|\n/g);
        gFileLength = gFile.length;
        timer();
        switch (action) {
            case "config":
                gFilename = fname + '.g';
                $.askElle('gcode', "M559 P"+gFilename);
                message("info", "Config file "+gFilename+" upload started");
                uploadModal();
                $('span#ulTitle').text("Uploading " + gFilename);
                uploadLoop(action, "");
                break;       
            case "htm":
                gFilename = fname + '.htm';
                $.askElle('gcode', "M560");
                uploadModal();
                $('span#ulTitle').text("Uploading " + gFilename);
                message("info", "HTM file "+gFilename+" upload started");
                maxUploadBuffer = 300;
                maxUploadCommands = 2;
                uploadLoop(action, "");
                break;              
            case "upload":
				uploadFile(fName, fName, "");
                break;
            case "print":
                gFilename = fName;
				getSlic3rSettings();
				var h = findHeight();
                message("info", "Web Printing " + fName + " started");
                $('span#gFileDisplay').html('<strong>Direct from Web printing ' + fName + '</strong>');
                webPrinting = true;
                resetLayerData(h, 0);
                $('#tabs a:eq(1)').tab('show'); //show print status after drop tab
                uploadLoop(action, "");
                break;
			case "uploadandprint":
                gFilename = fName;
				getSlic3rSettings();
				var tempFilename = "tempWebPrint.gcode";
				uploadFile(fName, tempFilename, tempFilename);
				break;
        }
    } else {
        //alert('Not a G Code file');
        modalMessage("File Error!", 'Not a valid file to print or upload', true);
        return false;
    }
}

function uploadFile(fromFile, toFile, printAfterUpload)
{
	$.askElle('gcode', "M28 " + toFile);
	if (fromFile == toFile)
	{
		message("info", "File Upload of " + fromFile + " started");
	}
	else
	{
		message("info", "File Upload of " + fromFile + " to " + toFile + " started");
	}
	gFilename = fromFile;
	uploadModal();
	$('span#ulTitle').text("Uploading " + fromFile);
	uploadLoop("upload", printAfterUpload);
}

function printSDfile(fName)
{
	var info = $.askElle('fileinfo', fName);
	var height = 0, filament = 0;
	if (info.hasOwnProperty('height') && isNumber(info.height))
	{
		height = info.height;
	}
	if (info.hasOwnProperty('filament') && isNumber(info.filament))
	{
		filament = info.filament;
	}
	$.askElle('gcode', "M23 " + fName + "\nM24");
	message('success', "File [" + fName + "] sent to print");
	$('span#gFileDisplay').html('<strong>Printing ' + fName + ' from Duet SD card</strong>');
	resetLayerData(height, filament);
	$('#tabs a:eq(1)').tab('show');
}

function uploadModal() {
    modalMessage('File Upload Status',"<span id='ulTitle'>File Upload Status</span>"+
    "<div class='progress text-center'>"+
    "<div id='ulProgress' class='progress-bar' role='progressbar' aria-valuenow='60' aria-valuemin='0' aria-valuemax='100' style='width: 0%'>"+
    "<span id='ulProgressText' title=''></span>"+
    "</div>"+
    "<span id='ulOffBar'>0% Complete</span>"+
    "</div>", false);
}

function readFile(file, onLoadCallback){
    //read file from click-choose type printing/upload
    var reader = new FileReader();
    reader.onload = onLoadCallback;
    reader.readAsText(file);
}

function findHeight() {
    //find last G1 Z command not in a comment from end backwards and return height in mm
    var height=0;
    var start=0;    
    var end=0;
    var i=gFileLength - 1;
    while (height===0 && i > 1) {
        start = gFile[i].indexOf('G1 Z');
        if (start >= 0) {
			var comment = gFile[i].indexOf(';');
			if (comment < 0 || comment > start) {
				end = gFile[i].indexOf(' ', start+4);
				if(end > start) { 
					height = gFile[i].substr(start+4, end-(start+4));
				} else {
					height = gFile[i].substr(start+4);
				}
			}
        }
        i--;
    }
    return height;
}

function clearSlic3rSettings() {
    $('table#slic3r tbody').html(''); //slic3r setting <table>
}

function getSlic3rSettings() {
	clearSlic3rSettings();
//    switch (true) {
//        case gFile[0].indexOf('Slic3r') >= 0:
//            var values = {'Sliced With': 'generated by ', 'Layer Height': 'layer_height = ', 'Extrusion Multiplier' : 'extrusion_multiplier = ','Perimeters': 'perimeters = '};
//            break;
//        case gFile[0].indexOf('Cura') >= 0:
//            var values = {'Sliced With': 'Generated with ', 'Cura Settings': 'Basic settings: ', 'Layer Count' : 'Layer count: '};
//            break;
//    }
    var values = {'Sliced With': 'generated by ', 'Layer Height': 'layer_height = ', 'Extrusion Multiplier' : 'extrusion_multiplier = ','Perimeters': 'perimeters = '};
    for(var i = 0; i <= 20 && i < gFile.length; i++){
        for(var key in values){
            var value = values[key];
            var linePos = gFile[i].indexOf(value);
			var data;
            if(linePos > 0) {
                switch (true) {
                    case key == 'Sliced With':
                        data = gFile[i].substr(linePos+value.length, gFile[i].indexOf(' on') - (linePos+value.length));
                        break;
                    case key == 'Layer Height':
                        data = gFile[i].substr(linePos+value.length);
                        layerHeight = data;
                        break;
//                    case key == 'Cura Settings':
//                        //Cura Settings
//                        break;
                    default:
                        data = gFile[i].substr(linePos+value.length);
                        break;
                }
                $('table#slic3r tbody').append('<tr><th>'+key+'</th></tr><tr><td>'+data+'</td></tr>');
            }
        }
    }
}

function uploadLoop(action, fileToPrint) { //Web Printing/Uploading
    var wait = 5;
    var resp;
    switch (true) {
        case webPrinting == false && action === 'print':
            //Break Loop stop sending
           gFile = [];
		   // fall through...
        case gFile.length === 0:
            //Finished with Dropped file, stop loop, end tasks
            var duration = (timer() - timerStart).toHHMMSS();
            switch (action) {
                case "print":
                    webPrinting = false;
                    message("success", "Finished web printing " + gFilename + " in " + duration);                
                    break;
                case "upload":
                    $.askElle('gcode', "M29");
                    listGFiles();
					if (fileToPrint != "")
					{
						$('div#modal').modal('hide');
						printSDfile(fileToPrint);
					}
					else
					{
						$('span#ulTitle').text(gFilename + " Upload Complete in " + duration);
						$('div#modal button#modalClose').removeClass('hidden');
						message("info", gFilename + " Upload Complete in " + duration);     
					}
                    break;
                case "config":
                case "htm":    
                    $.askElle('gcode', "M29");
                    $.askElle("gcode", "M503"); //update config.g on setting view
                    message("info", gFilename + " Upload Complete in "+ duration);
                    $('span#ulTitle').text(gFilename + " Upload Complete in "+ duration);
                    $('div#modal button#modalClose').removeClass('hidden');
                    maxUploadBuffer = 800;
                    maxUploadCommands = 20;
                    break;                    
            }
            break;
        default:
            if (buffer == null || buffer < 100) {
                resp = $.askElle('status', '');
                if (typeof resp != 'undefined') {
                    buffer = resp.buff;
                } else {
                    buffer = 0;
                }
            }
            if (buffer < 100) {
                wait = 20;
            }else if (paused === true) {
                wait = 2000;
            } else {
                webSend(action);
            }
            setTimeout(function() {
                uploadLoop(action, fileToPrint);
            }, wait);
            break;
    }
}

function webSend(action) { //Web Printing/Uploading
    var i=0;
    var line = "";
    var resp;
	if (buffer > maxUploadBuffer) {
            buffer = maxUploadBuffer;
	}
    if (gFile.length > 0) {
        while(gFile.length > 0 && i < maxUploadCommands && (line.length + gFile[0].length + 3) < buffer ) {
            if (i != 0) {
                line += "\n"; //"%0A";
            }
            line += gFile[0];
            gFile.shift();
            i++;
        }
        if (action==="htm") {
             resp = $.askElle('htm', line); //send chunk of gcodes, and get buffer response
        } else {
             resp = $.askElle('gcode', line); //send chunk of gcodes, and get buffer response
        }
        
        if (typeof resp != 'undefined') {
            buffer = resp.buff;
        } else {
            buffer = 0;
        }
        
        if (!webPrinting) setProgress(Math.floor((1 - (gFile.length / gFileLength)) * 100), "ul", 0,0);
    }
}

function listGFiles() {
    var count = 0;
    var filesPerCol;
    var list = "gFileList";
    $('div#gFileList, div#gFileList2, div#gFileList3').html("");
    var result = $.askElle("files", "");
	result.files.sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
    result.files.length>18?filesPerCol=Math.ceil(result.files.length/3):filesPerCol = 6;
    result.files.forEach(function(item) {
        count++;
        switch (true) {
            case (count > (filesPerCol * 2)):
                list = "gFileList3";
                break;
            case (count > filesPerCol):
                list = "gFileList2";
                break;
        }
        if(jQuery.inArray(item, macroGs) >= 0) {
            if (!$('div#quicks a[itemprop="M23 '+item+'%0AM24"]').text()) {
                $('div#quicks td:eq(0)').append('<a href="#" role="button" class="btn btn-default disabled" itemprop="M23 '+item+'%0AM24" id="quickgfile">'+item+'</a>');
            }
        }
        $('div#' + list).append('<button type="button" class="btn btn-default" id="gFileLink"><span class="pull-left">' + item + '</span><span id="fileDelete" class="glyphicon glyphicon-trash pull-right"></span></button>');
    });
}

function getFileExt(filename) {
    return filename.split('.').pop();
}

function getFileName(filename) {
    return filename.split('.').shift();
}

function disableButtons(which) {
    switch (which) {
        case "head":
            $('table#moveHead button, table#temp button, table#extruder button, table#extruder label, div#quicks a, button#uploadGfile, button#ulConfigG, button#ulReprapHTM, button#printGfile, button#uploadPrintGfile').addClass('disabled');
            break;
        case "panic":
            $('div#panicBtn button').addClass('disabled');
            $('button#reset').addClass('hidden');
            break;
        case "gfilelist":
            $('div#gcodefiles button').addClass('disabled');
            break;
        case "sendG":
            $('div#sendG button, div#sendG a, input#gInput').addClass('disabled');
            break;
    }
}

function enableButtons(which) {
    switch (which) {
        case "head":
            $('table#moveHead button, table#temp button, table#extruder button, table#extruder label, div#quicks a, button#uploadGfile, button#ulConfigG, button#ulReprapHTM, button#printGfile, button#uploadPrintGfile').removeClass('disabled');
            break;
        case "panic":
            $('div#panicBtn button').removeClass('disabled');
            break;
        case "gfilelist":
            $('div#gcodefiles button').removeClass('disabled');
            break;
        case "sendG":
            $('div#sendG button, div#sendG a, input#gInput').removeClass('disabled');
            break;            
    }
}

function modalMessage(title, text, close) {
    $('div#modal h4.modal-title').text(title);
    $('div#modal div.modal-body').html(text);
    close?$('div#modal button#modalClose').removeClass('hidden'):$('div#modal button#modalClose').addClass('hidden');
    $('div#modal').modal({show:true});
}

function message(type, text) {
    var d = new Date();
    var time = zeroPrefix(d.getHours()) + ":" + zeroPrefix(d.getMinutes()) + ":" + zeroPrefix(d.getSeconds());
    if (type == 'clear') {
        $('div#messageText').html(time + " <span class='alert-info'>Log Cleared</span><br />");
    } else {
        $('div#messageText').prepend(time + " <span class='alert-" + type + "'>" + text + "</span><br />");
    }
}

function parseResponse(res) {
    switch (true) {
        case res.indexOf('Debugging enabled') >= 0:
            message('info', '<strong>M111</strong><br />' + res.replace(/\n/g, "<br />"));    
            break;
        case res.indexOf('Firmware') >= 0:
            var strt = res.indexOf("SION:") +5 ;
            var end = res.indexOf(" ELEC");
            if ($('p#firmVer').text() === "") {
                $('p#firmVer').text(res.substr(strt, end - strt));
            }
            message('info', '<strong>M115</strong><br />' + res.replace(/\n/g, "<br />"));
            $.askElle("gcode", "M105");
            break;
        case res.indexOf('M550') >= 0:
            message('info', '<strong>M503</strong><br />' + res.replace(/\n/g, "<br />")); 
            $('div#config').html("<span class='col-md-9'><br/><strong>Config.g File Contents:</strong></span>");
            res.split(/\n/g).forEach(function(item) {
                $('div#config').append("<span class='alert-info col-md-9'>" + item + "</span><br />");
            });
            $.askElle("gcode", "M105");
            break;
        case res == "ok":
            if ($('div#messages input#noOK').is(':checked')) {
                message('info', res);
            }
            break;
        default:
            message('info', res);
            break;
    }
}

function homedWarning(x,y,z) {
    if ((x+y+z) < 3) {
        $('span#warning').text('*some axes are not homed');
    } else {    
        $('span#warning').text('');
    }
    x===0?$('button#homeX').removeClass('btn-primary').addClass('btn-warning'):$('button#homeX').removeClass('btn-warning').addClass('btn-primary');
    y===0?$('button#homeY').removeClass('btn-primary').addClass('btn-warning'):$('button#homeY').removeClass('btn-warning').addClass('btn-primary');
    z===0?$('button#homeZ').removeClass('btn-primary').addClass('btn-warning'):$('button#homeZ').removeClass('btn-warning').addClass('btn-primary');
}

function updatePage() {
    var status = $.askElle("status", "");
    if (!status || !polling) {
        $('button#connect').removeClass('btn-success').addClass('btn-danger');
        $('button#printing').removeClass('btn-warning').removeClass('btn-success').addClass('btn-danger').text("Disconnected");
        if (polling) {
            message('danger', "<strong>Warning!</strong> Ormerod webserver is probably broken, power cycle/reset your Duet Board :(");
            $('button#connect').text("Retrying");
        } else {
            message('info', "<strong>Disconnected</strong> Page not being updated");
            $('button#connect').text("Connect");
        }
        $('span[id$="Temp"], span[id$="pos"]').text("0");
        disableButtons("head");
        disableButtons("panic");
    } else {
        $('button#connect').removeClass('btn-danger').addClass('btn-success').text("Online");
        //Connected Hoorahhh!
        if (messageSeqId !== status.seq) {
            messageSeqId = status.seq;
            parseResponse(status.resp);
        }
        buffer = status.buff;
		currentFilamentPos = status.extr[0];
        homedWarning(status.homed[0],status.homed[1],status.homed[2]);
		if (status.status == "S") {
			//stopped
			printing = false;
            $('button#printing').removeClass('btn-danger').removeClass('btn-success').addClass('btn-warning').text("Halted");
            disableButtons('panic');
            disableButtons("head");
            disableButtons("gfilelist");
		} else if (status.status === "P" || (webPrinting && !paused)) {
            //printing
            printing = true;
            objHeight = $('input#objheight').val();
			if (!isNumber(objHeight) && status.status == 'P' && status.hasOwnProperty('height')) {
				objHeight = status.height;
				$('input#objheight').val(objHeight.toString());
			}
            $('button#printing').removeClass('btn-danger').removeClass('btn-warning').addClass('btn-success').text("Active");
            enableButtons('panic');
            disableButtons("head");
            disableButtons("gfilelist");
            currentLayer = whichLayer(status.pos[2]);
			if (isNumber(objHeight)) {
                if (!layerHeight) layerHeight = storage.get('settings','layerHeight');
                layerCount = Math.ceil(objHeight / layerHeight);
			}
			if (printStartTime && objTotalFilament > 0) {
				setProgress(Math.floor((objUsedFilament / objTotalFilament) * 100), 'print', currentLayer, layerCount);
				estEndTime();
            } else if (printStartTime && layerCount > 0) {
                setProgress(Math.floor((currentLayer / layerCount) * 100), 'print', currentLayer, layerCount);
            } else {
                setProgress(0, 'print', 0, 0);
            }
            layers(currentLayer);
        } else if (status.status === "I" && !paused ) {
            //inactive, not printing
            printing = false;
            $('button#printing').removeClass('btn-danger').removeClass('btn-success').addClass('btn-warning').text("Ready :)");
            disableButtons("panic");
            enableButtons('head');
            enableButtons("gfilelist");
        } else if (status.status === "I" && paused) {
            //paused
            printing = true;
            $('button#printing').removeClass('btn-danger').removeClass('btn-success').addClass('btn-warning').text("Paused");
            enableButtons('panic');
            enableButtons('head');
        } else {
            //unknown state
            webPrinting = printing = paused = false;
            $('button#printing').removeClass('btn-warning').removeClass('btn-success').addClass('btn-danger').text("Error!");
            message('danger', 'Unknown Poll State : ' + status.status);
        }

        $('span#bedTemp').text(status.heaters[0]);
        $('span#headTemp').text(status.heaters[1]);
        $('span#Xpos').text(status.pos[0]);
        $('span#Ypos').text(status.pos[1]);
        $('span#Zpos').text(status.pos[2]);
        $('span#Epos').text(status.extr[0]);
        $('span#probe').text(status.probe);

        //Temp chart stuff
        chartData[0].push(parseFloat(status.heaters[0]));
        chartData[1].push(parseFloat(status.heaters[1]));
        chart.setData(parseChartData());
        chart.draw();
    }
}

function estEndTime() {
    var firstLayer = 2;
    if (($('div#settings input#ignoreFirst').is(':checked'))) {
        firstLayer = 2;
    }
    var d = new Date();
    var utime = d.getTime();
    var layerLeft = layerCount - currentLayer;
    if (layerData.length > firstLayer && layerCount > 0) {
        var lastLayer = layerData[layerData.length - 1] - layerData[layerData.length - 2];
        var llTimeR = new Date(utime + (lastLayer * layerLeft));
        $('span#llTimeR').text((lastLayer * layerLeft).toHHMMSS()); 
        $('span#llTime').text(llTimeR.toLocaleTimeString()); 

        //average all layers 
        var t=0;
        for (var i = firstLayer; i <= (layerData.length-1) ;i++ ) {
            t += layerData[i] - layerData[i-1];
        }
        var avgAll = t / layerData.length-firstLayer;
        var avgAllR = new Date(utime + (avgAll * layerLeft));
        $('span#avgAllR').text((avgAll * layerLeft).toHHMMSS()); 
        $('span#avgAll').text(avgAllR.toLocaleTimeString()); 
        
        if (layerData.length > (5 + firstLayer)) {
            //avg last 5 layers
            t=0;
            for (var i = firstLayer; i <= (4+firstLayer) ;i++ ) {
                t += layerData[layerData.length - i] - layerData[layerData.length - i-1] ;
            }
            var avg5 = t / 5;
            var avg5R = new Date(utime + (avg5 * layerLeft));
            $('span#avg5R').text((avg5 * layerLeft).toHHMMSS()); 
            $('span#avg5').text(avg5R.toLocaleTimeString()); 
        }
	}	
	if (objTotalFilament > 0)
	{
		if (currentFilamentPos - startingFilamentPos < objUsedFilament - 10) {
			//probably just done a G30 E0 to reset the filament origin
			startingFilamentPos = currentFilamentPos - objUsedFilament;
		}
		objUsedFilament = currentFilamentPos - startingFilamentPos;
		if (objUsedFilament <= objTotalFilament && objUsedFilament > objTotalFilament * 0.05) {	//if at least 5% filament consumed
			var timeSoFar = utime - printStartTime;
			var timeLeft = timeSoFar * (objTotalFilament - objUsedFilament)/objUsedFilament;
			var estEndTimeFil = new Date(utime + timeLeft);
			$('span#filTimeR').text(timeLeft.toHHMMSS());
			$('span#filTime').text(estEndTimeFil.toLocaleTimeString());
		}
	}
}

function whichLayer(currZ) {
    if(!layerHeight) layerHeight = storage.get('settings','layerHeight');
    var n = Math.round(currZ / layerHeight);
    if (n === currentLayer + 1 && currentLayer) {
        layerChange();
    }
    return n;
}

function resetLayerData(h, f) {
    //clear layer count,times and chart
	if (h == 0) {
		$('input#objheight').val("");
	}
	else {
		$('input#objheight').val(h.toString());
	}
	objTotalFilament = f;
	startingFilamentPos = currentFilamentPos;
	objUsedFilament = 0;
    layerData = [];
    printStartTime = null;
    setProgress(0, 'print', 0, 0);
    $('span#elapsed, span#lastlayer, table#finish span').text("00:00:00");
    chart2.setData(parseLayerData());
    chart2.setupGrid();
    chart2.draw();
}

function layerChange() {
    var d = new Date();
    var utime = d.getTime();
    layerData.push(utime);
    if (printStartTime && layerData.length > 1) {
        var lastLayerEnd = layerData[layerData.length - 2];
        $('span#lastlayer').text((utime - lastLayerEnd).toHHMMSS());
        chart2.setData(parseLayerData());
        chart2.setupGrid();
        chart2.draw();
        if (isNumber(objHeight)) {
            estEndTime();
        }
    }
}

function layers(layer) {
    var d = new Date();
    var utime = d.getTime();
    if ((layer === 1 || layer == 2) && !printStartTime) {
        printStartTime = utime;
        layerData.push(utime);
    }
    if (printStartTime) {
        $('span#elapsed').text((utime - printStartTime).toHHMMSS());
    }
}

function zeroPrefix(num) {
    var n = num.toString();
    if (n.length === 1) {
        return "0" + n;
    }
    return n;
}

function setProgress(percent, bar, layer, layers) {
    var barText = $('span#'+bar+'ProgressText');
    var offText = $('span#'+bar+'OffBar');
    var ptext = percent + "% Complete";
    if (bar == 'print') {
		if (layers > 0) {
			ptext += ", Layer " + layer + " of " + layers;
		}
		if (objTotalFilament > 0) {
			ptext += ", Filament " + (currentFilamentPos - startingFilamentPos) + " of " + objTotalFilament + "mm";
		}
    }
    
    switch (true) {
        case percent <= 40 && percent > 0:
            barText.text('').attr('title', '');
            offText.text(ptext).attr('title', ptext);
            break;
        case percent > 40:
            barText.text(ptext).attr('title', ptext);
            offText.text('').attr('title', '');
            break;
        default:
            barText.text('').attr('title', '');
            offText.text('0% complete');
            break;
    }
    $('div#'+bar+'Progress').css("width", percent + "%");
}

function parseLayerData() {
    if (layerData.length > maxLayerBars)
        layerData.shift();
    var res = [];
    //res.push([0,0]);
    var elapsed;
    for (var i = 1; i < layerData.length; ++i) {
        elapsed = Math.round((layerData[i] - layerData[i - 1]) / 1000);
        res.push([i, elapsed]);
    }
    return [res];
}

function parseChartData() {
    if (chartData[0].length > maxDataPoints)
        chartData[0].shift();
    if (chartData[1].length > maxDataPoints)
        chartData[1].shift();
    var res = [[], []];
    for (var i = 0; i < chartData[0].length; ++i) {
        res[0].push([i, chartData[0][i]]);
        res[1].push([i, chartData[1][i]]);
    }
    return res;
}

function timer() {
    var d = new Date();
    if (!timerStart) {
        timerStart = d.getTime();
    } else {
        var elapsed = d.getTime() - timerStart;
        timerStart = null;
        return elapsed;
    }
}

function poll() {
    if (polling) {
        setTimeout(function() {
            updatePage();
            poll();
        }, storage.get('settings', 'pollDelay'));
    }
}

function getHTMLver() {
    return document.title.substr(document.title.indexOf("v")+1);
}

Number.prototype.toHHMMSS = function() {
    var h,m;
    var sec_num = Math.floor(this / 1000); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    hours < 10?hours="0"+hours:false;
    minutes < 10?minutes="0"+minutes:false;
    seconds < 10?seconds="0"+seconds:false;
    hours=='00'?h="":h=hours+"h ";
    minutes=='00'?m="":m=minutes+"m ";
    return h+m+seconds + 's';
};
