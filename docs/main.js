import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import lineData from "./linegeo.js";
import d3geo from "./d3-geo.min.js";

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv=uv;
  vNormal=normal;           
    
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const fragmentShader = `
uniform vec3 color;   
uniform float time;  
uniform float num;                 
varying vec2 vUv; 
varying vec3 vNormal;
void main() {
  // float alpha = smoothstep(0.8, 1.0, vUv.y);
  // gl_FragColor = vec4(color, mix(1.0, 0.0, alpha));
  gl_FragColor = vec4(color, 1.0 - fract((vUv.y - time) * num));
}`;

let scene;
let renderer;
let camera;
let controls;
let canvas = document.getElementById("c");
let material;
let time = 0;

init();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  //

  camera = new THREE.PerspectiveCamera(
    70,
    canvas.innerWidth / canvas.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 1;
  camera.position.x = 0;
  camera.position.y = 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.enablePan = true;
  controls.enableDamping = true;

  const gridHelper = new THREE.GridHelper(2, 40, 0x808080, 0x808080);
  gridHelper.position.y = 0;
  gridHelper.position.x = 0;
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  let one;
  const points = lineData.map((d) => {
    const res = d3geo.geoMercator().scale(50)(d);
    if (!one) {
      one = res;
    }
    return new THREE.Vector3(res[0] - one[0], res[1] - one[1]);
  });

  const shape = new THREE.Shape(points);

  material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      color: {
        value: new THREE.Color("#00BCD4"),
      },
      time: { value: 0.0 },
      num: { value: 20.0 },
    },
    vertexShader,
    fragmentShader,
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: false,
  });

  const start = geometry.groups[1].start;
  const count = geometry.groups[1].count;

  geometry.setDrawRange(start, count);

  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotateX(Math.PI / 2);
  mesh.position.y = 0.2;
  scene.add(mesh);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  if (material) {
    if (time >= 1.0) {
      time = 0.0;
    }
    time = time + 0.002;
    material.uniforms.time.value = time;
  }

  controls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
