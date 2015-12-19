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
                             {fields: {'admin': 1}});
  } else {
    this.ready();
  }
});
