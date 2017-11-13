var actorChars = {
  '@': Player,
  'o': Coin,
  'd': Jewel
};

function Level(plan) {
  this.width = plan[0].length;

  this.height = plan.length;

  this.grid = [];
  this.actors = [];

  for (var y = 0; y < this.height; y++) {
    var line = plan[y],
      gridLine = [];

    for (var x = 0; x < this.width; x++) {


      var ch = line[x],
        fieldType = null;

      var Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == "x")
        fieldType = "wall";
      else if (ch == "!")
        fieldType = "lava";
      else if (ch == "y")
        fieldType = "floater";

      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }
  this.player = this.actors.filter(function (actor) {
    return actor.type == "player";
  })[0];
}

function Jewel(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1))
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
}


function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;

}
Jewel.prototype.type = 'jewel'
Coin.prototype.type = 'coin';
Player.prototype.type = 'player';



function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.plus = function (other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.times = function (factor) {
  return new Vector(this.x * factor, this.y * factor);
};

function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;
  this.wrap.appendChild(this.drawBackground());

  this.actorLayer = null;

  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function () {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";

  this.level.grid.forEach(function (row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function (type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

DOMDisplay.prototype.drawActors = function () {
  var wrap = elt("div");

  this.level.actors.forEach(function (actor) {
    var rect = wrap.appendChild(elt("div",
      "actor " + actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function () {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function () {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;

  var margin = width / 3;

  var left = this.wrap.scrollLeft,
    right = left + width;

  var top = this.wrap.scrollTop,
    bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
    .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

Level.prototype.obstacleAt = function (pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0 || yEnd > this.height)
    return "wall";

  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) {
        return fieldType;
      }
    }
  }
};
Level.prototype.actorAt = function (actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
      actor.pos.x + actor.size.x > other.pos.x &&
      actor.pos.x < other.pos.x + other.size.x &&
      actor.pos.y + actor.size.y > other.pos.y &&
      actor.pos.y < other.pos.y + other.size.y)
      return other;
  }
};
Level.prototype.animate = function (step, keys) {

  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function (actor) {
      actor.act(thisStep, this, keys);
    }, this);


    step -= thisStep;
  }
};
var wobbleSpeed = 8;
var wobbleDist = 0.07;
Coin.prototype.act = function (step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

Jewel.prototype.act = function (step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
}

var maxStep = 0.05;

var playerXSpeed = 7;

Player.prototype.moveX = function (step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle != "wall")
    if (obstacle != "floater")

      this.pos = newPos;
};

var gravity = 35;
var jumpSpeed = 18;
var playerYSpeed = 7;

Player.prototype.moveY = function (step, level, keys) {
  this.speed.y += step * gravity;
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle) {
    if (keys.up && this.speed.y > 0)
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0;
  } else {
    this.pos = newPos;
  }

  if (obstacle == "lava") {
    this.pos = new Vector(6, 8)

  }
};
Player.prototype.act = function (step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);

  var otherActor = level.actorAt(this);
  if (otherActor)
    level.playerTouched(otherActor.type, otherActor);


};

Level.prototype.playerTouched = function (type, actor) {
  if (type == 'coin') {
    this.actors = this.actors.filter(function (other) {
      return other != actor;
    });
  } else if (type == 'jewel') {
    this.actors = this.actors.filter(function (other) {
      return other != actor;
    });
  }
};


var arrowCodes = {
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};


function trackKeys(codes) {
  var pressed = Object.create(null);


  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;

  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

var arrows = trackKeys(arrowCodes);

function runLevel(level, Display) {
  var display = new Display(document.body, level);

  runAnimation(function (step) {
    level.animate(step, arrows);
    display.drawFrame(step);
  });
}

function runGame(plans, Display) {
  function startLevel(n) {
    runLevel(new Level(plans[n]), Display);
  }
  startLevel(0);
}