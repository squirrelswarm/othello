Othello.client.game = function() {
	// Constants
	var EMPTY = 0, WHITE = 1, BLACK = 2;
	var NUM_ROWS = 8;var NUM_COLS = 8;
	var GRID_SIZE = 50;
	var boardWidth=NUM_ROWS*GRID_SIZE;
	var boardHeight=NUM_COLS*GRID_SIZE;
	var gameState = 0;
	var loginbutton=document.getElementById('loginbutton');
	const CELL_STATES = {
		EMPTY : null,
		WHITE : 0,
		BLACK : 1
	};
	// Variables
	var boardImage;
	var whitePieceImage;
	var blackPieceImage;
	var playerName;
	var canvas, ctx;
	var personToInvite="";
	var socket;
	var challengeCounter=0;
	var serverurl="ws://bdcold.wireless.rit.edu:9090";
	var gameData;
	
	
	
	var board = {
		width : NUM_COLS,
		height : NUM_ROWS,
		grid : [],
		pieces : [],
		updateCell : function(x, y, state) {
			if (this.grid[x][y] == CELL_STATES.EMPTY)
				this.pieces.push({x : x, y : y});
		
			this.grid[x][y] = state;
		},
		init : function() {
			// Create 2D array
			this.grid = new Array(this.height);
			for (var i = 0; i < this.height; i++)
				this.grid[i] = new Array(this.width);
			pieces = new Array();
			// Assign pieces to first spots
			var halfWidth = this.width / 2;
			var halfHeight = this.height / 2;

			// White pieces
			this.updateCell(halfWidth - 1, halfHeight - 1,  CELL_STATES.WHITE);
			this.updateCell(halfWidth, halfHeight,  CELL_STATES.WHITE);
			// Black pieces

			this.updateCell(halfWidth - 1, halfHeight,  CELL_STATES.BLACK);
			this.updateCell(halfWidth, halfHeight-1,  CELL_STATES.BLACK);
		},
		getStateAt : function(x, y) {
			return this.grid[x][y];
		}
	};
	init = function() {
		// Get canvas context
		canvas = document.querySelector("#gameBoard");
		canvas.addEventListener("click", onClick);
		ctx = canvas.getContext("2d");
		board.init();
		// Create cached images
		cacheImages();
		
		draw();
		window.addEventListener("keydown", function(e){
			if(e.keyCode==13){
				if(gameState==1){
				sendMainChat();
				}
				else if (gameState==2){
				sendGameChat();
				}
			}});
		// Open socket connection to server
		 socket = new WebSocket(serverurl, "echo-protocol");
		 socket.addEventListener("open", function(event) {
		 
          document.getElementById('serverstatus').src = "icons/accept.png";
		  loginbutton.disabled=false;  
		  
        });
		 socket.addEventListener("close", function(event) { 
          document.getElementById('serverstatus').src = "icons/exclamation.png";
		  loginbutton.disabled=true;
        });
		socket.addEventListener("message", function(event) {
         var receivedData=eval('(' + event.data + ')');
		
		//NOTES ON THE JSON KEYCODES
		//0:Client->Server, asking if username is ok/asking to login
		//1:Server->Client, Username is OK, log in
		//2:Server->Client, Username is Not OK
		//3:Server->Client,Player has left, remove them from everyone's user list
		//4:Server->Client, Player was added, add them to the user list
		//5:Client->Server, Chat data while in the main menu
		//6:Server->Client, Returns the formatted chat data to all users
		//7:Client->Server, Sends a game invite to the target player
		//8:Server->Client, Recieves an invite from a player.
		//9:Client->Server, Accepts invitation from another player
		//10:Client->Server, Declines invitation from another player
		//11:Server->Client, Start game between 2 people
		//12:Server->Client, Error starting game, returns what went wrong as a message
		//13:Client->Server, Move made, update other player
		//14:Server->Client, Opponent has made a move, update player
		//15:Client->Server, Player wishes to return to main menu
		//16:Client->Server, Chat data while in the game
		//17:Server->Client, Returns the formatted chat data to users in game
		 switch(receivedData.keyCode)
		 {
			//user logs into the main screen, load all users
			case 1:
				playerName=logininput.value;
				document.getElementById("login").style.display = "none";
				document.getElementById("mainscreen").style.display= "block";
				gameState=1;
				var curPlayerList= receivedData.players;
				document.getElementById("userlist").innerHTML="";
				for(var i=0; i<curPlayerList.length;i++)
				{
					document.getElementById("userlist").innerHTML+="<a onclick=inviteselect(\"" + curPlayerList[i]+ "\")>"+curPlayerList[i] + "</a><br/>";
				}
			break;
			//player stays in the main menu because his name is already taken
			case 2:
				  document.getElementById('serverstatus').innerHTML = "this name is already taken/is invalid";
			break;
			
			//changes the player list when a player leaves the main screen
			case 3:
				var curPlayerList= receivedData.players;
				document.getElementById("userlist").innerHTML="";
				for(var i=0; i<curPlayerList.length;i++)
				{
					document.getElementById("userlist").innerHTML+="<a onclick=inviteselect(\"" + curPlayerList[i]+ "\")>"+curPlayerList[i] + "</a><br/>";
				}
				
				if(personToInvite!="" && receivedData!=receivedData.removedPlayer)
				document.getElementById("userlist").innerHTML=document.getElementById("userlist").innerHTML.replace("onclick=\"inviteselect(&quot;"+personToInvite + "&quot;","style=\"color:red\" onclick=\"inviteselect(&quot;" + personToInvite + "&quot;");
				
			break;
			//changes the player list when a player enters the main screen
			case 4:
				var curPlayerList= receivedData.players;
				document.getElementById("userlist").innerHTML="";
				for(var i=0; i<curPlayerList.length;i++)
				{
					document.getElementById("userlist").innerHTML+="<a onclick=inviteselect(\"" + curPlayerList[i]+ "\")>"+curPlayerList[i] + "</a><br/>";
				}
				
				if(personToInvite!="")
				document.getElementById("userlist").innerHTML=document.getElementById("userlist").innerHTML.replace("onclick=\"inviteselect(&quot;"+personToInvite + "&quot;","style=\"color:red\" onclick=\"inviteselect(&quot;" + personToInvite + "&quot;");
				
			break;
			
			//chat data received for the main menu
			case 6:
				var newChatLine= receivedData.chatData + "<br/>";
				document.getElementById("mainchat").innerHTML+=newChatLine;
				
			break;
			
			//game invite received from another player
			case 8:
				var inviteFrom=receivedData.inviteFrom;
				var newChatLine= "Game invite recieved from " + inviteFrom + ".<input type=\"button\" onclick=\"acceptInvite(\'"+ inviteFrom + "\')\" value=\"Accept\"></input>";
				newChatLine+= "<input type=\"button\" onclick=\"declineInvite(\'"+ inviteFrom + "\')\" value=\"Decline\"></input><br/>";
				document.getElementById("mainchat").innerHTML+=newChatLine;
			break;
			
			//the player enters the game
			case 11:
				ctx = canvas.getContext("2d");
				document.getElementById("mainscreen").style.display = "none";
				document.getElementById("mainchat").innerHTML = "";
				document.getElementById("gamescreen").style.display= "block";
				document.getElementById("gamechat").innerHTML = "";
					gameState=2;
				gameData=receivedData.newGame;	
					
				//initializes the board	
				board.init();
				ctx.save();
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.clearRect(0, 0, 400, 400);
				ctx.restore();
				
				draw();
				board.grid= new Array();
				board.pieces= new Array();
				board.init();
				ctx.save();
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.clearRect(0, 0, 400, 400);
				ctx.restore();
				draw();
				
				
				//figures out whose turn it is
				if(gameData.whoseTurn==playerName)
				{
					var addedText="It is your turn!";
					
					if(playerName==gameData.player1)
					addedText+="(Black)<br/>";
					else
					addedText+="(White)<br/>";
					document.getElementById("gamechat").innerHTML+=addedText;
				}
				else
				{
					var addedText="It is " + gameData.whoseTurn+ "'s turn.";
					if(playerName==gameData.player1)
					addedText+="(White)<br/>";
					else
					addedText+="(Black)<br/>";
					document.getElementById("gamechat").innerHTML+=addedText;
				}
			break;
			
			//new chat line added to the main chat associated with errros joining the game
			case 12:
				var errorMsg= receivedData.errorMsg;
				document.getElementById("mainchat").innerHTML+=(errorMsg+ "<br/>");
			break;
			
			//player receives an updated board when an opponent makes a move
			case 14:
				var sentBoard= receivedData.gameBoard;
				var sentPieces=  receivedData.gamePieces;
				var addedText="It is your turn!";
					
				if(playerName==gameData.player1)
				addedText+="(Black)<br/>";
				else
				addedText+="(White)<br/>";
				document.getElementById("gamechat").innerHTML+=addedText;
				board.grid=sentBoard;
				board.pieces=sentPieces;
				draw();
				
				//chacks to see if the game is over
				switch(checkGameOver())
				{
					case 1:				
					changeTurn();
					document.getElementById("gamechat").innerHTML+="No valid moves. You skip your turn.<br/>" + gameData.whoseTurn ;
					break;
					case 2:
					gameOver();
					
					break;
				}
				gameData.whoseTurn=playerName;
			break;
			//adds a new chat line to the player screeen
			case 17:
				var newChatLine= receivedData.chatData + "<br/>";
				document.getElementById("gamechat").innerHTML+=newChatLine;	
			break;
		 }
        });	
		 socket.addEventListener("error", function(event) {
          alert("Error: " + event);
        });
		
		//logs in the user when the login button is pressed
		loginbutton.addEventListener("click",function(){
						var strippedvalue = logininput.value.replace(/(<([^>]+)>)/ig,"");
			var objToSend={
			keyCode:0,
			loginData:strippedvalue
			}
			
			logininput.value = strippedvalue;
			socket.send(JSON.stringify(objToSend));
		});
		
		
		//sends the main chat when the main chat button is pressed
		// mainchatbutton.addEventListener("click",function(){
		// sendMainChat();
		// });
		
		//when the invite button is pressed, a player is invited to a game
		invitebutton.addEventListener("click",function(){
		if(personToInvite==playerName)
			alert("cannot invite yourself to a game");
		else if(personToInvite!="" && personToInvite!=" " && personToInvite!=null)
		{
			var objToSend={
			keyCode:7,
			inviteTo:personToInvite,
			inviteFrom: playerName
			}
			socket.send(JSON.stringify(objToSend));
			document.getElementById("mainchat").innerHTML+="invite to " + personToInvite + " sent.<br/>";
		}
		});
		
		// gamechatbutton.addEventListener("click",function(){
		// sendGameChat();
		// });
	}
	
	//when a player's name is clicked, that player's name changed red, to note that he has been selected
	inviteselect= function(playerToInvite){
		personToInvite=playerToInvite;
		var oldHTML=document.getElementById("userlist").innerHTML;
		oldHTML=oldHTML.replace("style=\"color:red\"","");
		var newHTML=oldHTML.replace("onclick=\"inviteselect(&quot;"+playerToInvite + "&quot;","style=\"color:red\" onclick=\"inviteselect(&quot;"+ playerToInvite + "&quot;");
		document.getElementById("userlist").innerHTML=newHTML;
	}
	
	
	//sends a message when an invite is accepted
	acceptInvite = function(targetPlayer){
		var o={
			keyCode:9,
			sentFrom:playerName,
			acceptedPlayer: targetPlayer
			}
		socket.send(JSON.stringify(o));
		removeInvites(targetPlayer);
	}
	
	//sends a message when an invite is declined
	declineInvite = function(targetPlayer){
		var o={
			keyCode:10,
			sentFrom:playerName,
			declinedPlayer: targetPlayer
			}
		socket.send(JSON.stringify(o));
		removeInvites(targetPlayer);
	}
	
	//removes the invites from a certain player whenever an invite is accepted or declined
	removeInvites = function(nameToRemove){
	var inviteText="Game invite recieved from " + nameToRemove + ".<input type=\"button\" onclick=\"acceptInvite(\'"+ nameToRemove + "\')\" value=\"Accept\">";
				inviteText+= "<input type=\"button\" onclick=\"declineInvite(\'"+ nameToRemove + "\')\" value=\"Decline\"><br>";
		var re= new RegExp(inviteText,"g");
		document.getElementById("mainchat").innerHTML=document.getElementById("mainchat").innerHTML.split(inviteText).join("")
	}
	

	// Draws resused images and saves them
	cacheImages = function() {
		var tempCanvas, tempCtx;

		// Draw board
		var sideWidth = NUM_ROWS * GRID_SIZE;
		tempCanvas = document.createElement("canvas");
		tempCanvas.width = sideWidth;
		tempCanvas.height = sideWidth;
		tempCtx = tempCanvas.getContext("2d");

		// Green board
		tempCtx.fillStyle = "#4C9E00";
		tempCtx.fillRect(0, 0, sideWidth, sideWidth);

		// Grid lines
		for (var i = 1; i < NUM_ROWS; i++) {
			for (var j = 1; j < NUM_COLS; j++) {
				tempCtx.moveTo(j * GRID_SIZE, 0);
				tempCtx.lineTo(j * GRID_SIZE, boardHeight);
				tempCtx.stroke();
			}
			tempCtx.moveTo(0, i * GRID_SIZE);
			tempCtx.lineTo(boardWidth, i * GRID_SIZE);
			tempCtx.stroke();
		}
		
		boardImage = new Image();
		boardImage.src = tempCanvas.toDataURL();
		
		// Draw white piece
		tempCtx.clearRect(0,0,tempCanvas.width,tempCanvas.height);
		tempCtx.fillStyle = "#FFFFFF";
		tempCtx.beginPath();
		tempCtx.arc(20, 20, 20, 0, Math.PI*2, true); 
		tempCtx.closePath();
		tempCtx.fill();
		whitePieceImage = new Image();
		whitePieceImage.src = tempCanvas.toDataURL();
		// Draw black piece
		
		tempCtx.clearRect(0,0,tempCanvas.width,tempCanvas.height);
		tempCtx.fillStyle = "#000000";
		tempCtx.beginPath();
		tempCtx.arc(20, 20, 20, 0, Math.PI*2, true); 
		tempCtx.closePath();
		tempCtx.fill();
		blackPieceImage = new Image();
		blackPieceImage.src = tempCanvas.toDataURL();
	}

	// Draws game board and pieces
	draw = function() {
		// Draw board image to screen
		ctx.drawImage(boardImage, 0, 0);
		// Draw pieces based on current board state
		for(var i = 0; i < board.pieces.length; i++) {
			var loc = board.pieces[i];
			ctx.drawImage(
				board.getStateAt(loc.x, loc.y) == CELL_STATES.WHITE ? 
					whitePieceImage : blackPieceImage,
				(loc.x * 50) + 5,(loc.y * 50) + 5);
		}
	}

	// Check for game over conditions
	checkGameOver = function() {
		var playerColor;
		if(gameData.player1==playerName)
		playerColor=CELL_STATES.BLACK;
		else
		playerColor=CELL_STATES.WHITE;
		
		var validMoveAvailable=false;
		var gridx=0, gridy=0;
		//goes through every blank tile and checks to see if one is a valid move for the player
		for (var gridx=0; gridx<NUM_ROWS; gridx++)
		{
			for(var gridy=0; gridy<NUM_ROWS; gridy++)
			{
				if(board.getStateAt(gridx,gridy) ==CELL_STATES.EMPTY)
				{
					//
					if(updateBoard(gridx,gridy,playerColor,false)>0)
					validMoveAvailable=true;
				}
			}
		}
		if(!validMoveAvailable)
		{
			if(playerColor==CELL_STATES.BLACK)
			playerColor=CELL_STATES.WHITE;
			else
			playerColor=CELL_STATES.BLACK;
			//if there is no valid move for the player, goes through every blank tile and checks to see if one is a valid move for the opposing player
			for (var gridx=0; gridx<NUM_ROWS; gridx++)
			{
				for(var gridy=0; gridy<NUM_ROWS; gridy++)
				{
					if(board.getStateAt(gridx,gridy) ==CELL_STATES.EMPTY)
					{
						if(updateBoard(gridx,gridy,playerColor,false)>0)
						validMoveAvailable=true;
					}
				}
			}
			if(!validMoveAvailable)//no moves available on either side
				return 2;
			else//no moves available on your side, but your opponent has valid moves
				return 1;
			
		}
		else//valid moves available
			return 0;
		
		
	}
	
	//goes through and updates the board based on a given move and color. if the changeBoard option is false, the board will not be updated, and simply returns whether
	//or not a given move would be valid.
	updateBoard = function(sentx,senty,color,changeBoard)
	{
		var oppColor;
		var changedPieceCount=0;
		var iterCount=0;
		if(color==CELL_STATES.BLACK)
		oppColor=CELL_STATES.WHITE;
		if(color==CELL_STATES.WHITE)
		oppColor=CELL_STATES.BLACK;
		//Start from checking upwards, and moving in a clockwise direction
		if(senty>0 && board.getStateAt(sentx,senty-1)==oppColor){
			var heldx=sentx;
			var heldy=(senty-1);
			iterCount=0;
			//checking upwards
			while(heldy>0 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx,heldy-1)==oppColor)
				heldy--;
				else if(board.getStateAt(heldx,heldy-1)==color ){
					while(heldy<=senty){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy++;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx,heldy-1)==CELL_STATES.EMPTY)
					break;				
			}
		}
		
		if(senty>0 && sentx<NUM_ROWS-1 &&board.getStateAt(sentx+1,senty-1)==oppColor){
			var heldx=sentx + 1;
			var heldy=(senty-1);
			iterCount=0;
			//checking upwards and rightwards
			while(heldy>0 && heldx<NUM_ROWS-1 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx+1,heldy-1)==oppColor){
				heldx++;
				heldy--;
				}
				else if(board.getStateAt(heldx+1,heldy-1)==color ){
					while(heldy<=senty && heldx>=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy++;
						heldx--;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx+1,heldy-1)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		if(sentx<NUM_ROWS-1 &&board.getStateAt(sentx+1,senty)==oppColor){
			var heldx=sentx + 1;
			var heldy=senty;
			iterCount=0;
			//checking rightwards
			while(heldx<NUM_ROWS-1 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx+1,heldy)==oppColor){
				heldx++;
				}
				else if(board.getStateAt(heldx+1,heldy)==color ){
					while(heldx>=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldx--;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx+1,heldy)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		if(senty<NUM_COLS-1 && sentx<NUM_ROWS-1 &&board.getStateAt(sentx+1,senty+1)==oppColor){
			var heldx=sentx+1;
			var heldy=senty+1;
			iterCount=0;
			//checking downwards and rightwards
			while(heldy<NUM_COLS-1 && heldx<NUM_ROWS-1 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx+1,heldy+1)==oppColor){
				heldx++;
				heldy++;
				}
				else if(board.getStateAt(heldx+1,heldy+1)==color ){
					while(heldy>=senty && heldx>=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy--;
						heldx--;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx+1,heldy+1)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		if(senty<NUM_COLS-1 && board.getStateAt(sentx,senty+1)==oppColor){
			var heldx=sentx;
			var heldy=(senty+1);
			iterCount=0;
			//checking downwards
			while(heldy<NUM_COLS-1 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx,heldy+1)==oppColor)
				heldy++;
				else if(board.getStateAt(heldx,heldy+1)==color ){
					while(heldy>=senty){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy--;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx,heldy+1)==CELL_STATES.EMPTY)
					break;				
			}
		}
		
		if(senty<NUM_COLS-1 && sentx>0 &&board.getStateAt(sentx-1,senty+1)==oppColor){
			var heldx=sentx-1;
			var heldy=senty+1;
			iterCount=0;
			//checking downwards and leftwards
			while(heldy<NUM_COLS-1 && heldx>0 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx-1,heldy+1)==oppColor){
				heldx--;
				heldy++;
				}
				else if(board.getStateAt(heldx-1,heldy+1)==color ){
					while(heldy>=senty && heldx<=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy--;
						heldx++;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx-1,heldy+1)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		if(sentx>0 &&board.getStateAt(sentx-1,senty)==oppColor){
			var heldx=sentx - 1;
			var heldy=senty;
			iterCount=0;
			//checking leftwards
			while(heldx>0 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx-1,heldy)==oppColor){
				heldx--;
				}
				else if(board.getStateAt(heldx-1,heldy)==color ){
					while(heldx<=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldx++;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx-1,heldy)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		if(senty>0 && sentx>0 &&board.getStateAt(sentx-1,senty-1)==oppColor){
			var heldx=sentx-1;
			var heldy=senty-1;
			iterCount=0;
			//checking leftwards and downwards
			while(heldy>0 && heldx>0 && iterCount<20){
				iterCount++;
				if(board.getStateAt(heldx-1,heldy-1)==oppColor){
				heldx--;
				heldy--;
				}
				else if(board.getStateAt(heldx-1,heldy-1)==color ){
					while(heldy<=senty && heldx<=sentx){
						if(changeBoard)
						board.updateCell(heldx,heldy,color);
						heldy++;
						heldx++;
						changedPieceCount++;
					}
					break;
				}
				else if(board.getStateAt(heldx-1,heldy-1)==CELL_STATES.EMPTY)
					break;
			}
		}
		
		return changedPieceCount;
	}
	
	
	//when the canvas is clicked and it is the players turn, checks to see if the move is valid 
	onClick = function(event) {
		var x = Math.floor(event.layerX / GRID_SIZE);
		var y = Math.floor(event.layerY / GRID_SIZE); 
		if(gameData.whoseTurn==playerName)
		{
			var playerColor;
			if(gameData.player1==playerName)
			playerColor=CELL_STATES.BLACK;
			else
			playerColor=CELL_STATES.WHITE;
			if(board.getStateAt(x,y) ==CELL_STATES.EMPTY)
			{
				if(updateBoard(x,y,playerColor,true)>0)
					changeTurn();
				else
					alert("invalid move!");
			}
		}
	}
	
	
	//sends the board with your move made to the opposite player
	changeTurn= function(){
		draw();
		var oppPlayer;
		if(gameData.player1==playerName)
		oppPlayer=gameData.player2;
		else
		oppPlayer=gameData.player1;
		gameData.whoseTurn=oppPlayer;
		var o={
			keyCode:13,
			sentBoard:board.grid,
			sentPieces:board.pieces,
			targetPlayer: oppPlayer
		}
		socket.send(JSON.stringify(o));
		var addedText="It is " + gameData.whoseTurn+ "'s turn.";
		if(playerName==gameData.player1)
		addedText+="(White)<br/>";
		else
		addedText+="(Black)<br/>";
		document.getElementById("gamechat").innerHTML+=addedText;
		if(checkGameOver()==2)
			gameOver();
	}
	
	
	//when the game is over, checks to see who won.
	gameOver= function(){
		gameData.whoseTurn="";
		var blackCount=0, whiteCount=0;
		for (var gridx=0; gridx<NUM_ROWS; gridx++)
		{
			for (var gridy=0; gridy<NUM_COLS; gridy++)
			{
				if(board.getStateAt(gridx,gridy)==CELL_STATES.BLACK)
				blackCount++;
				else if(board.getStateAt(gridx,gridy)==CELL_STATES.WHITE)
				whiteCount++;
			}
		}
		var winnerName="";
		var textOutput="";
		
		if(blackCount>whiteCount)
		{
			winnerName=gameData.player1;
			textOutput="Game over! " + winnerName + " wins! Score: " + blackCount + "-" + whiteCount;
		}
		else if(blackCount<whiteCount)
		{
			winnerName=gameData.player2;
			textOutput="Game over! " + winnerName + " wins! Score: " + whiteCount + "-" + blackCount;
		}
		else
		{
			textOutput="Game over! It's a tie! Score: " + whiteCount + "-" + blackCount;
		}
		textOutput+="<input type=\"button\" onclick=\"toMainMenu()\" value=\"Main Menu\"></input><br/>";
		document.getElementById("gamechat").innerHTML+=textOutput;
	}
	
	
	//called when the player clicks to toMain Menu button
	toMainMenu = function(){
				document.getElementById("mainscreen").style.display = "block";
				document.getElementById("mainchat").innerHTML = "";
				document.getElementById("gamescreen").style.display= "none";
				document.getElementById("gamechat").innerHTML = "";
					gameState=1;
				board.init();
			var o={
			keyCode:15,
			sentFrom:playerName,
			}
			socket.send(JSON.stringify(o));	
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, 400, 400);
			ctx.restore();			
	}
	
	
	//sends a main chat message to the server
	sendMainChat = function(){
		if(maininput.value!="")
		{
			var strippedvalue = maininput.value.replace(/(<([^>]+)>)/ig,"");
			var objToSend={
			keyCode:5,
			chatData:strippedvalue,
			sentFrom: playerName
			}
			maininput.value="";
			socket.send(JSON.stringify(objToSend));
		}
	}
	
	//sends a game chat message to the server
	sendGameChat = function(){
		if(gameinput.value!="")
		{
			var strippedvalue = gameinput.value.replace(/(<([^>]+)>)/ig,"");
			var opponent;
			if(gameData.player1==playerName)
			opponent=gameData.player2;
			else
			opponent=gameData.player1;
			var objToSend={
			keyCode:16,
			chatData:strippedvalue,
			targetPlayer: opponent,
			sentFrom: playerName
			}
			gameinput.value="";
			socket.send(JSON.stringify(objToSend));
		}
	}


	return {
		draw : draw,
		init : init
	}
}();