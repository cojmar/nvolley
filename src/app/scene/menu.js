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
        create(){                   
            this.net = Phaser.net;
            setTimeout(()=>{
                if(!this.scene.isVisible('my_game')){                
                    this.net.show();
                }
            },200);
            if(this.scene.isVisible('my_game')){                
                this.scene.setVisible(false,'my_game');                  
            }else{                
                this.show_game();
            }
            
            if(this.net.room.type==='lobby'){                
                
                this.buttons = [
                    'Join public game',
                    'Host private game',
                    'Game rules',
                    'Credits'
                ];
            }else{
                this.buttons = [
                    'Return to game',
                    'Leave game',
                ];
            }
            this.active_button = 0;
            this.hoverSprite = this.physics.add.image(100, 100, 'ball'); 
            this.physics.add.image(550, 130, 'player1').scale = 1.2; 
            this.physics.add.image(650, 130, 'player2').scale = 1.5; 
            
            this.add.text(535, 40, 'Nvolley', 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"40px",
                color:"#9e00af"
            });
            this.add.text(538, 77, 'Beta version', 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"10px",
                color:"#4AA8A8"
            });


            let start_y = 30;            
            for (var but_index in this.buttons){
                let value = this.buttons[but_index];
                let button = this.add.text(140, start_y, value, 
                    { 
                        fontFamily: '"Roboto Condensed"',
                        fontSize:"30px",
                        color:"#395fa4"
                    });
                button.index = but_index;
                button.setInteractive();                
                button.on("pointerup", () => {                
                    this.do_action();
                }); 
                button.on("pointerover", () => {
                    this.set_active_button(button.index);        
                });
                this.buttons[but_index] = button;
                
                start_y +=40;
            }
            this.set_active_button();
              
        }
        set_active_button(index){            
            if(!index) index = 0;
            this.active_button = index;
            let button = this.buttons[index];
            this.buttons.forEach((menu_but)=>{
                menu_but.setColor('#395fa4');
            });
            button.setColor('#fff');
            if (['Join private game','Host private game'].indexOf(button.text)!==-1) button.setColor('#232344')
            
            
            this.hoverSprite.y = button.y + 15;
        }
        do_action(){
            let button = this.buttons[this.active_button];
            //console.log(button.text);
            switch (button.text){
                case 'Return to game':
                    this.show_game();
                break;
                case 'Leave game':
                    this.net.send_cmd('join', 'lobby');  
                    //this.scene.restart();
                break;
                case 'Join public game':
                    this.net.send_cmd('room_users', 'Volley Game - 1');  
                break;
                case 'Join private game':
                    button.setColor('#232344'); 
                break;
                
            }
        }
        show_game(){            
            if(this.net.room.type ==='lobby') return false;
            this.net.hide();
            this.scene.setVisible(true,'my_game');
            this.scene.stop();            
        }
    }
    return menuScene;
});