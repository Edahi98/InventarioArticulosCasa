import { CylinderGeometry, ExtrudeGeometry, Group, Mesh, Shape } from "three";
import type { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import type { ClayMaterials } from "../park/ClayMaterials.js";
import type { Interactive } from "../park/ParkInteraction.js";

export class CloudBoat {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly captain: GuardianBear;
  private readonly sails: Mesh[] = [];
  private hitAt = -10;

  /**
   * Barquito de vela que navega sobre el mar de nubes, con un osito capitán en la proa. Se mece con las olas
   * de nube, las velas se hinchan, y al tocarlo se inclina y el capitán saluda.
   *
   * @param bears - Constructor de ositos compartido.
   * @param clay - Materiales compartidos.
   */
  constructor(bears: BearBuilder, clay: ClayMaterials) {
    const hullShape = new Shape();
    hullShape.moveTo(-1.8, 0.5);
    hullShape.lineTo(1.9, 0.5);
    hullShape.lineTo(1.2, -0.35);
    hullShape.lineTo(-1.2, -0.35);
    hullShape.closePath();
    const hull = new Mesh(new ExtrudeGeometry(hullShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }), clay.get(0xff8fb7));
    hull.position.z = -0.4;
    const stripe = new Mesh(new ExtrudeGeometry(hullShape, { depth: 0.84, bevelEnabled: false }), clay.get(0xfff6dc));
    stripe.scale.set(1.01, 0.18, 1);
    stripe.position.set(0, 0.2, -0.42);
    const mast = new Mesh(new CylinderGeometry(0.06, 0.06, 3.2, 8), clay.get(0xc4805a));
    mast.position.y = 2;
    this.group.add(hull, stripe, mast);
    [
      { color: 0xfff6dc, base: 0.7, height: 2.5, width: 1.5 },
      { color: 0x7fd0ea, base: 0.7, height: 1.7, width: -1.1 },
    ].forEach((def) => {
      const sail = new Shape();
      sail.moveTo(0, 0);
      sail.lineTo(def.width, 0);
      sail.lineTo(0, def.height);
      sail.closePath();
      const mesh = new Mesh(new ExtrudeGeometry(sail, { depth: 0.04, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 2 }), clay.get(def.color));
      mesh.position.set(0.08, def.base + 0.6, 0);
      this.sails.push(mesh);
      this.group.add(mesh);
    });
    this.captain = new GuardianBear(bears, 2, 0.34, false);
    this.captain.group.position.set(1.15, 0.62, 0);
    this.group.add(this.captain.group);
    this.group.userData.interactiveId = "barco";
    this.interactives = [
      {
        id: "barco",
        object: this.group,
        hit: (now) => {
          this.hitAt = now;
          this.captain.poke(now);
        },
      },
    ];
  }

  /**
   * Mece el barco sobre las nubes, hincha las velas y anima al capitán.
   *
   * @param elapsed - Segundos transcurridos.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const tilt = Math.max(0, 1 - (elapsed - this.hitAt) / 1.2);
    const base = this.group.userData.baseY as number;
    const home = this.group.userData.baseX as number;
    this.group.position.set(home + Math.sin(t * 0.18) * 2.6, base + Math.sin(t * 0.9) * 0.22, this.group.position.z);
    this.group.rotation.z = Math.sin(t * 0.9 + 1) * 0.05 + Math.sin(tilt * Math.PI * 4) * tilt * 0.22;
    this.group.rotation.y = -0.35 + Math.cos(t * 0.18) * 0.12;
    this.sails.forEach((sail, index) => {
      sail.scale.z = 1 + Math.sin(t * 1.4 + index) * 0.6;
    });
    this.captain.update(elapsed, 0, moving);
  }

  /**
   * Coloca el barco y recuerda su punto de reposo.
   *
   * @param x - Posición horizontal central.
   * @param y - Altura de reposo.
   * @param z - Profundidad.
   * @param scale - Tamaño.
   */
  place(x: number, y: number, z: number, scale: number): void {
    this.group.position.set(x, y, z);
    this.group.userData.baseX = x;
    this.group.userData.baseY = y;
    this.group.scale.setScalar(scale);
  }
}
