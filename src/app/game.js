define(function(require) {
    'use strict';    
    var Phaser = require('phaser');
    var config = require('json!./config.json');
    var net = require('./network').start(config.network);   
    var Fingerprint = require('fingerprint');
    var fingerprint = new Fingerprint().get();
    var $ = require('jquery');
    
    
    var room = false;
   

    function init_net_room(){
        function do_merge(data1,data2){        
            if (typeof data1 !=='object' || typeof data2 !=='object'){
                data1 = data2;
                return data1;
            }
            for(var n in data2){
                if (!data1[n]){
                    data1[n] = data2[n];
                }else{
                    if (typeof data1[n] ==='object'){
                        do_merge(data1[n],data2[n]);                    
                    }else{
                        data1[n] = data2[n];
                    }
                }            
            }
        }
        function log_room(){
            $(net.output_div).html('');
            net.log(net.room);
        } 
        net.room = false;   
        net.socket.on('connect',function(){
            $(function(){
                net.send_cmd('auth', {user: 'VOLLEY-'+fingerprint});            
            })
        });        
        net.socket.on('room.info',function(room_data){
            if (room_data.type==='lobby'){
                net.send_cmd('join', 'Volley Game 1');
                return false;
            }
            net.room = room_data;
            net.room.i_am_host = (net.room.host === net.room.me)?true:false;            
            if (!net.room.data.game && net.room.i_am_host) init_game();
            else if(net.room.data.game) start_game();
            log_room();            
        });
        net.socket.on('room.data',function(data){
            if (!net.room) return false;
            do_merge(net.room.data,data.data);
            if (data.data.game && net.game && net.game.process_game_data) net.game.process_game_data(data.data.game);            
            log_room();
        });
        net.socket.on('room.host',function(host){            
            if (!net.room) return false;
            net.room.host = host;
            net.room.i_am_host = (net.room.host === net.room.me)?true:false;
            if (!net.room.data.game && net.room.i_am_host) init_game();            
            log_room();
        });
        net.socket.on('room.user_join', function(data)
		{
            if (!net.room) return false;
            net.room.users[data.user] = data.data;
            if(net.room.data.game){
                if(net.room.data.game.player1.user === false ){
                    net.send_cmd('set_room_data',{
                        game:{
                            player1:{
                                user:data.user
                            }
                        }
                    });   
                }
                if(net.room.data.game.player2.user === false ){
                    net.send_cmd('set_room_data',{
                        game:{
                            player2:{
                                user:data.user
                            }
                        }
                    });   
                }                
            }
			log_room();
		});		
		net.socket.on('room.user_leave', function(data)
		{
            if (!net.room) return false;
            if (net.room.users[data.user]) delete net.room.users[data.user];
            if(net.room.data.game){
                if(net.room.data.game.player1.user === data.user ){
                    net.send_cmd('set_room_data',{
                        game:{
                            player1:{
                                user:false
                            }
                        }
                    });   
                }
                if(net.room.data.game.player2.user === data.user ){
                    net.send_cmd('set_room_data',{
                        game:{
                            player2:{
                                user:false
                            }
                        }
                    });   
                }                
            }            
			log_room();
        });
        net.socket.on('room.user_data', function(data)
		{
            if (!net.room) return false;
            do_merge(net.room.users[data.user].data,data.data);
            log_room();
        });
        
        //==Custom
        net.socket.on('client.mouse', function(data)
		{
            if (!net.room) return false;
            if (!net.room.data.game) return false;
            
            if (data.user === net.room.data.game.player1.user){
                net.send_cmd('set_room_data',{
                    game:{
                        player1:{
                            position:data.data
                        }
                    }
                });                
            }
            if (data.user === net.room.data.game.player2.user){
                net.send_cmd('set_room_data',{
                    game:{
                        player2:{
                            position:data.data
                        }
                    }
                });                
            }
            
            
        });    

        return net.room;
    }
    function init_game(){
        console.log('init_game');
        var game = {

            player1:{
                user:Object.keys(net.room.users)[0] || false,
                mouse:{
                    x:0,
                },
                position:{
                    x:400,
                    y:550
                }
                
            },
            player2:{
                user:Object.keys(net.room.users)[1] || false,
                mouse:{
                    x:0,
                },
                position:{
                    x:400,
                    y:550
                }                
            },
            ball:{
                x:100,
                y:480,
                onPaddle:true,
                Velocity:[0,0],
            },
        }
        net.send_cmd('set_room_data',{game:game});
    }

    var my_game = new Phaser.Class({
        Extends: Phaser.Scene,    
        initialize:    
        function my_game ()
        {
            Phaser.Scene.call(this, { key: 'my_game' });
    
            this.bricks;
            this.player1;
            this.ball;
        },
        svg2texture:function(key, svg_text,ctx) {            
            var svg_image = new Image()
            svg_image.onload = function(){
                ctx.textures.addImage(key, svg_image)                
            }
            svg_image.src = 'data:image/svg+xml,' + encodeURIComponent(svg_text)
            
        },
        preload:function()
        {
            this.load.svg('favicon', 'favicon.ico');
            for (var n in game_assets){
            this.svg2texture(game_assets[n].name, game_assets[n].svg,this);
            }
        },    
        create: function ()
        {
            net.game = this;
            //  Enable world bounds, but disable the floor
            this.physics.world.setBoundsCollision(true, true, true, false);
    
            //  Create the bricks in a 10x6 grid
            this.bricks = this.physics.add.staticGroup({
                key: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
                frameQuantity: 10,
                gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
            });
            var net_ball = net.room.data.game.ball;   
            var net_player1 = net.room.data.game.player1;
            var net_player2 = net.room.data.game.player2;
            this.ball = this.physics.add.image(net_ball.x, net_ball.y, 'ball').setCollideWorldBounds(true).setBounce(1);
            this.ball.setData('onPaddle', net_ball.onPaddle);
            this.ball.setVelocity(...net_ball.Velocity);
    
            this.player1 = this.physics.add.image(net_player1.position.x, net_player1.position.y, 'player1').setImmovable();
            this.player2 = this.physics.add.image(net_player2.position.x, net_player2.position.y, 'player2').setImmovable();
    
            //  Our colliders
            this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
            this.physics.add.collider(this.ball, this.player1, this.hitPaddle, null, this);
            this.physics.add.collider(this.ball, this.player2, this.hitPaddle, null, this);
    
            //  Input events
            this.input.on('pointermove', function (pointer) {
                net.send_cmd('client.mouse',{
                    x:Phaser.Math.Clamp(pointer.x, 52, 1748)                    
                });
            }, this);

            this.input.on('pointerup', function (pointer) {
                if (this.ball.getData('onPaddle'))
                {
                    net.send_cmd('set_room_data',{
                        game:{
                            ball:{
                                Velocity:[-75, -300],
                                onPaddle:false,
                            }
                        }                    
                    });
                }
            }, this);

            this.process_game_data = function(data){
                if (data.ball){
                    
                    if(typeof data.ball.onPaddle !=='undefined'){
                        this.ball.setData('onPaddle', data.ball.onPaddle);
                    }
                    if (data.ball.Velocity){
                        this.ball.setVelocity(...data.ball.Velocity);
                    }
                    if (!net.room.i_am_host){
                     
                        if(data.ball.x){
                            this.ball.x = data.ball.x
                        }
                        if(data.ball.y){
                            this.ball.y = data.ball.y
                        }
                    }
                }

                if (data.player1){
                    if(data.player1.position){                        
                        this.player1.x = data.player1.position.x;
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
                        this.player2.x = data.player2.position.x
                    }
                }
                
                
                
            }      
    
          
            
        },
    
        hitBrick: function (ball, brick)
        {
            brick.disableBody(true, true);
    
            if (this.bricks.countActive() === 0)
            {
                this.resetLevel();
            }
        },
    
        resetBall: function ()
        {
            this.ball.setVelocity(0);
            this.ball.setPosition(this.player1.x, 480);
            this.ball.setData('onPaddle', true);       
            net.send_cmd('set_room_data',{
                game:{
                    ball:{
                        Velocity:this.ball.body.Velocity,
                        onPaddle:this.ball.getData('onPaddle'),
                        x:this.ball.x,
                        y:this.ball.y
                    }
                }                    
            });
        },
    
        resetLevel: function ()
        {
            this.resetBall();
    
            this.bricks.children.each(function (brick) {
    
                brick.enableBody(false, 0, 0, true, true);
    
            });
        },
    
        hitPaddle: function (ball, paddle)
        {
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
                ball.setVelocityX(2 + Math.random() * 8);
            }
        },
    
        update: function ()
        {            
            if (this.ball.y > 600)
            {
                this.resetBall();
            } 

            net.send_cmd('set_room_data',{
                game:{
                    ball:{
                        Velocity:this.ball.body.Velocity,
                        onPaddle:this.ball.getData('onPaddle'),
                        x:this.ball.x,
                        y:this.ball.y
                    }
                }                    
            });
            
        }
    
    });
    var game_started = false;
    function start_game(){
        if (game_started){
                if (net.room.data.game && net.game && net.game.process_game_data) net.game.process_game_data(net.room.data.game);            
             return false;
        }
        game_started = true;
        var config = {
            type: Phaser.WEBGL,
            backgroundColor: '#2a2a55',
            width: "100%",
            height: "100%",        
            scene: [ my_game ],
            physics: {
                default: 'arcade',
                arcade: {
                //  debug: true,                
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,         
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
        };
        new Phaser.Game(config);    
    }
    
    var game_assets = [];
 

    
    


    return {
        init:function(my_assets){
            game_assets=my_assets;
            init_net_room();            
        }
    }  
});