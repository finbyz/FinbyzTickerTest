const electron = require('electron');
WebSocket = require('ws');
const path = require('path');
const url  = require('url');
const sockets = {};
const {ipcRenderer} = electron;
ipcRenderer.send("check", true);
ipcRenderer.on("currency:token", (e, detail) =>{
	forwadBooking(detail.currency, detail.token);
});
function forwadBooking(currency, token){

	sockets[currency] = new WebSocket(`wss://api.finbyz.com/ws/fwd/${currency}`, {
		headers : {
			"authorization": "token "+token,
			"Content-Type": 'application/x-www-form-urlencoded'
		}
	});

	sockets[currency].onmessage = event => {
		const data = JSON.parse(event.data);
		// console.log(data);
		document.getElementById("cash_spot_bid").innerHTML = data.cash_spot_bid;
		document.getElementById("cash_spot_ask").innerHTML = data.cash_spot_ask;
		document.getElementById("cash_tom_bid").innerHTML = data.cash_tom_bid;
		document.getElementById("cash_tom_ask").innerHTML = data.cash_tom_ask;
		document.getElementById("spot_date").innerHTML = data.spot_date;
		document.getElementById("tom_date").innerHTML = data.tom_date;
		if('updates' in data){
			data.updates.forEach((row, index) => {
				document.getElementById(`${row.month}`).innerHTML = row.date;
				document.getElementById(`${row.month}-bid-point`).innerHTML = row.bid_point;
				document.getElementById(`${row.month}-ask-point`).innerHTML = row.ask_point;
				document.getElementById(`${row.month}-outright-bid`).innerHTML = row.outright_bid;
				document.getElementById(`${row.month}-outright-ask`).innerHTML = row.outright_ask;
				document.getElementById(`${row.month}-annual-bid`).innerHTML = row.annual_bid_percent;
				document.getElementById(`${row.month}-annual-ask`).innerHTML = row.annual_ask_percent;
			});
		}
	}

	sockets[currency].onclose = event => {
		if (event.wasClean) {
			console.log(`[Closed] Connection closed cleanly, code=${event.code}`);
		} else {
			console.log(`[Closed]. Reconnect will be attempted in 1 second. code=${event.code}`);
			try{
				setTimeout(function() {
					forwadBooking(currency, token);
				}, 1000);
			}catch(e){
				console.log(e);
				forwadBooking(currency, token);
			}
		}
	}
};