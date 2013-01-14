/**
 * This is the file that holds the tools needed for the game.
 * 
 * Copyright (c) 2013 Selim Arsever (http://selim.arsever.ch/) 
 * Under the MIT license.
 */

// namespace
var tools = function(){};

// RequestAnimationFrame polyfill by Paul Irish and Erik Möller 
// (http://paulirish.com/2011/requestanimationframe-for-smart-animating/)
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

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
		seed: "000BZZZ0"
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
	
	return {
		random     : seed[0] + seed[1] * 36,
		type       : racesType[toInt(seed[2])],
		length     : toInt(seed[3]) + 1,
		curvy      : toInt(seed[4]) / 36.0,
		mountainy  : toInt(seed[5]) / 36.0,
		density    : toInt(seed[6]) / 36.0,
		difficulty : toInt(seed[7])
	}
}

tools.generateSeed = function(options){
	return "TODO";
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
    string: function(context, spritesheet, string, pos) {
        string = string.toUpperCase();
        var cur = pos.x;
        for(var i=0; i < string.length; i++) {
            context.drawImage(spritesheet, (string.charCodeAt(i) - 32) * 8, 0, 8, 8, cur, pos.y, 8, 8);
            cur += 8;
        }
    }
} 