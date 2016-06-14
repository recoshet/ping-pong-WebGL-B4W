
"use strict"

// register the application module
b4w.register("ping_pong_game", function(exports, require) {

	var m_scs = require('scenes');
	var m_main = require('main');
	var m_trans = require('transform');
	var m_sfx = require('sfx');
	var m_ctl   = require("controls");

	var k_scale = 100;
	var visota_obj = 0.22;
	var delta_max = 0.002;
	var move_state = 0;

	var sound_udar1;
	var sound_udar2;
	var sound_udar3;
	var sound_udar0;

	exports.init = function(){
		sound_udar1 = m_scs.get_object_by_name('udar1');
		sound_udar2 = m_scs.get_object_by_name('udar2');
		sound_udar3 = m_scs.get_object_by_name('udar3');
		var sound_bg = m_scs.get_object_by_name('bg_sound');
		m_sfx.play(sound_bg);

		setup_movement();
	}

	function setup_movement() {
	    var key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_Z);
	    var key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_X);

	    var move_array = [key_up, key_down];

		var move_cb = function(obj, id, pulse) {
	        if (pulse == 1) {
	            switch (id) {
	            case "UP":
	                move_state = 1;
	                break;
	            case "DOWN":
	                move_state = -1;
	                break;
	            }
	        } else {
	            switch (id) {
	            case "UP":
	            case "DOWN":
	                move_state = 0;
	                break;
	            }
	        }
	    };

        m_ctl.create_sensor_manifold(null, "UP", m_ctl.CT_TRIGGER,
        	move_array, function(s) {return s[0]}, move_cb);
		m_ctl.create_sensor_manifold(null, "DOWN", m_ctl.CT_TRIGGER,
        	move_array, function(s) {return s[1]}, move_cb);
    }

	//Опишем наши игровые объекты + научим их передвигаться
	var Ball = function () {
		return {
			radius: 10,
			color: '#FFCC00',
			x: 0,
			y: 0,
			yspeed: 7,
			xspeed: 9,
			bounce: 1.1, //коофицент упругости - для ускорения шарика после отскока
			render: function () {
				//console.log({x:this.x, y:this.y});
				var x = this.x/k_scale;
				var y = this.y/k_scale;
				this.obj_b4w;
				m_trans.set_translation(this.obj_b4w, x,visota_obj,y)
			},
			//Передвижение шара всегда происходит с определенной скоростью
			//по этому мы не будем передавть x y для кастомного перемещения.
			move: function (delta) {
				this.x = this.x + (this.xspeed * delta*60);
				this.y = this.y + (this.yspeed * delta*60);

			}
		}
	};

	//Ракетка
	var Bracket = function () {
		return {
			w: 10,
			h: 100,
			x: 0,
			y: 0,
			speed: 20,
			color: '#CCFF00',
			render: function () {
				//console.log();
				//console.log({x:this.x, y:this.y});
				var x = this.x/k_scale;
				var y = this.y/k_scale;
				this.obj_b4w;
				m_trans.set_translation(this.obj_b4w, x,visota_obj,y)
			}
		}
	};

	//Собственно сам игрок с его свойствами
	var Player = function () {
		return {
			rate: 0
		};
	};

	//Теперь сама игра
	var Game = function () {
		//Сохраним ссылку на контекст
		//для дальнейшей передачи в ивенты
		var _this = this;

		//Параметры с которыми будет игра
		this.params = {
			width: 1500,
			height: 500,
			state: 'loading', //Состояние игры
			maxRate: 10 //до скольки будет идти матч.
		};


		//Подписываемся на события кнопок
		document.addEventListener('keydown', function (event) {
			_this.keyDownEvent.call(_this, event);
		});

		return this;
	};


	Game.prototype = {
		//Старт игры
		startGame: function () {
			var _this = this;

			//Инициализируем игровые объекты
			this.objects = {
				ball: new Ball(),
				player1: new Player(),
				player2: new Player(),
				bracket1: new Bracket(),
				bracket2: new Bracket()
			};

			//Присваиваем шару и ракеткам 3D объекты
			this.objects.ball.obj_b4w = m_scs.get_object_by_name('Sphere');
			this.objects.bracket1.obj_b4w = m_scs.get_object_by_name('bracket1');
			this.objects.bracket2.obj_b4w = m_scs.get_object_by_name('bracket2');

			//Меняем состояние
			this.params.state = 'game';
			this.params.lastGoalBracket = this.objects.bracket1;
			this.params.lastGoalPlayer = 'player1'

			//Расставляем стартовые позиции ракеток
			this.objects.bracket1.x = 50;
			this.objects.bracket1.y = this.params.height / 2 - this.objects.bracket1.h / 2;

			this.objects.bracket2.x = this.params.width - 50;
			this.objects.bracket2.y = this.params.height / 2 - this.objects.bracket1.h / 2;


			//Запускаем игровой цикл
			m_main.append_loop_cb(this.loop);
		},

		//Игровой цикл
		loop: function (time, delta) {
			var _this = game;

			var count_loop = 1;
			var new_delta = delta;

			if(delta > delta_max){
				var count_loop = Math.ceil(delta/delta_max);
				var new_delta = delta/count_loop;
			}

			for (var i = 1; i <= count_loop; i++) {
				//Логика игры
				game.logic();
				//Физика игры
				game.physic(new_delta);

				//AI
				game.ai();
				//Рендер игры
				game.render();

				//Управление
				game.movement();


			}

		},

		movement: function(){
			if(move_state == 1){
				game.objects.bracket1.y = game.objects.bracket1.y + game.objects.bracket1.speed/10;
			}
			else if(move_state == -1){
				game.objects.bracket1.y = game.objects.bracket1.y - game.objects.bracket1.speed/10;
			}
		},

		//Логика игры
		logic: function () {

			//Для краткости записи
			var ball = game.objects.ball;

			//Если сейчас идет игра
			if(this.params.state == 'game') {

				//И шарик оказался за первым игроком
				if (ball.x + ball.radius/2 < 0) {
					//Засчтитаем гол
					this.objects.player2.rate++;
					//Сменим состояние игры
					this.params.state = 'playerwait';
					//Сохарним информацию о забившем
					this.params.lastGoalBracket = this.objects.bracket2;
					this.params.lastGoalPlayer = 'player2';
				}

				//Шарик оказался за вторым игроком
				if (ball.x + ball.radius/2 > game.params.width) {
					//Засчтитаем гол
					this.objects.player1.rate++;
					//Сменим состояние игры
					this.params.state = 'playerwait';
					//Сохарним информацию о забившем
					this.params.lastGoalBracket = this.objects.bracket1;
					this.params.lastGoalPlayer = 'player1';
				}

				//Проверяем наличие победителя
				//Если кто-то из игроков набрал необходимое количество очков
				//Он выиграл
				if(this.objects.player1.rate === this.params.maxRate) {
					alert('1 игрок выиграл');
					location.reload();

					this.gameRestart();
				}

				if(this.objects.player2.rate === this.params.maxRate) {
					alert('2 игрок выиграл');

					location.reload();

					this.gameRestart();
				}
			}
		},

		//Физика игры
		physic: function (delta) {
			//Для краткости записи
			var ball = game.objects.ball,
			b1 = game.objects.bracket1,
			b2 = game.objects.bracket2;

			//Передвигаем шар
			game.objects.ball.move(delta);

			//Отскок слева
			if (ball.x + ball.radius/2 < 0) {
				game.objects.ball.xspeed = -game.objects.ball.xspeed;
			}
			//Отскок Справа
			if (ball.x + ball.radius/2 > game.params.width) {
				game.objects.ball.xspeed = -game.objects.ball.xspeed;
			}
			//Отскок от границ canvas по высоте
			if (ball.y + ball.radius/2 > game.params.height || ball.y + ball.radius/2 < 0) {
				game.objects.ball.yspeed = -game.objects.ball.yspeed;
				m_sfx.play(sound_udar2);
			}
			//Отскок шарика от 1 блока
			if(ball.x <= 60 && ball.y >= b1.y && ball.y <= b1.y+b1.h) {
				ball.xspeed = -ball.xspeed;
				//Ускоряем шарик
				ball.xspeed = ball.xspeed * ball.bounce;
				ball.yspeed = ball.yspeed * ball.bounce-0.1;

				m_sfx.play(sound_udar1);
			}
			//Отскок шарика от 2 блока
			if(ball.x >= this.params.width-50 && ball.y >= b2.y && ball.y <= b2.y+b2.h) {
				ball.xspeed = -ball.xspeed;
				//Ускоряем шарик
				ball.xspeed = ball.xspeed * ball.bounce;
				ball.yspeed = ball.yspeed * ball.bounce-0.1;

				m_sfx.play(sound_udar3);
			}

			//В состоянии ожидания пуска шарика от ракетки игрока, выставляем шарик рядом с ракеткой забившего игрока.
			if(this.params.state === 'playerwait') {
				ball.xspeed = 0;
				ball.yspeed = 0;
				if(this.params.lastGoalPlayer === 'player1') {
					ball.x = this.params.lastGoalBracket.x + this.params.lastGoalBracket.w + ball.radius + 1;
					ball.y = this.params.lastGoalBracket.y + this.params.lastGoalBracket.h/2;
				}
				if(this.params.lastGoalPlayer === 'player2') {
					ball.x = this.params.lastGoalBracket.x - ball.radius - 1;
					ball.y = this.params.lastGoalBracket.y + this.params.lastGoalBracket.h/2;
				}
			}

			//Не позволяем вылезать блокам за canvas и возврщаем их на место
			if(b1.y <= 0) b1.y = 1;
			if(b2.y <= 0) b2.y = 1;
			if(b1.y+b1.h >= this.params.height) b1.y = this.params.height-b1.h;
			if(b2.y+b2.h >= this.params.height) b2.y = this.params.height-b2.h;
		},

		//Искусственный интелект соперник
		ai: function(){
			if(game.params.state == 'game' && game.objects.ball.xspeed > 0){
				if(game.objects.bracket2.y < game.objects.ball.y-50){
					game.objects.bracket2.y += 0.8;
				}
				else{
					game.objects.bracket2.y -= 0.8;
				}
			}
		},

		//Рендер игры
		render: function () {
			
			//Рендерим шарик
			game.objects.ball.render();
			game.objects.bracket1.render();
			game.objects.bracket2.render();
			//game.renderRate(game.ctx);
		},

		//Показываем счет игры
		renderRate: function (ctx) {
			var rateText = game.objects.player1.rate + ' : ' + game.objects.player2.rate;
			ctx.fillStyle = '#000000';
			ctx.font = "20px Arial";
			ctx.fillText(rateText,game.params.width/2,50);
		},

		//Инициализация игровых событий
		keyDownEvent: function (event) {
			var kCode = event.keyCode;
			//1-вверх
			if(kCode === 49) {
				game.objects.bracket1.y = game.objects.bracket1.y + game.objects.bracket1.speed;
			}
			//2-вниз
			if(kCode === 50) {
				game.objects.bracket1.y = game.objects.bracket1.y - game.objects.bracket1.speed;
			}
			//9-вверх
			if(kCode === 57) {
				game.objects.bracket2.y = game.objects.bracket2.y + game.objects.bracket2.speed;
			}
			//0-вниз
			if(kCode === 48) {
				game.objects.bracket2.y = game.objects.bracket2.y - game.objects.bracket2.speed;
			}
			//E - рестарт шарика
			if(kCode === 69) {
				this.restartBall();
			}
			//R - рестарт игры
			if(kCode === 82) {
				this.restartGame();
			}
			//Пробел - пуск шарика
			if(kCode === 32 && game.params.state === 'playerwait') {
				this.kickBall();
			}
		},

		//Пуск шарика после гола
		kickBall: function () {
			this.objects.ball.xspeed = 7;
			this.objects.ball.yspeed = 5;
			this.params.state = 'game';
		},
		//Стоп игра
		stopGame: function () {
			//Обновляем состояние
			this.params.state = 'stop';
			//Останавливаем цикл
			cancelAnimationFrame(this.requestLoop);

			//Убираем слушателей событий
			document.removeEventListener('keydown', this.keyDownEvent);

			//Чистим игровые объекты
			delete(this.objects);
		},

		pauseGame: function () {
			this.state = 'pause';
		},

		//Рестарт шарика
		restartBall: function () {
			this.objects.ball.x = game.params.width/2;
			this.objects.ball.y = game.params.height/2;
			this.objects.ball.xspeed = 3;
			this.objects.ball.yspeed = 3;
		},

		//Рестарт игры
		restartGame: function () {
			this.stopGame();
			this.startGame();
		}
	};

	var game = new Game;
	exports.game = game;

});