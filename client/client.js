Meteor.subscribe("speakers");
Meteor.subscribe("userData");

Template.body.helpers({
  speakers: function () {
    //if the user is the first user on the list now ...
    if (Meteor.userId() === Speakers.findOne({}, { sort: { count: 1 } }).owner) {
      // create a notification text ...
      var notificationText = Meteor.user().username + ", you're up! Join the conversation now."

      // invoke Android app notifications
      Meteor.call("userNotification", notificationText, "Chop chop!", Meteor.userId());

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
  },
  listView: function () {
    return window.location.hash === "#list" ? true : false;
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
