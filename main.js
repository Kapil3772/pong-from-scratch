
class Rect {
    constructor(x,y,w,h){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    top(){
        return this.y;
    }
    bottom(){
        return this.y + this.h;
    }
    left(){
        return this.x;
    }
    right(){
        return this.x + this.w;
    }
    centerX(){
        return (this.x + (this.w /2.0));
    }
    centerY(){
        return (this.y + (this.h /2.0));
    }
}
class GameButton extends Rect {
    constructor(x,y,w,h,text){
        super(x,y,w,h);
        this.hovered = false;
        this.clicked = false;
        this.text = text;
        this.textColor = "black";
        this.btnColor = "white";
        this.font = "25px bold";
        this.xPadding = 0;
        this.yPadding = 0;
    }
    update(){
        
    }
    render(ctx){
        ctx.fillStyle = this.btnColor;
        ctx.font = this.font;
        ctx.fillRect(this.x - this.w/2,this.y,this.w,this.h);
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.text,(this.x - this.w/2) + this.xPadding,this.y + this.yPadding,this.w - 10, this.h -10);
    }
    setPadding(x,y){
        this.xPadding = x;
        this.yPadding = y;
    }
}
class PhysicsRect extends Rect{
    constructor(x,y,w,h){
        super(x,y,w,h);
    }
    intersects(rect){
        return this.left() < rect.right() && this.top() < rect.bottom() && this.right() > rect.left() && this.bottom() > rect.top();
    }
    intersectsWithPoint(x,y){
        return x < this.right() && x > this.left() && y <this.bottom() && y > this.top();
    }
    wallCollisionLeft(rect){
        return this.left() < rect.left();
    }
    wallCollisionRight(rect){
        return this.right() > rect.right();
    }
}

class HealthCoreFragment extends PhysicsRect {
    constructor(x,y,w,h,angle,speed){
        super(x,y,w,h);
        this.angle = angle;
        this.speed = speed;
        this.gravity = 200; //px per second square
        this.airResistance = 0.2;
        this.xVelocity = this.speed * Math.cos(this.angle);
        this.yVelocity = this.speed * Math.sin(this.angle);
        this.dead = false;
    }
    update(dt){
        this.x += this.xVelocity * dt;
        this.y += this.yVelocity * dt;
        this.yVelocity += this.gravity * dt;
        if(this.xVelocity>0){
            this.xVelocity = Math.max(0,this.xVelocity-this.airResistance);
        }
        else if(this.xVelocity<0){
            this.xVelocity = Math.min(0,this.xVelocity+this.airResistance);
        }
        this.w = Math.max(0,this.w - 0.02);
        if(this.w==0){
            this.dead = true;
        }
    }
    render(ctx){
        ctx.fillStyle = "rgba(0,255,255,1)";
        ctx.fillRect(this.x,this.y,this.w,this.h);
    }
}

class HealthCore extends Rect {
    constructor(x,y,w,h){
        super(x,y,w,h);
        this.alive = true;
    }
    update(dt,xPos){
        this.x = xPos
    }
    render(ctx,shakeX,shakeY){
        ctx.fillStyle = "rgb(0, 255, 255)";
        ctx.fillRect(this.x + shakeX,this.y + shakeY,this.w,this.h);
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.strokeRect(this.x + shakeX,this.y +shakeY,this.w,this.h);
    }
}

class HealthCoreManager {
    constructor(totalCores,player){
        this.player = player;
        this.healthCores = [];
        this.totalCores = totalCores
        this.healthCorePadding = 5;
        this.healthCoreHeight = this.player.healthBarRect.h - 2* this.healthCorePadding;
        this.healthCoreWidth = ((this.player.healthBarRect.w - 2* this.healthCorePadding) / this.totalCores) - this.healthCorePadding;
        for(let i=0; i<this.totalCores; i++){
            this.healthCores.push(new HealthCore(this.player.healthBarRect.x + this.healthCorePadding + i*(this.healthCoreWidth + this.healthCorePadding), this.player.healthBarRect.y + this.healthCorePadding, this.healthCoreWidth, this.healthCoreHeight));
        }
        this.activeCoreIndex = this.totalCores - 1;
        this.defeatHandeled = false;
        //core death effect dependencies
        this.healthCoreFragments = [];
        this.maxFragmentSpeed = 300;
        this.fragmentActiveArea = this.player.game.wallRect;
        this.totalFragments = 20;
    }
    update(dt){
        if(this.player.defeted && !this.defeatHandeled){
            this.defeatHandeled = true;
            this.activeCoreIndex = Math.max(-1, this.activeCoreIndex-1);
            console.log(this.activeCoreIndex);
        }
        for(let i =0; i<=this.activeCoreIndex; i++){
            let coreXPos = this.player.healthBarRect.x + this.healthCorePadding + i*(this.healthCoreWidth + this.healthCorePadding);
            const core = this.healthCores[i];
            core.update(dt,coreXPos);
        }

        for(const fragment of this.healthCoreFragments){
            fragment.update(dt);
            if(fragment.top()>this.fragmentActiveArea.bottom() || fragment.dead){
                let index = this.healthCoreFragments.indexOf(fragment);
                if(index != -1){
                    this.healthCoreFragments.splice(index,1);
                }
            }
        }
    }
    render(ctx){
        for(let i =this.activeCoreIndex; i>=0; i--){
            const core = this.healthCores[i];
            core.render(ctx,this.player.shakeX,this.player.shakeY);
        }
        for(const fragment of this.healthCoreFragments){
            fragment.render(ctx);
        }
    }
    roundReset(){
        this.defeatHandeled = false;
    }
    reset(){
        this.defeatHandeled = false;
        this.activeCoreIndex = this.totalCores-1;
        for(let i =0; i<=this.activeCoreIndex; i++){
            let coreXPos = this.player.healthBarRect.x + this.healthCorePadding + i*(this.healthCoreWidth + this.healthCorePadding);
            const core = this.healthCores[i];
            core.update(0,coreXPos);
        }
        this.healthCoreFragments = [];
    }
}

