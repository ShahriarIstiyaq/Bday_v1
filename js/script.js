/* ══════════════════════════════════════════
   BIRTHDAY STORY SCRIPT
   Flow: Loader → Cake Scene → Scroll → Paper + Typing
══════════════════════════════════════════ */

// ── Snowflakes (gold) ──────────────────────
var sf = new Snowflakes({ color: "#ffd700", minSize: 15, maxSize: 28 });

// ── URL name param ──────────────────────────
(function () {
    var params = new URL(window.location.href).searchParams;
    var name = params.get("name");
    if (name) {
        document.getElementById("name").textContent = name;
    }
})();

// ── State tracking ──────────────────────────
var typedInstance = null;
var paperRevealed = false;
var typingStarted  = false;

// ── DOM refs ────────────────────────────────
var $loader       = $("#loader");
var $sceneCake    = $("#scene-cake");
var $sceneLetter  = $("#scene-letter");
var $paper        = $("#paper");
var $scrollPrompt = $("#scroll-prompt");
var $bannerWrap   = $(".banner-wrap");
var $nameWrap     = $(".name-wrap");
var $cakeWrap     = $(".cake-wrap");
var $balloonBorder= $(".balloon-border");
var $letterSign   = $(".letter-sign");

// ══════════════════════════════════════════
//  STEP 1 — Start button click
// ══════════════════════════════════════════
$("#play").on("click", function () {

    // Play music
    var audio = $(".song")[0];
    audio.play().catch(function () { /* autoplay blocked – that's okay */ });

    // Fade out loader
    $loader.addClass("hidden");

    // Show cake scene
    setTimeout(function () {
        $sceneCake.addClass("visible");

        // Animate banner, name, cake in sequence
        setTimeout(function () { $bannerWrap.addClass("show"); }, 200);
        setTimeout(function () { $nameWrap.addClass("show");   }, 700);
        setTimeout(function () { $cakeWrap.addClass("show");   }, 1200);

        // Raise balloon border
        setTimeout(function () { $balloonBorder.addClass("rise"); }, 600);

        // Show scroll prompt after everything lands
        setTimeout(function () {
            $scrollPrompt.addClass("visible");
        }, 3000);

    }, 400);

    // Destroy golden snowflakes after transition
    setTimeout(function () { sf.destroy(); }, 1600);
});

// ══════════════════════════════════════════
//  STEP 2 — Scroll triggers paper reveal
// ══════════════════════════════════════════
function onScroll() {
    if (paperRevealed) return;

    // Trigger once the user has scrolled any amount
    if (window.scrollY > 30 || document.documentElement.scrollTop > 30) {
        paperRevealed = true;
        window.removeEventListener("scroll", onScroll);

        // Reveal paper with 3D unfold
        $paper.addClass("reveal");

        // Start typing after paper has unfolded (transition = 1.4s)
        setTimeout(function () {
            startTyping();
        }, 1500);
    }
}

window.addEventListener("scroll", onScroll, { passive: true });

// ══════════════════════════════════════════
//  STEP 3 — Typed.js message on paper
// ══════════════════════════════════════════
function startTyping() {
    if (typingStarted) return;
    typingStarted = true;

    typedInstance = new Typed("#typed", {
        stringsElement: "#typed-strings",
        typeSpeed: 28,
        backSpeed: 0,
        loop: false,
        showCursor: true,
        cursorChar: "|",
        onComplete: function () {
            // Show sign-off when done
            $letterSign.css("opacity", "1");
        }
    });
}

