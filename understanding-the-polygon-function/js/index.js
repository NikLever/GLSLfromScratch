const canvas = document.getElementById("graph");
const context = canvas.getContext('2d');
let sides = 3;
let rad = Math.PI*2/sides;
let radius = 100;
let outerRadius = radius * (1.0/Math.cos(rad/2));
const centre = { x:300, y:200 };
const testPt = { x:Math.random()*600, y:Math.random()*400 };
const table = document.getElementById("data");
const cells = { 
  sides:table.rows[1].cells[0], 
  radius:table.rows[1].cells[1],
  theta:table.rows[1].cells[2],
  index:table.rows[1].cells[3],
  angle:table.rows[1].cells[4],
  cos:table.rows[1].cells[5], 
  d:table.rows[1].cells[6], 
  result:table.rows[1].cells[7], 
}

let mouseDown = false;

if ('ontouchstart' in window){
  document.addEventListener('touchdown', tap);
}else{
  document.addEventListener('mousedown', tap);
}

const input = document.getElementById('sides');
input.onchange = function (event) {
    sides = Number(event.target.value);
    rad = Math.PI*2/sides;
    outerRadius = radius * (1.0/Math.cos(rad/2));
    render();
    console.log('onchange sides='+sides);
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
  /*
  pt -= center;
  
  // Angle and radius from the current pixel
  float theta = atan(pt.y, pt.x) + rotate;
  float rad = PI2/float(sides);

  // Shaping function that modulate the distance
  float d = cos(floor(0.5 + theta/rad)*rad-theta)*length(pt);

  return 1.0 - smoothstep(radius, radius + edge_thickness, d);
  */
  const pt = {x:testPt.x-centre.x, y:centre.y-testPt.y};
  const theta = Math.atan2(pt.y, pt.x);
  const index = Math.floor(0.5 + theta/rad);
  let angle = index*rad-theta;
  const cos = Math.cos(angle);
  const d = cos*length(pt);
  const result = 1.0 - smoothstep(radius, radius + 2, d);
  const RAD2DEG = 180/Math.PI;
  
  //angle = Math.PI/sides + angle;
  
  cells.sides.innerHTML = sides;
  cells.radius.innerHTML = radius;
  cells.theta.innerHTML = (theta*RAD2DEG).toFixed(0);
  cells.index.innerHTML = index;
  cells.angle.innerHTML = (angle*RAD2DEG).toFixed(0);
  cells.cos.innerHTML = cos.toFixed(2);
  cells.d.innerHTML = d.toFixed(2);
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
    context.strokeStyle = (x==centre.x) ? "#003333" : "#00aaff";
    if (x==centre.x){
      context.lineWidth = 1;
      context.strokeStyle = "#333";
    }
    
    context.moveTo(x,0);
    context.lineTo(x,400);
    context.stroke();
  }
  
  context.strokeStyle = "#000";
  context.lineWidth = 2;
  let theta = Math.PI;
  if (sides % 2==0) theta += rad/2.0;
  
  let pt;
  
  for(let i=0; i<sides; i++, theta+=rad){
    const x = Math.cos(theta) * outerRadius + centre.x;
    const y = centre.y - Math.sin(theta) * outerRadius;
    if (i==0){
      context.moveTo(x,y);
      pt = {x,y}
    }else{
      context.lineTo(x,y);
    }
  }
  context.lineTo(pt.x, pt.y);
  context.stroke()
  
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = "#555";
  context.arc(centre.x, centre.y, radius, 0, Math.PI*2);
  context.stroke();
  
  pt = {x:testPt.x-centre.x, y:centre.y-testPt.y};
  const len = length(pt);
  theta = Math.atan2(-pt.y, pt.x);
  const index = Math.floor(0.5 + theta/rad);
  let angle = index*rad;//rad/2 - rad - index*rad;
  pt.x = Math.cos(angle) * radius + centre.x;
  pt.y = Math.sin(angle) * radius + centre.y;
  
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = "#0000ff";
  context.moveTo(centre.x, centre.y);
  context.lineTo(pt.x, pt.y);
  context.stroke();
  
  pt.x = Math.cos(theta) * len + centre.x;
  pt.y = Math.sin(theta) * len + centre.y;
  
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = "#00ff00";
  context.moveTo(centre.x, centre.y);
  context.lineTo(pt.x, pt.y);
  context.stroke();
  
  theta = Math.atan2(pt.y-centre.y, pt.x-centre.x);
  context.beginPath();
  context.strokeStyle = "#f00";
  if (angle<theta){
    context.arc(centre.x, centre.y, 20, angle, theta);
  }else{
    context.arc(centre.x, centre.y, 20, theta, angle);
  }
  context.stroke();
  
  context.fillStyle = "#aa0000";
  context.beginPath();
  context.arc(testPt.x, testPt.y, 5, 0, Math.PI*2);
  context.fill();
}