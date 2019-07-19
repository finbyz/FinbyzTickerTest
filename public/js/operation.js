const {remote,shell} = require('electron');
//close
document.getElementById('close').addEventListener("click" , () => {
	remote.app.quit();
});
//minimize
document.getElementById('minus').addEventListener("click" , () => {
	remote.getCurrentWindow().minimize();
});

document.getElementById('finbyz').addEventListener("click", (event) => {
	event.preventDefault();
	shell.openExternal("https://www.finbyz.com/market-rate/");
});

var el = document.getElementById('user');
if(el){
  el.addEventListener("click", (e) => {
	e.preventDefault();
	document.getElementById('menubar').classList.toggle("active");	
	document.getElementById('user').classList.toggle("active");	
});
}
/*document.getElementById('user').addEventListener("click", (e) => {
	e.preventDefault();
	document.getElementById('menubar').classList.toggle("active");	
	document.getElementById('user').classList.toggle("active");	
});*/
