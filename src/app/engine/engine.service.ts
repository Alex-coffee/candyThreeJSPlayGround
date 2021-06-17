import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;
  private cube: THREE.Mesh;

  moved = false;
  mouseX = 0
  mouseY = 0;

  raycaster: THREE.Raycaster;
  private frameId: number = null;
  mouse = new THREE.Vector2();

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    const _this = this;
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 1, 1000
    );
    this.camera.position.set( 100, 300, 250 );
    this.camera.lookAt( 0, 0, 0 );
    this.raycaster = new THREE.Raycaster();

    // soft white light
    this.light = new THREE.AmbientLight(0xcccccc, 0.8);
    this.light.position.z = 500;
    this.scene.add(this.light);

    const pointLight = new THREE.PointLight( 0xffffff, 0.2 );
    this.camera.add( pointLight );
    this.scene.add( this.camera );

    // cube example
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    //line example
    const points = [];
    points.push( new THREE.Vector3( - 5, 0, 0 ) );
    points.push( new THREE.Vector3( 0, 5, 0 ) );
    points.push( new THREE.Vector3( 5, 0, 0 ) );

    const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
    //create a blue LineBasicMaterial
    const lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const line = new THREE.Line( lineGeometry, lineMaterial );
    // this.scene.add(line);

    const onProgress = function ( xhr ) {
      if ( xhr.lengthComputable ) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round( percentComplete) + '% downloaded' );
      }
    };

    const onError = function (e) {
      console.log(e);
    };
    const manager = new THREE.LoadingManager();
    manager.addHandler( /\.dds$/i, new DDSLoader() );

    // comment in the following line and import TGALoader if your asset uses TGA textures
    // manager.addHandler( /\.tga$/i, new TGALoader() );

    new MTLLoader( manager )
      .setPath( './assets/cube/' )
      .load( 'cube.mtl', function ( materials ) {
        materials.preload();
        new OBJLoader( manager )
          .setMaterials( materials )
          .setPath( './assets/cube/' )
          .load( 'cube.obj', function ( object ) {
            // object.position.y = -5;
            _this.scene.add( object );
          }, onProgress, onError );
      } );

    const controls = new OrbitControls( this.camera, this.renderer.domElement );
    controls.minDistance = 200;
    controls.maxDistance = 500;

    let moved = false;
    controls.addEventListener('change', function () {
      moved = true;
    });

    window.addEventListener( 'pointerdown', function () {
      moved = false;
    });

    window.addEventListener( 'pointermove', onPointerMove );
    function onPointerMove( event ) {
      if ( event.isPrimary ) {
        _this.checkIntersection( event.clientX, event.clientY );
      }
    }

  }

  public animate(): void {
    const _this = this;
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });
    this.camera.lookAt( this.scene.position );
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  onDocumentMouseMove( event ) {
    this.mouseX = ( event.clientX - window.innerWidth / 2 ) / 2;
    this.mouseY = ( event.clientY - window.innerHeight / 2 ) / 2;
  }

  checkIntersection( x, y ) {
    this.mouseX = ( x / window.innerWidth ) * 2 - 1;
    this.mouseY = - ( y / window.innerHeight ) * 2 + 1;
    this.raycaster.setFromCamera( this.mouse, this.camera );
  }
}
