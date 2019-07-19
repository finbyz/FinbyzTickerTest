const electron = require('electron');
const {ipcRenderer} = electron;
const {BrowserWindow, dialog} = electron.remote;
const onLogin = document.getElementById('onLogin');

onLogin.addEventListener('click', (e) => {	
	e.preventDefault();
	const auth = {
		user: document.querySelector("#username").value,
		pass: document.querySelector("#password").value
	};
	ipcRenderer.send('auth', auth);
});

ipcRenderer.on("error", (e, error) => {
	if(error!==""){
		if(error==="Your subscription period has expired."){
			document.getElementById("username").value = "";
			document.querySelector("#password").value = "";
			document.getElementById("username").style.borderColor = "rgba(220,20,60,0.5)";
			document.getElementById("password").style.borderColor = "";
			document.querySelector("#username").focus();
		}else if(error === "Username or Password is incorrect"){
			document.getElementById("username").style.borderColor = "rgba(220,20,60,0.5)";
			document.getElementById("password").style.borderColor = "rgba(220,20,60,0.5)";
		}
		show_dialoug(error);
	}
});

const clear = document.getElementById('Clear');

clear.addEventListener("click", (e) => {
	e.preventDefault();
	document.getElementById("username").style.borderColor = "";
	document.getElementById("password").style.borderColor = "";
	document.querySelector("#username").value = "" ;
	document.querySelector("#password").value = "";
	document.querySelector("#username").focus();	
});

ipcRenderer.on("serverError", (e, detail) => {
	if(detail){
		show_dialoug("Something Went Wrong!");
		ipcRenderer.send("isErrorQuit", true);
	}
});

ipcRenderer.on("empty", (event, detail) => {
	document.getElementById("username").style.borderColor = "rgba(220,20,60,0.5)";
	document.getElementById("password").style.borderColor = "rgba(220,20,60,0.5)";
});

function show_dialoug(message) {
	console.log(message)
	const options = {
	    type: 'error',
	    buttons: ["ok"],
	    defaultId: 0,
	    alwaysOnTop: true,
	    title: 'Error!',
		message: message
	};

	dialog.showMessageBox(new BrowserWindow({
		show: false,
		alwaysOnTop: true
	}),
  	
  	options, (response) => {
    	console.log(response);
	});
}