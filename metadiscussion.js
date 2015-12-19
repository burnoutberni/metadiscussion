Speakers = new Mongo.Collection("speakers");
var count = 0;

Meteor.methods({
  addSpeaker: function () {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    if (Speakers.findOne({owner: Meteor.userId()})) {
      throw new Meteor.Error("already-in-list");
    }

    Speakers.insert({
      username: Meteor.user().username,
      owner: Meteor.userId(),
      count: count,
      createdAt: new Date()
    });
    count++;
  },
  deleteSpeaker: function (speakerId) {
    var currentSpeaker = Speakers.findOne(speakerId);
    var currentSpeakerCount = currentSpeaker.count;
    if (typeof currentSpeaker == "undefined") {
      throw new Meteor.Error("no-more-speakers");
    }
    if (currentSpeaker.owner !== Meteor.userId() &&
        ! Meteor.user().admin) {
      throw new Meteor.Error("not-authorized");
    }

    Speakers.remove(speakerId);
    Speakers.update({count: {$gt: currentSpeakerCount}}, {$inc: {count: -1}}, {multi: true});
    count--;
  },
  moveUp: function (speakerId) {
    if (Speakers.findOne(speakerId).owner !== Meteor.userId() &&
        ! Meteor.user().admin) {
      throw new Meteor.Error("not-authorized");
    }

    var speakerCount = Speakers.findOne(speakerId).count;
    if ( Speakers.update({count: {$eq: speakerCount + 1}}, {$inc: {count: -1}}) ) {
      Speakers.update(speakerId, {$inc: {count: 1}});
    }
  },
  moveDown: function (speakerId) {
    if (Speakers.findOne(speakerId).owner !== Meteor.userId() &&
        ! Meteor.user().admin) {
      throw new Meteor.Error("not-authorized");
    }

    var speakerCount = Speakers.findOne(speakerId).count;
    if ( Speakers.update({count: {$eq: speakerCount - 1}}, {$inc: {count: +1}}) ) {
      Speakers.update(speakerId, {$inc: {count: -1}});
    }
  },
  next: function () {
    if (! Meteor.user().admin) {
      throw new Meteor.Error("not-authorized");
    }

    Meteor.call("deleteSpeaker", Speakers.findOne({}));
  }
});
