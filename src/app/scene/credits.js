define(function(require) {
    var Phaser = require('phaser');
    class creditsScene extends Phaser.Scene {
        constructor() {
            super({
                key: 'credits'
            })
        }
        init() {
        }
        create(){       
            this.net = Phaser.net;            
            this.net.hide();
            
            this.ball = this.physics.add.image(400, 80, 'ball').setCollideWorldBounds(true).setBounce(1);

            let button = this.add.text(700, 5, "Menu", 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#395fa4"
            });            
            button.setInteractive({ useHandCursor: true  });                
            button.on("pointerup", () => {                
                this.scene.start('menu');
            }); 
            button.on("pointerover", () => {
                button.setColor('#395fa4');     
                button.setColor('#fff');                    
            });
            button.on("pointerout", () => {
                button.setColor('#395fa4');                     
            });
            
            
            this.add.text(180, 50, ['Created and developed','Hosted and published','Chief Designer'].join(" by\n"), 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#000",
                lineSpacing: 130,
            });
            this.add.text(350, 50, ['                    Cojmar','                   ZaDarkSide','SandaX'].join("\n"), 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#000",
                lineSpacing: 130,
            });  
            
            this.text1 = this.add.text(180, 50, ['Created and developed','Hosted and published','Chief Designer'].join(" by\n"), 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#395fa4",
                lineSpacing: 130,
            });         
            this.text2 = this.add.text(350, 50, ['                    Cojmar','                   ZaDarkSide','SandaX'].join("\n"), 
            { 
                fontFamily: '"Roboto Condensed"',
                fontSize:"25px",
                color:"#3ff",
                lineSpacing: 130,
            });              
            
            this.p1 = this.physics.add.image(120, 100, 'player1').setImmovable(); 
            this.p1.scale = 1.5;
            this.p2 = this.physics.add.image(660, 100, 'player2').setImmovable();;
            this.p2.scale = 1.2; 
            

            this.tweens.add({
                targets: [this.text1,this.text2,this.p1,this.p2],
                duration: 1000,
                scaleX: 1.02,
                ease: 'Quad.easeInOut',
                repeat: -1,
                yoyo: true
            });

            this.tweens.add({
                targets: [this.text1,this.text2,this.p1,this.p2],
                duration: 1000,
                scaleY: 1.02,
                ease: 'Cubic.easeInOut',
                repeat: -1,
                yoyo: true
            });

            
            this.ball.body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, 800, 400));
            this.ball.setVelocity(300,-300);
            this.physics.add.collider(this.ball, [this.p1,this.p2,this.text1,this.text2]);
            this.bricks = this.physics.add.staticGroup({
                key: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
                frameQuantity: 10,
                gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 200 }
            });

            this.physics.add.collider(this.ball, this.bricks, (ball, brick)=>{
                brick.disableBody(true, true);
                if (this.bricks.countActive() === 0){
                    this.bricks.children.each(function (brick) {    
                        brick.enableBody(false, 0, 0, true, true);    
                    });
                }
            }, null, this);
       
            

        }
    }
    return creditsScene;
});