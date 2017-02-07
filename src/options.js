// Saves options to localStorage.
function save_options() {
  localStorage.setItem("settings_meter_shows_whos_score", $("#meter_shows_whos_score").val());

  // Update status to let user know options were saved.
  $('#status').html("Options Saved.");
  setTimeout(function() {
	  $('#status').html("");
  }, 2500);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  let meter_shows_whos_score = localStorage.getItem("settings_meter_shows_whos_score");
  if (!meter_shows_whos_score) {
	meter_shows_whos_score = OPTIONS_METER_AVERAGE; 
	localStorage.setItem("settings_meter_shows_whos_score", meter_shows_whos_score);
  }
  $("#meter_shows_whos_score").val(meter_shows_whos_score);
}



$(function(){
	restore_options();
	$('#btn_save').click(function(){
		save_options();
		return false;
	});
});

