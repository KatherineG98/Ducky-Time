const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let fontSize = 18;
let columns, rows;

// Characters: . : + * (hover), @ (click)
const CHAR_DOT = '.';
const CHAR_COLON = ':';
const CHAR_PLUS = '+';
const CHAR_STAR = '*';
const CHAR_AT = '🐥';

// Colors for each character
const COLOR_DOT = '#ffffff';
const COLOR_COLON = '#0ceaea';
const COLOR_PLUS = '#fbd11a';
const COLOR_STAR = '#FF7E00';
const COLOR_AT = '#ff00ff';

// Mouse interaction
const mouse = { x: -1000, y: -1000 };
let isMouseDown = false;
let trail = [];

function initTrail() {
    trail = new Array(columns * rows).fill(0);
}

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

window.addEventListener('mousedown', () => { isMouseDown = true; });
window.addEventListener('mouseup', () => { isMouseDown = false; });

window.addEventListener('touchstart', () => { isMouseDown = true; });
window.addEventListener('touchend', () => { isMouseDown = false; });


function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    columns = Math.ceil(width / fontSize);
    rows = Math.ceil(height / fontSize);
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    initTrail();
}

window.addEventListener('resize', resize);
resize();

let time = 0;

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Fade trail
    for (let i = 0; i < trail.length; i++) {
        trail[i] *= 0.91; // Decay
    }

    // Add mouse energy
    const mx = Math.floor(mouse.x / fontSize);
    const my = Math.floor(mouse.y / fontSize);

    // Radius controls the size of the halo
    const radius = 4;

    // Injections add to the value every frame
    const moveInjection = 0.3;
    const clickInjection = 0.8;

    // Caps define the maximum value a cell can reach
    const maxMoveCap = 1.1;
    const maxClickCap = 5.0;

    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const tx = mx + x;
            const ty = my + y;
            if (tx >= 0 && tx < columns && ty >= 0 && ty < rows) {
                const index = ty * columns + tx;
                const dist = Math.sqrt(x * x + y * y);
                if (dist < radius) {
                    const factor = (1 - dist / radius);

                    let injection = 0;
                    let cap = 0;

                    if (isMouseDown) {
                        injection = clickInjection * factor;
                        cap = maxClickCap;
                    } else {
                        // Linear falloff for cap
                        let localCap = maxMoveCap * factor;
                        injection = moveInjection * factor;
                        cap = localCap;
                    }

                    if (trail[index] < cap) {
                        trail[index] += injection;
                        if (trail[index] > cap) trail[index] = cap;
                    }
                }
            }
        }
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            const index = y * columns + x;
            let val = trail[index];

            // Thresholds
            let char = '';
            let color = '#fff';

            if (val < 0.05) {
                continue; // Invisible
            } else if (val < 0.2) {
                char = CHAR_DOT;
                color = COLOR_DOT;
            } else if (val < 0.4) {
                char = CHAR_COLON;
                color = COLOR_COLON;
            } else if (val < 0.7) {
                char = CHAR_PLUS;
                color = COLOR_PLUS;
            } else if (val <= 1.2) {
                char = CHAR_STAR;
                color = COLOR_STAR;
            } else {
                char = CHAR_AT;
                color = COLOR_AT;
            }

            ctx.fillStyle = color;
            ctx.fillText(char, x * fontSize + fontSize / 2, y * fontSize + fontSize / 2);
        }
    }

    time += 0.05;
    requestAnimationFrame(draw);
}

draw();
