/* Author: Dmitriy Sharko, Ukraine
 * Email : vakrot@gmail.com
 */

var mute = false;

var catch_point = false;
var selId = "";
var hitId = 0;

var point_size = 68;
var BORDER_WIDTH = 4;

var YX_RATIO = 1.5;
var XR_RATIO = 3;

var RADIUS = Math.floor(point_size/2);
var dX = RADIUS * XR_RATIO;
var dY = Math.floor(dX * YX_RATIO);
var SECURE_OFFSET = 100;

var diameter = 60;

var top_point = [SECURE_OFFSET, 0];

var points = [0];

var over_point = false;

var total_points = 0;
var MIN_LEVEL = 5;
var MAX_LEVEL = 10;
var LEVEL = 5;
var arr = [0];

var step_history = [];
var history_pointer = 0;

var coords = [];
var pStates = [];

var solutionArea = [];
var findSolutionMode = false;

/* find idx for points which include in solution area */
function findSolutions() {
	findSolutionMode = true;
	solutionArea.length = 0;

	/* get empty points */
	var Empty = document.getElementsByClassName("emptypoint");
	var Points = document.getElementsByClassName("point");
	
    for (var i = 0; i < Empty.length; ++i) {
		for (var j = 0; j < Points.length; ++j) {
			var src = Points[j].id;
			var dst = Empty[i].id;
			
			src = +src.substr(1, src.length);
			dst = +dst.substr(1, dst.length);
			
			if (checkLineSolution(+src, +dst)) {
				solutionArea.push(src);
			}
		}
	}
	console.log(solutionArea);
	findSolutionMode = false;
}


/* add point on form by XY coordinates */
function addPoint(id, x, y, D, style) {
    var point = document.createElement('div');
    point.id = "p" + id;
    point.className = style;
    setSize(point, D);
    setPosition(point, y, x);
    point.onmousedown = function(event) {
	getPoint(this.id, event);
    }

    point.onmouseover = function(event) {
	over_point = true;
    }
    point.onmouseout = function(event) {
	over_point = false;
    }
    document.body.appendChild(point);
}


function update_sizes(cl_width, diameter) {
    point_size = diameter + 2 * BORDER_WIDTH;
    RADIUS = Math.floor(point_size / 2);
    dX = RADIUS * XR_RATIO;
    dY = Math.floor(dX * YX_RATIO);
    top_point[1] = Math.floor(cl_width/2) - RADIUS;
}

function check_sizes(scr_width, scr_height) {
    var client_area = [scr_height - 2*SECURE_OFFSET, scr_width - 2*SECURE_OFFSET];
    var game_area = [dY * (LEVEL-1) + point_size,
		     dX * (LEVEL-1) * 2 + point_size];
		 
    top_point[1] = Math.floor(scr_width/2) - RADIUS;

    var bottom_left = [top_point[0] + (LEVEL-1)*dY + point_size, top_point[1] - (LEVEL-1)*dX];
    var bottom_right = [bottom_left[0], top_point[1] + (LEVEL-1)*dX + point_size]

    if ((game_area[0] <= client_area[0]) && (game_area[1] <= client_area[1]) &&
	    (bottom_left[1] >= SECURE_OFFSET) && 
	    (bottom_right[1] <= scr_width-SECURE_OFFSET) &&
	    (bottom_left[0] <= scr_height-SECURE_OFFSET))
	return true;
    else {
	return false;
    }
}

function calculate_sizes() {
    var scr_width = document.documentElement.clientWidth;
    var scr_height = document.documentElement.clientHeight;

    if (!check_sizes(scr_width, scr_height)) {

    var diams = [60, 55, 50, 45, 40, 35, 30, 25, 20];

	/* recalculate */
	for (var i = 0; i < diams.length; ++i) {
	    update_sizes(scr_width, diams[i]);
	    diameter = diams[i];
	    if (check_sizes(scr_width, scr_height))
		break;
	}
    }

    coords.length = 0;
    var Y = top_point[0];
    for (i = 1; i < LEVEL+1; ++i) {
	var X = top_point[1] - dX * (i-1);
	for (j = 1; j < i+1; ++j) {
	    coords.push([Y, X]);
	    X += 2*dX;
	}
	Y += dY;
    }
}

function ready() {
	if (localStorage.game) {
		loadFromStorage();
		buildPointsFromStorage();
	} else {
		buildPoints();
		saveToStorage("new");
	}
}

/* build points from local storage */
function buildPointsFromStorage() {
    var count = 0;
	calculate_sizes();

    /* add points on form */
    for (i = 1; i < LEVEL+1; ++i) {
		arr.push(LEVEL-i);
		for (j = 1; j < i+1; ++j) {
			count++;
			var style = (pStates[count-1]) ? "point" : "emptypoint";
			addPoint(count, coords[count-1][1], coords[count-1][0], diameter, style);
			var idx = [i, j];
			points.push(idx);
		}
    }
    total_points = count;
    findSolutions();
}



