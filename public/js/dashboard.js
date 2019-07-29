const electron = require('electron');
WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const url  = require('url');
const { ipcRenderer} = electron;
const {BrowserWindow} = electron.remote;
const sockets = {};
var frwdBookingViewW = [];
var fwdcalarr = [];
setTimeout(() => {
	ipcRenderer.send('mrkt', true);
},1000);
ipcRenderer.on('marketCurrencyd', (e, detail) => {
	document.getElementById("token").innerHTML = detail.token;
	document.getElementById("user").title = detail.name;
	document.getElementById("fullname").innerHTML = "Logout"+"("+detail.name+")";
	const table = document.getElementById('marketRate').getElementsByTagName('tbody')[0];
	for (var i = 0; i < detail.mrkc.length; i++) {
		var row = table.insertRow(-1);
		const currency = detail.mrkc[i].currency;
		var newcell = row.insertCell(0);
		newcell.innerHTML = "<a>"+currency+"</a>";
		currency_dom_dict = ['bid-rate', 'ask-rate', 'high-rate', 'low-rate'];
		currency_dom_dict.forEach(function(d, index){
			var newcell = row.insertCell(index+1);
			newcell.id  = `${currency}-${d}`;
			newcell.className = "text-center";
		});
		establish_ws_connection(currency, detail.token);
	}
	var tbl = document.getElementById('marketRate');
		for (var i = 0; i < tbl.rows.length; i++) {
            for (var j = 0; j < tbl.rows[i].cells.length - 4; j++)
                tbl.rows[i].cells[j].onclick = function () { getval(this); };
        }
    var token = detail.token;

	function getval(cel){
		if(cel.innerHTML!=="Currency"){
			if(navigator.onLine){
				ipcRenderer.send("currency:token", {"currency": cel.textContent, "token": token})
				frwdBookingView(cel.textContent);
			}else{
				offline();
			}
		}else{}
	}
});
const frwdBookingView = (frwdbking) => {
	let frwdBookingViewWW = new BrowserWindow({ 
		icon : path.join(__dirname, '../media/png/favicon.ico'),
		title : frwdbking+" Forward",
		height: 570, 
		width: 290,
		center: true, 
		maximizable: false,
		minimizable:false,
		resizable: false,
		alwaysOnTop:true,
		webPreferences: {nodeIntegration: true} 
	});
	frwdBookingViewW.push(frwdBookingViewWW);
	frwdBookingViewWW.loadURL(url.format({
		pathname: path.join(__dirname , "/../views/frwdbking.html"),
		protocol: 'file:',
		slashes: true,
	}));
	// frwdBookingViewWW.webContents.openDevTools()
	frwdBookingViewWW.removeMenu();
};


// If issue in market rate

function establish_ws_connection(currency, key) {
	console.log(currency);
	sockets[currency] = new WebSocket(`wss://api.finbyz.com/ws/spot/${currency}`, {
		headers : {
			"authorization": "token "+key,
			"Content-Type": 'application/x-www-form-urlencoded'
		}
	});
	sockets[currency].onopen = event => {
	   document.getElementById("reload").classList.remove("active");
	   document.getElementById("drag-bar").style.width = "120px";
	}
	sockets[currency].onmessage = event => {
		const data = JSON.parse(event.data);
		if('updates' in data){
			data.updates.forEach((row, index) => {
				if(row.key != 'open-rate' && row.key != 'close-rate'){
					const spot_rate_dom = document.getElementById(`${data.currency}-${row.key}`);
					spot_rate_dom.innerHTML = row.rate;
					if(row.color){
						update_classes(spot_rate_dom, row.color);	
					}
				}
			});
		}
	}
	
	sockets[currency].onerror = function(error) {
		//console.log(`[error] ${error.message}`);
		sockets[currency].close();
	    document.getElementById("reload").className = "reload right-align active";
	    document.getElementById("drag-bar").style.width = "80px";
	};

	try{
		sockets[currency].onclose = event => {
			// console.log(event);
			if (event.wasClean) {
				console.log(`[Closed] Connection closed cleanly, code=${event.code}`);
			    // document.getElementById("reload").className = "active";
			    setTimeout(function() {
					establish_ws_connection(currency,key);
				}, 1000);
			} else {
				console.log(`[Closed]. Reconnect will be attempted in 1 second. code=${event.code}`);
				setTimeout(function() {
					establish_ws_connection(currency,key);
				}, 1000);
			}
		}
	}catch(e){
		console.log(e);
	}
};



