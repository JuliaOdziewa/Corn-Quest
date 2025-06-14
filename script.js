const canvas = document.querySelector(".gameCanvas");
const ctx = canvas.getContext('2d');
const startButton = document.querySelector(".startButton")

let gameStarted = false;
let mouseX = 0; //pozycja x wskaźnika myszy
let mouseY = 0; //pozycja y wskaźnika myszy
let score = 0; //wynik gracza
let health = 5; //początkowie zdrowie gracza
let shootCooldown = 0; //opóźnienie między strzałami

//ekran startowy
const startScreen = new Image();
startScreen.src = 'images/start.png';

//ekran po przegraniu gry
const gameOverScreen = new Image();
gameOverScreen.src = 'images/gameover.png';

//tworzenie obiektu player
const player = {
    x: 0,
    y: 500,
    sizeX: 70,
    sizeY: 130,
    speed: 5,
    currentFrame: 0, //obecna klatka animacji
    frameCounter: 0, //licznik klatek animacji
    imgFrames: [
        new Image(),
        new Image(),
        new Image(),
        new Image()
    ],
    vY: 0, //prędkość pionowa gracza (przy skoku)
    isJumping: false //czy gracz jest w trakcie skoku
};

//klatki animacji gracza
player.imgFrames[0].src = 'images/frame-0.png';
player.imgFrames[1].src = 'images/frame-1.png';
player.imgFrames[2].src = 'images/frame-2.png';
player.imgFrames[3].src = 'images/frame-3.png';

//tworzenie pocisków playera
const rainbow = {
    sizeX: 30,
    sizeY: 20,
    speed: 5,
    img: new Image()
};

rainbow.img.src = 'images/rainbow.png';

//tworzenie chmury - platformy
const cloud = {
    sizeX: 222,
    sizeY: 90,
    img: new Image()
}

cloud.img.src = 'images/cloud.png';

//tworzenie enemy
const enemy = {
    sizeX: 56,
    sizeY: 70,
    enemyIsKilled: false, //czy zabity?
    img: new Image()
}

enemy.img.src = 'images/enemy.png';
enemy.killedImg = new Image();
enemy.killedImg.src = 'images/enemy-killed.png'; //obrazek zabitego przeciwnika

//tworzenie kukurydzy do zbierania przez gracza
const corn = {
    sizeX: 48,
    sizeY: 50,
    img: new Image()
}

corn.img.src = 'images/corn.png';

//tworzenie serca - zdrowia gracza
const heart = {
    sizeX: 40,
    sizeY: 34,
    img: new Image()
}

heart.img.src = 'images/heart.png';
heart.emptyImg = new Image();
heart.emptyImg.src = 'images/heart-empty.png'; //obrazek straconego serca (zdrowia)

//tworzenie pocisków przeciwnika
const enemyBullet = {
    sizeX: 24,
    sizeY: 25,
    img: new Image()
}

enemyBullet.img.src = 'images/enemybullet.png';

const clouds = []; //tablica chmur
const rainbows = []; //tablica pocisków gracza
const enemyBullets = []; //tablica pocisków przeciwnika

//obsługa klawiszy
const keysPressed = {};
window.addEventListener('keydown', e => keysPressed[e.key] = true);
window.addEventListener('keyup', e => keysPressed[e.key] = false);

//rejestrowanie pozycji myszy
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();//pozycja canvasu względem całej strony
    mouseX = e.clientX - rect.left; //obliczona pozycja x kursora względem canvasu
    mouseY = e.clientY - rect.top; //obliczona pozycja y kursora względem canvasu
});

//fukcja sprawdzająca kolizje
function checkCollision(a, b) {
    return (
        a.x < b.x + b.sizeX &&
        a.x + a.sizeX > b.x &&
        a.y < b.y + b.sizeY &&
        a.y + a.sizeY > b.y
    );
}

