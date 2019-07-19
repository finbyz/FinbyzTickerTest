const electron = require('electron');
const {ipcRenderer} = electron;
setTimeout(() => {
	ipcRenderer.send("ping", true);
}, 1000);

ipcRenderer.on("currency", (event, detail) => {
	showCurrency(detail.token, detail.curr);
});

const showCurrency = (token, curr) => {
	const table = document.getElementById('currencytable').getElementsByTagName('tbody')[0];
	const currency = curr.data;	
	for (var i = 0; i < curr.data.length; i++) {
		if(i % 4 ==  0){
			var	row = table.insertRow(-1);
		}
		var cell = row.insertCell(-1);
		if(curr.data[i].selected){
			cell.innerHTML = "<input type = 'checkbox' value = '"+currency[i].id+"' checked>"+currency[i].currency;
		}else{
			cell.innerHTML = "<input type = 'checkbox' value = '"+currency[i].id+"'>"+currency[i].currency;
		}
	}
};

document.getElementById("save").addEventListener("click", (event) => {
	event.preventDefault();
	let checkbox = document.getElementById('form').getElementsByTagName('input');
	let checkboxlen = checkbox.length;
	var count = [];
	var curr = []; 
	for (var i = 0; i < checkboxlen; i++) {
		if(checkbox[i].checked){
			count.push(i);
			curr.push(checkbox[i].value);
		}
	}
	if(count.length === 5){
		if(navigator.onLine){
			ipcRenderer.send("selected:curr", {curr: curr, status: true});
			setTimeout(() => {
				ipcRenderer.send("marketRedirect", true);
			}, 1000);
		}else{
			offline();
		}
	}else{
		alert("Please select exact 5 currencies !");
	}
});

document.getElementById("marketrate").addEventListener("click", (event) => {
	ipcRenderer.send("marketRedirect", true);
});
document.getElementById('logout').addEventListener("click", () => {
	logout();
});

function logout(){
	try{
		ipcRenderer.send("logout", true);
	}catch(e){
		ipcRenderer.send("logout", true);
	}
};
window.addEventListener('offline', OfflineStatus);

const offline = () => {
	ipcRenderer.send("offline",true);
};
function OfflineStatus(){
   offline();
}