class Player extends PhysicsRect{
    constructor(x,y,w,h,game){
        super(x,y,w,h);
        this.speedX = 500; // pixel per sec
        this.game = game;
        this.baseXPos = this.x;
        this.baseYPos = this.y;
        this.healthBarPadding = 5;
        this.healthBarRect = new Rect(this.x + this.healthBarPadding ,this.y + this.healthBarPadding ,this.w - 2*this.healthBarPadding,this.h - 2 * this.healthBarPadding);
        this.totalHealthCore = this.game.totalHealthCore;
        this.healthCoreManager = new HealthCoreManager(this.totalHealthCore,this);
        this.defeted = false;
        this.roundResetting = false;

        //vibrate effect
        this.shakeX = 0;
        this.shakeY = 0;
        this.vibrationStrength = 0;
        this.vibrating = false;
        this.vibrationDecayFactor = 0.2;
        //damage colour effect
        this.damageEffectTime = 1;
        this.damageEffectTimer = 0;
        this.colourChangeTime = 0.1; //seconds
        this.colourChangeTimer = 0;
        this.appliedDamageColor = false;
        this.inDamageEffect = false;
        //health core destroy effect
        this.name = this.y<this.game.canvas.h/2?Winner.TOP_PLAYER:Winner.BOTTOM_PLAYER;

        //ai dependencies
        this.aiRectPadding = 30;
        this.aiRect = new PhysicsRect(this.x + this.aiRectPadding, this.y, this.w - (2*this.aiRectPadding), this.h);
        this.aiUpdated = false;
        this.destinationX = null;
        this.aiUpdatable = false;
        this.bounceTimerStarted = false;
        this.waitForBounceTimer = 0;
        // ball trajectory equation
        this.c = 0;
        this.slope = 0;
    }
    updateHealthCoreSettings(coresNo){
        this.totalHealthCore = coresNo;
        this.healthCoreManager = new HealthCoreManager(this.totalHealthCore,this);
    }
    update(movementX, dt){

        this.xDir = movementX;
        let dis = this.speedX * dt * this.xDir;
        this.x += dis;
        this.commonUpdate(dt);
    }
    commonUpdate(dt){
        if(this.vibrating){
            let angle = 2* Math.PI * Math.random();
            this.shakeX = this.vibrationStrength * Math.cos(angle);
            this.shakeY = this.vibrationStrength * Math.sin(angle);
            this.vibrationStrength-=this.vibrationDecayFactor;
            if(this.vibrationStrength<=0){
                //vibration reset
                this.vibrating = false;
                this.shakeX = 0;
                this.shakeY = 0;
                this.vibrationStrength = 0;
            }
        }
        if(this.inDamageEffect){
            this.damageEffectTimer -= dt;
            if(this.damageEffectTimer<=0){
                //Damage Effect reset
                this.inDamageEffect = false;
                this.damageEffectTimer = 0;
                this.colourChangeTimer = 0;
            } 
            this.colourChangeTimer -= dt;
            if(this.colourChangeTimer <= 0){
                this.colourChangeTimer += this.colourChangeTime;
                this.appliedDamageColor = !this.appliedDamageColor;
            }
        }
        //collision with walls check
        if(this.wallCollisionLeft(this.game.wallRect)){
            this.x = this.game.wallRect.left();
        }
        if(this.wallCollisionRight(this.game.wallRect)){
            this.x = this.game.wallRect.right() - this.w;
        }
        this.healthBarRect.x = this.x + this.healthBarPadding;
        this.healthCoreManager.update(dt);
        if(this.defeted && !this.roundResetting){
            this.roundResetting = true;
            this.roundReset();
            if(!this.vibrating){
                this.vibrate(5);
                //applying damage effect timers
                this.damageEffectTimer = this.damageEffectTime;
                this.colourChangeTimer = this.colourChangeTime;
                this.inDamageEffect = true;
            }
            let fragmentX = this.healthCoreManager.healthCores[this.healthCoreManager.activeCoreIndex + 1].centerX();
            let fragmentY = this.healthCoreManager.healthCores[this.healthCoreManager.activeCoreIndex + 1].centerY();
            if(this.name == Winner.BOTTOM_PLAYER){
                for(let i= 0; i<this.healthCoreManager.totalFragments; i++){
                    this.healthCoreManager.healthCoreFragments.push(new HealthCoreFragment(fragmentX,fragmentY,4 * Math.random() + 1,4 * Math.random() +1,(Math.PI * Math.random())+Math.PI, this.healthCoreManager.maxFragmentSpeed * Math.random() + 100));
                }
            }else{
                for(let i= 0; i<this.healthCoreManager.totalFragments; i++){
                    this.healthCoreManager.healthCoreFragments.push(new HealthCoreFragment(fragmentX,fragmentY,4 * Math.random() + 1,4 * Math.random() +1,(Math.PI * Math.random()), this.healthCoreManager.maxFragmentSpeed * Math.random() + 100));
                }
            }
        }
    }
    updateForAi(dt){
        this.aiUpdatable = false;
        if(this.game.ball.isTouching && !this.bounceTimerStarted){
            this.bounceTimerStarted = true;
            this.waitForBounceTimer = 0.2; //sec
            this.aiUpdated = false;
        }
        this.waitForBounceTimer = Math.max(0,this.waitForBounceTimer-dt);
        if(this.waitForBounceTimer<=0 && this.bounceTimerStarted){
            this.aiUpdatable = true;
            this.bounceTimerStarted = false;
        }
        if(this.aiUpdatable && !this.aiUpdated){
            this.aiUpdated = true;
            this.calculateDestination();
        }
        if(this.destinationX!=null){
            if(this.destinationX>this.right()){
                this.xDir = 1;
            }else if(this.destinationX < this.left()){
                this.xDir = -1;
            }else {
                this.xDir = 0;
            }
            if(!this.aiRect.intersectsWithPoint(this.destinationX,this.centerY())){
                let dis = this.speedX * dt * this.xDir;
                this.x += dis;
            }
            this.aiRect.x = this.x + this.aiRectPadding;
        }
        this.commonUpdate(dt);
        ///left here. Win screen ra pause screen halna baki xa, ani ai power ghtauna bakixa
       
    }
    calculateDestination(){
        const ball = this.game.ball;
        console.log(ball.angle);
        this.slope = Math.tan(ball.angle);
        this.c = -ball.centerY() - (this.slope * ball.centerX());
        this.destinationX = -this.c/this.slope;
        console.log(this.game.ball.angle * (180 / Math.PI));
    }
    render(ctx){
        ctx.fillStyle = "white";
        ctx.fillRect(this.x + this.shakeX, this.y + this.shakeY, this.w, this.h);
        if(this.appliedDamageColor){
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(this.x + this.shakeX, this.y + this.shakeY, this.w, this.h);
        }
        this.healthCoreManager.render(ctx);
        // //temp code
        // if(this.aiUpdated && this.destinationX != null){
        //     ctx.fillStyle="green";
        //     ctx.fillRect(this.destinationX,0,10,10);
        // }
    }
    roundReset(){
        this.defeted = false;
        this.roundResetting = false;
        this.healthCoreManager.roundReset();
    }
    vibrate(value){
        this.vibrationStrength = Math.max(this.vibrationStrength, value);
        this.vibrating = true;
    }
    reset(){
        this.x = this.baseXPos;
        this.destinationX = null;
        this.healthBarRect.x = this.x + this.healthBarPadding;
        this.aiUpdated = false;
        this.appliedDamageColor = false;
        this.roundReset();
        this.healthCoreManager.reset();
    }
}

const Winner = {
    TOP_PLAYER : "TOP_PLAYER",
    BOTTOM_PLAYER : "BOTTOM_PLAYER" 
};

