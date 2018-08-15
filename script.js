var pakkeliste;
var inputArray = new Array();

$(document).ready(function() {
	$.datepicker.setDefaults({
		dateFormat: "dd.mm.yy",
		minDate: 0,
		dayNamesMin: [ "Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør" ],
		monthNames: [ "Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember" ],
		firstDay: 1
	});
	$("#fromDate").datepicker({
		onSelect: function(dateText) {
			var fromdate = new Date($("#fromDate").datepicker("getDate"));
			var todate = new Date($("#toDate").datepicker("getDate"));
			if(todate.getTime() < fromdate.getTime()) {
				fromdate.setDate(fromdate.getDate()+3);
				$("#toDate").datepicker("setDate", fromdate);
			}
		}
	})
	$("#fromDate").datepicker("setDate", "+1");
	$("#toDate").datepicker();
	$("#toDate").datepicker("setDate", "+3");
	populateSaved(0);
});

function genList() {
	//Get data from form
	var fromdate = new Date($("#fromDate").datepicker("getDate"));
	var todate = new Date($("#toDate").datepicker("getDate"));
	var timeDiff = Math.abs(todate.getTime() - fromdate.getTime());
	ndays = Math.ceil(timeDiff / (1000 * 3600 * 24));
	var fromMonth = (fromdate.getUTCMonth() < 10 ? '0' : '') + (fromdate.getUTCMonth() +1);
	var toMonth = (todate.getUTCMonth() < 10 ? '0' : '') + (todate.getUTCMonth() +1);
	var fromDay = (fromdate.getUTCDate() < 9 ? '0' : '') + fromdate.getUTCDate();
	var toDay = (todate.getUTCDate() < 9 ? '0' : '') + todate.getUTCDate();
	var location = $("#location").val();
	var fromdateYY = fromDay + "." + fromMonth + "." + fromdate.getFullYear();
	var todateYY = toDay + "." + toMonth + "." + todate.getFullYear();
	inputArray = {"fromdate":fromdateYY, "todate":todateYY, "location":location, "stay":$("#stay").val(), "ntrainings":+$("#ntrainings").val(), "nraces":+$("#nraces").val(), "ndays":ndays};
	
	var dataArray = [fromMonth + "/" + fromDay, toMonth + "/" + toDay, location, "forecast"]

	getWolframTemps(dataArray);
}

function loadingError(text) {
	$("#ajaxload").html(text)
	$("#progressbar").addClass("hide");
	$("#overlay").addClass("clickToHide");
	$("#variables").removeClass("hide");
}

function getWolframTemps(arr) {
	var request = "temperature "+arr[3]+" "+arr[2]+" "+arr[0]+" to "+arr[1];
	$.ajax({
		url: "weatherparse.php",
		type: "POST",
		data: {request : encodeURI(request)},
		dataType: "json",
		beforeSend: function() {
			$('#overlay').removeClass("hide");
			$("#progressbar").removeClass("hide");
			$("#progressfill").css("animation", "progressAnimation 6s ease-out forwards");
			$('#ajaxload').html("Henter temperaturer...");
		},
		success: function(data) {
			if (!$.trim(data[0])) { //Hvis weatherparse gir null data tilbake
				loadingError("Kunne ikke hente temperaturer for " + arr[2] + ". Sjekk at du har skrevet det riktig eller prøv en større by i nærheten.");
			} else {
				var rawtemp = data[0][0].match(/\(([^)]+)\)/)[1];
				if (~rawtemp.indexOf("no data")) { //Hvis wolframalpha sier det ikke finnes data
					if (arr[3] == "forecast") {
						arr[3] = "history";
						getWolframTemps(arr);//Spør om history istedenfor og prøv på nytt
					} else {
						loadingError("Dessverre, vi kunne ikke finne noen temperaturer for " + arr[2])
					}
				} else if (~rawtemp.indexOf("to")) { //Hvis strengen inneholder "to" => vi har det vi trenger. SUKSESS!
					var temps = rawtemp.split(" to ");
					var n = data[1][0].indexOf("\n");
					if (n>0) {
						var place = data[1][0].substring(data[1][0].lastIndexOf("| ")+1,n);
					} else {
						var place = data[1][0].substring(data[1][0].lastIndexOf("| ")+1);
					}
					inputArray.place = place;
					inputArray.mintemp = temps[0];
					inputArray.maxtemp = temps[1];
					makePakkeliste();
				} else {
					loadingError("Et ukjent problem oppsto. WolframAlpha sa: " + JSON.stringify(data));
				}
			}
		},
		error: function(data) {
			console.log(data);
			loadingError("Det oppsto en feil med å hente temperaturene fra WolframAlpha");
		}
	});	
}

