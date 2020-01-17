function parse_query_string(query) {
    var query_string = {};

    if (query == "")
        return query_string;

    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}

function save_canvas() {
    var data = global.board.getCanvas().toDataURL();
    var filename = global.board.getName();
    var blob = new Blob([data], { type: "text/plain; charset=utf-8" });
    saveAs(blob, filename + ".txt");
    //localStorage.setItem(canvasname, canvas.toDataURL());
}

// trigger pop-up function
function pop_up(title, msg) {
    $('#myModal').find('.modal-title').html(title);
    $('#myModal').find('.modal-body').html(msg);
    $('#myModal').modal('show');
}

// this function is called each time the browser window is resized
function resize_board() {
    global.board_copy.resize(); // resize board copy
    global.board_copy.draw(global.board.getCanvas()); // save current board on top of board copy
    global.board.resize(); // resize board
    global.board.draw(global.board_copy.getCanvas()); // restore old board
}

// this function is called each time when the user completes a drawing operation
function update_board() {
    global.board.draw(global.board_copy.getCanvas()); // copy pixels from canvas copy
    global.board_copy.clear(); // clear canvas copy
}

function undo_board() {
    global.board.undo();
    var data = { action: 'undo' };
    global.socket.emit('update drawboard', data);
}

function redo_board() {
    global.board.redo();
    var data = { action: 'redo' };
    global.socket.emit('update drawboard', data);
}

function clear_board() {
    global.board.clear();
    var data = { action: 'clear' };
    global.socket.emit('update drawboard', data);
}

// this function updates the name of the board displayed on the page
function update_boardname(name) {
    document.getElementById('boardname').innerHTML = name;
    var data = { boardname: name };
    global.socket.emit('update boardname', data);
}

function update_participants() {
    var participants = []
    $.each(Object.keys(global.participants), function(i, participant) {
        participants.push('<li><i class="fa fa-user fa-2x"></i> ' + participant + '</li>');
    });
    $('#participants').empty();
    $('#participants').append(participants.join(''));
}

function send_message() {
    var msg = $('#m').val();
    console.log(msg);
    $('#messages').append($('<li>').text('You: ' + msg));
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
    var data = { from: global.username, text: msg };
    global.socket.emit('chat message', data);
    $('#m').val("");
    return false;
}

function leave_room() {
    global.socket.emit('disconnect');
    window.location.replace('http://localhost:8081/index.html');
}

function convertMousePositionFromMouseEvent(e)
{
    //this section is from http://www.quirksmode.org/js/events_properties.html
    var targ;
    if (!e)
        e = window.event;
    if (e.target)
        targ = e.target;
    else if (e.srcElement)
        targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;

    var x = e.pageX - $(targ).offset().left;
    var y = e.pageY - $(targ).offset().top;

    return {"x": x, "y": y};
}
