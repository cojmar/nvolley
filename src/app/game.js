define(function(require) {
    'use strict';    
    var Phaser = require('phaser');
    var net = require('./network');
    var Fingerprint = require('fingerprint');
    var fingerprint = new Fingerprint().get();
    var $ = require('jquery');

    console.log(fingerprint);
    net.socket.on('connect',function(){
        $(function(){
            net.send_cmd('auth', {user: 'VOLLEY-'+fingerprint});
        })
            
        
        
    });
    var game_assets = [];
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
            //  Enable world bounds, but disable the floor
            this.physics.world.setBoundsCollision(true, true, true, false);
    
            //  Create the bricks in a 10x6 grid
            this.bricks = this.physics.add.staticGroup({
                key: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
                frameQuantity: 10,
                gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
            });
    
            this.ball = this.physics.add.image(100, 480, 'ball').setCollideWorldBounds(true).setBounce(1);
            this.ball.setData('onPaddle', true);
    
            this.player1 = this.physics.add.image(400, 550, 'player1').setImmovable();
            this.player2 = this.physics.add.image(400, 550, 'player2').setImmovable();
    
            //  Our colliders
            this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
            this.physics.add.collider(this.ball, this.player1, this.hitPaddle, null, this);
            this.physics.add.collider(this.ball, this.player2, this.hitPaddle, null, this);
    
            //  Input events
            this.input.on('pointermove', function (pointer) {
    
                //  Keep the paddle within the game
                this.player1.x = Phaser.Math.Clamp(pointer.x, 52, 1748);
    
                if (this.ball.getData('onPaddle'))
                {
                    this.ball.x = this.player1.x;
                }
    
            }, this);
    
            this.input.on('pointerup', function (pointer) {
    
                if (this.ball.getData('onPaddle'))
                {
                    this.ball.setVelocity(-75, -300);
                    this.ball.setData('onPaddle', false);
                }
    
            }, this);
            
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
        }
    
    });
    
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
    return {
        init:function(my_assets){
            game_assets=my_assets;
            new Phaser.Game(config);    
        }
    }
    
});