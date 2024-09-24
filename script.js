/* TO-DO
--loading state (loads all textures first, build scene, choose options...)
--add listeners for arrow buttons also
-Clean up main loop calculations
--clean up and show option for fps
--listener for when tab becomes inactive, to stop mainloop
--have paused state - opacity overlay with continue button
-fullscreen
--pointer lock: https://www.html5rocks.com/en/tutorials/pointerlock/intro/
--touchscreen controls
--gyroscope/accelerometer support
--3d support, dual updating viewports
--real physics and velocity:
		  -jumping
  -when moving, velocity start slow and gain speed
--lighting
--shadows
--collision(horizontal and vertical[step up])
--infinite loading ground/sky
--texture maps
*/

var ball = [];
ball.y = 15;
ball.vy = 0;
ball.ay = 0;
ball.m = .45;    // Ball mass in kg
ball.r = 1;     // Ball radius in pixels.
ball.e = -0.4;   // Coefficient of restitution ("bounciness")
ball.rho = 1.2;  // Density of air. Try 1000 for water.
ball.C_d = 0.47; // Coeffecient of drag for a ball
ball.A = Math.PI * ball.r * ball.r / 15; // Frontal area of the ball; divided by 10000 to compensate for the 1px = 1cm relation


/* =======================START-SETUP======================= */
/* CONTROLS */
var keys = {};

/* ANIMATION */
var stopAnim = true, fallbackAnimInt = null;
var showFPS = true, lastTick = 0, fpsDisplay = "fps";
var animFrame = window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                null;

/* VIEW/CAMERA/WORLD */
var view = [];
view.height = 0;
view.width = 0;
view.vendor = {prefix:getBrowserVendor()};
view.vendor.style = {
  perspective:view.vendor.prefix.lowercase+"Perspective",
  transform:view.vendor.prefix.lowercase+"Transform",
  transformStyle:view.vendor.prefix.lowercase+"TransformStyle"};
view.port = "viewport";
view.camera = "camera";
view.world = "world";
view.perspective = 170;
view.dimensions = {height:7,length:1500,width:1500};
view.move = {x:0, y:0, z:0};
view.pan = {x:0, y:0, z:0};
view.pos = {x:0, y:0, z:0};
view.direction = {x:0, y:0, z:0, maxX:90, maxY:270, maxZ:180};
view.speed = {x:0, y:0, z:0, maxX:540, maxY:240, maxZ:720};
/* ========================END-SETUP======================== */

/* ==================START-EVENT-HANDLERS=================== */
/* LOAD-EVENT-LISTENER */
window.addEventListener("load", handleLoadEvent, false);

function handleLoadEvent(e){
  /*TEST*/
  ball.el = document.getElementById("ball");
  
  /* INITIAL-VIEW-SETUP */
  view.port = document.getElementById(view.port);
  view.camera = document.getElementById(view.camera);
  view.world = document.getElementById(view.world);
  fpsDisplay = document.getElementById(fpsDisplay);
  handleResizeEvent(e);
  view.pan.x = view.width / 2;
  view.pan.y = view.height / 2;
  view.pos.x = 0;
  view.pos.y = view.dimensions.height;
  view.pos.z = -3500;
  view.pos.x = -1500;
  
  /* ADD-EVENT-LISTENERS */
  window.addEventListener("resize", handleResizeEvent, false);
  window.addEventListener("mousemove", handleMouseMoveEvent, false);
  window.addEventListener("mousedown", handleMouseDownEvent, false);
  window.addEventListener("mouseup", handleMouseUpEvent, false);
  window.addEventListener("click", handleMouseClickEvent, false);
  window.addEventListener("dblclick", handleMouseDblClickEvent, false);
  window.addEventListener("mousewheel", handleMouseWheelEvent, false);
  window.addEventListener("wheel", handleMouseWheelEvent, false);
  window.addEventListener("contextmenu", handleContextMenu, false);
  window.addEventListener("keydown", handleKeyDownEvent, false);
  window.addEventListener("keyup", handleKeyUpEvent, false);
  
  if(window.ondeviceorientation !== undefined){
    window.addEventListener("deviceorientation", handleGyro, false);
  }
  
  /* START-ANIMATION-LOOP */
  stopAnim = false;
  startAnimation();
}

function handleResizeEvent(e){
  view.height = window.innerHeight;
  view.width = window.innerWidth;
}

function handleMouseMoveEvent(e){
  view.pan.x = e.clientX;
  view.pan.y = e.clientY;
  view.direction.x = (((view.pan.y / view.height) - 0.5) * 2) * -view.direction.maxX;
  view.direction.y = (((view.pan.x / view.width) - 0.5) * 2) * view.direction.maxY;
  view.direction.z = view.pan.z * view.direction.maxZ;
}

function handleMouseDownEvent(e){
  //console.log(e);
}

function handleMouseUpEvent(e){
  //console.log(e);
}

function handleMouseClickEvent(e){
  //console.log(e);
}

function handleMouseDblClickEvent(e){
  e.preventDefault();
  if(stopAnim){
    stopAnim = false;
    startAnimation();
  } else {
    stopAnimation();
  }
}

function handleMouseWheelEvent(e){
  e.preventDefault();
  var offset = 10;
  if(!stopAnim){
    view.perspective += ((e.wheelDelta / 120) * offset);
  }
  //SET PERSPECTIVE
  var finalPerspective = roundTwo(view.perspective) + "px";
  view.port.style[view.vendor.style.perspective] = finalPerspective;
  view.port.style.perspective = finalPerspective;
}

function handleContextMenu(e){
  e.preventDefault();
}

