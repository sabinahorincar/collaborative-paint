// pencil tool
//---------------------------------------------------------------------------------------
function PencilTool(board) {
    this.toolname = 'pencil';
    this.color = '#000000';
    this.size = 3;
    this.in_use = false;
    this.board = board;
}

PencilTool.prototype.mousedown = function(mousePos) {
    global.board.saveState();
    this.in_use = true;
    this.board.getContext().beginPath();
    this.board.getContext().moveTo(mousePos.x, mousePos.y);
}

PencilTool.prototype.mousemove = function(mousePos) {
    this.board.getContext().lineTo(mousePos.x, mousePos.y);
    this.board.getContext().lineWidth = this.size;
    this.board.getContext().strokeStyle = this.color;
    this.board.getContext().stroke();
    this.board.update();
}

PencilTool.prototype.mouseup = function(mousePos) {
    global.board.saveState();
    this.in_use = false;
}

PencilTool.prototype.getExtra = function() {
    extra = {}
    extra['color'] = this.color;
    extra['size'] = this.size;
    return extra;
}

PencilTool.prototype.setExtra = function(extra) {
    this.color = extra['color'];
    this.size = extra['size'];
}

// line tool
//---------------------------------------------------------------------------------------
function LineTool(board) {
    this.toolname = 'line';
    this.color = '#000000';
    this.size = 3;
    this.in_use = false;
    this.board = board;
    this.startX = 0;
    this.startY = 0;
}

LineTool.prototype.mousedown = function(mousePos) {
    global.board.saveState();
    this.in_use = true;
    this.startX = mousePos.x;
    this.startY = mousePos.y;
}

LineTool.prototype.mousemove = function(mousePos) {
    this.board.clear();

    this.board.getContext().beginPath();
    this.board.getContext().moveTo(this.startX, this.startY);
    this.board.getContext().lineTo(mousePos.x, mousePos.y);
    this.board.getContext().lineWidth = this.size;
    this.board.getContext().strokeStyle = this.color;
    this.board.getContext().stroke();
    this.board.getContext().closePath();
}

LineTool.prototype.mouseup = function(mousePos) {
    this.board.update();
    global.board.saveState();
    this.in_use = false;
}

LineTool.prototype.getExtra = function() {
    extra = {}
    extra['color'] = this.color;
    extra['size'] = this.size;
    return extra;
}

LineTool.prototype.setExtra = function(extra) {
    this.color = extra['color'];
    this.size = extra['size'];
}

//---------------------------------------------------------------------------------------

// rectangle tool
//---------------------------------------------------------------------------------------
function RectangleTool(board) {
    this.toolname = 'rectangle';
    this.color = '#000000';
    this.size = 3;
    this.fill = false;
    this.in_use = false;
    this.board = board;
    this.startX = 0;
    this.startY = 0;
}

RectangleTool.prototype.mousedown = function(mousePos) {
    global.board.saveState();
    // save the starting x/y of the rectangle
    this.startX = mousePos.x;
    this.startY = mousePos.y;
    this.in_use = true;
}

RectangleTool.prototype.mousemove = function(mousePos) {
    this.board.clear();
    var width = mousePos.x - this.startX;
    var height = mousePos.y - this.startY;
    this.board.getContext().lineWidth = this.size;
    this.board.getContext().strokeStyle = this.color;
    this.board.getContext().strokeRect(this.startX, this.startY, width, height);
}

RectangleTool.prototype.mouseup = function(mousePos) {
    this.board.update();
    global.board.saveState();
    this.in_use = false;
}

RectangleTool.prototype.getExtra = function() {
    extra = {}
    extra['color'] = this.color;
    extra['fill'] = this.fill;
    return extra;
}

RectangleTool.prototype.setExtra = function(extra) {
    this.color = extra['color'];
    this.fill = extra['fill'];
}
//---------------------------------------------------------------------------------------

// circle tool
//---------------------------------------------------------------------------------------
function CircleTool(board) {
    this.toolname = "circle"
    this.color = '#000000';
    this.size = 3;
    this.fill = false;
    this.board = board;
    this.startX = 0;
    this.startY = 0;
}

