function GameBoard(curBoard,gID,p1,p2){
				//ivars - unique for every instance
				this.layout=curBoard;
				this.gameId=gameId;
				this.player1=p1;
				this.player2=p2;
				this.whoseTurn=this.player1;
				return this;
			}




/*var board = Othello.namespace("server.Board");
board= function(curBoard,gID,p1,p2){
				//ivars - unique for every instance
				this.layout=curBoard;
				this.gameId=gameId;
				this.player1=p1;
				this.player2=p2;
				this.whoseTurn=this.player1;
				return this;
};*/