class Ball extends PhysicsRect{
    constructor(x,y,w,h,game){
        super(x,y,w,h);
        this.baseSpeed = 250;
        this.speed = this.baseSpeed;
        this.angle = Math.PI / 3; // measured with positive x axis and down in radian
        this.maxAngleDeviation = Math.PI/6;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.game = game;
        this.bpCollisionHandeled = false;
        this.tpCollisionHandeled = false;
        this.ballResetTimer = 0;
        this.ballResetting = false;
        //Speed increasing dependencies
        this.elapsedTimePerRound = 0;
        this.speedGrowthFactor = 50;
        this.speedIncreasingTime = 5;
        this.outOfCanvas = false;

        this.isTouching = false;
    }
    reset(){
        this.x = this.game.canvas.width/2;
        this.y = this.game.canvas.height/2;
        this.speed = this.baseSpeed;
        if(this.game.returningToMenu){
            this.angle = Math.PI/3;
        }else{
            this.angle = Math.PI/2;
        }
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.ballResetting = false;
        this.elapsedTimePerRound = 0;
        this.outOfCanvas = false;
        this.ballResetTimer = 0;
        this.isTouching = false;
    }
    updateForMenu(dt){
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        //wall collision check
        if(this.wallCollisionRight(this.game.wallRect)){
            this.velocityX *= -1;
            this.x = this.game.wallRect.right() - this.w;
        }
        if(this.wallCollisionLeft(this.game.wallRect)){
            this.velocityX *= -1;
            this.x = this.game.wallRect.left();
        }
        if(this.top() < this.game.wallRect.top()){
            this.velocityY *= -1;
        }
        if(this.bottom() > this.game.wallRect.bottom()){
            this.velocityY *= -1;
        }
        if(!this.intersects(this.game.wallRect)){
            this.game.returningToMenu = true;
            this.reset();
        }
    }
    update(dt){
        if(this.ballResetTimer>0){
            this.ballResetTimer = Math.max(0,this.ballResetTimer-dt);
            return;
        }
        if(this.ballResetting && this.ballResetTimer == 0){
            this.reset();
        }

        this.elapsedTimePerRound += dt;
        if(this.elapsedTimePerRound>this.speedIncreasingTime){
            this.elapsedTimePerRound -= this.speedIncreasingTime;
            this.speed += this.speedGrowthFactor;
        }
        
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        this.isTouching = false;
        //wall collision check
        if(this.wallCollisionRight(this.game.wallRect)){
            this.isTouching = true;
            this.velocityX *= -1;
            this.x = this.game.wallRect.right() - this.w;
            this.bpCollisionHandeled = false;
            this.angle = Math.PI - this.angle;
        }
        if(this.wallCollisionLeft(this.game.wallRect)){
            this.isTouching = true;
            this.velocityX *= -1;
            this.x = this.game.wallRect.left();
            this.bpCollisionHandeled = false;
            this.angle = Math.PI - this.angle;
        }
        if(this.bottom() < this.game.wallRect.top() || this.top() > this.game.wallRect.bottom()){
            this.outOfCanvas = true;
        }
        
        // bottom paddle collision
        if (this.intersects(this.game.bottomPlayer) && !this.bpCollisionHandeled) {

            this.bpCollisionHandeled = true;
    
            const paddle = this.game.bottomPlayer;

            if(this.centerX() < paddle.centerX()){
                let relative = (this.centerX() - paddle.x) / (paddle.w /2);
                this.angle = ((Math.PI/3) * relative) + this.maxAngleDeviation;
            }else if(this.centerX() > paddle.centerX()){
                let relative = (this.centerX() - paddle.centerX()) / (paddle.w/2);
                this.angle = (((Math.PI * 0.5) - this.maxAngleDeviation) * relative) + (Math.PI/2);
            }
            this.velocityX = this.speed * Math.cos(this.angle);
            this.velocityY = -Math.abs(this.speed * Math.sin(this.angle));
            this.y = paddle.y - this.h;
            this.isTouching = true;
        }
        // top paddle collision
        if (this.intersects(this.game.topPlayer) && !this.tpCollisionHandeled) {

            this.tpCollisionHandeled = true;
            
            const paddle = this.game.topPlayer;

            if(this.centerX() < paddle.centerX()){
                let relative = (this.centerX() - paddle.x) / (paddle.w /2);
                this.angle = (2*Math.PI - this.maxAngleDeviation) - (2*Math.PI - this.maxAngleDeviation - (3*Math.PI/2))*relative;
            }else if(this.centerX() > paddle.centerX()){
                let relative = (this.centerX() - paddle.centerX()) / (paddle.w/2);
                this.angle = (3*Math.PI/2) - (((3*Math.PI/2)-(Math.PI + this.maxAngleDeviation)) * relative);
            }
            this.velocityX = this.speed * Math.cos(this.angle);
            this.velocityY = Math.abs(this.speed * Math.sin(this.angle));
            this.y = paddle.bottom();
            this.isTouching = true;
        }

        // reset flags when ball is not touching paddles
        if (!this.intersects(this.game.bottomPlayer)) {
            this.bpCollisionHandeled = false;
        }
        if (!this.intersects(this.game.topPlayer)) {
            this.tpCollisionHandeled = false;
        }
    }

    render(ctx){
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x,this.y,this.w,this.h);
    }
}

class ScoreHandeler {
    constructor(game,winScore){
        this.game = game;
        this.topScore = 0;
        this.bottomScore = 0;
        this.lineGap = 10;
        this.lineWidth = 25;
        this.lineHeight = 5;
        this.nLines = this.game.canvas.width / (this.lineWidth + this.lineGap);
        this.lineY = (this.game.canvas.height/2) - (this.lineHeight/2);
        this.lineX = 0;
        this.scoreHandeled = false;
        this.scoreX = this.game.canvas.width - 50;
        this.scoreY = (this.game.canvas.height / 2) - 30;
        this.gameWinner = null;
        this.winScore = winScore;
        this.wallRect = this.game.wallRect;
    }
    update(){
        if(!this.game.ball.outOfCanvas) return;
        if(this.game.ball.ballResetting){
            return;
        }else{
            this.scoreHandeled = false;
        }

        let roundWinner = this.game.ball.bottom()<this.wallRect.y?Winner.BOTTOM_PLAYER:Winner.TOP_PLAYER;
        if(roundWinner == Winner.TOP_PLAYER){
            if(!this.scoreHandeled){
                this.topScore++;
                this.scoreHandeled = true;
                this.game.bottomPlayer.defeted = true;
                if(this.topScore>=this.winScore){
                    this.gameWinner = Winner.TOP_PLAYER;
                }
            }
        }else{
            if(!this.scoreHandeled){
                this.bottomScore++;
                this.scoreHandeled = true;
                this.game.topPlayer.defeted = true;
                if(this.bottomScore>=this.winScore){
                    this.gameWinner = Winner.BOTTOM_PLAYER;
                }
            }
        }
        this.game.ball.ballResetTimer = 2;
        this.game.ball.ballResetting = true;
    }
    render(ctx){
        //dotted line rendering
        ctx.fillStyle = "white";
        for(let i = 0; i<this.nLines; i++){
            ctx.fillRect(this.lineX + (i*(this.lineWidth + this.lineGap)), this.lineY, this.lineWidth, this.lineHeight);
        }
        ctx.fillStyle = "cyan";
        ctx.font = "25px bold";
        ctx.fillText(this.topScore,this.scoreX, this.scoreY,500,20);
        ctx.fillText(this.bottomScore,this.scoreX, this.scoreY + 60,500,20);
    }
    reset(){
        this.topScore = 0;
        this.bottomScore = 0;
        this.gameWinner = null;
        this.scoreHandeled = false;
    }
}

class GameInputs {
    constructor(){
        this.bpLeftPressed = false;
        this.bpRightPressed = false;
        this.tpLeftPressed = false;
        this.tpRightHandeled = false;
        this.tpLeftHandeled = false;
        this.tpRightPressed = false;
        this.upArrowPressed = false;
        this.upArrowHandeled = false;
        this.downArrowPressed = false;
        this.downArrowHandeled = false;
        this.enterPressed = false;
        this.enterHandeled = false;
        this.pausePressed = false;
        this.pauseHandeled = false;
    }
}
const GameMode = {
    AI : "AI",
    PVP : "PVP",
    SETTINGS : "SETTINGS",
    MENU : "MENU"
}
const HoverState = {
    BRIGHTENING : "BRIGHTENING",
    DIMMING : "DIMMING"
}

class MenuMode {
    constructor(game){
        this.game = game;
        this.inputs = new GameInputs();
        this.initMenuScreen();
        this.bindInputs();
        this.game.returningToMenu = false;
    }
    bindInputs(){
        window.addEventListener("keydown", (e) => {
        switch(e.key){
            case "ArrowUp":
                this.inputs.upArrowPressed = true;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = true;
                break;

            case "Enter":
                this.inputs.enterPressed = true;
                break;
            }
        });

        window.addEventListener("keyup", (e) => {
        switch(e.key){
            case "ArrowUp":
                this.inputs.upArrowPressed = false;
                this.inputs.upArrowHandeled = false;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = false;
                this.inputs.downArrowHandeled = false;
                break;

            case "Enter":
                this.inputs.enterPressed = false;
                break;
            }
        });
    }
    initMenuScreen(){
        this.pvpBtn = new GameButton(this.game.canvas.width/2,200,130,25,"P Vs P");
        this.pvpBtn.setPadding(32,20);
        this.aiBtn = new GameButton(this.game.canvas.width/2,250,130,25,"P Vs AI");
        this.aiBtn.setPadding(28,20);
        this.playBtn = new GameButton(0,0,0,0,"");
        this.settingsBtn = new GameButton(this.game.canvas.width/2,300,130,25,"Settings");
        this.settingsBtn.setPadding(26,19);
        this.nBtns = 3;
        //Hover dependencies
        this.hoverIndex = 0;
        this.hoverAnimTimer = 0.08;
        this.hoverAnimTime = 0;
        this.maxHoverAlphaIndex = 0.4
        this.hoverAlphaChangeFactor = 0.05;
        this.hoverAlphaIndex = 0.0;
        this.hoverState = HoverState.BRIGHTENING;
    }