//ryswoanie gracza
function drawPlayer() {
    const flip = keysPressed['a'] && !keysPressed['d']; //warunek potrzebny do odbicia lustrzanego gracza
    const img = player.imgFrames[player.currentFrame]; //obecna klatka animacji

    if (img.complete) { //rysowanie klatki animacji
        ctx.save();
        ctx.scale(flip ? -1 : 1, 1);  //lustrzane odbicie postaci w lewo
        //jeśli wciśnięto 'a' i nie wciśnięto 'd' odbij lustrzanie obrazek gracza
        const drawX = flip ? -player.x - player.sizeX : player.x;
        ctx.drawImage(img, drawX, player.y, player.sizeX, player.sizeY);
        ctx.restore();
    } else { //jeśli klatka się nie ładuje wyśietlany jest szary prostokąt
        ctx.fillStyle = 'gray';
        ctx.fillRect(player.x, player.y, player.sizeX, player.sizeY);
    }
}

//aktualizowanie gracza
function updatePlayer() {
    const gravity = 0.24; //grawitacja
    const jumpStrength = -10; //siła skoku (gracz skacze 10px w górę)
    let isMoving = false; //czy gracz się porusza

    //sprawdzanie kolizji z chmurami
    for (let cloud of clouds) {
        if ( //gdy gracz opada sprawdzamy czy dotknął górnej krawędzi chmury
            player.vY >= 0 &&
            player.x + player.sizeX > cloud.x &&
            player.x < cloud.x + cloud.sizeX &&
            player.y + player.sizeY <= cloud.y + 10 &&
            player.y + player.sizeY + player.vY >= cloud.y
        ) {
            player.y = cloud.y - player.sizeY; //ustawienie pozycji gracza na górnej krawędzi chmury
            player.vY = 0; //zatrzymanie ruchu w pionie
            player.isJumping = false; //gracz nie skacze
            onPlatform = true; //gracz stoi na chmurze
            break;
        }
    }

    for (let cloud of clouds) {
        if (cloud.hasCorn) {
            const cornRect = { //pole (prostokąt), w którym znajduje się kukurydza
                x: cloud.x + cloud.sizeX / 2 - 10,
                y: cloud.y - 20,
                sizeX: 20,
                sizeY: 20
            };

            //gdy gracz dotknie kukurydzy wynik zwiększa się o jeden, a kukurydza znika
            if (checkCollision(player, cornRect)) {
                cloud.hasCorn = false;
                score++;
            }
        }
    }

    //obsługa skoku
    if (keysPressed['w'] && !player.isJumping) {
        player.vY = jumpStrength; //nadanie prędkości skoku
        player.isJumping = true; //gracz skacze (jest w trakcie skoku)
    }

    player.vY += gravity; //dodanie grawitacji do prędkości
    player.y += player.vY; //przesunięcie gracza w górę

    //poruszanie się w lewo
    if (keysPressed['a']) {
        player.x -= player.speed;
        isMoving = true;
    }

    //poruszanie się w prawo
    if (keysPressed['d']) {
        player.x += player.speed;
        isMoving = true;
    }

    if (isMoving) {
        player.frameCounter++; //jeśli gracz się porusz zwiększ licznik klatek
        if (player.frameCounter > 10) { //co 10 klatek zmień klatkę animacji
            player.currentFrame = (player.currentFrame + 1) % player.imgFrames.length; //przejście do następnej klatki
            player.frameCounter = 0; //reset licznika
        }
    } else {
        player.currentFrame = 0; // domyślna klatka, gdy player stoi
        player.frameCounter = 0; //reset licznika, gdy player stoi
    }

    if (keysPressed['s'] && shootCooldown <= 0) {
        shoot(); //wywołanie funkcji strzelania
        shootCooldown = 20; //opóźnienie między strzałami
    }
    if (shootCooldown > 0) shootCooldown--;

    //zabezpieczenie gracza przed wyjściem poza canvas
    player.x = Math.max(0, Math.min(canvas.width - player.sizeX, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.sizeY, player.y));

    //zabezpieczenie przed wypadnięciem poza dolną krawędź canvasu
    if (player.y + player.sizeY >= canvas.height) {
        player.y = canvas.height - player.sizeY;
        player.vY = 0;
        player.isJumping = false;
    }
}

