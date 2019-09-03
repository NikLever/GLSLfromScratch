const canvas = document.getElementById("graph");
const context = canvas.getContext('2d');
const theta = Math.PI/4;
const radius = 180;
const centre = { x:300, y:200 };
const pt1 = { x:0, y: 0 };
const pt = { x:Math.cos(theta)*radius + centre.x, y:-Math.sin(theta)*radius + centre.y};
const testPt = { x:Math.random()*600, y:Math.random()*400 };
const thickness = 20;
const table = document.getElementById("data");
const cells = { 
  pt:table.rows[1].cells[0], 
  a:table.rows[1].cells[1], 
  b:table.rows[1].cells[2], 
  d:table.rows[1].cells[3], 
  p:table.rows[1].cells[4], 
  h1:table.rows[1].cells[5],
  h:table.rows[1].cells[6],
  l:table.rows[1].cells[7],
  result:table.rows[1].cells[8]
}

let mouseDown = false;

if ('ontouchstart' in window){
  document.addEventListener('touchdown', tap);
}else{
  document.addEventListener('mousedown', tap);
}

render();

function tap(evt){
  if ('ontouchstart' in window){
    document.addEventListener('touchup', up);
    document.addEventListener('touchmove', move);
  }else{
    document.addEventListener('mouseup', up);
    document.addEventListener('mousemove', move);
  }   
}

function up(evt){
  if ('ontouchstart' in window){
    document.removeEventListener('touchup', up);
    document.removeEventListener('touchmove', move);
  }else{
    document.removeEventListener('mouseup', up);
    document.removeEventListener('mousemove', move);
  } 
}

function move(evt){
  testPt.x = (evt.touches) ? evt.touches[0].clientX : evt.clientX;
  testPt.y = (evt.touches) ? evt.touches[0].clientY : evt.clientY;
  render();
}

function dot(a, b){
  return a.x*b.x + a.y*b.y;
}

function clamp(x, min, max){
  return Math.min(Math.max(x, min), max);  
}

function length(v){
  return Math.sqrt(dot(v,v));
}

function smoothstep(edge0, edge1, x){
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

function updateTable(){
/*Assuming the line is defined by the points a, b, and pt is the point to evaluate, then p is the vector  from a to b and d is the vector that goes from a to pt.

Now, dot(p, p) is equal to length(p) ^ 2 and dot(d,p) / length(p) is the projection of the vector d over your line. Then, dot(d,p)/dot(p,p) is the projection normalized over the length of your line. That value is clamped between 0 and 1 so your projection will always be in between the points that define your line.

Then on length(d - p * h), p * h is equal to dot(d,p) / length(p) ^ 2 which was the projection of your point over your line, now clamped between points a and b. The subtraction d - p * h results in a vector that represents the minimum distance between your line and point p. Using the length of that vector and comparing it against the thickness you can determine whether the point falls inside the line you want to draw.
                    
vec2 d = pt - a;
vec2 p = b - a;
float h = clamp( dot(d,p)/dot(p,p), 0.0, 1.0 );
float l = length(d - p*h);

return 1.0 - smoothstep(0.0, thickness, l);*/
  
  displayVector(testPt, cells.pt);
  displayVector(centre, cells.a);
  displayVector(pt, cells.b);
  
  const d = { x:testPt.x - centre.x, y:testPt.y - centre.y };
  const p = { x:pt.x - centre.x, y:pt.y - centre.y };
  displayVector(d, cells.d);
  displayVector(p, cells.p);
  
  const h1 = dot(d,p)/dot(p,p);
  const h = clamp( h1, 0, 1);
  pt1.x = p.x * h + centre.x;
  pt1.y = p.y * h + centre.y;
  const l = length({x:d.x - p.x*h, y:d.y - p.y*h});
  const result = 1.0 - smoothstep(0.0, thickness, l);
  cells.h1.innerHTML = h1.toFixed(2);
  cells.h.innerHTML = h.toFixed(2);
  cells.l.innerHTML = l.toFixed(2);
  cells.result.innerHTML = result.toFixed(2);
}

function displayVector(v, cell){
  cell.innerHTML = `(${v.x.toFixed(2)},${v.y.toFixed(2)})`;  
}

function render(){
  updateTable();
  
  context.clearRect(0,0,600,400);
  
  for(let y=0; y<400; y+=5){
    context.beginPath();
    context.lineWidth = ((y % 50)==0) ? 0.5 : 0.25;
    context.strokeStyle = (y==centre.y) ? "#003333" : "#00aaff"; 
    if (y==centre.y){
      context.strokeStyle = "#333";
      context.lineWidth = 1;
    }
    
    context.moveTo(0,y);
    context.lineTo(600,y);
    context.stroke();
  }
  
  for(let x=0; x<600; x+=5){
    context.beginPath();
    context.lineWidth = ((x % 50)==0) ? 0.5 : 0.25;
    context.stokeStyle = (x==centre.x) ? "#003333" : "#00aaff";
    if (x==centre.x){
      context.lineWidth = 1;
      context.strokeStyle = "#333";
    }
    
    context.moveTo(x,0);
    context.lineTo(x,400);
    context.stroke();
  }
  
  context.beginPath();
  context.strokeStyle = "#00ff00";
  context.lineWidth = 1;
  context.moveTo(centre.x, centre.y);
  context.lineTo(testPt.x, testPt.y);
  context.stroke();
  
  context.beginPath();
  context.strokeStyle = "#000000";
  context.lineWidth = 2;
  context.moveTo(centre.x, centre.y);
  context.lineTo(pt.x, pt.y);
  context.stroke();
  
  context.beginPath();
  context.strokeStyle = "#0000ff";
  context.lineWidth = 1;
  context.moveTo(pt1.x, pt1.y);
  context.lineTo(testPt.x, testPt.y);
  context.stroke();
  
  context.fillStyle = "#aa0000";
  context.beginPath();
  context.arc(testPt.x, testPt.y, 5, 0, Math.PI*2);
  context.fill();
  
  
}