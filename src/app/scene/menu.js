define(function(require) {
    var Phaser = require('phaser');
    class menuScene extends Phaser.Scene {
        constructor() {
            super({
                key: 'menu'
            })
        }
        init() {
        }
        create() { //creating the menu screen            
            let playButton = this.physics.add.image(100, 100, 'ball'); 
            playButton.setInteractive();
            if(this.scene.isVisible('my_game')){
                this.scene.setVisible(false,'my_game');                  
            }else{
                return this.show_game();
            }
            playButton.on("pointerup", () => {                
                this.show_game();
            });        
        }
        show_game(){            
            this.scene.setVisible(true,'my_game');
            this.scene.sleep();
        }
    }
    return menuScene;
});