//rysowanie chmur
function drawClouds() {
    clouds.forEach(cloud => { //rysowanie chmur
        if (cloud.img.complete) {
            ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.sizeX, cloud.sizeY);
        } else { //jeśli obrazek sie nie załaduje zobaczymy biały prostokat
            ctx.fillStyle = 'white';
            ctx.fillRect(cloud.x, cloud.y, cloud.sizeX, cloud.sizeY);
        }

        if (cloud.hasCorn) { //rysowanie kukurydzy na chmurach
            if (corn.img.complete) {
                ctx.drawImage(corn.img, cloud.x + cloud.sizeX / 2 - corn.sizeX / 2, cloud.y - corn.sizeY, corn.sizeX, corn.sizeY);
            } else { //jeśli obrazek sie nie załaduje zobaczymy żółty prostokat
                ctx.fillStyle = 'yellow';
                ctx.fillRect(cloud.x + cloud.sizeX / 2 - 20, cloud.y - 50, 50, 50);
            }
        }

        if (cloud.hasEnemy) { //rysowanie przeciwnika na chmurach
            if (enemy.img.complete) {
                ctx.drawImage(enemy.img, cloud.x + cloud.sizeX / 2 - enemy.sizeX / 2, cloud.y - enemy.sizeY, enemy.sizeX, enemy.sizeY);
            } else { //jeśli obrazek sie nie załaduje zobaczymy czarny prostokat
                ctx.fillStyle = 'black';
                ctx.fillRect(cloud.x + cloud.sizeX / 2 - 15, cloud.y - 30, enemy.sizeX, enemy.sizeY);
            }
        } else if (cloud.enemyIsKilled) { //jeśli przeciwnik zostanie zabity jego obrazek zmienia sie na inny(szary)
            ctx.drawImage(enemy.killedImg, cloud.x + cloud.sizeX / 2 - enemy.sizeX / 2, cloud.y - enemy.sizeY, enemy.sizeX, enemy.sizeY);
        }
    });
}

//generowanie chmur
function spawnCloud() {
    const hasCorn = Math.random() < 0.5; //50% szans na to, że na chmurze pojawi się kukurydza
    const hasEnemy = Math.random() < 0.2; //20% szans na to, że na chmurze pojawi się przeciwnik

    clouds.push({
        x: canvas.width,
        y: canvas.height - 210,
        sizeX: cloud.sizeX,
        sizeY: cloud.sizeY,
        speed: 1,
        hasCorn: hasCorn, //czy zawiera kukurydze
        hasEnemy: hasEnemy, //czy zawiera przeciwnika
        enemyShootCooldown: 0, //opóźnienie między strzałami przeciwnika
        enemyHitCount: 0, //liczba trafień w przeciwnika
        img: cloud.img
    }, {
        x: canvas.width + 500,
        y: canvas.height - 380,
        sizeX: cloud.sizeX,
        sizeY: cloud.sizeY,
        speed: 1,
        hasCorn: hasCorn, //czy zawiera kukurydze
        hasEnemy: hasEnemy, //czy zawiera przeciwnika
        enemyShootCooldown: 0, //opóźnienie między strzałami przeciwnika
        enemyHitCount: 0, //liczba trafień w przeciwnika
        img: cloud.img
    });
}
setInterval(spawnCloud, 3000);// co 3 sekundy tworzona jest nowa chmura

