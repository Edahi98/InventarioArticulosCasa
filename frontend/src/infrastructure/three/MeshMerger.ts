import { InstancedMesh, Matrix4, Mesh, type BufferGeometry, type Material, type Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const ATTRIBUTES = ["position", "normal", "uv"] as const;

export class MeshMerger {
  /**
   * Junta en una sola malla por material todas las piezas fijas de un objeto (un barco, un edificio, una loma), para
   * dibujarlo con muchas menos llamadas. Las piezas que se animan o se esconden aparte se dejan intactas, igual que
   * las mallas instanciadas y las de varios materiales. Los materiales se conservan, así que sus luces siguen
   * respondiendo a la noche.
   *
   * @param root - Objeto cuyas piezas se juntan; sus hijos fijos se quitan y queda una malla por material.
   * @param keep - Piezas (con todo lo que cuelga de ellas) que no se tocan porque se mueven solas.
   * @returns El mismo objeto, para encadenar.
   */
  static merge<T extends Object3D>(root: T, keep: Object3D[] = []): T {
    root.updateMatrixWorld(true);
    const inverse = new Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map<Material, { meshes: Mesh[]; shadow: boolean }>();
    root.traverse((object) => {
      if (!(object instanceof Mesh) || object instanceof InstancedMesh || Array.isArray(object.material)) return;
      if (object.children.length > 0 || object.userData.solid || MeshMerger.kept(object, root, keep)) return;
      const geometry = object.geometry as BufferGeometry;
      if (ATTRIBUTES.some((name) => !geometry.getAttribute(name))) return;
      const entry = groups.get(object.material as Material) ?? { meshes: [], shadow: false };
      entry.meshes.push(object);
      entry.shadow = entry.shadow || object.castShadow;
      groups.set(object.material as Material, entry);
    });
    groups.forEach(({ meshes, shadow }, material) => {
      if (meshes.length < 2) return;
      const parts = meshes.map((mesh) => {
        const source = mesh.geometry as BufferGeometry;
        const copy = source.index ? source.toNonIndexed() : source.clone();
        Object.keys(copy.attributes)
          .filter((name) => !(ATTRIBUTES as readonly string[]).includes(name))
          .forEach((name) => copy.deleteAttribute(name));
        copy.morphAttributes = {};
        return copy.applyMatrix4(new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
      });
      const merged = mergeGeometries(parts);
      parts.forEach((part) => part.dispose());
      if (!merged) return;
      meshes.forEach((mesh) => mesh.parent?.remove(mesh));
      const combined = new Mesh(merged, material);
      combined.castShadow = shadow;
      combined.receiveShadow = true;
      root.add(combined);
    });
    return root;
  }

  private static kept(object: Object3D, root: Object3D, keep: Object3D[]): boolean {
    let node: Object3D | null = object;
    while (node && node !== root) {
      if (keep.includes(node)) return true;
      node = node.parent;
    }
    return false;
  }
}