function update_classes(dom_element, color) {
	const bg_color_map = {
		'red': 'bg-red',
		'green': 'bg-green',
	};
	dom_element.className = bg_color_map[color];
	setTimeout(() => {
		dom_element.classList.remove(bg_color_map[color]);
		dom_element.className = "text-center";
	}, 3000);
};

// end issue market rate


document.getElementById('logout').addEventListener("click", () => {
	logout();
});

function logout(){
	try{
		closingWindow();
		ipcRenderer.send("logout", true);
	}catch(e){
		ipcRenderer.send("logout", true);
	}
};

document.getElementById("reload").addEventListener("click", (event) => {
	reconnect_ws();
});

function OfflineStatus(){
   
   document.getElementById("reload").classList.add("active");
    document.getElementById("drag-bar").style.width = "80px";
   offline();
}
window.addEventListener('offline', OfflineStatus);

window.addEventListener('online', function(){
	reconnect_ws();
});

function reconnect_ws(){
	if(navigator.onLine){
		const table = document.getElementById('marketRate').getElementsByTagName('tbody')[0];
		const table_children = table.children;
		const token = document.getElementById('token').textContent;

		for(var i = 0; i < table_children.length; i++){
			const currency = table_children[i].children[0].textContent;
			establish_ws_connection(currency, token);
		}
	   document.getElementById("reload").classList.remove("active");
	    document.getElementById("drag-bar").style.width = "120px";

	} else {
		offline();
	}
}

const offline = () => {
	ipcRenderer.send("offline",true);
};

const closingWindow = () =>{
	const tr = document.getElementById('marketRate').getElementsByTagName('tbody')[0].getElementsByTagName("tr");
	for (var k = 0; k < tr.length; k++) {
		tr[k].innerHTML = "";
	}
	for(var j = 0 ; j < fwdcalarr.length; j++){
		fwdcalarr[j].close();
	}
	for(var i = 0; i < frwdBookingViewW.length; i++){
		frwdBookingViewW[i].close();
	}
};

const frwdcal = () => {
	let frwdcalculator = new BrowserWindow({ 
		icon : path.join(__dirname, '../media/png/favicon.ico'),
		title : " Forward Calculator",
		height: 255,
		width: 342,
		center: true, 
		maximizable: false,
		minimizable:false,
		resizable: false,
		alwaysOnTop:true,
		webPreferences: {nodeIntegration: true} 
	});
	fwdcalarr.push(frwdcalculator);
	frwdcalculator.loadURL(url.format({
		pathname: path.join(__dirname , "/../views/frwdcal.html"),
		protocol: 'file:',
		slashes: true,
	}));
	// frwdcalculator.webContents.openDevTools();
	frwdcalculator.removeMenu();
};

document.getElementById("fwdcal").addEventListener("click", (event) => {
	event.preventDefault();
	if(navigator.onLine){
		frwdcal();
	}else{
		offline();
	}
});			
document.getElementById("currency").addEventListener("click", (event) => {
	event.preventDefault();
	// closingWindow();
	if(navigator.onLine){
		ipcRenderer.send("currency", {redirect: true});
	}else{
		offline();
	}
});
electron.remote.powerMonitor.on('resume', () => {
	reconnect_ws();
	// console.log("Resume");
});
document.getElementById('minus').addEventListener("click" , () => {
	// console.log("minus");
	reconnect_ws();
});