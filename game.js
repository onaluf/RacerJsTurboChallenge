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
    var startTime;
	var previousTimestamp;
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
    
    var gameState = "intro";
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
	var startRace = function(){
	    previousTimestamp = requestAnimationFrame.now();
        startTime = requestAnimationFrame.now();
        checkpointTime = tools.generateNextCheckpointTime(level);
	}
	
	// this is the list of renderer indexed by the game state they work for
	var introScreens  = [
        {
            duration: 4500,
            fadein:   1500,
            fadeout:  500,
            clean:   function () {
                context.fillStyle = "rgb(0,0,0)";
                context.fillRect(0, 0, data.render.width, data.render.height);
            },
            render:  function (percent){
                tools.draw.image(context, data.intro.ogam, 0, 100, 1);
            }
        },{
            duration: 3500,
            fadein:   1500,
            fadeout:  500,
            clean:   function () {
                context.fillStyle = "rgb(0,0,0)";
                context.fillRect(0, 0, data.render.width, data.render.height);
            },
            render:  function (percent){
                tools.draw.image(context, data.intro.hbe, 0, 80, 1);
            }
        },{
            duration: 3000,
            fadein:   1000,
            fadeout:  0,
            clean:   function () {
                context.fillStyle = "rgb(0,0,0)";
                context.fillRect(0, 0, data.render.width, data.render.height);
            },
            render:  function (percent){
                tools.draw.image(context, data.intro.road, 0, 0, 1);
            }
        },{
            duration: 4000,
            fadein:   500,
            fadeout:  500,
            clean:   function () {
                tools.draw.image(context, data.intro.road, 0, 0, 1);
            },
            render:  function (percent){
                tools.draw.string(context, spritesheet, "Code + Art",{x: 115, y: 90});
                tools.draw.string(context, spritesheet, "by",{x: 152, y: 100});
                tools.draw.string(context, spritesheet, "Selim Arsever",{x: 105, y: 110});
            }
        },{
            duration: 4000,
            fadein:   500,
            fadeout:  500,
            clean:   function () {
                tools.draw.image(context, data.intro.road, 0, 0, 1);
            },
            render:  function (percent){
                tools.draw.string(context, spritesheet, "Music",{x: 140, y: 90});
                tools.draw.string(context, spritesheet, "by",{x: 152, y: 100});
                tools.draw.string(context, spritesheet, "Ashtom",{x: 137, y: 110});
            }
        },{
            duration: 4000,
            fadein:   500,
            fadeout:  500,
            clean:   function () {
                tools.draw.image(context, data.intro.road, 0, 0, 1);
            },
            render:  function (percent){
                tools.draw.string(context, spritesheet, "Fonts",{x: 140, y: 90});
                tools.draw.string(context, spritesheet, "by",{x: 152, y: 100});
                tools.draw.string(context, spritesheet, "spicypixel.net",{x: 105, y: 110});
            }
        },{
            duration: 2000,
            fadein:   0,
            fadeout:  0,
            clean:   function () {
                tools.draw.image(context, data.intro.road, 0, 0, 1);
            },
            render:  function (percent){
                var ratio = 20 * Math.pow(Math.max(0.0, percent / 100.0 - 0.2), 3);
                tools.draw.image(context, data.intro.car, 320.0 * (1.0-ratio) / 2.0, 80 - 30 * ratio, ratio);
            }
        },{
            duration: 30000,
            fadein: 100,
            fadeout: 500,
            clean: function () {
                context.fillStyle = "rgb(0,0,0)";
                context.fillRect(0, 0, data.render.width, data.render.height);
            },
            render: function (percent){
                tools.draw.image(context, data.intro.rjstc, 64, 30, 1);
                tools.draw.string(context, spritesheet, "press space",{x: 120, y: 170});
            }
        }
        
	];
	
	var render = function(timestamp){
		var now = requestAnimationFrame.now();
		window.requestAnimationFrame(render);
		
	    // scalling
        domContext.drawImage(canvas, 0, 0, domCanvas.width, domCanvas.height);
        
        // call the correct renderer:
        renderer[gameState](timestamp);
        control(timestamp);
	}
	
	var renderer = {
		intro : function (timestamp){
		    
		    // find current screen
			var startTime = timestamp - previousTimestamp;
            var olderScreen = 0;
            var rendered = false;
            var i = 0;
            var screen = introScreens[0];
            var time = startTime - olderScreen;
            while (time >= screen.duration) {
                olderScreen += screen.duration;
                if(++i >= introScreens.length){
                    i = 0;
                }
                screen = introScreens[i];
                time = startTime - olderScreen;
            }
            
            //render current screen
            context.globalAlpha = 1.0;
            screen.clean();
            
            if(time < screen.fadein){
                context.globalAlpha = time / screen.fadein;
            } else if (time > screen.duration - screen.fadeout){
                context.globalAlpha = 1 - (time - screen.duration + screen.fadeout) / screen.fadeout;
            } else {
                context.globalAlpha = 1.0;
            }
            screen.render(time / screen.duration * 100.0);
		    context.globalAlpha = 1.0;
		}, 
		menu : function (timestamp){
	        context.fillStyle = "rgb(255,0,0)";
	        context.fillRect(0, 0, data.render.width, data.render.height);
		},
		race : function(timestamp){
		       
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
	            if(currentHeight > endProjectedHeight){
	               tools.draw.segment(
	               		context,
	               		data.levels[level.type],
	                    data.render.height / 2 + currentHeight, 
	                    currentScaling, currentSegment.curve - baseOffset - lastDelta * currentScaling, 
	                    data.render.height / 2 + endProjectedHeight, 
	                    endScaling, 
	                    nextSegment.curve - baseOffset - lastDelta * endScaling, 
	                    counter < data.road.segmentPerColor, currentSegmentIndex == 2 || currentSegmentIndex == (road.length-data.render.depthOfField));
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
	            			player.speed *= 0.7;
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
	            tools.draw.sprite(context, sprite);
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
            
            var timePassed = timestamp - startTime;
            var remainingTime = checkpointTime - Math.floor(timePassed /1000);
            tools.draw.string(context, spritesheet, ""+remainingTime, {x: data.render.width / 2, y: 1});
            
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
	
	var control = function(timestamp){
		switch (gameState) {
			case "intro":
				if(keys[32] || UP.on){
		        	gameState = "menu";
		        	context.globalAlpha = 1.0;
		        	if(introMusic){
		        	    introMusic.noteOff(0);
		        	}
		        }
				break;
			case "menu":
				if(keys[32] || UP.on){
		        	gameState = "race";
		      		//previousTimestamp = requestAnimationFrame.now();
		            //startTime = requestAnimationFrame.now();
		            startRace();
		            context.globalAlpha = 1.0;
		            
		            if(audioContext){
                        tools.loadSound(audioContext, data.sounds.musics.race, function(sound){
                            raceMusic = sound;
                            tools.playSound(audioContext, raceMusic);
                        })
                    }
		        }
				break;
			case "race":
				var deltaT = (timestamp - previousTimestamp) / 30.0;
		        previousTimestamp = timestamp;
		        
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
    		        
    		        player.position += player.speed * deltaT * Math.cos(Math.PI / 180 * player.steering);
    		        player.posx     += player.speed * deltaT * Math.sin(Math.PI / 180 * player.steering) * steeringBonus;
		        } else {
		            player.position += player.speed * deltaT;
		        }
				break;
		}
	}
    
    //initialize the game
    var init = function(){
        // configure canvas
        domCanvas = $("#c")[0];
        domContext = domCanvas.getContext('2d');
        
        canvas = document.createElement("canvas");//$("#c")[0];
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
        
        // road generation
        generateRoad(seed);
        
        // retrieve the audio context
        try {
            audioContext = new webkitAudioContext();
        } catch(e) {
            // fail silenty
        }
    };
    
    // -------------------------------------
    // ---  Generates the road randomly  ---
    // -------------------------------------
    var generateRoad = function(seed){
        
    	level = tools.parseSeed(seed);
    	var r = new tools.r(level.random);
    	
        // generate opponents
        var startPoint = 0;
        opponents = [];
        while (startPoint < level.length * data.road.zoneSize * data.road.segmentSize){
            var start    = r.nextRange(data.road.minOpponentDist, data.road.maxOpponentDist);
            var phase = r.nextFloat()*2-1.0
            opponents.push({
                start: start,
                phase: phase 
            });
            
            startPoint += start;
        }

		road = [];
        var currentStateH = 0; //0=flat 1=up 2= down
        var transitionH   = [[0,1,2],[0,2],[0,1]];
        
        var currentStateC = 0; //0=straight 1=left 2= right
        var transitionC   = [[0,1,2],[0,2],[0,1]];

        var currentHeight = 0;
        var currentCurve  = 0;

        var zones         = level.length;
        while(zones--){
            // Generate current Zone
            var finalHeight;
            switch(currentStateH){
                case 0:
                    finalHeight = 0; 
                    break;
                case 1:
                    finalHeight = data.road.maxHeight * r.nextFloat();
                    break;
                case 2:
                    finalHeight = - data.road.maxHeight * r.nextFloat();
                    break;
            }
            var finalCurve;
            switch(currentStateC){
                case 0:
                    finalCurve = 0; break;
                case 1:
                    finalCurve = - data.road.maxCurve * r.nextFloat();
                    break;
                case 2:
                    finalCurve = data.road.maxCurve * r.nextFloat();
                    break;
            }

            for(var i=0; i < data.road.zoneSize; i++){
                // add a tree
                if(r.nextFloat() < level.density) {
                    var spriteType = r.choice(data.levels[level.type].sprites);
                    var sprite = {type: spriteType, pos: 0.7 + r.nextFloat()*4};
                    if(r.nextFloat() < 0.5){
                        sprite.pos = -sprite.pos;
                    }
                } else {
                    var sprite = false;
                }
                road.push({
                    height: currentHeight+finalHeight / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)),
                    curve:  currentCurve+finalCurve / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)), 
                    sprite: sprite 
                })
            }
            currentHeight += finalHeight;
            currentCurve += finalCurve;
            // Find next zone
            if(r.nextFloat() < level.mountainy){
                currentStateH = r.choice(transitionH[currentStateH]);
            } else {
                currentStateH = transitionH[currentStateH][0];
            }
            if(r.nextFloat() < level.curvy){
                currentStateC = r.choice(transitionC[currentStateC]);
            } else {
                currentStateC = transitionC[currentStateC][0];
            }
        }
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
                        previousTimestamp = requestAnimationFrame.now();
                    })
                } else {
                    window.requestAnimationFrame(render);
                    previousTimestamp = requestAnimationFrame.now();
                }
            };
            spritesheet.src = "spritesheet.complete.png";
        }
    }
}());
$(function(){
    game.start();
});