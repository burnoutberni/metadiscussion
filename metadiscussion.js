Discussions = new Mongo.Collection("discussions");

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function () {
  this.render('Home');
});

Router.route('/discussion/:_id', function () {
  this.render('Discussion', {
    data: function () {
      if (!Discussions.findOne({_id: this.params._id})) {
        Meteor.call("newDiscussion", this.params._id);
      }
      Session.set('currentDiscussion', this.params._id);
      return Discussions.findOne({_id: this.params._id});
    }
  });
});

Meteor.methods({
  newDiscussion: function (discussionId) {
    if (discussionId) {
      return Discussions.insert({
        _id: discussionId,
        speakers: [],
        owner: Meteor.userId(),
        createdAt: new Date(),
        count: 0
      });
    } else {
      return Discussions.insert({
        speakers: [],
        owner: Meteor.userId(),
        createdAt: new Date(),
        count: 0
      });
    }
  },
  addSpeaker: function (discussionId) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    var allSpeakers = Discussions.findOne({_id: discussionId}).speakers;
    allSpeakers.forEach(function(speaker) {
      if(speaker.owner === Meteor.userId()) {
        throw new Meteor.Error("already-in-list");
      }
    });

    var count = Discussions.findOne({_id: discussionId}).count;

    Discussions.update({_id: discussionId}, {$addToSet: {speakers: {
      username: Meteor.user().username,
      owner: Meteor.userId(),
      count: count,
      createdAt: new Date()
    }}});

    Discussions.update({_id: discussionId}, { $inc: {count: 1}});
  },
  deleteSpeaker: function (discussionId, speakerId, speakerCount) {
    var currentDiscussion = Discussions.findOne({_id: discussionId});
    var currentSpeaker = currentDiscussion.speakers[0];

    if (typeof currentSpeaker == "undefined") {
      throw new Meteor.Error("no-more-speakers");
    }
    if (Meteor.userId() !== speakerId &&
        Meteor.userId() !== currentDiscussion.owner) {
      throw new Meteor.Error("not-authorized");
    }

    Discussions.update({_id: discussionId}, {$pull: {speakers: {owner: speakerId}}});
    Discussions.update({_id: discussionId, "speakers.count": {$gt: speakerCount}}, {$inc: {"speakers.$.count": -1}}, {multi: true});
    Discussions.update({_id: discussionId}, {$inc: {count: -1}});
  },
  moveUp: function (discussionId, speakerId, speakerCount) {
    if (Meteor.userId() !== speakerId &&
        Meteor.userId() !== Discussions.findOne({_id: discussionId}).owner) {
      throw new Meteor.Error("not-authorized");
    }

    var speakerCountPlusOne = speakerCount + 1;
    if ( Discussions.update({_id: discussionId, "speakers.count": speakerCountPlusOne}, {$inc: {"speakers.$.count": -1}}) ) {
      Discussions.update({_id: discussionId, "speakers.owner": speakerId}, {$inc: {"speakers.$.count": 1}});
    }
  },
  moveDown: function (discussionId, speakerId, speakerCount) {
    if (Meteor.userId() !== speakerId &&
        Meteor.userId() !== Discussions.findOne({_id: discussionId}).owner) {
      throw new Meteor.Error("not-authorized");
    }

    var speakerCountMinusOne = speakerCount - 1;
    if ( Discussions.update({_id: discussionId, "speakers.count": speakerCountMinusOne}, {$inc: {"speakers.$.count": 1}}) ) {
      Discussions.update({_id: discussionId, "speakers.owner": speakerId}, {$inc: {"speakers.$.count": -1}});
    }
  },
  next: function (discussionId) {
    if (Meteor.userId() !== Discussions.findOne({_id: discussionId}).owner) {
      throw new Meteor.Error("not-authorized");
    }

    var discussion = Discussions.findOne({_id: discussionId});
    var speakers = _.sortBy(discussion.speakers, function(speaker) {
      return speaker.count;
    });

    Meteor.call("deleteSpeaker", discussionId, speakers[0].owner, 0);
  }
});