/* start when  document is loaded */
function buildPoints() {
    var count = 0;

    // top_point, diametr, dX, dY
    calculate_sizes();

    /* add points on form */
    for (i = 1; i < LEVEL+1; ++i) {
		arr.push(LEVEL-i);
		for (j = 1; j < i+1; ++j) {
			count++;
			addPoint(count, coords[count-1][1], coords[count-1][0], diameter, "point");
			var idx = [i, j];
			points.push(idx);
		}
    }
    
    total_points = count;
	setup_empty_point(count);
	findSolutions();
}

/* setup random empty point */
function setup_empty_point(count) {
    var emptyId = Math.floor((Math.random() * count) + 1);
    var emptyPoint = document.getElementById("p" + emptyId);
    emptyPoint.className = "emptypoint";
    return emptyId;
}



/* get point and prepare for transition */
function getPoint(id, e) {
    var point = document.getElementById(id);

    if (point.className == "point") {
	if (catch_point) {
		document.getElementById(selId).className = "point";
		document.body.removeChild(pp);
		catch_point = false;
		return;
	}

	var isSolution = false;
	var p = +(id.substr(1, id.length));
	if (-1 != solutionArea.indexOf(p)) {
		isSolution = true;
	}

	point.className = "emptypoint";
	var tmpPoint = document.createElement('div');
	tmpPoint.id = "pp";

	tmpPoint.className = "point";
	setSize(tmpPoint, diameter);
	tmpPoint.onclick = function() {
		document.getElementById(selId).className = "point";
		document.body.removeChild(tmpPoint);
		catch_point = false;
	}

	tmpPoint.onmouseover = function(event) {
		over_point = true;
	}
	tmpPoint.onmouseout = function(event) {
		over_point = false;
	}

	document.body.appendChild(tmpPoint);

	var left = point.style.left.substr(0, point.style.left.length-2);
	var top = point.style.top.substr(0, point.style.top.length-2);

	setPosition(tmpPoint, (+top - diameter/3), (+left - diameter/3));
	selId = id;

	if (isSolution) {
		catch_point = true;
	} else {
		window.setTimeout(function() { 
			document.getElementById(selId).className = "point";
			document.body.removeChild(pp);
			catch_point = false; }, 200);
	}
    } else {
	if (catch_point) {
	    var putPoint = document.getElementById(id);

	    var id1 = +(selId.substr(1));
	    var id2 = +(id.substr(1));

	    var result = checkLineSolution(id1, id2);
	    if (result) {
            var step = [id1, id2, hitId];
                if (document.getElementsByClassName("point").length == 1)
                    soundWin();

            if (history_pointer != step_history.length) {
                step_history.length = history_pointer;
            }

            step_history.push(step);
            history_pointer++;
            putPoint.className = "point";
            saveToStorage("step");
	    } else {
			document.getElementById(selId).className = "point";
	    }

	    document.body.removeChild(pp);
	    catch_point = false;
	    findSolutions();
	}
    }
}

/* check of logic solution */
function checkLineSolution (id_src, id_dst) {
    if (id_src == id_dst) return;

    var idx_src = points[id_src];
    var idx_dst = points[id_dst];
    var transaction = false;

    /* horizontal */
    if (idx_src[0] == idx_dst[0]) {
	/* check distance */
	if (3 == (Math.abs(idx_src[1] - idx_dst[1]) + 1))  {
	    /* check point on empty status between src and dst */
	    var id = (id_src + id_dst) / 2;
	    transaction = hitPoint(id);
	}
    }
    /* right diagonal */
    else if (idx_src[1] == idx_dst[1]) {
	/* check distance */
	if (3 == (Math.abs(idx_src[0] - idx_dst[0]) + 1)) {
	    var idx_row = (idx_src[0] + idx_dst[0]) / 2;

	    var reduce = 0;
	    for (var i = 0; i < idx_row; ++i)
		reduce += arr[i];
	    /* check point on empty status between src and dst */
	    var id = (idx_row - 1)*LEVEL + idx_src[1] - reduce;
	    transaction = hitPoint(id);
	}
    }
    /* left diagonal */
    else if ((idx_src[0] - idx_dst[0]) == (idx_src[1] - idx_dst[1])) {
	/* check distance */
	if ( (3 == (Math.abs(idx_src[1] - idx_dst[1]) + 1)) && 
		(3 == (Math.abs(idx_src[0] - idx_dst[0]) + 1)) ) {

	    /* check point on empty status between src and dst */
	    var id_x = (idx_src[0] + idx_dst[0]) / 2;
	    var id_y = (idx_src[1] + idx_dst[1]) / 2;

	    var reduce = 0;
	    for (var i = 0; i < id_x; ++i)
		reduce += arr[i];
	    /* check point on empty status between src and dst */
	    var id = (id_x - 1)*LEVEL + id_y - reduce;
	    transaction = hitPoint(id);
	}
    }
    else {
	/* Not correct transition */
    }
    return transaction;
}


