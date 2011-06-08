var stage;
var canvas;
var map;

var ship_images   = {};
var SHIP_TYPES    = 1;          // Number of ship types

var players       = {};         // Global array to keep all the players. Indexed via username;

var pressed       = false;      // are we pressing our player ?
var me            = null;       // My player object. It resides inside 'players'


// Called onload in body
function game_init(){
  canvas  = document.getElementById('canvas');
  stage   = new Stage(canvas)
  map     = new Map();

  loadShips(1,shipsLoaded); 
}

// Add a player to the player list. p is an object from which we instantiate a player

function addPlayer(p){
  if(players[p.username] == undefined){
    players[p.username] = new Player(p);
  }
  else{
    console.log("error occured when adding player to player list");
  }
}

function shipsLoaded(){
  Ticker.addListener(window);
  socket_init();              // Initialize networking with sockets
}

// Load all spacehips into memory. All the spaceships have names "spaceship#.png"
function loadShips(num,done){
  if(num > SHIP_TYPES) done();
  else{
    var s = new Image()

    s.onload = function(){
      ship_images[num] = s;
      loadShips(num+1, done);
    };
    s.src = "images/spaceship{0}.png".format(num);
  }
}


// Unloads the given player from the map.
function unloadPlayer(pname){
  var p = players[pname];
  
  // unload the graphic
  stage.removeChild(p.shipBitmap);
  
  // get rid of the player data
  delete players[pname];
  
  console.log(players)
}

// Called on every clock tick
function tick(){
  
  // Tick on all the players
  Object.keys(players).forEach(function(player,index,array){
    players[player].tick();
  })
  
  stage.update();
}