/**
 * This is the file that holds the sprites defintions and race as well 
 * as the constantes.
  * 
 * Copyright (c) 2013 Selim Arsever (http://selim.arsever.ch/) 
 * Under the MIT license.
 */

// namespace
var data = new function(){};

data.road = {
    maxHeight:       900,
    zoneSize:        250,
    maxCurve:        400,
    segmentSize:     5,
    segmentPerColor: 4,
}

//Level definition
data.levels = {
	desert : {
		background : {
	        x: 0,
	        y: 9,
	        w: 320,
	        h: 120
	    },
	    colors : {
	    	sky     : "#0500f7",
	    	ground1 : "#dc9",
	    	ground2 : "#eda",
	    	road1   : "#777",
	    	road2   : "#999",
	    	border1 : "#fff",
	    	border2 : "#e00"
	    },
	    sprites : [
	    	{
		        x: 321,
		        y: 9,
		        w: 23,
		        h: 50
		    },{
		        x: 345,
		        y: 9,
		        w: 11,
		        h: 14
		    }
	    ]
	}
}

// images for the intro
data.intro  = {
    road : { 
        x: 0,
        y: 168,
        w: 320,
        h: 240
    },
    car : { 
        x: 0,
        y: 409,
        w: 320,
        h: 231
    },
    ogam : { 
        x: 0,
        y: 640,
        w: 320,
        h: 17
    },
    hbe : { 
        x: 0,
        y: 657,
        w: 320,
        h: 78
    },
    rjstc : { 
        x: 320,
        y: 168,
        w: 192,
        h: 125
    }
}

// general purpose sprites
data.sprites = {
	car : { 
        x: 0,
        y: 130,
        w: 69,
        h: 38
    },
    car_4 : { 
        x: 70,
        y: 130,
        w: 77,
        h: 38
    },
    car_8 : { 
        x: 148,
        y: 130,
        w: 77,
        h: 38
    },
    logo : {
        x: 161,
        y: 39,
        w: 115,
        h: 20
    },
    rock : {
        x: 345,
        y: 9,
        w: 11,
        h: 14
    }
}


data.render = {
    width: 320,
    height: 240,
    depthOfField: 150,
    camera_distance: 30,
    camera_height: 100
};
