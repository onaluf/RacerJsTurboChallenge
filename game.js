// The game itself
var game = (function(){
	var gameState = "race"; // intro
	
	// this is the list of rendererr indexed by the game state they work for
	var previousTimestamp;
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
                tools.draw.image(context, data.intro.hbe, 0, 50, 1);
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
                tools.draw.string(context, spritesheet, "and",{x: 149, y: 120});
                tools.draw.string(context, spritesheet, "???",{x: 137, y: 130});
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
        }
	];
	var render = function(timestamp){
	    // scalling
        domContext.drawImage(canvas, 0, 0, domCanvas.width, domCanvas.height);
        
        // call the correct renderer:
        renderer[gameState](timestamp);
	}
	var renderer = {
		intro : function (timestamp){
			window.requestAnimationFrame(render);
			
			var startTime = timestamp - previousTimestamp;
            var olderScreen = 0;
            var rendered = false;
            for(var i=0; i < introScreens.length; i ++){
                var screen = introScreens[i];
                var time = startTime - olderScreen;

                if(time < screen.duration){
                    rendered = true;
                    context.globalAlpha = 1.0;
                    screen.clean();
                    
                    if(time < screen.fadein){
                        context.globalAlpha = time / screen.fadein;
                    } else if (time > screen.duration - screen.fadeout){
                        context.globalAlpha = 1 - (time - screen.duration + screen.fadeout) / screen.fadeout;
                    } else {
                        context.globalAlpha = 1.0
                    }
                    screen.render(time / screen.duration * 100.0);
                    break;
                } else {
                    olderScreen += screen.duration;
                }
            }
			if(!rendered){
			    gameState = "menu";
			    context.globalAlpha = 1.0;
			}
		}, 
		menu : function (timestamp){
	        context.fillStyle = "rgb(0,0,0)";
	        context.fillRect(0, 0, data.render.width, data.render.height);
	        
	        tools.draw.image(context, data.intro.rjstc, 64, 30, 1);
	        
	        tools.draw.string(context, spritesheet, "press space",{x: 120, y: 170});
	        if(keys[32]){
	        	gameState = "race";
	      		previousTimestamp = Date.now();
	            startTime = new Date.now();
	        }
	        window.requestAnimationFrame(render);
		},
		race : function(timestamp){
	        window.requestAnimationFrame(render);
	        var deltaT = (timestamp - previousTimestamp) / 1000;
	        previousTimestamp = timestamp;
	        
	        // --------------------------
	        // -- Update the car state --
	        // --------------------------
	        
	        if (Math.abs(lastDelta) > 130){ // if the player is outside of the road
	        	if (keys[40]) { // 40 down
	                player.speed -= player.breaking * deltaT;
	            }
	            if (player.speed > 3) {
	                player.speed -= 0.2;
	            } else {
	            	if (keys[38]) { // 38 up
		                player.speed += player.acceleration * deltaT;
		            } else {
		                player.speed -= player.deceleration * deltaT;
		            }
	            }
	        } else {
	            // read acceleration controls
	            if (keys[38]) { // 38 up
	                //player.position += 0.1;
	                player.speed += player.acceleration * delta / 30.0;
	            } else if (keys[40]) { // 40 down
	                player.speed -= player.breaking;
	            } else {
	                player.speed -= player.deceleration;
	            }
	        }
	        player.speed = Math.max(player.speed, 0); //cannot go in reverse
	        player.speed = Math.min(player.speed, player.maxSpeed); //maximum speed
	        player.position += player.speed * (delta / 30.0);
	        
	        // car turning
	        if (keys[37]) {
	            // 37 left
	            if(player.speed > 0){
	                player.posx -= player.turning * (delta / 30);
	            }
	            var carSprite = {
	                a: data.sprites.car_4,
	                x: 117,
	                y: 190
	            };
	        } else if (keys[39]) {
	            // 39 right
	            if(player.speed > 0){
	                player.posx += player.turning * (delta / 30);
	            }
	            var carSprite = {
	                a: data.sprites.car_8,
	                x: 125,
	                y: 190
	            };
	        } else {
	            var carSprite = {
	                a: data.sprites.car, 
	                x:125, 
	                y:190
	            };
	        }
	        
	        var spriteBuffer = [];
	        
	        // --------------------------
	        // --   Render the road    --
	        // --------------------------
	        var absoluteIndex = Math.floor(player.position / data.road.segmentSize);
	        
	        var currentSegmentIndex        = (absoluteIndex - 2) % road.length;
	        var currentSegmentPosition     = (absoluteIndex - 2) * data.road.segmentSize - player.position;
	        var currentSegment             = road[currentSegmentIndex];
	        
	        var lastProjectedHeight        = Number.POSITIVE_INFINITY;
	        var probedDepth                = 0;
	        var counter                    = absoluteIndex % (2 * data.road.segmentPerColor); // for alternating color band
	        
	        var playerPosSegmentHeight     = road[absoluteIndex % road.length].height;
	        var playerPosNextSegmentHeight = road[(absoluteIndex + 1) % road.length].height;
	        var playerPosRelative          = (player.position % data.road.segmentSize) / data.road.segmentSize;
	        var playerHeight               = data.render.camera_height + playerPosSegmentHeight + (playerPosNextSegmentHeight - playerPosSegmentHeight) * playerPosRelative;
	        
	        var baseOffset                 =  currentSegment.curve + (road[(currentSegmentIndex + 1) % road.length].curve - currentSegment.curve) * playerPosRelative;
	        
	        tools.draw.background(context, data.levels.desert, -baseOffset, 10*(playerPosNextSegmentHeight - playerPosSegmentHeight));
	        
	        lastDelta = player.posx - baseOffset*2;
	        
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
	            
	            if(currentHeight > endProjectedHeight){
	               tools.draw.segment(
	               		context,
	                    data.render.height / 2 + currentHeight, 
	                    currentScaling, currentSegment.curve - baseOffset - lastDelta * currentScaling, 
	                    data.render.height / 2 + endProjectedHeight, 
	                    endScaling, 
	                    nextSegment.curve - baseOffset - lastDelta * endScaling, 
	                    counter < data.road.segmentPerColor, currentSegmentIndex == 2 || currentSegmentIndex == (road.length/*TODO*/-data.render.depthOfField));
	            }
	            if(currentSegment.sprite){
	                spriteBuffer.push({
	                    y: data.render.height / 2 + startProjectedHeight, 
	                    x: data.render.width / 2 - currentSegment.sprite.pos * data.render.width * currentScaling + /* */currentSegment.curve - baseOffset - (player.posx - baseOffset*2) * currentScaling,
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
	            
	            if(absoluteIndex >= road.length-data.render.depthOfField-1){
		            tools.draw.string(context, spritesheet, "You did it!", {x: 100, y: 20});
		            tools.draw.string(context, spritesheet, "Press t to tweet your time.", {x: 30, y: 30});
		            $(window).keydown(function(e){ if(e.keyCode == 84) {location.href="http://twitter.com/home?status="+escape("I've just raced through #racer10k in "+currentTimeString+"!")}});
		        }
	        }
	        
	        while(sprite = spriteBuffer.pop()) {
	            tools.draw.sprite(context, sprite);
	        }
	        
	        // --------------------------
	        // --     Draw the car     --
	        // --------------------------
	        tools.draw.image(context, carSprite.a, carSprite.x, carSprite.y, 1);
	
	        // --------------------------
	        // --     Draw the hud     --
	        // --------------------------        
	        tools.draw.string(context, spritesheet, ""+Math.round(absoluteIndex/(road.length-data.render.depthOfField)*100)+"%",{x: 287, y: 1});
	        var diff = Date.now() - startTime;
	        
	        var min = Math.floor(diff / 60000);
	        
	        var sec = Math.floor((diff - min * 60000) / 1000); 
	        if(sec < 10) sec = "0" + sec;
	        
	        var mili = Math.floor(diff - min * 60000 - sec * 1000);
	        if(mili < 100) mili = "0" + mili;
	        if(mili < 10) mili = "0" + mili;
	        
	        currentTimeString = ""+min+":"+sec+":"+mili;
	        
	        tools.draw.string(context, spritesheet, currentTimeString, {x: 1, y: 1});
	        var speed = Math.round(player.speed / player.maxSpeed * 200);
	        tools.draw.string(context, spritesheet, ""+speed+"mph", {x: 1, y: 10});
	    }
	}
	
    // -----------------------------
    // ---  closure scoped vars  ---
    // -----------------------------
	var domCanvas;
	var domContext;
    var canvas;
    var context;
    var keys = [];
    var startTime;
    var lastDelta = 0;
    var currentTimeString = "";
    
    
    var seed = tools.parseHash();
	
    var road = [];
   
    var player = {
        position: 10,
        speed: 0,
        acceleration: 0.05,
        deceleration: 0.1,
        breaking: 0.6,
        turning: 5.0,
        posx: 0,
        maxSpeed: 15
    };
   	
    // -----------------------------
    // -- closure scoped function --
    // -----------------------------
    
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
        //tools.resize();
        //$(window).resize(tools.resize);    
        
        //register key handeling:
        $(document).keydown(function(e){
            keys[e.keyCode] = true;
        });
        $(document).keyup(function(e){
            keys[e.keyCode] = false;
        });
        
        // road generation
        generateRoad(seed);
    };
    
    // -------------------------------------
    // ---  Generates the road randomly  ---
    // -------------------------------------
    var generateRoad = function(seed){
    	var level = tools.parseSeed(seed);
    	var r = new tools.r(level.random);
    	
        var currentStateH = 0; //0=flat 1=up 2= down
        var transitionH   = [[0,1,2],[0,2,2],[0,1,1]];
        
        var currentStateC = 0; //0=straight 1=left 2= right
        var transitionC   = [[0,1,2],[0,2,2],[0,1,1]];

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
                if(i % data.road.zoneSize / 4 == 0){
                    var sprite = {type: data.sprites.rock, pos: -0.55};
                } else {
                    if(r.nextFloat() < 0.05) {
                        var spriteType = data.levels[level.type].sprites[0];//([tree,rock])[Math.floor(r()*1.9)];
                        var sprite = {type: spriteType, pos: 0.6 + r.nextRange(0,4)};
                        if(r.nextFloat() < 0.5){
                            sprite.pos = -sprite.pos;
                        }
                    } else {
                        var sprite = false;
                    }
                }
                road.push({
                    height: currentHeight+finalHeight / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)),
                    curve: currentCurve+finalCurve / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)),
                    sprite: sprite
                })
            }
            currentHeight += finalHeight;
            currentCurve += finalCurve;
            // Find next zone
            if(r.nextFloat() < level.mountainy){
                currentStateH = transitionH[currentStateH][1+Math.round(r.nextFloat())];
            } else {
                currentStateH = transitionH[currentStateH][0];
            }
            if(r.nextFloat() < level.curvy){
                currentStateC = transitionC[currentStateC][1+Math.round(r.nextFloat())];
            } else {
                currentStateC = transitionC[currentStateC][0];
            }
        }
    };
    
    return {
        start: function(){
            init();
            spritesheet = new Image();
            spritesheet.onload = function(){
                previousTimestamp = Date.now();
                window.requestAnimationFrame(render);
            };
            spritesheet.src = "spritesheet.complete.png";
        }
    }
}());
$(function(){
    game.start();
});