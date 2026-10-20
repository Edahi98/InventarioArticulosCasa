import { CapsuleGeometry, ConeGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, Shape, ShapeGeometry, SphereGeometry, Vector3 } from "three";
import { DRAGON_COLOR } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { ParticleSystem } from "./ParticleSystem.js";

export class ToyDragon {
  readonly group = new Group();
  private readonly flyer: { body: Group; wings: [Group, Group] };
  private readonly peeker: Group;
  private readonly mouth = new Vector3();

  /**
   * Dragones de juguete amistosos del castillo: uno grande que vuela en círculos sobre las torres batiendo las alas y
   * soltando humo de colores, y uno pequeño que se asoma por encima de la torre del homenaje.
   *
   * @param center - Centro del castillo en el mundo.
   * @param keepTop - Altura del techo de la torre del homenaje.
   * @param particles - Partículas, para el humo de colores.
   */
  constructor(
    private readonly center: Vector3,
    keepTop: number,
    particles: ParticleSystem,
  ) {
    this.flyer = this.dragon(1);
    this.peeker = this.dragon(0.55).body;
    this.peeker.position.set(center.x + 0.6, keepTop - 0.4, center.z + 0.6);
    this.group.add(this.flyer.body, this.peeker);
    particles.addStream({ kind: "dragon", rate: 6, spread: 0.1, at: () => this.mouth });
    this.update(0, 0, false);
  }

  /**
   * Hace volar al dragón grande en círculos y asomarse al pequeño.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const angle = t * 0.25;
    const body = this.flyer.body;
    body.position.set(this.center.x + Math.cos(angle) * 6.5, 7.5 + Math.sin(t * 0.8) * 0.6, this.center.z + Math.sin(angle) * 6.5);
    body.rotation.set(0, -angle - Math.PI / 2, Math.sin(t * 0.8) * 0.1);
    const flap = moving ? Math.sin(t * 5) * 0.6 : 0.3;
    this.flyer.wings[0].rotation.x = flap;
    this.flyer.wings[1].rotation.x = -flap;
    body.updateMatrixWorld(true);
    this.mouth.set(0.95, 0.2, 0).applyMatrix4(body.matrixWorld);
    this.peeker.rotation.set(0, t * 0.3, Math.sin(t * 1.2) * 0.15);
  }

  private dragon(scale: number): { body: Group; wings: [Group, Group] } {
    const body = new Group();
    const skin = new MeshStandardMaterial({ color: DRAGON_COLOR, roughness: 0.6, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.3 });
    const belly = new MeshStandardMaterial({ color: 0xfff1c4, roughness: 0.6 });
    const torso = new Mesh(new CapsuleGeometry(0.28, 0.6, 6, 12), skin);
    torso.rotation.z = Math.PI / 2;
    const tummy = new Mesh(new SphereGeometry(0.24, 12, 10), belly);
    tummy.scale.set(1.5, 0.7, 0.9);
    tummy.position.y = -0.1;
    const head = new Mesh(new SphereGeometry(0.24, 14, 10), skin);
    head.position.set(0.7, 0.25, 0);
    const snout = new Mesh(new SphereGeometry(0.14, 12, 8), skin);
    snout.scale.set(1.3, 0.8, 1);
    snout.position.set(0.9, 0.2, 0);
    body.add(torso, tummy, head, snout);
    [-1, 1].forEach((side) => {
      const eye = new Mesh(new SphereGeometry(0.05, 8, 6), new MeshStandardMaterial({ color: 0x2a2233 }));
      eye.position.set(0.82, 0.33, side * 0.12);
      const horn = new Mesh(new ConeGeometry(0.04, 0.16, 6), belly);
      horn.position.set(0.65, 0.48, side * 0.1);
      body.add(eye, horn);
    });
    for (let spike = 0; spike < 4; spike += 1) {
      const plate = new Mesh(new ConeGeometry(0.06, 0.14, 4), new MeshStandardMaterial({ color: 0xff9fc8 }));
      plate.position.set(0.3 - spike * 0.22, 0.3, 0);
      body.add(plate);
    }
    const tail = new Mesh(new ConeGeometry(0.16, 0.8, 8), skin);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.85, 0, 0);
    body.add(tail);
    const outline = new Shape();
    outline.moveTo(0, 0);
    outline.quadraticCurveTo(0.3, 0.6, 0.1, 1.0);
    outline.lineTo(-0.2, 0.7);
    outline.lineTo(-0.35, 0.8);
    outline.quadraticCurveTo(-0.4, 0.3, 0, 0);
    const wingGeometry = new ShapeGeometry(outline, 6).rotateX(-Math.PI / 2);
    const wingMaterial = new MeshStandardMaterial({ color: 0xb98cf0, side: DoubleSide, roughness: 0.6 });
    const wings = [-1, 1].map((side) => {
      const pivot = new Group();
      const wing = new Mesh(wingGeometry, wingMaterial);
      wing.scale.set(1, 1, side);
      pivot.add(wing);
      pivot.position.set(0.05, 0.2, side * 0.2);
      body.add(pivot);
      return pivot;
    }) as [Group, Group];
    body.scale.setScalar(scale);
    body.traverse((part) => {
      part.castShadow = true;
    });
    return { body, wings };
  }
}
