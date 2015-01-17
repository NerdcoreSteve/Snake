colors = {canvas: "#d3e3a8",
          snake:  "#000000"};

canvas = document.getElementById("canvas");
context = canvas.getContext("2d");
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

move_buffer = [];
start_time = new Date().getTime();

snake = {x:         0, 
         y:         0, 
         direction: "down",
         width:     canvas.width / 30,
         speed:     200 / canvas.width,
         color:     colors.snake};

function blank_out_canvas() {
    context.fillStyle = colors.canvas;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function move_snake_segment(time) {
    traversed_distance = (time - start_time) * snake.speed;
    if(snake.direction == "up") {
        snake.y -= traversed_distance;
    } else if(snake.direction == "down") {
        snake.y += traversed_distance;
    } else if(snake.direction == "left") {
        snake.x -= traversed_distance;
    } else if(snake.direction == "right") {
        snake.x += traversed_distance;
    }
    start_time = time;
}

function move_snake() {
    opposite = {"left" : "right",
                "right": "left",
                "up"   : "down",
                "down" : "up"};

    if(move_buffer.length == 0) {
        move_snake_segment(new Date().getTime());
    } else {
        move_buffer.forEach(function(move) {
            if(move.direction != opposite[snake.direction]) {
                snake.direction = move.direction;
            }
            move_snake_segment(move.time);
        });
        move_buffer = [];
    }
}

function draw_snake() {
    context.fillStyle = snake.color;
    context.fillRect(snake.x, snake.y, snake.width, snake.width);
}

(function draw_next_frame() {
    blank_out_canvas();
    move_snake();
    draw_snake();
    requestAnimationFrame(draw_next_frame);
})();

window.onkeydown = function(e) {
    e = e || window.event;
    if(e.keyCode == '38') {
        move_buffer.push({direction: "up", time: new Date().getTime()});
    } else if(e.keyCode == '40') {
        move_buffer.push({direction: "down", time: new Date().getTime()});
    } else if(e.keyCode == '37') {
        move_buffer.push({direction: "left", time: new Date().getTime()});
    } else if(e.keyCode == '39') {
        move_buffer.push({direction: "right", time: new Date().getTime()});
    }
}