function hitPoint(id) {
    var res = false;
    var point = document.getElementById("p" + id);
	
	if (findSolutionMode && (point.className == "point")) {
		res = true;
	} else if (point.className == "point") {
		point.className = "emptypoint";
		hitId = id;
		res = true;
		soundHit();
		document.getElementById('undo').innerHTML = "<img src=\"img/undo.png\">";
	}

    return res;
}


function setSize(elem, d) {
    elem.style.width = elem.style.height = d + "px";
}

function setPosition(elem, top, left) {
    elem.style.top = top + "px";
    elem.style.left = left + "px";
}


/* Reset game when finished or required by user */
function refresh() {
    step_history.length = 0;
    history_pointer = 0;
    for (var i = 1; i < total_points+1; ++i) {
	var point = document.getElementById("p"+i);
	point.className = "point";
    }
    setup_empty_point(total_points);
    saveToStorage("refresh");

    document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
    document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
}


/* Change level of game */
function levelUpDown(action) {
    /* define type of action */
    if ("up" == action) {
	if (LEVEL == MAX_LEVEL) return;
	LEVEL++;
    } else {
	if (LEVEL == MIN_LEVEL) return;
	LEVEL--;
	update_sizes(document.documentElement.clientWidth, 1000);
    }

    /* remove old points */
    for (var i = 1; i < total_points+1; ++i) {
	var point = document.getElementById("p"+i);
	document.body.removeChild(point);
    }
    
    /* reset relate arrays and variables */
    arr.length = 1;
    points.length = 1;
    step_history.length = 0;
    history_pointer = 0;

    /* recreate points */
    buildPoints();
    saveToStorage("level");
    document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
    document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
}

/* Forward or backward step in history list */
function UndoRedo(action) {
    if (step_history.length == 0) return;
    if (catch_point) {
	document.getElementById(selId).className = "point";
	document.body.removeChild(pp);
	catch_point = false;
    }

    if ("undo" == action) {
	if (history_pointer != 0) {
	    history_pointer--;
	
	    var step = step_history[history_pointer];
	    document.getElementById("p" + step[0]).className ="point";
	    document.getElementById("p" + step[2]).className = "point";
	    document.getElementById("p" + step[1]).className = "emptypoint";

	    document.getElementById('redo').innerHTML = "<img src=\"img/redo.png\">";

	    if (history_pointer == 0) {
		document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
	    }
	    soundHit();
	}

    } else {
	if (history_pointer != step_history.length) {
	    var step = step_history[history_pointer];
	    document.getElementById("p" + step[0]).className = "emptypoint";
	    document.getElementById("p" + step[2]).className = "emptypoint";
	    document.getElementById("p" + step[1]).className = "point";
	    document.getElementById('undo').innerHTML = "<img src=\"img/undo.png\">";
	    history_pointer++;

	    if (history_pointer == step_history.length)
		document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
		
	    soundHit();

	} else {
	    document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
	}

    }
    
    saveToStorage("history");
    findSolutions();
}

function soundHit() {
    if (mute) return;
    var hit = new Audio();
    hit.src = "audio/hit.wav";
    hit.autoplay = true;
}

function soundWin() {
    if (mute) return;
    var win = new Audio();
    win.src = "audio/win.mp3";
    win.autoplay = true;
}

document.onclick = function() {
    if (catch_point) {
	if (!over_point) {
	    catch_point = false;
	    document.getElementById(selId).className = "point";
	    document.body.removeChild(pp);
	}
    }
}

document.onwheel = function(event) {
    var direction = event.deltaY / Math.abs(event.deltaY);
    // 1 - forward, -1 - backward
    if (direction == 1) {
	UndoRedo("redo");
    } else if (direction == -1) {
	UndoRedo("undo");
    }
}

function redraw() {
    for (var i = 1; i < total_points+1; ++i) {
	var point = document.getElementById("p"+i);
	setSize(point, diameter);
	setPosition(point, coords[i-1][0], coords[i-1][1]);
    }

	tmpPoint = document.getElementById("pp");
    if (tmpPoint) {
        var selPoint = document.getElementById(selId);
        setSize(pp, diameter);
        var left = selPoint.style.left.substr(0, selPoint.style.left.length-2);
        var top = selPoint.style.top.substr(0, selPoint.style.top.length-2);
        setPosition(pp, (+top - diameter/3), (+left - diameter/3));
    }
}

