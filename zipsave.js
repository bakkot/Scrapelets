(function(global){global.zipsave = function(files, name, err, done) {
  var MAX_READERS = 8;
  var zip = new JSZip();
  if (typeof err !== 'function') {
    err = function(e){console.log(e);};
  }
  if (typeof done !== 'function') {
    done = function(zip){
      saveAs(zip.generate({type: 'blob'}), name);
    };
  }
  var completed = 0, total = files.length;
  
  function add(name, data) {
    zip.file(name, data);
    ++completed;
    next();
  }
  function addBlob(name, blob) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
      add(name, this.result);
    }
    fileReader.onerror = err;
    fileReader.readAsArrayBuffer(blob);
  }
  
  function next() {
    if (completed === total) {
      done(zip);
      done = function(){};
    } else if (files.length > 0) {
      var desc = files.pop();
      if (desc.data) {
        var data = desc.data;
        if (data instanceof Blob) {
          addBlob(desc.name, desc.data);
        } else if (data instanceof HTMLElement && data.nodeName === 'CANVAS') {
          c.toBlob(function(blob) {
            addBlob(desc.name, blob);
          }); 
        } else {
          add(desc.name, desc.data);
        }
      } else if (desc.url) {
        var req = new XMLHttpRequest();
        req.open('GET', desc.url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        req.responseType = 'arraybuffer';
        req.onload = function() {
          if (!req.response) {
            err('Could not retrieve resource.');
            return;
          }
          add(desc.name, req.response);
        };
        req.onerror = err;
        req.send();
      } else {
        err('Descriptor lacks a data or url property.');
      }
    }
  }
  
  for (var i = 0; i < MAX_READERS; ++i) {
    next();
  }
}})(this);