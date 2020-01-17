function Person(id, room_id, username, history, guest, status) {
    this.id = id;
    this.room_id = room_id;
    this.username = username;
    this.history = history;
    this.guest = guest;
    this.status = status;
}

Person.prototype.isOwner = function() {
    return this.guest ? false : true;
}

module.exports = Person;