function fillTripInfo() {
	var tripInfoHTML = "<h1>" + inputArray.place + "<div id=\"edit\" class=\"blueButton\">&#9998;</div></h1>";
	tripInfoHTML += "<h4>" + inputArray.fromdate + " &#10137; " + inputArray.todate + "</h4>";
	tripInfoHTML += "<h4>" + inputArray.mintemp + "&deg;C &#10137; " + inputArray.maxtemp + "&deg;C</h4>";
	$("#tripText").html(tripInfoHTML);
}

function visualGradient() {
	var topColor = {
		h: Math.floor((3.5*inputArray.maxtemp + 285)%360),
		s: getRandomInt(50,90),
		l: getRandomInt(50,90)
	}
	var bottomColor = {
		h: Math.floor((3.5*inputArray.mintemp + 285)%360),
		s: getRandomInt(50,90),
		l: getRandomInt(50,90)
	}
	var gradient = "linear-gradient(to bottom, hsl("+topColor.h+","+topColor.s+"%,"+topColor.l+"%) 0%, hsl("+bottomColor.h+","+bottomColor.s+"%,"+bottomColor.l+"%) 100%)";
	$("#visual").css("background", gradient)
	function getRandomInt(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

function makePakkeliste() {
	$.ajax({
		url: "generatePakkeliste.php",
		type: "GET",
		data: {array : inputArray},
		dataType: "json",
		beforeSend: function() {
			$('#ajaxload').html("Lager pakkeliste...");
			$("#progressfill").css("flex", "0.98");
		},
		success: function(data) {
			pakkeliste = data;
			printList();
			visualGradient();
			fillTripInfo();
			$("#tripInfo").removeClass("hide");
			$("#save").removeClass("hide");
			$("#variables").addClass("hide");
			$('#overlay').addClass("hide");
			$("#newlist").css("display", "").prop('selected', true);
		},
		error: function(data) {
			console.log(data);
			$('#ajaxload').html("Det oppsto en feil med serverscriptet");
		}
	});
}

function findRemaining() {
	nremaining = 0;
	for (var key in pakkeliste) {
		if (pakkeliste[key][1] > 0 && pakkeliste[key][2] == 0) {
			nremaining = nremaining + 1;
		}
	}
	$("#nremaining").html(nremaining);
	if(!$("#nremaining").is(":visible")) {
		$("#nremaining").show();
	}
}

function printList() {	
	$("#save").html("&#128427;")
	//Print pakkeliste
	var listetable = "<h1>Pakkeliste</h1><table id=\"listetable\">";
	
	for (var i in pakkeliste) {
		if (pakkeliste[i][1] > 0) {
			listetable += "<tr num=\""+i+"\"><td><input type=\"button\"";
			if (pakkeliste[i][2] == 1) {
				listetable += "value=\"&#10004;\"";
			}
			listetable += " class=\"check smallbutton button\"></td><td><input type=\"button\" value=\"&#10006;\" class=\"remove smallbutton button\" ></td><td>"+pakkeliste[i][0]+"</td><td><input type=\"number\" value=\""+pakkeliste[i][1]+"\" class=\"count inlineInput\"></td></tr>";
		}
	}
	listetable += "</table>";
	document.getElementById('pakkeliste').innerHTML = listetable;
	
	//Print utenomliste
	var utenomlista = "<h1>Ting du kanskje vil ha med</h1><table id=\"utenomtable\">";
	
	for (var i in pakkeliste) {
		if (pakkeliste[i][1] == 0) {
			utenomlista += "<tr num=\""+i+"\"><td><input type=\"button\" value=\"&#43;\" class=\"add smallbutton button\" ></td><td>"+pakkeliste[i][0]+"</td></tr>";
		}
	}
	utenomlista += "<tr num=\"new\"><td><input type=\"button\" value=\"&#43;\" class=\"add smallbutton button\" ></td><td><input type=\"text\" class=\"inlineInput\"></td></tr>";
	utenomlista += "</table>";
	document.getElementById('utenomlista').innerHTML = utenomlista;
	findRemaining();
}

$(document).on('click', '#save', function() {
	var thisid = $("#saved").val();
	$.ajax({
		url: "savelist.php",
		type: "POST",
		data: {
			data: {
				input: JSON.stringify(inputArray),
				pakkeliste: JSON.stringify(pakkeliste),
				id: thisid
			}
		},
		dataType: "json",
		beforeSend: function() {
			$("#save").html("&#8635;");
			$("#save").css("animation", "spin 0.5s infinite linear");
		},
		success: function(data) {
			if (thisid == 0) {
				populateSaved(1);
			} else {
				$("#save").html("&#10004;");
				$("#save").css("animation", "");
			}
		},
		error: function(data) {
			console.log(data);
		}
	});
})

$(document).on('change', '#saved', function() {
	var id = $("#saved").val();
	if (id > 0) {
		if (savedLists.length == undefined) {
			var element = [savedLists];
		} else {
			var element = $.grep(savedLists, function(e){ return e.id == id; });	
		}
		pakkeliste = element[0].pakkeliste;
		inputArray = element[0].input;
		printList();
		visualGradient();
		fillTripInfo();
		$("#tripInfo").removeClass("hide");
		$("#save").removeClass("hide");
		$("#variables").addClass("hide");
	}
	console.log(savedLists)
});

var savedLists;

function populateSaved(state) {
	if (savedLists == null || state == 1) {
		$.ajax({
			url: "readlist.php",
			type: "POST",
			dataType: "json",
			beforeSend: function() {
				
			},
			success: function(data) {
				savedLists = data.list;
				var options = "<option value=\"0\" id=\"newlist\" style=\"display: none;\">Lagre ny liste</option>";
				if (!$.isArray(savedLists)) {
					savedLists.input = JSON.parse(savedLists.input);
					savedLists.pakkeliste = JSON.parse(savedLists.pakkeliste);
					options += "<option value="+savedLists.id+">"+savedLists.input.place+" "+savedLists.input.fromdate+"</option>";
				} else {
					for (i=0; i < savedLists.length; i++) {
						savedLists[i].input = JSON.parse(savedLists[i].input);
						savedLists[i].pakkeliste = JSON.parse(savedLists[i].pakkeliste);
						options += "<option value="+savedLists[i].id+">"+savedLists[i].input.place+" "+savedLists[i].input.fromdate+"</option>";
					}
				}
				if (state) {
					$('#saved').html(options);
					$("#newlist").css("display", "");
					$("#saved").children().eq(1).prop('selected', true);
					var id = $("#saved").val();			
					if (savedLists.length == undefined) {
						var element = [savedLists];
					} else {
						var element = $.grep(savedLists, function(e){ return e.id == id; });	
					}
					pakkeliste = element[0].pakkeliste;
					inputArray = element[0].input;
					printList();
					$("#save").html("&#10004;");
					$("#save").css("animation", "");
				} else {
					$('#saved').append(options);
				}
			},
			error: function(data) {
				console.log(data);
			}
		});
	}
}

$(document).on('change', '.activity', function(e) {
    var val = e.target.value;
    if (val != 0) {
        $clone = $(this).closest(".activityRow").clone();
        $("#activityRows").append($clone);
    }
});

$(document).on('click', '.add', function() {
	var num = $(this).parents().eq(1).attr('num');
	if (num == "new") {
		pakkeliste[Object.keys(pakkeliste).length+1] = [$(this).parent().next().children().val(),1,0];
	} else {
		pakkeliste[num][1] = 1;
	}
	printList();
})
$(document).on('click', '.remove', function() {
	var num = $(this).parents().eq(1).attr('num');
	pakkeliste[num][1] = 0;
	printList();
})
$(document).on('blur', '.count', function() {
	var num = $(this).parents().eq(1).attr('num');
	var newval = $(this).val();
	pakkeliste[num][1] = newval;
	printList();
})
$(document).on('click', '.check', function() {
	var num = $(this).parents().eq(1).attr('num');
	if (pakkeliste[num][2] == 1) {
		pakkeliste[num][2] = 0;
	} else {
		pakkeliste[num][2] = 1;
	}
	printList();
})
$(document).on('click', '.clickToHide', function() {
	$(this).addClass("hide");
	$(this).removeClass("clickToHide");
})
$(document).on('click', '#edit', function() {
	$("#tripInfo").addClass("hide");
	$("#variables").removeClass("hide");
})