//aktualizowanie chmur
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed; //przesuwanie chmury w lewo o prędkość speed

        //jeśli na chmurze jest przeciwnik i nie został trafiony 3 razy
        if (cloud.hasEnemy && cloud.enemyHitCount < 3) {
            cloud.enemyShootCooldown--; //zmniejszenie opóźnienia między strzałami

            if (cloud.enemyShootCooldown <= 0) {
                const startX = cloud.x + cloud.sizeX / 2;
                const startY = cloud.y - enemy.sizeY / 2;

                //obliczanie wektora kierunku pocisku (od chmury do gracza)
                const dx = player.x + player.sizeX / 2 - startX;
                const dy = player.y + player.sizeY / 2 - startY;
                const length = Math.sqrt(dx * dx + dy * dy); //obliczanie długości wektora
                const speed = 2.5; //prędkość pocisku

                //dodanie nowego pocisku do tablicy
                enemyBullets.push({
                    x: startX,
                    y: startY,
                    sizeX: 10,
                    sizeY: 10,
                    vx: (dx / length) * speed, // składowa X wektora prędkości
                    vy: (dy / length) * speed // składowa Y wektora prędkości
                });

                //ustawienie opóźnienia dla pocisków przeciwnika 180 klatek
                cloud.enemyShootCooldown = 180;
            }
        }
    });

    for (let i = clouds.length - 1; i >= 0; i--) {
        if (clouds[i].x + clouds[i].sizeX < 0) clouds.splice(i, 1);
    }
}

//rysowanie pocisków przeciwnika
function drawEnemyBullets() {
    for (let bullet of enemyBullets) {
        if (rainbow.img.complete) { //wyświetlanie obrazka pocisku (kukurydzy)
            ctx.drawImage(enemyBullet.img, bullet.x, bullet.y, enemyBullet.sizeX, enemyBullet.sizeY);
        } else { //jeśli obrazek się nie załaduje wyświetla sie fioletowy prostokąt
            ctx.fillStyle = 'purple';
            ctx.fillRect(bullet.x, bullet.y, bullet.sizeX, bullet.sizeY);
        }
    }
}

//aktualizowanie pocisków przeciwnika
function updateEnemyBullets() {
    //iterowanie po tablicy enemyBullets od końca
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];

        //aktualizacja pozycji pocisku zgodnie z jego prędkością
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        //jeśli pocisk trafił w gracza zmniejsza się jego zdrowie o jeden, a pocisk znika
        if (checkCollision(player, bullet)) {
            health--;
            enemyBullets.splice(i, 1);

            //sprawdzanie czy gracz nie zginął
            if (health <= 0) {
                return;
            }
            continue; //przejście do następnego pocisku
        }

        // Jeśli pocisk wyleciał poza krawędź ekranu jest usuwany
        if (
            bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height
        ) {
            enemyBullets.splice(i, 1);
        }
    }
}

//rysowanie pocisków - tęczy
function drawRainbows() {
    for (let bullet of rainbows) {
        if (rainbow.img.complete) { //rysowanie obrazka tęczy
            ctx.drawImage(rainbow.img, bullet.x, bullet.y, rainbow.sizeX, rainbow.sizeY);
        } else { //jeśli obrazek się nie ładuje wyświetla się pomarańczowy prostokąt
            ctx.fillStyle = 'orange';
            ctx.fillRect(bullet.x, bullet.y, bullet.sizeX, bullet.sizeY);
        }
    }
}

