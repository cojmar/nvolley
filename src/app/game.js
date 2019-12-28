define(function(require) {
    'use strict';    
    var Phaser = require('phaser');
    var config = require('json!./config.json');
    var net = require('./network').start(config.network);   
    Phaser.net = net;
    var Fingerprint = require('fingerprint');
    var fingerprint = new Fingerprint().get();
    var $ = require('jquery');
    function init_net_room(){
        function do_merge(data1,data2){        
            if (typeof data1 !=='object' || typeof data2 !=='object'){
                data1 = data2;
                return true;
            }
            for(var n in data2){
                if (!data1[n]){
                    data1[n] = data2[n];
                }else{
                    if (typeof data1[n] ==='object' && typeof data2[n] ==='object'){
                        do_merge(data1[n],data2[n]);                    
                    }else{
                        data1[n] = data2[n];
                    }
                }            
            }
            return true;
        }
        function log_room(){
            return false;
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
            net.room = room_data;
            net.room.i_am_host = (net.room.host === net.room.me)?true:false;
            let show_menu = (room_data.type==='lobby')?true:false;
            if (!net.room.data.game && net.room.i_am_host) init_game();
            else start_game(show_menu);
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
            if (net.room.i_am_host){
                if (!net.room.data.game){
                     init_game();
                }
                else{
                     net.game.ball.setVelocity(net.room.data.game.ball.Velocity[0],net.room.data.game.ball.Velocity[1]);
                }
            }
            log_room();
        });
        net.socket.on('room.user_join', function(data)
		{
            if (!net.room) return false;
            net.room.users[data.user] = data.data;
            if(net.room.data.game && net.room.i_am_host){
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
            if(net.room.data.game && net.room.i_am_host){
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
                if (data.data.x > 375) data.data.x = 375;
                net.send_cmd('set_room_data',{
                    game:{
                        player1:{
                            position:data.data
                        }
                    }
                });                
            }
            if (data.user === net.room.data.game.player2.user){
                if (data.data.x < 445) data.data.x = 445;
                net.send_cmd('set_room_data',{
                    game:{
                        player2:{
                            position:data.data
                        }
                    }
                });                
            }
        });
        net.socket.on('client.click', function(data)
		{
            if (!net.room) return false;
            if (!net.room.data.game) return false;
            
            if (data.user === net.room.data.game.player1.user || data.user === net.room.data.game.player2.user){
                if (net.game.ball.getData('onPaddle'))
                {
                    net.game.ball.setVelocity(-75,-300);
                    net.send_cmd('set_room_data',{
                        game:{
                            ball:{
                                Velocity:[-75, -300],
                                onPaddle:false,
                            }
                        }                    
                    });                    
                }               
            }      
        });

        net.socket.on('host.reset_level', function(data)
		{            
            net.game.resetLevel();      
        });
        net.socket.on('host.reset_ball', function(data)
		{            
            net.game.resetBall();
        });
        net.socket.on('host.remove_brick', function(data)
		{            
            if(net.room.i_am_host) return false;            
            var my_bricks = net.game.bricks.getChildren();
            for (var n in my_bricks){
                if (n === data.data){
                    var brick = my_bricks[n];
                    brick.disableBody(true, true);
                    break;
                }                       
            }
            
        });
        return net.room;
    }    
    function init_game(){
        //console.log('init_game');
        var game = {
            player1:{
                user:Object.keys(net.room.users)[0] || false,                
                position:{
                    x:200,
                    y:550
                }
                
            },
            player2:{
                user:Object.keys(net.room.users)[1] || false,                
                position:{
                    x:600,
                    y:550
                }                
            },
            ball:{
                x:400,
                y:480,
                onPaddle:true,
                Velocity:[0,0],
            },
            broken_bricks:[],
        }
        net.send_cmd('set_room_data',{game:game});
        start_game();
    }
    var game = false;
    function start_game(show_menu){
        if (game){
            game.scene.scenes[1].init_from_net(); 
            if (net.room.type ==='lobby'){
                net.game.scene.launch('menu');
            }else{
                net.game.scene.stop('menu');
                net.game.scene.setVisible(true,'my_game');
            }
            return false;
        }        
        var config = {
            type: Phaser.WEBGL,
            backgroundColor: '#2a2a55',
            width: "100%",
            height: "100%",        
            scene: gameScenes,            
            physics: {
                default: 'arcade',
                arcade: {
                  //debug: true,                
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,         
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
        };
        game = new Phaser.Game(config);           
        if(!show_menu){
            setTimeout(()=>{
                net.game.scene.stop('menu');
                net.game.scene.setVisible(true,'my_game');                    
            },100);
        }

    }
    var gameScenes = [];

    return {
        init:function(my_assets){                        
            init_net_room();               
            gameScenes.push(require('./scene/preload').init(my_assets));
            gameScenes.push(require('./scene/volley'));
            gameScenes.push(require('./scene/menu'));
            $('#loader').slideUp(200);
        }
    }  
});