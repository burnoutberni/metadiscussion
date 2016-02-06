Meteor.subscribe("discussions");

Template.body.helpers({
  listView: function () {
    return window.location.hash === "#list" ? true : false;
  }
});

Template.discussion.helpers({
  speakers: function () {
    var discussion = Discussions.findOne({_id: Session.get('currentDiscussion')});
    var speakers = _.sortBy(discussion.speakers, function(speaker) {
      return speaker.count;
    });

    //  ask for Notification access, if we haven't asked yet
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    var firstSpeaker = speakers[0] ? speakers[0] : undefined;

    //if the user is the first user on the list now ...
    if (firstSpeaker !== undefined && Meteor.userId() === firstSpeaker.owner) {
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

    return speakers;

    //console.log(Discussions.find({_id: Session.get('currentDiscussion')}, {sort: { "speakers.$.count": 1 } }));
    //return Discussions.findOne({_id: Session.get('currentDiscussion')}, {sort: { "speakers.$.count": 1 } }).speakers;
  },
  isAdmin: function () {
    return Discussions.findOne({_id: Session.get('currentDiscussion')}).owner === Meteor.userId();
  },
  noSpeakers: function () {
    return Discussions.findOne({_id: Session.get('currentDiscussion'), speakers: {$not: {$size: 0}}}) ? false : true;
  }
});

Template.discussion.events({
  'click .new-speaker': function () {
    Meteor.call("addSpeaker", Session.get('currentDiscussion'));
  },
  'click .next': function () {
    Meteor.call("next", Session.get('currentDiscussion'));
  }
});

Template.home.events({
  'click .new-discussion': function () {
    Meteor.call("newDiscussion", function (error, result){
      Router.go('/discussion/' + result);
    });
  }
});

Template.speaker.helpers({
  isOwner: function () {
    return this.owner === Meteor.userId();
  },
  isAdmin: function () {
    return Discussions.findOne({_id: Session.get('currentDiscussion')}).owner === Meteor.userId();
  }
});

Template.speaker.events({
  'click .delete': function () {
    Meteor.call("deleteSpeaker", Session.get('currentDiscussion'), this.owner, this.count);
  },
  'click .up': function () {
    Meteor.call("moveUp", Session.get('currentDiscussion'), this.owner, this.count);
  },
  'click .down': function () {
    Meteor.call("moveDown", Session.get('currentDiscussion'), this.owner, this.count);
  },
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
