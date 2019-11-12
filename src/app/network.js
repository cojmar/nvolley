define(function(require) {
    var io = require('socket.io');
    var $ = require('jquery');
    var config = require('json!./config.json').network;
    var server = config.servers[config.server];
    //console.log(config);
	var client_loader =
		{
			'mode': config.mode//0 - silent,1 - console mode,2 - UI mode (hidden),3 Ui mode (opend)
		};

	client_loader.init_client = function()
	{
		var client =
			{
				socket: io(server),
				console: $('#client_console'),
				text_input: $('#client_command'),
				text_input_button: $('#client_command_send'),
				output_div: document.getElementById('client_output')
			};

		//==Add client functions
		//===>Soket  functions
		client.send_cmd = function(cmd, data)
		{
			client.socket.send({cmd: cmd, data: data});
		};
        
        
        //== Room functions 
            client.socket.on('host.set_room_data', function(data)
			{
                client.send_cmd('set_room_data', data.data);
				if (config.debug) client.log(data);
            });		
        if (config.debug){
			client.socket.on('room.data', function(data)
			{
				client.log(data);
			});		
			
			client.socket.on('room.user_data', function(data)
			{
				client.log(data);
			});

			client.socket.on('room.user_join', function(data)
			{
				client.log(data);
			});				
			
			client.socket.on('room.user_leave', function(data)
			{
				client.log(data);
			});
			client.socket.on('room.user_reconnect', function(data)
			{
				client.log(data);
			});				
			
			client.socket.on('room.user_disconnect', function(data)
			{
				client.log(data);
			});
			client.socket.on('room.my_id', function(data)
			{
				client.log(data);
            });		           
            client.socket.on('room.info', function(data)
			{
				client.log(data);
            });		
            
        //== END room functions */
        }
        client.socket.on('server.help', function(data)
		{		
            var msg="";	
            for (var n in data){
                msg +="<a class='do_cmd' style='cursor:pointer;color:#df0000;'>/"+data[n]+" </a> "
            }
            client.log(msg);
            $('.do_cmd').on('click',function(){
                client.text_input.val($(this).html());
                client.text_input.focus();

            });
		});
		client.socket.on('room.msg', function(data)
		{
			msg = '<span style="color:#2c487e;">[' + data.user + '] </span>' + data.msg;
			client.log(msg);
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
			client.log('[connected][' + server + ']  [id][' + client.socket.id + ']', 0);		
		});

		client.socket.on('disconnect', function(data)
		{
			client.log('[disconnected][' + server + ']', 0);
		});

		//===>DOM  functions
		client.log = function(txt, color=0)
		{
			if (!client.output_div)
			{
				if (client_loader.mode === 1)
				{
					console.log(txt);
				}

				return false;
			}

			var colors =
				[
					'#395fa4',
					'#d6d6d6',
					'#df0000'
				];

			color = (typeof colors[color] !== 'undefined') ? 'style="color:' + colors[color] + '"' : '';			
			if (typeof txt === 'object')
			{
				txt = '<br><xmp>' + JSON.stringify(txt, null, 2) + '</xmp>';
			}

			var d = new Date();

			var time_stamp =
				[
					'<span style="color:#2c487e;">[',
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
			client.console.show();
			client.text_input.focus();
		};

		client.hide = function()
		{
			client.console.hide();
		};

		client.toggle = function()
		{
			client.console.toggle();
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

		if (client_loader.mode === 3)
		{
			setTimeout(client.show, 200);
		}
		return client;
	};

	client_loader.load_ui = function(call_back)
	{		
        var network_ui = require('text!assets/network_ui.html');
        $('body').append(network_ui);	
        return 	client_loader.init_client();
	};


    if (client_loader.mode >= 2)
    {
        return client_loader.load_ui();
    }
    else
    {        
        return client_loader.init_client();			
    }

});