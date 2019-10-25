define(function(require) {
    var io = require('socket.io');
    var $ = require('jquery');

	var client_loader =
		{
			'mode': 2//0 - silent,1 - console mode,2 - UI mode (hidden),3 Ui mode (opend)
		};

	client_loader.init_client = function()
	{
		var client =
			{
				socket: io('195.201.88.91:3000'),
				console: $('#client_console'),
				text_input: $('#client_command'),
				text_input_button: $('#client_command_send'),
				output_div: document.getElementById('client_output')
			};

		//==Add client functions
		//===>Soket  functions
		client.send_cmd = function(cmd, data)
		{
			client.socket.emit('client.cmd', {cmd: cmd, data: data});
		};
		
		/* //== Room functions 
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
			client.socket.on('room.my_id', function(data)
			{
				client.log(data);
			});			
		//== END room functions */
		client.socket.on('msg', function(data)
		{
			msg = '<span style="color:#2c487e;">[' + data.nick + '] </span>' + data.msg;
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
			client.log('[connected][' + window.location.href + ']  [id][' + client.socket.id + ']', 0);
			client.send_cmd('auth', {user: 'test', pass: 'test'});
		});

		client.socket.on('disconnect', function(data)
		{
			client.log('[disconnected][' + window.location.href + ']', 0);
		});

		//===>DOM  functions
		client.log = function(txt, color)
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
						json_data = JSON.parse(data.data);
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
				client.send_cmd('msg', msg);
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