var resize = function(e){
    coords.length = 0;
    update_sizes(document.documentElement.clientWidth, 1000);
    calculate_sizes();
    redraw();
};

(function(){
    var time;
    window.onresize = function(e){
	if (time)
	    clearTimeout(time);
	time = setTimeout(function(){resize(e);}, 100);
    }
})();

/* create points when document will be loaded */
document.addEventListener("DOMContentLoaded", ready);


/*********************************************************************/

/* create log file of game and save it */
function saveGame() {
	if (step_history.length) {
		var text = '';
		text += LEVEL + '\n';
		
		for (var i = 0; i < step_history.length; ++i)
			text += step_history[i] + '\n';
		
		var el = document.createElement('a');
		el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		el.setAttribute('download', "game.txt");

		el.style.display = 'none';
		document.body.appendChild(el);

		el.click();
		document.body.removeChild(el);
	}
}

/* load game */
function loadGame() {
	var inputElement = document.createElement("input");	
	inputElement.setAttribute("type", "file");
	
	inputElement.onchange = function() {
		var fileList = this.files;
		var textFile = fileList[0];

        if (textFile.type == 'text/plain') {
            var reader = new FileReader();
            reader.onloadend = function(event) {
                var text = event.target.result;
				/* parse text and fill step_history */
				var data = text.split('\n');

				/* setup LEVEL */
				var isRebuild  = (LEVEL != +data[0]) ? true : false;
				LEVEL = +data[0];
				
				step_history.length = 0;
				history_pointer = 0;

				for (var i = 1; i < data.length; ++i) {
					var step = data[i].split(',');
					if (step != "") {
						step_history.push([+step[0], +step[1], +step[2]]);
					}
				}
				var emptyId = +(data[1].split(',')[1]);

				/* rebuild points */
				if (isRebuild) {
					for (var i = 1; i < total_points+1; ++i) {
						var point = document.getElementById("p"+i);
						document.body.removeChild(point);
					}
				
					arr.length = 1;
					points.length = 1;
					update_sizes(document.documentElement.clientWidth, 1000);
					buildPoints();
					
					document.getElementsByClassName("emptypoint")[0].className = "point";
				} else {
					for (var i = 1; i < total_points+1; ++i) {
						var point = document.getElementById("p"+i);
						point.className = "point";
					}
				}

				document.getElementById("p"+emptyId).className = "emptypoint";
				document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
				document.getElementById('redo').innerHTML = "<img src=\"img/redo.png\">";
				
				saveToStorage("load");
            };
            reader.onerror = function() {
                alert('Error reading file');
            };
            
            reader.readAsText(textFile);
        } else {
            alert('It\'s not a text file');
        }
    };
    
    inputElement.click();
}


/* setup audio mode */
function muteOnOff() {
	mute = !mute;
	var icon = "<img src=\"img/audio_enable.png\">";
	if (mute) {
		icon = "<img src=\"img/audio_disable.png\">";
	}
	document.getElementById('audio').innerHTML = icon;
}

/* save game state in local Storge */
function saveToStorage(action) {
	var points_state = [];

	for (var i = 1; i < total_points+1; ++i) {
		if (document.getElementById("p"+i).className == "point") {
			points_state.push(1);
		} else {
			points_state.push(0);
		}
	}
	
    var game = { "action": action, "level": LEVEL, "hp": history_pointer, "story": step_history, "points": points_state };
    var sObj = JSON.stringify(game)
    localStorage.setItem("game", sObj);
    savedInStorage = true;
}

/* load last state of game from local Storage */
function loadFromStorage() {
	var game = JSON.parse(localStorage.getItem("game"));
	LEVEL = game.level;
	history_pointer = game.hp;
	step_history = JSON.parse(JSON.stringify(game.story));
	pStates = JSON.parse(JSON.stringify(game.points));
	
	if (history_pointer == 0 && step_history.length == 0) {
		document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
		document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
	} else if (history_pointer == 0) {
		document.getElementById('undo').innerHTML = "<img src=\"img/nundo.png\">";
		document.getElementById('redo').innerHTML = "<img src=\"img/redo.png\">";
	} else if (history_pointer != step_history.length) {
		document.getElementById('undo').innerHTML = "<img src=\"img/undo.png\">";
		document.getElementById('redo').innerHTML = "<img src=\"img/redo.png\">";
	} else {
		document.getElementById('undo').innerHTML = "<img src=\"img/undo.png\">";
		document.getElementById('redo').innerHTML = "<img src=\"img/nredo.png\">";
	}
}
