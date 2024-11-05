console.log("hi");
const canvas = document.querySelector('canvas');
var navbar = document.querySelector('nav');
var picker = document.getElementById('colorPicker');
var Mouse = [0, 0, false, false];
var pan = false;
// Looking out for various mouse Events
canvas.addEventListener("mousedown", mouseEvent);
canvas.addEventListener("mouseup", mouseEvent);
canvas.addEventListener("mousemove", mouseEvent);
window.addEventListener("keydown", mouseEvent);
window.addEventListener("keyup", mouseEvent);
const pickr = Pickr.create({
    el: '#color-picker',
    theme: 'nano', // or 'monolith', 'nano'
    default: '#42445a',
  
    swatches: [
      'rgba(244, 67, 54, 1)',
      'rgba(233, 30, 99, 0.95)',
      'rgba(156, 39, 176, 0.9)',
      'rgba(103, 58, 183, 0.85)',
      'rgba(63, 81, 181, 0.8)',
      'rgba(33, 150, 243, 0.75)',
      'rgba(3, 169, 244, 0.7)',
      'rgba(0, 188, 212, 0.7)',
      'rgba(0, 150, 136, 0.75)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(139, 195, 74, 0.85)',
      'rgba(205, 220, 57, 0.9)',
      'rgba(255, 235, 59, 0.95)',
      'rgba(255, 193, 7, 1)'
    ],
    position: 'bottom',
    components: {
      // Main components
      preview: true,
      opacity: true,
      hue: true,
  
      // Input / output Options
      interaction: {
        hex: true,
        rgba: true,
        hsla: true,
        hsva: true,
        cmyk: true,
        input: true,
        clear: true,
        save: true
      }
    }
  });

var undoCount = 0;
var draw = true;
var erase = false;
document.querySelectorAll('button').forEach(button => {
    button.addEventListener("click", function(){
        if (this.id === "plus")
            grid.zoomSize += 0.1;
        if (this.id === "minus")
            grid.zoomSize -= 0.1
        if (this.id === "erase"){
            if (!erase)
            {
                erase = true;
                draw = false;
            }
            else
            {
                erase = false;
            }
        }

        if (this.id === "draw")
        {
            if (!draw){
                draw = true;
                erase = false;
            }
            else{
                draw = false;
            }
        }

        if (this.id === "undo"){
            console.log("undo", record[undoCount]);
            grid.gridStates = record[undoCount];
            undoCount += 1;
            
        }
        if (this.id === "save"){
            console.log("download")
            save();
        }
    })
});

function mouseEvent(event){
    if (event.type === "mousedown"){
        Mouse[2] = true;
        color = pickr.getColor().toHEXA().toString();
        pickr.setColor(color);
        undoCount = 0;
    }
    if (event.type === "mouseup")
        Mouse[2] = false;
    if (event.type === "mousemove"){
        let bounds = event.target.getBoundingClientRect();
        Mouse[0] = event.pageX - bounds.left - window.scrollX - offset[0]
        Mouse[1] = event.pageY - bounds.top - window.scrollY - offset[1]
    }
    if (event.type === "keydown"){
        if (event.key === "Alt"){
            pan = true;
            origin = [Mouse[0], Mouse[1]];
        }
        if (event.key === "="){
            grid.zoomSize += 0.1;
        }
        if (event.key === "-"){
            grid.zoomSize -= 0.1;
            if (grid.zoomSize < 0.2){
                grid.zoomSize = 0.2;
            }
        }
        if (event.key === "z" && event.ctrlKey){
            if (record[undoCount][0] == "add"){
                console.log("undo")
                grid.gridStates[record[undoCount][1]] [record[undoCount][2]] = "";
                undoCount += 1;
            }
        }
        if (event.key === "b")
        {
            if (!draw)
                {
                    erase = false;
                    draw = true;
                }
            else
                {
                    draw = false;
                }
            
        }
    }
    if (event.key === "e")
    {
        if (!erase)
            {
                erase = true;
                draw = false;
            }
        else
            {
                erase = false;
            }
    }
    if (event.type === "keyup"){
        if (event.key === "Alt"){
            pan = false;
        }
    }
}