CircleTool.prototype.mousedown = function(mousePos) {
    global.board.saveState();
    // save the starting x/y of the circle
    this.startX = mousePos.x;
    this.startY = mousePos.y;
    this.in_use = true;
}

CircleTool.prototype.mousemove = function(mousePos) {
    this.board.clear();
    var rect = this.board.getCanvas().getBoundingClientRect();
    var x = mousePos.x - rect.left;
    var y = mousePos.y - rect.top;

    var radiusX = (x - this.startX) * 0.5, /// radius for x based on input
        radiusY = (y - this.startY) * 0.5, /// radius for y based on input
        centerX = this.startX + radiusX, /// calc center
        centerY = this.startY + radiusY,
        step = 0.01, /// resolution of ellipse
        a = step, /// counter
        pi2 = Math.PI * 2 - step; /// end angle

    // start a new path
    this.board.getContext().beginPath();

    // set start point at angle 0
    this.board.getContext().moveTo(centerX + radiusX * Math.cos(0),
        centerY + radiusY * Math.sin(0));

    // create the ellipse
    for (; a < pi2; a += step) {
        this.board.getContext().lineTo(centerX + radiusX * Math.cos(a),
            centerY + radiusY * Math.sin(a));
    }

    /// close it and stroke it XD
    this.board.getContext().closePath();
    this.board.getContext().lineWidth = this.size;
    this.board.getContext().strokeStyle = this.color;
    this.board.getContext().stroke();
}

CircleTool.prototype.mouseup = function(mousePos) {
    this.board.update();
    global.board.saveState();
    this.in_use = false;
}

CircleTool.prototype.getExtra = function() {
    extra = {}
    extra['color'] = this.color;
    extra['fill'] = this.fill;
    return extra;
}

CircleTool.prototype.setExtra = function(extra) {
    this.color = extra['color'];
    this.fill = extra['fill'];
}


// eraser tool
//---------------------------------------------------------------------------------------
function EraserTool(board) {
    this.toolname = 'eraser';
    this.size = 10;
    this.in_use = false;
    this.board = board;
    this.startX = 0;
    this.startY = 0;
}

EraserTool.prototype.mousedown = function(mousePos) {
    global.board.saveState();
    this.in_use = true;
    this.startX = mousePos.x;
    this.startY = mousePos.y;
}

EraserTool.prototype.mousemove = function(mousePos) {
    this.board.getContext().beginPath();
    this.board.getContext().arc(this.startX, this.startY, this.size, 0, Math.PI * 2, false);
    //this.board.getContext().fillStyle = this.board.getBackgroundColor();
    this.board.getContext().fillStyle = "white";
    this.board.getContext().fill();

    this.startX = mousePos.x;
    this.startY = mousePos.y;
    this.board.update();
}

EraserTool.prototype.mouseup = function(mousePos) {
    global.board.saveState();
    this.in_use = false;
}

EraserTool.prototype.getExtra = function() {
    return {}
}

EraserTool.prototype.setExtra = function(extra) {

}

//---------------------------------------------------------------------------------------

// toolbox
//---------------------------------------------------------------------------------------
function ToolBox(board) {
    this.tools = {}
    this.current_tool = 'pencil'
    this.tools['pencil'] = new PencilTool(board);
    this.tools['line'] = new LineTool(board);
    this.tools['rectangle'] = new RectangleTool(board);
    this.tools['circle'] = new CircleTool(board);
    this.tools['eraser'] = new EraserTool(board);
}

ToolBox.prototype.getTool = function(toolname) {
    return this.tools[toolname];
}

ToolBox.prototype.getTools = function() {
    return this.tools;
}

ToolBox.prototype.getCurrentTool = function() {
    return this.tools[this.current_tool];
}

ToolBox.prototype.setCurrentTool = function(toolname) {
    this.current_tool = toolname;
}
//---------------------------------------------------------------------------------------
