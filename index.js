var self = require('sdk/self');
const { Cc, Ci, Cu } = require('chrome');

Cu.import("resource://gre/modules/Downloads.jsm");
Cu.import("resource://gre/modules/osfile.jsm");
Cu.import("resource://gre/modules/Task.jsm");

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;

// Import the page-mod API
var pageMod = require("sdk/page-mod");
 
url_filter = /.*asbook.net\/.*\.html$/
// Create a page-mod
// It will run a script whenever a ".org" URL is loaded
// The script replaces the page contents with a message
pageMod.PageMod({
    include: url_filter,
    contentScriptFile : "./myscript.js", 
//	contentScript: ' document.body.style.border = "5px solid red";',
    onAttach : startListen 
});

function startListen(worker){
    worker.port.on("DownloadBook",function(worker_data){ onDownloadBook(worker_data,worker)});
}

function onDownloadBook({title,playlist_url,cover_url},worker){
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	var windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Ci.nsIWindowMediator);
	var window = windowMediator.getMostRecentWindow(null);
	fp.init(window, "Select a target directory", nsIFilePicker.modeGetFolder);
	var retval = fp.show();
	if (retval == nsIFilePicker.returnOK || retval == nsIFilePicker.returnReplace){
		worker.fpath = OS.Path.join(fp.file.path,title);
	}else{
		return;
	}
	OS.File.makeDir(worker.fpath).then( function(){ 
		worker.urls = new Array();
		worker.urls.push(cover_url);
		downloadPlayList(playlist_url,worker);
	}, function(){worker.port.emit("Message", "makeDir failed")} );
	worker.port.emit("Progress",{value:0,max:1});
 }

function downloadPlayList(playlist_url,worker){
    var Request = require("sdk/request").Request;
    playlistRequest = Request({
        url : playlist_url,
        onComplete : function(content){onPlaylistDownloaded(content,worker);}
    });
    playlistRequest.get();
}

function onPlaylistDownloaded(playlistContent,worker){
    JSON.parse(playlistContent.text, function(k,v){if (k=="file")worker.urls.push(v)});
	worker.urls_cnt = worker.urls.length;
	worker.progress = 0;
	DownloadFiles(worker);
}

function DownloadFiles(worker){
    var url = worker.urls.splice(0,1)[0];
	var fname_match = url.match(/\d+.mp3/);
	var fname;
	if (fname_match == null){ // cover	
		fname = "cover.jpg";
	}else{
		fname = fname_match[0];
	}
    mytarget_path = OS.Path.join(worker.fpath, fname);	
	worker.progress++;
	Task.spawn(function(){ yield Downloads.fetch(url,mytarget_path); }).then(
		function(){
			worker.port.emit("Progress",{value:worker.progress,max:worker.urls_cnt});
			if (worker.urls.length!=0){
				DownloadFiles(worker);
			} else {
				worker.port.emit("Progress",{value:-1,max:worker.urls_cnt});
			}
		},
		function(downloadError){
			worker.port.emit("Message", "Downloads.fetch failed! " + downloadError);
		} ); 
 }
