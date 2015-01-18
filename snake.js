colors = {canvas: "#d3e3a8",
          snake:  "#000000",
          wall:   "#9b0992"};

canvas = document.getElementById("canvas");
context = canvas.getContext("2d");
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

move_buffer = [];
start_time = new Date().getTime();


wall_block_width = canvas.width / 30;
wall_block_height = canvas.height / 30;
wall_blocks = [];
for(i = 0; i < canvas.width/wall_block_width; i++) {
    wall_blocks.push({x:         i * (wall_block_width), 
                      y:         0, 
                      width:     wall_block_width,
                      height:    wall_block_height,
                      color:     colors.wall});
}
for(i = 0; i < canvas.width/wall_block_width; i++) {
    wall_blocks.push({x:         i * (wall_block_width), 
                      y:         canvas.height - wall_block_width, 
                      width:     wall_block_width,
                      height:    wall_block_height,
                      color:     colors.wall});
}
for(i = 1; i < canvas.height/wall_block_height - 2; i++) {
    wall_blocks.push({x:         0, 
                      y:         i * (wall_block_height), 
                      width:     wall_block_width,
                      height:    wall_block_height,
                      color:     colors.wall});
}

snake = {x:         canvas.width  / 2, 
         y:         canvas.height / 2, 
         direction: "right",
         width:     canvas.width / 40,
         speed:     200 / canvas.width,
         color:     colors.snake};

function blank_out_canvas() {
    context.fillStyle = colors.canvas;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function draw_wall() {
    wall_blocks.forEach(function(wall_block) {
        context.fillStyle = wall_block.color;
        context.fillRect(wall_block.x, wall_block.y, wall_block.width, wall_block.height);
    });
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
    draw_wall();
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
