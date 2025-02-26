import { renderHook, act } from "@testing-library/react-hooks";
import {
  World,
  Type,
  createWorld,
  defineComponent,
  Component,
  createEntity,
  withValue,
  Has,
  setComponent,
  HasValue,
  removeComponent,
} from "@latticexyz/recs";
import { useEntityQuery } from "./useEntityQuery";

describe("useEntityQuery", () => {
  let world: World;
  let Position: Component<{
    x: Type.Number;
    y: Type.Number;
  }>;
  let OwnedBy: Component<{ value: Type.Entity }>;

  beforeEach(() => {
    world = createWorld();
    Position = defineComponent(world, { x: Type.Number, y: Type.Number }, { id: "Position" });
    OwnedBy = defineComponent(world, { value: Type.Entity }, { id: "OwnedBy" });
  });

  it("should find entities with Position component", () => {
    const entity1 = createEntity(world, [withValue(Position, { x: 1, y: 1 })]);
    const entity2 = createEntity(world, [withValue(Position, { x: 2, y: 2 })]);
    const entity3 = createEntity(world, []);

    const { result } = renderHook(() => useEntityQuery([Has(Position)]));

    expect(result.current.length).toBe(2);
    expect(result.current).toContain(entity1);
    expect(result.current).toContain(entity2);
    expect(result.current).not.toContain(entity3);

    act(() => {
      setComponent(Position, entity3, { x: 0, y: 0 });
    });

    expect(result.current.length).toBe(3);
    expect(result.current).toContain(entity1);
    expect(result.current).toContain(entity2);
    expect(result.current).toContain(entity3);

    act(() => {
      removeComponent(Position, entity1);
      removeComponent(Position, entity3);
    });

    expect(result.current.length).toBe(1);
    expect(result.current).not.toContain(entity1);
    expect(result.current).toContain(entity2);
    expect(result.current).not.toContain(entity3);

    act(() => {
      removeComponent(Position, entity2);
    });

    expect(result.current.length).toBe(0);
  });

  it("should re-render only when Position changes", () => {
    const entity1 = createEntity(world, [withValue(Position, { x: 1, y: 1 })]);
    const entity2 = createEntity(world, [withValue(Position, { x: 2, y: 2 })]);
    const entity3 = createEntity(world, []);

    const { result } = renderHook(() => useEntityQuery([Has(Position)]));

    expect(result.all).toHaveLength(2);
    expect(result.current).toHaveLength(2);
    expect(result.current).toContain(entity1);
    expect(result.current).toContain(entity2);
    expect(result.current).not.toContain(entity3);

    // Changing the an entity's component value should NOT re-render
    act(() => {
      setComponent(Position, entity2, { x: 0, y: 0 });
    });

    expect(result.all).toHaveLength(2);

    // Changing a different component value should NOT re-render
    act(() => {
      setComponent(OwnedBy, entity2, { value: world.entities[entity1] });
      setComponent(OwnedBy, entity3, { value: world.entities[entity1] });
    });

    expect(result.all).toHaveLength(2);

    // Changing which entities have the component should re-render
    act(() => {
      setComponent(Position, entity3, { x: 0, y: 0 });
    });

    expect(result.all).toHaveLength(3);
    expect(result.current).toHaveLength(3);
    expect(result.current).toContain(entity1);
    expect(result.current).toContain(entity2);
    expect(result.current).toContain(entity3);

    // Changing which entities have the component should re-render
    act(() => {
      removeComponent(Position, entity1);
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toHaveLength(2);
    expect(result.current).toContain(entity2);
    expect(result.current).toContain(entity3);
  });

  it("should re-render as hook arguments change", () => {
    // TODO: reduce re-renders during argument changes?

    const entity1 = createEntity(world, [withValue(Position, { x: 1, y: 1 })]);
    const entity2 = createEntity(world, [withValue(Position, { x: 2, y: 2 })]);
    const entity3 = createEntity(world, [withValue(Position, { x: 2, y: 2 })]);

    const { result, rerender } = renderHook(({ x, y }) => useEntityQuery([HasValue(Position, { x, y })]), {
      initialProps: { x: 1, y: 1 },
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toHaveLength(1);
    expect(result.current).toContain(entity1);

    rerender({ x: 1, y: 1 });
    expect(result.all).toHaveLength(3);
    expect(result.current).toHaveLength(1);
    expect(result.current).toContain(entity1);

    rerender({ x: 2, y: 2 });
    expect(result.all).toHaveLength(6);
    expect(result.current).toHaveLength(2);
    expect(result.current).toContain(entity2);
    expect(result.current).toContain(entity3);

    rerender({ x: -1, y: -1 });
    expect(result.all).toHaveLength(9);
    expect(result.current).toHaveLength(0);
  });
});