function resizeCanvas() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = Math.max(window.innerWidth / 2, 400);
    const canvasHeight = Math.max(viewportHeight - 2*navbar.offsetHeight, 500);

    canvas.height = canvasHeight;
    canvas.width = viewportWidth;
}

function save(){
    grid.show = false;
    grid.zoomSize = 0.01;
    editor();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "art.png";
    link.click();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call to set the size

var c = canvas.getContext("2d");

// Pixel Class
class Block {
    constructor(x, y, colour) {
        this.originalX = x;
        this.originalY = y;
        this.width = 20;
        this.height = 20;
        this.color = colour;
    }

    draw() {
        const scaledX = (this.originalX * grid.zoomSize) + offset[0];
        const scaledY = (this.originalY * grid.zoomSize) + offset[1];
        const scaledWidth = this.width * grid.zoomSize;
        const scaledHeight = this.height * grid.zoomSize;

        c.fillStyle = this.color;
        c.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }
}

class Grid{
    constructor(){
        this.zoomSize = 1;
        this.show = true;
        this.gridSize = 20 * this.zoomSize;
        this.w = 20;
        this.h = 20;
        this.gridStates = []
        for (let i = 0; i < this.w; i++){
            this.gridStates[i] = new Array(this.h).fill("");
        }
    }
    draw(){
        this.gridSize = 20 * this.zoomSize;

        c.beginPath()
        for (let x = 0; x <= this.w * this.gridSize; x += this.gridSize) {
            c.moveTo(x + offset[0], 0 + offset[1]);
            c.lineTo(x + offset[0], this.h * this.gridSize + offset[1]);
        }
        
        for (let y = 0; y <= this.h * this.gridSize; y += this.gridSize) {
            c.moveTo(0 + offset[0], y + offset[1]);
            c.lineTo(this.w * this.gridSize + offset[0], y + offset[1]);
        }
        c.strokeStyle = "#a198a9";
        c.stroke();

    }
}

// Always have the editor in a certain position on the viewport

var grid = new Grid();
var erase = false;
var color = "#000000"
var offset = [canvas.width / 2 - (grid.w * (grid.w / 1.9)) , canvas.height / 2 - (grid.h * (grid.h / 1.9))];
var record = [grid.gridStates];
console.log(record);

// Main "game" loop
function editor(){
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillRect(0, 0, grid.w * grid.gridSize, grid.y * grid.gridSize);

    if (draw)
    {
        document.getElementById("erase").classList.remove("active");
        document.getElementById("draw").classList.add("active");
    }
    else
        document.getElementById("draw").classList.remove("active");

    if (erase)
        {
            document.getElementById("erase").classList.add("active");
            document.getElementById("draw").classList.remove("active");
        }
        else
            document.getElementById("erase").classList.remove("active");


    // Panning logic
    if (pan && Mouse[2]){
        let distx = origin[0] - Mouse[0];
        let disty = origin[1] - Mouse[1];
        offset[0] -= distx / 2;
        offset[1] -= disty / 2;
    }

    // Pixel Drawing Logic
    for (row of grid.gridStates){
        for (rect of row){
            if (rect !== ""){
                //console.log("rect", rect);
                rect.draw()
            }
        }
    }
    if (Mouse[2] && !pan){
        if (Mouse[0] < grid.gridSize * grid.w && Mouse[1] < grid.gridSize * grid.h && Mouse[0] > 0 && Mouse[1] > 0)
            {
            let index = Math.floor(Mouse[0] / grid.gridSize);
            let indey = Math.floor(Mouse[1] / grid.gridSize);
            
            if (draw)
            {
                if (grid.gridStates[indey][index].color !== color)
                {
                    let x = index * grid.gridSize;
                    let y = indey * grid.gridSize;
                    grid.gridStates[indey][index] = new Block(x / grid.zoomSize , y / grid.zoomSize, color);
                    record.push(JSON.parse(JSON.stringify(grid.gridStates)));
                    console.log(record);
                }
            }
            
            else if(erase)
            {
                grid.gridStates[indey][index] = "";
                record.push(JSON.parse(JSON.stringify(grid.gridStates)));
            }
            } 
        }
    // Pixel Grid Logic
    if (grid.show)
        grid.draw();

    requestAnimationFrame(editor);
}
editor();