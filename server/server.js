Meteor.startup(function () {
  //on server startup deleting all speakers
  Discussions.remove({});
});

Meteor.publish("discussions", function () {
  return Discussions.find();
});
