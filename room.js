function Room(id, owner, participants) {
    this.id = id;
    this.owner = owner;
    this.participants = participants;
}

Room.prototype.getOwner = function() {
    return this.owner;
}

Room.prototype.getParticipants = function() {
    return this.participants;
}

Room.prototype.addParticipant = function(participant) {
    this.participants.push(participant);
}

module.exports = Room;