function handleKeyDownEvent(e){
  if(!stopAnim){
    var key = e.which;
    switch(key){
      case 87: //'w' UP
        if(!keys[key]){
          view.move.z = 1;
        }
        break;
      case 83: //'s' DOWN
        if(!keys[key]){
          view.move.z = -1;
        }
        break;
      case 65: //'a' LEFT
        if(!keys[key]){
          view.move.x = 1;
        }
        break;
      case 68: //'d' RIGHT
        if(!keys[key]){
          view.move.x = -1;
        }
        break;
      case 32: //'space'
        if(!keys[key]){
          if(keys[16]){
            view.move.y = -1;
          } else {
            view.move.y = 1;
          }
        }
        break;
      default:
        break;
    }
    keys[key] = true;
  }
}

function handleKeyUpEvent(e){
  var key = e.which;
  switch(key){
    case 87: //'w' UP
      view.move.z = 0;
      break;
    case 83: //'s' DOWN
      view.move.z = 0;
      break;
    case 65: //'a' LEFT
      view.move.x = 0;
      break;
    case 68: //'d' RIGHT
      view.move.x = 0;
      break;
    case 32: //'space'
        view.move.y = 0;
      break;
    default:
      break;
  }
  keys[key] = false;
}

function handleGyro(e){
  //view.direction.x = e.beta - 90;
  //view.direction.y = e.gamma * -1;
  //view.direction.z = e.alpha * -1;
}
/* ===================END-EVENT-HANDLERS=================== */

/* ===============START-ANIMATION-RENDERING=============== */
var recursiveAnim = function() {
	if(!stopAnim){
		mainLoop();
		animFrame(recursiveAnim);
	}
};

function startAnimation(){
  if(!stopAnim){
	  if(animFrame !== null) {	// start the mainloop with requestAnimationFrame
		  animFrame(recursiveAnim);
	  } else {					// start the mainloop with fallback setInterval
		  fallbackAnimInt = setInterval(mainLoop,(1000/60));
	  }
    lastTick = new Date().getTime();
  }
}

function stopAnimation(){
	stopAnim = true;
	if(fallbackAnimInt !== null){
		clearInterval(fallbackAnimInt);
	}
  lastTick = 0;
  calcFPS(showFPS);
}

function calcFPS(display){
  var tempTick = lastTick;
  var newTick = new Date().getTime();
  lastTick = newTick;
  var timeSince = +newTick - +tempTick;
  var frameRate = Math.round(1000/timeSince);
  if(display){
    fpsDisplay.style.display = "inline-block";
    fpsDisplay.innerHTML = frameRate; 
  }
  return timeSince/1000;
}

function mainLoop(){
  var timeDelta = calcFPS(showFPS);
  
  /* SET-CAMERA */
  var finalRotate = "translateZ(" + roundTwo(view.perspective) + "px) rotateX(" + roundTwo(view.direction.x) + "deg) rotateY(" + roundTwo(view.direction.y) + "deg) rotateZ(" + roundTwo(view.direction.z) + "deg)";
  view.camera.style[view.vendor.style.transform] = finalRotate;
  //view.camera.style.transform = finalRotate;
  
  /* SET-WORLD */
  if(view.speed.x != 0 || view.move.x != 0 || view.speed.y != 0 || view.move.y != 0 || view.speed.z != 0 || view.move.z != 0){
    view.speed.x = view.move.x * (view.speed.maxX * timeDelta);
    view.speed.y = view.move.y * (view.speed.maxY * timeDelta);
    view.speed.z = view.move.z * (view.speed.maxZ * timeDelta);
    view.pos.x += (Math.cos((view.direction.y) * Math.PI/180) * view.speed.x) - (Math.sin(view.direction.y * Math.PI/180) * view.speed.z);
    view.pos.y += (view.speed.y);
    view.pos.z += (Math.cos(view.direction.y * Math.PI/180) * view.speed.z) + (Math.sin((view.direction.y) * Math.PI/180) * view.speed.x);
    var finalTranslate = "translateX(" + roundTwo(view.pos.x) + "px) translateY(" + roundTwo(view.pos.y) + "px) translateZ(" + roundTwo(view.pos.z) + "px)";
    view.world.style[view.vendor.style.transform] = finalTranslate;
  }
  
  //Gravity Test
  var fy = 0;
    
    /* Weight force, which only affects the y-direction (because that's the direction gravity points). */
    fy += ball.m * 9.81;
    
    /* Air resistance force; this would affect both x- and y-directions, but we're only looking at the y-axis in this example. */
    fy += -1 * 0.5 * ball.rho * ball.C_d * ball.A * ball.vy * ball.vy;
    
    /* Verlet integration for the y-direction */
    ball.dy = ball.vy * timeDelta + (0.5 * ball.ay * timeDelta * timeDelta);
    /* The following line is because the math assumes meters but we're assuming 1 cm per pixel, so we need to scale the results */
    ball.y -= ball.dy * 393;
    ball.new_ay = fy / ball.m;
    ball.avg_ay = 0.5 * (ball.new_ay + ball.ay);
    ball.vy += ball.avg_ay * timeDelta;
  
    if(ball.y < 0){
      /* This is a simplification of impulse-momentum collision response. e should be a negative number, which will change the velocity's direction. */
        ball.vy *= ball.e; 
      ball.y = 0;
    }
    ball.el.style.webkitTransform = "translateZ(" + ball.y + "px)";
  //Gravity Test
}
/* ================END-ANIMATION-RENDERING================ */

/* ================START-HELPER-FUNCTIONS================= */
/* (AUG 7th 2014) FOUND AT: http://davidwalsh.name/vendor-prefix || w/Reference:https://github.com/x-tag/x-tag */
function getBrowserVendor(){
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  return {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
}

function roundTwo(num){
  return Math.round(num * 100) / 100;
}
/* ==================END-HELPER-FUNCTIONS================= */