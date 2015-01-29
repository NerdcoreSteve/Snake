require(['underscore-min', 'jquery-2.1.3.min'], function() {
    score = 0;
    paused = true;

    colors = {canvas:           "#d3e3a8",
              snake:            "#000000",
              wall:             "#000000",
              edible_block:     "#000000",
              pause_modal_fill:   "#d3e3a8",
              pause_modal_stroke: "#000000"};

    edible_block_minimal_fractional_distance_from_snake_head = 0.3;
    edible_block_minimal_fractional_distance_from_walls = 0.1;

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    context.canvas.width  = window.innerWidth;
    context.canvas.height = window.innerHeight;

    move_buffer = [];
    start_time = _.now();

    walls = [];
    wall_short_length = canvas.width / 30;

    function create_wall(x, y, width, height) {
        return {x:         x, 
                y:         y, 
                width:     width,
                height:    height,
                color:     colors.wall};
    }

    walls.push(create_wall(0, 0, canvas.width, wall_short_length));
    walls.push(create_wall(0, canvas.height - wall_short_length, canvas.width, wall_short_length));
    walls.push(create_wall(0, 0, wall_short_length, canvas.height));
    walls.push(create_wall(canvas.width - wall_short_length, 0, wall_short_length, canvas.height));

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
                         "none",
                         canvas.width / 40,
                         initial_snake_speed,
                         colors.snake);

    function block_is_far_enough_from_snake(block, snake, minimal_fractional_distance) {
        minimum_distance = edible_block_minimal_fractional_distance_from_snake_head * canvas.height;
        snake_head = _.first(snake.segments)
        return Math.abs(block.x - snake_head.x) >= minimum_distance &&
               Math.abs(block.y - snake_head.y) >= minimum_distance;
    }

    //TODO shouldn't I just use get_coordinates?
    function get_board_boundaries(width_height) {
        return {upper_left_x:  wall_short_length,
                upper_left_y:  wall_short_length,
                lower_right_x: canvas.width  - wall_short_length  - width_height,
                lower_right_y: canvas.height - wall_short_length - width_height};
    }

    function create_edible_block() {
        width_height = canvas.width / 40;
        boundaries = get_board_boundaries(width_height);

        //TODO should be calculated with a function that takes a fraction
        //     use width or height, whichever is shortest
        //edible_block_minimum_distance_in_fraction_of_canvas_height
        minimum_distance_from_walls = edible_block_minimal_fractional_distance_from_walls
                                      * canvas.height;

        x = 0;
        y = 0;
        good_spot = false;
        while(!good_spot) {
            x = random_number(boundaries.upper_left_x, boundaries.lower_right_x);
            y = random_number(boundaries.upper_left_y, boundaries.lower_right_y);
            block = {x: x, y: y, width: width_height, height: width_height};
            if(x > boundaries.upper_left_x  + minimum_distance_from_walls &&
               x < boundaries.lower_right_x - minimum_distance_from_walls &&
               y > boundaries.upper_left_y  + minimum_distance_from_walls &&
               y < boundaries.lower_right_y - minimum_distance_from_walls &&
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

    //TODO this function should be called new_game and should be called before the main loop
    function restart_game() {
        score = 0;
        paused = true;
        last_non_none_direction = "right";
        edible_block = create_edible_block();
        snake = create_snake(canvas.width  / 2,
                             canvas.height / 2,
                             "none",
                             canvas.width / 40,
                             initial_snake_speed,
                             colors.snake);
    }

    function next_level() {
        edible_block = create_edible_block();
        snake.speed += 0.1 * initial_snake_speed;
        snake.length += snake.head_width;
        score++;
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

    function snake_off_board(snake) {
        //TODO using a block's width in this way doesn't quite work.
        //     but it works for this application.
        boundaries = get_board_boundaries(snake.head_width);
        snake_head = _.first(snake.segments);
        return snake_head.x < boundaries.upper_left_x  ||
               snake_head.x > boundaries.lower_right_x ||
               snake_head.y < boundaries.upper_left_y  ||
               snake_head.y > boundaries.lower_right_y;
    }

    function snake_hits_wall(snake, walls) {
        return _.some(_.map(walls,
                            function(wall) {
                                return collision(_.first(snake.segments),
                                                 wall);
                            }))
               || snake_off_board(snake);
    }

    function snake_eats_tail(snake) {
        return _.some(_.map(snake.segments.slice(2),
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

        move_buffer.unshift({direction: snake.segments[0].direction, time: _.now()});

        move_buffer.forEach(function(move) {
            if(move.direction != "none") {
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

                if(collision(edible_block, snake.segments[0])) {
                    next_level();
                }

                if(snake_hits_wall(snake, walls) || snake_eats_tail(snake)) {
                    restart_game();
                }
            }

            start_time = move.time;
        });
        move_buffer = [];
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

    function draw_pause_modal() {
        context.fillStyle = colors.pause_modal_fill;
        context.strokeStyle = colors.pause_modal_stroke;
        context.lineWidth = canvas.width / 60;
        modal_padding = canvas.width / 10;
        context.fillRect(modal_padding,
                         modal_padding,
                         canvas.width  - 2 * modal_padding,
                         canvas.height - 2 * modal_padding);
        context.strokeRect(modal_padding,
                           modal_padding,
                           canvas.width  - 2 * modal_padding,
                           canvas.height - 2 * modal_padding);

        context.fillStyle = colors.pause_modal_stroke;
        text_padding = modal_padding + canvas.width / 30;
        text_height = Math.floor(canvas.width / 25);
        context.font = text_height + "px Arial";

        text_position = 1.15 * text_padding;
        context.fillText("Professional Snake!", text_padding, text_position);

        text_position += 1.3 * text_height;
        context.fillText("Current Score: " + score, text_padding, text_position);

        text_position += 1.3 * text_height;
        context.fillText("Press space to start, pause, or unpause", text_padding, text_position);

        text_position += 1.3 * text_height;
        context.fillText("Click on screen (while unpaused) to restart", text_padding, text_position);

        text_position += 1.3 * text_height;
        context.fillText("This game was made by Steve Smith:", text_padding, text_position);

        text_position += 1.3 * text_height;
        context.fillText("professionalsteve.com", text_padding, text_position);
    }

    (function draw_next_frame() {
        blank_out_canvas();
        draw_wall();
        draw_edible_block();
        move_snake();
        draw_snake();
        if(paused) {
            draw_pause_modal();
        }
        requestAnimationFrame(draw_next_frame);
    })();

    last_non_none_direction = "right";
    function toggle_pause() {
        if(paused) {
            paused = false;
            move_buffer.unshift({direction: last_non_none_direction,
                                 time: _.now()});
            _.first(snake.segments).direction = last_non_none_direction;
        } else {
            paused = true;
            move_buffer.unshift({direction: "none", time: _.now()});
            _.first(snake.segments).direction = "none";
        }
    }

    window.onkeydown = function(e) {
        e = e || window.event;
        e.preventDefault();

        if(e.keyCode == '32') {
            toggle_pause();
        }

        if(!paused) {
            if(e.keyCode == '38') {
                move_buffer.unshift({direction: "up", time: _.now()});
                last_non_none_direction = "up";
            } else if(e.keyCode == '40') {
                move_buffer.unshift({direction: "down", time: _.now()});
                last_non_none_direction = "down";
            } else if(e.keyCode == '37') {
                move_buffer.unshift({direction: "left", time: _.now()});
                last_non_none_direction = "left";
            } else if(e.keyCode == '39') {
                move_buffer.unshift({direction: "right", time: _.now()});
                last_non_none_direction = "right";
            }
        }
    }

    $("canvas").click(function() {
        if(!paused) {
            restart_game();
        }
    });
});
