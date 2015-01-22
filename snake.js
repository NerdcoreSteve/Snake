colors = {canvas:       "#d3e3a8",
          snake:        "#000000",
          wall:         "#9b0992",
          edible_block: "#f84a14"};

number_of_top_blocks  = 30;
number_of_side_blocks = 15;
edible_block_minimum_distance_in_fraction_of_canvas_height = 0.3;

canvas = document.getElementById("canvas");
context = canvas.getContext("2d");
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

move_buffer = [];
start_time = new Date().getTime();

wall_blocks = [];
wall_block_width = canvas.width / number_of_top_blocks;
wall_block_height = canvas.height / number_of_side_blocks;

initial_snake_speed = 200 / canvas.width;

function random_number(begining_of_range_inclusive, end_of_range_inclusive) {
    return Math.floor((Math.random()
        * (end_of_range_inclusive - begining_of_range_inclusive + 1)) 
        + begining_of_range_inclusive);
}

function get_coordinates(block) {
    return {upper_left:  {x: block.x              , y: block.y                },
            upper_right: {x: block.x + block.width, y: block.y                },
            lower_left:  {x: block.x              , y: block.y +  block.height},
            lower_right: {x: block.x + block.width, y: block.y +  block.height}};
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

function create_snake_segment(x, y, width, height, direction) {
    return {x:         x, 
            y:         y, 
            width:     width,
            height:    height,
            direction: direction};
}

function create_snake(x, y, direction, head_width, speed, color) {
    return {speed: speed,
            color: color,
            head_width: head_width,
            segments: [create_snake_segment(x,
                                            y,
                                            head_width * 2,
                                            head_width,
                                            direction)]};
}

snake = create_snake(canvas.width  / 2,
                     canvas.height / 2,
                     "right",
                     canvas.width / 40,
                     initial_snake_speed,
                     colors.snake);

function create_edible_block() {
    width_height = canvas.width / 40;

    upper_left_x  = wall_block_width;
    upper_left_y  = wall_block_width;
    lower_right_x = canvas.width  - wall_block_width  - width_height;
    lower_right_y = canvas.height - wall_block_height - width_height;

    //TODO should be calculated with a function that takes a fraction
    //     use width or height, whichever is shortest
    minimum_distance = edible_block_minimum_distance_in_fraction_of_canvas_height * canvas.height;

    x = 0;
    y = 0;
    good_spot = false;
    while(!good_spot) {
        x = random_number(upper_left_x, lower_right_x);
        y = random_number(upper_left_y, lower_right_y);
        if(x > upper_left_x + minimum_distance && x < lower_right_x - minimum_distance &&
           y > upper_left_y + minimum_distance && y < lower_right_y - minimum_distance &&
           (x < snake.segments[0].x + minimum_distance ||
            x > snake.segments[0].x + snake.segments[0].width + minimum_distance) &&
           (y < snake.segments[0].y + minimum_distance ||
            y > snake.segments[0].y + snake.segments[0].height + minimum_distance)) {
            good_spot = true;
        }
    }

    return {x:      x,
            y:      y,
            width:  width_height,
            height: width_height,
            color:  colors.edible_block};
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

//TODO head_or_tail ought to be an enum
function move_snake_segment(snake_segment, head_or_tail, traversed_distance) {
    if(snake_segment.direction == "up") {
        if(head_or_tail == "head") {
            snake_segment.y -= traversed_distance;
            snake_segment.height += traversed_distance;
        } else if(head_or_tail == "both") {
            snake_segment.y -= traversed_distance;
        } else {
            snake_segment.height -= traversed_distance;
        }
    } else if(snake_segment.direction == "down") {
        if(head_or_tail == "head") {
            snake_segment.height += traversed_distance;
        } else if(head_or_tail == "both") {
            snake_segment.y += traversed_distance;
        } else {
            snake_segment.height += traversed_distance;
        }
    } else if(snake_segment.direction == "left") {
        if(head_or_tail == "head") {
            snake_segment.x -= traversed_distance;
            snake_segment.width += traversed_distance;
        } else {
            snake_segment.width -= traversed_distance;
        }
    } else if(snake_segment.direction == "right") {
        if(head_or_tail == "head") {
            snake_segment.width += traversed_distance;
        } else if(head_or_tail == "both") {
            snake_segment.x += traversed_distance;
        } else {
            snake_segment.x += traversed_distance;
            snake_segment.width -= traversed_distance;
        }
    }
}

//TODO this function should be called start_game and should be called before the main loop
function restart_game() {
    edible_block = create_edible_block();
    snake = create_snake(canvas.width  / 2,
                         canvas.height / 2,
                         "right",
                         canvas.width / 40,
                         initial_snake_speed,
                         colors.snake);
}

function next_level() {
    edible_block = create_edible_block();
    snake.speed += 0.1 * initial_snake_speed;
}

function move_snake_head_and_tail(snake, time) {
    traversed_distance = (time - start_time) * snake.speed;
    if(snake.segments.length > 1) {
        move_snake_segment(snake.segments[0],
                           "head",
                           traversed_distance);
        move_snake_segment(snake.segments[snake.segments.length - 1],
                           "tail",
                           traversed_distance);
        if(snake.segments[snake.segments.length - 1].width <= 0 ||
           snake.segments[snake.segments.length - 1].height <= 0) {
            snake.segments.pop();
        }
    } else {
        move_snake_segment(snake.segments[0],
                           "both",
                           traversed_distance);
    }
    start_time = time;
}

function move_snake() {
    opposite = {"left" : "right",
                "right": "left",
                "up"   : "down",
                "down" : "up"};

    move_buffer.unshift({direction: snake.segments[0].direction, time: new Date().getTime()});

    move_buffer.forEach(function(move) {
        if(move.direction != opposite[snake.segments[0].direction] &&
           move.direction != snake.segments[0].direction) {
            x = snake.segments[0].x;
            y = snake.segments[0].y;
            if(snake.segments[0].direction == "right") {
                x = snake.segments[0].x + snake.segments[0].width - snake.head_width;
            }
            snake.segments.unshift(create_snake_segment(x,
                                                        y,
                                                        snake.head_width,
                                                        snake.head_width,
                                                        move.direction));
        }
        move_snake_head_and_tail(snake, move.time);
    });
    move_buffer = [];

/*
    if(collision(edible_block, snake.segments[0])) {
        next_level();
    }

    wall_blocks.forEach(function(wall_block) {
        if(collision(snake.segments[0], wall_block)) {
            restart_game();
        }
    });
*/
}

function draw_snake() {
    context.fillStyle = snake.color;
    snake.segments.forEach(function(segment) {
        context.fillRect(segment.x, segment.y, segment.width, segment.height);
    });
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
        move_buffer.unshift({direction: "up", time: new Date().getTime()});
    } else if(e.keyCode == '40') {
        move_buffer.unshift({direction: "down", time: new Date().getTime()});
    } else if(e.keyCode == '37') {
        move_buffer.unshift({direction: "left", time: new Date().getTime()});
    } else if(e.keyCode == '39') {
        move_buffer.unshift({direction: "right", time: new Date().getTime()});
    }
}
