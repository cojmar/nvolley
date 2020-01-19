define(function(require) {
    var io = require('socket.io');
    //console.log(config);
	var client_loader ={};
	var client = {}
	client_loader.init_client = function(config)
	{
		if (typeof config !=='object') return false;
		var server = config.servers[config.server];
		client =
			{
				socket: io(server),		
				config:config,
				server:server
			};
		//==Add client functions
		//===>Soket  functions
		client.send_cmd = function(cmd, data)
		{
			client.socket.send({cmd: cmd, data: data});
		};
		if (client.config.mode >= 2) return client_loader.load_ui();
		return client;
	};
	client_loader.load_ui = function()	
	{			
		var host = false;
		var me = false;
		var $ = require('jquery');    
        var network_ui = require('text!assets/network_ui.html');
        $('body').append(network_ui);
		
		client.console= $('#client_console');
		client.text_input= $('#client_command');
		client.text_input_button= $('#client_command_send');
		client.output_div= document.getElementById('client_output');
		client.client_room_users= $('#client_room_users');
		client.client_room= $('#client_room');
		
		client.colors =
		[
			'#5570a388',
			'#395fa4',
			'#159904',
			'#0a0a13'
		];
		        
        
		//== Room functions 
		client.socket.on('room.info', function(data)
		{				
			client.room_info = data;
			var r_users = '';
			me = data.me;
			for (var n in data.users){
				var color=(n!==data.me)?client.colors[3]:client.colors[1];				
				if (n===data.host){
					 color = client.colors[2];
					 host = data.host;
				}
					
				
				r_users +="<div id=\"room_user_"+n+"\" style=\"color:"+color+";\">"+data.users[n].info.nick+"</div>";					
			}
			client.text_input.attr("placeholder", ' You are Typing as "'+data.users[data.me].info.nick+'" on "' +data.name+ '"');
			client.client_room_users.html(r_users);
			client.client_room.html(data.name);
		});
		client.socket.on('room.host', function(data)
		{	
			if (host){
				var color=(host!==me)?client.colors[3]:client.colors[1];
				 $('#room_user_'+host).css('color',color);
				 host = data;
			} else host = data;
			$('#room_user_'+host).css('color',client.colors[2]);			
			
		});
		client.socket.on('room.user_join', function(data)
		{				
			client.client_room_users.append("<div id=\"room_user_"+data.user+"\" style=\"color:"+client.colors[3]+"\">"+data.data.info.nick+"</div>");				
		});			
		client.socket.on('room.user_leave', function(data)
		{
			$("#room_user_"+data.user).remove();				
		});
		if (client.config.debug){			
		client.socket.on('room.data', function(data)
		{
			client.log('room.data',3);
			client.log(data,3);
		});		
		
		client.socket.on('room.user_data', function(data)
		{
			client.log('room.user_data',3);
			client.log(data,3);
		});

		client.socket.on('room.user_join', function(data)
		{
			client.log('room.user_join',3);
			client.log(data,3);
		});				
		
		client.socket.on('room.user_leave', function(data)
		{
			client.log('room.user_leave',3);
			client.log(data,3);
		});
		client.socket.on('room.user_reconnect', function(data)
		{
			client.log('room.user_reconnect',3);
			client.log(data,3);
		});				
		
		client.socket.on('room.user_disconnect', function(data)
		{
			client.log('room.user_disconnect',3);
			client.log(data,3);
		});
		client.socket.on('my.info', function(data)
		{
			client.log('my.info',3);
			client.log(data,3);
		});		           
		client.socket.on('room.info', function(data)
		{
			client.log('room.info',3);
			client.log(data,3);
		});		
		
		//== END room functions */
		}
		client.socket.on('server.help', function(data)
		{		
			var msg="";	
			for (var n in data){
				msg +="<a class='do_cmd' style='cursor:pointer;color:"+client.colors[2]+";'>/"+data[n]+" </a> "
			}
			client.log(msg);
			$('.do_cmd').on('click',function(){
				client.text_input.val($(this).html());
				client.text_input.focus();

			});
		});
		client.socket.on('room.msg', function(data)
		{
			let nick = data.user;
			if (client.room_info){
				nick = client.room_info.users[data.user].info.nick;
			}
			msg = '<span style="color:'+client.colors[3]+';">[' + nick + '] </span>' + data.msg;
			client.log(msg);
		});

		client.socket.on('room.user_info',function(data){			
			if (client.room_info.users[data.user]){
				for (var n in data.info){
					client.room_info.users[data.user].info[n] = data.info[n];
				}
				if(data.info.nick){					
					$('#room_user_'+data.user).html(data.info.nick);
					
				}
			}			
		});

		client.socket.on('server.msg', function(data)
		{
			client.log(data, 2);
		});

		client.socket.on('silent.msg', function(data)
		{
			client.log(data, 1);
		});

		client.socket.on('connect', function(data)
		{
			client.chat_id = '<span style="color:#2c487e;">[' + client.socket.id + '] </span>';
			client.log('[connected][' + client.server + ']  [id][' + client.socket.id + ']', 0);		
		});

		client.socket.on('disconnect', function(data)
		{
			client.log('[disconnected][' + client.server + ']', 0);
		});

		//===>DOM  functions
		client.clear_log = function(){
			if (client.output_div)
			{
				$(client.output_div).html('');
			}
		};
		client.log = function(txt, color)
		{
			if (typeof color === 'undefined') color = 0;
			if (!client.output_div)
			{
				if (client.config.mode === 1)
				{
					console.log(txt);
				}

				return false;
			}

			var colors =client.colors;

			color = (typeof colors[color] !== 'undefined') ? 'style="color:' + colors[color] + '"' : '';			
			if (typeof txt === 'object')
			{
				txt = '<br><xmp>' + JSON.stringify(txt, null, 2) + '</xmp>';
			}

			var d = new Date();

			var time_stamp =
				[
					'<span style="color:'+colors[1]+';">[',
					('0' + d.getHours()).slice(-2),
					':',
					('0' + d.getMinutes()).slice(-2),
					':',
					('0' + d.getSeconds()).slice(-2),
					']&nbsp;</span>'
				].join('');

			txt = time_stamp + txt;
			$(client.output_div).append('<div ' + color + '>' + txt + '</div>');
			client.output_div.scrollTop = client.output_div.scrollHeight;
		};

		client.show = function()
		{
			client.console.slideDown(300);
			client.text_input.focus();
		};

		client.hide = function()
		{
			client.console.slideUp(300);
		};

		client.toggle = function()
		{
			client.console.slideToggle(300);
			client.text_input.focus();
		};

		client.send_input = function()
		{
			var msg = client.text_input.val();
			if(msg.trim() ==='') return false;
			if (msg.charAt(0) === '/')
			{
				data =
					{
						'cmd': '',
						'data': ''
					};

				msg = msg.substr(1).split(' ');
				data.cmd = msg.shift();
				data.data = msg.join(' ');

				while (data.data.charAt(0) === ' ') data.data = data.data.substr(1);

				if ((data.data.charAt(0) === '[') || (data.data.charAt(0) === '{'))
				{
					try
					{
						eval('json_data='+data.data);
					}
					catch (e)
					{						
						json_data = data.data;
					}
					data.data = json_data;
				}

				client.send_cmd(data.cmd, data.data);
			}
			else
			{
				client.send_cmd('room_msg', msg);
			}

			client.text_input.val('');
			
		};

		client.text_input.keypress(function(e)
		{
			if (e.which === 13)
			{
				client.send_input()
			}
		});

		client.text_input_button.on('click', function()
		{
			client.send_input();
		});

		//==Hook body key press
		$('body').keydown(function(e)
		{
			switch (e.keyCode)
			{
				default:
					//alert(e.keyCode)
					break;
				case 192: // `
					client.toggle();
					return false;
					break;
			}
		});	

		if (client.config.mode === 3)
		{
			setTimeout(client.show, 200);
		}
		return client;
	};


	return {
		start:client_loader.init_client
	}
	
    

});