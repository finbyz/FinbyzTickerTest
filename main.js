'use strict';
const url 	= require("url");
const path  = require("path");
const querystring = require('querystring');
const fetch = require('request');
const fs = require('fs');
const updater = require('electron-simple-updater');
const {app , BrowserWindow, ipcMain, dialog} = require('electron');
const electron = require('electron');
let mainWindow = null;
app.on("ready", () => {
	

	// Check for Updates from github

	console.log(process.platform);
	switch(process.platform){
		case "win32":
			if(process.arch==="x64"){
				console.log("This is 64");
				setTimeout(() => {
					updater.init('https://raw.githubusercontent.com/finbyz/FinbyzTicker/master/updates.json');
				},1000);
			}else{
				console.log("This is 32");
				setTimeout(() => {
					updater.init('https://raw.githubusercontent.com/finbyz/FinbyzTicker/master/updates32.json');
				},1000);
			}
			break;
		default: 
			console.log("System is not Window");
	}

	  updater.on('update-downloaded', () => {
	  	const options = {
		    buttons: ["ok"],
		    defaultId: 0,
		    title: 'Finbyz Ticker Updated!',
		    message: "v2.1.0",
		    detail: 'Finbyz Ticker App Updated Successfully!',
		  };

		  dialog.showMessageBox(null, options, (response) => {
		    if(!response){
		    	updater.quitAndInstall();
		    }
		  });
	  });

	  // To get Token from Local File System
	fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
		if(!token){
			login();
		}else{
			dashboard();
			let tu = token.split("+");
			var tkn = tu[0];
			var name  = tu[1];
			checkSubsciption(tkn, name);
		}
	});

	var display = require('electron').screen.getPrimaryDisplay();
	var width   = display.bounds.width;	
	var height  = display.bounds.height;
	mainWindow = new BrowserWindow({
		icon : path.join(__dirname, '/public/media/png/favicon.ico'),
		height: 195, 
		width: 335,
		x: width - 340,
		y: height - 240,
		center: true, 
		resizable: false,
		alwaysOnTop:true,
		frame: false,
		webPreferences: {nodeIntegration: true}
	});

	// mainWindow.webContents.openDevTools()
	mainWindow.removeMenu();

	// Login Module
	let loginUri  = "https://api.finbyz.com/api/login/";
	ipcMain.on('auth', (e, info) => {
		e.preventDefault();
		var user_dict = {
			username: info.user,
			password: info.pass
		};
		if( (user_dict.username=="" || user_dict.username=="undefined") && (user_dict.password=="" || user_dict.password=="undefined") ){
			e.sender.send("empty", true);

		}else{
			userLogin(user_dict, loginUri);
		}
	});

	// Sending Currency and rate

	ipcMain.on("currency:token", (e, data) => {
		ipcMain.on('check', (e, detail) => {
			if(detail){
				if(data!==""){
					e.sender.send("currency:token", data);
					data = "";
				}
			}
		});
	});

	ipcMain.on("ping", (event,status) => {
		if(status){
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
					let tkn = token.split("+")[0];
					currencyCalc(tkn, event);
				}
			});
		}
	});

	ipcMain.on("marketRedirect", (event, detail) => {
		if(detail){
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
					dashboard();
					let tu = token.split("+");
					let tkn = tu[0];
					let name = tu[1];

					marketRate(tkn, name);
				}
			});
		}
	});

	ipcMain.on("currency", (event,detail) => {
		if(detail.redirect){
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
					let tu = token.split("+");
					let tkn = tu[0];

					currency(tkn);
				}
			});
		}
	});

	ipcMain.on("selected:curr", (event, detail) => {
		if(detail.status){
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
			        let tu = token.split("+");
					let tkn = tu[0];

					setCurrecy(detail.curr,tkn);
				}
			});
		}
	});

	ipcMain.on("calculate", (event, detail) => {
		if(detail.status){
			let uri = "https://api.finbyz.com/api/forward-calculator/calculate";
			let data ={
				'currency': detail.curr, 
				"transaction": detail.trans,
				"from_date": detail.sd, 
				"to_date": detail.ed
			}
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
					let tu = token.split("+");
					let tkn = tu[0];
					calCurrecy(uri,data,tkn,event);
				}
			});
		}
	});

	ipcMain.on("isErrorQuit", (e, detail) => {
		if(detail){
			app.quit();
		}
	});

	// When User Logout

	ipcMain.on("logout", (e, data) => {
		if(data){
			login();
			try{
				fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {});
			}catch(err){
				console.log(err);	
			}
		}
	});
	
	ipcMain.on("offline", (e, detail) => {
		const options = {
		    type: 'error',
		    buttons: ["ok"],
		    defaultId: 0,
		    alwaysOnTop: true,
		    title: 'Internet Connection Error!',
		    message: "Please check your internet connection and try again!",
		  };

		  dialog.showMessageBox(
		  	new BrowserWindow({
				show: false,
				alwaysOnTop: true
			}),
		  	options, (response) => {
		    console.log(response);
		  });
	});

});