// ══════════════════════════════════════════
//  CONFETTI CANVAS
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", function () {

    var retina   = window.devicePixelRatio || 1,
        PI       = Math.PI,
        sqrt     = Math.sqrt,
        round    = Math.round,
        random   = Math.random,
        cos      = Math.cos,
        sin      = Math.sin,
        rAF      = window.requestAnimationFrame,
        cAF      = window.cancelAnimationFrame,
        _now     = Date.now;

    var speed    = 50,
        duration = 1.0 / speed,
        confettiRibbonCount = 11,
        ribbonPaperCount    = 15,
        ribbonPaperDist     = 8.0,
        ribbonPaperThick    = 8.0,
        confettiPaperCount  = 12,
        DEG_TO_RAD = PI / 180,
        colors = [
            ["#df0049", "#660671"],
            ["#00e857", "#005291"],
            ["#2bebbc", "#05798a"],
            ["#ffd200", "#b06c00"],
            ["#ff6b35", "#c0392b"]
        ];

    function Vector2(x, y) {
        this.x = x; this.y = y;
        this.Length    = function () { return sqrt(this.SqrLength()); };
        this.SqrLength = function () { return this.x*this.x + this.y*this.y; };
        this.Add  = function (v) { this.x += v.x; this.y += v.y; };
        this.Sub  = function (v) { this.x -= v.x; this.y -= v.y; };
        this.Mul  = function (f) { this.x *= f;   this.y *= f;   };
        this.Div  = function (f) { this.x /= f;   this.y /= f;   };
        this.Normalize = function () {
            var len = this.Length();
            if (len) { this.x /= len; this.y /= len; }
        };
        this.Normalized = function () {
            var len = this.Length();
            return len ? new Vector2(this.x/len, this.y/len) : new Vector2(0,0);
        };
    }
    Vector2.Sub = function (a, b) { return new Vector2(a.x-b.x, a.y-b.y); };

    function EulerMass(x, y, mass, drag) {
        this.position = new Vector2(x, y);
        this.mass = mass; this.drag = drag;
        this.force = new Vector2(0,0);
        this.velocity = new Vector2(0,0);
        this.AddForce = function (f) { this.force.Add(f); };
        this.Integrate = function (dt) {
            var acc = this.CurrentForce();
            acc.Div(this.mass);
            var pd = new Vector2(this.velocity.x, this.velocity.y);
            pd.Mul(dt);
            this.position.Add(pd);
            acc.Mul(dt);
            this.velocity.Add(acc);
            this.force = new Vector2(0,0);
        };
        this.CurrentForce = function () {
            var f = new Vector2(this.force.x, this.force.y);
            var speed = this.velocity.Length();
            var d = new Vector2(this.velocity.x, this.velocity.y);
            d.Mul(this.drag * this.mass * speed);
            f.Sub(d);
            return f;
        };
    }

    function ConfettiPaper(x, y) {
        this.pos = new Vector2(x, y);
        this.rotationSpeed = random()*600+800;
        this.angle = DEG_TO_RAD*random()*360;
        this.rotation = DEG_TO_RAD*random()*360;
        this.cosA = 1.0;
        this.size = 5.0;
        this.oscillationSpeed = random()*1.5+0.5;
        this.xSpeed = 40.0;
        this.ySpeed = random()*60+50;
        this.corners = [];
        this.time = random();
        var ci = round(random()*(colors.length-1));
        this.frontColor = colors[ci][0];
        this.backColor  = colors[ci][1];
        for (var i=0;i<4;i++){
            this.corners[i]=new Vector2(cos(this.angle+DEG_TO_RAD*(i*90+45)), sin(this.angle+DEG_TO_RAD*(i*90+45)));
        }
        this.Update=function(dt){
            this.time+=dt;
            this.rotation+=this.rotationSpeed*dt;
            this.cosA=cos(DEG_TO_RAD*this.rotation);
            this.pos.x+=cos(this.time*this.oscillationSpeed)*this.xSpeed*dt;
            this.pos.y+=this.ySpeed*dt;
            if(this.pos.y>ConfettiPaper.bounds.y){this.pos.x=random()*ConfettiPaper.bounds.x;this.pos.y=0;}
        };
        this.Draw=function(g){
            g.fillStyle=this.cosA>0?this.frontColor:this.backColor;
            g.beginPath();
            g.moveTo((this.pos.x+this.corners[0].x*this.size)*retina,(this.pos.y+this.corners[0].y*this.size*this.cosA)*retina);
            for(var i=1;i<4;i++) g.lineTo((this.pos.x+this.corners[i].x*this.size)*retina,(this.pos.y+this.corners[i].y*this.size*this.cosA)*retina);
            g.closePath();g.fill();
        };
    }
    ConfettiPaper.bounds=new Vector2(0,0);

    function ConfettiRibbon(x,y,count,dist,thick,angle,mass,drag){
        this.particleDist=dist;this.particleCount=count;
        this.particleMass=mass;this.particleDrag=drag;
        this.particles=[];
        var ci=round(random()*(colors.length-1));
        this.frontColor=colors[ci][0];this.backColor=colors[ci][1];
        this.xOff=cos(DEG_TO_RAD*angle)*thick;
        this.yOff=sin(DEG_TO_RAD*angle)*thick;
        this.position=new Vector2(x,y);
        this.prevPosition=new Vector2(x,y);
        this.velocityInherit=random()*2+4;
        this.time=random()*100;
        this.oscillationSpeed=random()*2+2;
        this.oscillationDistance=random()*40+40;
        this.ySpeed=random()*40+80;
        for(var i=0;i<this.particleCount;i++) this.particles[i]=new EulerMass(x,y-i*this.particleDist,this.particleMass,this.particleDrag);
        this.Update=function(dt){
            var i;
            this.time+=dt*this.oscillationSpeed;
            this.position.y+=this.ySpeed*dt;
            this.position.x+=cos(this.time)*this.oscillationDistance*dt;
            this.particles[0].position=this.position;
            var dX=this.prevPosition.x-this.position.x,dY=this.prevPosition.y-this.position.y;
            var delta=sqrt(dX*dX+dY*dY);
            this.prevPosition=new Vector2(this.position.x,this.position.y);
            for(i=1;i<this.particleCount;i++){
                var dir=Vector2.Sub(this.particles[i-1].position,this.particles[i].position);
                dir.Normalize();dir.Mul((delta/dt)*this.velocityInherit);
                this.particles[i].AddForce(dir);
            }
            for(i=1;i<this.particleCount;i++) this.particles[i].Integrate(dt);
            for(i=1;i<this.particleCount;i++){
                var rp2=new Vector2(this.particles[i].position.x,this.particles[i].position.y);
                rp2.Sub(this.particles[i-1].position);rp2.Normalize();rp2.Mul(this.particleDist);
                rp2.Add(this.particles[i-1].position);this.particles[i].position=rp2;
            }
            if(this.position.y>ConfettiRibbon.bounds.y+this.particleDist*this.particleCount) this.Reset();
        };
        this.Reset=function(){
            this.position.y=-random()*ConfettiRibbon.bounds.y;
            this.position.x=random()*ConfettiRibbon.bounds.x;
            this.prevPosition=new Vector2(this.position.x,this.position.y);
            this.velocityInherit=random()*2+4;
            this.time=random()*100;
            this.oscillationSpeed=random()*2+1.5;
            this.oscillationDistance=random()*40+40;
            this.ySpeed=random()*40+80;
            var ci=round(random()*(colors.length-1));
            this.frontColor=colors[ci][0];this.backColor=colors[ci][1];
            this.particles=[];
            for(var i=0;i<this.particleCount;i++) this.particles[i]=new EulerMass(this.position.x,this.position.y-i*this.particleDist,this.particleMass,this.particleDrag);
        };
        this.Draw=function(g){
            for(var i=0;i<this.particleCount-1;i++){
                var p0=new Vector2(this.particles[i].position.x+this.xOff,this.particles[i].position.y+this.yOff);
                var p1=new Vector2(this.particles[i+1].position.x+this.xOff,this.particles[i+1].position.y+this.yOff);
                var side=((this.particles[i].position.x-this.particles[i+1].position.x)*(p1.y-this.particles[i+1].position.y)-(this.particles[i].position.y-this.particles[i+1].position.y)*(p1.x-this.particles[i+1].position.x));
                g.fillStyle=g.strokeStyle=side<0?this.frontColor:this.backColor;
                g.beginPath();
                if(i===0){
                    g.moveTo(this.particles[i].position.x*retina,this.particles[i].position.y*retina);
                    g.lineTo(this.particles[i+1].position.x*retina,this.particles[i+1].position.y*retina);
                    g.lineTo(((this.particles[i+1].position.x+p1.x)*0.5)*retina,((this.particles[i+1].position.y+p1.y)*0.5)*retina);
                } else if(i===this.particleCount-2){
                    g.moveTo(p1.x*retina,p1.y*retina);
                    g.lineTo(p0.x*retina,p0.y*retina);
                    g.lineTo(((this.particles[i].position.x+p0.x)*0.5)*retina,((this.particles[i].position.y+p0.y)*0.5)*retina);
                } else {
                    g.moveTo(this.particles[i].position.x*retina,this.particles[i].position.y*retina);
                    g.lineTo(this.particles[i+1].position.x*retina,this.particles[i+1].position.y*retina);
                    g.lineTo(p1.x*retina,p1.y*retina);
                    g.lineTo(p0.x*retina,p0.y*retina);
                }
                g.closePath();g.fill();g.stroke();
            }
        };
    }
    ConfettiRibbon.bounds=new Vector2(0,0);

    // Build confetti context on the canvas inside scene-cake
    var canvas = document.getElementById("confetti");
    if (!canvas) return;
    var canvasParent = canvas.parentNode;
    var cW = canvasParent.offsetWidth;
    var cH = canvasParent.offsetHeight;
    canvas.width  = cW * retina;
    canvas.height = cH * retina;
    var ctx = canvas.getContext("2d");

    ConfettiPaper.bounds  = new Vector2(cW, cH);
    ConfettiRibbon.bounds = new Vector2(cW, cH);

    var confettiPapers  = [];
    var confettiRibbons = [];

    for (var i=0;i<confettiPaperCount;i++)  confettiPapers[i]  = new ConfettiPaper(random()*cW, random()*cH);
    for (var i=0;i<confettiRibbonCount;i++) confettiRibbons[i] = new ConfettiRibbon(random()*cW,-random()*cH*2,ribbonPaperCount,ribbonPaperDist,ribbonPaperThick,45,1,0.05);

    function updateConfetti() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for(var i=0;i<confettiPaperCount;i++){confettiPapers[i].Update(duration);confettiPapers[i].Draw(ctx);}
        for(var i=0;i<confettiRibbonCount;i++){confettiRibbons[i].Update(duration);confettiRibbons[i].Draw(ctx);}
        rAF(updateConfetti);
    }
    updateConfetti();

    window.addEventListener("resize", function () {
        cW = canvasParent.offsetWidth;
        cH = canvasParent.offsetHeight;
        canvas.width  = cW * retina;
        canvas.height = cH * retina;
        ConfettiPaper.bounds  = new Vector2(cW, cH);
        ConfettiRibbon.bounds = new Vector2(cW, cH);
    });
});