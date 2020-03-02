define(function(require) {
    var Phaser = require('phaser');
    return new Phaser.Class({
        Extends: Phaser.Scene,         
        initialize:    
        function my_game ()
        {
            Phaser.Scene.call(this, { key: 'my_game' });
            this.net = Phaser.net;
            this.bricks;
            this.player1;
            this.ball;
            this.status = 'lobby';
        },  
        create: function ()
        {   
            this.skill_prediction = this.net.room_info.users[this.net.room_info.me].data.skill_prediction || true;
            this.skill_prediction = (this.skill_prediction==="off")?false:true;
           
            //console.log(this.skill_prediction)
            if (this.net.game){
                return this.init_from_net();                     
            }
            this.net.game = this;
            //  Enable world bounds, but disable the floor
            this.physics.world.setBoundsCollision(true, true, true, false);

            //  Create the bricks in a 10x6 grid
            this.bricks = this.physics.add.staticGroup({
                key: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
                frameQuantity: 10,
                gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
            });

            var my_bricks = this.bricks.getChildren();
            for (var n in my_bricks){
                my_bricks[n].brick_index = n;                
            }    
            
            this.ball = this.physics.add.image(400, 480, 'ball').setCollideWorldBounds(true).setBounce(1);
            //this.ball.setCircle(25);
            this.ball.setData('onPaddle', true);
            this.ball.setVelocity(0,0);

            this.player1 = this.physics.add.image(200, 550, 'player1').setImmovable();
            this.player2 = this.physics.add.image(600, 550, 'player2').setImmovable();

            this.player1.body.setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, 410, 200)).setCollideWorldBounds(1);
            this.player2.body.setBoundsRectangle(new Phaser.Geom.Rectangle(410, 0, 390, 200)).setCollideWorldBounds(1);
        

            this.middle_net = this.physics.add.image(410, 550, 'net').setImmovable();

            //  Our colliders
            this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
            this.physics.add.collider(this.ball, this.player1, this.hitPaddle, null, this);
            this.physics.add.collider(this.ball, this.player2, this.hitPaddle, null, this);
            this.physics.add.overlap(this.ball, this.middle_net, this.hitPaddle, null, this);        

        
            //  Input events
            this.input.on('pointermove', function (pointer) {
                this.net.send_cmd('client.mouse',{
                    x:Phaser.Math.Clamp(pointer.x, 52, 1748)                    
                });
            }, this);

            this.input.on('pointerup',  (pointer) =>{
                this.net.send_cmd('client.click',{
                    x:Phaser.Math.Clamp(pointer.x, 52, 1748)                    
                });
                if (this.skill_prediction && !this.net.room.i_am_host){
                    if (this.net.game.ball.getData('onPaddle'))
                    {
                        this.net.game.ball.setVelocity(-75,-300);                                    
                    }
                }
            }, this);               
            
            this.input.keyboard.on('keyup-' + 'ESC',  (event)=> {                
                this.show_menu();
            });
           //Prediction button
           let p_button = this.add.text(530, 5, this.skill_prediction?"Prediction ON":"Prediction OFF", 
           { 
               fontFamily: '"Roboto Condensed"',
               fontSize:"25px",
               color:"#395fa4"
           });
           p_button.setInteractive({ useHandCursor: true  });                
           p_button.on("pointerup", () => {                                
                this.net.send_cmd('set_data',{skill_prediction:(this.skill_prediction)?"off":"on"});
            }); 
            p_button.on("pointerover", () => {
                p_button.setColor('#395fa4');     
                p_button.setColor('#fff');                    
            });
            p_button.on("pointerout", () => {
                p_button.setColor('#395fa4');                     
            });
            

            this.net.socket.on('room.user_data', (data)=>
		    {                
                let old_prediction =this.skill_prediction;
                //console.log(this.net.room_info.users[this.net.room_info.me].data.skill_prediction);
                this.skill_prediction = this.net.room_info.users[this.net.room_info.me].data.skill_prediction || true;
                this.skill_prediction = (this.skill_prediction==="off")?false:true;
                p_button.text=this.skill_prediction?"Prediction ON":"Prediction OFF";
                if (!old_prediction === this.skill_prediction) this.init_from_net();       
                
            });
            this.p_button = p_button;
            
            //Menu button
            let button = this.add.text(700, 5, "Menu", 
                { 
                    fontFamily: '"Roboto Condensed"',
                    fontSize:"25px",
                    color:"#395fa4"
                });
            
            button.setInteractive({ useHandCursor: true  });                
            button.on("pointerup", () => {                
                this.show_menu();
            }); 
            button.on("pointerover", () => {
                button.setColor('#395fa4');     
                button.setColor('#fff');                    
            });
            button.on("pointerout", () => {
                button.setColor('#395fa4');                     
            });
            this.init_from_net();
        },
        process_game_data:function(data){     
            if(data.status){
                this.status = data.status;
            }
            if (data.player1){
                if(data.player1.position){                        
                    this.player1.setPosition(data.player1.position.x,this.player1.y);             
                    //  Keep the paddle within the game    
                    /*         
                    if (this.ball.getData('onPaddle'))
                    {
                        this.ball.x = this.player1.x;
                    }
                    */
                }
            }
            if (data.player2){
                if(data.player2.position){
                    this.player2.setPosition(data.player2.position.x,this.player2.y);;             
                }
            }                
            if (data.ball){
                
                if(typeof data.ball.onPaddle !=='undefined'){
                    this.ball.setData('onPaddle', data.ball.onPaddle);
                }
                
                if (!this.net.room.i_am_host){
                    
                    if (data.ball.Velocity){
                        if (this.ball.body.velocity.x !== data.ball.Velocity[0]){
                            if(this.skill_prediction)  this.ball.setVelocityX(data.ball.Velocity[0]);
                        }
                        if (this.ball.body.velocity.y !== data.ball.Velocity[1]){
                            if(this.skill_prediction) this.ball.setVelocityY(data.ball.Velocity[1]);
                        } 
                        //this.ball.setVelocity(data.ball.Velocity[0],data.ball.Velocity[1]);
                    }                        
                    if(this.skill_prediction){
                        let dev =50;
                        if (this.ball.x < data.ball.x-dev || this.ball.x > data.ball.x+dev || this.ball.y < data.ball.y-dev || this.ball.y > data.ball.y+dev)                       
                       this.init_from_net();

                        return false;
                    } 
                    if(data.ball.x){
                    this.ball.x = data.ball.x;
                    }
                    if(data.ball.y){
                        this.ball.y = data.ball.y;
                    }
                }
            }
            if (data.broken_bricks){     
                setTimeout( ()=>{
                    var game = this.net.room.data.game;              
                    game.broken_bricks = data.broken_bricks
                    var my_bricks = this.bricks.getChildren();
                    for (var n in my_bricks){
                        var brick = my_bricks[n];
                        if (game.broken_bricks.indexOf(n)!==-1){                        
                            brick.disableBody(true, true);
                        }else{
                            brick.enableBody(false, 0, 0, true, true);    
                        }                       
                    }              
                })           
                

            }
            
           
           
            
        },
        hitBrick: function (ball, brick)
        {
            if (this.net.room.i_am_host || this.skill_prediction) brick.disableBody(true, true);
            if (!this.net.room.i_am_host) return false;
            if (this.net.room.i_am_host){
                var broken_bricks =  JSON.parse(JSON.stringify(this.net.room.data.game.broken_bricks));
                if(broken_bricks.indexOf(brick.brick_index)===-1){
                    broken_bricks.push(brick.brick_index);
                }               
                this.net.send_cmd('set_room_data',{
                    game:{
                        broken_bricks:broken_bricks
                    }  
                });
                this.net.send_cmd('host.remove_brick',brick.brick_index);                     
            }
                
            if (this.bricks.countActive() === 0)
            {
                if (this.net.room.i_am_host){
                    this.net.send_cmd('set_room_data',{
                        game:{
                            broken_bricks:false
                        }  
                    });
                    this.net.send_cmd('set_room_data',{
                        game:{
                            broken_bricks:[]
                        }  
                    });
                    this.net.send_cmd('host.reset_level');                
                }                
            }
        },

        resetBall: function ()
        {
            if (!this.ball) return false;
            this.ball.setVelocity(0);
            this.ball.setPosition(this.ball.x, 480);
            this.ball.setData('onPaddle', true);
        },

        resetLevel: function ()
        {
            this.resetBall();    
            if (!this.bricks) return false;
            this.bricks.children.each(function (brick) {    
                brick.enableBody(false, 0, 0, true, true);    
            });
        },

        hitPaddle: function (ball, paddle)
        {
            if (!this.net.room.i_am_host && !this.skill_prediction) return false;
            var diff = 0;                    

            if (ball.x < paddle.x)
            {
                //  Ball is on the left-hand side of the paddle
                diff = paddle.x - ball.x;
                ball.setVelocityX(-10 * diff);                
            }
            else if (ball.x > paddle.x)
            {
                //  Ball is on the right-hand side of the paddle
                diff = ball.x -paddle.x;
                ball.setVelocityX(10 * diff);                
            }
            else
            {
                //  Ball is perfectly in the middle
                //  Add a little random X to stop it bouncing straight up!
                var new_v = 2 + Math.random() * 8;
                ball.setVelocityX(new_v);                
            }    
        
        },       
        update_ball_on_net: function(){            
            if (!this.net.room.i_am_host) return false;
            if(!this.net.room.data.game) return false;
            if(!this.ball.body) return false;
            var game = JSON.parse(JSON.stringify(this.net.room.data.game));
            var update = {};
            var local_ball = {
                x: parseFloat(this.ball.x.toFixed(2)),
                y:parseFloat(this.ball.y.toFixed(2)),
                Velocity:[Math.round(this.ball.body.velocity.x),Math.round(this.ball.body.velocity.y)]
            }
            for (var n in local_ball){
                if (typeof local_ball[n] !=='object'){
                    if(game.ball[n] != local_ball[n]){
                        update[n] = local_ball[n];    
                    }
                }
                else{
                    if (JSON.stringify(game.ball[n]) !== JSON.stringify(local_ball[n])){
                        update[n] = local_ball[n];                     
                    }
                    
                }                
            }
            
            if (Object.keys(update).length>0)
            {            
                //console.log(JSON.stringify(update,null,2));
                this.net.send_cmd('set_room_data',{
                    game:{
                        ball:update
                    }                    
                });
            }            
        },    
        update: function ()
        {   
            
            let is_visible = this.scene.isVisible();
            let game_ui_visible = this.scene.isVisible('game_ui');
            if (is_visible !== game_ui_visible) this.scene.setVisible(is_visible,'game_ui');


            if (this.status !=this.old_status){                
                this.old_status = this.status;                
                if (this.status !=='ready'){
                    this.player1.visible = this.player2.visible= this.middle_net.visible = this.ball.visible = false;
                }
                else{
                    this.player1.visible = this.player2.visible= this.middle_net.visible = this.ball.visible = true;
                }
            }

            if (!this.net.room.i_am_host){
                if (this.skill_prediction && this.ball.y > 740) this.resetBall();
                 return false;
            }
            if (this.ball.y > 640)
            {
                this.net.send_cmd('host.reset_ball');
            }
            else{             
                this.update_ball_on_net();                         
            }
        },
        show_menu:function(){
            this.scene.launch('menu');
        },
        init_from_net: function (){
            if(!this.net) return false;
            if(!this.net.room) return false;
            
            this.resetLevel();
            var game = this.net.room.data.game;
            if (!game) return false;
            this.status = game.status;            
            this.player1.setPosition(game.player1.position.x,game.player1.position.y);
            this.player2.setPosition(game.player2.position.x,game.player2.position.y);
            this.ball.setPosition(game.ball.x,game.ball.y);
            if(game.ball.Velocity[0]===game.ball.Velocity[1] && game.ball.Velocity[0] === 0){
                game.ball.onPaddle = true;
            }

            this.ball.setData('onPaddle', game.ball.onPaddle);

            //console.log(game.ball);
            if (this.net.room.i_am_host){
                this.ball.setVelocity(game.ball.Velocity[0],game.ball.Velocity[1]);
                
            }else{
                this.ball.setVelocity(0,0);
                if (this.skill_prediction) this.ball.setVelocity(game.ball.Velocity[0],game.ball.Velocity[1]);
            }

            

            var my_bricks = this.bricks.getChildren();
            for (var n in my_bricks){
                if (game.broken_bricks.indexOf(n)!==-1){
                    var brick = my_bricks[n];
                    brick.disableBody(true, true);
                }                       
            }
        }

    });
});