    update(dt) {
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            switch(this.hoverIndex){
                case(0):
                    this.game.topPlayer.reset();
                    this.game.bottomPlayer.reset();
                    this.game.activeMode = new PvPMode(this.game);
                    break;
                case(1):
                    this.game.activeMode = new AiMode(this.game);
                    break;
                case(2):
                    this.game.activeMode = new SettingsMode(this.game);
                    break;
            }
        }

        if(this.inputs.upArrowPressed && !this.inputs.upArrowHandeled){
            this.inputs.upArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + this.nBtns -1) % this.nBtns;
        }
        if(this.inputs.downArrowPressed && !this.inputs.downArrowHandeled){
            this.inputs.downArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        this.hoverAnimTime += dt;
        if(this.hoverAnimTime >= this.hoverAnimTimer){
            this.hoverAnimTime -= this.hoverAnimTimer;
            if(this.hoverState == HoverState.BRIGHTENING){
                this.hoverAlphaIndex = Math.min(this.hoverAlphaIndex + this.hoverAlphaChangeFactor, this.maxHoverAlphaIndex)
                this.hoverState = this.hoverAlphaIndex>=this.maxHoverAlphaIndex?HoverState.DIMMING:HoverState.BRIGHTENING;
            }else{
                this.hoverAlphaIndex = Math.max(this.hoverAlphaIndex - this.hoverAlphaChangeFactor, 0);
                this.hoverState = this.hoverAlphaIndex<=0?HoverState.BRIGHTENING:HoverState.DIMMING;
            }
        }
        this.game.ball.updateForMenu(dt);
    }

    render(ctx){
        ctx.clearRect(0,0,this.game.canvas.width, this.game.canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.game.canvas.width, this.game.canvas.height);

        this.game.topPlayer.render(ctx);
        this.game.bottomPlayer.render(ctx);
        this.game.ball.render(ctx);

        ctx.font = "80px bold";
        ctx.fillStyle = "cyan";
        ctx.fillText("PONG",this.game.canvas.width/2 - 105, 130);

        //buttons
        this.pvpBtn.render(ctx);
        this.aiBtn.render(ctx);
        this.settingsBtn.render(ctx);

        //hover effect
        ctx.fillStyle = "rgba(0, 255, 255,"+this.hoverAlphaIndex+")";
        switch(this.hoverIndex){
            case(0):
                ctx.fillRect(0,this.pvpBtn.y, this.game.SCREEN_WIDTH, this.pvpBtn.h);
                break;
            case(1):
                ctx.fillRect(0,this.aiBtn.y, this.game.SCREEN_WIDTH, this.aiBtn.h);
                break;
            case(2):
                ctx.fillRect(0,this.settingsBtn.y, this.game.SCREEN_WIDTH, this.settingsBtn.h);
                break;
        }
    }
}

class PvPMode{
    constructor(game){
        this.game = game;
        this.scoreHandeler = new ScoreHandeler(this.game,this.game.totalHealthCore);
        this.inputs = new GameInputs();
        this.bindInputs();
        this.game.ball.reset();
        this.hoverIndex = 0;
        this.hoverAnimTimer = 0.08;
        this.hoverAnimTime = 0;
        this.maxHoverAlphaIndex = 0.4
        this.hoverAlphaChangeFactor = 0.05;
        this.hoverAlphaIndex = 0.0;
        this.hoverState = HoverState.BRIGHTENING;
        this.nBtns = 1;
        this.gameFinished = false;
        this.startBtn = new GameButton(this.game.canvas.width/2,this.game.canvas.height/2 - 12,130,25,"Play");
        this.startBtn.setPadding(38,20);
        this.gameStarted = false;
        //Tutorial Screen
        this.initTutorialScreen();
        this.winEffectApplied = false;
    }
    initTutorialScreen(){
        this.tutorialRectPadding = 55;
        this.tutorialScreenU = new Rect(this.tutorialRectPadding,this.tutorialRectPadding,this.game.canvas.width - 2 * this.tutorialRectPadding, this.game.canvas.height/2 - 2 * this.tutorialRectPadding);
        let width = 40;
        let height = 40;
        let padding = 0;
        this.leftTutorialBtnU = new GameButton(this.tutorialScreenU.centerX() - padding - width, this.tutorialScreenU.centerY() - height/2, width, height, "<-");
        this.rightTutorialBtnU = new GameButton(this.tutorialScreenU.centerX() + width + padding, this.tutorialScreenU.centerY() - height/2, width, height, "->");
        this.leftTutorialBtnU.setPadding(11,28);
        this.rightTutorialBtnU.setPadding(11,28);
        this.tutorialScreenD = new Rect(this.tutorialRectPadding,this.tutorialRectPadding + this.game.canvas.width/2 ,this.game.canvas.width - 2 * this.tutorialRectPadding, this.game.canvas.height/2 - 2 * this.tutorialRectPadding);
        this.leftTutorialBtnD = new GameButton(this.tutorialScreenD.centerX() - padding - width, this.tutorialScreenD.centerY() - height/2, width, height, "A");
        this.rightTutorialBtnD = new GameButton(this.tutorialScreenD.centerX() + width + padding, this.tutorialScreenD.centerY() - height/2, width, height, "D");
        this.leftTutorialBtnD.setPadding(11,28);
        this.rightTutorialBtnD.setPadding(11,28);

        this.game.hoverEffect.style.display = "block";
    }

    bindInputs(){
        window.addEventListener("keydown", (e) => {
        switch(e.key){
            // Bottom player (A / D)
            case "a":
                this.inputs.bpLeftPressed = true;
                break;
            case "d":
                this.inputs.bpRightPressed = true;
                break;

            // Top player (Arrow keys)
            case "ArrowLeft":
                this.inputs.tpLeftPressed = true;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = true;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = true;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = true;
                break;
            //Pause ESC
            case "Escape":
                this.inputs.pausePressed = true;
                break;
            // Enter
            case "Enter":
                this.inputs.enterPressed = true;
                break;
            }
        });

        window.addEventListener("keyup", (e) => {
        switch(e.key){
            case "a":
                this.inputs.bpLeftPressed = false;
                break;
            case "d":
                this.inputs.bpRightPressed = false;
                break;

            case "ArrowLeft":
                this.inputs.tpLeftPressed = false;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = false;
                break;
            case "Escape":
                this.inputs.pausePressed = false;
                this.inputs.pauseHandeled = false;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = false;
                this.inputs.upArrowHandeled = false;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = false;
                this.inputs.downArrowHandeled = false;
                break;
            case "Enter":
                this.inputs.enterPressed = false;
                this.inputs.enterHandeled = false;
                break;
            }
        });
    }