/*
	-----------
	Method Body
	-----------

*/

// Dashboard Method 

const dashboard = () => {
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname , "/public/views/dashboard.html"),
		protocol: 'file:',
		slashes: true,
	}));
};

// Login Method

const login = () => {
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname , "/public/views/login.html"),
		protocol: 'file:',
		slashes: true,
	}));
};

const currency = (token) => {
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname , "/public/views/currency.html"),
		protocol: 'file:',
		slashes: true,
	}));
	
	let params = {
		"device_type":"desktop",
	};

	let endpoint = "https://api.finbyz.com/api/select-currencies/";
	fetch({
		uri: endpoint,
		method: "POST",
		headers: get_headers(token),
		body: JSON.stringify(params),
	}, (err, res, body) => {
		let curr = JSON.parse(body);
		if(curr.status){
			ipcMain.on("ping", (event, detail) => {
				if(detail){
					event.sender.send("currency", {curr: curr, token: token});
					curr =  "";
				}
			});
		}

	})
};

// Login Method

const userLogin = (user_dict, url) => {
	fetch({
	    uri: url,
	    method: 'POST',
	    headers: get_headers(''),
	    body: JSON.stringify(user_dict)
	}, (err, res, body) =>  {
	    // if(err) throw err;
	    try{
		    if(JSON.parse(body).token){
			    let authUser = JSON.parse(body).full_name;
			    let token    = JSON.parse(body).token;
			    let content = "";
			    fs.writeFile(process.env.APPDATA+'/finbyz/temp.config',token+"+"+authUser,(err) => {
			    	if(err) throw err;
			    	fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
						if(err) throw err;
					    dashboard();
					    let tu = token.split("+");
						let tkn = tu[0];
						let name = tu[1];
						marketRate(tkn,name);
					});
			    });
	    	}else{
		    	let err = JSON.parse(body);
		    	mainWindow.webContents.send("error",err.message);
	    	}
	    }catch(e){
	    	const options = {
			    type: 'error',
			    buttons: ["ok"],
			    defaultId: 0,
			    title: 'Error!',
			    message: 'Server Error (500)',
			    detail: 'Failed to Connect with server.',
			  };

			  dialog.showMessageBox(
			  	new BrowserWindow({
					show: false,
					alwaysOnTop: true
				}), 
				options, (response) => {
			    console.log(response);
			  });
	    }
    });
};

