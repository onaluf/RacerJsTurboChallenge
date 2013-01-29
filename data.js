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
    minOpponentDist: 50,
    maxOpponentDist: 350
}

//Level definition
data.levels = {
	desert : {
		background : {
	        x: 704,
	        y: 21,
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
                x: 681,
                y: 21,
                w: 23,
                h: 50
            },{
                x: 686,
                y: 71,
                w: 18,
                h: 10
            },{
                x: 678,
                y: 81,
                w: 25,
                h: 22
            }
        ]
	},
    forest : {
        background : {
            x: 704,
            y: 141,
            w: 320,
            h: 120
        },
        colors : {
            sky     : "#06c7ff",
            ground1 : "#5e9b4b",
            ground2 : "#558c44",
            road1   : "#999",
            road2   : "#777",
            border1 : "#82633f",
            border2 : "#705536"
        },
        sprites : [
            {
                x: 676,
                y: 141,
                w: 28,
                h: 45
            },{
                x: 692,
                y: 186,
                w: 12,
                h: 7
            },{
                x: 692,
                y: 193,
                w: 12,
                h: 7
            },{
                x: 673,
                y: 200,
                w: 31,
                h: 46
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
        y: 839,
        w: 320,
        h: 47
    },
    hbe : { 
        x: 0,
        y: 768,
        w: 320,
        h: 70
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
        x: 222,
        y: 129,
        w: 69,
        h: 38
    },
    carL: [
        { 
            x: 154,
            y: 129,
            w: 68,
            h: 38
        },{ 
            x: 78,
            y: 129,
            w: 74,
            h: 38
        },{ 
            x: 0,
            y: 129,
            w: 77,
            h: 38
        }
    ],
    carR: [
        { 
            x: 292,
            y: 129,
            w: 68,
            h: 38
        },{ 
            x: 361,
            y: 129,
            w: 74,
            h: 38
        },{ 
            x: 436,
            y: 129,
            w: 77,
            h: 38
        }
    ],
    opponent : { 
        x: 222,
        y: 91,
        w: 69,
        h: 38
    },
    opponentL: [
        { 
            x: 154,
            y: 91,
            w: 68,
            h: 38
        },{ 
            x: 78,
            y: 91,
            w: 74,
            h: 38
        },{ 
            x: 0,
            y: 91,
            w: 77,
            h: 38
        }
    ],
    opponentR: [
        { 
            x: 292,
            y: 91,
            w: 68,
            h: 38
        },{ 
            x: 361,
            y: 91,
            w: 74,
            h: 38
        },{ 
            x: 436,
            y: 91,
            w: 77,
            h: 38
        }
    ],
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
    },
    menuBackground: {
    	x: 320,
    	y: 293,
    	w: 320,
    	h: 240
    },
    buttonL: {
    	x: 514,
    	y: 168,
    	w: 4,
    	h: 26
    }, 
	buttonM: {
    	x: 517,
    	y: 168,
    	w: 11,
    	h: 26
    },
    buttonR: {
    	x: 528,
    	y: 168,
    	w: 4,
    	h: 26
    },
    activeL: {
    	x: 512,
    	y: 199,
    	w: 6,
    	h: 30
    }, 
	activeM: {
    	x: 517,
    	y: 199,
    	w: 11,
    	h: 30
    },
    activeR: {
    	x: 528,
    	y: 199,
    	w: 6,
    	h: 30
    },
    focusL: {
    	x: 512,
    	y: 230,
    	w: 6,
    	h: 30
    }, 
	focusM: {
    	x: 517,
    	y: 230,
    	w: 11,
    	h: 30
    },
    focusR: {
    	x: 528,
    	y: 230,
    	w: 6,
    	h: 30
    },
    icons: {
    	
    }
}

data.sounds = {
    musics: {
        intro: "music/ashtom_pixel-rave_(low).mp3",
        race:  "music/ashtom_bit-stream_(low).mp3"
    }
};

data.menus = {
	main: {
		type: "standard",
		name: "Main Menu",
		description: "Play through a series\nof preselected races.",
		buttons: ["championship","timeattack"]
	},
	championship: {
		type: "standard",
		name: "Championship",
		icon: data.sprites.icons.cup,
		description: "Play through a series\nof preselected races.",
		buttons: ["championshipDifficulty","championshipStart"]
	},
	championshipDifficulty: {
		type: "multipleChoice",
		description: "Difficulty level.",
		choices: ["Easy", "Medium", "Hard"],
		selected: 1,
		active: 1
	},
	championshipStart: {
		type: "final",
		name: "Start",
		description: "Start championship."
	},
	timeattack: {
		type: "standard",
		name: "Time Attack",
		icon: data.sprites.icons.chrono,
		description: "Play one race against\nthe clock",
		buttons: ["random","custom"]
	},
	random: {
		type: "final",
		name: "Random track",
		icon: data.sprites.icons.interogation,
		description: "Race on a randomly\ngenerated track.",
		buttons: ["randomDifficulty","randomStart"]
	},
	randomDifficulty: {
		type: "multipleChoice",
		description: "Difficulty level.",
		choices: ["Easy", "Medium", "Hard"],
		selected: 1,
		active: 1
	},
	randomStart: {
		type: "final",
		name: "Start",
		description: "Start championship."
	},
	custom: {
		type: "standard",
		name: "Custom track",
		icon: data.sprites.icons.custom,
		description: "Configure you race\nin every details.",
		buttons: ["randomDifficulty"]
	}
};


data.render = {
    width: 320,
    height: 240,
    depthOfField: 150,
    camera_distance: 30,
    camera_height: 100
};
