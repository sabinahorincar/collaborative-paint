var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');
crypto = require('crypto');
Person = require('./person.js');
Room = require('./room.js');

// start webserver on port 8081
var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8081);
console.log("Server running on 127.0.0.1:8081");

// add directory with our static files
app.use(express.static(__dirname + '/public'));

// startup initialization code
var uid = 0; // global uuid for when generating new users
var rooms = []; // here we store all available rooms
var users = []; // here we store all persons

// event-handler for new incoming connections
io.on('connection', function(socket) {
    console.log('new connection from ' + socket.handshake.address + ':' + socket.handshake.port);
    query = socket.handshake.query;

    var person, room, rid;

    if (query['rid'] == null) // if room owner
    {
        rid = crypto.randomBytes(7).toString('hex');
        var username = 'Guest_' + crypto.randomBytes(10).toString('hex');

        person = new Person(uid++, rid, username, {}, false, 'online');
        room = new Room(rid, person, [person]);

        users.push(person);
        rooms.push(room);

        // send user to his/hers room
        socket.join(rid);

        // echo to user they've connected
        socket.emit('connect_success', 'SERVER', {
            user_name: username,
            room_id: rid,
            owner: username,
            participants: [username]
        });
    } else // if room guest
    {
        rid = query['rid'];
        username = 'Guest_' + crypto.randomBytes(10).toString('hex');
        person = new Person(uid++, rid, username, {}, true, 'online');

        var room_found = false;
        for (var i = 0; i < rooms.length; i++) {
            room = rooms[i];
            if (room['id'] == rid) { // room found
                room_found = true;
                users.push(person);
                room.addParticipant(person);
                break;
            }
        }
        if (!room_found) {
            socket.emit('connect_error', 'SERVER', { err: 'Room not found!' });
        } else {
            // send user to his/hers room
            socket.join(rid);

            // echo to user they've connected
            socket.emit('connect_success', 'SERVER', {
                user_name: username,
                room_id: rid,
                owner: room.getOwner()['username'],
                participants: Array.from(room.getParticipants().map(p => p.username))
            });

            // echo to room that a person has connected to their room
            socket.broadcast.to(rid).emit('new guest arrived', 'SERVER', {
                user_name: username
            });
        }
    }

    // handlers for user updates
    socket.on('update boardname', function(data) {
        socket.broadcast.to(rid).emit('update boardname', username, data);
    });

    socket.on('update drawboard', function(data) {
        socket.broadcast.to(rid).emit('update drawboard', username, data);
    });

    socket.on('chat message', function(data) {
        socket.broadcast.to(rid).emit('chat message', username, data);
    });

    socket.on('disconnect', function() {
        person['status'] = 'offline';
        if (room.getOwner() == person) {
            // echo to room that owner has disconnected
            socket.broadcast.to(rid).emit('owner disconnected', 'SERVER', 'The room owner has disconnected.');
            // remove room participants
            room.getParticipants().forEach(function(g) {
                var index = users.indexOf(g);
                users.splice(index, 1);
            });
            // remove room owner
            var index = users.indexOf(person);
            users.splice(index, 1);
            // remove room
            var index = rooms.indexOf(room);
            rooms.splice(index, 1);
            // close room
            socket.leave(rid);
            /*io.sockets.clients(rid).forEach(function(s) {
                s.leave(rid);
            });*/
        } else {
            person['status'] = 'offline';
            // echo to room that a person has disconnected from their room
            socket.broadcast.to(rid).emit('guest disconnected', 'SERVER', {
                user_name: username
            });
            socket.leave(rid); // remove user from room
        }
    });
});