// Market Currency
const marketRate = (token, name) => {
	let endpoint = "https://api.finbyz.com/api/market-rate/";
	let params = {
		"device_type":"desktop",
	};
	
	fetch({
		uri: endpoint,
		method: "POST",
		headers: get_headers(token),
		body: JSON.stringify(params),
	}, (err, res, body) => {
		try{
			let marketCurrency = JSON.parse(body);
			if(marketCurrency.status){
				ipcMain.on("mrkt", (e, detail) => {
					if (marketCurrency != '' || marketCurrency != "undefined" || marketCurrency != undefined){
						mainWindow.webContents.send("marketCurrencyd", {mrkc: marketCurrency.data, token: token, name:name});
						marketCurrency = "";
					}
				});
			}else{
				var count = 0;
				function mrkCurr () {
					if(count <= 3){
						ipcMain.on("mrkt", (e, detail) => {
							mainWindow.webContents.send("marketCurrencyd", {mrkc: marketCurrency.data, token: token, name: name});
						});
						count++;
					}else{
						clearInterval(timerId);
						login(); 	
						fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {
						  if (err) throw err;
						});
						count = 0;
					}
				}
				var timerId = setInterval(mrkCurr,5000);
			}
		}catch(e){
			const options = {
			    type: 'error',
			    buttons: ["ok"],
			    defaultId: 0,
			    title: 'Error!',
			    message: 'Server Error (500)',
			    detail: 'Failed to Connect with server.',
			  };

			  dialog.showMessageBox(
			  	new BrowserWindow({
					show: false,
					alwaysOnTop: true
				}),
				options, (response) => {
			    	console.log(response);
			  	});
			login(); 	
			fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {
			  if (err) throw err;
			});
		}
	});
};

const setCurrecy = (currencies, token) => {
	let endpoint = "https://api.finbyz.com/api/select-currencies/";
	let params = {
		"device_type": "desktop",
		"currencies": currencies
	};

	fetch({
		uri: endpoint,
		method: "PUT",
		headers: get_headers(token),
		body: JSON.stringify(params),
	}, (err, res, body) => {
		let status = JSON.parse(body);
		if(status.status){
		const options = {
		    type: 'info',
		    buttons: ["OK"],
		    defaultId: 0,
		    title: 'Updated',
		    message: "Currency Update Successfully",
		  };
		  dialog.showMessageBox(null, options, (response) => {
		    if(!response){
		    	// app.quit();
		    	// app.relaunch();
		    }
		  });
		}
	});
};

const currencyCalc = (token, e) => {
	let endpoint = "https://api.finbyz.com/api/forward-calculator/";
	try{
		fetch({
			uri: endpoint,
			method: "POST",
			headers: get_headers(token),
		}, (err, res, body) => {
			let data = JSON.parse(body);
			if(data.status){
				let currencies = data.data.currencies;
				e.sender.send("currencies", currencies);
			}

		});
	}catch(e){
		app.quit();
		app.relaunch();
	}
};

const calCurrecy = (endpoint, data, token, e) =>{
	try{
		fetch({
			uri: endpoint,
			method: "POST",
			headers: get_headers(token),
			body: JSON.stringify(data),
		}, (err, res, body) => {
			if(JSON.parse(body).status){
				e.sender.send("result", {data:JSON.parse(body).data, status: true});
			}else{
				e.sender.send("error", JSON.parse(body).error_message);
			}
		});
	}catch(e){
		app.quit();
		app.relaunch();
	}
};

const checkSubsciption = (token, name) => {
	try{
		let endpoint = "https://api.finbyz.com/api/check-subscription/";
		fetch({
			uri: endpoint,
			method: "POST",
			headers: get_headers(token),
		}, (err, res, body) => {
			try{
				let response = JSON.parse(body);
				if(response.status){
					try{
						marketRate(token,name);
					}catch(e){
						console.log(e);
					}
				}else if(res.statusCode === 401){
					login();
				const options = {
				    type: 'info',
				    buttons: ["ok"],
				    defaultId: 0,
				    title: 'Subsciption',
				    message: 'Your Subsciption period is ended.',
				    detail: '',
			 	};
				  dialog.showMessageBox(null, options, (response) => {
				    console.log(response);
				  });
				  fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {
					if (err) throw err;
				  });
				}
			}catch(e){
				fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {
				  if (err) throw err;
				});
				login();
			}
		});
	}catch(e){
		fs.unlink(process.env.APPDATA+'/finbyz/temp.config', (err) => {
		  if (err) throw err;
		});
		app.quit();
	}
};

const get_headers = (token) => {
	let headers = {
		'Content-Type': 'application/json',
		'Device': "desktop",
		'User-Agent': mainWindow.webContents.getUserAgent()
	}
	if(token){
		headers["Authorization"] = 'token ' + token
	}
	return headers
}