//aktualizacja pocisków
function updateRainbows() {
    //iterowanie po tablicy rainbows od końca
    for (let i = rainbows.length - 1; i >= 0; i--) {
        const r = rainbows[i];
        //aktualizacja pozycji przycisku zgodnie z jego prędkością
        r.x += r.vx;
        r.y += r.vy;

        for (let cloud of clouds) {
            if (cloud.hasEnemy && cloud.enemyHitCount < 3) {
                const enemyRect = { //prostokąt (pole) w którym znajduje się przeciwnik
                    x: cloud.x + cloud.sizeX / 2 - enemy.sizeX / 2,
                    y: cloud.y - enemy.sizeY,
                    sizeX: enemy.sizeX,
                    sizeY: enemy.sizeY
                };

                // Jeśli przycisk trafi w przeciwnika zwiększa sie licznik trafień i pocisk znika
                if (checkCollision(r, enemyRect)) {
                    cloud.enemyHitCount++;
                    rainbows.splice(i, 1);

                    //jeśli przeciwnik został trafiony 3 razy - umiera, a wynik zwiększa się o 3 punkty
                    if (cloud.enemyHitCount >= 3) {
                        cloud.hasEnemy = false; //enemy jest "ukryty"
                        cloud.enemyIsKilled = true;
                        score += 3;
                    }

                    break;
                }
            }
        }

        //jeśli pocisk wyjdzie poza ekran jest usuwany
        if (
            r.x < 0 || r.x > canvas.width ||
            r.y < 0 || r.y > canvas.height
        ) {
            rainbows.splice(i, 1);
        }
    }
}

//strzelanie
function shoot() {
    //pozycja startowa pocisku
    const startX = player.x + player.sizeX / 2;
    const startY = player.y + player.sizeY / 2;
    //obliczanie wektora kierunku pocisku (od gracza do wskaźnika myszki)
    const dx = mouseX - startX;
    const dy = mouseY - startY;
    const length = Math.sqrt(dx * dx + dy * dy); //obliczanie długości wektora

    //dodanie nowego pocisku do tablicy rainbows
    rainbows.push({
        x: startX,
        y: startY,
        sizeX: rainbow.sizeX,
        sizeY: rainbow.sizeY,
        vx: (dx / length) * rainbow.speed, //składowa X wektora prędkości
        vy: (dy / length) * rainbow.speed //składowa Y wektora prędkości
    });
}

//rysowanie interfejsu
function drawUI() {
    //rysowanie zdrowia (serc) w pętli
    for (let i = 0; i < 5; i++) {
        const x = 10 + i * (heart.sizeX + 10);
        //obrazek serca różowego lub pustego w zależności czy gracz został trafiony
        const img = i < health ? heart.img : heart.emptyImg;

        if (img.complete) {
            ctx.drawImage(img, x, 10, heart.sizeX, heart.sizeY);
        } else { //jeśli obrazek się nie ładuje wyświetla się różowy prostokąt
            ctx.fillStyle = 'pink';
            ctx.fillRect(x, 10, heart.sizeX, heart.sizeY);
        }
    }

    ctx.fillStyle = '#00abc1';
    ctx.font = "30px 'Press Start 2P', system-ui";
    ctx.fillText("Score: " + score, canvas.width / 2 - 155, 40);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) { //jeśli gra jest nie rozpoczęta wyświetl ekran startowy
        if (startScreen.complete) {
            ctx.drawImage(startScreen, 0, 0, canvas.width, canvas.height);
        } else { //jeśli obrazek się nie ładuje wyświetla się niebieski prostokąt
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    updatePlayer();
    updateClouds();
    updateRainbows();
    updateEnemyBullets();

    drawPlayer();
    drawClouds();
    drawEnemyBullets();
    drawRainbows();
    drawUI();

    if (health > 0) { //jeśli poziom zdrowia gracza jest większy od 0 wyświetlamy grę
        requestAnimationFrame(gameLoop);
    } else { // w innym przypadku wyświetlamy ekran gameover
        if (gameOverScreen.complete) {
            ctx.drawImage(gameOverScreen, 0, 0, canvas.width, canvas.height);
        } else { // jeśli obrazek się nie załaduje wyświetla sie zielony prostokąt
            ctx.fillStyle = 'green';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

//po kliknięciu przysicku start rozpoczynamy grę, a przycisk znika
startButton.addEventListener("click", () => {
    gameStarted = true;
    startButton.style.display = "none";
    requestAnimationFrame(gameLoop);
});

requestAnimationFrame(gameLoop);