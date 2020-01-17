// global variables
var global = this;
global.socket;
global.username; // this user
global.room_id; // stores the room id
global.room_owner // the room owner
global.participants; // this object holds the names of the participants viewing the same canvas and their toolboxes
global.board; // holds refference to drawingboard
global.board_copy; // holds refference to drawingboard copy

global.mouseDown; // true if mouse button is pressed
global.mouseMoved; // true if mouse move
global.mouseUp; // true if mouse button is released
global.mousePos; // stores current mouse position
global.mousePosOld; // stores previous mouse position

window.addEventListener("DOMContentLoaded", function() {
  $('body').on('click', function (e) {
          //did not click a popover toggle, or icon in popover toggle, or popover
          if ($(e.target).data('toggle') !== 'pencil-popover'
              && $(e.target).parents('[data-toggle="pencil-popover"]').length === 0
              && $(e.target).parents('.pencil-popover.in').length === 0) {
              $('[data-toggle="pencil-popover"]').popover('hide');
          }
          if ($(e.target).data('toggle') !== 'palette-popover'
              && $(e.target).parents('[data-toggle="palette-popover"]').length === 0
              && $(e.target).parents('.palette-popover.in').length === 0) {
              $('[data-toggle="palette-popover"]').popover('hide');
          }
  });
  // pencil popover listener
  $('[data-toggle="pencil-popover"]').popover({
      html: true,
      container: 'body',
      content: function() {
          global.participants[global.username]['toolbox'].setCurrentTool('pencil');
          return $('#pencil-popover').html();
      }
  });
  // palette popover listener
  $('[data-toggle="palette-popover"]').popover({
        html: true,
        container: 'body',
        content: function() {
          return '<div id="colorpalette2"></div>';
        }
    }).on('shown.bs.popover', function() {
        $('#colorpalette2').colorPalette();
        $('#colorpalette2').colorPalette().on('selectColor', function(e) {
              console.log(e.color);
              for (var tool in global.participants[global.username]['toolbox'].getTools()) {
                  global.participants[global.username]['toolbox'].getTool(tool).color = e.color;
              }
        });
    });
  // rename modal popup listener
  $('#renameModal').on('show.bs.modal', function(e) {
      var boardname = $('#boardname').html();
      $(this).find('#boardname_input').val(boardname);
  });
});

window.addEventListener("beforeunload", function(e) {
    e.returnValue = 'This page is asking you to confirm that you want to leave - data you have entered will not be saved.';
});

window.addEventListener("unload", function(e) {
    //global.socket.emit('disconnect');
    //global.socket.disconnect();
});

window.addEventListener("resize", function(e) {
    resize_board();
});

// main loop, running every 25ms
function mainLoop() {

    if (global.mouseDown) {
        var current_tool = global.participants[global.username]['toolbox'].getCurrentTool();
        if (!current_tool.in_use) {
            current_tool.mousedown(global.mousePos);
            var data = { action: 'mousedown', mouse_pos: global.mousePos, tool_name: current_tool.toolname, extra: current_tool.getExtra() };
            global.socket.emit('update drawboard', data);
        }
    }

    if (global.mouseMoved) {
        var current_tool = global.participants[global.username]['toolbox'].getCurrentTool();
        if (current_tool.in_use) {
            current_tool.mousemove(global.mousePos);
            var data = { action: 'mousemove', mouse_pos: global.mousePos, tool_name: current_tool.toolname, extra: current_tool.getExtra() };
            global.socket.emit('update drawboard', data);
        }
    }

    if (global.mouseUp) {
        var current_tool = global.participants[global.username]['toolbox'].getCurrentTool();
        if (current_tool.in_use) {
            global.participants[global.username]['toolbox'].getCurrentTool().mouseup(global.mousePos);
            var data = { action: 'mouseup', mouse_pos: global.mousePos, tool_name: current_tool.toolname, extra: current_tool.getExtra() };
            global.socket.emit('update drawboard', data);
        }
    }

    // reset mouse parameters
    global.mouseDown = false;
    global.mouseMoved = false;
    global.mouseUp = false;

    // update old mouse position
    global.mousePosOld = { x: global.mousePos.x, y: global.mousePos.y };
    setTimeout(mainLoop, 25);
}

