//---------
// Global Data
//---------
var messageRef  = new Firebase("https://weaver-codepen-demo.firebaseio.com/messages"),
    presenceRef = new Firebase("https://weaver-codepen-demo.firebaseio.com/.info/connected"),
    usersRef    = new Firebase("https://weaver-codepen-demo.firebaseio.com/users"),
    userRef     = usersRef.push(),
    myKey       = "";

var newMessage = {
  text:       "",
  username:   "",
  timestamp:  ""
};

var timer = null;

//---------
// Components
//---------
var messenger = Vue.extend({
  template: '<div class="messagesWrapper">' +
  //'<pre>{{ newMessage | json }}</pre>' +
  '<div class="message" v-for="message in messages" data-person="{{ message.username | isMyMessage }}">' +
  '<span>{{ message.username | isMyMessage }} <time class="hidden">@ {{ message.timestamp }}</time></span>' +
  '<p>{{ message.text }}</p>' +
  '<i data-person="{{ message.username | isMyMessage }}" @click="removeMessage(message.username, message[\'.key\'])" class="fa fa-close"></i>' +
  '</div>' +
  '<p class="usersTyping" v-for="user in users">' +
  '{{ user | isTyping }}' +
  '</p>' +
  '</div>' +
  '<input class="messageInput" @keyup.enter="addMessage()" v-model="newMessage.text" @keyup="userTyping($event)"/>' +
  '<button @click="addMessage()">Send <!--#{{ messages.length + 1 }}--></button>' +
  '<h3 class="usersOnline">Users Online: {{ users.length }}</h3>' +
  '<p class="users" v-for="user in users">' +
  '{{ user.name | isMyUsername }}' +
  '</p>'
  ,

  ready: function() {
    var self = this;

    presenceRef.on("value", function(snap) {
      if (snap.val()) {
        userRef.set({
          online:  true,
          name:    self.newMessage.username,
          typing:  false

        }, function() {
          myKey = self.users[self.users.length - 1][".key"];
        });

        userRef.onDisconnect().remove();
      }
    });

    messageRef.on("value", function(snap) {
      self.scrollToBottomOfMessages();
    });
  },

  data: function() {
    return {
      newMessage: newMessage
    }
  },

  firebase: {
    messages: messageRef.limitToLast(25), //limit to 25 messages
    users: usersRef
  },

  methods: {
    removeMessage: function(username, key) {
      messageRef.child(key).remove();
    },

    addMessage: function() {
      if (this.newMessage.text.trim() != "") {
        usersRef.child(myKey).update({typing: false});

        messageRef.push({
          text:       this.newMessage.text,
          username:   this.newMessage.username,
          timestamp:  this.timestamp()
        });

        this.newMessage.text      = "";
        this.newMessage.timestamp = "";
      }
    },

    scrollToBottomOfMessages: function() {
      Vue.nextTick(function() {
        var messages = document.getElementsByClassName("messagesWrapper")[0];
        messages.scrollTop = messages.scrollHeight;
      })
    },

    userTyping: function(e) {
      //only numbers, letters, spaces, and backspace
      if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode == 33 || e.keyCode == 4) {
        usersRef.child(myKey).update({typing: true});

        clearTimeout(timer); 
        timer = setTimeout(function() {
          usersRef.child(myKey).update({typing: false});
        }, 1000);
      }
    },

    timestamp: function() {
      var date = new Date();

      function formatDate(date) {
        var monthNames = [
          "January", "February", "March",
          "April", "May", "June", "July",
          "August", "September", "October",
          "November", "December"
        ];

        var day         = date.getDate(),
            monthIndex  = date.getMonth(),
            year        = date.getFullYear();

        return monthNames[monthIndex] + " " + day + ", " +  year
      }

      function formatTime(date) {
        var hour    = date.getHours(),
            minute  = date.getMinutes(),
            amPM    = (hour > 11) ? "pm" : "am";

        if(hour > 12) {
          hour -= 12;
        } else if(hour == 0) {
          hour = "12";
        }
        if(minute < 10) {
          minute = "0" + minute;
        }

        return hour + ":" + minute + amPM;
      }


      return formatTime(date) + " " + formatDate(date)
    }
  },

  filters: {
    isMyMessage: function(username) {
      if(username === this.newMessage.username) {
        return "Me"
      } else {
        return username
      }
    },

    isTyping: function(user) {
      var self = this;

      if(user.typing && user.name != self.newMessage.username) {
        self.scrollToBottomOfMessages();
        return user.name + " is typing..."
      }
    }
  }
});

var nameForm = Vue.extend({
  data: function() {
    return {
      newMessage: newMessage
    }
  },

  template: '<h2 class="name">Whats your username, stranger?</h2>' + 
  '<p class="original">(Try to be original)</p>' +
  '<input class="nameInput" @keyup.enter="goToMessage()" v-model="newMessage.username" placeholder="Username"/>' +
  //'<pre>{{ newMessage | json }}</pre>' +
  '<button @click="goToMessage()">Continue</button>' +
  '<h3 class="usersOnline">Users Online: {{ users.length }}</h3>' +
  '<p class="users" v-for="user in users">' +
  '{{ user.name | isMyUsername }}' +
  '</p>'
  ,
  
  ready: function() {
    if(myKey != "") {
      userRef.remove();
    }
  },

  methods: {
    goToMessage: function() {
      if (this.newMessage.username.trim() != "") {
        router.go("/messenger");
      }
    }
  },

  firebase: {
    users: usersRef.limitToLast(25)
  }
});

//---------
// Filters
//---------
Vue.filter("isMyUsername", function(username) {
  if(username === this.newMessage.username) {
    return username + " (Me)"
  } else {
    return username
  }
});

//---------
// Router
//---------
var router = new VueRouter();
router.map({
  '/': {
    component: nameForm
  },

  '/messenger': {
    component: messenger
  }
})
router.start(Vue, '#vue');