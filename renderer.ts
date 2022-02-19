import chromium from 'chrome-aws-lambda';
import keccak256 from 'keccak256';

export const renderMedia = async (address: string, creatorId: string) => {
    const seed = keccak256(keccak256(creatorId + 'x' + address)).toString('hex');
    const data = `let seed = "${seed};"`;
    const html = generateHTML(data);
    await renderImage(html, 20000, 2304, '/tmp/tmp.png');
};

const renderImage = async (html: string, waitTime: number, resolution: number, path: string) => {
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    });
    const page = await browser.newPage();

    await page.setViewport({
        width: resolution,
        height: resolution,
        deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.waitForTimeout(waitTime);

    await page.screenshot({ path: path });
    await browser.close();
};

function generateHTML(data: string) {
    let template = `<html>
    <head>
        <meta charset="utf-8" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/keccak256@latest/keccak256.js"></script>
        <script>
            ${data}
        </script>
        <script>
            var bWidth = 20;
            var resolution = 5;
            var pixelDensity = 9;

            let bs;
            let size = 20;
            let multi = 1;

            var backgroundAlpha = 0.2;
            var strokeColor = 'white';
            var fillColor = 'white';

            let img;
            let monogram;

            function preload() {
                img = loadImage('https://d3gp1gfu6ktqqo.cloudfront.net/dulled.png');
            }

            function setup() {
                createCanvas(2304, 2304);
                pixelDensity(pixelDensity);

                monogram = createGraphics(2048, 2048);

                getBs();
                noLoop();
            }

            function draw() {
                colorMode(HSL);
                background('#2f2f2e');
                strokeWeight(((bs / resolution) * 1) / 10);

                input = generateInput();
                generateGrid(monogram, strokeColor, fillColor);

                tint(255, backgroundAlpha);
                image(monogram, 128, 128);

                tint(255, 255);
                img.mask(monogram);
                image(img, 128, 128);
            }

            function generateGrid(ref, strokeColor, fillColor) {
                var rcount = 0;
                var ccount = 0;

                var x = ccount * (input[0].length * bs);
                var y = rcount * (input[0].length * bs);

                for (var z = 0; z < ref.height / (input.length * bs); z++) {
                    for (var k = 0; k < ref.width / (input[0].length * bs); k++) {
                        generateBlock(ref, x, y, ccount, strokeColor, fillColor);

                        ccount += 1;
                        x = ccount * (input[0].length * bs);
                        y = rcount * (input.length * bs);
                    }

                    rcount += 1;
                    ccount = 0;
                    x = ccount * (input[0].length * bs);
                    y = rcount * (input[0].length * bs);
                }
            }

            function generateBlock(ref, x, y, ccount, strokeColor, fillColor) {
                for (var i = 0; i < input.length; i++) {
                    for (var j = 0; j < input[i].length; j++) {
                        if (input[i][j] == '.') {
                        } else if (input[i][j] == '0') {
                            drawCircle(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == '+') {
                            drawPlus(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == 'X') {
                            drawX(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == '|') {
                            drawVerticalLine(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == '-') {
                            drawHorizontalLine(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == '*') {
                            drawDiagonalLineToLeft(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else if (input[i][j] == '/') {
                            drawDiagonalLineToRight(ref, x, y, bs, resolution, strokeColor, fillColor);
                        } else {
                            drawBlock(ref, x, y, bs, strokeColor, fillColor);
                        }

                        x += bs;
                    }

                    x = ccount * (input[0].length * bs);
                    y += bs;
                }
            }

            function getStyle(a) {
                var index = a % 83n;

                if (index < 20) {
                    return 1;
                } else if (index < 35) {
                    return 2;
                } else if (index < 48) {
                    return 3;
                } else if (index < 59) {
                    return 4;
                } else if (index < 68) {
                    return 5;
                } else if (index < 73) {
                    return 6;
                } else if (index < 77) {
                    return 7;
                } else if (index < 80) {
                    return 8;
                } else if (index < 82) {
                    return 9;
                }

                return 10;
            }

            function generateInput() {
                var x = 0n;
                var y = 0n;
                var v = 0n;
                var ONE = BigInt(0x100000000);
                var symbols = [];
                var hash = keccak256(seed).toString('hex');
                hash = hash.slice(-40);
                var a = BigInt('0x' + hash);
                var style = getStyle(a);
                var halfSize = BigInt(size / 2);
                var mod = (a % 11n) + 5n;
                var value = '';
                var grid = [];
                var row = [];

                console.log(style);

                if (style == 0) {
                } else if (style == 1) {
                    // v good
                    symbols = ['.', 'X', '/', '*', '.'];
                } else if (style == 2) {
                    // good
                    symbols = ['.', '+', '-', '|', '.'];
                } else if (style == 3) {
                    // good
                    symbols = ['.', '/', '*', '.', '.'];
                } else if (style == 4) {
                    symbols = ['.', '*', '|', '-', '/'];
                } else if (style == 5) {
                    // is good
                    symbols = ['.', '0', '|', '-', '.'];
                } else if (style == 6) {
                    // not good ?
                    symbols = ['.', '*', '*', '+', '.'];
                } else if (style == 7) {
                    symbols = ['.', '|', '-', '+', '.'];
                } else if (style == 8) {
                    symbols = ['.', 'X', '-', '+', '.'];
                } else if (style == 9) {
                    symbols = ['.', '#', '.', '.', '.'];
                } else {
                    symbols = ['.', '#', '0', '.', '.'];
                }

                for (var i = 0n; i < size; i++) {
                    y = 2n * (i - halfSize) + 1n;
                    if (a % 3n == 1n) {
                        y = -y;
                    } else if (a % 3n == 2n) {
                        y = BigMath.abs(y);
                    }

                    y = y * a;

                    for (var j = 0n; j < size; j++) {
                        x = 2n * (j - halfSize) + 1n;
                        if (a % 2n == 1n) {
                            x = BigMath.abs(x);
                        }

                        x = x * a;
                        v = BigInt.asUintN(256, (x * y) / ONE) % mod;
                        if (v < 5n) {
                            value = symbols[v];
                        } else {
                            value = '.';
                        }
                        row.push(value);
                    }

                    grid.push(row);
                    row = [];
                }

                return grid;
            }

            function getBs() {
                var w = 2048 / bWidth;
                bs = w / size;
            }

            function drawBox(ref, x, y, bs, strokeColor) {
                ref.stroke(strokeColor);
                ref.noFill();
                ref.rect(x, y, bs * multi, bs * multi);
            }

            function drawBlock(ref, x, y, bs, strokeColor, fillColor) {
                ref.stroke(strokeColor);
                ref.fill(fillColor);
                ref.rect(x, y, bs * multi, bs * multi);
            }

            function drawCircle(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                ref.rect(x + int(resolution / 2) * cellSize, y, cellSize * multi, cellSize * multi);
                ref.rect(x + int(resolution / 2) * cellSize, y + (resolution - 1) * cellSize, cellSize * multi, cellSize * multi);
                ref.rect(x, y + int(resolution / 2) * cellSize, cellSize * multi, cellSize * multi);
                ref.rect(x + (resolution - 1) * cellSize, y + int(resolution / 2) * cellSize, cellSize * multi, cellSize * multi);

                var dx = 1;
                var dy = 0;

                var cursorx = int(resolution / 2) + dx;
                var cursory = dy;

                var centerx = int(resolution / 2);
                var centery = int(resolution / 2);

                while (cursorx - centerx <= centery - cursory) {
                    ref.rect(x + (centerx + dx) * cellSize, y + dy * cellSize, cellSize * multi, cellSize * multi);
                    ref.rect(x + (centerx - dx) * cellSize, y + dy * cellSize, cellSize * multi, cellSize * multi);

                    ref.rect(x + (centerx + dx) * cellSize, y + (resolution - 1 - dy) * cellSize, cellSize * multi, cellSize * multi);
                    ref.rect(x + (centerx - dx) * cellSize, y + (resolution - 1 - dy) * cellSize, cellSize * multi, cellSize * multi);

                    ref.rect(x + (resolution - 1 - dy) * cellSize, y + (centery + dx) * cellSize, cellSize * multi, cellSize * multi);
                    ref.rect(x + (resolution - 1 - dy) * cellSize, y + (centery - dx) * cellSize, cellSize * multi, cellSize * multi);

                    ref.rect(x + dy * cellSize, y + (centery + dx) * cellSize, cellSize * multi, cellSize * multi);
                    ref.rect(x + dy * cellSize, y + (centery - dx) * cellSize, cellSize * multi, cellSize * multi);

                    dx += 1;

                    while (dx ** 2 + (centery - dy) ** 2 > (resolution / 2) ** 2 && centery - dy > 0) {
                        dy += 1;
                    }

                    cursorx = int(resolution / 2) + dx;
                    cursory = dy;
                }
            }

            function drawX(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var r = 0; r < resolution; r++) {
                    ref.rect(x + r * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);

                    if (r != int(resolution / 2) || resolution % 2 == 0) {
                        ref.rect(x + (resolution - r - 1) * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);
                    }
                }
            }

            function drawPlus(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var r = 0; r < resolution; r++) {
                    if (r == int(resolution / 2)) {
                        for (var c = 0; c < resolution; c++) {
                            ref.rect(x + c * cellSize, y + int(resolution / 2) * cellSize, cellSize * multi, cellSize * multi);
                        }
                    } else {
                        ref.rect(x + int(resolution / 2) * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);
                    }
                }
            }

            function drawVerticalLine(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var r = 0; r < resolution; r++) {
                    ref.rect(x + int(resolution / 2) * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);
                }
            }

            function drawHorizontalLine(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var c = 0; c < resolution; c++) {
                    ref.rect(x + c * cellSize, y + int(resolution / 2) * cellSize, cellSize * multi, cellSize * multi);
                }
            }

            function drawDiagonalLineToRight(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var r = 0; r < resolution; r++) {
                    ref.rect(x + (resolution - r - 1) * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);
                }
            }

            function drawDiagonalLineToLeft(ref, x, y, bs, resolution, strokeColor, fillColor) {
                var cellSize = bs / resolution;

                ref.stroke(strokeColor);
                ref.fill(fillColor);

                for (var r = 0; r < resolution; r++) {
                    ref.rect(x + r * cellSize, y + r * cellSize, cellSize * multi, cellSize * multi);
                }
            }

            function pgMask(_content, _mask) {
                //Create the mask as image
                var img = createImage(_mask.width, _mask.height);
                img.copy(_mask, 0, 0, _mask.width, _mask.height, 0, 0, _mask.width, _mask.height);
                //load pixels
                img.loadPixels();
                for (var i = 0; i < img.pixels.length; i += 4) {
                    // 0 red, 1 green, 2 blue, 3 alpha
                    // Assuming that the mask image is in grayscale,
                    // the red channel is used for the alpha mask.
                    // the color is set to black (rgb => 0) and the
                    // alpha is set according to the pixel brightness.
                    var v = img.pixels[i];
                    img.pixels[i] = 0;
                    img.pixels[i + 1] = 0;
                    img.pixels[i + 2] = 0;
                    img.pixels[i + 3] = v;
                }
                img.updatePixels();

                //convert _content from pg to image
                var contentImg = createImage(_content.width, _content.height);
                contentImg.copy(_content, 0, 0, _content.width, _content.height, 0, 0, _content.width, _content.height);
                // create the mask
                contentImg.mask(img);
                // return the masked image
                return contentImg;
            }

            const BigMath = {
                abs(x) {
                    return x < 0n ? -x : x;
                },

                sign(x) {
                    if (x === 0n) return 0n;
                    return x < 0n ? -1n : 1n;
                },

                pow(base, exponent) {
                    return base ** exponent;
                },
                min(value, ...values) {
                    for (const v of values) if (v < value) value = v;
                    return value;
                },

                max(value, ...values) {
                    for (const v of values) if (v > value) value = v;
                    return value;
                },
            };
        </script>
        <style type="text/css">
            body {
                margin: 0;
                padding: 0;
            }
            canvas {
                padding: 0;
                margin: auto;
                display: block;
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
            }
        </style>
    </head>
</html>`;
    return template;
}
