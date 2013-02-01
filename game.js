// The game itself
var game = (function(){
    // -----------------------------
    // ---  closure scoped vars  ---
    // -----------------------------
    var domCanvas;
    var domContext;
    var canvas;
    var context;
    var keys = [];
    var startTime;          // time the current race as started
	var stateTimestamp;     // time the current state has been set
	var previousTimestamp;  // time of the previous animation frame
	var checkpointTime;     // time available to cross the section to next checkpoint
	var lastCheckpointTime; // time the last checkpoint was crossed 
    var lastDelta = 0;
    var currentTimeString = "";
    var audioContext = false;
    var introMusic;
    var raceMusic;
    
    var menuBreadcrumb = [];
    var menuScreen = "main";
    var selectedButton = 0;
    
    var player;
    
    var gameState;
    var gameMode;
    var soundReady = false;
    var raceStarted = false;
    var seed = tools.parseHash();
    var road = [];
    var opponents = [];
	var raceWon = false;
	var raceLost = false;
	var finishedTime;
	var level;
	var currentLevel = 0;
	
	// touch vars
	var UP = {
		on: false,
		id: 0
	};
	var LEFT = {
		on: false,
		id: 0
	};
	var RIGHT ={
		on: false,
		id: 0
	};
	
	
    // -----------------------------
    // -- Closure Scoped Function --
    // -----------------------------
	var changeState = function(newState){
		gameState      = newState;
		stateTimestamp = requestAnimationFrame.now();
	};
	
	var prepareRace = function(gameMode){
		if(gameMode === "random"){
			seed  = tools.generateSeed({random: true});
			level = tools.parseSeed(seed);
		} else if (gameMode === "randomRestart"){
			level = tools.parseSeed(seed);
		} else if (gameMode === "championship") {
			seed = data.championship[currentLevel++]
			level = tools.parseSeed(seed);
		} else if (gameMode === "championshipRestart") {
			level = tools.parseSeed(seed);
		}
		var generated      = tools.generateRoad(level);	    
        road               = generated.road;
        opponents          = generated.opponents;

        raceWon = false;
        raceLost = false;
        raceStarted = false;
        player = {
	        position: 10,
	        speed: 0,
	        acceleration: 0.05,
	        deceleration: 0.1,
	        breaking: 0.6,
	        turning: 5.0,
	        posx: 0,
	        maxSpeed: 15,
	        steering: 0,
	        immunity: 0
	    };
	}
	
	var startRace = function(){
		// road generation
		startTime          = requestAnimationFrame.now() - stateTimestamp;
        checkpointTime     = tools.generateNextCheckpointTime(level, 0);
		lastCheckpointTime = startTime;
		raceStarted = true;
	};
	
	var render = function(timestamp){
		// var now = requestAnimationFrame.now();
		window.requestAnimationFrame(render);
		
	    // scalling
        domContext.drawImage(canvas, 0, 0, domCanvas.width, domCanvas.height);
        
        // call the correct renderer:
        renderer[gameState](timestamp - stateTimestamp, timestamp - previousTimestamp);
        control[gameState](timestamp - stateTimestamp, timestamp - previousTimestamp);
        
        previousTimestamp = timestamp;
	}
	
	
	// this is the list of renderer indexed by the game state they work for
	var renderer = {
		intro : function (timestamp, delta){
		    
		    // find current screen
            var olderScreen = 0;
            var rendered = false;
            var i = 0;
            var screen = tools.introScreens[0];
            var time = timestamp - olderScreen;
            while (time >= screen.duration) {
                olderScreen += screen.duration;
                if(++i >= tools.introScreens.length){
                    i = 0;
                }
                screen = tools.introScreens[i];
                time = timestamp - olderScreen;
            }
            
            //render current screen
            context.globalAlpha = 1.0;
            screen.clean(context);
            
            if(time < screen.fadein){
                context.globalAlpha = time / screen.fadein;
            } else if (time > screen.duration - screen.fadeout){
                context.globalAlpha = 1 - (time - screen.duration + screen.fadeout) / screen.fadeout;
            } else {
                context.globalAlpha = 1.0;
            }
            screen.render(context, time / screen.duration * 100.0);
		    context.globalAlpha = 1.0;
		}, 
		menu : function (timestamp, delat){
			var screen = data.menus[menuScreen];
			var selected;
			if(screen.buttons){
				selected = screen.buttons[selectedButton];
			}
			
			// background
	        tools.draw.image(context, data.sprites.menuBackground, 0, 0, 1);
	        tools.draw.string(context, spritesheet, 1, screen.name,{x: data.render.width / 2, y: 0}, true);
	        if(data.menus[selected] && data.menus[selected].description){
		        tools.draw.string(context, spritesheet, 1, data.menus[selected].description, {x: data.render.width / 2, y: 200}, true);
	        }
	        
	        //buttons
	        var buttonPos = 40;
	        for (var i = 0; i < screen.buttons.length; i++){
	        	var button = screen.buttons[i];
	        	var buttonScreen = data.menus[button];
	        	var buttonState = (selectedButton === i)? 1 : 0;
	        	
	        	switch (buttonScreen.type){
	        		case "standard":
	        		case "final":
	        			tools.draw.button(context, buttonState, {x: 60, y: buttonPos},200);
	        			tools.draw.string(context, spritesheet, 1, data.menus[button].name,{x: data.render.width / 2, y: buttonPos + 6}, true);
	        			buttonPos += 40;
	        			break;
	        		case "multipleChoice":
	        			for (var j = 0; j < buttonScreen.choices.length; j++){
	        				var choiceState = 0;
	        				if(buttonState === 1 && j == buttonScreen.selected){
	        					choiceState = 1;
	        				} else if (j === buttonScreen.active) {
	        					choiceState = 2;
	        				}
		        			tools.draw.button(context, choiceState, {x: 50 + 75*j, y: buttonPos},70);
		        			tools.draw.string(context, spritesheet, 1, buttonScreen.choices[j],{x: 55 + 75*j, y: buttonPos + 6});
	        			}
	        			
	        			buttonPos += 40;
	        			break;
	        		
	        	}
	        }
	        if(menuBreadcrumb.length !== 0){
	        	var buttonState = (selectedButton === i)? 1 : 0;
		        tools.draw.button(context, buttonState, {x: 5, y: 205}, 45);
				tools.draw.string(context, spritesheet, 1, "Back", {x: 10, y: 210});
	        }
		},
		splash: function (timestamp, delta) {
		    tools.draw.image(context, data.levels[level.type].splash, 102, 62, 1);
		    tools.draw.image(context, data.sprites.levelIntroBackground, 0, 0, 1);
		    if (gameMode === "championship"){
			    tools.draw.string(context, spritesheet, 1, "Championship", {x: data.render.width / 2, y: 20}, true);
			    tools.draw.string(context, spritesheet, 1, "Stage "+currentLevel+"/"+data.championship.length, {x: data.render.width / 2, y: 40}, true);
		    } else {
		    	tools.draw.string(context, spritesheet, 1, "Random", {x: data.render.width / 2, y: 20}, true);
		    }
		    tools.draw.string(context, spritesheet, 1, "Race: " + seed, {x: data.render.width / 2, y: 160}, true);
		    tools.draw.string(context, spritesheet, 1, "Get Ready!", {x: data.render.width / 2, y: 180}, true);
		},
		race : function(timestamp, delta){
		    // find the correct car sprite
	        var carSprite = {
                a: data.sprites.car,
                x: 125,
                y: 190
            };
			if(player.steering < 0){
				var index = Math.floor(-player.steering / 10)
				carSprite = {
	                a: data.sprites.carL[index],
	                x: 125 + data.sprites.car.w - data.sprites.carL[index].w,
	                y: 190
            	}
			} else if(player.steering > 0){
				var index = Math.floor(player.steering / 10)
				carSprite = {
	                a: data.sprites.carR[index],
	                x: 125,
	                y: 190
            	}
			}
	        var spriteBuffer = [];
	        var doorBuffer = [];
	        
	        // --------------------------
	        // --   Render the road    --
	        // --------------------------
	        var absoluteIndex, currentSegmentIndex, currentSegmentPosition, playerPosRelative;
	        if (raceWon !== false){
		        absoluteIndex = Math.floor(raceWon / data.road.segmentSize);
		        currentSegmentIndex        = (absoluteIndex - 2) % road.length;
		        currentSegmentPosition     = (absoluteIndex - 2) * data.road.segmentSize - raceWon;
		        playerPosRelative          = (raceWon % data.road.segmentSize) / data.road.segmentSize;
	        } else {
	        	absoluteIndex = Math.floor(player.position / data.road.segmentSize);
		        currentSegmentIndex        = (absoluteIndex - 2) % road.length;
		        currentSegmentPosition     = (absoluteIndex - 2) * data.road.segmentSize - player.position;
		        playerPosRelative          = (player.position % data.road.segmentSize) / data.road.segmentSize;
	        }
	        var currentSegment             = road[currentSegmentIndex];
	        
	        var lastProjectedHeight        = Number.POSITIVE_INFINITY;
	        var probedDepth                = 0;
	        var counter                    = absoluteIndex % (2 * data.road.segmentPerColor); // for alternating color band
	        
	        var playerPosSegmentHeight     = road[absoluteIndex % road.length].height;
	        var playerPosNextSegmentHeight = road[(absoluteIndex + 1) % road.length].height;
	       
	        var playerHeight               = data.render.camera_height + playerPosSegmentHeight + (playerPosNextSegmentHeight - playerPosSegmentHeight) * playerPosRelative;
	        
	        var baseOffset                 =  currentSegment.curve + (road[(currentSegmentIndex + 1) % road.length].curve - currentSegment.curve) * playerPosRelative;
	        
	        tools.draw.background(context, data.levels[level.type], -baseOffset, 10*(playerPosNextSegmentHeight - playerPosSegmentHeight));
	        
	        lastDelta = player.posx - baseOffset*2;
	        
	        
	        // Opponent rendering variables 
	        var opponentBuffer = [];
	        var firstCarIndex = 0;
	        var opponentSpeed = ((timestamp - startTime < 10000)? (timestamp - startTime) / 10000 * 7 : 7.0);
	        var distanceDriven = 0;
	        if(raceStarted) {
	        	distanceDriven = opponentSpeed * (timestamp - startTime)/30.0; // speed * time 
	        }
	        
	        var checked = 0;
	        var i = 0;
	        if(player.immunity > 0){
	        	player.immunity--;
	        }
	        
	        var iter = data.render.depthOfField;
	        
	        var checkpointCrossed = false;
	        
	        while (iter--) {
	            // Next Segment:
	            var nextSegmentIndex       = (currentSegmentIndex + 1) % road.length;
	            var nextSegment            = road[nextSegmentIndex];
	            
	            var startProjectedHeight = Math.floor((playerHeight - currentSegment.height) * data.render.camera_distance / (data.render.camera_distance + currentSegmentPosition));
	            var startScaling         = 30 / (data.render.camera_distance + currentSegmentPosition);
	        
	            var endProjectedHeight   = Math.floor((playerHeight - nextSegment.height) * data.render.camera_distance / (data.render.camera_distance + currentSegmentPosition + data.road.segmentSize));
	            var endScaling           = 30 / (data.render.camera_distance + currentSegmentPosition + data.road.segmentSize);
	
	            var currentHeight        = Math.min(lastProjectedHeight, startProjectedHeight);
	            var currentScaling       = startScaling;
	            
	            // --------------------------
                // --   DRAW THE SEGMENT   --
                // --------------------------
                var door = currentSegmentIndex == 2 || currentSegmentIndex == (road.length-data.render.depthOfField) || currentSegment.checkpoint;
	            if(currentHeight > endProjectedHeight){
	               tools.draw.segment(
	               		context,
	               		data.levels[level.type],
	                    data.render.height / 2 + currentHeight, 
	                    currentScaling, currentSegment.curve - baseOffset - lastDelta * currentScaling, 
	                    data.render.height / 2 + endProjectedHeight, 
	                    endScaling, 
	                    nextSegment.curve - baseOffset - lastDelta * endScaling, 
	                    counter < data.road.segmentPerColor, 
	                    door);
	            }
	            if(door){
	            	spriteBuffer.push({
	            		door:     true,
	            		position: data.render.height / 2 + currentHeight,
	            		scale:    currentScaling,
	            		offset:   currentSegment.curve - baseOffset - lastDelta * currentScaling
	            	});
	            }
	            
	            // --------------------------
                // --     DRAW THE CAR     --
                // --------------------------
                if(raceWon){
                    if(player.position > currentSegmentIndex * data.road.segmentSize && player.position < (currentSegmentIndex + 1) * data.road.segmentSize){
                        var ratioPos = (player.position - currentSegmentIndex * data.road.segmentSize) / data.road.segmentSize;
                        var height   = startProjectedHeight + ratioPos * (endProjectedHeight-startProjectedHeight);
                        var scaling  = startScaling + ratioPos * (endScaling - startScaling);
                        
                        spriteBuffer.push({
                            y: data.render.height / 2 + height,
                            x: data.render.width / 2 + (player.posx - baseOffset*2-carSprite.a.w / 2) * scaling + currentSegment.curve - baseOffset - (player.posx - baseOffset*2) * scaling,
                            ymax: data.render.height / 2 + lastProjectedHeight, 
                            s: 0.9 * scaling,
                            i: carSprite.a});
                    }
                } else {
                    if (iter >= data.render.depthOfField - 3){
                    	if(currentSegment.checkpoint &&  timestamp - lastCheckpointTime > 2000){
                    		checkpointCrossed = true;
                    	}
                    	
                        spriteBuffer.push({
                            x: carSprite.x,
                            y: carSprite.y + carSprite.a.h, 
                            ymax: data.render.height, 
                            s: 1, 
                            i: carSprite.a});
                    }
                    tools.draw.image(context, carSprite.a, carSprite.x, carSprite.y, 1);
                }
	            
	            // --------------------------
	            // -- STORE THE OPPONENTS  --
	            // --------------------------
	            while( i < opponents.length && opponents[i].start + checked + distanceDriven < currentSegmentIndex * data.road.segmentSize){
		        	checked += opponents[i].start;
		        	i++;
		        }
	            while(i < opponents.length && opponents[i].start + checked + distanceDriven < (currentSegmentIndex + 1) * data.road.segmentSize){
	            	var x = Math.cos(opponents[i].phase * Math.PI / 2) * 113;;
	            	if(raceStarted){
	            		x = Math.cos(((timestamp - startTime)/2000 + opponents[i].phase) * Math.PI / 2) * 113;
	            	}
	            	
	            	if (player.immunity === 0 && iter < data.render.depthOfField - 3 && iter > data.render.depthOfField - 5){
	            		if (Math.abs(x - lastDelta) < data.sprites.car.w - 5){
	            			player.speed *= 0.5;
	            			player.immunity = 10;
	            		}
	            	}
			        var opponentPosition = opponents[i].start + checked + distanceDriven;
			        var ratioPos = (opponentPosition - currentSegmentIndex * data.road.segmentSize) / data.road.segmentSize
	            	var height   = startProjectedHeight + ratioPos * (endProjectedHeight-startProjectedHeight);
	            	var scaling  = startScaling + ratioPos * (endScaling - startScaling);
	            	
		        	spriteBuffer.push({
	                    y: data.render.height / 2 + height, 
	                    x: data.render.width / 2 + (x - data.sprites.opponent.w / 2) * scaling + currentSegment.curve - baseOffset - (player.posx - baseOffset*2) * scaling,
	                    ymax: data.render.height / 2 + lastProjectedHeight, 
	                    s: 0.9 * scaling, 
	                    i: data.sprites.opponent});
		            
		        	checked += opponents[i].start;
		        	i++;
		        }
	            
	            // --------------------------
                // --    STORE THE SPRITE   --
                // --------------------------
	            if(currentSegment.sprite){
	                spriteBuffer.push({
	                    y: data.render.height / 2 + startProjectedHeight, 
	                    x: data.render.width / 2 - currentSegment.sprite.pos * data.render.width * currentScaling + currentSegment.curve - baseOffset - (player.posx - baseOffset*2) * currentScaling,
	                    ymax: data.render.height / 2 + lastProjectedHeight, 
	                    s: 2.5*currentScaling, 
	                    i: currentSegment.sprite.type});
	            }
	            
	            
	            lastProjectedHeight    = currentHeight;
	            probedDepth            = currentSegmentPosition;
	            currentSegmentIndex    = nextSegmentIndex;
	            currentSegment         = nextSegment;
	            currentSegmentPosition += data.road.segmentSize;
	            counter = (counter + 1) % (2 * data.road.segmentPerColor);
	        }
	        
	        // --------------------------
            // --     DRAW THE SPRITES --
            // --------------------------
	        while(sprite = spriteBuffer.pop()) {
	        	if (sprite.door){
	        		tools.draw.door(context, sprite.position, sprite.scale, sprite.offset);
	        	} else {
		            tools.draw.sprite(context, sprite);
	        	}
	        }
	
	        // --------------------------
	        // --     Draw the hud     --
	        // --------------------------
            var timePassed = timestamp - lastCheckpointTime;
            var remainingTime = checkpointTime - Math.floor(timePassed /1000);
            if(checkpointCrossed !== false){
            	checkpointTime += remainingTime;
            	lastCheckpointTime = requestAnimationFrame.now() - startTime;
            } else {
            	if (!raceLost && remainingTime < 0){
            	    raceLost = true;
            	    finishedTime = timestamp;
            	}
            }
            
	        if(absoluteIndex >= road.length-data.render.depthOfField-1 && raceWon === false){
	        	finishedTime = timestamp;
                raceWon = player.position;
            }
            
            var speed = Math.round(player.speed / player.maxSpeed * 420);
	        tools.draw.string(context, spritesheet, 1, ""+speed+"kph", {x: 1, y: 1});
	        
	        if(timestamp < 4000){
				// countdown phase
				if (timestamp < 1000){
					tools.draw.string(context, spritesheet, 1, "4", {x: data.render.width / 2, y: 1});
				} else if (timestamp < 2000){
					tools.draw.string(context, spritesheet, 1, "3", {x: data.render.width / 2, y: 1});
				} else if (timestamp < 3000){
					tools.draw.string(context, spritesheet, 1, "2", {x: data.render.width / 2, y: 1});
				} else {
					tools.draw.string(context, spritesheet, 1, "1", {x: data.render.width / 2, y: 1});
				}
			} else {
				if(!raceStarted){
					// start racing phase
					startRace();
				}
				if(raceLost !== false){
            	tools.draw.string(context, spritesheet, 1, "Game Over!", {x: data.render.width / 2, y: 20}, true);
	            } else if (raceWon !== false){
	                tools.draw.string(context, spritesheet, 1, "Finished!", {x: data.render.width / 2, y: 20}, true);
	            } else if (timestamp < 5000){
	            	tools.draw.string(context, spritesheet, 1, "GO!", {x: data.render.width / 2, y: 1});
	            } else {
	              	tools.draw.string(context, spritesheet, 1, ""+remainingTime, {x: data.render.width / 2, y: 1});
	            }
			}
	        
	        /*tools.draw.string(context, spritesheet, ""+Math.round(absoluteIndex/(road.length-data.render.depthOfField)*100)+"%",{x: 287, y: 1});
	        var diff = timestamp - startTime;
	        
	        var min = Math.floor(diff / 60000);
	        
	        var sec = Math.floor((diff - min * 60000) / 1000); 
	        if(sec < 10) sec = "0" + sec;
	        
	        var mili = Math.floor(diff - min * 60000 - sec * 1000);
	        if(mili < 100) mili = "0" + mili;
	        if(mili < 10) mili = "0" + mili;
	        
	        currentTimeString = ""+min+":"+sec+":"+mili;
	        
	        tools.draw.string(context, spritesheet, currentTimeString, {x: 1, y: 1});
	        var speed = Math.round(player.speed / player.maxSpeed * 420);
	        tools.draw.string(context, spritesheet, ""+speed+"kph", {x: 1, y: 10});*/
	    }
	}
	
	var control = {
		intro:  function(timestamp, delta){
			if(keys[32] || UP.on){
				changeState("menu");
	        	context.globalAlpha = 1.0;
	        	if(introMusic){
	        	    introMusic.noteOff(0);
	        	}
	        }
		},
		menu:  function(timestamp, delta){
			/*if(keys[13] || UP.on){
				changeState("race");
	            startRace();
	            context.globalAlpha = 1.0;
	            
	            if(audioContext){
                    tools.loadSound(audioContext, data.sounds.musics.race, function(sound){
                        raceMusic = sound;
                        tools.playSound(audioContext, raceMusic);
                    })
                }
	        }*/
		},
		splash: function(timestamp, delta){
		    if (timestamp > 2000 && soundReady){
		       changeState("race");
		       if(audioContext){
                    tools.playSound(audioContext, raceMusic);
               }
		    }
		},
		race:  function(timestamp, delta){
			if(raceStarted){
				// countdown phase over
				var deltaT = delta / 30.0;
		        if(raceLost){
		            // nothing ?
		            if (timestamp - finishedTime > 2000){
		            	menuScreen = "lost"+gameMode;
		            	menuBreadcrumb = [];
		            	changeState("menu");
		            	raceMusic.noteOff(0);
		            	selectedButton = 0;
		            }
		        } else if(raceWon){
		            player.position += player.speed * deltaT;
		            if (timestamp - finishedTime > 2000){
		            	if(gameMode === "championship" && currentLevel === data.championship.length){
		            		menuScreen = "finishedChampionship";
		            	} else {
		            		menuScreen = "won"+gameMode;
		            	}
		            	menuBreadcrumb = [];
		            	changeState("menu");
		            	raceMusic.noteOff(0);
		            	selectedButton = 0;
		            }
		        } else {
			        // --------------------------
			        // -- Update the car state --
			        // --------------------------
			        var acceleration = -player.deceleration;
			        if (keys[40]) {
			        	acceleration = -player.breaking;
			        } else if (keys[38] || UP.on){
			        	if (Math.abs(lastDelta) > 130 && player.speed > 5){
			        		acceleration = -player.deceleration * 2;
		        		} else {	        			
			        		acceleration = player.acceleration;
		        		} 
			        }
			        
			        // car turning
			        if (keys[37] || LEFT.on) {
			            // 37 left
			            player.steering -= 5;
			            if(player.steering < -29){
			            	player.steering = -29
			            }
			        } else if (keys[39] || RIGHT.on) {
			            player.steering += 5;
			        	if (player.steering > 29){
			            	player.steering = 29
			            }
			        } else {
			        	if(player.steering !== 0){
			        		if(Math.abs(player.steering) < 8){
			        			player.steering = 0;
			        		} else {
				        		player.steering -= 8 * player.steering / Math.abs(player.steering);
			        		}
			        	}
			        }
			        
			        // "Phyisc simulation"
			        player.speed    += acceleration * deltaT;
			        
			        player.speed = Math.max(player.speed, 0); //cannot go in reverse
			        player.speed = Math.min(player.speed, player.maxSpeed); //maximum speed
					
					var steeringBonus = 1.0;		        
			        if(player.speed < 3){
			        	steeringBonus = 9 - 3 * player.speed;
			        }
			        
			        player.position += player.speed * deltaT //* Math.cos(Math.PI / 180 * player.steering);
			        player.posx     += player.speed * deltaT * Math.sin(Math.PI / 180 * player.steering) * steeringBonus;
		        }
		    }
		}
	};
    
    //initialize the game
    var init = function(){
        // configure canvas
        domCanvas = $("#c")[0];
        domContext = domCanvas.getContext('2d');
        
        canvas = document.createElement("canvas");
        context = canvas.getContext('2d');
        
        canvas.height = data.render.height;
        canvas.width = data.render.width;
        
        // nearest neighbor interpollation
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        
        domContext.imageSmoothingEnabled = false;
        domContext.webkitImageSmoothingEnabled = false;
        domContext.mozImageSmoothingEnabled = false;
        
        
        // pseudo full screen mode
        tools.canvasResize();
        $(window).resize(tools.canvasResize);    
        
        //register key handeling:
        $(document).keydown(function(e){
            keys[e.keyCode] = true;
        });
        $(document).keyup(function(e){
            keys[e.keyCode] = false;
        });
        
        // retrieve the audio context
        try {
            audioContext = new webkitAudioContext();
        } catch(e) {
            // fail silenty
        }
        previousTimestamp = requestAnimationFrame.now();
    };
        
    // -------------------------------------
    // ---      Async touch control      ---
    // -------------------------------------
    $(document).keydown(function(event){
    	if(gameState === "menu"){
			var screen = data.menus[menuScreen];
			if (event.keyCode === 40) { // down
	        	selectedButton += 1
	        	if(menuBreadcrumb.length !== 0){
	        		// if a back button exist
	        		if (selectedButton > screen.buttons.length){
		        		selectedButton = 0;
		        	}
	        	} else {
	        		if (selectedButton >= screen.buttons.length){
		        		selectedButton = 0;
		        	}
	        	}
	        	
		   } else if (event.keyCode === 38) { // up
		    	selectedButton -= 1
		    	if (selectedButton < 0){
		    		selectedButton = screen.buttons.length - 1;
		    	}
		    	
		   } else if (event.keyCode === 37) { // left
		   		var buttonScreen = data.menus[screen.buttons[selectedButton]];
		   		buttonScreen.selected -= 1;
		   		if(buttonScreen.selected < 0){
		   			buttonScreen.selected = buttonScreen.choices.length - 1;
		   		}
		   		
		   } else if (event.keyCode === 39) { // right
		   		var buttonScreen = data.menus[screen.buttons[selectedButton]];
		   		buttonScreen.selected += 1;
		   		if(buttonScreen.selected >= buttonScreen.choices.length){
		   			buttonScreen.selected = buttonScreen.choices.length - 1;
		   		}
		   		
		   } else if (event.keyCode === 13){ // enter
		   		if(selectedButton === screen.buttons.length){
		   			// back
		   			menuScreen = menuBreadcrumb.pop();
		   			selectedButton = 0;
		   		} else {
		   			var buttonScreen = data.menus[screen.buttons[selectedButton]];
			   		switch (buttonScreen.type){
		        		case "standard":
		        			menuBreadcrumb.push(menuScreen);
							menuScreen = screen.buttons[selectedButton];
							selectedButton = 0;
		        			break;
		        		case "multipleChoice":
		        			buttonScreen.active = buttonScreen.selected;
		        			break;
		        		case "final":
		        			if (screen.buttons[selectedButton] === "quit") {
		        				menuScreen = "main";
		        				selectedButton = 0;
		        				
		        			} else {
	 		        		    gameMode =  data.menus[screen.buttons[selectedButton]].gameMode;
	                            prepareRace(gameMode);
			        		    changeState("splash");
	                            
	                            if(audioContext){
	                                tools.loadSound(audioContext, data.sounds.musics.race, function(sound){
	                                    raceMusic = sound;
	                                    soundReady = true;
	                                });
	                            }
		        			}
		        		    break;
		        	}
		   		}
		   		
		   }
    	}
    })
        
    // -------------------------------------
    // ---         Touch control         ---
    // -------------------------------------
    document.addEventListener('touchstart', function(e) {
    	e.preventDefault();
    	for (var i = 0; i < e.touches.length; i++){
		    var touch = e.touches[i]
		    if (touch.pageX < $(window).width()/3){
		    	UP.on = true;
		    	UP.id = touch.identifier;
		    } else if (touch.pageX > $(window).width()/3 * 2){
		    	if(touch.pageX < $(window).width()/6 * 5){
		    		LEFT.on = true;
	    			LEFT.id = touch.identifier;
		    	} else {
		    		RIGHT.on = true;
		    		RIGHT.id = touch.identifier;
		    	}
		    }
		    
    	}
	}, false);
	document.addEventListener('touchend', function(e) {
		e.preventDefault();
		
		for (var i = 0; i < e.changedTouches.length; i++){
		    var touch = e.changedTouches[i]
		    if (touch.identifier === UP.id){
		    	UP.on = false;
		    } 
		    if (touch.identifier === LEFT.id){
		    	LEFT.on = false;
		    }
		    if (touch.identifier === RIGHT.id){
		    	RIGHT.on = false;
		    }
	   }
	}, false);
    
    return {
        start: function(){
            init();
            spritesheet = new Image();
            spritesheet.onload = function(){
                
                if(audioContext){
                    tools.loadSound(audioContext, data.sounds.musics.intro, function(sound){
                        introMusic = sound;
                        tools.playSound(audioContext, introMusic);
                        window.requestAnimationFrame(render);
                    	changeState("intro");
                    });
                } else {
                    window.requestAnimationFrame(render);
                    changeState("intro");
                }
            };
            spritesheet.src = "spritesheet.complete.png";
        }
    }
}());
$(function(){
    game.start();
});