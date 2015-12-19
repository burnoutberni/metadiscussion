Speakers = new Mongo.Collection("speakers");
var count = 0;

if (Meteor.isClient) {
  Meteor.subscribe("speakers");
  Meteor.subscribe("userData");

  Template.body.helpers({
    speakers: function () {
      //if the user is the first user on the list now ...
      if (Meteor.userId() === Speakers.findOne({}, { sort: { count: 1 } }).owner) {
        // create a notification text ...
        var notificationText = Meteor.user().username + ", you're up! Join the conversation now."

        if ("Notification" in window && Notification.permission === "granted") {
          // and push it, if the user uses a browser with Notification() support and has granted us access ...
          var notification = new Notification(notificationText);
        } else if ("Notification" in window && Notification.permission !== "denied") {
          // or ask for access and push it then, if we haven't asked yet
          Notification.requestPermission(function (permission) {
            if (permission === "granted") {
              var notification = new Notification(notificationText);
            }
          });
        }
      }

      // also, return all the speakers, of course
      return Speakers.find({}, { sort: { count: 1 } });
    },
    isAdmin: function () {
      var userId = Meteor.userId();
      var admin = Meteor.users.findOne(userId).admin;
      return admin;
    },
    noSpeakers: function () {
      return Speakers.findOne({}) ? false : true;
    }
  });

  Template.body.events({
    'click .new-speaker': function () {
      Meteor.call("addSpeaker");
    },
    'click .next': function () {
      Meteor.call("next");
    }
  });

  Template.speaker.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
    isAdmin: function () {
      var userId = Meteor.userId();
      var admin = Meteor.users.findOne(userId).admin;
      return admin;
    }
  });

  Template.speaker.events({
    'click .delete': function () {
      Meteor.call("deleteSpeaker", this._id);
    },
    'click .up': function () {
      Meteor.call("moveUp", this._id);
    },
    'click .down': function () {
      Meteor.call("moveDown", this._id);
    },
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

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

if (Meteor.isServer) {

  Meteor.startup(function () {
    //on server startup deleting all speakers
    Speakers.remove({});

    // make nini admin
    Meteor.users.update({ username: 'nini' }, { $set: {admin: true} });
  });

  Meteor.publish("speakers", function () {
    return Speakers.find();
  });

  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId},
                               {fields: {'admin': 1, 'count': 1}});
    } else {
      this.ready();
    }
  });
}
