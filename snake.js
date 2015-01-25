require(['underscore-min'], function() {
    colors = {canvas:       "#d3e3a8",
              snake:        "#000000",
              wall:         "#000000",
              edible_block: "#000000"};

    number_of_top_blocks  = 30;
    number_of_side_blocks = 15;
    edible_block_minimal_fractional_distance_from_snake_head = 0.3;
    edible_block_minimal_fractional_distance_from_walls = 0.1;

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    context.canvas.width  = window.innerWidth;
    context.canvas.height = window.innerHeight;

    move_buffer = [];
    start_time = new Date().getTime();

    walls = [];
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
            walls.push(create_wall_block(x_function(i), y_function(i)));
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
        length = head_width * 2;
        return {speed: speed,
                color: color,
                head_width: head_width,
                length: length,
                segments: [create_snake_segment(x,
                                                y,
                                                length,
                                                head_width,
                                                direction)]};
    }

    function collision_with_snake(rectangle) {
        return _.some(_.map(snake.segments,
                            function(segment) { return collision(segment, rectangle); }));
    }

    snake = create_snake(canvas.width  / 2,
                         canvas.height / 2,
                         "right",
                         canvas.width / 40,
                         initial_snake_speed,
                         colors.snake);

    function block_is_far_enough_from_snake(block, snake, minimal_fractional_distance) {
        minimum_distance = edible_block_minimal_fractional_distance_from_snake_head * canvas.height;
        snake_head = _.first(snake.segments)
        return Math.abs(block.x - snake_head.x) >= minimum_distance &&
               Math.abs(block.y - snake_head.y) >= minimum_distance;
    }

    function create_edible_block() {
        width_height = canvas.width / 40;

        upper_left_x  = wall_block_width;
        upper_left_y  = wall_block_width;
        lower_right_x = canvas.width  - wall_block_width  - width_height;
        lower_right_y = canvas.height - wall_block_height - width_height;

        //TODO should be calculated with a function that takes a fraction
        //     use width or height, whichever is shortest
        //edible_block_minimum_distance_in_fraction_of_canvas_height
        minimum_distance_from_walls = edible_block_minimal_fractional_distance_from_walls
                                      * canvas.height;

        x = 0;
        y = 0;
        good_spot = false;
        while(!good_spot) {
            x = random_number(upper_left_x, lower_right_x);
            y = random_number(upper_left_y, lower_right_y);
            block = {x: x, y: y, width: width_height, height: width_height};
            if(x > upper_left_x + minimum_distance_from_walls  &&
               x < lower_right_x - minimum_distance_from_walls &&
               y > upper_left_y + minimum_distance_from_walls  &&
               y < lower_right_y - minimum_distance_from_walls &&
               block_is_far_enough_from_snake(block, snake,
                                              edible_block_minimal_fractional_distance_from_snake_head
                                                  * canvas.height) &&
               !collision_with_snake(block)) {
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
        _.each(walls, function(wall_block) {
            context.fillStyle = wall_block.color;
            context.fillRect(wall_block.x, wall_block.y, wall_block.width, wall_block.height);
        });
    }

    function collision(block1, block2) {
        function first_in_second(block1_coordinates, block2_coordinates) {
            return _.some(_.map(_.values(block1_coordinates),
                                function(block1_coordinate) {
                                    return block1_coordinate.x >= block2_coordinates.upper_left.x  &&
                                           block1_coordinate.x <= block2_coordinates.upper_right.x &&
                                           block1_coordinate.y >= block2_coordinates.upper_left.y  &&
                                           block1_coordinate.y <= block2_coordinates.lower_left.y;
                                }));
        }

        block1_coordinates = get_coordinates(block1);
        block2_coordinates = get_coordinates(block2);

        return first_in_second(block1_coordinates, block2_coordinates) ||
               first_in_second(block2_coordinates, block1_coordinates);
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
        snake.length += snake.head_width;
    }

    function move_head(snake, distance) {
        snake_head = snake.segments[0];
        if(snake_head.direction == "up") {
            snake_head.y -= distance;
            snake_head.height += distance;
        } else if(snake_head.direction == "down") {
            snake_head.height += distance;
        } else if(snake_head.direction == "left") {
            snake_head.x -= distance;
            snake_head.width += distance;
        } else if(snake_head.direction == "right") {
            snake_head.width += distance;
        }
    }

    function get_snake_length(snake) {
        snake_length = 0;
        snake.segments.forEach(function(segment) {
            function length(segment) {
                if(segment.direction == "left" || segment.direction == "right") {
                    return segment.width;
                } else {
                    return segment.height;
                }
            }
            snake_length += length(segment);
        });
        snake_length -= snake.head_width * (snake.segments.length - 1);
        return snake_length;
    }

    function shrink_tail(snake, amount) { 
        snake_tail = snake.segments[snake.segments.length - 1];
        if(snake_tail.direction == "up") {
            snake_tail.height -= amount;
        } else if(snake_tail.direction == "down") {
            snake_tail.y += amount;
            snake_tail.height -= amount;
        } else if(snake_tail.direction == "left") {
            snake_tail.width -= amount;
        } else if(snake_tail.direction == "right") {
            snake_tail.x += amount;
            snake_tail.width -= amount;
        }
        if(snake_tail.width <= 0 || snake_tail.height <= 0) {
            snake.segments.pop();
            if(snake_tail.width < 0) {
                shrink_tail(snake, -1 * snake_tail.width);
            } else if(snake_tail.height < 0) {
                shrink_tail(snake, -1 * snake_tail.height);
            }
        }
    }

    function snake_hits_wall(snake, walls) {
        return _.some(_.map(walls,
                            function(wall) {
                                return collision(_.first(snake.segments),
                                                 wall);
                            }));
    }

    function get_snake_tail(snake) {
        return snake.segments.slice(2);
    }

    function snake_eats_tail(snake) {
        return _.some(_.map(get_snake_tail(snake),
                            function(tail_segment) {
                                return collision(_.first(snake.segments),
                                                 tail_segment);
                            }));
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
                } else if(snake.segments[0].direction == "down") {
                    y = snake.segments[0].y + snake.segments[0].height - snake.head_width;
                }
                snake.segments.unshift(create_snake_segment(x,
                                                            y,
                                                            snake.head_width,
                                                            snake.head_width,
                                                            move.direction));
            }
            traversed_distance = (move.time - start_time) * snake.speed;
            move_head(snake, traversed_distance);
            shrink_tail(snake, get_snake_length(snake) - snake.length);
            start_time = move.time;
        });
        move_buffer = [];

        if(collision(edible_block, snake.segments[0])) {
            next_level();
        }

        if(snake_hits_wall(snake, walls) || snake_eats_tail(snake)) {
            restart_game();
        }

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
        e.preventDefault();
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
});
