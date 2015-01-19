colors = {canvas:       "#d3e3a8",
          snake:        "#000000",
          wall:         "#9b0992",
          edible_block: "#f84a14"};

number_of_top_blocks  = 30;
number_of_side_blocks = 15;
edible_block_minimum_distance_in_fraction_of_canvas_height = 0.1;

canvas = document.getElementById("canvas");
context = canvas.getContext("2d");
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

move_buffer = [];
start_time = new Date().getTime();

wall_blocks = [];
wall_block_width = canvas.width / number_of_top_blocks;
wall_block_height = canvas.height / number_of_side_blocks;

function random_number(begining_of_range_inclusive, end_of_range_inclusive) {
    return Math.floor((Math.random()
        * (end_of_range_inclusive - begining_of_range_inclusive + 1)) 
        + begining_of_range_inclusive);
}

function get_coordinates(block) {
    return {upper_left:  {x: block.x              , y: block.y               },
            upper_right: {x: block.x + block.width, y: block.y               },
            lower_left:  {x: block.x              , y: block.y +  block.width},
            lower_right: {x: block.x + block.width, y: block.y +  block.width}};
}

function create_wall_block(x, y) {
    return {x:         x, 
            y:         y, 
            width:     wall_block_width,
            height:    wall_block_height,
            color:     colors.wall};
}

function create_wall(start, end, x_function, y_function) {
    for(i = start; i < end; i++) {
        wall_blocks.push(create_wall_block(x_function(i), y_function(i)));
    }
}

create_wall(0,
            number_of_top_blocks,
            function(i) { return i * wall_block_width},
            function(i) { return 0 });
create_wall(0,
            number_of_top_blocks,
            function(i) { return i * wall_block_width},
            function(i) { return canvas.height - wall_block_height });
create_wall(1,
            canvas.height/wall_block_height - 1,
            function(i) { return 0},
            function(i) { return i * wall_block_height });
create_wall(1,
            canvas.height/wall_block_height - 1,
            function(i) { return canvas.width - wall_block_width},
            function(i) { return i * wall_block_height });

snake = {x:         canvas.width  / 2, 
         y:         canvas.height / 2, 
         direction: "right",
         width:     canvas.width / 40,
         height:    canvas.width / 40,
         speed:     200 / canvas.width,
         color:     colors.snake};

function create_edible_block() {
    minimum_distance = edible_block_minimum_distance_in_fraction_of_canvas_height * canvas.height;
    width_height = canvas.width / 40;
    return {x:         random_number(wall_block_width + minimum_distance,
                                     canvas.width
                                     - wall_block_width
                                     - width_height
                                     - minimum_distance),
            y:         random_number(wall_block_height + minimum_distance,
                                     canvas.height
                                     - wall_block_height
                                     - width_height
                                     - minimum_distance),
            width:     width_height,
            height:    width_height,
            color:     colors.edible_block};
}

edible_block = create_edible_block();

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

function collision(block1, block2) {
    block1_coordinates = get_coordinates(block1);
    block2_coordinates = get_coordinates(block2);
    for(coordinate in block1_coordinates) {
        if(block1_coordinates[coordinate].x > block2_coordinates.upper_left.x  &&
           block1_coordinates[coordinate].x < block2_coordinates.upper_right.x &&
           block1_coordinates[coordinate].y > block2_coordinates.upper_left.y  &&
           block1_coordinates[coordinate].y < block2_coordinates.lower_left.y) {
            return true;
        }
    }
    return false;
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

function restart_game() {
    edible_block = create_edible_block();
    snake = {x:         canvas.width  / 2, 
             y:         canvas.height / 2, 
             direction: "right",
             width:     canvas.width / 40,
             height:    canvas.width / 40,
             speed:     200 / canvas.width,
             color:     colors.snake};
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
    wall_blocks.forEach(function(wall_block) {
        if(collision(snake, wall_block)) {
            restart_game();
        }
    });
}

function draw_snake() {
    context.fillStyle = snake.color;
    context.fillRect(snake.x, snake.y, snake.width, snake.width);
}

function draw_edible_block() {
    context.fillStyle = edible_block.color;
    context.fillRect(edible_block.x, edible_block.y, edible_block.width, edible_block.width);
}

(function draw_next_frame() {
    blank_out_canvas();
    draw_wall();
    draw_edible_block();
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