function init() {
    // room initialization
    //---------------------------------------------------------------------------------------
    global.room_id = 0;
    global.room_owner = '';
    global.participants = {};
    //---------------------------------------------------------------------------------------

    // mouse initialization
    //---------------------------------------------------------------------------------------
    global.mouseDown = false;
    global.mouseMoved = false;
    global.mouseUp = false;
    global.mousePos = { x: 0, y: 0 };
    global.mousePosOld = null;
    //---------------------------------------------------------------------------------------

    // canvas initialization
    //---------------------------------------------------------------------------------------
    // get canvas element and create board object
    var canvas = document.getElementById('drawingboard');
    var wrapper = document.getElementById('drawingboard-wrapper');
    canvas.width = parseFloat(getComputedStyle(wrapper).getPropertyValue('width'));
    canvas.height = parseFloat(getComputedStyle(wrapper).getPropertyValue('height'));
    console.log(canvas.width + ' ' + canvas.height)
    global.board = new Board('Collaborative canvas', canvas);
    global.board.init();

    // display board name on page
    //update_boardname(global.board.getName());
    document.getElementById('boardname').innerHTML = global.board.getName();

    // register canvas event handlers
    canvas.onmousedown = function(e) {
        global.mouseDown = true;
    };
    canvas.onmouseup = function(e) {
        global.mouseUp = true;
    };
    canvas.onmousemove = function(e) {
        global.mouseMoved = true;
        var rect = canvas.getBoundingClientRect();
        global.mousePos.x = e.clientX - rect.left;
        global.mousePos.y = e.clientY - rect.top;
    };
    //---------------------------------------------------------------------------------------


    // socket initialization
    //---------------------------------------------------------------------------------------
    // get url params
    var query = window.location.search.substring(1);
    var query_params = parse_query_string(query);

    // check if user supplied a room number
    if (query_params['rid'] == null) {
        global.socket = io.connect('', {
            query: ""
        });
    } else {
        global.socket = io.connect('', {
            query: "rid=" + query_params['rid']
        });
    }

    // handles for user updates
    global.socket.on('connect_failed', function() {
        document.write("Unable to connect server at the moment :(")
    });

    global.socket.on('connect_error', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var popup_title = 'Error';
        var popup_body = data['err'];
        pop_up(popup_title, popup_body); // trigger pop-up here
    });

    global.socket.on('connect_success', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        global.username = data['user_name'];
        global.room_id = data['room_id'];
        global.room_owner = data['owner'];
        // aici serverul o sa trimita si canvasul roomului pe care il tine in obiectul room de pe server

        for (var i = 0; i < data['participants'].length; i++) {
            var participant = data['participants'][i];
            global.participants[participant] = {}

            var canvas = document.createElement('canvas');
            canvas.width = global.board.getCanvas().width;
            canvas.height = global.board.getCanvas().height;

            var board = new Board('Board_' + participant, canvas);
            board.init();

            var toolbox = new ToolBox(board);

            /* add canvas copy - this will be used as a temporary canvas;
             * all operations must draw on this board first */
            if (participant == global.username) {
                canvas.id = 'drawingboard-copy';
                global.board_copy = board;
                global.board.getCanvas().parentNode.appendChild(canvas);
            }

            global.participants[participant]['board'] = board;
            global.participants[participant]['toolbox'] = toolbox;
            global.participants[participant]['toolbox'].setCurrentTool('pencil');
        }

        update_participants();

        if (global.room_owner == global.username) {
            var popup_title = 'Welcome, ' + username;
            var popup_body = 'Here is your room number: ' + room_id + '<br>';
            popup_body += 'You can share this number with your friends and start drawing together!'
        } else {
            var popup_title = 'Welcome, ' + username;
            var popup_body = 'You have joined room ' + room_id + '<br>';
            popup_body += 'You can add other people to this room or start drawing right ahead!'
        }

        pop_up(popup_title, popup_body); // trigger pop-up here
        mainLoop();

    });

    global.socket.on('new guest arrived', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var guest = data['user_name'];
        console.log(guest + ' has connected');
        global.participants[guest] = {}

        var canvas = document.createElement('canvas');
        canvas.width = global.board.getCanvas().width;
        canvas.height = global.board.getCanvas().height;

        var board = new Board('Board_' + guest, canvas);
        board.init();

        var toolbox = new ToolBox(board);

        global.participants[guest]['board'] = board;
        global.participants[guest]['toolbox'] = toolbox;

        update_participants();
    });

    global.socket.on('guest disconnected', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var guest = data['user_name'];
        console.log(guest + ' has disconnected');
        delete global.participants[guest];
        update_participants();
    });

    global.socket.on('owner disconnected', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var popup_title = 'Disconnected';
        var popup_body = 'The room owner ended this session';
        pop_up(popup_title, popup_body); // trigger pop-up here
    });

    global.socket.on('update drawboard', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var action = data['action'];
        var mousePos = data['mouse_pos'];
        var toolname = data['tool_name'];
        var extra = data['extra'];
        if (toolname != undefined) {
            global.participants[sender]['toolbox'].setCurrentTool(toolname);
        }
        var tool = global.participants[sender]['toolbox'].getCurrentTool();
        if (extra != undefined)
            tool.setExtra(extra);

        if (action == 'mousedown') tool.mousedown(mousePos);
        if (action == 'mousemove') tool.mousemove(mousePos);
        if (action == 'mouseup') tool.mouseup(mousePos);
        if (action == 'undo') global.board.undo();
        if (action == 'redo') global.board.redo();
        if (action == 'clear') global.board.clear();
    });

    global.socket.on('update boardname', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var boardname = data['boardname'];
        document.getElementById('boardname').innerHTML = boardname;
    });

    global.socket.on('chat message', function(sender, data) {
        console.log('got reply from ' + sender + ' : ' + JSON.stringify(data));
        var from = data['from'];
        var message = data['text'];
        $('#messages').append($('<li>').text(from + ': ' + message));
    });
    //---------------------------------------------------------------------------------------
}
