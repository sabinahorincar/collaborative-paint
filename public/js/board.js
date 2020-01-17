function Board(boardname, canvas) {
    this.canvas = canvas;
    this.boardname = boardname;
    this.history = { undo_list: [], redo_list: [] };
}

Board.prototype.init = function() {
    this.context = this.canvas.getContext('2d');
    this.saveState();
}

Board.prototype.getCanvas = function() {
    return this.canvas;
}

Board.prototype.getContext = function() {
    return this.context;
}

Board.prototype.getName = function() {
    return this.boardname;
}

Board.prototype.setName = function(boardname) {
    this.boardname = boardname;
}

Board.prototype.getBackgroundColor = function() {
    return this.canvas.backgroundColor;
}

Board.prototype.clear = function() {
    this.saveState();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Board.prototype.draw = function(img) {
    this.context.drawImage(img, 0, 0);
}

Board.prototype.saveState = function(list, keep_redo) {
    keep_redo = keep_redo || false;
    //if(list && list.length > 3) list = [];  //keep only last 3 moves
    if (!keep_redo) this.history['redo_list'] = [];
    (list || this.history['undo_list']).push(this.canvas.toDataURL());
}

Board.prototype.undo = function() {
    if (this.history['undo_list'].length) {
        this.saveState(this.history['redo_list'], true);
        var restore_state = this.history['undo_list'].pop();
        var img = new Image();
        img.src = restore_state;
        //var img = new Element('img', {'src':restore_state});
        var parent = this;
        img.onload = function() {
            parent.context.clearRect(0, 0, parent.canvas.width, parent.canvas.height);
            parent.context.drawImage(img, 0, 0);
            //this.update();
        }
    }
}

Board.prototype.redo = function() {
    if (this.history['redo_list'].length) {
        this.saveState(this.history['undo_list'], true);
        var restore_state = this.history['redo_list'].pop();
        var img = new Image();
        img.src = restore_state;
        //var img = new Element('img', {'src': restore_state});
        var parent = this;
        img.onload = function() {
            parent.context.clearRect(0, 0, parent.canvas.width, parent.canvas.height);
            parent.context.drawImage(img, 0, 0);
            //this.update();
        }
    }
}


Board.prototype.save = function() {
    //localStorage.setItem(canvasname, canvas.toDataURL());
}

Board.prototype.resize = function() {
    // clear canvas
    this.clear();
    // set it to the new width & height and draw the current canvas into it
    var wrapper = document.getElementById('drawingboard-wrapper');
    this.context.width = parseFloat(getComputedStyle(wrapper).getPropertyValue('width'));
    this.context.height = parseFloat(getComputedStyle(wrapper).getPropertyValue('height'));
}

Board.prototype.update = function() {
    global.board.draw(this.getCanvas()); // copy pixels from canvas copy
    this.clear(); // clear canvas copy
}
