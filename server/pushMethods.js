Push.debug = true;

Push.allow({
    send: function(userId, notification) {
        return true; // Allow all users to send
    }
});

Meteor.methods({
    serverNotification: function(text,title) {
        var badge = 1
        Push.send({
            from: 'push',
            title: title,
            text: text,
            query: {
                // this will send to all users
            }
        });
    },
    userNotification: function(text,title,userId) {
        Push.send({
            from: 'push',
            title: title,
            text: text,
            query: {
                userId: userId //this will send to a specific Meteor.user()._id
            }
        });
    }
});
