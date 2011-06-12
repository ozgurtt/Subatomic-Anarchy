var connect = require('connect');
var io = require('socket.io');

//Chat buffer
var buffer = [];

exports.start = function(data, server, session_store) {    
  io = io.listen(server, {
    transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling','jsonp-polling']
  });
  
  io.on('connection', function(client){
  
    // Get the connection cookie
    var cookie_string = client.request.headers.cookie;
    var parsed_cookies = connect.utils.parseCookie(cookie_string);
    var connect_sid = parsed_cookies['connect.sid'];  
  
    if (connect_sid){
      session_store.get(connect_sid, function (error, session) {
        if(error){
          console.log("ERROR FETCHING SESSION!");
        }
        
        // If the user has a session set up. This would fail if site is open, node crashes,
        // and then you restart node. Socket.IO from client side would try to establish a connection,
        // but we wouldn't have been logged in as seen by the server, hence this would fail. Normally,
        // if the server is running all the time, this shouldn't happen.
        
        if(session){
          
          var uname = session.user.username;

          if(! data.players[uname]){
            console.log("adding {0} to session".format(uname))
            data.players[uname] = session.user;
          }

          // Synchronize the client
          client.send({ 
                type:     'onNewConnect',
                me:       session.user.username,
                everyone: data.players,
                chatBuf:  buffer
          });
      
          // Tell everyone a new guy arrived
        
          client.broadcast({
            type: 'newArrival',
            player: data.players[session.user.username]
          });
        

        client.on('disconnect', function(){

          delete data.players[session.user.username];
          console.log("deleting player {0} from player list".format(session.user.username));
        
          io.broadcast({
            type:   "userDisconnected",
            pName:  session.user.username
          })
          
        });
        
        client.on('message', function(msg){
          console.log("message received!");
          console.log(msg.type);

          switch(msg.type){

            // Called when the player says he reached a new location!
            case 'playerUpdate':
              updatePlayerData(msg.pData);
              client.broadcast(msg);
              break;

            /*  When a player initiates movement, pass the message on to everyone else,
                so that animation can start.
            */
            case 'initMovement':
              client.broadcast(msg);
              break;

            case 'chat':
            
              var p = {
                type: 'chat',
                from: uname,
                txt: msg.txt
              }
              
              buffer.push(p);
              
              if (buffer.length > 15) buffer.shift();
              client.broadcast(p);
              break;
          }
        }); 
    
      }
      })
    }
  })
  
  function updatePlayerData(pData){
    var p = data.players[pData.username];
    p.position = pData.position;
    p.rotation = pData.rotation;
  }
  
  
}