    update(dt){
        if(this.scoreHandeler.gameWinner!=null) {
            //Somebody won
            this.updateWinScreen(dt);
            this.game.topPlayer.update(0, dt);
            this.game.bottomPlayer.update(0, dt);
            return;
        }
        if(!this.gameStarted){
            this.updateTutorialScreen(dt);
            return;
        }
        if(this.inputs.pausePressed && !this.inputs.pauseHandeled){
            this.onPausedState = !this.onPausedState;
            if(this.onPausedState) {
                this.setPauseOverlay();
            }else{
                this.resetPauseOverlay();
                this.hoverIndex = 0;
            }
            this.inputs.pauseHandeled = true;
            
        }
        if(this.onPausedState){
            this.updatePausedScreen(dt);
            return;
        }

        this.scoreHandeler.update();
        let left,right;
        left = this.inputs.tpLeftPressed?1:0;
        right = this.inputs.tpRightPressed?1:0;
        this.game.topPlayer.update(right - left, dt);
        left = this.inputs.bpLeftPressed?1:0;
        right = this.inputs.bpRightPressed?1:0;
        this.game.bottomPlayer.update(right - left, dt);
        this.game.ball.update(dt);
    }
    updateHoverAnimation(dt){
        if(this.inputs.upArrowPressed && !this.inputs.upArrowHandeled){
            this.inputs.upArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.inputs.downArrowPressed && !this.inputs.downArrowHandeled){
            this.inputs.downArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.gameStarted){
            this.game.hoverEffect.style.top = this.game.hoverTopCoordinate + (this.hoverIndex * 50) + "px";
        }else{
            this.game.hoverEffect.style.top = this.game.hoverTopCoordinate+ 37 + "px";
        }
        
        //hover Animation
        this.hoverAnimTime += dt;
        if(this.hoverAnimTime >= this.hoverAnimTimer){
            this.hoverAnimTime -= this.hoverAnimTimer;
            if(this.hoverState == HoverState.BRIGHTENING){
                this.hoverAlphaIndex = Math.min(this.hoverAlphaIndex + this.hoverAlphaChangeFactor, this.maxHoverAlphaIndex)
                this.hoverState = this.hoverAlphaIndex>=this.maxHoverAlphaIndex?HoverState.DIMMING:HoverState.BRIGHTENING;
            }else{
                this.hoverAlphaIndex = Math.max(this.hoverAlphaIndex - this.hoverAlphaChangeFactor, 0);
                this.hoverState = this.hoverAlphaIndex<=0?HoverState.BRIGHTENING:HoverState.DIMMING;
            }
        }
        this.game.hoverEffect.style.background = "rgba(0,255,255,"+this.hoverAlphaIndex+")";
    }
    updateTutorialScreen(dt){
        this.updateHoverAnimation(dt);
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            if(this.hoverIndex==0){
                //Start btn pressed
                this.gameStarted = true;
                this.nBtns = 2;
                this.game.hoverEffect.style.display = "none";
            }
        }
    }
    updatePausedScreen(dt){
        this.updateHoverAnimation(dt);
        //State changes
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            if(this.hoverIndex==0){
                //continue pressed
                this.resetPauseOverlay();
                this.onPausedState = false;
            }else{
                //menu pressed
                this.resetPauseOverlay();
                this.game.returningToMenu = true;
                this.game.topPlayer.reset();
                this.game.bottomPlayer.reset();
                this.game.activeMode = new MenuMode(this.game);
            }
        }
    }

    updateWinScreen(dt){
        this.updateHoverAnimation(dt);
        //State changes
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            this.game.returningToMenu = true;
            if(this.hoverIndex==0){
                //play again pressed
                this.resetMode();
                this.resetWinOverlay();
            }else{
                //menu pressed
                this.game.returningToMenu = true;
                this.resetWinOverlay();
                this.game.ball.reset();
                this.game.topPlayer.reset();
                this.game.bottomPlayer.reset();
                this.game.activeMode = new MenuMode(this.game);
            }
        }

    }
    resetPauseOverlay(){
        this.resetBlurOverlay();
        this.game.continueBtn.style.display = "none";
        this.game.menuBtn.style.display = "none";
        this.game.hoverEffect.style.display = "none";
    }
    setPauseOverlay(){
        this.setBlurOverlay();
        this.game.continueBtn.style.display = "block";
        this.game.menuBtn.style.display = "block";
        this.game.hoverEffect.style.display = "block";
    }
    setBlurOverlay(){
        document.getElementById("pauseOverlay").style.display = "block";
    }
    resetBlurOverlay(){
        document.getElementById("pauseOverlay").style.display = "none";
    }
    render(ctx){
        ctx.clearRect(0,0,this.game.canvas.width, this.game.canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.game.canvas.width, this.game.canvas.height);

        this.game.topPlayer.render(ctx);
        this.game.bottomPlayer.render(ctx);
        if(!this.gameStarted){
            this.renderTutorialScreen(ctx);
            return;
        }
        this.scoreHandeler.render(ctx);
        this.game.ball.render(ctx);

        if(this.onPausedState){
            this.renderPausedScreenOverlay(ctx);
        }

        if(this.scoreHandeler.gameWinner != null){
            this.renderWinScreenOverlay(ctx);
        }

    }
    renderTutorialScreen(ctx){
        //Tutorial render
        ctx.fillStyle = "rgba(0,255,255,0.3)";
        ctx.fillRect(this.tutorialScreenU.x,this.tutorialScreenU.y,this.tutorialScreenU.w,this.tutorialScreenU.h);
        ctx.fillRect(this.tutorialScreenD.x,this.tutorialScreenD.y,this.tutorialScreenD.w,this.tutorialScreenD.h);
        ctx.fillStyle = "white";
        ctx.fillText("Left",this.leftTutorialBtnU.x - 85,this.leftTutorialBtnU.y + 30);
        ctx.fillText("Right",this.rightTutorialBtnU.x + 35,this.rightTutorialBtnU.y + 30);
        ctx.fillText("Left",this.leftTutorialBtnD.x - 85,this.leftTutorialBtnD.y + 30);
        ctx.fillText("Right",this.rightTutorialBtnD.x + 35,this.rightTutorialBtnD.y + 30);

        //this.leftTutorialBtn.render(ctx);
        this.rightTutorialBtnU.render(ctx);
        this.leftTutorialBtnU.render(ctx);
        this.rightTutorialBtnD.render(ctx);
        this.leftTutorialBtnD.render(ctx);

        //start button
        this.startBtn.render(ctx);
    }
    renderPausedScreenOverlay(ctx){
        ctx.font = "80px bold";
        ctx.fillStyle = "cyan";
        ctx.fillText("Game Paused",30, 130);
    }


    renderWinScreenOverlay(ctx){
        if(!this.winEffectApplied){
            this.setWinOverlay();
            this.game.winnerText.style.left = this.game.canvasLeft + this.tutorialScreenU.centerX() - 34;
            this.game.loserText.style.left = this.game.canvasLeft + this.tutorialScreenU.centerX() -30;
            if(this.scoreHandeler.gameWinner==Winner.TOP_PLAYER){
                this.game.winnerText.style.top = this.game.canvasTop + this.tutorialScreenU.centerY() - 30;
                this.game.loserText.style.top = this.game.canvasTop + this.tutorialScreenD.centerY();
            }else{
                this.game.winnerText.style.top = this.game.canvasTop + this.tutorialScreenD.centerY();
                this.game.loserText.style.top = this.game.canvasTop + this.tutorialScreenU.centerY() - 30;
            }
            this.game.winnerText.style.display = "block";
            this.game.loserText.style.display = "block";
            this.winEffectApplied = true;
        }
    }
    setWinOverlay(){
        this.setBlurOverlay();
        //renaming continue to play again
        this.game.continueBtn.innerText = "Play Again";
        this.game.continueBtn.style.display = "block";
        this.game.menuBtn.style.display = "block";
        this.game.hoverEffect.style.display = "block";
    }
    resetWinOverlay(){
        this.game.winnerText.style.display = "none";
        this.game.loserText.style.display = "none";
        this.game.continueBtn.innerText = "Continue";
        this.resetPauseOverlay();

    }
    resetMode(){
        this.scoreHandeler.reset();
        this.game.returningToMenu = false;
        this.winEffectApplied = false;
        this.game.ball.reset();
        this.game.topPlayer.reset();
        this.game.bottomPlayer.reset();
    }
}
//--------------------------------------------------------  AI MODE  ------------------------------------------------------------
class AiMode{
    constructor(game){
        this.game = game;
        this.inputs = new GameInputs();
        this.bindInputs();
        this.scoreHandeler = new ScoreHandeler(this.game, this.game.totalHealthCore);
        //tutorial Screen;
        this.initTutorialScreen();
        //Win screen
        this.winEffectApplied = false;

    }
    bindInputs(){
        window.addEventListener("keydown", (e) => {
        switch(e.key){
            // Bottom player (A / D)
            case "a":
                this.inputs.bpLeftPressed = true;
                break;
            case "d":
                this.inputs.bpRightPressed = true;
                break;

            // Top player (Arrow keys)
            case "ArrowLeft":
                this.inputs.tpLeftPressed = true;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = true;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = true;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = true;
                break;
            //Pause ESC
            case "Escape":
                this.inputs.pausePressed = true;
                break;
            // Enter
            case "Enter":
                this.inputs.enterPressed = true;
                break;
            }
        });

        window.addEventListener("keyup", (e) => {
        switch(e.key){
            case "a":
                this.inputs.bpLeftPressed = false;
                break;
            case "d":
                this.inputs.bpRightPressed = false;
                break;

            case "ArrowLeft":
                this.inputs.tpLeftPressed = false;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = false;
                break;
            case "Escape":
                this.inputs.pausePressed = false;
                this.inputs.pauseHandeled = false;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = false;
                this.inputs.upArrowHandeled = false;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = false;
                this.inputs.downArrowHandeled = false;
                break;
            case "Enter":
                this.inputs.enterPressed = false;
                this.inputs.enterHandeled = false;
                break;
            }
        });
    }
    initTutorialScreen(){
        this.tutorialRectPadding = 55;
        this.tutorialScreenU = new Rect(this.tutorialRectPadding,this.tutorialRectPadding,this.game.canvas.width - 2 * this.tutorialRectPadding, this.game.canvas.height/2 - 2 * this.tutorialRectPadding);
        let width = 40;
        let height = 40;
        let padding = 0;
        
        this.tutorialScreenD = new Rect(this.tutorialRectPadding,this.tutorialRectPadding + this.game.canvas.width/2 ,this.game.canvas.width - 2 * this.tutorialRectPadding, this.game.canvas.height/2 - 2 * this.tutorialRectPadding);
        this.leftTutorialBtnD = new GameButton(this.tutorialScreenD.centerX() - padding - width, this.tutorialScreenD.centerY() - height/2, width, height, "A");
        this.rightTutorialBtnD = new GameButton(this.tutorialScreenD.centerX() + width + padding, this.tutorialScreenD.centerY() - height/2, width, height, "D");
        this.leftTutorialBtnD.setPadding(11,28);
        this.rightTutorialBtnD.setPadding(11,28);

        this.startBtn = new GameButton(this.game.canvas.width/2,210,130,25,"Start");
        this.startBtn.setPadding(40,20);
        this.returnToMainMenuBtn = new GameButton(this.game.canvas.width/2,260,130,25,"Back to Menu");
        this.returnToMainMenuBtn.setPadding(6,20);
        this.nBtns = 2;
        //Hover dependencies
        this.hoverIndex = 0;
        this.hoverAnimTimer = 0.08;
        this.hoverAnimTime = 0;
        this.maxHoverAlphaIndex = 0.4
        this.hoverAlphaChangeFactor = 0.05;
        this.hoverAlphaIndex = this.maxHoverAlphaIndex;
        this.hoverState = HoverState.DIMMING;

        this.onAiMenu = true;

        //left here
    }
    update(dt){
        if(this.onAiMenu){
            this.updateAiMenu(dt);
            return;
        }
        if(this.inputs.pausePressed && !this.inputs.pauseHandeled){
            this.onPausedState = !this.onPausedState;
            if(this.onPausedState) {
                this.setPauseOverlay();
            }else{
                this.resetPauseOverlay();
                this.hoverIndex = 0;
            }
            this.inputs.pauseHandeled = true;
            
        }
        if(this.onPausedState){
            this.updatePausedScreen(dt);
            return;
        }

        if(this.scoreHandeler.gameWinner!=null) {
            //Somebody won
            this.updateWinScreen(dt);
            this.game.topPlayer.update(0, dt);
            this.game.bottomPlayer.update(0, dt);
            return;
        }
        this.scoreHandeler.update();
        //Ai update
        this.game.topPlayer.updateForAi(dt);

        let left = this.inputs.bpLeftPressed?1:0;
        let right = this.inputs.bpRightPressed?1:0;
        this.game.bottomPlayer.update(right - left, dt);
        this.game.ball.update(dt);
    }
    updateAiMenu(dt){
        //Buttons press check
        this.updateHoverAnimation(dt);
        if(this.inputs.upArrowPressed && !this.inputs.upArrowHandeled){
            this.inputs.upArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.inputs.downArrowPressed && !this.inputs.downArrowHandeled){
            this.inputs.downArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            if(this.hoverIndex==0){
                this.onAiMenu = false;
                this.game.ball.reset();
            }else{
                this.game.activeMode = new MenuMode(this.game);
            }
        }
    }
    updateHoverAnimation(dt){
        this.hoverAnimTime += dt;
        if(this.hoverAnimTime >= this.hoverAnimTimer){
            this.hoverAnimTime -= this.hoverAnimTimer;
            if(this.hoverState == HoverState.BRIGHTENING){
                this.hoverAlphaIndex = Math.min(this.hoverAlphaIndex + this.hoverAlphaChangeFactor, this.maxHoverAlphaIndex)
                this.hoverState = this.hoverAlphaIndex>=this.maxHoverAlphaIndex?HoverState.DIMMING:HoverState.BRIGHTENING;
            }else{
                this.hoverAlphaIndex = Math.max(this.hoverAlphaIndex - this.hoverAlphaChangeFactor, 0);
                this.hoverState = this.hoverAlphaIndex<=0?HoverState.BRIGHTENING:HoverState.DIMMING;
            }
        }
        this.game.hoverEffect.style.top = this.game.hoverTopCoordinate + (this.hoverIndex * 50) + "px";
    }
    updateGeneralHoverAnimation(dt){
        if(this.inputs.upArrowPressed && !this.inputs.upArrowHandeled){
            this.inputs.upArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.inputs.downArrowPressed && !this.inputs.downArrowHandeled){
            this.inputs.downArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        //hover Animation
        this.updateHoverAnimation(dt);
        this.game.hoverEffect.style.background = "rgba(0,255,255,"+this.hoverAlphaIndex+")";
    }
    updateWinScreen(dt){
        this.updateGeneralHoverAnimation(dt);
        //State changes
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            this.game.returningToMenu = true;
            if(this.hoverIndex==0){
                //play again pressed
                this.resetMode();
                this.resetWinOverlay();
            }else{
                //menu pressed
                this.game.returningToMenu = true;
                this.resetWinOverlay();
                this.game.ball.reset();
                this.game.topPlayer.reset();
                this.game.bottomPlayer.reset();
                this.game.activeMode = new MenuMode(this.game);
            }
        }

    }
    updatePausedScreen(dt){
        this.updateGeneralHoverAnimation(dt);
        //State changes
        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            if(this.hoverIndex==0){
                //continue pressed
                this.resetPauseOverlay();
                this.onPausedState = false;
            }else{
                //menu pressed
                this.resetPauseOverlay();
                this.game.returningToMenu = true;
                this.game.topPlayer.reset();
                this.game.bottomPlayer.reset();
                this.game.activeMode = new MenuMode(this.game);
            }
        }
    }
    render(ctx){
        ctx.clearRect(0,0,this.game.canvas.width, this.game.canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.game.canvas.width, this.game.canvas.height);

        this.game.topPlayer.render(ctx);
        this.game.bottomPlayer.render(ctx);
        
        if(this.onAiMenu){
            this.renderAiMenu(ctx);
            return;
        }
        this.scoreHandeler.render(ctx);
        this.game.ball.render(ctx);

        if(this.onPausedState){
            this.renderPausedScreenOverlay(ctx);
        }

        if(this.scoreHandeler.gameWinner != null){
            this.renderWinScreenOverlay(ctx);
        }
    }
    renderPausedScreenOverlay(ctx){
        ctx.font = "80px bold";
        ctx.fillStyle = "cyan";
        ctx.fillText("Game Paused",30, 130);
    }
    renderWinScreenOverlay(ctx){
        if(!this.winEffectApplied){
            this.setWinOverlay();
            this.game.winnerText.style.left = this.game.canvasLeft + this.tutorialScreenU.centerX() - 34;
            this.game.loserText.style.left = this.game.canvasLeft + this.tutorialScreenU.centerX() -30;
            if(this.scoreHandeler.gameWinner==Winner.TOP_PLAYER){
                this.game.winnerText.style.top = this.game.canvasTop + this.tutorialScreenU.centerY() - 30;
                this.game.loserText.style.top = this.game.canvasTop + this.tutorialScreenD.centerY();
            }else{
                this.game.winnerText.style.top = this.game.canvasTop + this.tutorialScreenD.centerY();
                this.game.loserText.style.top = this.game.canvasTop + this.tutorialScreenU.centerY() - 30;
            }
            this.game.winnerText.style.display = "block";
            this.game.loserText.style.display = "block";
            this.winEffectApplied = true;
        }
    }
    setWinOverlay(){
        this.setBlurOverlay();
        //renaming continue to play again
        this.game.continueBtn.innerText = "Play Again";
        this.game.continueBtn.style.display = "block";
        this.game.menuBtn.style.display = "block";
        this.game.hoverEffect.style.display = "block";
    }
    resetWinOverlay(){
        this.game.winnerText.style.display = "none";
        this.game.loserText.style.display = "none";
        this.game.continueBtn.innerText = "Continue";
        this.resetPauseOverlay();

    }
    resetPauseOverlay(){
        this.resetBlurOverlay();
        this.game.continueBtn.style.display = "none";
        this.game.menuBtn.style.display = "none";
        this.game.hoverEffect.style.display = "none";
    }
    setPauseOverlay(){
        this.setBlurOverlay();
        this.game.continueBtn.style.display = "block";
        this.game.menuBtn.style.display = "block";
        this.game.hoverEffect.style.display = "block";
    }
    setBlurOverlay(){
        document.getElementById("pauseOverlay").style.display = "block";
    }
    resetBlurOverlay(){
        document.getElementById("pauseOverlay").style.display = "none";
    }
    renderAiMenu(ctx){
        ctx.fillStyle = "rgba(0,255,255,0.3)";
        ctx.fillRect(this.tutorialScreenU.x,this.tutorialScreenU.y,this.tutorialScreenU.w,this.tutorialScreenU.h);
        ctx.fillRect(this.tutorialScreenD.x,this.tutorialScreenD.y,this.tutorialScreenD.w,this.tutorialScreenD.h);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillText("Computer",this.tutorialScreenU.centerX() - 50 , this.tutorialScreenU.centerY() + 10);
        ctx.fillText("Left",this.leftTutorialBtnD.x - 85,this.leftTutorialBtnD.y + 30);
        ctx.fillText("Right",this.rightTutorialBtnD.x + 35,this.rightTutorialBtnD.y + 30);
        this.startBtn.render(ctx);
        this.returnToMainMenuBtn.render(ctx);
        this.leftTutorialBtnD.render(ctx);
        this.rightTutorialBtnD.render(ctx);

        this.renderHoverAnimation(ctx);

    }
    renderHoverAnimation(ctx){
        ctx.fillStyle = "rgba(0,255,255,"+ this.hoverAlphaIndex +")";
        ctx.fillRect(0,this.startBtn.y + this.hoverIndex * (this.startBtn.h *2), this.game.canvas.width, this.startBtn.h);
    }

    resetMode(){
        this.scoreHandeler.reset();
        this.game.returningToMenu = false;
        this.winEffectApplied = false;
        this.game.ball.reset();
        this.game.topPlayer.reset();
        this.game.bottomPlayer.reset();
    }
}

