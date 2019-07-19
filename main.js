'use strict';
const url 	= require("url");
const path  = require("path");
const querystring = require('querystring');
const fetch = require('request');
const fs = require('fs');
const updater = require('electron-simple-updater');
const {app , BrowserWindow, ipcMain, dialog} = require('electron');
let mainWindow = null;
app.on("ready", () => {

	// Check for Updates from github
	updater.init('https://raw.githubusercontent.com/finbyz/FinbyzTickerTest/master/updates.json');
	  updater.on('update-downloaded', () => {
	  	const options = {
		    buttons: ["ok"],
		    defaultId: 0,
		    title: 'Finbyz Ticker Updated!',
		    message: "v1.9.0",
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

	//mainWindow.webContents.openDevTools()
	mainWindow.removeMenu();

	// Login Module
	let loginUri  = "https://api.finbyz.com/api/login/";
	ipcMain.on('auth', (e, info) => {
		e.preventDefault();
		var user = {
			username: info.user,
			password: info.pass
		};
		var auth = querystring.stringify(user);
		if( (user.username=="" || user.username=="undefined") && (user.password=="" || user.password=="undefined") ){
			e.sender.send("empty", true);

		}else{
			userLogin(auth, loginUri);
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
					let tu = token.split("+");
					let tkn = tu[0];
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

					marketRate(tkn,name);
				}
			});
		}
	});

	ipcMain.on("mrkt1", (event, detail) => {
		if(detail){
			fs.readFile(process.env.APPDATA+"/finbyz/temp.config","utf-8",(err, token) => {
				if(!token){
					login();
				}else{
					dashboard();
					let tu = token.split("+");
					let tkn = tu[0];
					let name = tu[1];

					marketRate(tkn,name);

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

	const currency = (tkn) => {
		mainWindow.loadURL(url.format({
			pathname: path.join(__dirname , "/public/views/currency.html"),
			protocol: 'file:',
			slashes: true,
		}));
		
		let key = tkn;
		let deviceType = {
			"device_type":"desktop",
		};
		let finalDevice = querystring.stringify(deviceType);
		let uri = "https://api.finbyz.com/api/select-currencies/";
		fetch({
			uri: uri,
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'token '+ key
			},
			body: finalDevice,
		}, (err, res, body) => {
			let curr = JSON.parse(body);
			if(curr.status){
				ipcMain.on("ping", (event, detail) => {
					if(detail){
						event.sender.send("currency", {curr: curr, token: tkn});
						curr =  "";
					}
				});
			}

		})
	};

	// Login Method

	const userLogin = (user, url) => {
		fetch({
		    uri: url,
		    method: 'POST',
		    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		    body: user
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
		let marketUri = "https://api.finbyz.com/api/market-rate/";
		let key = token;
		let deviceType = {
			"device_type":"desktop",
		};
		let finalDevice = querystring.stringify(deviceType);
		fetch({
			uri: marketUri,
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'token '+key
			},
			body: finalDevice,
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

	const setCurrecy = (curr, tkn) => {
		let currUri = "https://api.finbyz.com/api/select-currencies/";
		let currencies = curr;
		let key = tkn;
		let deviceType = {
			"device_type":"desktop",
			"currencies": currencies
		};
		let finalDevice = querystring.stringify(deviceType);
		fetch({
		uri: currUri,
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'token '+key
		},
		body: JSON.stringify(deviceType),
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

	const currencyCalc = (tkn, e) => {
		let calUri = "https://api.finbyz.com/api/forward-calculator/";
		let key = tkn;
		try{
			fetch({
				uri: calUri,
				method: "POST",
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': 'token '+key
				},
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

	const calCurrecy = (uri, data, token, e) =>{
		try{
			fetch({
				uri: uri,
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'token '+token
				},
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
			fetch({
				uri: "https://api.finbyz.com/api/check-subscription/",
				method: "POST",
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': 'token '+token
				},
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