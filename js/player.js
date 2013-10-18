function Player(pName,conn){
				//ivars - unique for every instance
				this.name=pName;
				this.inGame=false;
				this.gameId=0;
				this.connection=conn;
			}
/*var player = Othello.namespace("Player");
player= function(pName,conn){
		this.name=pName;
		this.inGame=false;
		this.gameId=0;
		this.connection=conn;
		return this;
}();*/