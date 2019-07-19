const electron = require('electron');
const {ipcRenderer} = electron;
ipcRenderer.send("ping", true);


document.getElementById('calculate').addEventListener("click", e => {
	e.preventDefault();
	const sd = document.getElementById("sd");
	const ed = document.getElementById("ed");
	if(sd.value==="" || ed.value===""){
		console.log("required");
		if(sd.value===""){
			document.getElementById("sd").style.borderColor = "rgba(220,20,60,0.5)";
		}else{}
		if(ed.value===""){
			document.getElementById("ed").style.borderColor = "rgba(220,20,60,0.5)";
		}
	}else{
		if(ed.value){
			if(sd.value!==""){
				const startdate = new Date(sd.value);
				const enddate = new Date(ed.value);
				if(startdate <= enddate || enddate >= startdate){
					// console.log("valid");
					let fwdcal = {
					 "curr" : document.getElementById("selectcurr").value,
					 "trans" : document.getElementById("transaction").value,
					 "sd" : sd.value,
					 "ed" : ed.value,
					 "status" :true
					}
					console.log(fwdcal);
					ipcRenderer.send("calculate", fwdcal);
				}else{
					document.getElementById("errormsg").innerHTML = "Invalid Date";
				}
			}
		}
	}
});
document.getElementById("sd").addEventListener("change", event => {
	const sd = document.getElementById("sd");
	const ed = document.getElementById("ed");
	if(sd.value){
		ed.value = sd.value;
	}else{
		sd.value = ed.value;
	}
});

document.getElementById("ed").addEventListener("change", event => {
	const sd = document.getElementById("sd");
	const ed = document.getElementById("ed");
	if(ed.value){
		if(sd.value!==""){
			const startdate = new Date(sd.value);
			const enddate = new Date(ed.value);
			if(startdate <= enddate || enddate >= startdate){
				// console.log("valid");
				document.getElementById("errormsg").innerHTML = "";
			}else{
				document.getElementById("errormsg").innerHTML = "Invalid Date";
			}
		}
	}
});
ipcRenderer.on("currencies", (event, detail) => {
	var select = document.getElementById("selectcurr");
	for (var i = 0; i < detail.length; i++) {
		select.innerHTML += "<option value = '"+detail[i].currency+"'>"+detail[i].currency+"</option>";
	}
});
ipcRenderer.on("result", (event,detail) => {
	if(detail.status){
		document.getElementById("errormsg").innerHTML = "";
		document.getElementById("result").style.display = "block";	
		document.getElementById("fp").innerHTML = detail.data.forward_points;
		document.getElementById("sr").innerHTML = detail.data.spot_rate;
		document.getElementById("fwp").innerHTML = detail.data.forward_period;
		document.getElementById("fr").innerHTML = detail.data.forward_rate;
		document.getElementById("sd").style.borderColor = "";
		document.getElementById("ed").style.borderColor = "";
	}
});
ipcRenderer.on("error", (event,detail) => {
	document.getElementById("errormsg").innerHTML = detail;
});
