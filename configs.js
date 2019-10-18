var options = {};
if (!localStorage.getItem('settingsEDF')) {
	options = objectifyForm(jQuery('#configs input').serializeArray()); 	//Get form
	localStorage.setItem('settingsEDF', JSON.stringify(options)); 				//Set options
}
else {
	options = JSON.parse(localStorage.getItem('settingsEDF'));						//Get options
	$('#configs input[type=checkbox]').prop('checked', false);				//Set all form checkboxes in off
	$.each( options, function( key, value ) {										//Set options in form (check the rights)
		console.log( key + ": " + value );
		if(value == "on") 
			$('#configs input[name='+key+']').prop('checked', true);
		else {
			$('#configs input[name='+key+']').val(value);
		}

	});
}
setarConfigsCSS();

function setarConfigsCSS() {
	var cssRules = "";
	//Borda
	if (options.borda) cssRules += "#partes div {border: 1px black solid;}";
	else cssRules += "#partes div {border: none;}";
	//Margem
	if (options.margem) cssRules += "#partes div {margin: 1px;}";
	else cssRules += "#partes div {margin: 0;}";
	//Timeline
	if (options.timeline) cssRules += "#partes {display: flex;}";
	else cssRules += "#partes {display: block;}";

	var style = '<style type="text/css">' + cssRules + "</style>";
	$("head").append(style);
}

$('#configs').on('change input', 'input', function() {
	console.log("Mudando configs");
	options = objectifyForm(jQuery('#configs input').serializeArray());
	console.log(options);

	setarConfigsCSS();
	
	localStorage.setItem('settingsEDF', JSON.stringify(options));
	console.log('Configs Saved');
})

function objectifyForm(formArray) {//serialize data function
  var returnArray = {};
  for (var i = 0; i < formArray.length; i++){
	returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}