//--------------------------------------------------------  SETTINGS MODE -------------------------------------------------------
class SettingsMode{
    constructor(game){
        this.game = game;
        this.inputs = new GameInputs();
        this.bindInputs();
        this.maxCoreNo = 5;
        this.totalHealthCore = this.game.totalHealthCore;
        this.healthCoreSettingBtn = new GameButton(this.game.canvas.width/2 - 40,210,130,25,"Player's life");
        this.healthCoreSettingBtn.setPadding(6,20);
        this.returnToMainMenuBtn = new GameButton(this.game.canvas.width/2 - 40,270,130,25,"Back to Menu");
        this.returnToMainMenuBtn.setPadding(6,20);
        this.nBtns = 2;
        //Hover dependencies
        this.hoverIndex = 0;
        this.hoverAnimTimer = 0.08;
        this.hoverAnimTime = 0;
        this.maxHoverAlphaIndex = 0.4
        this.hoverAlphaChangeFactor = 0.05;
        this.hoverAlphaIndex = this.maxHoverAlphaIndex;
        this.hoverState = HoverState.DIMMING;
    }
    bindInputs(){
        window.addEventListener("keydown", (e) => {
        switch(e.key){
            // Bottom player (A / D)
            case "a":
                this.inputs.bpLeftPressed = true;
                break;
            case "d":
                this.inputs.bpRightPressed = true;
                break;

            // Top player (Arrow keys)
            case "ArrowLeft":
                this.inputs.tpLeftPressed = true;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = true;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = true;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = true;
                break;
            //Pause ESC
            case "Escape":
                this.inputs.pausePressed = true;
                break;
            // Enter
            case "Enter":
                this.inputs.enterPressed = true;
                break;
            }
        });

        window.addEventListener("keyup", (e) => {
        switch(e.key){
            case "a":
                this.inputs.bpLeftPressed = false;
                break;
            case "d":
                this.inputs.bpRightPressed = false;
                break;

            case "ArrowLeft":
                this.inputs.tpLeftPressed = false;
                this.inputs.tpLeftHandeled = false;
                break;
            case "ArrowRight":
                this.inputs.tpRightPressed = false;
                this.inputs.tpRightHandeled = false;
                break;
            case "Escape":
                this.inputs.pausePressed = false;
                this.inputs.pauseHandeled = false;
                break;
            case "ArrowUp":
                this.inputs.upArrowPressed = false;
                this.inputs.upArrowHandeled = false;
                break;
            case "ArrowDown":
                this.inputs.downArrowPressed = false;
                this.inputs.downArrowHandeled = false;
                break;
            case "Enter":
                this.inputs.enterPressed = false;
                this.inputs.enterHandeled = false;
                break;
            }
        });
    }
    update(dt){
        this.updateHoverAnimation(dt);

        this.game.topPlayer.update(0,dt);
        this.game.bottomPlayer.update(0,dt);

        if(this.inputs.enterPressed && !this.inputs.enterHandeled){
            this.inputs.enterHandeled = true;
            if(this.hoverIndex==1){
                this.game.activeMode = new MenuMode(this.game);
            }
        }
        if(this.hoverIndex== 0){
            if(this.inputs.tpRightPressed && !this.inputs.tpRightHandeled){
                this.inputs.tpRightHandeled = true;
                this.totalHealthCore = Math.min(this.maxCoreNo,this.totalHealthCore+1);
                this.game.totalHealthCore = this.totalHealthCore;
                this.game.topPlayer.updateHealthCoreSettings(this.totalHealthCore);
                this.game.bottomPlayer.updateHealthCoreSettings(this.totalHealthCore);
            }
            if(this.inputs.tpLeftPressed && !this.inputs.tpLeftHandeled){
                this.inputs.tpLeftHandeled = true;
                this.totalHealthCore = Math.max(1,this.totalHealthCore-1); 
                this.game.totalHealthCore = this.totalHealthCore;
                this.game.topPlayer.updateHealthCoreSettings(this.totalHealthCore);
                this.game.bottomPlayer.updateHealthCoreSettings(this.totalHealthCore);
            }
        }
    }
    updateHoverAnimation(dt){
        if(this.inputs.upArrowPressed && !this.inputs.upArrowHandeled){
            this.inputs.upArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        if(this.inputs.downArrowPressed && !this.inputs.downArrowHandeled){
            this.inputs.downArrowHandeled = true;
            this.hoverIndex = (this.hoverIndex + 1) % this.nBtns;
        }
        
        //hover Animation
        this.hoverAnimTime += dt;
        if(this.hoverAnimTime >= this.hoverAnimTimer){
            this.hoverAnimTime -= this.hoverAnimTimer;
            if(this.hoverState == HoverState.BRIGHTENING){
                this.hoverAlphaIndex = Math.min(this.hoverAlphaIndex + this.hoverAlphaChangeFactor, this.maxHoverAlphaIndex)
                this.hoverState = this.hoverAlphaIndex>=this.maxHoverAlphaIndex?HoverState.DIMMING:HoverState.BRIGHTENING;
            }else{
                this.hoverAlphaIndex = Math.max(this.hoverAlphaIndex - this.hoverAlphaChangeFactor, 0);
                this.hoverState = this.hoverAlphaIndex<=0?HoverState.BRIGHTENING:HoverState.DIMMING;
            }
        }
    }
    render(ctx){
        ctx.clearRect(0,0,this.game.canvas.width, this.game.canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.game.canvas.width, this.game.canvas.height);

        this.game.topPlayer.render(ctx);
        this.game.bottomPlayer.render(ctx);

        ctx.font = "80px bold";
        ctx.fillStyle = "cyan";
        ctx.fillText("Settings",this.game.canvas.width/2 - 130, 130);
        
        this.healthCoreSettingBtn.render(ctx);
        ctx.font = "30px bold";
        ctx.fillStyle = "cyan";
        ctx.fillText(this.totalHealthCore,this.healthCoreSettingBtn.right() + 10, this.healthCoreSettingBtn.bottom() - 3);
        if(this.inputs.tpLeftHandeled){
            ctx.fillStyle = "black";
        }else{
            ctx.fillStyle = "cyan";
        }
        ctx.fillText("<-",this.healthCoreSettingBtn.right() - 30, this.healthCoreSettingBtn.bottom() - 3);
        if(this.inputs.tpRightHandeled){
            ctx.fillStyle = "black";
        }else{
            ctx.fillStyle = "cyan";
        }
        ctx.fillText("->",this.healthCoreSettingBtn.right() + 35, this.healthCoreSettingBtn.bottom() - 3);
        this.returnToMainMenuBtn.render(ctx);
        this.renderHoverAnimation(ctx);
    }
    renderHoverAnimation(ctx){
        ctx.fillStyle = "rgba(0,255,255,"+ this.hoverAlphaIndex+")";
        ctx.fillRect(0,this.healthCoreSettingBtn.y + (this.hoverIndex * 60), this.game.canvas.width, this.healthCoreSettingBtn.h);
    }
}

class Game {
    //Game Constants
    SCREEN_WIDTH = 500;
    SCREEN_HEIGHT = 500;
    UPDATE_FPS = 60;
    UNIT_STEP_DURATION = 1 / this.UPDATE_FPS;
    PLAYER_WIDTH = 100;
    PLAYER_HEIGHT = 15;
    constructor(){
        this.canvas = document.getElementById("pong");
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.canvas.width = this.SCREEN_WIDTH;
        this.canvas.height = this.SCREEN_HEIGHT;
        this.init();
    }
    init() {
        this.initPauseScreenItems();
        this.initWinScreenItems();
        this.gameMode = GameMode.MENU;
        this.activeMode = new MenuMode(this);
        this.wallRect = new Rect(0,0,this.canvas.width, this.canvas.height);
        //Player health cores no
        this.totalHealthCore = 3;
        this.topPlayer = new Player(this.canvas.width / 2 - (this.PLAYER_WIDTH/2), this.PLAYER_HEIGHT, this.PLAYER_WIDTH, this.PLAYER_HEIGHT, this);
        this.bottomPlayer = new Player(this.canvas.width / 2 - (this.PLAYER_WIDTH/2), this.canvas.height - this.PLAYER_HEIGHT*2, this.PLAYER_WIDTH, this.PLAYER_HEIGHT, this);
        this.ball = new Ball(this.canvas.width/2,this.canvas.height/2,15,15,this);
        this.returningToMenu = false;
        this.updateAccumulator = 0; //sec
        this.run();
    }
    initPauseScreenItems(){
        this.pauseScreenOverlay = document.getElementById("pauseOverlay");
        this.continueBtn = document.getElementById("continue");
        this.menuBtn = document.getElementById("menu");
        this.hoverEffect = document.getElementById("hoverEffect");

        window.addEventListener("resize", () => {
            this.resizeDomElements();
        });
        this.resizeDomElements();
    }
    resizeDomElements(){
        const rect = this.canvas.getBoundingClientRect();

        this.pauseScreenOverlay.style.position = "absolute";
        this.pauseScreenOverlay.style.left = rect.left + "px";
        this.pauseScreenOverlay.style.top = rect.top + "px";
        this.pauseScreenOverlay.style.width = rect.width + "px";
        this.pauseScreenOverlay.style.height = rect.height + "px";

        this.continueBtn.style.left =(rect.left + rect.width/2 -65)+ "px";
        this.continueBtn.style.top = rect.top + 200 + "px";
        this.menuBtn.style.left = (rect.left + rect.width/2 - 65) + "px";
        this.menuBtn.style.top = rect.top + 250 + "px";
        this.hoverTopCoordinate = rect.top + 200;
        this.hoverEffect.style.width = rect.width + "px";

        this.canvasTop = rect.top;
        this.canvasLeft = rect.left;
        this.canvasRight = rect.right;
        this.canvasBottom = rect.bottom;
    }
    initWinScreenItems(){
        this.winnerText = document.getElementById("winnerText");
        this.loserText = document.getElementById("loserText");
    }
    run(){
        //looping dependencies
        this.prevMs = performance.now();
        this.gameLoop();
    }
    gameLoop(){
        this.nowMs = performance.now();
        this.deltaTime = (this.nowMs - this.prevMs) / 1000;
        this.prevMs = this.nowMs;

        this.updateAccumulator += this.deltaTime;
        while(this.updateAccumulator >= this.UNIT_STEP_DURATION){
            this.updateAccumulator -= this.UNIT_STEP_DURATION;
                this.activeMode.update(this.UNIT_STEP_DURATION);
        }

        this.activeMode.render(this.ctx);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    renderWinScreenOverlay(ctx,winner){
        ctx.font = "30px bold";
        ctx.fillStyle = "cyan";
        if(winner==Winner.TOP_PLAYER){
            ctx.fillText("!!! WINNER !!!",this.canvas.width/2 - 90, this.canvas.height/2 - 50,200,20);
        }else{
            ctx.fillText("!!! WINNER !!!",this.canvas.width/2 -90, this.canvas.height/2 + 50,200,20);
        }
    }
}

const game = new Game();