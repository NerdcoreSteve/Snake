colors = {canvas: "#d3e3a8",
          snake:  "#000000"};

canvas = document.getElementById("canvas");
context = canvas.getContext("2d");
context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

input_buffer = [];
last_time = new Date().getTime();
snake = {x: 0, y: 0, width: canvas.width/30, speed: 200/canvas.width, color: colors.snake};

function blank_out_canvas() {
    context.fillStyle = colors.canvas;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function move_snake() {
    time = new Date().getTime();
    snake.x += (time - last_time)*snake.speed;
    last_time = time;
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
        input_buffer.push({arrow_key: "up", time: new Date().getTime()});
    } else if(e.keyCode == '40') {
        input_buffer.push({arrow_key: "down", time: new Date().getTime()});
    } else if(e.keyCode == '37') {
        input_buffer.push({arrow_key: "left", time: new Date().getTime()});
    } else if(e.keyCode == '39') {
        input_buffer.push({arrow_key: "right", time: new Date().getTime()});
    }
}
