/**
 * This is the file that holds the tools needed for the game.
 * 
 * Copyright (c) 2013 Selim Arsever (http://selim.arsever.ch/) 
 * Under the MIT license.
 */

// namespace
var tools = function(){};

// RequestAnimationFrame polyfill by Johan Nordberg
// (http://www.makeitgo.ws/articles/animationframe/)
(function() {
  var lastFrame, method, now, queue, requestAnimationFrame, timer, vendor, _i, _len, _ref, _ref1;
  method = 'native';
  now = Date.now || function() {
    return new Date().getTime();
  };
  requestAnimationFrame = window.requestAnimationFrame;
  _ref = ['webkit', 'moz', 'o', 'ms'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    vendor = _ref[_i];
    if (!(requestAnimationFrame != null)) {
      requestAnimationFrame = window[vendor + "RequestAnimationFrame"];
    }
  }
  if (!(requestAnimationFrame != null)) {
    method = 'timer';
    lastFrame = 0;
    queue = timer = null;
    requestAnimationFrame = function(callback) {
      var fire, nextFrame, time;
      if (queue != null) {
        queue.push(callback);
        return;
      }
      time = now();
      nextFrame = Math.max(0, 16.66 - (time - lastFrame));
      queue = [callback];
      lastFrame = time + nextFrame;
      fire = function() {
        var cb, q, _j, _len1;
        q = queue;
        queue = null;
        for (_j = 0, _len1 = q.length; _j < _len1; _j++) {
          cb = q[_j];
          cb(lastFrame);
        }
      };
      timer = setTimeout(fire, nextFrame);
    };
  }
  requestAnimationFrame(function(time) {
    var _ref1;
    if ((((_ref1 = window.performance) != null ? _ref1.now : void 0) != null) && time < 1e12) {
      requestAnimationFrame.now = function() {
        return window.performance.now();
      };
      requestAnimationFrame.method = 'native-highres';
    } else {
      requestAnimationFrame.now = now;
    }
  });
  requestAnimationFrame.now = ((_ref1 = window.performance) != null ? _ref1.now : void 0) != null ? (function() {
    return window.performance.now();
  }) : now;
  requestAnimationFrame.method = method;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// LCG Pseudo Random Number Generator by orip
// (http://stackoverflow.com/questions/424292/how-to-create-my-own-javascript-random-number-generator-that-i-can-also-set-the#424445)	
tools.r = function(seed) {
		// LCG using GCC's constants
		this.m = 0x100000000; // 2**32;
		this.a = 1103515245;
		this.c = 12345;
	
		this.state = seed ? seed : Math.floor(Math.random() * (this.m-1));
	  
		this.nextInt = function() {
			this.state = (this.a * this.state + this.c) % this.m;
			return this.state;
		}
		
		this.nextFloat = function() {
			// returns in range [0,1]
			return this.nextInt() / (this.m - 1);
		}
		
		this.nextRange = function(start, end) {
			// returns in range [start, end): including start, excluding end
			// can't modulu nextInt because of weak randomness in lower bits
			var rangeSize = end - start;
			var randomUnder1 = this.nextInt() / this.m;
			return start + Math.floor(randomUnder1 * rangeSize);
		}
		
		this.choice = function(array) {
			return array[this.nextRange(0, array.length)];
		}
	}
	
// parse the hash part of the url.
tools.parseHash  = function(){
	var defaultValue = {
		//seed: "0001ZZZ0"
		seed: "0011ZFZ0"
	}
	// TODO this is just a test implementation, more to come
	if (window.location.hash !== undefined && window.location.hash.length === 9) {
		defaultValue.seed = window.location.hash.slice(1,9);
	} 
	return defaultValue.seed;
}

// From now on seeds will replace roadParam. A seed is a string made of a
// a series of characters ranging from '0' to 'Z' (all number and captial  
// letters), each one with a given meaning:
// 0-1) a random seed
// 2) the type of the race:
//     - '1': desert
//     - '2': forest
//     - '3': swamp
//     - '4': dawn
//     - '5': fog
//     - '6': rain
//     - '7': snow
//     - '8': ...
// 3) the length
// 4) the curvyness
// 5) the steepness
// 6) the density of the scenery
// 7) the difficulty (time or adversary)
tools.parseSeed = function(seed){
	var toInt = function(char){
		// '0' = 48 -> '9' = 57
		// 'A' = 65 -> 'Z' = 90
		var int = char.charCodeAt(0) - 48;
		if(int > 9) {
			int -= 7;
		}
		return int;
	}
	var racesType = ["desert", "forest", "swamp",  "dawn", "fog", "rain", "snow"];
	
	var level = {
		random     : toInt(seed[0]) * 36 + toInt(seed[1]),
		type       : racesType[toInt(seed[2])],
		length     : toInt(seed[3]) + 1,
		curvy      : toInt(seed[4]) / 36.0,
		mountainy  : toInt(seed[5]) / 36.0,
		density    : toInt(seed[6]) / 36.0,
		difficulty : toInt(seed[7])
	};
	
	level.zones  = 10 + level.length;
    level.numberOfCheckpoints = Math.round(2 + level.length /  5);
	level.numberOfZonesPerCheckpoints = Math.round(level.zones / level.numberOfCheckpoints);
	
	// TODO console.info("zone: "+level.zones+",Checkpoints: "+level.numberOfCheckpoints+",z/p: "+level.numberOfZonesPerCheckpoints);
	
	return level;
}

tools.generateSeed = function(options){
	var toChar = function(integer){
		// '0' = 48 -> '9' = 57
		// 'A' = 65 -> 'Z' = 90
		if(integer < 9){
			return ""+integer;
		} else if (integer < 36){
			return String.fromCharCode(integer - 10 + 65);
		}
	}
	
	if (options.random){
		var r = new tools.r();
		var seed = "";
		seed += toChar(r.nextRange(0,36)) + toChar(r.nextRange(0,36)); // random part
		seed += toChar(r.nextRange(0,2)); // the type of the race
		seed += toChar(r.nextRange(0,1)); // the length TODO change this to 0 -> 36
		seed += toChar(r.nextRange(0,36)); // the curvyness
		seed += toChar(r.nextRange(0,36)); // the steepness
		seed += toChar(r.nextRange(0,36)); // the density of the scenery
		seed += toChar(r.nextRange(0,36)); // the difficulty
		
		return seed;
	} else {
		return "TODO";
	}
}

tools.generateNextCheckpointTime = function(level, index){
    return (1 - 0.1 * index) * level.numberOfZonesPerCheckpoints * data.road.zoneSize / 50;
}

// resize the canvas to make it take the full browser's window
tools.resize = function(){
    if ($(window).width() / $(window).height() > data.render.width / data.render.height) {
        var scale = $(window).height() / data.render.height;
    }
    else {
        var scale = $(window).width() / data.render.width;
    }
    
    var transform = "scale(" + scale + ")";
    $("#c").css("MozTransform", transform).css("transform", transform).css("WebkitTransform", transform).css({
        top: (scale - 1) * data.render.height / 2,
        left: (scale - 1) * data.render.width / 2 + ($(window).width() - data.render.width * scale) / 2
    });
};

tools.canvasResize = function(){
    ws = {
        w: $(window).width(),
        h: $(window).height()
    }
    
    var domCanvas = $("#c")[0];
    var domContext = domCanvas.getContext('2d')
    var ratio = data.render.width / data.render.height;
    
    if (ws.w / ws.h > ratio) {
        
        domCanvas.height = ws.h;
        domCanvas.width = ws.h * ratio;
    }
    else {
        domCanvas.height = ws.w / ratio;
        domCanvas.width = ws.w;
    }
    
    domContext.imageSmoothingEnabled = false;
    domContext.webkitImageSmoothingEnabled = false;
    domContext.mozImageSmoothingEnabled = false;
    
    
    $("#c").css({
        top: (ws.h - domCanvas.height) / 2,
        left: (ws.w - domCanvas.width) / 2
    });
}

// Draw function: function that draw something on screen
tools.draw = {
	// Drawing primitive
    image: function(context, image, x, y, scale){
        context.drawImage(spritesheet,  image.x, image.y, image.w, image.h, x, y, scale*image.w, scale*image.h);
    },
    sprite: function(context, sprite){
        //if(sprite.y <= sprite.ymax){
            var destY = sprite.y - sprite.i.h * sprite.s;
            if(sprite.ymax < sprite.y) {
                var h = Math.min(sprite.i.h * (sprite.ymax - destY) / (sprite.i.h * sprite.s), sprite.i.h);
            } else {
                var h = sprite.i.h; 
            }
            //sprite.y - sprite.i.h * sprite.s
            if(h > 0) context.drawImage(spritesheet,  sprite.i.x, sprite.i.y, sprite.i.w, h, sprite.x, destY, sprite.s * sprite.i.w, sprite.s * h);
        //}
    },
    segment: function (context, level, position1, scale1, offset1, position2, scale2, offset2, alternate, finishStart){
        var grass     = (alternate) ? level.colors.ground2 : level.colors.ground1;
        var border    = (alternate) ? level.colors.border2 : level.colors.border1;
        var road      = (alternate) ? level.colors.road2 : level.colors.road1;
        var lane      = (alternate) ? "#fff" : level.colors.road1;

        if(finishStart){
            road = "#fff";
            lane = "#fff";
            border = "#fff";
        }

        //draw grass:
        context.fillStyle = grass;
        context.fillRect(0, position2, data.render.width,(position1-position2));
        
        // draw the road
        tools.draw.trapez(context, position1, scale1, offset1, position2, scale2, offset2, -0.5, 0.5, road);
        
        //draw the road border
        tools.draw.trapez(context, position1, scale1, offset1, position2, scale2, offset2, -0.5, -0.47, border);
        tools.draw.trapez(context, position1, scale1, offset1, position2, scale2, offset2, 0.47,   0.5, border);
        
        // draw the lane line
        tools.draw.trapez(context, position1, scale1, offset1, position2, scale2, offset2, -0.18, -0.15, lane);
        tools.draw.trapez(context, position1, scale1, offset1, position2, scale2, offset2,  0.15,  0.18, lane);
    },
    trapez: function(context, pos1, scale1, offset1, pos2, scale2, offset2, delta1, delta2, color){
        var demiWidth = data.render.width / 2;
        
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(demiWidth + delta1 * data.render.width * scale1 + offset1, pos1);
        context.lineTo(demiWidth + delta1 * data.render.width * scale2 + offset2, pos2); 
        context.lineTo(demiWidth + delta2 * data.render.width * scale2 + offset2, pos2); 
        context.lineTo(demiWidth + delta2 * data.render.width * scale1 + offset1, pos1);
        context.fill();
    },
    door: function(context, pos, scale, offset){
    	var demiWidth = data.render.width / 2;
    	context.fillStyle = "#FFF";
        context.beginPath();
        context.moveTo(demiWidth + (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos);
        context.lineTo(demiWidth + (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 100 * scale); 
        context.lineTo(demiWidth + 0.52 * data.render.width * scale + offset, pos - 100 * scale); 
        context.lineTo(demiWidth + 0.52 * data.render.width * scale + offset, pos);
        context.moveTo(demiWidth - (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos);
        context.lineTo(demiWidth - (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 100 * scale); 
        context.lineTo(demiWidth - 0.52 * data.render.width * scale + offset, pos - 100 * scale); 
        context.lineTo(demiWidth - 0.52 * data.render.width * scale + offset, pos);
        context.fill();
        
        context.fillStyle = "#F00";
        context.beginPath();
        context.moveTo(demiWidth + (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 100 * scale);
        context.lineTo(demiWidth + (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 150 * scale); 
        context.lineTo(demiWidth - (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 150 * scale);
        context.lineTo(demiWidth - (0.52 + 0.05 * scale) * data.render.width * scale + offset, pos - 100 * scale); 
        context.fill();
    },
    background: function(context, level, position, height) {
    	// Clean screen
        context.fillStyle = level.colors.sky;
        context.fillRect(0, 0, data.render.width, height);
        
        context.fillStyle = level.colors.ground1;
        context.fillRect(0, level.background.h + height, data.render.width, data.render.height -level.background.h - height);
        
        var first = position / 2 % (level.background.w);
        tools.draw.image(context, level.background, first-level.background.w +1, height, 1);
        tools.draw.image(context, level.background, first+level.background.w -1, height, 1);
        tools.draw.image(context, level.background, first, height, 1);
    },
    button : function(context, state, pos, width){
    	context.drawImage(spritesheet, data.sprites.buttonL.x, data.sprites.buttonL.y, data.sprites.buttonL.w, data.sprites.buttonL.h, pos.x, pos.y, data.sprites.buttonL.w, data.sprites.buttonL.h);
    	context.drawImage(spritesheet, data.sprites.buttonM.x, data.sprites.buttonM.y, data.sprites.buttonM.w, data.sprites.buttonM.h, pos.x + data.sprites.buttonL.w , pos.y, width - data.sprites.buttonL.w - data.sprites.buttonR.w, data.sprites.buttonM.h);
    	context.drawImage(spritesheet, data.sprites.buttonR.x, data.sprites.buttonR.y, data.sprites.buttonR.w, data.sprites.buttonR.h, pos.x + width - data.sprites.buttonR.w, pos.y, data.sprites.buttonR.w, data.sprites.buttonR.h);
    	
    	if(state === 1){
    		context.drawImage(spritesheet, data.sprites.focusL.x, data.sprites.focusL.y, data.sprites.focusL.w, data.sprites.focusL.h, pos.x - 2, pos.y - 2, data.sprites.focusL.w, data.sprites.focusL.h);
    		context.drawImage(spritesheet, data.sprites.focusM.x, data.sprites.focusM.y, data.sprites.focusM.w, data.sprites.focusM.h, pos.x -2 + data.sprites.focusL.w , pos.y - 2, width - data.sprites.focusL.w - data.sprites.focusR.w + 4, data.sprites.focusM.h);
    		context.drawImage(spritesheet, data.sprites.focusR.x, data.sprites.focusR.y, data.sprites.focusR.w, data.sprites.focusR.h, pos.x + width - data.sprites.focusR.w + 2, pos.y - 2, data.sprites.focusR.w, data.sprites.focusR.h);
    	} else if (state === 2) {
    		context.drawImage(spritesheet, data.sprites.activeL.x, data.sprites.activeL.y, data.sprites.activeL.w, data.sprites.activeL.h, pos.x - 2, pos.y - 2, data.sprites.activeL.w, data.sprites.activeL.h);
    		context.drawImage(spritesheet, data.sprites.activeM.x, data.sprites.activeM.y, data.sprites.activeM.w, data.sprites.activeM.h, pos.x -2 + data.sprites.activeL.w , pos.y - 2, width - data.sprites.activeL.w - data.sprites.activeR.w + 4, data.sprites.activeM.h);
    		context.drawImage(spritesheet, data.sprites.activeR.x, data.sprites.activeR.y, data.sprites.activeR.w, data.sprites.activeR.h, pos.x + width - data.sprites.activeR.w + 2, pos.y - 2, data.sprites.activeR.w, data.sprites.activeR.h);
    	}
    	//tools.draw.image(context, data.sprites.buttonL, first-level.background.w +1, height, 1);
    },
    string: function(context, spritesheet, font, string, pos, center) {
    	var initialCurx = pos.x;
        var cury = pos.y;
    	if(center){
    		// find max width
			var maxLength     = 0;
			var currentLength = 0;
    		for(var i=0; i < string.length; i++) {
    			if (string[i]==="\n"){
    				if (currentLength > maxLength){
    					maxLength = currentLength;
    				}
    				currentLength = 0;
    			} else {
	    			currentLength++;
    			}
    		}
    		if (currentLength > maxLength){
				maxLength = currentLength;
			}
			// define the initial x
    		switch (font) {
                case 0: 
                    initialCurx = pos.x - maxLength * 8 / 2;
                    break;
                case 1: 
                    initialCurx = pos.x - maxLength * 9 / 2;
                    break;
            }
    	}
        var curx = initialCurx;
        if(font == 0){
            string = string.toUpperCase();
        }
        for(var i=0; i < string.length; i++) {
            switch (font) {
                case 0: 
                	if(string[i]==="\n"){                		
                    	curx = initialCurx;
                    	cury += 8;
                	} else {
	                    context.drawImage(spritesheet, (string.charCodeAt(i) - 32) * 8, 0, 8, 8, curx, cury, 8, 8);
	                    curx += 8;
                	}
                    break;
                case 1: 
                    if(string[i]==="\n"){                		
                    	curx = initialCurx;
                    	cury += 13;
                	} else {
	                    context.drawImage(spritesheet, (string.charCodeAt(i) - 33) * 9, 8, 9, 13, curx, cury, 9, 13);
	                    curx += 9;
                	}
                    break;
            }
        }
    }
}

tools.introScreens  = [
    {
        duration: 4500,
        fadein:   1500,
        fadeout:  500,
        clean:   function (context) {
            context.fillStyle = "rgb(0,0,0)";
            context.fillRect(0, 0, data.render.width, data.render.height);
        },
        render:  function (context, percent){
            tools.draw.image(context, data.intro.ogam, 0, 100, 1);
        }
    },{
        duration: 3500,
        fadein:   1500,
        fadeout:  500,
        clean:   function (context) {
            context.fillStyle = "rgb(0,0,0)";
            context.fillRect(0, 0, data.render.width, data.render.height);
        },
        render:  function (context, percent){
            tools.draw.image(context, data.intro.hbe, 0, 80, 1);
        }
    },{
        duration: 3000,
        fadein:   1000,
        fadeout:  0,
        clean:   function (context) {
            context.fillStyle = "rgb(0,0,0)";
            context.fillRect(0, 0, data.render.width, data.render.height);
        },
        render:  function (context, percent){
            tools.draw.image(context, data.intro.road, 0, 0, 1);
        }
    },{
        duration: 4000,
        fadein:   500,
        fadeout:  500,
        clean:   function (context) {
            tools.draw.image(context, data.intro.road, 0, 0, 1);
        },
        render:  function (context, percent){
            tools.draw.string(context, spritesheet, 1, "Code & Art",{x: 115, y: 90});
            tools.draw.string(context, spritesheet, 1, "by",{x: 152, y: 100});
            tools.draw.string(context, spritesheet, 1, "Selim Arsever",{x: 105, y: 110});
        }
    },{
        duration: 4000,
        fadein:   500,
        fadeout:  500,
        clean:   function (context) {
            tools.draw.image(context, data.intro.road, 0, 0, 1);
        },
        render:  function (context, percent){
            tools.draw.string(context, spritesheet, 1, "Music",{x: 140, y: 90});
            tools.draw.string(context, spritesheet, 1, "by",{x: 152, y: 100});
            tools.draw.string(context, spritesheet, 1, "Ashtom",{x: 137, y: 110});
        }
    },{
        duration: 4000,
        fadein:   500,
        fadeout:  500,
        clean:   function (context) {
            tools.draw.image(context, data.intro.road, 0, 0, 1);
        },
        render:  function (context, percent){
            tools.draw.string(context, spritesheet, 1, "Fonts",{x: 140, y: 90});
            tools.draw.string(context, spritesheet, 1, "by",{x: 152, y: 100});
            tools.draw.string(context, spritesheet, 1, "spicypixel.net",{x: 105, y: 110});
        }
    },{
        duration: 2000,
        fadein:   0,
        fadeout:  0,
        clean:   function (context) {
            tools.draw.image(context, data.intro.road, 0, 0, 1);
        },
        render:  function (context, percent){
            var ratio = 20 * Math.pow(Math.max(0.0, percent / 100.0 - 0.2), 3);
            tools.draw.image(context, data.intro.car, 320.0 * (1.0-ratio) / 2.0, 80 - 30 * ratio, ratio);
        }
    },{
        duration: 30000,
        fadein: 100,
        fadeout: 500,
        clean: function (context) {
            context.fillStyle = "rgb(0,0,0)";
            context.fillRect(0, 0, data.render.width, data.render.height);
        },
        render: function (context, percent){
            tools.draw.image(context, data.intro.rjstc, 64, 30, 1);
            tools.draw.string(context, spritesheet, 1, "press space",{x: 120, y: 170});
        }
    }
];

tools.generateRoad = function(level){
	var road = [];
    var opponents = [];
	
	var r = new tools.r(level.random);
	
    // generate opponents
    var startPoint = 0;
    while (startPoint < level.length * data.road.zoneSize * data.road.segmentSize){
        var start    = r.nextRange(data.road.minOpponentDist, data.road.maxOpponentDist);
        var phase = r.nextFloat()*2-1.0
        opponents.push({
            start: start,
            phase: phase 
        });
        
        startPoint += start;
    }

    var currentStateH = 0; //0=flat 1=up 2= down
    var transitionH   = [[0,1,2],[0,2],[0,1]];
    
    var currentStateC = 0; //0=straight 1=left 2= right
    var transitionC   = [[0,1,2],[0,2],[0,1]];

    var currentHeight = 0;
    var currentCurve  = 0;

    var zones         = level.zones;
    var finishline = zones * data.road.zoneSize - data.render.depthOfField;
    
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
        	var checkpoint = false;
        	if (zones % level.numberOfZonesPerCheckpoints == 0 && i == Math.round(data.road.zoneSize / 2) && road.length < finishline) {
	    		var checkpoint = true;
	    	}
	    	
            // add a sprite
            var sprite = false;
            if(r.nextFloat() < level.density) {
                var spriteType = r.choice(data.levels[level.type].sprites);
                sprite = {type: spriteType, pos: 0.7 + r.nextFloat()*4};
                if(r.nextFloat() < 0.5){
                    sprite.pos = -sprite.pos;
                }
            }
            road.push({
                height: currentHeight+finalHeight / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)),
                curve:  currentCurve+finalCurve / 2 * (1 + Math.sin(i/data.road.zoneSize * Math.PI-Math.PI/2)), 
                sprite: sprite,
                checkpoint: checkpoint
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
    
    return {
    	road: road,
    	opponents: opponents
    };
};

tools.loadSound = function (audioContext, url, callback){
    if(audioContext){
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        
        // Decode asynchronously
        request.onload = function() {
            audioContext.decodeAudioData(request.response, function(buffer) {
                var source = audioContext.createBufferSource(); // creates a sound source
                source.buffer = buffer;
                
                callback(source);
            });
        }
        request.send();
    } else {
        callback();
    }
}

tools.playSound = function (audioContext, sound){
    if(audioContext){
        
        // volume control
        var gainNode = audioContext.createGainNode();
        sound.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.5;

        // play sound
        sound.noteOn(0);  
    }
}
