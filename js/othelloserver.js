#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var playerList= new Array();
var boardList= new Array();
var gameIDCounter=0;


var server = http.createServer(function(request, response) {
   // console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9090, function() {
    //console.log((new Date()) + ' Server is listening on port 9090');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      //console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
	
    var connection = request.accept('echo-protocol', request.origin);
	
    connection.on('message', function(message) {
            //console.log('Received Message: ' + message.utf8Data);
			var receivedData=eval('(' + message.utf8Data + ')');
			switch(receivedData.keyCode){
				//a client is asking if a username is valid to log in with
				case 0:
					var playerName=receivedData.loginData;
					var playerExists=false;
					for(var i=0; i<playerList.length;i++)
					{
						if(playerList[i].name==playerName)
						playerExists=true;
					}
					if(!playerExists){
						var newPlayer= new ClientPlayer(playerName,connection);
						playerList.push(newPlayer);
						var o={
							keyCode:1,
							players:currentPlayers()
						}
						connection.send(JSON.stringify(o));
						
						var addedData={
							keyCode:4,
							players:currentPlayers()
						}
						for(var i=0;i<playerList.length;i++){
							var p=playerList[i];
							playerList[i].connection.send(JSON.stringify(addedData));
						}
					}
					else{
						var o={
							keyCode:2
						}
						connection.send(JSON.stringify(o));
					}
					
				break;
				  //some has chatted in the main menu
				  case 5:
				  var chatData= receivedData.chatData;
				  var sentFrom= receivedData.sentFrom;
				  var now= new Date();
				  
				  var sentMessage = sentFrom + "(" +  (now.getHours() +1) +  ":" +now.getMinutes() +  ":" +now.getSeconds() + "): " + chatData;
				  var o={
							keyCode:6,
							chatData:sentMessage
						}
					//console.log(sentMessage);
						
						for(var i=0;i<playerList.length;i++){
							var p=playerList[i];
							p.connection.send(JSON.stringify(o));
						}
				
				  break;
				  //a player has invited another player to play
				  case 7:
				  var inviteTo=receivedData.inviteTo;
				  var invitefrom=receivedData.inviteFrom;
				  for(var i=0; i<playerList.length;i++)
				  {
					var p= playerList[i];
					if(p.name==inviteTo)
					{
						 var o={
							keyCode:8,
							inviteFrom:invitefrom
						}
						p.connection.send(JSON.stringify(o));
					}
				  }
				  break;
				  //an invitation was accepted by a player
				  case 9:
					var sentFrom=receivedData.sentFrom;
					var acceptedPlayer=receivedData.acceptedPlayer;
					var playerToFind="";
					var sentFromPlayer="";
					var toFindIndex=-1
					var sentFromIndex=-1;
					for(var i=0; i<playerList.length;i++){
						var p=playerList[i];
						if(p.name==acceptedPlayer)
						{
							playerToFind=p;
							toFindIndex=i;
						}
						else if(p.name==sentFrom)
						{
							sentFromPlayer=p;
							sentFromIndex=i;
						}
					}
					//both accepted
					if(playerToFind!="" && !playerToFind.inGame){
						gameIDCounter++;
						var createdGame=new GameBoard(new Array([0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,1,2,0,0,0],[0,0,0,2,1,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]),gameIDCounter,sentFromPlayer.name,playerToFind.name);
						boardList.push(createdGame);
						var o={
							keyCode:11,
							newGame:createdGame
						}
						playerList[toFindIndex].inGame=true;
						playerList[toFindIndex].gameID=gameIDCounter;
						playerList[sentFromIndex].inGame=true;
						playerList[sentFromIndex].gameID=gameIDCounter;
						sentFromPlayer.connection.send(JSON.stringify(o));
						playerToFind.connection.send(JSON.stringify(o));
						
						var o={
							keyCode:3,
							removedPlayer:sentFromPlayer.name,
							players:currentPlayers()
						}
						for(var i=0;i<playerList.length;i++){
							var p=playerList[i];
							p.connection.send(JSON.stringify(o));
						}
						
						o={
							keyCode:3,
							removedPlayer:playerToFind.name,
							players:currentPlayers()
						}
						for(var i=0;i<playerList.length;i++){
							var p=playerList[i];
							p.connection.send(JSON.stringify(o));
						}
					}
					//accepted, but other player not found
					else if(playerToFind==""){
						var o={
							keyCode:12,
							errorMsg:"Player " + acceptedPlayer+ " not found."
						}
						sentFromPlayer.connection.send(JSON.stringify(o));
					}
					//accepted, but other player already in game
					else if(playerToFind.inGame){
						var o={
							keyCode:12,
							errorMsg:"Player " + acceptedPlayer +" is already in game."
						}
						sentFromPlayer.connection.send(JSON.stringify(o));
					}
				  break;
				  //an invitation has been declined by a player
				  case 10:
					
					var sentFrom=receivedData.sentFrom;
					var declinedPlayer=receivedData.declinedPlayer;
					var playerToFind="";
					for(var i=0; i<playerList.length;i++){
						var p=playerList[i];
						if(p.name==declinedPlayer)
						{
							
							playerToFind=p;
							//console.log(p.name + " " + playerToFind);
						}
					}
					if(playerToFind!=""){
						var o={
							keyCode:12,
							errorMsg:"Player " + sentFrom +" has declined your invitation."
						}
						//console.log("sent 12");
						playerToFind.connection.send(JSON.stringify(o));
					}
					else
					{
						//console.log("breaks");
					}
				  break;
				  //a player has made a move in-game
				  case 13:
					var sentBoard= receivedData.sentBoard;
					var sentPieces= receivedData.sentPieces;
					var targetPlayer=receivedData.targetPlayer;
					var playerToFind="";
					for(var i=0; i<playerList.length;i++){
						var p=playerList[i];
						if(p.name==targetPlayer)
						{
							playerToFind=p;
						}
					}
					var o={
							keyCode:14,
							gameBoard:sentBoard,
							gamePieces:sentPieces
						}
						if(playerToFind!="")
						playerToFind.connection.send(JSON.stringify(o));
					break;
				//player returns to the main menu
				 case 15:
					var sentFrom= receivedData.sentFrom;
					for(var i=0; i<playerList.length;i++){
						if(playerList[i].name==sentFrom)
						{
							for(var j=0;j<boardList.length;j++)
							{
								if(playerList[i].gameId==boardList[j].gameId)
								{
									var otherPlayerName="";
									if(playerList[i].name==boardList[j].player1)
									otherPlayerName=boardList[j].player2;
									else
									otherPlayerName=boardList[j].player1;
									otherPlayer="";
									for(var k=0; k<playerList.length;k++){
										if(otherPlayerName==playerList[k]){
											otherPlayer= playerList[k];
										}
									}
									if(otherPlayer!=""){
										if(!otherPlayer.inGame){
											boardList.splice(j,1);
										}
										else{
											var o={
												keyCode:17,
												chatData:"Opponent has left the game. <input type=\"button\" onclick=\"toMainMenu()\" value=\"Main Menu\"></input><br/>"
											}
											otherPlayer.send(JSON.stringify(addedData));
										}
									}
								}
							}
							playerList[i].inGame=false;
							playerList[i].gameId=0;
							var addedData={
							keyCode:4,
							players:currentPlayers()
							}
							for(var i=0;i<playerList.length;i++){
								var p=playerList[i];
								playerList[i].connection.send(JSON.stringify(addedData));
							}
							break;
						}
					}
					
					
				 break;
				 //a player chats in the main chat window
				  case 16:
				  var chatData= receivedData.chatData;
				  var targetPlayer= receivedData.targetPlayer;
				  var sentFrom= receivedData.sentFrom;
				  var now= new Date();
				  
				  var sentMessage = sentFrom + "(" +  (now.getHours() +1) +  ":" +now.getMinutes() +  ":" +now.getSeconds() + "): " + chatData;
				  var o={
							keyCode:17,
							chatData:sentMessage
						}
					//console.log(sentMessage);	
					for(var i=0;i<playerList.length;i++){
						var p=playerList[i];
						if(p.name==targetPlayer || p.name==sentFrom)
						{
						p.connection.send(JSON.stringify(o));
						//console.log("game message sent");
						}
					}
				
				  break;
			}
			
    });
	//occurs when a player closes his connection
    connection.on('close', function(reasonCode, description) {
		
       // console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		var id=-1;
		var removedP="";
		for(var i=0;i<playerList.length;i++){
			var p=playerList[i];
			if(p.connection==connection){
				id=playerList.indexOf(p);
				removedP=p;
			}
		}
		if(id!=-1)
		{

			if(removedP.inGame){
					//this section of the code tells the other player in the game that the player has left, if the player is in-game
					for(var i=0; i<boardList.length; i++){
					if(removedP.gameId= boardList[i].gameId){
						var opponentName;
						if(removedP.name == boardList[i].player1)
						opponentName=boardList[i].player2;
						else if(removedP.name == boardList[i].player2)
						opponentName=boardList[i].player1;
						//console.log(opponentName);
						for(var j=0; j<playerList.length; j++){
							if(opponentName==playerList[j].name)
							{
								var o={
										keyCode:17,
										chatData:removedP.name + " has left the game.<input type=\"button\" onclick=\"toMainMenu()\" value=\"Main Menu\"></input><br/>"
									}
									playerList[j].connection.send(JSON.stringify(o));
							}
						
						}
					}
					
					
				}
				var o={
					keyCode:3,
					removedPlayer:removedP.name,
					players:currentPlayers()
				}
				for(var i=0;i<playerList.length;i++){
					var p=playerList[i];
					p.connection.send(JSON.stringify(o));
				}
			}
			playerList.splice(id,1);
			
		}
		
    });
});

//returns an array of a list of the current players in the area
function currentPlayers()
{
	var returnedArray= new Array();
	for(var i=0; i<playerList.length;i++)
	{
		if(!playerList[i].inGame)
		{
			returnedArray.push(playerList[i].name);
		}
	}
	return returnedArray;
	
}


//ITEMS
function GameBoard(curBoard,gID,p1,p2){
				//a representation of the game board in a game
				this.layout=curBoard;
				this.gameId=gID;
				this.player1=p1;
				this.player2=p2;
				this.whoseTurn=this.player1;
			}
function ClientPlayer(pName,conn){
				//a representation of the player
				this.name=pName;
				this.inGame=false;
				this.gameId=0;
				this.connection=conn;
			}