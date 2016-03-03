
var playlist_url = "";
var maintitle = "";
var cover_url = "";
function onDownloadBook(){
    self.port.emit("DownloadBook", {title:maintitle,playlist_url:playlist_url,cover_url:cover_url});
}

self.port.on("Message",onMessage);
self.port.on("Progress", onProgress);

function onMessage(msg){
    parentNode=document.getElementById("playlistcode").parentNode;
	parentNode.appendChild(document.createElement("br"));
    parentNode.appendChild(document.createTextNode(msg));
}

function onProgress({value,max}){
	var pbelement = document.getElementById("download-progress");
	showDownloadingState(value>=0);
	pbelement.setAttribute("value",value);
	pbelement.setAttribute("max",max);
}
function showDownloadingState(state){
	var pbelement = document.getElementById("download-progress");
	var download_button = document.getElementById("download-button");
	if (state == true){
		pbelement.style.display = 'block';
		download_button.style.display = 'none';
	}else{
		pbelement.style.display = 'none';	
		download_button.style.display = 'block';
	}
}
function pllink(){
    var fl_var = document.getElementsByName("flashvars")[0];
    if (typeof(fl_var) != "undefined" ){
		cover_url = document.getElementsByClassName("b-searchpost__cover_image")[0].getAttribute("src");
        maintitle = document.getElementsByClassName("b-maintitle")[0].innerHTML;
        maintitle = maintitle.replace(/\"/g,"'").replace(/\?/g,".").replace(/:/g,"-").trim();
        playlist_url = fl_var.value.split('&')[1].split('=')[1];
        
		var download_button= document.createElement("input");
		download_button.id = "download-button";
        download_button.type = "button";
        download_button.onclick=onDownloadBook;
        download_button.setAttribute("value", "Download Book");
        var parent_element = document.getElementById("playlistcode").parentNode;
		parent_element.appendChild(download_button);
		
		var pb = document.createElement("progress");
		pb.setAttribute("id","download-progress");
		pb.style.display = 'none';
		parent_element.appendChild(pb);

    }
}

eval(pllink());

