canvas = document.getElementById("canvas");
canvas.color = "#d3e3a8";
context = canvas.getContext("2d");

context.canvas.width  = window.innerWidth;
context.canvas.height = window.innerHeight;

last_time = new Date().getTime();

snake = {x: 0, y: 0, width: canvas.width/30, speed: 200/canvas.width, color: "#000000"};

(function draw_next_frame() {
    context.fillStyle = canvas.color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = snake.color;
    context.fillRect(snake.x, snake.y, snake.width, snake.width);

    time = new Date().getTime();
    snake.x += (time - last_time)*snake.speed;
    last_time = time;

    requestAnimationFrame(draw_next_frame);
})();
