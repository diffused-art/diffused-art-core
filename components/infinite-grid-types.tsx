import { nanoid } from 'nanoid';
import produce, { immerable } from 'immer';

export interface VectorParams {
  x: number;
  y: number;
}

export class Vector {
  [immerable] = true;
  x: number;
  y: number;

  constructor(params: VectorParams) {
    this.x = params.x;
    this.y = params.y;
  }

  distanceTo(other: Vector) {
    return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);
  }

  clone() {
    return new Vector({ x: this.x, y: this.y });
  }
}

export interface ItemParams {
  width: number;
  height: number;
  center: Vector;
}

export class Item {
  [immerable] = true;
  id: string;
  center: Vector;
  width: number;
  height: number;

  constructor(params: ItemParams) {
    this.id = nanoid();
    this.center = params.center;
    this.width = params.width;
    this.height = params.height;
  }

  getQuadrant(point: Vector) {
    const vertical = point.y > this.center.y ? 'bottom' : 'top';
    const horizontal = point.x > this.center.x ? 'right' : 'left';
    return `${vertical}-${horizontal}`;
  }
}

export interface GridParams {
  width: number;
  height: number;
}

export class Grid {
  [immerable] = true;

  id: string;
  cameraPosition: Vector;
  items: Item[];
  width: number;
  height: number;

  constructor({ width, height }: GridParams) {
    this.id = nanoid();
    this.width = width;
    this.height = height;
    this.cameraPosition = new Vector({ x: 0, y: 0 });
    this.items = [
      new Item({
        width,
        height,
        center: new Vector({ x: 0, y: 0 }),
      }),
      new Item({
        width,
        height,
        center: new Vector({ x: width, y: 0 }),
      }),
      new Item({
        width,
        height,
        center: new Vector({ x: 0, y: height }),
      }),
      new Item({
        width,
        height,
        center: new Vector({ x: width, y: height }),
      }),
    ];
  }

  setCameraPosition(position: Vector) {
    return produce(this, grid => {
      grid.cameraPosition = position;
      const closestItem = grid.getClosestItem();
      const quadrant = closestItem.getQuadrant(grid.cameraPosition);
      const anchor = closestItem.center.clone();
      if (quadrant === 'top-right') {
        grid.items[0].center.x = anchor.x;
        grid.items[0].center.y = anchor.y;
        grid.items[1].center.x = anchor.x;
        grid.items[1].center.y = anchor.y - grid.height;
        grid.items[2].center.x = anchor.x + grid.width;
        grid.items[2].center.y = anchor.y - grid.height;
        grid.items[3].center.x = anchor.x + grid.width;
        grid.items[3].center.y = anchor.y;
      }
      if (quadrant === 'top-left') {
        grid.items[0].center.x = anchor.x;
        grid.items[0].center.y = anchor.y;
        grid.items[1].center.x = anchor.x;
        grid.items[1].center.y = anchor.y - grid.height;
        grid.items[2].center.x = anchor.x - grid.width;
        grid.items[2].center.y = anchor.y - grid.height;
        grid.items[3].center.x = anchor.x - grid.width;
        grid.items[3].center.y = anchor.y;
      }
      if (quadrant === 'bottom-left') {
        grid.items[0].center.x = anchor.x;
        grid.items[0].center.y = anchor.y;
        grid.items[1].center.x = anchor.x;
        grid.items[1].center.y = anchor.y + grid.height;
        grid.items[2].center.x = anchor.x - grid.width;
        grid.items[2].center.y = anchor.y + grid.height;
        grid.items[3].center.x = anchor.x - grid.width;
        grid.items[3].center.y = anchor.y;
      }
      if (quadrant === 'bottom-right') {
        grid.items[0].center.x = anchor.x;
        grid.items[0].center.y = anchor.y;
        grid.items[1].center.x = anchor.x;
        grid.items[1].center.y = anchor.y + grid.height;
        grid.items[2].center.x = anchor.x + grid.width;
        grid.items[2].center.y = anchor.y + grid.height;
        grid.items[3].center.x = anchor.x + grid.width;
        grid.items[3].center.y = anchor.y;
      }
    });
  }

  getClosestItem() {
    let minDistance = Infinity;
    let closestItem: Item | null = null;
    this.items.forEach(item => {
      const distance = item.center.distanceTo(this.cameraPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    });
    return closestItem!;
  }
}
