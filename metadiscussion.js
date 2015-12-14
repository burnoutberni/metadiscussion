Speakers = new Mongo.Collection("speakers");

if (Meteor.isClient) {
  Meteor.subscribe("speakers");
  Meteor.subscribe("userData");

  Template.body.helpers({
    speakers: function () {
      return Speakers.find({});
    },
    isAdmin: function () {
      var userId = Meteor.userId();
      var admin = Meteor.users.findOne(userId).admin;
      return admin;
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
    }
  });

  Template.speaker.events({
    'click .delete': function () {
      Meteor.call("deleteSpeaker", this._id);
    }
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
      createdAt: new Date()
    });
  },
  deleteSpeaker: function (speakerId) {
    if (Speakers.findOne(speakerId).owner !== Meteor.userId() &&
        ! Meteor.user().admin) {
      throw new Meteor.Error("not-authorized");
    }

    Speakers.remove(speakerId);
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
    // Speakers.remove({})

    // make nini admin
    Meteor.users.update({ username: 'nini' }, { $set: {admin: true} })
  });

  Meteor.publish("speakers", function () {
    return Speakers.find();
  });

  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId},
                               {fields: {'admin': 1}});
    } else {
      this.ready();
    }
  });
}
