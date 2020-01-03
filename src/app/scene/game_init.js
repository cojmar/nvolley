define(function(require) {
    var Phaser = require('phaser');
    class gameInitScene extends Phaser.Scene {
        constructor() {
            super({
                key: 'game_init'
            })
            this.net = Phaser.net;
        }
        init() {
        }
        create(){       
                        
            console.log('game_init');            
            let button = this.add.text(600, 5, "Game", 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#395fa4"
            });            
            button.setInteractive({ useHandCursor: true  });                
            button.on("pointerup", () => {                
                this.net.game.show_game();
            }); 
            button.on("pointerover", () => {
                button.setColor('#395fa4');     
                button.setColor('#fff');                    
            });
            button.on("pointerout", () => {
                button.setColor('#395fa4');                     
            });     
            this.p1 = this.physics.add.image(120, 100, 'player1').setImmovable(); 
            this.p1.scale = 1.5;
            this.p2 = this.physics.add.image(660, 100, 'player2').setImmovable();;
            this.p2.scale = 1.2; 

        }
    }
    return gameInitScene;
});