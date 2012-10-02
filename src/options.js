// Saves options to localStorage.
function save_options() {
  localStorage.setItem("settings_rotten_api_key", $("#rotten_api_key").val());

  // Update status to let user know options were saved.
  $('#status').html("Options Saved.");
  setTimeout(function() {
	  $('#status').html("");
  }, 2500);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var api_key = localStorage.getItem("settings_rotten_api_key");
  if (!api_key) {
    return;
  }
  $("#rotten_api_key").val(api_key);
}



$(function(){
	restore_options();
	$('#btn_save').click(function(){
		save_options();
		return false;
	});
});

console.log('siin');