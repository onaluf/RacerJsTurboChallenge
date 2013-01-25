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
    
    var seed = tools.parseHash();
    
    var road = [];
    var opponents = [];
   
    var player = {
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
    
    var gameState;
	var raceOver = false;
	var level;
	
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
	
	var startRace = function(){
		// road generation
		level              = tools.parseSeed(seed);
		var generated      = tools.generateRoad(level);
        road               = generated.road;
        opponents          = generated.opponents;
        startTime          = requestAnimationFrame.now();
        checkpointTime     = tools.generateNextCheckpointTime(level);
		lastCheckpointTime = startTime;
	};
	
	var render = function(timestamp){
		// var now = requestAnimationFrame.now();
		window.requestAnimationFrame(render);
		
	    // scalling
        domContext.drawImage(canvas, 0, 0, domCanvas.width, domCanvas.height);
        
        // call the correct renderer:
        renderer[gameState](timestamp - stateTimestamp, timestamp - previousTimestamp);
        control[gameState](timestamp, timestamp - previousTimestamp);
        
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
	        context.fillStyle = "rgb(255,0,0)";
	        context.fillRect(0, 0, data.render.width, data.render.height);
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
	        if (raceOver !== false){
		        absoluteIndex = Math.floor(raceOver / data.road.segmentSize);
		        currentSegmentIndex        = (absoluteIndex - 2) % road.length;
		        currentSegmentPosition     = (absoluteIndex - 2) * data.road.segmentSize - raceOver;
		        playerPosRelative          = (raceOver % data.road.segmentSize) / data.road.segmentSize;
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
	        var distanceDriven = 1.0 * (timestamp - startTime)/30.0;
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
                if(raceOver !== false){
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
                    if (iter == data.render.depthOfField - 3){
                    	if(currentSegment.checkpoint){
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
	            	var x = Math.cos(((timestamp - startTime)/2000 + opponents[i].phase) * Math.PI / 2) * 113;
	            	
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
	        if(absoluteIndex >= road.length-data.render.depthOfField-1 && raceOver === false){
                //$(window).keydown(function(e){ if(e.keyCode == 84) {location.href="http://twitter.com/home?status="+escape("I've just raced through #racer10k in "+currentTimeString+"!")}});
                raceOver = player.position;
            }
            if(raceOver){
                tools.draw.string(context, spritesheet, "Finished!", {x: 100, y: 20});
            } 
            
            var timePassed = timestamp - lastCheckpointTime;
            var remainingTime = checkpointTime - Math.floor(timePassed /1000);
            tools.draw.string(context, spritesheet, ""+remainingTime, {x: data.render.width / 2, y: 1});
            if(checkpointCrossed){
            	checkpointTime += remainingTime;
            	lastCheckpointTime = requestAnimationFrame.now();
            } else {
            	if (remainingTime < 0){
                	tools.draw.string(context, spritesheet, "Game Over!", {x: 100, y: 20});
            	}
            }
            
            var speed = Math.round(player.speed / player.maxSpeed * 420);
	        tools.draw.string(context, spritesheet, ""+speed+"kph", {x: 1, y: 1});
	        
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
				changeState("menu")
	        	context.globalAlpha = 1.0;
	        	if(introMusic){
	        	    introMusic.noteOff(0);
	        	}
	        }
		},
		menu:  function(timestamp, delta){
			if(keys[32] || UP.on){
				changeState("race");
	            startRace();
	            context.globalAlpha = 1.0;
	            
	            if(audioContext){
                    tools.loadSound(audioContext, data.sounds.musics.race, function(sound){
                        raceMusic = sound;
                        tools.playSound(audioContext, raceMusic);
                    })
                }
	        }
		},
		race:  function(timestamp, delta){
			var deltaT = delta / 30.0;
	        
		    if(raceOver === false){
				
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
	        } else {
	            player.position += player.speed * deltaT;
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
                    })
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