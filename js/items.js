function GameBoard(curBoard,gID,p1,p2){
				//ivars - unique for every instance
				this.layout=curBoard;
				this.gameId=gameId;
				this.player1=p1;
				this.player2=p2;
				this.whoseTurn=this.player1;
				return this;
			}
function ClientPlayer(pName,conn){
				//ivars - unique for every instance
				this.name=pName;
				this.inGame=false;
				this.gameId=0;
				this.connection=conn;
			}
function DataMessage(type,data,sentFrom){
				//ivars - unique for every instance
				this.msgType=type;
				this.sender=sentFrom;
				this.data=data;
			}

function Challenge(p1,p2,cID){
				//ivars - unique for every instance
				this.player1=p1;
				this.player2=p2;
				this.challengeID=this.cID;
			}